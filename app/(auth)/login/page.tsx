"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/ui/marketing/auth/auth-form";
import { apiClient, ApiError } from "@/lib/api/client";
import { completePostLogin } from "@/lib/auth/post-login";

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
  mfa_ticket?: string;
}

interface LoginEnvelope {
  data?: LoginData;
  access_token?: string;
  refresh_token?: string;
  token?: string;
}

// Handed to the MFA challenge page in sessionStorage (never the URL — the ticket
// is a short-lived, single-use secret).
const MFA_HANDOFF_KEY = "cf_mfa_handoff";

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

      // Second factor required → the server withholds tokens and returns a
      // short-lived mfa_ticket. Hand it to the challenge page (via sessionStorage,
      // not the URL) and stop here — no token is stored yet.
      if (res.data?.mfa_required && res.data?.mfa_ticket) {
        try {
          sessionStorage.setItem(
            MFA_HANDOFF_KEY,
            JSON.stringify({ ticket: res.data.mfa_ticket, email: data.email, next: safeNextPath() })
          );
        } catch {
          /* ignore storage errors — the challenge page falls back to /login */
        }
        router.push("/login/mfa");
        return;
      }

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

      await completePostLogin({
        accessToken,
        refreshToken,
        email: data.email,
        router,
        nextPath: safeNextPath(),
      });
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



