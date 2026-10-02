# SOP — Dashboard activity fix + profile/workspace menus + Account page

**What shipped:** fixed the broken "Team activity" feed, removed the dead AI
Briefing "Do it" button, fixed the invisible sidebar logo, and wired the
previously-static workspace switcher + profile into real dropdown menus with
Log out and a new read-only Account page. Branch
`fix/dashboard-activity-profile-wiring` → PR to `develop`.

## Why

A round of founder testing surfaced several issues:
- **Team activity** showed every row as "Ade ." with "just now".
- **"Do it"** on the AI Briefing did nothing meaningful.
- The **sidebar logo** ("Cofoundaz") was invisible.
- The workspace switcher chevron and the profile row **did nothing** — no menus,
  no way to view the profile or log out.

## Root causes & fixes

### 1. Team activity ("Ade ." / "just now") — field-name mismatch
The API returns `summary` ("Ade rejected 'QA snooze check'"), `action`, and
`created_at`, but the mapper (`hooks/useDashboardApi.ts`) read `e.verb`,
`e.entity` (empty → "Ade .") and `e.timestamp` (undefined → fell back to
`Date.now()` → everything "just now"). Fix: map `e.summary` + `e.created_at` in
both the fetch and WS paths; render `activity.summary` in the dashboard page
(`app/(dashboard)/dashboard/page.tsx`), with the old actor/verb as fallback.
Types updated in `types/dashboard.ts` + `lib/api/dashboard.ts`.

### 2. "Do it" removed (backend gap)
`handleBriefingDoIt` faked completing a hardcoded task id `'2'` + a canned toast
with **no backend call**; the `core-engine.tsx` variant POSTed to a non-existent
`/dashboard/briefing/{id}/actions/1/accept`. Removed the button + handler + dead
toast state; "Tell me more" (opens the AI drawer — real) is now the single CTA.
Logged the missing endpoint in `backend-requests-ui-gaps.md` §6.

### 3. Sidebar logo invisible — dark-on-dark
`components/CofaundazLogo.tsx` used a near-black wordmark (`#12291F`) on the dark
sidebar (`#061A12`). Its only consumer is the sidebar, so the wordmark is now
white and the badge copper (`#9C5B34`).

### 4. Workspace switcher + profile menus + Account page
Both were static JSX. Now:
- **`hooks/useMe.ts`** + **`lib/api/profile.ts`** (`getMe`, `logout`) read
  `GET /auth/me` (email, profile, memberships) and clear the session.
- **`components/sidebar.tsx`** — switcher is a button opening a dropdown
  (workspaces list with active check + switch-on-click, "Account & profile",
  "Settings & billing"); the profile row opens an upward menu (name/email,
  "View account", "Settings & billing", **Log out**). Outside-click + Escape close.
- **`app/(dashboard)/account/page.tsx`** — new read-only Account page showing
  real `/auth/me` + startup identity, with an honest "editing coming soon" note
  and a disabled "Change photo" (see below).

## Backend gap (logged, not a bug)

There is **no post-onboarding profile/startup update endpoint** and **no user
avatar upload**: `/auth/me` is GET-only and `PATCH /onboarding/state` returns
`409 ONBOARDING_ALREADY_COMPLETE` once onboarding is done. So editing name/role,
startup name/logo, and the user photo are all backend-blocked — the Account page
is read-only and says so. Captured in `backend-requests-ui-gaps.md` §5.

## Verification

| Check | Result |
|---|---|
| typecheck / lint / unit | 0 / 0 / 229 |
| build / e2e | clean / 153 |
| **Live (staging, test account)** | Activity renders real sentences + real relative times ("13d ago"); logo visible (copper C + white wordmark); briefing shows only "Tell me more"; switcher dropdown lists "Kolo ✓" + Account/Settings; profile menu opens with name/email + View account/Settings/Log out; **Log out** cleared `cf_token`/`cf_refresh_token`/`cf_workspace_id` and redirected to `/login`; Account page shows real Ade / adevictor98@gmail.com / Founder & CEO / NG / Kolo. |

## Follow-ups

- Restore profile/startup/avatar editing once the backend endpoints ship (§5/§6).
- Workspace switch is wired (sets `cf_workspace_id` + reload) but only exercised
  with a single membership; re-verify with a multi-workspace account.
