# SOP: Marketing BE integrations (readout figures, stale content gaps, search hrefs, media preview)

## What shipped
FE wiring for four merged Marketing BE changes (API #161, #162; spec `cofoundaz-api/docs/fe-integration-guide-marketing-prd.md` §11 and §15). Branch `fix/marketing-be-integrations`, one PR to `develop`.

## Why and how
| Gap | Problem | Change |
|---|---|---|
| Readout figures | Prose could mis-state numbers ("750000 spent") | `ReadoutCard` (`components/marketing-hub/readout-card.tsx`) renders a This week / Last week / Change / All time table for spend, impressions, clicks, CTR, conversions, CAC, plus "Live for N days", all from `figures[*].display` (`figures` is a sibling of `output`). `figures: null` or absent (old rows) shows the prose with no table. Types: `ReadoutFigures`, `ReadoutFigure` in `lib/api/marketing.ts`. |
| 9 stale | Old, off-brand ideas stayed listed with no hint | `ContentGapsSection` (`app/(dashboard)/marketing/seo/page.tsx`): when the newest ready run has `stale === true`, show "Your brand details changed since these ideas were written" + **Regenerate** (same `POST /seo/content-gaps/generate` as Find content ideas). Old ideas stay until the new run is ready; the notice hides while generating. `stale` on other kinds is ignored (`Generation.stale` is typed optional/nullable). |
| 5 hrefs | Hits linked to list pages | The BE now sends item hrefs. The FE needed no new routes: `search-context.tsx` already pushes `safeInternalHref(r.href)`, `/marketing/campaigns/[id]` and the calendar `?entry=` drawer deep link already existed. Verified, plus a `safeInternalHref` test for the three shapes. |
| 7 media | "Preview unavailable" for every image | `MediaThumb` (`components/marketing-hub/media-slot.tsx`) calls `fetchMediaBlob` (`lib/api/marketing.ts`, bearer + `X-Workspace-Id`, same pattern as the CSV export), shows the blob via `URL.createObjectURL`, and revokes it on id change or unmount. Fetch failure or decode failure falls back to the file chip. Alternative rejected: signed or public URLs (the BE deliberately has none). |

## Verification
Unit: `components/marketing-hub/marketing-hub.test.tsx` (figures table from display strings, null figures, blob preview, revoke on unmount and on change, fetch failure chip), `app/(dashboard)/marketing/seo/seo-stale.test.tsx` (notice, fresh, newest-ready-only, hidden while generating), `lib/api/marketing.test.ts` (`fetchMediaBlob` headers, 404), `lib/safe-href.test.ts`.
Live against the local API as the founder, own dev server, 1440 and 375, no sideways page scroll:
- Stale: two `stale: true` runs showed the notice; Regenerate kept the 7 old ideas on screen while generating; when ready the notice was gone and the API read `[false, true, true]`. Editing positioning flipped all runs to `true` and the notice returned.
- Search: `scheduled teaser` + Enter opened `/marketing/calendar?entry=<id>` with the drawer; campaign hit opens its detail page.
- Media: drawer thumbnail is a `blob:` image (naturalWidth 1) from `/media/<id>/file`.
- Readout: the existing row (`figures: null`) shows prose only. **Not live:** a row with figures does not exist on the local account (the weekly job writes them), so that path was checked by replaying the BE's captured `e2e/_captures/marketing_prd_b/campaign_readouts.json` through the real card; table scrolls inside its own container at 375.
- Cloudinary 302 for media not exercised (BE could not either).

## Operate / roll back
FE only; revert the PR. Local dev needs `API_PROXY_TARGET=http://localhost:8000 npx next dev -p <port>`.

## Follow-ups
The first real readout with figures should be eyeballed after the next Monday 08:00 run.
