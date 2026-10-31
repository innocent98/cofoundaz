/**
 * Change the query string of the page you are on, for tabs and filters that only client state reads.
 *
 * Use this, not `router.replace`, for same-page URLs. Next's client route cache keeps one entry per
 * static page, ignoring the query string, and a soft navigation takes its URL from that entry. Once
 * the entry holds `?tab=billing`, every `router.replace` lands back on `?tab=billing`: no error, no
 * request, and the control looks dead. `history.replaceState` is the documented alternative and
 * still updates `useSearchParams`.
 */
export function replaceUrl(href: string): void {
  window.history.replaceState(null, '', href);
}
