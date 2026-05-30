# Camp Away Design

Camp Away Design is a web app for **renting affordable, SUV-towable tiny trailers** through a **design front door** — renters *design* the trailer they want, the platform matches that design to an **available** unit in its fleet, and a renter can **save** a design or, when nothing matches, **reserve a build** of it that's held for them to rent once built (after which it joins the general fleet). Fleet ops also commissions third-party **builders** against aggregate demand to grow the fleet. It is still a **rental** platform, not design-and-own: renters **rent**, they never buy or own the trailer — designing/reserving a build always results in a rental, never a purchase, and designs stay within the standardized small SUV-towable envelope (no fully bespoke one-offs).

**Status:** MVP prototype, frontend-only. Full product spec lives in `../../docs/prd.md` — read it before adding features. This CLAUDE.md is the source of truth for *how* we build; the PRD is the source of truth for *what* we build.

## ⏳ Redesign migration (in progress, 2026-05-30)

We are porting the Figma Make redesign **"CampAwayDesign-Modernize"** (Figma file key `IieelMEAXBI92AQULNseDx`, a `/make/` file — read it via `get_design_context` with `nodeId 0:1`, then `ReadMcpResourceTool` on the returned `file://figma/make/source/...` URIs **without** the `?fileKey=` suffix). Two decisions drove this (confirmed with Calvin):

1. **Hybrid styling** — adopt **Tailwind v4**, keep the **repository data-layer seam**. (So the "no Tailwind / CSS Modules only" rule below is now superseded for new screens — see Stack note.)
2. **Adopt the new IA** — the product is now framed as **Projects → requirement brief → project view → floorplan review → admin dashboard**, replacing the old rental/fleet/match/reserve-a-build screens.

**Done:** Tailwind wired (`@tailwindcss/vite` in `vite.config.ts`, `src/styles/index.css` is the entry, imported in `main.tsx`); `react-router` + `lucide-react` installed. New domain in `src/types/index.ts` (Project, TrailerBrief, Floorplan, Comment, Firm, DashboardStats). New `ProjectRepository` interface (`src/data/types.ts`) + `InMemoryProjectRepository` (`src/data/inMemoryProjectRepository.ts`, localStorage-backed) + `src/data/fixtures.ts` (Maria & Jon, etc.). Five route screens under `src/routes/{ProjectList,RequirementForm,ProjectView,FloorplanReview,AdminDashboard}` wired to `projectRepository`, plus `src/components/AppNav.tsx` + `ImageWithFallback.tsx`, `src/routes.tsx`, and `src/lib/projectStatus.ts` (status→pill mapping, always renders a text label so colour isn't the only signal). Old rental files (routes, matching/fleetMetrics/specSummary libs, inMemoryRentalRepository, old statusDisplay, App.module.css) were deleted. `constraints.ts` kept (brief validation). typecheck + lint + `npm run build` are **green**.

**Gotcha (Node 24):** `localStorage` is a native Node global that is `undefined` without `--localstorage-file`, and it **shadows jsdom's** `window.localStorage` in the vitest jsdom env. Fixed in `src/setupTests.ts` (in-memory polyfill). Run unit tests with `npx vitest run --project unit` (the `unit` project is jsdom; the second `storybook` project needs a Playwright browser).

**Verified green:** `npx tsc --noEmit`, `npx eslint .`, `npm run build`, and `npx vitest run --project unit` (33 tests) all pass as of 2026-05-30.

**Remaining (optional):** add ProjectList/ProjectView/FloorplanReview/AdminDashboard component tests; verify visually in the browser (`npm run dev`); then fold this section's permanent decisions into the body below and delete this status block.

## Who I'm working with

**Calvin Nguyen** — senior frontend engineer, ~9 years with **deep expertise in Angular and TypeScript**, plus **some React experience**.

- Assume expert-level TypeScript and frontend architecture instincts — skip the basics and lead with the decision and the trade-off, not a tutorial.
- React is the *less* familiar framework here. When something is React-specific or differs from the Angular mental model (hooks/effects lifecycle, render behavior, state colocation vs. services/DI), it's worth a brief note on the *why*, not just the *how*. Don't assume deep React idiom fluency.
- Calvin values, and will judge the work on: **user experience, input validation, system reliability, and accessibility.** Treat these as first-class requirements, not polish — validate inputs thoroughly, handle error/empty/loading states, keep flows resilient, and make UI accessible (semantic HTML, labels, keyboard, ARIA where needed). Flag gaps in these areas rather than shipping past them.

## Stack

- **Next.js (App Router) + React + TypeScript** — server components for data fetching, client components for interactivity.
- **Styling: Tailwind v4** (adopted in the redesign migration — see the status block above). Use the warm stone / forest-green palette as arbitrary values (e.g. `bg-[#2f6f4f]`, text `#1c1a17`, muted `#6b6560`, surface `#fff`, border `#e3e0da`, bg gradient `#f7f6f3`→`#ebe9e3`). The few remaining CSS-Module components under `src/components/{Button,Card,Input,Toggle,StatusBadge}` are legacy and unused by the new screens. _(Historical: the project was originally CSS Modules, no Tailwind.)_
- **Supabase** as the backend — **Postgres** (database), Supabase Storage (reference-image & trailer-photo uploads), and optionally Supabase Auth. Always accessed **behind the data layer** (see below), never imported directly into components/pages.
- **Testing:** **Vitest + React Testing Library** for unit/component tests; **Playwright** for end-to-end flows (design → match → confirm; design → no match → reserve build; commission build) and as the browser runner for Storybook component tests.

> **⚠️ Migration in progress.** The codebase today is still **Vite + React SPA** with an **in-memory + `localStorage`** data layer — the stack above is the **target**. Migrate incrementally and keep the typed data-layer interface as the seam, so swapping in Supabase is a new implementation, not an app-wide rewrite. Until a section is migrated, the existing Vite tooling still applies.

## Commands

Current (Vite — pre-migration):

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # tsc + vite build
npm test           # vitest (watch)
npm run test:run   # vitest once (use this in CI / before committing)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Target (after migration — update package.json scripts as you go):

```bash
npm run dev          # next dev   (http://localhost:3000)
npm run build        # next build
npm run start        # next start (serve the production build)
npm run test:run     # vitest run (unit/component)
npm run test:e2e     # playwright test (end-to-end flows)
npx supabase start   # local Supabase stack (Postgres) via the Supabase CLI
npx supabase db push # apply migrations to the linked project
```

Before declaring work done: typecheck, lint, unit tests, **and** the relevant Playwright e2e specs must pass.

## Architecture

Current (Vite SPA):

```
src/
  main.tsx              # entry
  App.tsx               # client-side view switching / top-level layout
  routes/               # one folder per page (RequestRental, FleetDashboard, ...)
  components/            # reusable presentational components
  features/             # domain features (rental requests, fleet matching, builds)
  data/                 # the swappable data layer — SEE BELOW
  types/                # shared domain types (Trailer, TrailerDesign, RentalRequest, Reservation, BuildOrder, Builder...)
  lib/                  # framework-agnostic helpers
```

Target (Next.js App Router): pages move to `app/` route segments (`app/page.tsx`, `app/fleet/page.tsx`, …). Prefer **server components** that call the repository for data fetching; mark interactive pieces `'use client'`. `components/`, `features/`, `data/`, `types/`, and `lib/` keep their roles. e2e specs live in `e2e/` (Playwright).

Co-locate each component with its `.module.css` and unit `.test.tsx` in the same folder. Playwright e2e specs live in `e2e/`, not beside components.

## The data layer is the most important convention

All reads/writes go through a single repository interface in `src/data/` — components, pages, route handlers, and server components never touch `localStorage`, mock arrays, fixtures, **or the Supabase client** directly. This interface is the seam that makes the Vite→Next.js/Supabase migration safe.

- The interface lives in `src/data/types.ts` (`RentalRepository` — fleet, trailer designs, rental requests, reservations, builds, builders).
- **`InMemoryRentalRepository`** (in-memory + `localStorage`, seeded from `src/data/fixtures.ts`) stays as the implementation for **tests and local development without Supabase**.
- **`SupabaseRentalRepository`** is the **production** implementation of the same interface — Postgres tables mirror the domain types in `src/types/`; keep a SQL migration per table. All Supabase queries live here only.
- File uploads (reference images, trailer photos): **Supabase Storage** in production (store the object path/URL on the row); the in-memory impl keeps simulating with object URLs / base64. Components just call the repository — they don't know which backend answers.
- Keep all backend-specific logic (Supabase client, SQL, auth context, latency simulation, ID generation) inside `src/data/`. Selecting the implementation happens in one place (`src/data/index.ts`).

If you're tempted to import the Supabase client (or read mock data) from a component or page, stop — add a method to the repository instead.

## Domain rules (from the PRD — encode these, don't restate them in prose)

These are real constraints the UI should reflect (defaults, validation hints, labels):

- Trailer size target: **16–18 ft**
- Sleeps **2 adults**
- Includes a **wet bath** (combined shower/toilet) and a **compact kitchenette**
- **Optional** solar + battery upgrades (toggle, off by default)
- Target loaded weight **under ~5,000 lbs** (towable by many SUVs)
- Budget target **under ~$50k**

Put these as typed constants in `src/lib/` (e.g. `TRAILER_CONSTRAINTS`) rather than hardcoding numbers across components.

## Conventions

- **TypeScript strict.** No `any`; model the domain with explicit types in `src/types/`.
- **Functional components + hooks** only. Extract non-trivial logic into custom hooks or `lib/` so it's unit-testable without rendering.
- **CSS Modules:** `Component.module.css`, classes in `camelCase`, import as `styles`. Keep shared tokens (colors, spacing) in a single `src/styles/tokens.css` and reference via CSS variables.
- **Accessibility is a first-class, non-negotiable requirement** — not polish. See the **Accessibility** section below for the concrete checklist; every component and flow is expected to meet it.
- **Tests:** write a unit/component test (Vitest + RTL) alongside any new feature logic, repository method, or form validation — prefer testing behavior through the component (RTL) over implementation details. Cover each critical user journey (design → match → confirm; design → no match → save/reserve a build; commission a build that grows the fleet) with a **Playwright** e2e spec in `e2e/`.
- State: local `useState`/`useReducer` first. Only reach for a shared store if two distant components genuinely need the same state — ask before adding a state library.

## Accessibility (frontend work is judged on this)

Accessibility is a core acceptance criterion for every frontend change here, equal to correctness. Don't ship UI that fails these; flag gaps rather than skipping them.

- **Semantic HTML first.** Use real `button`, `nav`, `main`, `ul`/`li`, and ordered headings. Reach for ARIA only to fill gaps the platform can't express — never to patch a non-semantic element you could have used directly.
- **Labels on every control.** Each input/select has an associated `<label>` (`htmlFor`/`id` or wrapping). Placeholders are not labels.
- **Validation is announced.** On error, set `aria-invalid` on the field, render the message in an element referenced by `aria-describedby`, give it `role="alert"`, and move focus to the first invalid field on submit.
- **Full keyboard operability.** Every interactive element is reachable and operable by keyboard (Tab/Shift+Tab, Enter/Space). Custom controls expose the right role/state (e.g. a switch uses `role="switch"` + `aria-checked`, or a native `checkbox`).
- **Visible focus.** Preserve `:focus-visible` outlines; never remove an outline without an equally clear replacement.
- **Color is never the only signal.** Pair color with text/icon (e.g. status badges show a label, not just a hue). Meet WCAG AA contrast.
- **Images & icons.** Meaningful ones get `alt`/accessible names; decorative ones are `aria-hidden`.
- **Test it by behavior.** Use RTL `getByRole`/`getByLabelText` (not test IDs), and assert a11y state — `aria-invalid`, `role="alert"`, checked/expanded — in tests.

## Out of scope for the MVP (do not build without asking)

Per the PRD non-goals: selling/financing/brokering trailer **ownership** (this is rental-only — designing or reserving a build still ends in a rental), **fully bespoke one-off builds** (designs must fit the standardized small envelope; a reserved build re-enters the general fleet after the reserving renter's rental), rental payments/deposits/billing (including reservation deposits), structural/engineering or towing-safety certification, managing builders' construction scheduling/procurement/logistics, anything outside the **small** SUV-towable category, and a native mobile app. The web app is responsive but web-only.

> **Note:** reserving a build *is* now in scope — a renter's no-match design can trigger a build that's held for them. This reverses the earlier "renters match available fleet only" rule; see `../../docs/prd.md` for the design → match → save/reserve flow.
