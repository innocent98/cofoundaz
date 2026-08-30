# Dashboard / product-app styling guide

The whole app — marketing **and** the product/dashboard — uses one design-token
system, enforced repo-wide by `ui/tokens.test.ts`. Raw Tailwind defaults do
**not** compile (the theme clears them in `app/globals.css`). Use the tokens
below; if you reach for a `bg-gray-500` or `sm:` out of habit, the token test
(and CI) will fail.

## The ramps (defined in `app/globals.css` `@theme`)

| Role | Tokens |
|---|---|
| Brand green (Evergreen) | `green-50 … green-950` |
| Accent (Copper) | `copper-100, 200, 500, 600, 700, 800, 900` |
| Neutral (Sage, green-tinted gray) | `sage-50 … sage-900` |
| Signal (Red) | `red-50, 100, 200, 600, 700, 800` |
| Semantic aliases | `--color-primary` (green-700), `--color-accent` (copper-600), `--color-success` (green-600), `--color-warning` (copper-600), `--color-danger` (red-600) |

The product app needed more neutrals/darks than marketing, so `sage` was
extended to a full 50–900 ramp and `copper`/`red` gained dark ends. If you need
a shade that isn't there, **add it to `@theme` in `globals.css`** (and to
`RAMP_SHADES` in `ui/tokens.test.ts`) — never fall back to a raw Tailwind color.

## Mapping cheat-sheet (what NOT to use → what to use)

| Don't | Do |
|---|---|
| `bg/text/border-gray|slate|zinc|stone|neutral-N` | `…-sage-N` |
| `…-emerald|teal|lime-N` | `…-green-N` |
| `…-amber|orange|yellow-N` | `…-copper-N` |
| `…-rose|pink-N` | `…-red-N` |
| any hardcoded gold/brass hex (`bg-[#A88746]` etc.) | `…-copper-{500,600,700}` |
| `rounded-sm/md/lg/xl/2xl/3xl` | `rounded-[2px]` / `rounded-[6px]` / `rounded-input` (8px) / `rounded-card` (12px) / `rounded-modal` (16px) / `rounded-[24px]`. `rounded-full` is fine. |
| `shadow-sm/md/lg/xl/2xl/xs/2xs/inner` | `shadow-card`, `shadow-raised`, `shadow-accent` (or `shadow-[…]` for a one-off) |
| `font-sans` / `font-serif` / `font-mono` | `font-body` (Hanken), `font-display` (Spectral) |
| `sm:` breakpoint prefix | `md:` — base styles ARE the small-screen design; `md` here = 640px (Tailwind's old `sm`). Only `md:` / `lg:` / `xl:` exist. |
| unescaped `'` in JSX text | `&apos;` (only in JSX text — never inside JS strings/template literals) |

## What this pass already did (2026-08-30)

Applied the full mapping above across all `app/(dashboard)/*`, `app/home`, the
dashboard chrome in `components/`, the auth pages, and converted **all
gold/brass hardcoded hexes to copper**. All four gates are green
(`typecheck · lint · test · build`), verified visually on the dashboard,
assessment, and marketing home.

Also fixed along the way: two react-hooks bugs in `dashboard/page.tsx`
(`closeAllOverlays` used-before-declared; `setState`-in-effect), the `any` types
in `assessment/page.tsx`, 19 unescaped entities, and removed the 2-second `/`
splash (so `/` serves the real marketing home again).

## Still open (your call)

- **Hardcoded GREEN/neutral hexes remain** (e.g. `bg-[#12291F]`, `bg-[#F7F8F6]`).
  They're already on-brand (evergreen/sage), just literal. Converting them to
  token classes (`bg-green-900`, `bg-sage-50`) is a nice cleanup but not required
  by the gates — do it as you touch each page.
- **Two homes.** `app/home/page.tsx` (your new landing) and `app/(marketing)/page.tsx`
  (the original, now serving `/`) both exist. Decide which is canonical and
  remove the other, so there's a single home.
- **22 `no-unused-vars` warnings** (unused icon imports across the dashboard
  pages). They don't fail CI, but worth clearing as you go.

## Before you push

Run the gates locally — CI runs the same on every PR:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```
