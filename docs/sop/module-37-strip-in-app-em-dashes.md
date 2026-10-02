# SOP — Strip em/en dashes from in-app copy

**What shipped:** removed every em-dash (`—`) and en-dash (`–`) from rendered
copy across the authenticated app, matching the house-style rule already enforced
on the public marketing site. Branch `fix/strip-in-app-em-dashes` → PR to `develop`.

## Why

House style forbids em/en dashes in copy (the public `content/*` modules are
already guarded by `content/content.test.ts`). The in-app screens still used them
widely (~85 lines across 54 files). This brings the product copy in line.

## How

A one-off script (`scratchpad`, not committed) walked `app/`, `components/`,
`ui/`, `hooks/`, `lib/` (`.ts`/`.tsx`, excluding `*.test.*`) and applied, per line
(skipping pure-comment lines):
- `</strong> — ` → `</strong> ` (objection/rebuttal lists where a period already ends the clause)
- sentence-ender + ` — ` → ender + space
- parenthetical ` — ` → `, `
- trailing/`{' '}`-adjacent ` —` → `,`
- numeric ranges / toggle glyphs / empty-value placeholders (`'—'`, `0–1`, `'–'`) → `-`

Three parenthetical lists that read as run-ons with commas were upgraded to
parentheses by hand (Health "signals from every hub (…)", the two
"Opportunities I spot (…)" lines).

Updated `components/ai/ai-status-banner.test.tsx` — it asserted the banner's exact
copy, which changed from `… — your data …` to `…, your data …`.

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 229 |
| build / e2e | clean / 153 |
| dash scan | no `—`/`–` remain in `.ts`/`.tsx` rendered copy (only a CSS comment in `app/globals.css`) |

## Follow-ups

- Consider extending the `content.test.ts` dash guard to a lint rule covering the
  whole `app/`/`components/` tree so new em-dashes can't creep back in.
