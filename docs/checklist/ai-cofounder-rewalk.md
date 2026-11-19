# AI Co-Founder: click-through re-walk on merged develop

**Verdict: DONE. 272 of 272 role × width checks pass, 0 fail, 10 not verified** (63 control rows).

**What was walked (FE #242):** the AI Co-Founder pages (Chat, Suggested actions, History, Your bench, Settings) and the floating quick-chat drawer for the founder and the team member, and the five roles that are denied. The API ran with `LLM_PROVIDER=stub` because the OpenAI account has no credits (429 insufficient_quota): the stub answers every chat turn with a fixed line, so **everything that depends on what the model says is NOT verified (OpenAI quota)** and is listed below for the re-run after the top-up.

**Date:** 2026-11-12. **Code under test:** FE develop `130167d` (innocent98/cofoundaz) and API develop `e59e1d6f` (innocent98/Cofoundaz-api).
**Scratch stack, not the shared :8000 stack:** a fresh worktree of each repo; Postgres 16 and Redis 7 containers (`rewalk-pg`, `rewalk-redis`) with `alembic upgrade head`
on an empty database; the API on `:8100` with `LLM_PROVIDER=stub`, `EMAIL_BACKEND=file` (verification and invite mails are read from disk) and the per-IP sign-up, resend, forgot
and login limits raised so one machine can walk many accounts (the lockout limit itself, 5 failures per email+IP, is left at its default); the FE as `next dev -p 3102`
proxied to it. Roles: F founder, TM team member, M mentor, BC business consultant, AC accountant, INV investor, LA legal advisor. A cell lists the roles that passed at that
width; `❌ role` failed; `n/a` means the control does not exist for that role or width and the row says why.

**Method, honestly.** A scripted real browser (Chromium via Playwright) clicks and types into every control and compares the result with the raw API (`GET`s made with the same
account's token, the API log of the page's own calls, the mail files, and the database where stated). Screenshots were read by eye for the failure cases and a sample of the passes.
The scripts and raw per-run results are in the shared notes folder (`side-session-notes/.../rewalk-2026-11-12/`: `lib.mjs`, `auth*.mjs`, `team*.mjs`, `journal*.mjs`, `notif1.mjs`,
`side1.mjs`, `ai1.mjs`, `ir1.mjs`, `roles*.mjs`, `all-results.json`), not in the repo. Some rows took more than one run because the first script, not the page, was wrong; every row below is from the final run.


## Findings
None failed.

## NOT verified (labelled, not walked)
**Re-run after the OpenAI top-up (NOT verified, OpenAI quota):**
- Chat reply content and quality, which specialist the router picks, and the "Why I said this" text (the stub always answers "[stub-llm] AI-generated assessment narrative." and the router labelled it "Strategist via Co-Founder").
- The drawer's reply content.
- Streaming or token accounting against the daily budget (the usage card is checked against `/ai/status`, but no real tokens were spent, so "budget exhausted" was not reached).
- Automatic generation of Suggested actions cards (three cards were inserted into the scratch database to walk Do it, Snooze and Dismiss; the generator itself was not exercised).
- Action cards the model proposes inside a reply (confirm, dismiss, undo): the stub never proposes one.
- Other observations: "Your bench" shows the four built agents with Ask buttons and seven disabled "Coming soon" cards (D-AI-6 hides unbuilt tabs, not cards); unarchive is done from History, there is no Unarchive button in the Chat view; denied roles get the in-page no-access screen, not a 404.

## Rows

| Control | 1440 | 375 | Evidence / note |
|---|---|---|---|
| Chat: header tabs Chat, Suggested actions, History, Your bench, Settings | ✅ F, tm | ✅ F, tm |  |
| Chat: empty state offers the four starter prompts | ✅ F, tm | ✅ F, tm |  |
| Chat: Send is disabled/no-op with an empty box | ✅ F, tm | ✅ F, tm | disabled=true |
| Chat: empty send creates nothing | ✅ F, tm | ✅ F, tm |  |
| Starter prompt: creates a conversation (POST /ai/conversations 201, opening message included) | ✅ F, tm | ✅ F, tm | conversations ["What should I focus on this week?"] |
| Reply shows which specialist answered ("Strategist via Co-Founder") and a reply body | ✅ F, tm | ✅ F, tm | Strategist via Co-Founder |
| quality of the reply (the stub returns a fixed line "[stub-llm] …") | not verified F, tm | not verified F, tm | NOT verified (OpenAI quota): chat reply content, routing choice, "Why I said this" content |
| Reply actions: Regenerate, Why I said this, Bad reply are present | ✅ F, tm | ✅ F, tm |  |
| Regenerate → POST 202 and a fresh reply replaces the old one | ✅ F, tm | ✅ F, tm | status 202 |
| Why I said this expands a rationale panel | ✅ F, tm | ✅ F, tm |  |
| Bad reply → POST feedback 200 and the button shows the chosen state | ✅ F, tm | ✅ F, tm | status 200 undefined |
| Composer: Shift+Enter inserts a new line | ✅ F, tm | ✅ F, tm | "Line one\nLine two" |
| Composer: Enter sends the message | ✅ F, tm | ✅ F, tm | box "" |
| Safety: HTML typed into chat is shown as text, never executed | ✅ F, tm | ✅ F, tm |  |
| Composer: a very long message (8,000 chars) is handled (sent or refused with a message, no crash) | ✅ F, tm | ✅ F, tm | status 202 |
| New chat: clears the thread and shows the empty state again | ✅ F, tm | ✅ F, tm |  |
| Conversation list shows the conversations the API has | ✅ F, tm | ✅ F, tm | API 1 |
| Conversation search "focus" keeps the matching conversation | ✅ F, tm | ✅ F, tm |  |
| Conversation search with no match shows an empty state | ✅ F, tm | ✅ F, tm | No conversations found. |
| Category chips (All, Strategy, Finance, Legal, Mentoring, Archived) respond without error | ✅ F, tm | ✅ F, tm |  |
| Category "Strategy" lists the strategy conversation | ✅ F, tm | ✅ F, tm |  |
| Category "Finance" hides it | ✅ F, tm | ✅ F, tm |  |
| Opening a conversation loads its messages | ✅ F, tm | ✅ F, tm |  |
| Archive → POST 200; conversation leaves All and shows under Archived | ✅ F, tm | ✅ F, tm | status 200 |
| Archived chip lists it | ✅ F, tm | ✅ F, tm |  |
| Chat › Archived: unarchive is done from History (no Unarchive button in the Chat view) | n/a F, tm | n/a F, tm | n/a in Chat; covered under History › Archived |
| Your bench: Ask button on each available agent; the other agents are shown as disabled "Coming soon" cards | ✅ F, tm | ✅ F, tm | coming-soon cards shown disabled (not hidden): 7; available Strategist, Finance Advisor, Legal Assistant, Mentor; API total 11 |
| Ask Finance Advisor → opens /ai with that specialist addressed | ✅ F, tm | ✅ F, tm | /ai?agent=finance · Pinned to Finance Advisor |
| History: table lists every conversation (API count) | ✅ F, tm | ✅ F, tm | UI 3 / API 3 |
| History: search with no match empties the table | ✅ F, tm | ✅ F, tm |  |
| History: clicking a row opens that conversation in Chat | ✅ F, tm | ✅ F, tm | /ai?c=386680e2-d6e3-4d16-b86a-b3d35636e5a3 |
| History: delete one conversation (confirm) → API DELETE 200, row gone | ✅ F, tm | ✅ F, tm | API 3→2 |
| History: Select all ticks every row | ✅ F, tm | ✅ F, tm |  |
| History: bulk "Archive N selected" appears when rows are selected | ✅ F, tm | ✅ F, tm | Archive 2 selected |
| History: bulk archive → POST 200, rows leave All | ✅ F, tm | ✅ F, tm | status 200 |
| History › Archived: the archived conversations are listed | ✅ F, tm | ✅ F, tm | rows 3 |
| History › Archived: bulk "Unarchive N selected" appears | ✅ F, tm | ✅ F, tm | Unarchive 3 selected |
| History › Archived: bulk unarchive → POST 200, conversations return to All | ✅ F, tm | ✅ F, tm | status 200 |
| Suggested actions: one card per API suggestion | ✅ F, tm | ✅ F, tm | API undefined |
| Suggestion: primary action → POST accept 200 (+ navigates when it has a link) | ✅ F, tm | ✅ F, tm | status 200 → /ai/suggestions |
| Suggestion: Dismiss → POST 200 and the card disappears | ✅ F, tm | ✅ F, tm |  |
| Suggestion: Snooze → POST 200 and the card disappears | ✅ F, tm | ✅ F, tm |  |
| Suggestions generated from real activity (cards here were inserted in the scratch DB; the generator itself uses app events, not the model) | not verified F, tm | not verified F, tm | NOT verified (OpenAI quota): automatic card generation |
| Settings: usage card matches /ai/status (tokens used, budget, status) | ✅ F, tm | ✅ F, tm | {"tokens_used_today":0,"daily_budget":100000,"over_budget":false,"resets_at":"2026-11-13T00:00:00+00:00","recent_enrichment_failures":[]} |
| Settings: Proactive suggestions toggle saves (PATCH 200) and flips in the API | ✅ F, tm | ✅ F, tm | {"proactive_suggestions":true,"daily_briefing":true,"tone":"encouraging"} → {"proactive_suggestions":false,"daily_briefing":true,"tone":"encouraging"} |
| Settings: Daily briefing toggle saves | ✅ F, tm | ✅ F, tm | {"proactive_suggestions":false,"daily_briefing":false,"tone":"encouraging"} |
| Settings: choosing the other tone saves | ✅ F, tm | ✅ F, tm | {"proactive_suggestions":false,"daily_briefing":false,"tone":"straight_shooter"} |
| Settings: switching back saves | ✅ F, tm | ✅ F, tm |  |
| Settings: values persist after reload (toggle state matches API) | ✅ F, tm | ✅ F, tm |  |
| Floating "Ask your AI Co-Founder" button opens the quick-chat drawer | ✅ F, tm | – |  |
| Drawer: a message gets a reply (stub) inside the drawer | ✅ F, tm | – |  |
| drawer reply content | not verified F, tm | – | NOT verified (OpenAI quota): |
| Drawer closes on Escape | ✅ F, tm | – |  |
| not in the sidebar/menu | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA |  |
| /ai by URL shows the no-access screen (no tabs, no controls) | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA | (RouteGuard screen, not a 404/redirect) |
| API GET /ai/conversations → 403 | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA | status 403 FORBIDDEN |
| API GET /ai/settings → 403 | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA | status 403 FORBIDDEN |
| API GET /ai/suggestions → 403 | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA | status 403 FORBIDDEN |
| API GET /ai/status → 403 | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA | status 403 FORBIDDEN |
| API POST /ai/conversations → 403 | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA | status 403 |
| the floating "Ask your AI Co-Founder" drawer button is not shown to this role | ✅ M, BC, AC, INV, LA | ✅ M, BC, AC, INV, LA | count 0 |
| Floating "Ask your AI Co-Founder" drawer button (n/a at 375: the bottom tab bar offers AI instead) | – | n/a F, TM | visible floating buttons at 375: 0 |
| Bottom tab bar "AI" opens the AI Co-Founder chat | – | ✅ F, TM | /ai |
