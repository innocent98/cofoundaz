export const MARKETING_ROUTES = [
  '/', '/product', '/pricing', '/about', '/contact',
  '/terms', '/privacy', '/security', '/cookies',
]

export const AUTH_ROUTES = ['/login', '/signup']

export const ALL_ROUTES = [...MARKETING_ROUTES, ...AUTH_ROUTES, '/this-route-does-not-exist']
