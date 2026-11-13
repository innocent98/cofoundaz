"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/ui/marketing/auth/auth-form";
import { apiClient, ApiError } from "@/lib/api/client";
import { setSession } from "@/lib/auth/session";
import { safeNextPath } from "@/lib/auth/safe-next";
import { apiErrorInfo } from "@/lib/api/api-error";
import { rememberInvite, rememberPendingEmail } from "@/lib/auth/pending";
import { startGoogleSignIn, googleStartErrorMessage } from "@/lib/api/google-signin";

interface SignupEnvelope {
  data?: {
    user?: {
      id: string;
      email: string;
    };
    verification_sent?: boolean;
  };
}

interface LoginEnvelope {
  data?: {
    access_token?: string;
    expires_in?: number;
    mfa_required?: boolean;
  };
  access_token?: string;
  token?: string;
}

/** An invite link carries the invited address; use it only when it looks like one address. */
function invitedEmail(raw: string | null): string {
  const v = (raw ?? "").trim();
  return /^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(v) ? v : "";
}

/** `next=/invite/<token>` is how an invite link reaches sign-up. */
function inviteTokenFromNext(next: string | null): string | null {
  const m = /^\/invite\/([^/?#]+)/.exec(next ?? "");
  if (!m) return null;
  let token: string;
  try {
    token = decodeURIComponent(m[1]);
  } catch {
    return null;
  }
  // Invite tokens are URL-safe; anything else (e.g. "../") must never reach an API path.
  return /^[A-Za-z0-9_-]{8,200}$/.test(token) ? token : null;
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const prefill = invitedEmail(params.get("email"));
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; terms?: string }>({});
  const [emailTaken, setEmailTaken] = useState(false);
  const [inviteStartup, setInviteStartup] = useState<string | null>(null);

  // An invited sign-up says "Join {startup}" instead of "Create your workspace".
  useEffect(() => {
    const token = inviteTokenFromNext(params.get("next"));
    if (!token) return;
    rememberInvite(token);
    apiClient<{ data?: { startup_name?: string | null } }>(`/invitations/${encodeURIComponent(token)}`)
      .then((r) => setInviteStartup(r?.data?.startup_name ?? null))
      .catch(() => undefined);
  }, [params]);

  async function handleSignup(data: { email: string; password: string; agreedTerms?: boolean }) {
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setEmailTaken(false);
    setIsSubmitting(true);

    try {
      // 1. Register account
      await apiClient<SignupEnvelope>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          accepted_terms: data.agreedTerms === true,
        }),
      });

      setSuccessMessage("Account created! Setting up your session...");

      // 2. Obtain session tokens
      try {
        const loginRes = await apiClient<LoginEnvelope>("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });

        const accessToken =
          loginRes.data?.access_token ||
          loginRes.access_token ||
          loginRes.token;

        if (accessToken) setSession({ access_token: accessToken, expires_in: loginRes.data?.expires_in });
      } catch (loginErr) {
        console.warn("Silent login post-signup failed; continuing to verification:", loginErr);
      }

      // 3. Direct unverified users to verify screen
      rememberPendingEmail(data.email);
      router.push("/verify-email");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const info = apiErrorInfo(err, "Signup failed. Please try again.");
        const byField = (name: string) => info.fieldErrors.find((f) => f.field === name)?.message;
        if (info.code === "EMAIL_TAKEN" || err.status === 409) {
          setEmailTaken(true);
        } else if (info.code === "TERMS_NOT_ACCEPTED") {
          setFieldErrors({ terms: byField("accepted_terms") || info.message });
        } else if (err.status === 422) {
          const pw = byField("password") || (info.code === "WEAK_PASSWORD" ? info.message : undefined);
          const em = byField("email");
          if (pw || em) setFieldErrors({ password: pw, email: em });
          else setError(info.message);
        } else if (err.status === 429) {
          setError(info.message);
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
      mode="signup"
      onSubmit={handleSignup}
      onGoogle={handleGoogle}
      error={error}
      successMessage={successMessage}
      isSubmitting={isSubmitting}
      initialEmail={prefill}
      fieldErrors={fieldErrors}
      emailTaken={emailTaken}
      inviteStartup={inviteStartup}
    />
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}


