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
    throw new ApiError(res.status, res.statusText, errData);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}
