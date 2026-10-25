# SOP: Colour tokens, phase 1 (D38)

## What shipped
Every colour in the FE is now a theme token defined in **one file**, `styles/colour-tokens.css`. About 5,500 hard-coded
colours (Tailwind `[#hex]` classes, chart constants, inline styles) in ~310 files were replaced, with **zero visual change**
(screenshot diff, below). A lint rule stops new hard-coded colours. Branch `refactor/colour-tokens`; PR is in the PR body.

Phase 2 (a later, separate PR) swaps the token values to the brand palette: navy `#051736` and blue `#0F6AFC`
(from `components/brand/BrandLogo.tsx` and `public/brand/`).

## Why
Colours were hard-coded across ~223 files (440 distinct values, 5,569 uses), so the brand colour could not be changed
in one place. Two near-identical sets of ramps also existed (`green/copper/sage/red` in `app/globals.css` and a legacy
brass `:root` set in `styles/tokens.css` that silently overrode `--color-accent`).

## How
1. **Inventory** every hex / rgb / `[#…]` / ramp utility with counts (table below).
2. **Rename the four ramps to semantic names**, same values: `green`→`brand`, `copper`→`accent`, `sage`→`neutral`, `red`→`danger`
   (`bg-green-700` → `bg-brand-700`). The class names no longer lie once the brand changes.
3. **Exact-value tokens for everything else.** A phase that must be pixel-identical cannot merge near-duplicate greys
   (`#E8E8E2` vs `#EBEBE6`), so each distinct value became a token with today's exact value:
   - the 34 most-used one-offs got a *role* name (`ink`, `ink-muted`, `line`, `surface-muted`, `brand-strong`, …);
   - the remaining 359 are the *legacy tail*, named `<family>-x<hex>` (e.g. `neutral-xe5e7eb`) and grouped by hue family.
4. **Codemod** (not committed, regex-based): `prop-[#hex]` → `prop-token` (opacity suffixes such as `/90` kept),
   hex inside other arbitrary values → `var(--color-token)`, TS literals (Recharts, SVG, inline styles) → `var(--color-token)`.
5. **Lint** (see below). The semantic layer (`primary`, `success`, `warning`, `info`, `text`, `border`, `surface`,
   `focus`, `chart-1…7`) is defined on top for new code.

Rejected: merging near-duplicates now (would change pixels; that is a phase-2 design call), a dark-mode value per token
(the app has no dark mode; `ui/tokens.test.ts` asserts that), per-component CSS modules.

## Token layout (`styles/colour-tokens.css`, ~450 tokens)
| Layer | Tokens | Use |
|---|---|---|
| Ramps | `brand-50…950`, `accent-100…900`, `neutral-50…900`, `danger-50…800` | default for new code |
| Roles | text `ink, ink-strong, ink-deep, ink-body, ink-muted, ink-soft, ink-subtle`; borders `line, line-soft, line-strong, line-focus, line-faint, line-mist, line-stone`; surfaces `surface-muted, surface-subtle, surface-faint, surface-ghost`; brand `brand-strong, brand-hover, brand-mid, brand-tint, brand-rail(-deep/-ink)`; accent `accent-gold, accent-bronze`; status `danger-text/ink/bold/deep/wash/tint, success-text` | named one-offs |
| Semantic | `primary, success, warning, danger, accent, info, text, text-muted, border, surface, focus, chart-1…7`, `shadow-soft`, `tint-brand-06`, `tint-accent-06` | prefer these in new code |
| Legacy tail | `brand-x…` (112), `neutral-x…` (132), `accent-x…` (63), `danger-x…` (44), `info-x…` (8) | exact one-offs, kept for zero diff |
| Shadows | `shadow-card, shadow-raised, shadow-accent` | unchanged values |

Cluster → role map for the most-used values (count = uses before the refactor):
| Value | Uses | Token | Value | Uses | Token |
|---|---|---|---|---|---|
| `#1E2923` | 598 | `ink` | `#9C5B34` | 124 | `accent-600` |
| `#183B28` | 390 | `brand-strong` | `#B0483B` | 123 | `danger-600` |
| `#8E9B90` | 309 | `ink-subtle` | `#8A5330` | 120 | `accent-700` |
| `#E8E8E2` | 270 | `line` | `#F5F5F0` | 84 | `surface-muted` |
| `#EBEBE6` | 270 | `line-soft` | `#B39353` | 84 | `accent-gold` |
| `#617065` | 257 | `ink-muted` | `#2D5A3F` | 80 | `brand-mid` |
| `#768478` | 159 | `ink-soft` | `#EAF2ED` | 79 | `brand-tint` |
| `#1E4836` | 149 | `brand-hover` | `#F7F7F5` | 71 | `surface-subtle` |

## Left hard-coded on purpose (marked `colour-ok`)
| Where | Why |
|---|---|
| `lib/confetti.ts`, `app/(dashboard)/mission/page.tsx` (confetti colours) | `canvas-confetti` paints on a `<canvas>`; it cannot resolve CSS variables |
| `app/opengraph-image.tsx` | Satori (`next/og`) renders server-side to an image, no CSS variables |
| `lib/finance/printInvoice.ts` | the invoice prints in a standalone window with no app stylesheet |
| `styles/colour-tokens.css` | the token file itself |

## Lint
* `scripts/precommit-checks.mjs` (pre-commit, staged files) and `ui/tokens.test.ts` (CI, whole tree) reject `#rrggbb`,
  `#rgb`, `#rrggbbaa`, `rgb()/rgba()/hsl()/hwb()/lab()/lch()/oklab()/oklch()` outside `styles/colour-tokens.css`.
* Escape hatch: `colour-ok: <reason>` on the same line, or `colour-ok-file: <reason>` anywhere in the file.
* `neutral` was removed from the "dead default palette" list, because it is now our own ramp name.

## Phase 2: how to change the brand
1. Edit **only** `styles/colour-tokens.css`.
2. Re-point the `brand-*` ramp (50–950) at navy `#051736` / blue `#0F6AFC` shades, and `primary`/`success`/`focus` aliases as wanted.
3. Decide per family what happens to the legacy tail: `brand-x…` and `info-x…` should become `var(--color-brand-NNN)` aliases of
   the nearest ramp step (this is where near-duplicates get merged, deliberately, with a visual review).
4. Update the hex expectations in `ui/tokens.test.ts` (`TOKENS`) to the new values.
5. Re-run the screenshot diff; now every difference is *intended*, so review them rather than expecting zero.

## Verification
* `ui/tokens.test.ts` (incl. the new "no hard-coded colours" scan), `tsc`, ESLint, 1,250 unit tests, `next build` and all 283 Playwright e2e tests green locally.
* Screenshot diff (Playwright, own `next start`, 126 routes × 1440 and 375, logged in as the throwaway founder, local only,
  not committed). Result: 252 shots, 199 byte-identical. The other 53 were re-shot and are explained: ≤110 changed pixels in the
  same sidebar / tab-underline anti-aliasing spots that also differ between two runs of the *same* develop build, a few pages caught
  mid-load on the first pass (identical after re-shoot), and `/setup/mfa` (a fresh random QR code each load).

## Operate / roll back
Pure refactor, no runtime config. Revert the PR to roll back.

## Follow-ups
* Phase 2 brand swap (above).
* Dynamic routes (`[id]`, `[token]`) were not in the screenshot set; they use the same tokens.
* Interactive states (hover/focus/open modals) are covered by token-value identity, not by screenshots.
