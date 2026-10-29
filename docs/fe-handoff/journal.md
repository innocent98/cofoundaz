# FE hand-off: Journal (`/journal`)

**For:** the FE developer. **Scope:** exactly what is below. Nothing else on the page, no new screens, no new copy beyond what is written here.
**Backend:** API PR [Cofoundaz-api#198](https://github.com/innocent98/Cofoundaz-api/pull/198) (merge first; migration `0080`). **Contract:**
`cofoundaz-api/docs/fe-integration-guide-journal.md` (every body in it was captured from a live run; read it end to end before you start,
section numbers below refer to it). **Gap list:** `docs/checklist/journal-prd-gaps.md`. **Design:** `# Cofoundaz Web App UI Build/Founder Journal.dc.html`.
Files you will touch: `app/(dashboard)/journal/page.tsx`, `hooks/useJournal.ts` (split into more hooks/components if it helps), `lib/api/` helpers.
Use `apiClient` from `lib/api/client.ts` (same-origin `/api/v1`, it already sends the bearer and workspace headers; pass the extra header per call
as `apiClient(path, { headers: { 'X-Journal-Token': token } })`, it is merged, see 2). Read `AGENTS.md`: this is not the Next.js you know.

## 1. Who sees it

Founders only. The sidebar already hides Journal for other roles (`lib/nav-access.ts`). If any journal call returns **403** (someone opened
the URL directly), render one state: "The journal is private to the founder." with no controls and no further calls.

## 2. The lock screen (replaces the fake PIN)

On page load call `GET /journal/settings` (works while locked):

```json
{"data": {"passcode_enabled": false, "locked_until": null, "daily_prompt_notifications": true, "evening_reminder": false}, "meta": null}
```

- `passcode_enabled: false` -> **no lock screen**, go straight to the tabs. (Today the page always starts locked: remove that.)
- `true` -> show the lock screen until `POST /journal/unlock {"passcode": "4821"}` returns `{"data": {"token": "...", "expires_in": 1800}}`.
  Keep `token` **in memory only** (a module variable or context; never localStorage/sessionStorage/cookies) and send it as header
  `X-Journal-Token: <token>` on **every** other `/journal/*` call. After 30 minutes, or on any **423 `JOURNAL_LOCKED`** from any call, drop the
  token and show the lock screen again (keep unsaved editor text in component state so nothing is lost).
- Wrong passcode: **403 `PASSCODE_INCORRECT`**, field error on `passcode`, message "That passcode did not match." (use the design's red line).
- Five wrong tries: **429 `PASSCODE_LOCKED_OUT`**, "Too many wrong tries. Try again in a few minutes." Disable the form until `locked_until`
  from `GET /journal/settings` has passed.
- **Remove "Use device biometrics instead"** (D-JNL-2: not built). Remove the "Workspace secure protocol v2.4" footer.
- Add under the form a small link "Forgot your passcode?": opens a modal asking for the **account password**, calls
  `DELETE /journal/passcode {"password": "..."}`; 200 returns settings with `passcode_enabled: false` and the page opens. 403 `PASSWORD_INCORRECT`
  -> "That password did not match."
- "Lock journal" button in the header: show it **only when `passcode_enabled`**. It calls `POST /journal/lock` (`{"data": {"locked": true}}`),
  clears the token and shows the lock screen.

## 3. Header and tabs

Tabs: Today, All entries, Mood, Reflections, Privacy. **Default tab is Today** (today's code defaults to Privacy "for testing": fix).
Remove the `showToast("Switched to ...")` on tab change and every other "toast on navigation". The bell "5" badge and the History button:
replace with the real notification bell: reuse `components/notification-bell.tsx` and `hooks/useNotifications.ts` (do not write a new one), or remove the button. Never show a hardcoded number.

## 4. Today tab

| Control | Behaviour | Endpoint |
|---|---|---|
| Date heading | The founder's **local** date, e.g. "Thursday, October 29". No hardcoded text. | none |
| "N entries this month" pill | `entries_this_month`; hide the pill when 0 | `GET /journal/stats?today=YYYY-MM-DD` |
| Mood buttons (Rough, Heavy, Steady, Good, Great) | Map to `rough, meh, okay, good, great`. Selecting does **not** toast. | sent with save |
| **Stress slider (new)** | 1 to 10, label "Stress level", default 5. Replaces the derived `MOOD_STRESS` map (delete it). | sent with save |
| Prompt card | Show `prompt` unless `dismissed`. A close (x) button calls `POST /journal/prompts/today/dismiss` and hides the card. **"Another ->"** cycles the client-side list from `GET /journal/prompts/library` (all themes, load once; show the next prompt, wrapping). | `GET /journal/prompts/today`, `POST .../dismiss`, `GET /journal/prompts/library` |
| Editor | On open, `GET /journal/entries/by-date/{today}`. **200** -> load its `content`, `mood`, `stress` into the editor and show "Editing today's entry" under the heading. **404** -> empty editor (normal, show no error). | by-date |
| Autosave | Debounce 2 s after the last keystroke: `POST /journal/entries` with `{date, content, mood, stress}` (it replaces today's entry). Needs content and a mood; until a mood is chosen, show "Pick a mood to save" in the footer instead of saving. Footer shows "Saving...", then "Saved". | `POST /journal/entries` |
| Save entry button | Same call immediately; then switch to All entries. Keep it (design has it). | same |
| Discard | Clears the editor. If an entry for today already exists, ask "Discard your changes? Your saved entry stays." and reload it from the API instead of clearing. | by-date |
| Word count | Client side. | none |
| Footer line | Replace "Encrypted as you type" with "Encrypted when saved" (accurate; see 9). | none |

Dates: build the date string from the browser's **local** `getFullYear/getMonth/getDate`, never `toISOString()`.
Errors on save: 422 -> show `field_errors` under the editor; `500 JOURNAL_NOT_CONFIGURED` -> "Journal storage is temporarily unavailable." (keep
the existing branch in `useJournal.ts`); any other -> "Could not save your entry. Try again." with a Retry that re-sends.

## 5. All entries tab

| Control | Behaviour | Endpoint |
|---|---|---|
| List | Cards in the order returned; each shows mood face, date, `word_count` words, `preview`; page size 20 with a "Load more" button using `skip`. Remove the fake `tags` row (no tags exist). | `GET /journal/entries?skip=&limit=20` |
| Expand (+/-) | On first expand, load the full text with `GET /journal/entries/{id}` and show it; collapse hides it. Remove the toast. | `GET /journal/entries/{id}` |
| Search box | Debounce 400 ms, sends `search=`; searches the full text on the server. Remove the client-side filtering of `fullText`. Empty result: "No entries match." | `GET /journal/entries?search=` |
| Month jump (new, small select above the list) | Options from `GET /journal/entries/months` ("October 2026 (6)"); choosing one sends `month=YYYY-MM` (combine with search); first option "All months". | `GET /journal/entries/months` |
| Edit / delete a past entry | Not in the design. Out of scope. | none |

Empty states: no entries at all -> "Your first entry is two minutes away." with a button to the Today tab. Loading: three skeleton cards.

## 6. Mood tab

- Cards: Entries this month = `entries_this_month` with sub "about {entries_per_week} a week"; Average mood = `average_mood` (map `meh` -> "Heavy",
  `okay` -> "Steady") with sub "up from {previous_month_average_mood.mood} in {month name}" only when that field is non-null, else hide the sub;
  Longest streak = `longest_streak_days` days with sub "in {month of longest_streak_ended_on}" (all from `GET /journal/stats`).
- Chart "Last 12 weeks": `GET /journal/mood?range=12w`. Replace the hardcoded SVG with a line over `points` (mood on a 1 to 5 axis; stress as a
  second muted line or toggle is optional, keep to mood if time is short). Month labels from the points' dates. `annotations` render as small markers on
  their dates, label on hover/tap. Below 2 points show "Write a few more entries to see your shape." instead of a chart.
- A range switch (4 weeks / 12 weeks / 6 months / 1 year) is optional; if you add it, it sends `range=4w|12w|6m|1y`.
- "A pattern worth noticing" card: show the **first** `insights[]` item from `GET /journal/insights?today=` (`title` as the heading, `body` as text).
  If none, hide the card. Remove the hardcoded finance text.
- Supportive card: when `insights.supportive_card` is not null, show it below the chart exactly as returned, gentle styling, with a dismiss button
  calling `POST /journal/insights/supportive/dismiss`.
- Empty (zero entries): "Your mood shape appears after your first entry."

## 7. Reflections tab

Replaces the four hardcoded cards (D-JNL-3: no AI reads the text). Render **every** item of `GET /journal/insights` as a card (`title`, `body`,
kicker from `kind`: `weekday_stress`, `deadline_stress`, `mood_shift` -> "Pattern"; `streak`, `great_days` -> "Worth noticing"). If `entries_needed > 0`:
"Write {entries_needed} more entries to see patterns." The badge stays, with the text "Computed from your mood and stress ratings only" (replace
"Processed privately"). Keep the design's footer disclaimer "This is reflection, not therapy...". Supportive card as in 6, if present.

## 8. Privacy tab

Four toggles become **two** real settings plus a passcode control, using `GET/PUT /journal/settings`:

| Row | Control | Endpoint |
|---|---|---|
| "Let AI read my journal for reflections" | **Remove** (D-JNL-3). | none |
| "Unlock with device biometrics" | **Remove** (D-JNL-2). | none |
| "Include journal in encrypted backups" | **Remove** (D-JNL-2). | none |
| "Evening writing reminder" | Toggle -> `PUT /journal/settings {"evening_reminder": true|false}`; optimistic with rollback on error. Sub-text: "A quiet nudge at 8pm if you have not written that day." | `PUT /journal/settings` |
| "Daily prompt notification" (new row, same style) | Toggle -> `{"daily_prompt_notifications": ...}`. Sub-text: "Today's prompt in your notifications at 9am." | same |
| "Passcode lock" (new row) | Off: button "Set a passcode" -> modal, 4 to 12 digits, confirm field, `PUT /journal/passcode {"passcode"}` (returns a token: keep it, so the page stays open). On: "Change passcode" (modal: current + new + confirm; `current_passcode` sent, 403 `PASSCODE_INCORRECT` shown on the current field) and "Remove passcode" (modal asking the account password, `DELETE /journal/passcode`). | `PUT /journal/passcode`, `DELETE /journal/passcode` |
| "Export all entries" | `GET /journal/export` with the bearer + token headers via `fetch`, then save the blob as `journal-export.json` (anchor download). Label "Download all entries"; helper text "A plain JSON file containing your entries. Keep it somewhere safe." Disable while downloading. `apiClient` only returns JSON, so use a plain `fetch` to `/api/v1/journal/export` with the same three headers it sets (`Authorization: Bearer ${localStorage.cf_token}`, `X-Workspace-Id: ${localStorage.cf_workspace_id}`, `X-Journal-Token`). | `GET /journal/export` |
| "Delete journal permanently" | Opens the existing modal. Replace "All 5 entries" with `total_entries` from stats. Button enabled only when the box equals `DELETE` (existing). On confirm: `DELETE /journal` with body `{"confirm":"DELETE"}`. On 200 clear local state, drop the token, go to the Today tab, toast "Journal deleted permanently." Failure keeps the modal open with the error. | `DELETE /journal` |

**Replace the "How your journal is protected" list with exactly:**
1. "Encrypted at rest. We store your entries as ciphertext, not plain text."
2. "Private to you. Your team, mentors and investors cannot see that entries exist."
3. "Never used to train AI models, ours or anyone else's."
4. "Our assistant and every Cofoundaz feature are blocked from reading your entries." (do not claim "no mechanism" or "even with your permission")

## 9. Cross-cutting rules

- All journal calls go through one wrapper that adds `X-Journal-Token` when held, and converts **423** into "show the lock screen".
- No "coming soon", no toast on every click. A toast only for results of an action (saved, deleted, copied, error).
- Copy: no em or en dashes in rendered text.
- Do not store entry text anywhere in the browser besides React state (no localStorage drafts).
- Loading, empty and error state for every tab; an error state has a Retry button.
- 375 px: the five tabs scroll horizontally (existing `no-scrollbar` strip); cards single column; modals full width with 16 px gutters; the stress slider and mood grid must not overflow.

## 10. Out of scope (do not build)

Retros screen and prompt-library screen (D-JNL-4, no design; the API exists), AI reflections, biometrics, encrypted backups, tags, editing or deleting
a single past entry, an entry detail route, SMS or email reminders, the history drawer.

## 11. Acceptance = the re-walk rows

Done means every row passes on merged `develop`, at 1440 and 375, as a founder (and the role row as a team member), and each result matches the raw
API response.

| # | Row | Pass when |
|---|---|---|
| 1 | Open `/journal`, no passcode | No lock screen; Today tab; real date; "Editing today's entry" only if one exists |
| 2 | Team member opens `/journal` by URL | The "private to the founder" state, no further calls |
| 3 | Write text, pick a mood and stress, wait 2 s | "Saved"; `GET .../by-date/{today}` shows it; reload shows it in the editor |
| 4 | Save again with changed text | Same entry replaced, All entries still shows one card for today |
| 5 | Late-evening local date | The entry's date is the local date (check the request body) |
| 6 | Prompt x and "Another" | x hides it and it stays hidden after reload; Another changes the text |
| 7 | All entries: expand, search, month select, Load more | Expand shows full text; search/month results match the API; no fake tags |
| 8 | Mood tab | Numbers equal `GET /journal/stats`; chart equals `GET /journal/mood?range=12w`; no hardcoded text |
| 9 | Reflections | Cards equal `GET /journal/insights`; empty state under 5 entries; no AI wording |
| 10 | Privacy: reminder + daily prompt toggles | Reload keeps them; `GET /journal/settings` agrees |
| 11 | Set passcode, reload | Lock screen; wrong code shows the error; right code opens; 5 wrong codes lock the form |
| 12 | Lock journal, then open another tab call | Any call without the token shows the lock screen (423 handled) |
| 13 | Forgot passcode with the account password | Lock removed, entries intact |
| 14 | Export | A file `journal-export.json` downloads and holds the entries |
| 15 | Delete modal | Button disabled until `DELETE` typed; after, entries list is empty on reload and the count text was right |
| 16 | Network failure on save | Error with Retry; text kept |
| 17 | 375 px | Every control above reachable, nothing overflows or clips |
