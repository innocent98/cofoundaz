# SOP: Real Cofoundaz logo and favicon

## What shipped
The real Cofoundaz logo (icon mark + wordmark, navy `#051736` with the blue `#0F6AFC` play triangle) replaces every
placeholder "C" tile and text-only brand header, and becomes the favicon, app icon, Apple touch icon and social preview.
Branch `feature/brand-logo`, 2026-10-24. Colours elsewhere in the UI are unchanged (that is the separate colour-token
refactor, see Follow-ups).

## Why
The app shipped with a placeholder brand: a coloured square with a "C" next to the word "Cofoundaz", in five different
colour variants, and the default Next.js favicon. Adebayo added the real logo files (`public/cofoundaz_logo.png`,
`public/cofoundaz_text_logo.png`, 1.1 MB each, opaque off-white background, wide margins).

## How
| Area | Change |
|---|---|
| Assets | `public/brand/cofoundaz-{mark,wordmark}{,-light}.png`, built from the two source PNGs: background removed by treating each pixel as a blend of white and its nearest brand colour (exact alpha on anti-aliased edges, pure brand colour in solid areas), trimmed, downsized. ~100 KB for all four instead of 2.2 MB. The `-light` versions turn the navy white and keep the blue triangle, for dark surfaces. |
| Icons | `app/favicon.ico` (16/32/48), `app/icon.png` (192), `app/apple-icon.png` (180, white tile, since iOS ignores transparency). Next's file conventions emit the `<link>` tags; nothing in `metadata` overrides them. |
| Component | `components/brand/BrandLogo.tsx`: `variant` (`wordmark` / `mark`), `tone` (`dark` for light surfaces, `light` for dark ones), `height` (width follows the aspect ratio), `eager` for above-the-fold use (`loading="eager"`; Next 16 deprecates `priority`). `alt="Cofoundaz"`. |
| Sites | Sidebar (`CofaundazLogo`, light), mobile top-bar brand button (`dashboardnavbar.tsx`, mark), marketing header + footer (`ui/marketing/logo.tsx`, same `tone` API as before), auth brand panel, legacy `components/marketing/Navbar.tsx`, admin and super-admin portals (light mark beside their existing labels), public pages `/s/[token]`, `/shared/[token]`, `/sign/[token]`, `/invite/[token]`, `/setup/mfa`, `/verify/[code]`. |
| Social preview | `app/opengraph-image.tsx` reads the light wordmark from `public/brand/` and embeds it as a data URL. |

Rejected: re-drawing the logo as SVG by hand (risk of drifting from the designer's file; swap in a real SVG when one exists,
since `BrandLogo` is the only place that names the files). Left as text on purpose: "Powered by Cofoundaz" on founders'
public smoke pages, and the founder's own email sender pages (the unsubscribe page speaks for the founder's startup).

## What's involved
`public/brand/*`, `app/{favicon.ico,icon.png,apple-icon.png,opengraph-image.tsx}`, `components/brand/BrandLogo.tsx`,
`components/{CofaundazLogo,dashboardnavbar}.tsx`, `components/marketing/Navbar.tsx`, `ui/marketing/{logo,auth/auth-brand-panel}.tsx`,
`app/{admin-portal,super-admin,setup/mfa}/page.tsx`, `app/{s,shared,sign,invite}/[token]/page.tsx`, `app/verify/[code]/page.tsx`
(+ its test: the XSS check now looks for an injected image, not any image). The source PNGs stay out of git (local only).

## Verification
- Live on a dev server for this branch (port 3001) against the local API: marketing header and footer, login brand panel,
  `/opengraph-image`, dashboard sidebar at 1440 (light wordmark, 160x26, loaded) and at phone width (mark in the top bar,
  sidebar drawer with the light wordmark), `<head>` icon links (`favicon.ico` 48x48, `icon.png` 192x192, `apple-icon.png`
  180x180), no console errors.
- Typecheck, lint, unit tests (1244), production build, Playwright E2E, on Node 24 (CI pins Node 20; the host's Node 26 breaks
  jsdom `localStorage` for reasons unrelated to this change).

## Operate / roll back
Nothing to run. Browsers cache favicons hard; a hard refresh shows the new one. Revert to roll back.

## Follow-ups
- **Colour-token refactor** (agreed 2026-10-24, its own session, after the Finance re-walk fixes land): phase 1 replace the
  ~5,500 hard-coded hex values in 223 files with semantic tokens (zero visual change, screenshot-diffed); phase 2 swap the
  token values to navy `#051736` + blue `#0F6AFC`. The logo already uses the new colours, so the two will clash slightly
  until phase 2.
- An SVG of both marks from the designer would replace the PNGs (sharper at every size).
- The landing page's product mock still draws a "C" in its illustrated sidebar.
- API side (optional): logo on the certificate PDF and in the email template header.
