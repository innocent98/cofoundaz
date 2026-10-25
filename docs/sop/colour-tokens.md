# SOP: Colour tokens, phase 1 (D38) and phase 2 (brand swap)

## What shipped
Every colour in the FE is now a theme token defined in **one file**, `styles/colour-tokens.css`. About 5,500 hard-coded
colours (Tailwind `[#hex]` classes, chart constants, inline styles) in ~310 files were replaced, with **zero visual change**
(screenshot diff, below). A lint rule stops new hard-coded colours. Branch `refactor/colour-tokens`; PR is in the PR body.

Phase 2 (branch `feature/brand-colours`, section below) swaps the token values to the brand palette: navy `#051736` and blue
`#0F6AFC` (from `components/brand/BrandLogo.tsx` and `public/brand/`).

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

## Phase 2: brand swap (2026-10-25, branch `feature/brand-colours`)

### What shipped
Token **values** only: no component changed. The app is now navy `#051736` and blue `#0F6AFC` instead of evergreen and copper.
Changed files: `styles/colour-tokens.css`, `app/globals.css` (focus ring and text selection use tokens), `ui/tokens.test.ts`
(new expected values). This PR is **for visual sign-off by Adebayo** before merge.

### Palette
| Token | Value | Notes |
|---|---|---|
| `brand-950` | `#051736` | logo navy: sidebar, dark cards, headings (`ink`) |
| `brand-900 / 800 / 700` | `#072454 / #0A367F / #0D4FBC` | interpolated navy to blue (OKLab): dark fills, hover states |
| `brand-600` | `#0263F4` | **primary / CTAs / blue text**. Logo blue nudged darker (see below) |
| `brand-500` | `#0F6AFC` | exact logo blue |
| `brand-400 … 50` | `#9CC2FF #C8DEFF #E8F1FF #F6FAFF` (`brand-400` is `#4F8FFA`, the lightest blue that is still 3:1 on white for large text, as the 404 page needs) | tints towards white |
| `neutral-*`, `ink-*`, `line-*`, `surface-*` | green-grey hue-rotated to the blue hue | same lightness, so layouts and hierarchy are unchanged |
| `success` | `success-text` `#137333` | stays green, distinct from brand |
| `warning` | `#9C5B34` | copper, kept for warnings only |
| `danger` | unchanged red ramp | |
| `info` | `#0E7490` teal | was `#1D4ED8`, which looked like the new brand blue |
| `chart-1…7` | blue, copper, teal, grey, tan, violet, brick | distinct hues, not seven blues |

**Why 600 is not exactly the logo blue.** `#0F6AFC` gives 4.68:1 against white, but blue text on the tinted surfaces we use
(`brand-100`, `neutral-100`) is only 4.1 to 4.3:1, which fails AA. Nudging the same hue/chroma to `#0263F4` gives 5.13:1 on white
and at least 4.5 on every tint. The exact logo blue is `brand-500`. If Adebayo wants CTAs in the exact logo blue, change
`primary`/`accent`/`focus` to `brand-500` and accept 4.1 to 4.3:1 for small blue text on tints (the audit below shows where).

### Copper decision (recommendation: retire it from UI chrome)
Copper was not a side accent: `bg-accent-600` / `bg-accent` were **every primary button, active tab pill, link and focus ring** (about
350 uses). Keeping it would put a copper "Add deal" button next to a navy and blue sidebar, so the brand blue would only be
decoration. **Option B (committed):** the `accent-*` ramp is an alias of the brand ramp (`accent-600 = brand-600`, `500 = brand-400`,
`200 = brand-200`, `100 = brand-100`, `700-900` = brand 700-900), `focus`/`accent` are blue. Copper survives as `warning`,
chart series 2, and the gold/cream legacy tail (badges). **Option A** (copper stays as the CTA colour) is shown side by side on 6 pages
in the contact sheet, Part 1. Switching to A is a 9-line change in `styles/colour-tokens.css` (point the `accent-*` lines back at
`#522F1A #6E4326 #8A5330 #9C5B34 #D89A6E #EAD5C6 #F6EAE1`, and `--color-accent` / `--color-focus` at `accent-600`).

### Legacy tail (359 tokens)
**290 now alias a main-scale token** (`--color-brand-x1e4231: var(--color-brand-800)`), found by OKLab distance (within 0.04 of a ramp or
role token of the same family; within 0.03 of an already kept tail value). **69 are kept as literals**:
| Family | Kept | Why |
|---|---|---|
| brand (25) | `x4ade80 xecfdf5 x047857 xd3eed8 x85c29a x65ba90 x529e77` | status greens (success, checks); must not turn blue |
| brand | `x152a22 x0e3e29 x16382c x1f4235 x1b4b38 x2c4a3e x2d5a47 x266b4e x3d6357 x2e7a56 x46735e x4c8260 x627d72 x7da890 x8fb5a0 xa1b8ad x9fbbaa xb5d4c0` | mid-tone blues between ramp steps (no ramp step within 0.04); text and borders on dark panels |
| neutral (5) | `x101211 x7a8580 x7b9382 xa0a8a2 xe6f4ea` | one near-black, three mid greys used as light text on navy, one status green |
| accent (23) | gold, tan and cream tints plus `xc2410c xc05621 xc08457` | the warm gold/amber badge family (copper's remaining job) |
| danger (9) | `x3a1a16 xb26b6b xe5573b xd97762 xc98a7d xd59a8d xe88b7d xe8b5ac xf3d5ce` | reds with no ramp neighbour |
| info (8) | `x004182 x0a66c2` (LinkedIn blues), `x354f52 x3d527d xa0aaba xd5dbe8 xeff6ff` | third-party brand colours and slate shades |

`info-x1d4ed8` (the old info blue) is an explicit alias of `brand-700`.

### WCAG AA contrast audit
Method: Playwright walked all 123 non-dynamic routes at 1440 and 375 as the founder test account; for every visible text node it took the
computed colour and the effective background (translucent layers composited, opacity applied), computed the ratio, and grouped by colour
pair. Thresholds 4.5:1, or 3:1 for large text (24px, or 18.66px bold). There is no dark mode, so light only. Result: **217 of 237 distinct pairs pass
(18,576 of 18,875 text nodes, 98.4%)**.

Fixed in tokens (text that failed): `ink-body/muted/soft/subtle` (were 2.9 to 5.5, now 4.5 to 7.4 on white and every tint, including the kanban column grey),
`neutral-400` (was 2.66 for chart axis labels), `brand-600` (see above), `accent-gold` and `accent-bronze` (were 2.9 and 3.9 as text or under white text),
`danger-xe5573b`, `neutral-x9ca8a0`, `neutral-x738279`, `accent-xa68a48`, `accent-xf5eedc`. The hierarchy between the four `ink-*` greys is now narrower
(7.4, 6.2, 5.5, 5.4 on white): it is the cost of every one passing.

Most-used pairs (full data: `contrast-after.json` in the review folder):
| Text token | Background token | Ratio | Needs | Uses | Result |
|---|---|---|---|---|---|
| `brand-x8fb5a0` | `brand-950` | 7.69 | 4.5 | 2441 | pass |
| `neutral-500` | `white` | 5.07 | 4.5 | 1590 | pass |
| `neutral-600` | `white` | 7.17 | 4.5 | 1508 | pass |
| `neutral-900` | `white` | 17.26 | 4.5 | 1226 | pass |
| `ink-muted` | `white` | 6.24 | 4.5 | 980 | pass |
| `neutral-x7b9382` | `brand-950` | 5.27 | 4.5 | 848 | pass |
| `brand-950` | `white` | 17.76 | 4.5 | 776 | pass |
| `neutral-700` | `white` | 10.43 | 4.5 | 760 | pass |
| `ink-soft` | `white` | 5.53 | 4.5 | 620 | pass |
| `white` | `brand-900` | 15.11 | 4.5 | 613 | pass |
| `white` | `brand-600` | 5.13 | 4.5 | 355 | pass |
| `neutral-800` | `white` | 13.84 | 4.5 | 336 | pass |
| `brand-700` | `brand-100` | 6.45 | 4.5 | 282 | pass |
| `white` | `brand-950` | 17.76 | 4.5 | 249 | pass |
| `ink-subtle` | `white` | 5.38 | 4.5 | 226 | pass |
| `brand-900` | `brand-100` | 13.28 | 4.5 | 224 | pass |
| `brand-900` | `line-soft` | 12.65 | 4.5 | 210 | pass |
| `neutral-700` | `line-soft` | 8.73 | 4.5 | 210 | pass |
| `brand-900` | `white` | 15.11 | 4.5 | 196 | pass |
| `neutral-600` | `surface-muted` | 6.56 | 4.5 | 195 | pass |
| `brand-700` | `white` | 7.34 | 4.5 | 194 | pass |
| `brand-800` | `white` | 11.37 | 4.5 | 193 | pass |
| `ink-muted` | `surface-subtle` | 5.82 | 4.5 | 186 | pass |
| `brand-300` | `brand-950` | 9.79 | 4.5 | 182 | pass |
| `neutral-400` | `white` | 4.92 | 4.5 | 170 | pass |
| `brand-400` | `brand-900` | 4.78 | 4.5 | 140 | pass |

**Still failing (20 pairs, 299 text nodes): all need a component change, not a token.** Listed so none is silent:
| Pair | Where | Cause |
|---|---|---|
| `neutral-300` on white / `neutral-100`, 1.5 to 1.65 | `/sales/leads` pagination "/", `/investor-readiness/deck` "/10", `/product` step "3" | decorative separators and a step number in too light a grey: use `neutral-500` |
| white at 60 to 70% opacity on `brand-600`, 2.3 to 2.8 | "Generate script" (`/validation/scripts`), "Save changes" (`/sales/sequences`) | `text-white/60` on a button; use solid white |
| greys at `opacity-80/90` or disabled, 2.4 to 4.1 | "Kickoff" (`/assessment/compare`), "Previous" (`/sales/leads`), "Download PDF", `/validation/mvp` value, `/finance` Advisor note, "Continue with Google" | opacity applied on top of an already passing token (disabled states are exempt) |
| `brand-600` / `brand-400` on `brand-900` / `brand-700`, 2.9 | `/product` icon chips, `/home` "How It Works", `/home` avatars | blue on blue chips: use `brand-300` or white |
| `brand-x627d72` on light, 2.65 to 2.9 | `/home` "No credit card required", struck-through demo item | token is tuned for navy panels (4.1 there), used on a light card once |
| `ink-soft` on navy, 3.2 | `/journal` "/" separator | dark-surface text should use `brand-x8fb5a0` |
| `brand-900` on `brand-900`, 1.0 | `/journal` "⌘J" kbd | text colour equals the chip colour (already invisible before this PR) |

### Verification
* `tsc`, ESLint (incl. the colour rule), 1,256 unit tests on **Node 20**, `next build`, and all 283 Playwright e2e tests (`CI=1`, incl. the axe colour-contrast checks) green locally. The e2e run caught one real miss (the 404 page's large "404" in `brand-400`, 2.55:1), fixed by darkening `brand-400`.
* Screenshots: 123 routes x 1440 and 375, logged in as the local founder, **before = develop, after = this branch**, one dev server
  hot-reloading the token file (so nothing else differs). A contact sheet (`contact-sheet.html`) lists them side by side, with the copper
  decision first. Not committed (the repo does not keep screenshots). Dynamic routes (`[id]`, `[token]`) and the role subdomains were not shot.
* `ui/tokens.test.ts` asserts the new literal values and that `accent-600` aliases `brand-600`.

### Known visual trade-offs (not fixed here, need component work)
* Components that used the brand green to mean **success or "healthy"** now show blue (Health "Healthy" label, done ticks). Only the semantic `success` token
  and the status-green tail tokens stay green. A later pass should point status UI at `success`.
* Components that used copper to mean **caution** (Risks dots on the dashboard, "Needs work" sparklines) now use the blue accent. Same fix: point them at `warning`.
* The marketing mock on `/home` uses mid-tone tail tokens designed for a dark panel on a few light elements (listed above).

### Operate / roll back
No runtime config. Revert the PR. To change the palette again edit only `styles/colour-tokens.css` and the expected values in `ui/tokens.test.ts`.

### Follow-ups
* Component pass for the 20 failing pairs above, and for success/warning semantics.
* Re-walk with Adebayo's feedback after sign-off; role subdomain hosts (`tm.`, `m.`, `bc.`) look the same by construction but were not shot.

## Phase 1 verification
* `ui/tokens.test.ts` (incl. the new "no hard-coded colours" scan), `tsc`, ESLint, 1,250 unit tests, `next build` and all 283 Playwright e2e tests green locally.
* Screenshot diff (Playwright, own `next start`, 126 routes × 1440 and 375, logged in as the throwaway founder, local only,
  not committed). Result: 252 shots, 199 byte-identical. The other 53 were re-shot and are explained: ≤110 changed pixels in the
  same sidebar / tab-underline anti-aliasing spots that also differ between two runs of the *same* develop build, a few pages caught
  mid-load on the first pass (identical after re-shoot), and `/setup/mfa` (a fresh random QR code each load).

## Phase 1 operate / roll back
Pure refactor, no runtime config. Revert the PR to roll back.

## Phase 1 follow-ups
* Dynamic routes (`[id]`, `[token]`) were not in the screenshot set; they use the same tokens.
* Interactive states (hover/focus/open modals) are covered by token-value identity, not by screenshots.
