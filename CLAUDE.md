# Camp Away Design

Rental platform for affordable, SUV-towable tiny trailers. Renters design the trailer they want; the platform matches it to an available unit or reserves a build. Always a rental — never a purchase. Designs stay within the standardized small SUV-towable envelope.

**Status:** MVP prototype, Vite + React SPA with in-memory + localStorage data layer. Migrating to Next.js App Router + Supabase.

Read before building:
- [docs/prd/overview.md](docs/prd/overview.md) — product requirements, domain rules, out-of-scope
- [docs/prd/floorplan-review.md](docs/prd/floorplan-review.md) — floorplan upload flow, roles, MVP toggle
- [docs/architecture/stack.md](docs/architecture/stack.md) — stack, data layer, conventions, accessibility
- [docs/decisions/](docs/decisions/) — ADRs for key decisions

## Stack (current → target)

- **Vite + React SPA** → **Next.js App Router + React + TypeScript**
- **Tailwind v4** (new screens) — warm stone / forest-green palette. Legacy CSS Modules components are unused.
- **Supabase** (Postgres + Storage + optional Auth) behind the data-layer seam — never imported directly in components.
- **Vitest + RTL** for unit/component tests; **Playwright** for e2e.

Details: [docs/architecture/stack.md](docs/architecture/stack.md)

## Commands

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # tsc + vite build
npm run test:run   # vitest once
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Before declaring done: typecheck + lint + unit tests + relevant Playwright e2e specs must pass.

## Key conventions

- **TypeScript strict** — no `any`; domain types in `src/types/`
- **Data layer seam** — all reads/writes via repository in `src/data/`; never import Supabase or fixtures from components
- **Accessibility is non-negotiable** — semantic HTML, labeled controls, announced validation, keyboard operability, WCAG AA
- **State:** `useState`/`useReducer` first; ask before adding a shared store
- **Tests:** `getByRole`/`getByLabelText` in RTL, assert a11y state; Playwright for critical journeys

