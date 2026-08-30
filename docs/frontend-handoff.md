# Frontend hand-off — take-over guide

Read this first if you're picking up the Cofoundaz web frontend. It tells you
**where we are, the rules that keep the codebase consistent, and how to continue
without reintroducing the problems we just spent time fixing.**

Companion docs:
- **`docs/dashboard-styling.md`** — the design-token cheat-sheet (what to use / what not to). **This is the one you'll reference most.**
- **`README.md`** — product overview, stack, scripts, and project structure.
- **`docs/superpowers/specs/`** — the design spec (source of truth for tokens, routes, a11y).
- **`docs/sop/`** — records of what shipped and why.

---

## 1. Where we are

- **Marketing site** (`/`, `/product`, `/pricing`, `/about`, `/contact`, legal, auth shells): shipped, polished, fully tested.
- **Product app** (`/dashboard` + hubs): pages exist and are **on the design-token system**, but are still **static mock UI** — no real data, no API wiring yet.
- **`develop` is the source of truth** and is **green on every gate**: `typecheck` · `lint` · **188** unit · `build` · **152** e2e.

We recently: restored the design tokens, moved the whole product app onto them, fixed lint/hooks/a11y bugs, removed a `/` splash, and made accent buttons + the sidebar consistent. **Please don't undo those** — the rules below are what prevent a repeat.

---

## 2. Non-negotiables (this is what bit us repeatedly)

### 2a. The design-token system is enforced by a test
`app/globals.css` clears Tailwind's defaults, so **raw Tailwind utilities compile to nothing** and `ui/tokens.test.ts` fails the build if you use them. Always use the tokens:

| Don't | Use |
|---|---|
| `bg/text/border-gray\|slate\|zinc\|stone\|neutral-N` | `…-sage-N` |
| `…-emerald\|teal\|lime-N` | `…-green-N` |
| `…-amber\|orange\|yellow-N` | `…-copper-N` |
| `…-rose\|pink-N` | `…-red-N` |
| `text-black` / hardcoded gold hexes | `text-white` on accent, or a token; **copper**, never brass/gold |
| `rounded-sm/md/lg/xl/2xl/3xl` | `rounded-input/card/modal/pill` / `rounded-[Npx]` (full is fine) |
| `shadow-sm/md/lg/xl/2xl/xs/inner` | `shadow-card/raised/accent` |
| `font-sans/serif/mono` | `font-body` / `font-display` |
| `sm:` prefix | `md:` (base = the small-screen design; `md` = 640px here) |
| unescaped `'` in JSX text | `&apos;` (JSX text only — never in JS strings) |

Need a shade that isn't defined? **Add it to `@theme` in `globals.css` AND to `RAMP_SHADES` in `ui/tokens.test.ts`.** Never fall back to a default Tailwind color or a hardcoded hex.

### 2b. The accent button = copper-600 + **white** text
Every primary/accent button is `bg-copper-600` (`#9C5B34`) with **white** text and a `copper-700` hover. Black/dark text on copper is both inconsistent and fails WCAG AA (3.5:1). If you add a button, copy this.

### 2c. Accessibility is a gate, not a nice-to-have
The marketing routes run axe in e2e (WCAG AA). Keep text contrast ≥ 4.5:1. The dashboard routes aren't in the e2e sweep yet, so **check contrast by eye** on new dashboard UI (that's how the black-on-copper and low-contrast auth text slipped in).

### 2d. Never force-push shared branches
Force-pushing `develop` (or a shared feature branch) wiped the CI workflow twice and lost review history. Use normal pushes and PRs.

---

## 3. Structure you should follow

```
app/
  (marketing)/   → public site, WITH SiteHeader/Footer. `/` lives here.
  (auth)/        → login/signup shells, no chrome
  (dashboard)/   → the product app; layout.tsx wraps every page
  globals.css    → the design tokens (@theme)
ui/              → shared components (primitives + marketing sections). Portable.
components/      → dashboard-specific chrome (Sidebar, DashboardNavbar)
content/         → all marketing copy as typed modules (edit copy here, not in JSX)
docs/            → specs, SOPs, and the two styling/hand-off guides
```

- **Marketing pages** compose `ui/marketing/*` sections fed by `content/*` — keep copy in `content/`.
- **Dashboard pages** currently render `<Sidebar>` **per page**. That's fragile — it's exactly why `/investor-readiness` shipped with no sidebar. **Recommended: move the sidebar into `app/(dashboard)/layout.tsx` once** and delete the per-page copies (see Open items).

---

## 4. The gates — run before every push

CI runs these on every PR to `develop`/`main`. Run them locally first:

```bash
npm run typecheck && npm run lint && npm test && npm run build
npm run test:e2e        # first time: npx playwright install
```

All must be green. `lint` must be **0 errors**.

---

## 5. How to continue

1. `git checkout develop && git pull`
2. `git checkout -b feat/<your-thing>`
3. Build against §2/§3 and `docs/dashboard-styling.md`.
4. Keep all gates green; open a PR **into `develop`**.
5. One logical change per commit; clear messages.

---

## 6. Open items to pick up (in rough priority)

1. **Wire the dashboard to the API.** Every dashboard page is static mock data today — this is the real next body of work (connect to `cofoundaz-api`: auth, Health Score, assessment, roadmap, etc.).
2. **Two homes.** `app/home/page.tsx` (a newer landing) and `app/(marketing)/page.tsx` (the original, now serving `/`) both exist. Pick one canonical home and remove the other.
3. **Centralize the sidebar** in `app/(dashboard)/layout.tsx` and remove the per-page copies (prevents the missing-sidebar class of bug).
4. **Hardcoded green/neutral hexes** remain in the dashboard (e.g. `bg-[#12291F]`). They're on-brand but literal — convert to token classes as you touch each page.
5. **22 `no-unused-vars` warnings** (unused icon imports across dashboard pages). Don't fail CI, but clear them as you go.

---

## 7. If something looks unstyled or off-brand
It's almost always a cleared Tailwind default rendering nothing, or a raw hex. Run `npm test` — `ui/tokens.test.ts` will name the file and line. Fix per §2a.
