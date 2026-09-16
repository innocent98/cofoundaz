"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/ui/marketing/auth/auth-form";
import { apiClient, ApiError } from "@/lib/api/client";

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
    refresh_token?: string;
    mfa_required?: boolean;
  };
  access_token?: string;
  refresh_token?: string;
  token?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup(data: { email: string; password: string; agreedTerms?: boolean }) {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      // 1. Register account
      await apiClient<SignupEnvelope>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
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

        const refreshToken =
          loginRes.data?.refresh_token ||
          loginRes.refresh_token;

        if (accessToken && typeof window !== "undefined") {
          localStorage.setItem("cf_token", accessToken);
          if (refreshToken) {
            localStorage.setItem("cf_refresh_token", refreshToken);
          }
        }
      } catch (loginErr) {
        console.warn("Silent login post-signup failed; continuing to verification:", loginErr);
      }

      // 3. Direct unverified users to verify screen
      router.push(`/verify?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const d = err.data as any;
        const serverMessage =
          d?.error?.message ||
          (typeof d?.detail === "string" ? d.detail : null) ||
          (Array.isArray(d?.detail) && d.detail[0]?.msg ? String(d.detail[0].msg) : null);

        if (err.status === 409 || err.status === 400) {
          setError(serverMessage || "An account with this email already exists. Please log in.");
        } else if (err.status === 422) {
          setError(serverMessage || "Password does not meet the security criteria.");
        } else {
          setError(serverMessage || "Signup failed. Please try again.");
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
      mode="signup"
      onSubmit={handleSignup}
      error={error}
      successMessage={successMessage}
      isSubmitting={isSubmitting}
    />
  );
}
