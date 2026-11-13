"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Lock } from "lucide-react";
import type { ReadinessError } from "@/lib/api/readiness";

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-4 animate-pulse py-6">
      <div className="h-8 w-1/3 rounded-card bg-neutral-200/70" />
      <div className="h-40 rounded-modal bg-neutral-200/60" />
      <div className="h-40 rounded-modal bg-neutral-200/50" />
    </div>
  );
}

/** A failed load is never an empty state: say what failed and let the user retry. */
export function LoadFailed({ error, onRetry, what }: { error: ReadinessError; onRetry: () => void; what: string }) {
  if (error.forbidden) return <NoAccess />;
  return (
    <div role="alert" className="mx-auto max-w-md rounded-modal border border-danger-200 bg-danger-50/60 p-6 text-center space-y-3">
      <AlertCircle className="mx-auto h-6 w-6 text-danger-600" />
      <p className="text-sm font-semibold text-neutral-900">We could not load {what}.</p>
      <p className="text-xs text-neutral-600">{error.message}</p>
      <button
        onClick={onRetry}
        className="rounded-card bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
      >
        Try again
      </button>
    </div>
  );
}

export function NoAccess() {
  return (
    <div role="alert" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <Lock className="h-6 w-6 text-neutral-400" />
      <h2 className="text-xl font-display font-semibold text-neutral-900">You don&apos;t have access to this page.</h2>
      <p className="text-sm text-neutral-500">Your role in this workspace doesn&apos;t include Investor Readiness.</p>
      <Link href="/dashboard" className="rounded-card bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700">
        Back to dashboard
      </Link>
    </div>
  );
}

export function ReadOnlyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-card border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600">{children}</p>
  );
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}
