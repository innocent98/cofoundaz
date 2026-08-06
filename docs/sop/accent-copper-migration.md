# SOP — Accent recolor: Brass → Copper

## What shipped

The marketing site's accent color (PRD "Color 2") was changed from **Brass**
(muddy amber-gold, `#A8894B`) to **Copper** (burnished warm red-brown,
`#9C5B34`). The token ramp was renamed `brass-*` → `copper-*` across the whole
codebase, the ramp's hex values were replaced, and every solid-accent control
(buttons, badges, mock avatars) switched from **black/dark-green text to white
text**. Accent-button hover now **darkens** (→ `copper-700`) instead of
lightening.

Branch: `brass-to-copper-accent` (off `feat/marketing-website`). Single change
set; not yet merged at time of writing.

## Why

Two complaints, one root cause:

1. The brass accent read as pale/amber/"budget," not premium — it didn't feel
   like it belonged next to the deep Evergreen primary.
2. Every solid accent button used **black text**, which looked cheap.

The black text was **not a style choice — it was forced.** `brass-600`
(`#A8894B`) is light enough that **white** text on it only reaches **3.3:1**,
which fails WCAG AA (needs 4.5:1). Black was the only accessible option left,
and black-on-muddy-gold is exactly what reads as low-end. Any gold/amber at an
accent-appropriate lightness hits this same trap.

The fix for **both** complaints is the same single move: go deeper and more
saturated. A darker, richer accent lets **white** text pass AA — and
white-on-a-deep-accent is the premium look. Copper (`#9C5B34`) clears **5.3:1**
with white text.

## How — the decision

- **Direction chosen:** Copper (a deepened, saturated evolution of the warm
  metallic lane), selected over Oxblood (`#7C2E34`, the bolder true-complement
  option) and a refined-gold option (rejected — even a crisp gold stays too
  light for white text, ~3.6:1, so it would keep the black-text problem).
- **Rename, not revalue.** The token was renamed `brass` → `copper` everywhere
  (not left named `brass` with copper values) to keep code aligned with the
  brand vocabulary and avoid a lasting misnomer. The PRD names the accent by
  color, so the brand name genuinely changed.
- **White text + darken-on-hover.** With white text, hovering *lighter* (the old
  brass behavior, which paired with dark text) would *reduce* contrast. So the
  accent button now hovers to the darker `copper-700`, which keeps white text
  ≥ AA and reads as a natural "press."

### The Copper ramp

Mirrors the old 5-stop brass structure so it dropped in cleanly. Each stop has a
specific role — the values were chosen to satisfy the contrast that role needs:

| Stop | Hex | Role | Key contrast |
|------|-----|------|--------------|
| `copper-700` | `#8A5330` | Text on light (eyebrows, numerals); accent-button hover | 6.25:1 on white; white-on-it 6.25:1 |
| `copper-600` | `#9C5B34` | Solid-fill accent; focus ring | white text **5.30:1** (AA); also 5.30:1 as text on white |
| `copper-500` | `#D89A6E` | Light accent for text/icons on dark green; light fills w/ dark text | ~6.4:1 on `green-900`; `green-900` on it 6.4:1 |
| `copper-200` | `#EAD5C6` | Light borders/tints; `::selection` | dark text passes easily |
| `copper-100` | `#F6EAE1` | Lightest wash (banners/pills) | `green-900` on it ~13:1 |

Note a consequence worth recording: **`copper-600` now passes AA as text on
white (5.30:1), which `brass-600` never did (3.31:1).** So the original "D-1"
deviation premise — "accent-600 fails as text on light, use accent-700" — no
longer holds for Copper. `copper-700` is still used for on-light text (stronger
6.25:1 and clearer hierarchy), but it is a choice now, not a hard requirement.
Stale D-1/M-10 contrast figures in `marketing-website.md` were flagged as
historical (see the note at the top of that file).

## What's involved

- **`app/globals.css`** — ramp rename + new hex values (`--color-copper-*`);
  `--color-accent`/`--color-warning` → `copper-600`; focus ring → `copper-600`;
  `::selection` → `copper-200`; `--shadow-accent` rgba → `156, 91, 52`.
- **`ui/primitives/button.tsx`** — accent variant `text-green-900` → `text-white`,
  `hover:bg-copper-500` → `hover:bg-copper-700`.
- **`ui/primitives/badge.tsx`** — accent tone `text-green-900` → `text-white`.
- **`ui/primitives/section-heading.tsx`, `ui/mocks/{app-frame,product-shot}.tsx`,
  `app/(marketing)/pricing/page.tsx`** — mock avatar marks → `text-white`; stale
  brass contrast comments rewritten to truthful copper figures.
- **~20 other `ui/marketing/**` + mock files** — mechanical `brass-*` → `copper-*`
  class rename (Tailwind classes, no behavior change).
- **Tests** — `ui/tokens.test.ts` (new hex assertions + ramp name), `button.test.tsx`
  (accent now asserts `text-white`), plus renames in `primitives.test.tsx`,
  `site-header.test.tsx`, `about-sections.test.tsx`, `product-sections.test.tsx`,
  `e2e/accessibility.spec.ts`.
- **Docs** — this SOP; superseding note added to `docs/sop/marketing-website.md`;
  token table + D-1 updated in the design spec.

## Verification

Run from `cofoundaz/`:

- `npm run typecheck` → **0 errors**.
- `npm run lint` → **clean**.
- `npm test` (vitest) → **188 passed** (20 files), incl. updated token/button tests.
- `npx playwright test e2e/accessibility.spec.ts` → **98 passed**, incl. the
  axe-core contrast sweeps that now validate white-on-`copper-600` (5.3:1) and
  every eyebrow stop.
- **Visual** — dev server + homepage screenshot confirmed both `Start free`
  CTAs (header + hero) render copper with white text; secondary button and
  mock chrome unaffected.

## Operate / roll back

No runtime/config/DB impact — pure token + class change. To roll back: revert
the branch (or `git checkout feat/marketing-website -- .`). No data migration.

## Follow-ups

- Merge `brass-to-copper-accent` into `feat/marketing-website` once reviewed.
- Optional cleanup: since `copper-600` now passes AA as on-light text, the
  `copper-700`-for-eyebrows usages could be simplified to `copper-600` if a
  lighter eyebrow is ever preferred — currently kept darker for hierarchy.
- OG image (`app/opengraph-image.tsx`) uses `green-900` ground with an accent —
  confirm the rendered OG art still reads well with copper (regenerated on next
  build; not separately screenshotted here).
