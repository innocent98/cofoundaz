"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/ui/marketing/auth/auth-form";
import { apiClient, ApiError } from "@/lib/api/client";
import { completePostLogin } from "@/lib/auth/post-login";
import { safeNextPath } from "@/lib/auth/safe-next";
import { apiErrorInfo } from "@/lib/api/api-error";
import { takeLoginNotice } from "@/lib/auth/pending";
import { useCountdown } from "@/lib/auth/useCountdown";
import { authCopy } from "@/content/auth";
import { startGoogleSignIn, googleStartErrorMessage } from "@/lib/api/google-signin";

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
  // 429 ACCOUNT_LOCKED / RATE_LIMITED: wait this many seconds (counted down on the button).
  const [lockFor, setLockFor] = useState<number | null>(null);
  const [lockNonce, setLockNonce] = useState(0); // a second 429 with the same wait must restart the countdown
  const lockSeconds = useCountdown(lockFor, lockNonce);

  // Surface a friendly notice when we were bounced here by an expired session or a timed-out 2FA ticket.
  useEffect(() => {
    const notice = takeLoginNotice();
    if (notice) {
      queueMicrotask(() => setError(notice));
    } else if (new URLSearchParams(window.location.search).get("session") === "expired") {
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
        const info = apiErrorInfo(err, "Unable to sign in. Please verify your credentials and try again.");
        if (err.status === 429) {
          // The API's message already has the minutes (PRD wording): show it as it comes.
          setLockFor(info.retryAfterSeconds);
          setLockNonce((n) => n + 1);
          setError(
            info.code === "ACCOUNT_LOCKED"
              ? info.message || authCopy.lockedFallback
              : info.message || authCopy.rateLimited
          );
        } else if (err.status === 403) {
          setError("Account pending verification. Please check your email inbox to verify your account.");
        } else if (err.status === 401) {
          setError(info.message || "That email and password don't match.");
        } else {
          setError(info.message);
        }
      } else {
        setError(err instanceof Error ? err.message : "An unexpected network error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await startGoogleSignIn(safeNextPath());
    } catch (err: unknown) {
      setError(googleStartErrorMessage(err));
    }
  }

  return (
    <AuthForm
      mode="login"
      onSubmit={handleLogin}
      onGoogle={handleGoogle}
      error={error}
      isSubmitting={isSubmitting}
      lockSeconds={lockSeconds}
    />
  );
}



