export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

// Guard so parallel 401s (the dashboard fires many calls at once) trigger a
// single redirect, not a storm of them.
let sessionRedirectInFlight = false;

function isAuthEndpoint(endpoint: string): boolean {
  // A 401 on the auth endpoints themselves means "bad credentials", handled by
  // the login/verify pages — not an expired session, so never redirect there.
  return /\/auth\//.test(endpoint) || endpoint.includes('/shared/') || endpoint.includes('/sign/');
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

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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

  const res = await fetch(url, {
    ...options,
    headers,
  });

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
    // Expired/missing session → clear and redirect to login (not a hard crash).
    if (res.status === 401) {
      handleSessionExpired(endpoint);
    }
    throw new ApiError(res.status, res.statusText, errData);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}
