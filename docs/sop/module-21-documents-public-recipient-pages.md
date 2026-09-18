# SOP — Module 21: Documents · public recipient pages (`/sign`, `/shared`)

## What shipped

The two **public, unauthenticated** recipient pages that complete the Documents
sharing + e-signature features:

1. **`/sign/{token}`** — a signer opens the emailed link, reviews the file, and
   signs by typing their name.
2. **`/shared/{token}`** — a recipient opens a shared document read-only.

Branch `feat/api-documents-public` → PR into `develop`.

## Why

Modules 11–13 shipped the sender side (create shares, send for signature) and
returned the per-recipient links, but the recipient-facing pages those links
point at were mock (`/sign`) or missing (`/shared`) — a recipient with no login
had nowhere real to land.

## How

Both pages are **public** (no `Authorization`, no `X-Workspace-Id`) and live
outside the dashboard/auth route groups (`app/sign/[token]`, `app/shared/[token]`).
They read the token with `useParams()` and call the API through `apiClient` (which
sends no auth header when logged out; `/sign/`+`/shared/` are already exempt from
the global 401-redirect).

- **`/sign/[token]`** — `GET /sign/{token}` renders the request title, the file
  (filename/size, "Open" link when `url` is http), and greets the signer by their
  own identity. Signing `POST /sign/{token}` `{typed_name}` → a confirmation from
  `signed_count`/`total`/`status` ("1 of 2 signed" vs "complete"). The response
  carries **no `signers[]`** (privacy-scoped), so the page shows only counts. A
  uniform **404** (unknown / already-signed / cancelled / expired) → one
  "this link is no longer valid" state.
- **`/shared/[token]`** — `GET /shared/{token}` renders the document
  (title/status/version + sections, the same full shape as the authenticated
  `GET /documents/{id}`), a **"View only"** badge from `access_level`, and the
  `expires_at` date. Same uniform-404 invalid state.

## What's involved

| Path | Change |
| --- | --- |
| `app/sign/[token]/page.tsx` | mock → real `GET`/`POST /sign/{token}` signing flow |
| `app/shared/[token]/page.tsx` | new: public `GET /shared/{token}` document viewer |

Contract: `cofoundaz-api/docs/fe-integration-guide-documents-esignature.md` §3–§4;
`…-documents-sharing.md` §5.

## Verification (live, staging via dev proxy)

Created a real signature request (2 signers) + a shared document via the API to
capture live tokens (`signer_links` / share `link`), then drove both pages
**logged out** (localStorage cleared):

- **Sign** — `GET /sign/{token}` **200** → "Investor Agreement", file
  "agreement.txt · 28 B", "Hi signer1@example.com". Typed "Ada Investor" →
  `POST /sign/{token}` **200** → "1 of 2 signed". Reloading the consumed link →
  **404** → "this link is no longer valid".
- **Shared** — `GET /shared/{token}` **200** → "Business Plan · Draft · v1 · Link
  expires October 18, 2026", "View Only" badge, all template sections. Revoked the
  share (`DELETE …/shares/{id}` 200) → public GET **404** → invalid state renders.
- Gates: `typecheck` 0 · `lint` 0 errors · **188** unit · clean `build` · e2e ✓.

## Follow-ups

- **Backend/ops:** the emailed links are built as `{SERVER_HOST}/sign|shared/{token}`
  and `SERVER_HOST` currently points at the **API host**, not the FE origin — so
  today the emailed link opens raw JSON, not these pages (tracked backend
  follow-up). Point `SERVER_HOST` (or a dedicated public-links base) at the FE
  origin for the links to land here.
- File rendering on `/sign` is metadata + an "Open" link; an inline PDF/preview
  viewer (shared with the Slice-2 file viewer) is a nice-to-have.
- No "decline to sign" action in v1 (backend doesn't offer one).
