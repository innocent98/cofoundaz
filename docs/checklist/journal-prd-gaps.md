# Journal: PRD and UI gap list (2026-10-29)

Source of truth: `Cofoundaz_Technical_PRD.md` Module 21 (21.1 to 21.5, API line, entities), §2.1 (nav: founder only), §22.5 line 922
(journal content never retrievable by any agent). Designed UI: `# Cofoundaz Web App UI Build/Founder Journal.dc.html` (tabs Today,
All entries, Mood, Reflections, Privacy; PIN lock screen). Built page: `app/(dashboard)/journal/page.tsx` (808 lines) plus
`hooks/useJournal.ts`.

**How this was walked:** the page was opened live at 1440 (shared stack API on :8000, test founder `throwaway-founder@example.com`,
NovaPay) and the source read end to end; every control was mapped to the raw API with `curl` as the founder and as `rewalk-tm`
(403 on every route). Findings below were confirmed live or in source. The hand re-walk at 1440 + 375 for every role is the FE
developer's acceptance (`docs/fe-handoff/journal.md`).

## What the page is today

Only three things are real: `GET /journal/prompts/today`, `GET /journal/entries` (first lines only) and `POST /journal/entries`
(always tagged with a mood-derived stress). Everything else is mock:

- **The PIN lock is fake.** `isLocked` starts `true`, any text (or nothing) unlocks, "Use device biometrics" just unlocks. Default tab is `Privacy` ("for testing").
- Date header "Saturday, September 5", "12 entries this month", "5" history badge, "All 5 entries", mood stats (12 / Steady / 9 days), the mood chart path and the four Reflections cards are **hardcoded text**.
- All-entries cards show the first line only (`words: 0`, `fullText = first_line`), expand does nothing useful; search filters that same truncated text client side.
- The four privacy toggles are `useState`; Export shows a toast, Delete just empties local state (nothing is deleted).
- Today tab never loads today's entry, so saving **silently overwrites** it (POST upserts by date).

## Product calls (D-JNL-n), each with the lead's default

| # | Question | Default (built unless told otherwise) |
|---|---|---|
| **D-JNL-1** | The design shows a PIN lock ("key only you hold"); the PRD has no PIN (server-side encryption with a workspace key, founder-only routes). | Build an **optional journal passcode** (4 to 12 digits, hashed, never returned). When set, every content route needs an unlock token from `POST /journal/unlock` (30 min) or answers `423 JOURNAL_LOCKED`; 5 wrong tries lock it for 15 minutes; a forgotten passcode is removed with the account password. The stored text stays server-encrypted (Fernet), so the UI copy must not say "derived from your PIN" (see J16). |
| **D-JNL-2** | Privacy toggles "device biometrics", "include in encrypted backups". | **Remove both** from the UI: there is no WebAuthn and no backup feature, so a toggle would lie. |
| **D-JNL-3** | The design's Reflections tab says "AI reads my journal". The PRD says journal content is never retrievable by any agent and insights are "pattern-only". | **No AI over entry text.** Reflections = rule-based pattern cards computed from mood, stress, streaks, entry counts and roadmap events only (the PRD 21.3 insight lines). Remove the "Let AI read my journal" toggle and the "recurring theme / something you said" cards. |
| **D-JNL-4** | PRD 21.4 (prompt library by theme) and 21.5 (retros) have **no designed screen**. | **Build the API now; no FE screen in this hand-off** until Adebayo or the designer supplies one. The only FE touches: "Another" uses the library, and the Today tab can show the retro offer line. Say so if you want the screens designed. |
| **D-JNL-5** | Export format. | A **JSON file** (`journal-export.json`) with every entry decrypted, downloaded over HTTPS. Passcode-gated. Not "encrypted export" as the design says: the copy is changed to "Download all entries". |

## Gaps

Severity: **Sec** > **High** > **Med** > **Low**. "FE" means no API change is needed.

| # | Gap | Evidence | Sev | Plan |
|---|---|---|---|---|
| J1 | **No way to read today's entry; saving overwrites it blind.** | live: no by-date route; `create_entry` upserts on `(startup, founder, date)` | High | `GET /journal/entries/by-date/{date}` (200 entry, 404 `NOT_FOUND`). FE loads today's entry into the editor on open. |
| J2 | **List items too thin for the cards**: no `stress`, no word count, no preview; expand needs a second call. | `JournalEntryListItem` | Med | Add `stress`, `word_count`, `preview` (first 280 chars) to list items. Expand loads the full body from `GET /journal/entries/{id}`. |
| J3 | **No month jump; search decrypts every entry per request, unbounded.** | `search_entries` | Med | `month=YYYY-MM` filter, `GET /journal/entries/months` (month and count), search capped to the 2,000 newest entries. |
| J4 | **No stats**: entries this month, average mood, longest streak, current streak, total, last-12-weeks series, "12 entries this month" pill. | all mock | High | `GET /journal/stats`. |
| J5 | **Mood trend has no `range` and no roadmap annotations** (PRD 21.3: "Launch week" markers). | `GET /journal/mood` only start/end/limit | Med | `range=4w\|12w\|6m\|1y` shortcut and `annotations[]` (milestones completed in range). |
| J6 | **No insight lines and no supportive card** (PRD 21.3; "very low mood for 14+ days", dismissible, at most monthly, no tracking beyond the dismissal). | 404 | High | `GET /journal/insights` (rule-based, pattern-only, never diagnostic), `POST /journal/insights/supportive/dismiss`. |
| J7 | **Prompt card cannot be dismissed or changed.** "Another →" is a toast. No themed library (Decisions / Energy / Team / Wins). | `/journal/prompts` 404 | Med | `POST /journal/prompts/today/dismiss`, `GET /journal/prompts/library?theme=`. |
| J8 | **No journal settings.** "Daily prompt notifications" (PRD 21.4) and "Evening writing reminder" (design) have nothing behind them. | `useState` | Med | `GET/PUT /journal/settings`; scheduler sends in-app `journal.reminder` at 20:00 local when no entry that day (generic text, no content); `journal.prompt.daily` at the mission delivery time if enabled. |
| J9 | **Passcode lock is fake** (D-JNL-1). | page source | High | `PUT /journal/passcode`, `POST /journal/unlock`, `POST /journal/lock`, `DELETE /journal/passcode`; `423 JOURNAL_LOCKED` on content routes. |
| J10 | **Export does nothing** (D-JNL-5). | toast only | Med | `GET /journal/export` (passcode-gated, audit row with counts only). |
| J11 | **"Delete journal permanently" deletes nothing.** | `setEntries([])` | High | `DELETE /journal` with `{"confirm":"DELETE"}`: entries, mood logs, prompts, retros, settings; returns counts. Audit row. |
| J12 | **Retros (PRD 21.5) do not exist**: milestone-linked What worked / What didn't / What we'll change, offered when a milestone completes. | no route | Med | `GET /journal/retros/offers`, `POST/GET/PATCH/DELETE /journal/retros`, `POST /journal/retros/offers/{milestone_id}/dismiss`; retro text encrypted like entries. No FE screen yet (D-JNL-4). |
| J13 | **Entry date comes from `toISOString()` (UTC)**, so a founder in Lagos writing after midnight local lands on the wrong day; the server rejects "future" by its own clock. | `useJournal.ts` line `new Date().toISOString().slice(0,10)` | Med | FE sends the local calendar date; API allows up to one day ahead for timezone skew. |
| J14 | **Stress is faked from mood** (PRD says a 1 to 10 slider labelled "Stress level"). | `MOOD_STRESS` | Med | FE: add the slider. API already accepts 1 to 10. |
| J15 | **`PATCH` with `stress: null` answers "Content cannot be null"** (wrong message and field). | `update_entry` | Low | Fix message and field. |
| J16 | **UI copy makes claims the system does not meet**: "encrypted with a per-workspace key derived from your PIN", "Admins and support staff cannot access... there is no mechanism", "Workspace secure protocol v2.4", "Encrypted as you type" (it is encrypted on save). | page source | Med | FE: replace with the approved copy in the hand-off (accurate to server-side encryption). |
| J17 | **Header "5" badge, history button and the Today header are hardcoded.** | page source | Low | FE: show the real unread count from `GET /notifications/unread-count` or remove the badge; real date. |
| J18 | **A non-founder who opens `/journal` by URL** gets a broken page (all calls 403). | live as TM | Low | FE: show a "Journal is private to the founder" state on 403. |
| J19 | **Autosave** (PRD 21.1) not implemented. | no timer | Med | FE: debounce 2 s and upsert (`POST /journal/entries` is idempotent per date). No API change. |

## Not covered, by decision

AI reflections over entry text (D-JNL-3), device biometrics and encrypted backups (D-JNL-2), a retros screen and prompt-library screen
(D-JNL-4), SA impersonation guard (there is no impersonation feature yet; routes are founder-only regardless).

## Build status

See `cofoundaz-api/docs/sop/` entry `journal-prd-be.md` and the guide `fe-integration-guide-journal.md` (regenerated from live captures).

## Ledger (2026-10-29)

| Item | State |
|---|---|
| API PR | [Cofoundaz-api#198](https://github.com/innocent98/Cofoundaz-api/pull/198), branch `feature/journal-be-gaps`, migration `0080_journal_gaps` (chains after 0077 today; re-chain after Billing 0078 / Calendar 0079 merge). Closes J1 to J12, J13 (API), J15. |
| FE hand-off | `docs/fe-handoff/journal.md` (this PR). FE-only gaps J13 (local date), J14 (slider), J16 to J19 are in its scope and acceptance rows. |
| Open product calls | D-JNL-1 to D-JNL-5 are built to the defaults above; none blocks merging. |
