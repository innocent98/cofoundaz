# SOP: Marketing PRD, front end (every FE and "both" row of the gap list)

## What shipped
The FE half of `docs/checklist/marketing-prd-gaps.md`, against the BE merged in API #156 and #157. Branch `feature/marketing-prd-fe`,
one PR to `develop` (see the PR). Backend contract: API repo `docs/fe-integration-guide-marketing-prd.md` (live captures).

## Why
The live walk found Marketing worked but fell short of PRD Module 10 and the designed UI: a hand-rolled header, month-only
calendar, no campaign detail, no charts, no media, no refine, no counters, no rule builder, no export, notifications that led
nowhere. D-MKT-8 means nothing posts to a platform and numbers are typed in, so the UI must say that plainly.

## How
| Area | What changed | Decision or trade-off |
|---|---|---|
| Shell (28) | `ShellTopBar` replaces the hand-made header; the duplicate `<Sidebar>` is gone (the dashboard layout already mounts it); tabs are real links with `aria-current` | Same pattern as Validation and Assessment |
| Calendar (9, 10, 11, 13, 14, 15) | Month and week views, an agenda list under `md`, drag to reschedule (native HTML5 drag), Alt + arrows, drawer date; "Write with AI"; media slot; PRD empty state with "Plan my first week"; icon on every chip and legend entry | Native drag, no library. Touch has no drag, so phones reschedule in the drawer. A published post cannot be dragged. Scheduling into the past is refused because the scheduler would mark it published at once; a plan proposal whose 9:00 has passed is added as a draft |
| Scheduler UX (3) | Refetch on focus and every minute while a scheduled post is due; wording is "Marked published at {time}" and "Status only, not posted to a platform" | Never "Posted" |
| Deep links (4) | `/marketing/calendar?entry={id}` opens the drawer (GET one entry, then `history.replaceState` drops the param); notifications use `data.href` only when it is an in-app `/marketing` path; new Marketing filter, icon and "See results" | `router.replace` did not update the URL in Next 16 for this case, so `replaceState` is used |
| Campaigns (6, 7, 8, 31, 32, 33) | List with CTR / Conv and period, name links to detail, phone cards, confirm dialogs for Complete and Delete; wizard gets a Content step (attach unlinked posts, linked after create) before Review; recommendation reads "For {objective} at your stage, I'd put {split}. Here's why."; launch toast names channels moved to Testing | Posts are linked after the campaign exists (the API needs a campaign id) |
| Campaign detail (5, 6) | `/marketing/campaigns/[id]`: totals, per-day chart with zero-filled days, "Estimated split by channel" chart, AI weekly readout card, linked posts and copy, "Write copy for this campaign" (prefilled from objective and segments) | By-channel chart is labelled Estimated because the API applies the planned mix to campaign totals |
| AI Copy (17, 18, 19) | Platform select, `n / limit` counters (over-limit said in words, hard vs recommended), Refine inline, "Use" creates a calendar draft and opens it, History tab, `?campaign=` and `?generation=` | "Use" creates a real draft immediately rather than passing text through the URL |
| Channels (20, 30) | Fit-level badge (icon + text), 30-day stats from the channel row, named status selects | Stats now come from `stats_30d`, not the analytics call |
| Segments (24) | Rule builder over the fixed attributes (4 text, found-via channel, up to N tags), definition chips, "(your estimate)" | The old free-text `description` is no longer a valid definition key; old segments render it as a chip and drop it with an explicit note on save |
| SEO (22, 23) | "Estimated by you, updated {date}", "Volume (est.)", Product prefilled with the workspace name | |
| Analytics (25, 26, 27) | Export CSV (blob download with the bearer header), Recorded entries table with confirmed delete and Show more, "Estimated" tag on CAC rows | |
| a11y (29, 30 and more) | Drawer is a real modal (focus in, trap, restore, Escape) and sits above the floating AI button; 11px label contrast raised; sr-only cell fixed so tables cannot widen the page | Found by axe in e2e |
| Row 1, 12 | No grant UI (D-MKT-1); one channel per post is stated in the drawer (D-MKT-2) | |

## What's involved
- API client: `lib/api/marketing.ts` (new routes and types, helpers `fillSeriesDays`, `isOverLimit`, `definitionChips`, `channelsStartedByLaunch`), `lib/marketing-calendar.ts` (date math).
- Hooks: `hooks/useMarketingApi.ts` (`useCalendar(anchor, view)`, `useCampaign`, `useCampaignPerformance`, `useCampaignReadouts`, `useMedia`, `useRecordedMetrics`, `useCopyPlatforms`, `useSegmentAttributes`), `hooks/useNotifications.ts`.
- UI: `components/marketing-hub/` (`calendar-views`, `post-drawer`, `media-slot`, `write-with-ai`, `char-counter`, `channel-icon`, `charts`, `readout-card`, `campaign-actions`, `confirm-dialog`, accessible `drawer`), `app/(dashboard)/marketing/**`, `app/(dashboard)/notifications/page.tsx`.
- No API, migration or config changes.

## Verification
- Local CI parity (project scripts): `npm run typecheck`, `npm run lint` (0 warnings), `npm test` (1065), `npm run build`, `npm run test:e2e` (183, includes new `e2e/marketing.spec.ts` with axe on four Marketing routes and 375 checks).
- Live, shared API `:8000` after confirming `GET /marketing/media` returned 401 (route present), worktree dev server on :3688:
  - founder 1440 and 375: drag reschedule (kept 14:30, moved Thu to Fri, confirmed through the API), drawer with Write with AI, upload, campaign link and save; campaign detail with charts and a real readout; wizard Content step linked a post; launch toast "Paid social is now Testing. Content / SEO is now Testing. ..."; copy with platform X counters, Refine, Use, campaign carried; channel fit notes; segment rule builder (also saving an old segment with `description`); analytics Export CSV and confirmed delete; no page-level horizontal scroll on any sub-page at 375 (after one fix).
  - team member: bell lists 7 Marketing items with "See results"; clicking "Scheduled post published" opened that post's drawer.
  - mentor: `/marketing/campaigns/{id}` shows the clean denial; media, platforms, readouts, export and metrics all 403.
- Real model (100k/day), first live check of #157's prompts:
  - Plan my first week: 7 posts, specific (Lagos merchants, same-day settlement), **no bracket placeholders** (the walk had "[specific payment challenge]"); took 40 to 70 s, close to the 90 s poll limit.
  - Channel split for Awareness: Partnerships 20, Organic social 22, Email 16, Content/SEO 16, Events 12, Search 8, Paid social 4, Referral 2, with a rationale that names NovaPay and Lagos. Fit notes: Paid social Low, Referral Low, Email and Partnerships High. The contradiction from the walk (25% paid social vs "lower priority") is gone.
  - Copy for X (limit 280): three variants at 174, 171 and 185 characters, no placeholders; Refine "Make it shorter and end with a question" gave three variants at 133, 132, 132 ending in questions. Write with AI (email subject, limit 60): 42, 35, 36.
  - Weekly readout (generated by the job for the new campaign): readable and useful, but the prose numbers were off against the recorded data (said 2,400 impressions and 750000 spent for the week where the API shows 2,500 and 650000) and money was printed in raw minor units with no currency. A BE follow-up: pass pre-formatted money and the exact window totals into the readout prompt.

## Operate / roll back
FE only; revert the PR. The scheduler and AI jobs are BE.

## Follow-ups
- Readout prompt numbers and money formatting (BE, above).
- Not live-checked: Cloudinary image preview (local storage returns a relative path, so the UI shows "Preview unavailable" with the file name), 5 MB and 200 image caps (client check unit-tested; server unit-tested), the "Post published:" wording for a manual publish.
- Full re-walk on merged develop at 1440 and 375 for founder, team member, mentor, consultant.
- Touch drag for the calendar if wanted (needs pointer events).
