# CampAwayDesign

CampAwayDesign is a web app for collaborating on **affordable, SUV-towable tiny trailer homes** — clients submit requirements, design firms upload floorplans, and both sides comment, revise, and approve in one place.

**Status:** MVP prototype, frontend-only. Full product spec lives in `../../docs/prd.md` — read it before adding features. This CLAUDE.md is the source of truth for *how* we build; the PRD is the source of truth for *what* we build.

## Who I'm working with

**Calvin Nguyen** — senior frontend engineer, ~9 years with **deep expertise in Angular and TypeScript**, plus **some React experience**.

- Assume expert-level TypeScript and frontend architecture instincts — skip the basics and lead with the decision and the trade-off, not a tutorial.
- React is the *less* familiar framework here. When something is React-specific or differs from the Angular mental model (hooks/effects lifecycle, render behavior, state colocation vs. services/DI), it's worth a brief note on the *why*, not just the *how*. Don't assume deep React idiom fluency.
- Calvin values, and will judge the work on: **user experience, input validation, system reliability, and accessibility.** Treat these as first-class requirements, not polish — validate inputs thoroughly, handle error/empty/loading states, keep flows resilient, and make UI accessible (semantic HTML, labels, keyboard, ARIA where needed). Flag gaps in these areas rather than shipping past them.

## Stack

- **Vite + React + TypeScript** (SPA, no SSR)
- **CSS Modules** for styling — no Tailwind, no CSS-in-JS
- **Vitest + React Testing Library** for tests
- **No backend.** All data is mock/in-memory behind a typed data layer (see below).

## Commands

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # tsc + vite build
npm run preview     # serve the production build locally
npm test           # vitest (watch)
npm run test:run   # vitest once (use this in CI / before committing)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Before declaring work done: `npm run typecheck && npm run lint && npm run test:run` must pass.

## Architecture

```
src/
  main.tsx              # entry
  App.tsx               # routes / top-level layout
  routes/               # one folder per page (Brief, FloorplanReview, ...)
  components/            # reusable presentational components
  features/             # domain features (requirements, floorplans, approvals)
  data/                 # the swappable data layer — SEE BELOW
  types/                # shared domain types (Project, Floorplan, Requirement...)
  lib/                  # framework-agnostic helpers
```

Co-locate each component with its `.module.css` and `.test.tsx` in the same folder.

## The data layer is the most important convention

There is **no real backend yet**, but the app must be built as if there will be one. All reads/writes go through a single repository interface in `src/data/` — components never touch `localStorage`, mock arrays, or fixtures directly.

- Define interfaces like `ProjectRepository`, `FloorplanRepository` in `src/data/`.
- The MVP implementation is in-memory + `localStorage`, seeded from fixtures in `src/data/fixtures/`.
- File "uploads" (reference images, floorplans) are simulated — store object URLs / base64 in the mock store; do not assume a real upload endpoint.
- Keep all mock-specific logic (latency simulation, ID generation, persistence) inside `src/data/`. Swapping to a real API later should mean writing a new implementation of the same interface, nothing else.

If you're tempted to read mock data from a component, stop — add a method to the repository instead.

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
- **Accessibility matters** for forms and the floorplan review flow — label inputs, support keyboard, use semantic elements. Test with RTL queries by role/label, not test IDs.
- **Tests:** write a test alongside any new feature logic, repository method, or form validation. Prefer testing behavior through the component (RTL) over implementation details.
- State: local `useState`/`useReducer` first. Only reach for a shared store if two distant components genuinely need the same state — ask before adding a state library.

## Out of scope for the MVP (do not build without asking)

Per the PRD non-goals: payments/contracts, real auth, structural/engineering calculations, auto-generated floorplans (no AI design), construction logistics, and a native mobile app. The web app is responsive but web-only.
