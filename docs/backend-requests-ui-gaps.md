# Backend requests — UI features the frontend can't build yet

These are designed screens (in the PRD + UI comp) that the FE **cannot build
honestly** because no API exists to back them. Listed so the backend team can
prioritise. The FE will wire each the moment the endpoints ship. Complements the
integration-blockers in [`api-integration-handoff.md`](./api-integration-handoff.md#-backend-blocked-relay-to-the-api-team).

Verified against `cofoundaz-api` on 2026-09-19 — the endpoint set is
assessments / auth / business / dashboard / documents / health / invitations /
jobs / journal / learning / mission / notifications / onboarding / roadmap.

---

## 1. Team Directory & member management  — *no members API at all*
**PRD 23.5.** The `Membership` model exists but nothing exposes it over HTTP;
`/auth/me` returns only the caller's own membership, not the roster. Invite
*create* (`POST /onboarding/invites`) and *accept* (`POST /invitations/accept`,
`GET /invitations/{token}`) exist and are wired — everything else is missing.

Needed:
- `GET /workspace/members` (or `/startups/{id}/members`) → list: user id, name,
  email, role, status (active/pending/suspended), last-active, is-you, avatar.
- `PATCH /workspace/members/{user_id}` → change role.
- `DELETE /workspace/members/{user_id}` → remove a member.
- `GET /workspace/invitations` + `DELETE /workspace/invitations/{id}` → list &
  revoke pending invites (there's no way to list pending invites today).
- Seat usage: seats used / total, and which roles are "free" professional
  collaborators (the comp shows "3 of 5 seats used · 2 professional collaborators").

## 2. Notifications → Archived  — *no archive/restore*
**PRD 20.4.** `notifications.py` has `GET /notifications`, `/unread-count`,
`POST /{id}/read`, `/read-all`, `GET/PUT /preferences`, stream — but no archive.
Needed: `POST /notifications/{id}/archive`, `POST /notifications/{id}/restore`,
and an `?archived=true` filter (or a status field) on the list.

## 3. Journal → Retrospectives  — *not a backend concept*
**PRD 21.5.** Journal supports entries, mood trends, and prompts, but there is no
"retrospective" object. Also note journal **writes still 500** (`JOURNAL_NOT_CONFIGURED`)
until the encryption key is set on staging. Needed: a retro model/endpoints, or a
decision that retros are just a saved-view over entries (then expose a filter).

## 4. Calendar & reminders  — *no calendar backend*
**PRD 19.4.** There is no calendar/reminders API whatsoever. The FE calendar is
entirely mock. Needed: events CRUD + per-event-type reminder-offset rules before
any of it can be wired.

---

## Already relayed (from the integration pass) — still open
- **Assessment** question prompts missing from `serialize_question`.
- **AI-fill** worker (jobs enqueue but never drain).
- **Journal** encryption key on staging.
- **Emailed sign/share link host** (`SERVER_HOST` points at the API, not the FE origin).
- **MFA**: no **disable/reset** endpoint; **SMS** setup/verify are `FeatureNotEnabled`
  stubs; confirm `MFA_ENCRYPTION_KEY` in prod (it is set on staging).
