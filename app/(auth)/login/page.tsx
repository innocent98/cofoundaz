"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/ui/marketing/auth/auth-form";
import { apiClient, ApiError } from "@/lib/api/client";

// A `?next=` param (set by the global 401 redirect on session expiry) is honored
// only when it's a safe internal path — never an external or auth URL.
function safeNextPath(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") && !next.startsWith("/signup")) {
    return next;
  }
  return null;
}

interface LoginData {
  access_token?: string;
  refresh_token?: string;
  mfa_required?: boolean;
}

interface LoginEnvelope {
  data?: LoginData;
  access_token?: string;
  refresh_token?: string;
  token?: string;
}

interface UserMeResponse {
  data?: {
    user?: {
      id: string;
      email: string;
      status: string;
    };
    profile?: {
      full_name?: string | null;
      role_title?: string | null;
      avatar_url?: string | null;
    };
    active_workspace_id?: string | null;
  };
}

// GET /onboarding/state returns the standard {data, meta} envelope, e.g.
// {"data":{"step":1,"completed":false,"assessment_pending":true,…}}.
interface OnboardingStateResponse {
  data?: {
    step?: number;
    completed?: boolean;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Surface a friendly notice when we were bounced here by an expired session.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("session") === "expired") {
      queueMicrotask(() => setError("Your session expired. Please sign in again."));
    }
  }, []);

  async function handleLogin(data: { email: string; password: string }) {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiClient<LoginEnvelope>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const accessToken =
        res.data?.access_token ||
        res.access_token ||
        res.token;

      const refreshToken =
        res.data?.refresh_token ||
        res.refresh_token;

      if (!accessToken) {
        throw new Error("No access token returned from server.");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("cf_token", accessToken);
        if (refreshToken) {
          localStorage.setItem("cf_refresh_token", refreshToken);
        }
      }

      // Check current user status and profile
      let meRes: UserMeResponse | null = null;
      try {
        meRes = await apiClient<UserMeResponse>("/auth/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (meRes?.data?.profile?.full_name) {
          localStorage.setItem("cf_user_name", meRes.data.profile.full_name);
        }
        if (meRes?.data?.user) {
          localStorage.setItem("cf_user", JSON.stringify(meRes.data.user));
        }
        // Workspace-scoped API calls need this via X-Workspace-Id (see apiClient).
        if (meRes?.data?.active_workspace_id) {
          localStorage.setItem("cf_workspace_id", meRes.data.active_workspace_id);
        }
      } catch (meErr) {
        console.warn("Could not fetch user profile details on login:", meErr);
      }

      // Handle unverified user status
      if (meRes?.data?.user?.status === "pending_verification") {
        router.push(`/verify?email=${encodeURIComponent(data.email)}`);
        return;
      }

      // Check onboarding state for verified accounts
      try {
        const state = await apiClient<OnboardingStateResponse>("/onboarding/state", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const onb = state.data;
        if (onb?.completed || (typeof onb?.step === "number" && onb.step > 6)) {
          router.push(safeNextPath() || "/dashboard");
        } else {
          router.push("/onboarding");
        }
      } catch (onberr: unknown) {
        if (((onberr as { status?: number })?.status) === 403) {
          router.push(`/verify?email=${encodeURIComponent(data.email)}`);
        } else {
          router.push(safeNextPath() || "/dashboard");
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const d = err.data as Record<string, unknown> | undefined;
        const serverMessage =
          ((d?.error as { message?: string } | undefined)?.message) ||
          (typeof d?.detail === "string" ? d.detail : null) ||
          (Array.isArray(d?.detail) && d.detail[0]?.msg ? String(d.detail[0].msg) : null);

        if (err.status === 401) {
          setError(serverMessage || "Invalid email or password. Please check your credentials and try again.");
        } else if (err.status === 403) {
          setError("Account pending verification. Please check your email inbox to verify your account.");
        } else if (err.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else {
          setError(serverMessage || "Unable to sign in. Please verify your credentials and try again.");
        }
      } else {
        setError(err instanceof Error ? err.message : "An unexpected network error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthForm
      mode="login"
      onSubmit={handleLogin}
      error={error}
      isSubmitting={isSubmitting}
    />
  );
}



