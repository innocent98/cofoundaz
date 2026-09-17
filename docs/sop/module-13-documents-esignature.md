# SOP — Module 13: Documents · E-signature

## What shipped

The Documents **Signatures** page (`/documents/signatures`) now reads the real
signature-request list (`GET /documents/signature-requests`), **sends a file for
signature** (`POST /documents/files/{file_id}/signature-requests` → per-signer
links), and **cancels / reminds** a request. Branch `feat/api-documents-esignature`
→ PR into `develop`.

## Why

The page was static (`signatureRequests` mock) with no create/cancel — nothing
hit the API.

## How — key decisions

- **New `useSignatureRequests` hook** — `GET /documents/signature-requests`
  (workspace list) mapped to the card shape; `createRequest` (`POST
  /documents/files/{id}/signature-requests`, returns one-time `signer_links`),
  `cancelRequest` (`.../{id}/cancel`), `remindRequest` (`.../{id}/remind`).
- **E-signature targets files, not documents** — the create modal picks a **file**
  from the Library (`useDocumentFiles`), unlike Sharing which targets documents.
- **`status` is derived (guide §6)** — `awaiting` / `complete` / `cancelled` /
  `expired`; the pill and "N of M signed" render straight from the server's
  `status` + `signed_count`/`total`, not recomputed client-side.
- **Create modal**: file picker + optional title + a repeatable signer list
  (`{email, name?}`, ≥1) → on success swaps to a panel showing the **per-signer
  `/sign/{token}` links** (shown once — signers also get them by email), with
  copy. Actions per request: **Remind** + **Cancel** (only while `Awaiting`).
- **Legal caveat surfaced** in the UI (guide §11), not buried.

## What's involved

- `hooks/useSignatureRequests.ts` (new) — list/create/cancel/remind + mapping.
- `app/(dashboard)/documents/signatures/page.tsx` — real list, empty state,
  create modal, cancel/remind.

## Verification (live, staging) — full flow

- Empty state renders ("No signature requests yet").
- Uploaded a file ("Investor Agreement.pdf"), then created a request via the UI
  for **two signers** (Ada Investor, Bello Legal) → the modal showed **2 real
  per-signer links** (`https://staging-api.cofoundaz.com/sign/…`).
- The list rendered the request: **Awaiting**, "**0 of 2 signed**", both signers;
  server confirmed `status: awaiting`, `signed_count 0 / total 2`.
- **Cancel verified live** — the request's server `status` flipped to
  `cancelled` and the UI updated to a **Cancelled** pill with the actions gone.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` ✓.

## Follow-ups

- **Public signing** page `GET /sign/{token}` + `POST /sign/{token}` (no auth) —
  the recipient's view/submit flow.
- The **expired** status path (needs a clock past `expires_at`) is coded to the
  guide but not live-verified.
- Signature-request **detail** view (`GET …/{id}`); audit trail (server-side, not
  exposed today, guide §10).
- Mentor **role-gating** (create/cancel/remind are editor-only).
- Last remaining Documents slice: **Templates**.
