"use client";

import { useCallback, useState } from "react";
import { toFinanceError, type FinanceError } from "@/lib/api/finance";
import { useToast } from "../ToastContext";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: FinanceError };

/**
 * Runs one write against the Finance API. Tracks `busy` (so buttons can disable
 * while a money request is in flight: the API has no idempotency key), toasts the
 * success message, and toasts the API's own error text unless the caller handles
 * it inline (`quiet`, used by forms that show field errors).
 */
export function useFinanceAction() {
  const { triggerToast } = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      opts: { success?: string; quiet?: boolean; fallback?: string } = {},
    ): Promise<ActionResult<T>> => {
      setBusy(true);
      try {
        const data = await fn();
        if (opts.success) triggerToast(opts.success);
        return { ok: true, data };
      } catch (err) {
        const error = toFinanceError(err, opts.fallback);
        if (!opts.quiet) triggerToast(error.message, "error");
        return { ok: false, error };
      } finally {
        setBusy(false);
      }
    },
    [triggerToast],
  );

  return { run, busy };
}
