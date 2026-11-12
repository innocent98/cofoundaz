// Small client-side hand-offs between auth screens. None of these hold a credential:
// an email address (so it stays out of the URL) and an invite link token.

const EMAIL_KEY = 'cf_pending_email';
const INVITE_KEY = 'cf_invite_token';
const NOTICE_KEY = 'cf_login_notice';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** The address a verification mail went to (kept out of the URL, gap 12). */
export function rememberPendingEmail(email: string): void {
  safe(() => sessionStorage.setItem(EMAIL_KEY, email), undefined);
}
export function readPendingEmail(): string {
  return safe(() => sessionStorage.getItem(EMAIL_KEY) ?? '', '');
}

/**
 * The invite link a person arrived with. Kept in sessionStorage AND localStorage:
 * the verification link opens in a new tab, which does not share sessionStorage.
 */
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export function rememberInvite(token: string): void {
  safe(() => sessionStorage.setItem(INVITE_KEY, token), undefined);
  // localStorage copy carries a timestamp so a forgotten link is not honoured forever.
  safe(() => localStorage.setItem(INVITE_KEY, JSON.stringify({ token, savedAt: Date.now() })), undefined);
}

function readStoredInvite(): string | null {
  const session = safe(() => sessionStorage.getItem(INVITE_KEY), null);
  if (session) return session;
  const raw = safe(() => localStorage.getItem(INVITE_KEY), null);
  if (!raw) return null;
  try {
    const { token, savedAt } = JSON.parse(raw) as { token?: unknown; savedAt?: unknown };
    if (typeof token === 'string' && typeof savedAt === 'number' && Date.now() - savedAt < INVITE_TTL_MS) return token;
  } catch {
    /* an old raw-string value or junk: treat as expired */
  }
  safe(() => localStorage.removeItem(INVITE_KEY), undefined);
  return null;
}

export function readInvite(): string | null {
  const v = readStoredInvite();
  // Storage is user-writable: only a URL-safe token may flow into a link or an API path.
  return v && /^[A-Za-z0-9_-]{8,200}$/.test(v) ? v : null;
}
export function forgetInvite(): void {
  safe(() => sessionStorage.removeItem(INVITE_KEY), undefined);
  safe(() => localStorage.removeItem(INVITE_KEY), undefined);
}

/** A one-shot line for the login page ("Your sign-in timed out. Log in again."). */
export function setLoginNotice(message: string): void {
  safe(() => sessionStorage.setItem(NOTICE_KEY, message), undefined);
}
export function takeLoginNotice(): string | null {
  const v = safe(() => sessionStorage.getItem(NOTICE_KEY), null);
  if (v) safe(() => sessionStorage.removeItem(NOTICE_KEY), undefined);
  return v;
}
