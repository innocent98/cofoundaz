# SOP — Module 22: Notification preferences (email)

## What shipped

The **Preferences** tab on `/notifications` is now real. A member can turn all
notification **emails** on/off (`master_email`) and fine-tune per category, backed
by `GET`/`PUT /notifications/preferences`. Branch `feat/api-notification-prefs` →
PR into `develop`. Completes the Module 7 Notifications follow-up (Slice 2).

## Why

The Preferences tab rendered a mock table with **In-App / Email / Push** columns
across invented categories (Missions/Compliance/Finance/…). That doesn't match the
API at all: preferences govern **email only** (in-app is always delivered, guide
§9), there is **no push channel**, and the catalog is a **fixed set of 5**
categories — not the mock's list.

## How

- **`hooks/useNotificationPreferences.ts`** (new) — `GET /notifications/preferences`
  → `{master_email, categories:{documents, business, roadmap_missions,
  health_assessment, team}}` (all 5 keys always present, defaults-merged, never a
  404). `update(patch)` does the **partial-merge `PUT`** (sends only what changed),
  optimistic with rollback, and reconciles from the server's full effective
  response.
- **`components/notifications/notification-preferences.tsx`** (new) — a
  `master_email` switch plus the **fixed 5 category toggles** (friendly
  labels/descriptions). When `master_email` is off, category toggles are disabled
  and show "muted while email is off" — mirroring the backend rule (both master
  AND category must be true to email; master off mutes all without clearing the
  per-category values).
- **`notifications/page.tsx`** — the Preferences tab now renders the component; the
  mock `preferences`/`togglePreference`/`PreferenceRow` (In-App/Email/Push) are
  gone.

## What's involved

| Path | Change |
| --- | --- |
| `hooks/useNotificationPreferences.ts` | new: GET/PUT preferences (partial merge) |
| `components/notifications/notification-preferences.tsx` | new: master + 5 category toggles |
| `app/(dashboard)/notifications/page.tsx` | Preferences tab → real component; mock removed |

Contract: `cofoundaz-api/docs/fe-integration-guide-notifications.md` §9.

## Verification (live, staging via dev proxy)

- **GET** — Preferences tab loads real defaults (`master_email:true`, all 5
  categories `true`).
- **Category PUT** — toggling **Documents** off → `PUT` **200** (partial merge;
  the other 4 stay true).
- **Master PUT** — toggling **Email notifications** off → `PUT` **200**; all 5
  category toggles grey out and show "muted while email is off" (values preserved
  underneath).
- **Validation** — `PUT {categories:{not_a_category:false}}` → **422
  VALIDATION_ERROR** (the UI only ever sends the fixed 5 keys, so this can't happen
  from the toggles — confirmed the contract directly).
- **Cleanup** — restored all preferences to defaults (`200`).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

## Follow-ups

- **Digest & quiet hours** tab is still mock — there is **no backend endpoint** for
  digest cadence or quiet hours (only `master_email` + categories exist). Leave it
  mock, or hide it, until a backend feature ships. **Announcements** tab is
  likewise not backed by a documented endpoint.
- Keyset pagination on the Inbox feed (`next_cursor`) is a separate Notifications
  follow-up.
