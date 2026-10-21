# Mock-removal map (app-wide), 2026-10-17

The user's directive: **no mock data anywhere, every action, click and integration really done, and every
blocker unlocked.** This file is the working map for that goal. It comes from a read-only source audit
(FE and BE code plus grep, not run live) on 2026-10-17. Tick items only once they are verified live. The
build order and status also live in `docs/HANDOFF-master.md` §5 and `app-review-audit.md`.

Legend: **[FE]** = the BE exists, FE wiring only · **[BE+FE]** = needs a backend build · **[EXT]** = blocked on
third-party accounts/credentials (user decision).

## Bucket A — BE exists, FE still mock (wire next)
- [ ] **Finance hub** (7 pages, `hooks/useFinanceApi.ts`) [FE]. In progress: sub-session `fe-finance-hub`
- [ ] **Marketing hub** (8 pages, `hooks/useMarketingApi.ts`: calendar, campaigns, channels, copy, SEO, segments, analytics) [FE]
- [ ] **Calendar** main and milestones (`hooks/useCalendarApi.ts`) [FE]
- [ ] **Validation** remainder: hub overview, `mvp` (POST /validation/synthesize), `scripts` (POST /validation/scripts/generate), `InsightSynthesizer` [FE]
- [ ] **Legal templates** page: reuse `/document-templates` [FE]
- [x] Dashboard KPI tiles: BE #129 + FE #101 (open PRs, awaiting merge)

## Bucket B — needs a backend build
- [ ] **Team**: list members, change role, remove, resend/revoke invite, post-onboarding invite (only `POST /onboarding/invites` exists, and only while onboarding is a draft); wire dashboard "+ Invite" and `team/page.tsx` [BE+FE]
- [ ] **Account**: profile/photo/workspace update [BE+FE]
- [ ] **AI suggestions / memory / settings**: FE calls `/ai/suggestions*` and `/ai/memory`, which don't exist (errors swallowed) [BE+FE]
- [ ] **Dashboard briefing "Do it"** action (`core-engine.tsx`) [BE+FE]
- [ ] **Global search** (⌘K): hardcoded 8 items, never navigates (S1) [BE+FE]
- [ ] **Journal**: PIN lock is fake (any input unlocks), export and bulk delete are fake (bulk delete is local only) [BE+FE]
- [ ] **Notifications** announcements feed (hardcoded) [BE+FE]
- [ ] **Academy** certificate PDF download / share [BE+FE]
- [ ] **Exports**: invoice PDF, model XLSX, canvas "Export to Documents" [BE+FE]
- [ ] **Analytics & Reports** (report builder, exports, digests) [BE+FE]
- [ ] **Sales** hub: Pipeline, Leads and Accounts are real (BE #165, FE-A, see `docs/sop/sales-crm-fe.md`); Sequences, AI Coach and Analytics are still mock (slices B, C) [BE+FE]
- [ ] **Funding** hub (investor pipeline, cap table, grants, data room, term sheets, analytics) [BE+FE]
- [ ] **Legal & Compliance** (Module 13, assigned to Victoria; spec `cofoundaz-api/docs/handoff/module-13-legal-compliance.md`) [BE+FE]
- [ ] **Investor Readiness** (score, deck review, Q&A, narrative) [BE+FE]
- [ ] **Marketplace** (providers, services, tools, bookings, purchases, reviews) [BE+FE]
- [ ] **Admin portal / super-admin** (outside the dashboard) [BE+FE]

## Bucket C — blocked on external accounts (needs the user's decision/credentials)
- [ ] Finance integrations: QuickBooks, Xero, bank (e.g. Mono/Okra), Stripe [EXT]. Interim: honest "not connected"
- [ ] Calendar sync: Google, Outlook, Apple [EXT]
- [ ] Settings → Billing: plans, cards, invoices, add-ons (payment provider: Paystack or Stripe) [EXT]

## Small cleanups
- [ ] Delete dead `hooks/useDocumentsApi.ts` and `mockDimensionSignals` in `hooks/useHealthScore.ts`
- [ ] `href="#"` fallbacks in `intelligence-feeds.tsx` / `kpi-strip.tsx`; public `app/home` footer links
- [ ] Sidebar Journal `locked: true` flag
- [ ] Documents: preview for uploaded files; version history and comments
