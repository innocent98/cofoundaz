type MarketingEvents = {
  signup_started: { source: string }
  nav_item_clicked: { label: string; href: string }
}

/**
 * Typed event contract for marketing analytics. No provider has been
 * selected yet (spec open decision D-02), so this is a no-op today.
 * Nothing in the app calls `track()` yet — call sites land alongside
 * whichever provider is chosen.
 */
export function track<E extends keyof MarketingEvents>(
  event: E,
  props: MarketingEvents[E]
): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, props)
  }
}
