export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
  }
}

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

/** With a relative API base (the dev proxy) an absolute API link is read same-origin, which sidesteps CORS. */
export function resolveApiUrl(url: string): string {
  if (!API_BASE.startsWith('/')) return url;
  try {
    const u = new URL(url);
    return u.pathname.startsWith('/api/v1') ? `${u.pathname}${u.search}` : url;
  } catch {
    return url;
  }
}

// Guard so parallel 401s (the dashboard fires many calls at once) trigger a
// single redirect, not a storm of them.
let sessionRedirectInFlight = false;

function isAuthEndpoint(endpoint: string): boolean {
  // A 401 on the auth endpoints themselves means "bad credentials", handled by
  // the login/verify pages — not an expired session, so never redirect there.
  return /\/auth\//.test(endpoint) || endpoint.includes('/shared/') || endpoint.includes('/sign/');
}

// Credential endpoints take no bearer token: a 401 there means bad credentials
// or a dead one-time token, never an expired session, so they must not trigger
// a refresh. Authenticated /auth/* calls (/auth/me, /auth/sessions, MFA setup)
// are NOT in this list; they refresh and retry like any other call.
const CREDENTIAL_AUTH_PATH =
  /\/auth\/(login|signup|register|refresh|verify|verify-email|resend-verification|password\/(forgot|reset)|forgot-password|reset-password|mfa\/(challenge|verify-login))(\/|\?|$)/;

export function isCredentialEndpoint(endpoint: string): boolean {
  return (
    CREDENTIAL_AUTH_PATH.test(endpoint) || endpoint.includes('/shared/') || endpoint.includes('/sign/')
  );
}

// A short-lived access token that has expired can be silently renewed with the
// stored refresh token via POST /auth/refresh. The refresh token is single-use
// and ROTATES (the server returns a new one and invalidates the old), so a burst
// of parallel 401s must share ONE refresh — otherwise the first rotation would
// invalidate the token the others are about to send. `refreshPromise` is that
// single-flight guard; concurrent callers await the same in-flight refresh.
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('cf_refresh_token');
  if (!stored) return null;

  if (!refreshPromise) {
    refreshPromise = (async (): Promise<string | null> => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: stored }),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as {
          data?: { access_token?: string; refresh_token?: string };
          access_token?: string;
          refresh_token?: string;
        };
        const payload = json.data ?? json;
        const newAccess = payload.access_token;
        const newRefresh = payload.refresh_token;
        if (!newAccess) return null;
        localStorage.setItem('cf_token', newAccess);
        // Persist the rotated refresh token; the old one is now dead server-side.
        if (newRefresh) localStorage.setItem('cf_refresh_token', newRefresh);
        return newAccess;
      } catch {
        return null;
      }
    })();
    // Clear the guard once settled so a later expiry can refresh again.
    void refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// A 401 from any authenticated call means the access token is missing or
// expired. Clear the stale session and send the user to /login instead of
// letting the page hard-crash to an error boundary.
function handleSessionExpired(endpoint: string): void {
  if (typeof window === 'undefined' || isAuthEndpoint(endpoint)) return;
  try {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_refresh_token');
    localStorage.removeItem('cf_workspace_id');
  } catch {
    /* ignore storage errors */
  }
  const path = window.location.pathname;
  if (sessionRedirectInFlight || path.startsWith('/login') || path.startsWith('/signup')) return;
  sessionRedirectInFlight = true;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?session=expired&next=${next}`);
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return (await apiRequest<T>(endpoint, options)).data;
}

/** Same as apiClient, but also reports the HTTP status (e.g. 201 created vs 200 already there). */
export async function apiClientWithStatus<T>(endpoint: string, options: RequestInit = {}): Promise<{ status: number; data: T }> {
  return apiRequest<T>(endpoint, options);
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cf_token') : null;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Workspace-scoped endpoints (dashboard, roadmap, health, …) require the active
  // workspace via X-Workspace-Id, sourced from /auth/me → active_workspace_id and
  // stored at login. Harmless on auth endpoints, which ignore it.
  const workspaceId = typeof window !== 'undefined' ? localStorage.getItem('cf_workspace_id') : null;
  if (workspaceId && !headers.has('X-Workspace-Id')) {
    headers.set('X-Workspace-Id', workspaceId);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const normalizedEndpoint = cleanEndpoint.startsWith('/api/v1')
    ? cleanEndpoint.replace('/api/v1', '')
    : cleanEndpoint;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${normalizedEndpoint}`;

  let res = await fetch(url, {
    ...options,
    headers,
  });

  // Access token expired mid-session → try a silent refresh + one retry before
  // giving up. Credential endpoints are exempt (a 401 there is bad credentials,
  // not an expired session), and we only attempt this when a token was sent.
  if (res.status === 401 && token && !isCredentialEndpoint(endpoint) && typeof window !== 'undefined') {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(url, { ...options, headers });
    }
  }

  if (!res.ok) {
    let errData: unknown;
    try {
      const text = await res.text();
      try {
        errData = JSON.parse(text);
      } catch {
        errData = text;
      }
    } catch {
      errData = null;
    }
    // Refresh failed or wasn't possible → clear and redirect to login (not a hard crash).
    if (res.status === 401) {
      handleSessionExpired(endpoint);
    }
    throw new ApiError(res.status, res.statusText, errData);
  }

  if (res.status === 204) {
    return { status: 204, data: {} as T };
  }

  return { status: res.status, data: (await res.json()) as T };
}
