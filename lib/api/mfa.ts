import { apiClient } from './client';

// Two-factor (TOTP) — see cofoundaz-api/app/api/v1/endpoints/auth/mfa.py.
// Only the authenticator-app (TOTP) path is implemented server-side; SMS
// endpoints exist but raise FeatureNotEnabled, so the UI offers TOTP only.

export interface TotpSetupResult {
  // Base32 secret for manual entry, and the otpauth:// URI to render as a QR.
  secret: string;
  otpauth_uri: string;
}

export interface TotpVerifyResult {
  enabled: boolean;
  // One-time backup codes, returned exactly once at enrollment.
  backup_codes: string[];
}

export interface MfaChallengeResult {
  access_token: string;
  refresh_token: string;
}

function unwrap<T>(res: { data?: T } | T): T {
  return (res as { data?: T })?.data ?? (res as T);
}

// POST /auth/mfa/totp/setup — stores a PENDING secret (not enabled until verify).
// 409 MFA_ALREADY_ENABLED if TOTP is already on.
export async function totpSetup(): Promise<TotpSetupResult> {
  const res = await apiClient<{ data?: TotpSetupResult } | TotpSetupResult>('/auth/mfa/totp/setup', {
    method: 'POST',
  });
  return unwrap(res);
}

// POST /auth/mfa/totp/verify {code} — enables TOTP and returns backup codes once.
export async function totpVerify(code: string): Promise<TotpVerifyResult> {
  const res = await apiClient<{ data?: TotpVerifyResult } | TotpVerifyResult>('/auth/mfa/totp/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return unwrap(res);
}

// POST /auth/mfa/challenge {mfa_ticket, code} — login-time second factor. `code`
// is a TOTP code OR a backup code (the server accepts either). Public (no auth).
export async function mfaChallenge(mfaTicket: string, code: string): Promise<MfaChallengeResult> {
  const res = await apiClient<{ data?: MfaChallengeResult } | MfaChallengeResult>('/auth/mfa/challenge', {
    method: 'POST',
    body: JSON.stringify({ mfa_ticket: mfaTicket, code }),
  });
  return unwrap(res);
}
