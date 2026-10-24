# Dashboard / product-app styling guide

The whole app — marketing **and** the product/dashboard — uses one design-token
system, enforced repo-wide by `ui/tokens.test.ts`. Raw Tailwind defaults do
**not** compile (the theme clears them in `app/globals.css`). Use the tokens
below; if you reach for a `bg-gray-500` or `sm:` out of habit, the token test
(and CI) will fail.

## The ramps (defined in `styles/colour-tokens.css`, the ONLY file that may hold a colour)

Phase 1 of the colour-token refactor (D38) renamed the ramps and moved every colour into one file; see
`docs/sop/colour-tokens.md` for the full token list and how to change the brand.

| Role | Tokens (old name) |
|---|---|
| Brand | `brand-50 … brand-950` (was `green-*`) |
| Accent | `accent-100, 200, 500, 600, 700, 800, 900` (was `copper-*`) |
| Neutral | `neutral-50 … neutral-900` (was `sage-*`) |
| Danger | `danger-50, 100, 200, 600, 700, 800` (was `red-*`) |
| Roles | `ink*` (text), `line*` (borders), `surface-*`, `brand-strong/hover/mid/tint`, `accent-gold` … |
| Semantic | `primary`, `success`, `warning`, `danger`, `info`, `text`, `border`, `surface`, `chart-1…7` |

Never write a hex / rgb() in a component: the pre-commit hook and `ui/tokens.test.ts` reject it (escape hatch:
a `colour-ok: reason` comment). If you need a shade that isn't there, **add it to `styles/colour-tokens.css`**
(and to `RAMP_SHADES` in `ui/tokens.test.ts`).

## Mapping cheat-sheet (what NOT to use → what to use)

| Don't | Do |
|---|---|
| `bg/text/border-gray|slate|zinc|stone-N` | `…-neutral-N` |
| `…-emerald|teal|lime-N` | `…-brand-N` |
| `…-amber|orange|yellow-N` | `…-accent-N` |
| `…-rose|pink-N` | `…-danger-N` |
| any hard-coded hex (`bg-[#A88746]` etc.) | a token (`bg-accent-600`, `text-ink`, `border-line`) |
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
