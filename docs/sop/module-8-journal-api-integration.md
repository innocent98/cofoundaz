# SOP — Module 8: Journal (real API integration — prompt, entries, save)

## What shipped

The Journal (`/journal`) now reads the live daily prompt and entries list, and
its "Save entry" writes to the real API (`POST /journal/entries`) — with a
graceful "unavailable" state for the server-config error that currently blocks
writes on staging. Branch `feat/api-journal` → PR into `develop`.

## Why

The Journal was fully static — a hardcoded prompt, sample entries, and a
save handler that only pushed a local object. Nothing hit the API.

## How — key decisions

- **New `useJournal` hook** fetches `GET /journal/prompts/today`,
  `GET /journal/entries`, and `GET /journal/mood` in parallel, and exposes
  `saveEntry(content, mood)` → `POST /journal/entries`.
- **`POST` is an upsert** (one entry per founder per date) that **requires
  `date` (YYYY-MM-DD, not future), `content`, `mood` enum, `stress` 1–10**
  (guide §2). The hook sends today's `date`, maps the FE mood label to the API
  enum (`Rough→rough`, `Heavy→meh`, `Steady→okay`, `Good→good`, `Great→great`)
  and derives a 1–5 stress from the mood (the UI has no stress input).
- **Mood + date mapping** on read: API enum → FE label, and ISO `date` →
  "Weekday, Month D". The list carries only `first_line` (no `content`, guide §3
  trap) → used as the snippet; full body on expand is a follow-up.
- **`JOURNAL_NOT_CONFIGURED` handled** (guide §8): `saveEntry` returns
  `{ok:false, unavailable:true}` on that 500 and the page shows "Journal storage
  is temporarily unavailable" rather than a validation error — no retry helps.
- The PIN lock, Mood chart, Reflections and Privacy tabs are unchanged
  (follow-ups).

## What's involved

- `hooks/useJournal.ts` (new) — prompt/entries/mood fetch, mood/date mapping,
  `saveEntry` upsert with config-500 handling.
- `app/(dashboard)/journal/page.tsx` — consume the hook; real prompt; save via
  the hook; removed the hardcoded entries + unused local interface; save button
  shows a saving state.

## Verification (live, staging)

- `GET /journal/prompts/today` → **200**; the Today tab renders the real prompt
  ("What would you change if you could replay today?").
- `GET /journal/entries` → **200** (empty for this account); `GET /journal/mood`
  → **200** (empty).
- **Save path exercised live:** the POST fires with the correct body (it now
  passes validation and reaches the server), and the UI shows the graceful
  **"temporarily unavailable"** toast because staging returns **500
  `JOURNAL_NOT_CONFIGURED`** (missing journal encryption key — see backend
  follow-up).
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- **Backend/ops:** set the **journal encryption key** on staging so
  `POST /journal/entries` stops returning `JOURNAL_NOT_CONFIGURED` and the
  create/list/mood flow can be verified end-to-end. (Same class as the MFA
  encryption key.)
- **Full entry body on expand** — `GET /journal/entries/{id}` (list has only
  `first_line`); **edit** (`PATCH`) and **delete** (`DELETE`) per-entry.
- **Search** (`GET /journal/entries?q=`), **keyset pagination** (`total` vs page
  size), the **Mood** trend chart (hook already fetches `points`), and the
  Reflections/Privacy tabs.
- **Autosave** — debounce + POST the whole entry (upsert is race-safe, guide §2).
