/**
 * Server-supplied hrefs (briefing actions, risk/opportunity rows, search results)
 * are meant to be in-app routes. Anything else (absolute URLs, protocol-relative
 * `//host`, backslashes, control characters or whitespace) is dropped rather than
 * navigated to. The value is re-parsed against a placeholder origin and the
 * normalised path is returned, so what we check is what the router receives.
 */
const PLACEHOLDER_ORIGIN = 'https://app.invalid';

export function safeInternalHref(href: string | null | undefined): string | null {
  if (typeof href !== 'string') return null;
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  if (/[\u0000-\u001F\u007F\s\\]/.test(href)) return null;
  try {
    const u = new URL(href, PLACEHOLDER_ORIGIN);
    if (u.origin !== PLACEHOLDER_ORIGIN) return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}
