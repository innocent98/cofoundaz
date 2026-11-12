// THE token seam (D-AUTH-6). The access token lives in this module's memory only; the refresh
// token lives in the API's HttpOnly `cfz_refresh` cookie and is never readable by script. Nothing
// else in the app reads or writes a token: callers use getAccessToken / setSession / clearSession /
// ensureSession from here. Contract: cofoundaz-api docs/fe-integration-guide-auth-onboarding.md §1.
//
// localStorage keeps one NON-secret hint, `cf_session` = "1", meaning "this browser probably has a
// signed-in cookie". It only decides whether a page load should try a silent refresh; it grants nothing.

const HINT_KEY = 'cf_session';
const CHANNEL = 'cf-auth';
const LOCK_NAME = 'cf-refresh';
// Same value as lib/api/client.ts API_BASE (duplicated so this module has no import cycle with it).
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

/** Sent on login, MFA challenge, Google exchange, refresh and logout so the API uses the cookie (and checks CSRF). */
export const AUTH_MODE_HEADER = { 'X-Auth-Mode': 'cookie' } as const;

let accessToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<string | null> | null = null;

function safeStorage<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** True when this tab holds an access token. Use ensureSession() when a page load needs to wait for the cookie. */
export function isLoggedIn(): boolean {
  return accessToken !== null;
}

// Before D-AUTH-6 the tokens sat in localStorage under these keys. Nothing reads them now; delete any left
// behind in a browser that signed in earlier, so the old long-lived credential does not linger there.
function purgeLegacyTokens(): void {
  safeStorage(() => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_refresh_token');
  }, undefined);
}

export function hasSessionHint(): boolean {
  if (typeof window !== 'undefined') purgeLegacyTokens();
  return typeof window !== 'undefined' && safeStorage(() => localStorage.getItem(HINT_KEY) === '1', false);
}

/** Store a freshly issued access token (login, MFA, Google, refresh) and schedule the next silent refresh. */
export function setSession(session: { access_token: string; expires_in?: number | null }): void {
  accessToken = session.access_token;
  safeStorage(() => localStorage.setItem(HINT_KEY, '1'), undefined);
  if (refreshTimer) clearTimeout(refreshTimer);
  // Refresh a minute before expiry (the API's tokens last 900 s); never tighter than every 30 s.
  const lifetime = typeof session.expires_in === 'number' && session.expires_in > 0 ? session.expires_in : 900;
  refreshTimer = setTimeout(() => void refreshSession(), Math.max(30, lifetime - 60) * 1000);
}

function channel(): BroadcastChannel | null {
  return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL);
}

/** Forget the session in this tab. `broadcast` also signs out the user's other tabs. */
export function clearSession(opts: { broadcast?: boolean } = {}): void {
  accessToken = null;
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  safeStorage(() => localStorage.removeItem(HINT_KEY), undefined);
  if (opts.broadcast) {
    const ch = channel();
    ch?.postMessage('logout');
    ch?.close();
  }
}

/** One shared refresh per tab, serialised across tabs so a rotated cookie is never replayed (reuse revokes the sign-in). */
export function refreshSession(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!inFlight) {
    const run = async (): Promise<string | null> => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { ...AUTH_MODE_HEADER },
        });
        if (res.status === 401 || res.status === 403) {
          clearSession();
          return null;
        }
        if (!res.ok) return null; // transient: keep the hint, the next call tries again
        const json = (await res.json()) as {
          data?: { access_token?: string; expires_in?: number };
          access_token?: string;
          expires_in?: number;
        };
        const p = json.data ?? json;
        if (!p.access_token) return null;
        setSession({ access_token: p.access_token, expires_in: p.expires_in });
        return p.access_token;
      } catch {
        return null;
      }
    };
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    const p: Promise<string | null> = locks ? (locks.request(LOCK_NAME, run) as unknown as Promise<string | null>) : run();
    inFlight = p.finally(() => {
      inFlight = null;
    });
  }
  return inFlight ?? Promise.resolve(null);
}

/**
 * Resolves true when this tab has (or can get) an access token: from memory, else by a silent
 * refresh with the cookie when the hint says there may be one. Page-load code awaits this before
 * deciding "signed out".
 */
export async function ensureSession(): Promise<boolean> {
  if (accessToken) return true;
  if (!hasSessionHint()) return false;
  return (await refreshSession()) !== null;
}

/** For raw fetch() callers (file downloads) that cannot go through apiClient. */
export async function accessTokenForRequest(): Promise<string | null> {
  await ensureSession();
  return accessToken;
}

/** Another tab signed out: drop ours too and go to /login. Installed once, from the app shell. */
export function onRemoteLogout(handler: () => void): () => void {
  const ch = channel();
  if (!ch) return () => undefined;
  ch.onmessage = (e) => {
    if (e.data === 'logout') {
      clearSession();
      handler();
    }
  };
  return () => ch.close();
}
