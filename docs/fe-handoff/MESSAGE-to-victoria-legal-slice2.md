# Message to Victoria: Legal slice 2 (Legal Advisor Requests)

Paste-ready. Send as is, or trim the "How we work" part if she already knows it.

---

Hi Victoria,

Thank you for Legal slice 1. It's merged and live:

- **API #214** (`3386fc06`, migration `0106_legal`) and your gap list **FE #254** (`7de10ee7`).
- We finished the last items on your branch so it could land today:
  - the 3 CI fixes;
  - the IP renewal reminder key, which now includes the renewal date so reminders fire every year;
  - the proof download, as one authenticated `GET .../compliance-items/{id}/proof` (D-LEG-5);
  - `legal.compliance.overdue` as a critical alert, plus the legal events in the Deadlines filter (D-LEG-6).
- D-LEG-1..8 were taken as the defaults you proposed. They're recorded in `docs/checklist/legal-prd-gaps.md`.
- Our team built the Legal FE on the real API (**FE #255**): Formation, Compliance and the IP register. Legal is back in the sidebar (#257) and is live on www.
- Templates, Contract review and Advisor requests have no API yet, so those tabs are hidden and redirect to `/legal`.

**Next for you: Legal slice 2, Legal Advisor Requests (PRD 13.6).** It covers gap rows **41-47** in `cofoundaz/docs/checklist/legal-prd-gaps.md`:

| Row | What slice 2 must deliver |
|---|---|
| 41 | An `advisor_requests` entity and CRUD under `/legal/advisor-requests` |
| 42 | A record with **subject, document, advisor, status** (a real Documents reference and a real advisor membership) |
| 43 | Create takes a **document from the Documents library** plus a note to the advisor |
| 45 | **Advisor view:** the same list scoped to the legal advisor; **"Upload reviewed draft"** creates a new **document version** (Module 18), plus a comment thread on the request |
| 46 | Return status and copy: "{Advisor} returned {doc} with {n} comments." |
| 47 | Notification to the legal advisor: "{Founder} requested your review of {doc}" (the only PRD notification addressed to a legal advisor) |
| 39 (part) | The API side of "Send to my legal advisor" from contract review: an endpoint that 13.3 can call later. Don't build 13.3 itself |

Rows 44 and the FE halves of 43 and 46 are FE work. Our team does the FE pass after your API merges.

**Before code, open the product calls as D-LEG-9 onward in the gap list, each with options and your recommendation.** The ones I can see:
- Who can create a request: founder only, or founder and team member? (The slice-1 write set is F and TM.)
- Can a founder pick any legal advisor in the workspace, or only one who is assigned?
- What can the advisor see: only the attached document and its versions, or anything shared to them? Today Documents gives them access by grant.
- Does "Upload reviewed draft" need the founder to accept it, or does it become the current version straight away?
- Are comments on the request one thread per request, or tied to a version?
- Can a request be cancelled or re-opened, and what happens to its notifications?

Adebayo answers these before you build the parts they affect.

**How we work (same as slice 1):**
- **Branch and migration:** branch `feature/legal-advisor-requests` off `develop`; PR to `develop`.
- **Re-chain at merge time.** Run `alembic heads` on `origin/develop` right before you push. Today the head is `0104_marketplace_fulfilment`, with `0107` (Funding) and `0108` (Analytics) about to land. Take the next free number and chain on the head at that moment. Merge `develop` in with a merge commit; no force-push.
- **Security:**
  - every route is gated by role (founder, team member, legal advisor as the D-LEG answers say) and scoped to the workspace (a foreign id gets 404);
  - uploads sniff magic bytes and are stored privately (mirror Finance receipts and your slice-1 proof);
  - the advisor sees nothing outside their requests;
  - member emails go only to founder and team member (house rule, 2026-11-12);
  - no em or en dashes in user-facing API copy (a test enforces this).
- **Tests:**
  - a role-matrix test per route, and tenancy tests;
  - in tests, assign responses before asserting. CodeQL now gates every PR, so it isn't report-only any more;
  - when you add a notification, also add it to `READ_ROLES` in `tests/services/notifications/test_dashboard_audience.py`.
- **Deliverables:**
  - an e2e journey `e2e/test_legal_advisor_requests.py`;
  - a **live-captured** `docs/fe-integration-guide-legal-advisor-requests.md` (every body copied from a real run);
  - an SOP in `docs/sop/` and the Module 13 section of the master checklist.
- **Local checks:** run only lint, format, type-check and the tests you touched. CI runs the full suite. If you're on Windows, the e2e notes in your slice-1 SOP still apply.
- **Merging:** Adebayo merges after the lead's review (Opus on permissions and uploads).

After slice 2 comes slice 3: Contract Templates (13.2) and AI Contract Review (13.3), rows 27-40. Don't start it until slice 2 is merged.

Thanks!
