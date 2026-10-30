# Message to the FE developer: Team, Journal, Notifications

Hi! Three pages are ready for you: **Team**, **Journal** and **Notifications**. Their backend is merged to `develop`, and each one
has an exact brief. Please read this whole message before you start.

## How we got here (what's behind each brief)

Every page goes through the same steps. Your briefs are the output of steps 1 to 3:

1. **PRD + UI pass.** We walked the page against the PRD and the design and listed every gap: what's mock, what's missing, what's
   wrong. The gap lists are `docs/checklist/{team,journal,notifications}-prd-gaps.md`.
2. **Backend built and captured live.** Every gap that needed an API was built and merged. Every request and response in the FE
   integration guides (`cofoundaz-api/docs/fe-integration-guide-{team,journal,notifications}.md`) was copied from a real run, not
   written from the code. So trust the guide's field names, nesting, status codes and error strings exactly as written.
3. **Exact-scope brief.** `docs/fe-handoff/{team,journal,notifications}.md` says exactly what to build on each page: every control,
   which endpoint it calls, its states, and its copy. Each brief also has an **"Out of scope (do not build)"** section and an
   **"Acceptance = the re-walk rows"** section.
4. **You build it** (your part).
5. **Re-walk.** When your PR is ready, the page is checked by clicking **every control** at **1440px and 375px wide**, as **every
   role** the brief names (founder, team member, and the others). A page is done only when every row passes on merged `develop`.
   A quick look doesn't count. Run the brief's acceptance rows yourself before you ask for review.

## Order

1. **Team** (`docs/fe-handoff/team.md`)
2. **Journal** (`docs/fe-handoff/journal.md`)
3. **Notifications** (`docs/fe-handoff/notifications.md`)

Use one branch and one PR per page.

## Rules (strict)

- **Always branch from the latest `develop`:**
  `git checkout develop && git pull origin develop && git checkout -b feature/team-fe` (then `feature/journal-fe`,
  `feature/notifications-fe`).
  Before you open or update a PR, pull `develop` again and merge or rebase it into your branch so you're current.
- **Open your PR to `develop` only.** Never to `main`, and never into another person's branch. **Don't merge your own PR.**
  Adebayo reviews and merges it.
- **Stay inside the brief.** Don't add screens, copy, features or "nice to haves" it doesn't list. If something in the brief looks
  wrong, or the API doesn't answer the way the guide says, **stop and ask**, and send the request and response you saw. Don't work
  around it in the FE.
- **Read `AGENTS.md` first.** This project uses a newer Next.js with breaking changes, so check its docs in
  `node_modules/next/dist/docs/` before you rely on older habits.
- **Remove the mock data** the brief names. No hardcoded arrays may be left on the page.
- **Touch only the files for your page**, plus new hooks and components for it. Don't change shared components (sidebar, layout,
  colour tokens, `components/ui/*`) without asking first.
- **Run these before every push** (they're the same commands CI runs):
  `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. CI must be green on your PR before review.
- Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` as shown in `.env.example` (staging, or a local API if you have one). Never commit
  `.env.local` or any key.

## Things you'll see that are not bugs

- **Journal on staging:** saving an entry returns 500 `JOURNAL_NOT_CONFIGURED` until we set the journal key there. Reads work.
  Build the error state as the brief says, and tell us if you need writes working to test.
- **Notifications:** the digest and quiet-hours settings save, but no digest email is sent yet (that's a later backend task).
  Build only the settings UI.
- **Team:** it's a light page by decision: no Tasks, no Directory, no permission matrix, no seat counts.

## When you open a PR

In the PR description, list each acceptance row from the brief as passed or not, at 1440 and 375, for each role, and add a few
screenshots. Then tell us it's ready for the re-walk.

Thanks!
