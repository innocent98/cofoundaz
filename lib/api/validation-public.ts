import { API_BASE } from './client';

// Public smoke-test page routes (`/validation/pages/{slug}`): no login, no
// headers. Deliberately NOT apiClient, which would attach a stale token and
// bounce a visitor to /login on a 401.

export interface PublicPage {
  headline: string;
  subheadline: string;
  cta_text: string;
  require_email: boolean;
  show_pricing: boolean;
  metric_type: string;
  post_signup_message: string;
  powered_by: string;
}

export type PublicEventKind = 'visit' | 'cta_click' | 'preorder_click';

/** Failure of a public call; `status` is 0 when the network itself failed. */
export class PublicApiError extends Error {
  constructor(public status: number) {
    super(`Public page request failed (${status})`);
  }
}

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/validation/pages/${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    throw new PublicApiError(0);
  }
  if (!res.ok) throw new PublicApiError(res.status);
  return (await res.json()) as T;
}

export async function getPublicPage(slug: string): Promise<PublicPage> {
  const res = await publicFetch<{ data: PublicPage }>(encodeURIComponent(slug));
  return res.data;
}

/** Fire-and-forget: never throws, never blocks the page. */
export function sendPublicEvent(slug: string, kind: PublicEventKind, visitorId: string): void {
  void publicFetch(`${encodeURIComponent(slug)}/events`, {
    method: 'POST',
    body: JSON.stringify({ kind, visitor_id: visitorId }),
    keepalive: true,
  }).catch(() => undefined);
}

export async function submitPublicSignup(slug: string, email: string, visitorId: string): Promise<string> {
  const res = await publicFetch<{ data?: { message?: string } }>(`${encodeURIComponent(slug)}/signups`, {
    method: 'POST',
    body: JSON.stringify({ email, visitor_id: visitorId }),
  });
  return res.data?.message ?? "You're on the list, we'll be in touch soon.";
}
