import { ApiError } from './client';

export interface ApiErrorInfo {
  status: number | null;
  code: string | null;
  message: string;
  fieldErrors: Array<{ field: string; message: string }>;
}

/**
 * Normalises the API error envelope (`{error: {code, message, field_errors: [{field, message}]}}`).
 * `message` is the server's own copy when present, else `fallback`.
 */
export function apiErrorInfo(err: unknown, fallback: string): ApiErrorInfo {
  if (err instanceof ApiError) {
    const body = err.data as
      | { error?: { code?: string; message?: string; field_errors?: unknown } }
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
    };
  }
  return { status: null, code: null, message: (err as { message?: string })?.message || fallback, fieldErrors: [] };
}
