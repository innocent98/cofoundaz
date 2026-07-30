type MarketingEvents = {
  signup_started: { source: string }
  nav_item_clicked: { label: string; href: string }
}

/**
 * No-op until an analytics provider is chosen (spec D-02).
 * Call sites are correct today; swapping in the real provider is one file.
 */
export function track<E extends keyof MarketingEvents>(
  event: E,
  props: MarketingEvents[E]
): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', event, props)
  }
}
