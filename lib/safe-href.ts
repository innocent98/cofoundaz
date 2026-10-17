/**
 * Server-supplied hrefs (briefing actions, risk/opportunity rows, search results,
 * notifications) are meant to be in-app routes. Anything else (absolute URLs,
 * protocol-relative `//host`, backslashes) is dropped rather than navigated to.
 */
export function safeInternalHref(href: string | null | undefined): string | null {
  if (typeof href !== 'string') return null;
  if (!href.startsWith('/') || href.startsWith('//') || href.includes('\\')) return null;
  return href;
}
