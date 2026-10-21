# Marketing Hub: PRD + UI gap list (live walkthrough, 2026-10-20)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 10 (§10.1 to §10.8, API, entities, events, notifications, access
"F, TM (Marketing grant)") + §2.1 (shared top bar) + §1.1 principle 5 (never hue alone), and the designed
`Marketing Hub.dc.html`.

**How it was walked:** live on `develop` (FE `cd38be6` in its own dev server on :3117, proxied to the shared API
`1d9c4cf` on :8000), workspace NovaPay, using every sub-page and every control:
- **Founder:** at 1440 and 375.
- **Team member:** at 1440, API reads and writes.
- **Mentor and consultant:** FE pages, API reads, the AI POSTs, search and notifications.

**Real model:** three generations, each run once: Plan my first week, the campaign channel split, and channel fit notes.
**Data:** a read-only code inventory of both repos backs each row. Metrics were seeded through `POST /marketing/metrics`
because no data source exists (see "Blocked").

**Test data left in the workspace** (useful for the FE session):
- post "Walk test: savings tip" (published);
- the AI post "Customer Discovery Invite" (scheduled 21 Oct);
- one draft from AI Copy;
- campaign "Walk test waitlist push" (completed);
- segment "Walk test merchants";
- tracked page `/pricing`;
- the positioning statement;
- 7 metric points dated 15 Oct.

Legend: ✅ meets PRD · ❌ gap · Severity: **Sec** (permission/data exposure) > **High** (PRD behaviour broken or a
headline feature missing) > **Med** (PRD feature partial) > **Low** (copy, polish, a11y)

## Works (verified live)
- ✅ **Real API everywhere:** all eight sub-pages call the real API. There is no mock or seed data in `/marketing/*`. The
  overview tiles match `GET /marketing` exactly. Scheduled this week, active campaigns, top channel and AI content ideas
  all moved as data was added.
- ✅ **Role gating is clean** (`require_role(*MARKETING_ROLES)` on all 43 routes):
  - Mentor and consultant get `403 FORBIDDEN` "You don't have permission to do that." on every read and on the AI POSTs
    (`/copy/generate`, `/calendar/plan-week`).
  - The FE shows "You don't have access to this page." on `/marketing` and on sub-routes.
  - Marketing is hidden from their sidebar.
  - Global search returns no marketing results, and they receive no `marketing.*` notifications.
  - Every service lookup is scoped by `startup_id`. Cross-workspace IDs are rejected: segment IDs on campaigns, campaign
    IDs on metrics, persona IDs on segments, and AI generation IDs (filtered by startup and kind).
- ✅ **Calendar:**
  - create, edit drawer, **Mark published**, delete, month prev/next;
  - Unscheduled drafts list;
  - **Plan my first week** (real model): 7 proposals, per-item **Add** / **Discard**, **Add all** / **Discard all**.
- ✅ **Campaigns:**
  - 4-step wizard; **Recommend a split** (real model) with rationale; **Apply this split** fills the sliders;
  - **Save as draft** / **Create and launch**; Pause / Complete / Edit / Delete.
  - `marketing.campaign.launched` and `.completed` events fire.
- ✅ **AI Copy:**
  - asset type (all 5 PRD types), channel, tone chips (Bold/Friendly/Expert/Playful), key message, CTA and segment;
  - 3 variants, the A/B hint ("Ship two and let your audience pick the winner."), **Save to calendar** (draft or
    scheduled), recent generations list;
  - **Draft it** / **Write it** deep links prefill the key message.
- ✅ **Channels:** 8 PRD channels, status select (PATCH), notes, **Generate AI fit notes** (real model, one note per channel).
- ✅ **SEO:**
  - keyword CRUD; content gaps (AI) with **Write it**;
  - tracked page with an 8-point on-page checklist;
  - positioning statement composed server-side: "For small merchants in Lagos who lose money to slow settlements, NovaPay
    is the payments app that settles the same day."
- ✅ **Segments:** create/edit/delete, persona link (Business Builder personas), est. size, **Used in** campaigns.
- ✅ **Analytics:** 7d/30d/90d range, funnel (impressions, clicks, conversions, CTR, conversion rate), traffic by week,
  CAC by channel, campaign leaderboard, **Record metric**. Money in kobo is rendered correctly.
- ✅ **Notifications:** a team member received all three `marketing.*` notifications from the founder's actions. The actor
  is excluded, and the audience is F + TM only.
- ✅ **375:** no page-level horizontal scroll on any sub-page (the tab bar scrolls inside itself).

## Gaps
| # | Area | Gap (observed) | PRD | Layer | Sev | Proposed fix |
|---|---|---|---|---|---|---|
| 1 | Roles | Every team member has full create/edit/**delete** on all marketing data (keyword created and deleted as TM: 200/200) and can spend the AI budget. There is no per-member "Marketing grant"; `MARKETING_ROLES` = founder + team_member. | Access: **F, TM (Marketing grant)** | both | **Sec** | Decide D-MKT-1. Default: keep TM = full access (matches every other hub so far) and record the decision. If a grant is wanted: a `module_grants` row per membership, `require_module("marketing")` alongside the role check, a Team-page toggle, and 403 tests per role and grant. |
| 2 | Media (future) | `content_calendar.media_ref` exists but has no upload. The obvious reuse, Documents upload, is visible to **all roles** (Documents = ALL_ROLES), so attaching post media as a generic document would leak unpublished campaign assets to mentors, investors and consultants. | entry drawer "media slot" | BE | **Sec** (preventive) | When building row 13, store marketing media with access limited to `MARKETING_ROLES` (own table or a `module` column on documents filtered out of `/documents` for other roles). Test as mentor. |
| 3 | Scheduler | **Scheduled posts never publish.** No marketing job exists in `app/worker/scheduler.py`. An entry stays `scheduled` forever, the overview keeps counting it in "Scheduled this week", and `marketing.post.published` only fires when someone presses **Mark published**. | status Draft/Scheduled/Published, publish datetime; event `marketing.post.published`; "**Scheduled post published: {title}**" | BE | High | A periodic job every 5 min: due `scheduled` entries become `published` with `published_at = scheduled_at` (idempotent, row-locked), then emit the event. This only flips the status. Real posting to platforms is blocked (see below), and the FE should say "Marked published at {time}". |
| 4 | Notifications | `notificationHref` returns `null` for every `marketing.*` type: clicking does nothing, they file under the "Missions" filter, and they get a generic "•" icon. Payloads carry `campaign_id` but no post ID. | notification CTA **"See results"** | both | Med | BE: add `entry_id` to the post payload and a `cta`. FE: deep links (post → `/marketing/calendar?entry={id}` opening the drawer; campaign → campaign detail, row 6), a Marketing category and icon. |
| 5 | Campaign readout | No AI weekly readout and no **"Campaign performance summary ready — {campaign}"** notification. | Campaign detail: **AI weekly readout card**; notification CTA **"See results"** | both | High | BE: weekly job per active campaign → AI readout over its metrics (stored per campaign and week), plus a notification to F + TM with CTA "See results". The prompt gets metrics only, with no user free text. FE: readout card on the detail page. |
| 6 | Campaign detail | No detail view. Campaign names are not links, and there are no charts. | "performance charts (spend, impressions, clicks, conversions by channel)" | both | High | BE: `GET /marketing/campaigns/{id}/performance?range` (series per metric, by channel). FE: `/marketing/campaigns/[id]` with the charts, the readout (row 5), linked content (row 8) and segments. |
| 7 | Campaign list | Columns are name, objective, budget, channels, status. There is no **CTR/conv** and no **period**. `campaign.metrics` is always `{}`. | List: name, objective, channels, budget, status, **CTR/conv**, **period** | both | Med | BE: include CTR and conversions (from `marketing_metrics`, campaign-scoped) on the list response. Drop or derive the unused `metrics` field. FE: two columns plus a mobile card layout (row 31). |
| 8 | Campaign wizard | Step 4 is "Review". The PRD's **"4. Content"** (attach or generate assets) is replaced by a line of text, "Write the campaign's content in AI Copy." Campaigns have no link to posts or copy. | **"4. Content"** (attach/generate assets) → **"Launch campaign"** | both | Med | BE: `campaign_id` (nullable) on calendar entries and copy generations; filter lists by campaign. FE: Content step to attach existing posts or generate copy prefilled from the objective and segments; keep Review as the last screen. |
| 9 | Calendar | Month view only. | **Month/week** `Calendar` | FE | Med | Week view toggle. On 375, default to an agenda list (row 15). |
| 10 | Calendar | No drag to reschedule. The BE already accepts `PATCH scheduled_at`. | "drag to reschedule" | FE | Med | Drag a chip to another day: keep the time and PATCH. Add a keyboard alternative (move via the drawer date). |
| 11 | Calendar | The entry drawer has no **"Write with AI"**. | entry drawer: … **"Write with AI"** | FE | Med | A button that opens an inline copy generation with the title/channel and drops the chosen variant into the body. Reuse `POST /copy/generate`. |
| 12 | Calendar | One channel per entry. | entry drawer: **channel(s)** | both | Low | Decide D-MKT-2. Default: keep one channel per post (cross-posting = duplicate) and adjust copy. |
| 13 | Calendar | No media slot. `media_ref` is unused. | entry drawer: **media slot** | both | Med | Upload/attach image for a post. Restrict access per row 2. |
| 14 | Calendar | The empty state reads "Your calendar is empty" + "Add your first post". | **"An empty calendar is a silent brand."** CTA **"Plan my first week"** | FE | Low | PRD copy and CTA. |
| 15 | Calendar | Channels are told apart by **colour only** (legend dots). At 375 the chips truncate to "C…" / "W…" and can't be read. | §1.1 principle 5: ramp tone **+ channel icon**, never hue alone | FE | Med | A channel icon on every chip and in the legend. Agenda/list layout under `md`. |
| 16 | AI quality | Prompts get only startup name, industry and stage. **Plan my first week** returned copy with unfilled placeholders ("[specific payment challenge]", "[link]"). Channel-plan put 25% on paid social while the fit notes called paid social "lower-priority". | AI drafts a usable 7-day starter calendar; per-channel fit "for you" | BE | Med | Feed every marketing prompt the same context: Business Builder problem/solution/value proposition, personas, the saved positioning statement, segments and current channel statuses. Forbid bracket placeholders, with a check that retries once. Fence user text as in Validation #150/#151. |
| 17 | AI Copy | No **Refine** (inline chat). "More like this" re-generates using the variant as the key message, which also makes history titles the variant text. **Use** is "Copy" (clipboard). | each variant **"Use"** · **"Refine"** (inline chat) · **"Save to calendar"** | both | Med | BE: `POST /copy/generations/{id}/refine` `{variant_index, instruction}` → new variants linked to the parent. FE: inline refine box per variant. "Use" = put the text in the calendar drawer (or keep Copy, see D-MKT-3). Keep the original key message on re-runs. |
| 18 | AI Copy | No character counters or channel length limits. "Channel" is a category (Organic social, Search…), not a platform, so there is no length to enforce. | "channel (constrains length)"; **char counters per channel limit** | both | Med | Decide D-MKT-3. Default: add an optional *platform* (X, Instagram, LinkedIn, WhatsApp, Facebook, Google Ads headline/description, email subject) with a limits table in the BE. The prompt states the limit, and the FE shows `n / limit` per variant (red when over). |
| 19 | AI Copy | History is a "Recent generations" list of 8 under the form. | **History tab** of generated sets | FE | Low | Tab with the full paginated history (BE already lists). |
| 20 | Channels | The "monthly result stat" only exists once channel-scoped CAC exists ("No tracked results yet" otherwise). Fit notes have no fit level. | monthly result stat; AI fit note *"High fit: …"* | both | Low | BE: add `fit_level` (high/medium/low) to the fit-note schema; a per-channel 30-day summary (visits, conversions, spend). FE: level badge + stat. |
| 21 | Channels | Launching a campaign with a channel split leaves every channel "Not started". Overview `active_channels` stays 0. | channel status Active/Testing/Paused/Not started | both | Low | Decide D-MKT-4. Default: launching a campaign moves its non-zero channels from "Not started" to "Testing" (never downgrades a manual status). |
| 22 | SEO | Volume, difficulty and rank are typed by hand, and the on-page checklist is ticked by hand. The FE says so honestly. | keyword tracker (volume **est.**, difficulty, current rank) | both | Med | Blocked on an SEO data provider (see below). Until then, keep manual entry and add "last updated" per keyword. |
| 23 | SEO | The positioning **Product** field isn't prefilled with the startup name. | brand positioning statement editor | FE | Low | Prefill `product` with the workspace name when empty. |
| 24 | Segments | No rule builder, no definition chips. The form says "Rule-based segments that count real users are coming later". Est. size is manual. | segment cards (**definition chips**, est. size); Create: name + **rule builder (attributes/behaviors)** + persona link | both | Med | Decide D-MKT-5. Default: a v1 rule builder over a fixed attribute list (location, business type, company size, income band, channel acquired, behaviour tags), stored as `definition` (already a JSON dict), rendered as chips. Size stays a founder estimate until a user-data source exists. |
| 25 | Analytics | No export. Module 22 (Analytics & Reports) has no BE yet. | "export (→ Module 22 report)" | both | Med | Decide D-MKT-6. Default: an interim **CSV export** of the current range (`GET /marketing/analytics/export?range`), swapped to "Add to report" when Module 22 lands. |
| 26 | Analytics | CAC by channel ignores campaign-scoped spend and conversions (a ₦300 campaign spend never appears per channel). **Record metric** allows any scope, so the same event recorded twice inflates the funnel (the page warns, but the form allows it). | CAC by channel; conversion funnel | both | Med | Decide D-MKT-7. Default: record each metric at exactly one scope. Campaign-scoped spend and conversions are attributed to channels by the campaign's `channel_mix` for CAC by channel (labelled "estimated"). |
| 27 | Analytics | Recorded metric points can't be edited or deleted, so a typo is permanent. | (implied: accurate dashboard) | both | Med | BE: `GET /marketing/metrics?range` list + `DELETE /marketing/metrics/{id}`. FE: "Recorded entries" table with delete and confirm. |
| 28 | Shell | Own header (breadcrumb + health pill + bell). No ⌘K search. | §2.1 shared top bar | FE | Med | `ShellTopBar` (as Validation and Assessment). |
| 29 | Calendar | At 1440 the AI Co-Founder FAB covers the **Save changes** button at the bottom-right of the edit drawer. | | FE | Low | Hide the FAB while a drawer or modal is open, or pad the drawer footer. |
| 30 | Channels | The status `<select>`s have no accessible name (read as "Not started"). | a11y | FE | Low | `aria-label="{channel} status"`. |
| 31 | Campaigns | At 375 the table needs horizontal scroll to reach Status and the actions. | | FE | Low | Card list under `md`. |
| 32 | Campaigns | **Complete** and **Delete** act with no confirmation. Complete is one-way and notifies the team. | | FE | Low | Confirm dialog for both. |
| 33 | Campaign wizard | The recommendation reads rationale first, then "Email 7%, Events 12%…". | **"For {objective} at your stage, I'd put {split}. Here's why."** | FE | Low | PRD sentence as the heading of the card, rationale below. Keep the no-dash rule. |
| 34 | Notification copy | "Scheduled post published: {title}" also fires when a never-scheduled draft is marked published. | | BE | Low | Use "Post published: {title}" when `scheduled_at` was null. |
| 35 | Docs | No FE guide for segments or the overview endpoint. | | BE | Low | Add both guides from live captures when those areas change. |

## Build status (2026-10-21)
BE rows 2, 3, 4 (BE), 5 (BE), 6, 7, 8, 13, 16, 17, 18, 20, 21, 22, 24, 25, 26, 27 and 34 merged in API #156 and #157.
FE half of every "FE" and "both" row built in `feature/marketing-prd-fe` (SOP `docs/sop/marketing-prd-fe.md`). 35 of 35 rows closed
except what is blocked on accounts (see "Blocked on external accounts").

| # | Status | Where |
|---|---|---|
| 1 | ✅ decided (D-MKT-1): team members keep full access, no grant UI | `lib/nav-access.ts` unchanged, e2e "a team member keeps full access" |
| 2 | ✅ BE storage + FE slot only uses `/marketing/media` | `components/marketing-hub/media-slot.tsx` |
| 3 | ✅ BE scheduler; FE refetches every minute while a post is due, says "Marked published", never "Posted" | calendar page, post drawer |
| 4 | ✅ deep links, Marketing category, icon and "See results" | `hooks/useNotifications.ts`, notifications page |
| 5 | ✅ AI weekly readout card on campaign detail | `components/marketing-hub/readout-card.tsx` |
| 6 | ✅ `/marketing/campaigns/[id]` with totals, per-day and estimated by-channel charts | `app/(dashboard)/marketing/campaigns/[id]/page.tsx` |
| 7 | ✅ CTR / Conv and period columns, phone cards | campaigns page |
| 8 | ✅ wizard Content step attaches posts; detail page writes copy for the campaign | campaigns page, copy page |
| 9 | ✅ month and week views | calendar page |
| 10 | ✅ drag to reschedule, Alt + arrow keys, and the drawer date | `components/marketing-hub/calendar-views.tsx` |
| 11 | ✅ "Write with AI" in the drawer | `write-with-ai.tsx` |
| 12 | ✅ decided (D-MKT-2): one channel per post, said in the drawer | post drawer |
| 13 | ✅ media slot (upload, library, remove, delete) | `media-slot.tsx` |
| 14 | ✅ PRD empty state and "Plan my first week" | calendar page |
| 15 | ✅ channel icon on every chip and legend entry, agenda under `md` | `channel-icon.tsx`, `calendar-views.tsx` |
| 16 | ✅ BE; real-model Plan my first week, split and fit notes re-checked, no bracket placeholders | SOP |
| 17 | ✅ Refine (inline), "Use" opens a calendar draft, Copy kept | copy page |
| 18 | ✅ platform select and `n / limit` counters, over-limit said in words | copy page, `char-counter.tsx` |
| 19 | ✅ History tab | copy page |
| 20 | ✅ fit-level badge and 30-day stats per channel | channels page |
| 21 | ✅ BE auto-status; the launch toast names the channels it started | `campaign-actions.tsx`, campaigns page |
| 22 | ✅ "Estimated by you, updated {date}" and "(est.)" | SEO page |
| 23 | ✅ Product prefilled with the workspace name | SEO page |
| 24 | ✅ rule builder, definition chips, "(your estimate)" | segments page |
| 25 | ✅ Export CSV | analytics page |
| 26 | ✅ BE single scope; "Estimated" tag with the reason on CAC rows | analytics page |
| 27 | ✅ Recorded entries table with confirmed delete | analytics page |
| 28 | ✅ `ShellTopBar` | marketing layout |
| 29 | ✅ the drawer now sits above the floating AI button | `drawer.tsx` |
| 30 | ✅ `aria-label="{channel} status"` | channels page |
| 31 | ✅ campaign cards under `md` | campaigns page |
| 32 | ✅ confirm dialogs for Complete and Delete | `confirm-dialog.tsx` |
| 33 | ✅ "For {objective} at your stage, I'd put {split}. Here's why." | campaigns page |
| 34 | ✅ BE copy | notification text |
| 35 | ✅ guides exist for the new routes (API `docs/fe-integration-guide-marketing-prd.md`) | API repo |

**Counts:**
- **By layer:** BE 5 (rows 2, 3, 16, 34, 35), FE 13, both 17. Total 35.
- **By severity:** Sec 2 (rows 1, 2; neither is a live leak), High 3 (rows 3, 5, 6), Med 17, Low 13.

## Related, outside the Marketing page
- §19.1 Calendar View: the **Marketing schedule layer** (brass-600, megaphone icon) is absent from `/calendar`. Neither
  the calendar service nor the endpoint reads `content_calendar`. Fix with the Calendar page walk, and gate the layer
  to `MARKETING_ROLES`.
- Dashboard "Campaign CTR" KPI reads the same `marketing_metrics`, so rows 26 and 27 affect it too.

## Decisions needed (proposed defaults; none block BE work on the other rows)
| ID | Question | Proposed default | Who |
|---|---|---|---|
| D-MKT-1 | PRD says "TM (Marketing grant)". Add per-member module grants, or is every team member a marketer? | Every TM has full Marketing access (consistent with Validation, Business Builder and Assessment). Revisit grants as one cross-hub feature on the Team page, not per hub. | **needs Adebayo** (product/permission model) |
| D-MKT-2 | One channel per post, or multi-channel posts? | One channel per post. Cross-posting duplicates the entry. | lead can decide |
| D-MKT-3 | Copy length limits: by channel category or by platform? And what does "Use" do? | Add an optional platform with a fixed limits table. "Use" opens the variant in a new calendar draft. Keep "Copy" as a secondary action. | lead can decide |
| D-MKT-4 | Should launching a campaign change channel statuses? | Yes: Not started becomes Testing for channels with a share above 0%. Never downgrade a status set by hand. | lead can decide |
| D-MKT-5 | Segment rule builder: which attributes, and is size computed? | Fixed attribute list, chips only. Size stays a manual estimate until a user-data integration exists. | lead can decide |
| D-MKT-6 | Analytics export before Module 22 exists? | Interim CSV of the current range, replaced by "Add to report" later. | lead can decide |
| D-MKT-7 | How do campaign-scoped numbers feed CAC by channel? | Attribute by `channel_mix`, labelled "estimated". Force a single scope per recorded metric. | lead can decide |
| D-MKT-8 | Which external integrations, and in what order (see below)? | None in this build-out. Ship the honest manual + scheduler version first, and pick one ad/analytics source next. | **needs Adebayo** (accounts, cost) |

## Blocked on external accounts (honest status)
- **Publishing to social / ad platforms.** "Published" is a status flag only. Nothing posts to X, Instagram, LinkedIn,
  Facebook, WhatsApp or email. Real publishing needs developer apps plus OAuth per platform (Meta, X, LinkedIn) and an
  ESP for email. The row 3 scheduler only flips status.
- **Performance data.** Impressions, clicks, spend and conversions come only from manual **Record metric** or
  `POST /marketing/metrics`. Automatic numbers need Meta Ads / Google Ads / GA4 (or a Supermetrics-style aggregator)
  accounts and OAuth.
- **SEO data.** Volume, difficulty and rank need a provider (Ahrefs, Semrush, DataForSEO, Google Search Console OAuth).
  An automated on-page audit needs crawling the founder's site.
- **Segment sizes from real users.** These need a user/CRM data source (Sales hub, product analytics). None exists yet.
- **Not external but not built:** Module 22 reports (row 25) and the §19.1 calendar layer.

## Build order (proposal)
1. **BE (lead), stacked PRs:**
   - **(a)** Scheduler (3, 34), notification payloads and CTA (4 BE), campaign list stats and the performance endpoint
     (6, 7), campaign links on posts and copy (8), metric list/delete and single-scope rule (26, 27), CSV export (25).
   - **(b)** AI context for all marketing prompts (16), copy refine and platform limits (17, 18), fit level and channel
     stats (20), campaign weekly readout job and notification (5), channel auto-status (21).
   - **(c)** Only if D-MKT-1 says grants: module grants (1).
   - Rule-builder storage (24) is FE-led and already fits `definition`.
   - Each PR ships with tests, an e2e journey, a live-captured FE guide and an SOP.
2. **FE (one sub-session, after (a), or chained):**
   - all FE rows: `ShellTopBar`, campaign detail, week view, drag, Write with AI, icons and agenda at 375;
   - refine, counters, History tab, segment builder, export, deep links, a11y and polish;
   - media slot only once row 2's storage exists.
3. **Re-walk:** click every control on merged develop at 1440 and 375 as F, TM, mentor and consultant.
