# SOP — Public copy refresh + real workspace identity in sidebar

**What shipped:** two public-facing copy adjustments on the marketing site and a
fix that wires the dashboard sidebar (workspace switcher + founder profile) to
real data instead of hardcoded placeholders. Branch
`fix/public-copy-and-workspace-identity` → PR to `develop`.

## Why

- **Copy:** positioning dropped the "AI" qualifier — "AI operating system" →
  "operating system", "AI advisors" → "advisors" — and a new supporting tagline
  was requested under the hero. House style also forbids em/en dashes in copy
  (already guarded by `content/content.test.ts`), so the new line uses a comma.
- **Sidebar "Kolo" bug:** reported as "still having Kolo after creating account
  and uploading logo." The left-sidebar workspace switcher (`Kolo` /
  `Validation stage` / `K`) **and** the bottom founder profile (`Amara Okafor` /
  `Founder` / `AO`) were 100% static JSX — they never read any API, so every
  account saw the same placeholder regardless of its real name/stage/logo. Same
  fabricated-data class as the #75 dashboard cleanup.

## How

### Copy (site-wide "AI" removal — the live homepage is the canonical path)

`/` renders via `app/(marketing)/page.tsx` → `ui/marketing/home/hero.tsx` →
`content/home.ts`. Edits:

- `content/home.ts` — `hero.badge`, `hero.subtitle` de-"AI"'d; new
  `hero.tagline` added.
- `ui/marketing/home/hero.tsx` — renders the new `tagline` `<p>` under the subhead.
- `content/content.test.ts` — updated the verbatim subtitle assertion + added a
  tagline assertion.
- `content/nav.ts` (`footerTagline`), `lib/seo.tsx` (two JSON-LD descriptions),
  `app/opengraph-image.tsx` (OG body text + `alt`, whose em dash was stripped to
  a colon).
- `app/home/page.tsx` — the orphaned `/home` duplicate (nothing links to it) was
  kept consistent: badge, subhead, new tagline, footer tagline.

### Sidebar identity

- **New hook** `hooks/useStartupProfile.ts` — one `GET /onboarding/state` on
  mount, exposing `name`, `stageLabel` (e.g. `validation` → "Validation stage"),
  `logoUrl`, `founderName`, `founderRole`. On 401/403 or error it stops loading
  and keeps everything `null` (honest neutral fallbacks, no fabrication). The
  sidebar lives in the dashboard layout, so this fetches once per session.
- **`components/sidebar.tsx`** — switcher shows the real logo `<img>` when
  `logo_url` is present (falls back to the name's first letter), the real `name`,
  and the `stageLabel` (hidden when absent). Bottom profile shows real
  `full_name` + `role_title` + computed initials.

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 229 |
| build / e2e | clean / 153 |
| **Live (staging, test account)** | `GET /onboarding/state` returns `name=Kolo`, `stage=validation`, `logo_url=null`, `full_name=Ade`, `role_title=Founder & CEO`. In-browser: switcher renders **Kolo / Validation stage**, bottom profile renders **Ade / Founder & CEO** (initials **AD**); DOM assert confirms the "Amara Okafor" placeholder is gone. Homepage `/` renders the de-"AI"'d badge + subhead and the new "Built for founders at every stage…" tagline. |

**Honest caveat:** the logo-`<img>` path couldn't be exercised live — the test
account has `logo_url=null`. The letter-fallback path was verified; the image
path is covered by typecheck only. The hardcoded `Kolo`/`Validation stage`
happened to match this account's *real* values, which is why the bug was easy to
miss on this account; a different account (e.g. the reporter's "Prock business
solution") now correctly shows its own name instead of "Kolo".

## Follow-ups

- Verify the logo-image render on an account that has uploaded a logo.
- The marketing product-shot mockup (`ui/mocks/product-shot`) still shows a demo
  "Amara" — intentional decorative marketing imagery, not real user data.
