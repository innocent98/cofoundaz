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
const MUTEX_KEY = 'cf_refresh_lock';
const MUTEX_TTL_MS = 10_000;
// A refresh that outlives the mutex TTL would let another tab in with the pre-rotation cookie, so it is cut off sooner.
const REFRESH_TIMEOUT_MS = MUTEX_TTL_MS - 2_000;
const MAX_STORAGE_FAILURES = 5;
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

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Cross-tab mutex for browsers without Web Locks (Safari/iOS < 15.4, Firefox < 96). A localStorage key holds
 * {owner, expiresAt}; the TTL means a tab that died mid-refresh cannot block the others for more than ~10 s.
 * After writing we wait a beat and read back: if another tab wrote at the same instant, only one still owns it.
 * Best effort by nature (storage has no compare-and-set), but together with the tiny window it removes the
 * simultaneous-reload race that makes the API see a replayed refresh cookie.
 */
export async function withStorageLock<T>(fn: () => Promise<T>, opts: { pollMs?: number; settleMs?: number } = {}): Promise<T> {
  const pollMs = opts.pollMs ?? 50;
  const settleMs = opts.settleMs ?? 20;
  const owner = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const read = (): { owner?: string; expiresAt?: number } =>
    safeStorage(() => JSON.parse(localStorage.getItem(MUTEX_KEY) ?? '{}') as { owner?: string; expiresAt?: number }, {});
  let failures = 0;
  for (;;) {
    const cur = read();
    if (!cur.owner || !cur.expiresAt || cur.expiresAt <= Date.now()) {
      let wrote = true;
      try {
        localStorage.setItem(MUTEX_KEY, JSON.stringify({ owner, expiresAt: Date.now() + MUTEX_TTL_MS }));
      } catch {
        wrote = false; // storage blocked or full: there is nothing to lock with
      }
      if (!wrote) return fn();
      await sleep(settleMs);
      const after = read();
      if (after.owner === owner) break;
      // Nobody owns it after we wrote: storage is not persisting (private mode, quota). Give up on locking
      // rather than spin forever; a different owner is ordinary contention, so we just keep waiting.
      if (!after.owner && ++failures >= MAX_STORAGE_FAILURES) return fn();
    } else {
      await sleep(pollMs);
    }
  }
  try {
    return await fn();
  } finally {
    if (read().owner === owner) safeStorage(() => localStorage.removeItem(MUTEX_KEY), undefined);
  }
}

/** One shared refresh per tab, serialised across tabs so a rotated cookie is never replayed (reuse revokes the sign-in). */
export function refreshSession(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!inFlight) {
    const run = async (): Promise<string | null> => {
      // Another tab may have signed out (or learned the cookie is dead) while we waited for the lock.
      if (!hasSessionHint()) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { ...AUTH_MODE_HEADER },
          signal: controller.signal,
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
        return null; // network error or the timeout abort: a failed refresh, the hint stays for the next try
      } finally {
        clearTimeout(timer);
      }
    };
    // The cookie is shared by every tab, so a tab that waited and finds the cookie already rotated by another
    // tab simply refreshes once more with the new one: that is a normal rotation, not a replay.
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    const p: Promise<string | null> = locks
      ? (locks.request(LOCK_NAME, run) as unknown as Promise<string | null>)
      : withStorageLock(run);
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
      // Only a tab that was signed in is sent to /login; public pages (e-sign, smoke pages, shared links,
      // sign-up, marketing) just drop their local state and stay put.
      const hadSession = accessToken !== null || hasSessionHint();
      clearSession();
      if (hadSession) handler();
    }
  };
  return () => ch.close();
}
