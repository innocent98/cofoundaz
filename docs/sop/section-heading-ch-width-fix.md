# SOP — SectionHeading `ch` width collapse (one word per line)

## What shipped

Fixed two `SectionHeading` call sites where the title wrapped to one word per
line with large empty margins. Files: `ui/marketing/home/problem-strip.tsx`,
`ui/marketing/product/product-hero.tsx`. Branch: `brass-to-copper-accent`.

## Why — root cause

`SectionHeading` applies its `className` to the **wrapper `<div>`**, which
inherits the ~16px body font. Both call sites capped line length with a `ch`
unit on that wrapper (`max-w-[20ch]`, `max-w-[18ch]`). The `ch` unit is the
width of the `0` glyph **in the element it is set on** — so `20ch` resolved
against the 16px body font (≈160px), not against the 28–38px display heading
rendered inside. The heading was forced into a ~160px column and broke to one
word per line, leaving large side gutters.

## How — the fix

Move the cap onto the heading element itself via an arbitrary child variant, so
`ch` is measured in the display font:

- `problem-strip.tsx`: `mx-auto max-w-[20ch]` → `[&_h2]:mx-auto [&_h2]:max-w-[22ch]`
- `product-hero.tsx`: `mx-auto max-w-[18ch]` → `[&_h1]:mx-auto [&_h1]:max-w-[18ch]`

`text-balance` (already on the heading) then evens the line lengths. Verified
live: the home problem heading cap went from ~160px to 448px at desktop (38px
font), wrapping to a balanced multi-line block.

## What's involved

- `ui/marketing/home/problem-strip.tsx`, `ui/marketing/product/product-hero.tsx`
  — className change only, plus an explanatory comment.
- No `SectionHeading` API change (other call sites that want a full-width
  heading, or that cap the *subtitle* via `[&_p]:max-w-[…]`, are unaffected).

## Verification

- `npm run typecheck` → 0 errors · `npm run lint` → clean · `npm test` → 188
  passed (no test asserted the old `max-w-[20ch]`/`[18ch]` classes).
- Live desktop (1280px) screenshot: "Building a startup shouldn't feel like
  guessing." renders as a centered, balanced multi-line heading with no excess
  side whitespace.

## Follow-ups

- Guard for the future: never put a `ch`/`em`-based `max-width` on a
  `SectionHeading`'s wrapper `className` — it measures the body font, not the
  heading. Cap the heading element (`[&_h1]`/`[&_h2]`) instead. Consider baking
  a sensible default measure into `SectionHeading` if this recurs.
