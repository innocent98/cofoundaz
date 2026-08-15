export const MARKETING_ROUTES = [
  '/', '/product', '/pricing', '/about', '/contact',
  '/terms', '/privacy', '/security', '/cookies',
]

export const AUTH_ROUTES = ['/login', '/signup']

/** Any unmatched URL renders app/not-found.tsx. */
export const NOT_FOUND_ROUTE = '/this-route-does-not-exist'

export const ALL_ROUTES = [...MARKETING_ROUTES, ...AUTH_ROUTES, NOT_FOUND_ROUTE]

/**
 * Routes that render the full site chrome (skip link, SiteHeader, SiteFooter).
 * The 404 belongs here: `app/not-found.tsx` renders `SiteChrome` directly,
 * since a root-level not-found never picks up the `(marketing)` layout.
 * The auth routes deliberately do not — `app/(auth)/layout.tsx` is a two-pane
 * brand panel with no marketing nav.
 */
export const CHROME_ROUTES = [...MARKETING_ROUTES, NOT_FOUND_ROUTE]
