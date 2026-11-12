import { AUTH_MODE_HEADER, clearSession, ensureSession, getAccessToken, hasSessionHint, refreshSession } from '@/lib/auth/session';

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

const COOKIE_MODE_PATH = /\/auth\/(login|refresh|logout|mfa\/challenge|oauth\/google\/exchange)(\/|\?|$)/;

export function isCredentialEndpoint(endpoint: string): boolean {
  return (
    CREDENTIAL_AUTH_PATH.test(endpoint) || endpoint.includes('/shared/') || endpoint.includes('/sign/')
  );
}

// A short-lived access token that has expired is renewed silently with the HttpOnly refresh
// cookie (lib/auth/session.ts: single-flight per tab, serialised across tabs).

// A 401 from any authenticated call means the access token is missing or
// expired. Clear the stale session and send the user to /login instead of
// letting the page hard-crash to an error boundary.
function handleSessionExpired(endpoint: string): void {
  if (typeof window === 'undefined' || isAuthEndpoint(endpoint)) return;
  clearSession();
  try {
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
  // A page load has no token in memory yet: renew it from the cookie before the first call.
  if (typeof window !== 'undefined' && !getAccessToken() && !isCredentialEndpoint(endpoint)) {
    await ensureSession();
  }
  const token = getAccessToken();

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

  // Cookie mode: these routes set or use the refresh cookie, so the browser must send/accept it and the
  // API must be told (X-Auth-Mode) that no refresh token is in the body. Only these, to avoid CORS preflights elsewhere.
  const init: RequestInit = { ...options, headers };
  if (/\/auth\//.test(endpoint)) init.credentials = 'include';
  if (COOKIE_MODE_PATH.test(endpoint)) headers.set("X-Auth-Mode", AUTH_MODE_HEADER["X-Auth-Mode"]);

  let res = await fetch(url, init);

  // Access token expired mid-session → try a silent refresh + one retry before
  // giving up. Credential endpoints are exempt (a 401 there is bad credentials,
  // not an expired session), and we only attempt this when a token was sent.
  if (res.status === 401 && (token || hasSessionHint()) && !isCredentialEndpoint(endpoint) && typeof window !== 'undefined') {
    const newToken = await refreshSession();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(url, { ...init, headers });
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
