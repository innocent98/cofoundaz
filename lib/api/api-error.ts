import { ApiError } from './client';

export interface ApiErrorInfo {
  status: number | null;
  code: string | null;
  message: string;
  fieldErrors: Array<{ field: string; message: string }>;
  /** Seconds to wait (429 ACCOUNT_LOCKED / RATE_LIMITED), when the API says. */
  retryAfterSeconds: number | null;
  /** Wrong-code tries left on an MFA ticket (MFA_INVALID_CODE). */
  attemptsRemaining: number | null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/**
 * Normalises the API error envelope (`{error: {code, message, field_errors: [{field, message}]}}`).
 * `message` is the server's own copy when present, else `fallback`.
 */
export function apiErrorInfo(err: unknown, fallback: string): ApiErrorInfo {
  if (err instanceof ApiError) {
    const body = err.data as
      | {
          error?: {
            code?: string;
            message?: string;
            field_errors?: unknown;
            retry_after_seconds?: unknown;
            attempts_remaining?: unknown;
          };
        }
      | undefined;
    const e = body?.error;
    const raw = Array.isArray(e?.field_errors) ? (e!.field_errors as unknown[]) : [];
    const fieldErrors = raw
      .filter((f): f is { field: string; message: string } => !!f && typeof f === 'object' && 'message' in f)
      .map((f) => ({ field: String(f.field ?? ''), message: String(f.message) }));
    return {
      status: err.status,
      code: e?.code ?? null,
      message: e?.message || fallback,
      fieldErrors,
      retryAfterSeconds: num(e?.retry_after_seconds),
      attemptsRemaining: num(e?.attempts_remaining),
    };
  }
  return { status: null, code: null, message: (err as { message?: string })?.message || fallback, fieldErrors: [], retryAfterSeconds: null, attemptsRemaining: null };
}
