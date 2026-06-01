# Architecture & Stack

## Stack

| Layer | Current (Vite SPA) | Target (Next.js) |
|---|---|---|
| Framework | Vite + React SPA | Next.js App Router + React |
| Styling | Tailwind v4 (new screens) + legacy CSS Modules | Tailwind v4 |
| Data layer | InMemory + localStorage | Supabase (Postgres + Storage) |
| Auth | None | Supabase Auth (optional) |
| Testing | Vitest + RTL (unit) | Vitest + RTL (unit) + Playwright (e2e) |

**Tailwind palette** (use as arbitrary values, e.g. `bg-[#2f6f4f]`):

| Token | Value |
|---|---|
| Text | `#1c1a17` |
| Muted | `#6b6560` |
| Surface | `#fff` |
| Border | `#e3e0da` |
| BG start | `#f7f6f3` |
| BG end | `#ebe9e3` |
| Forest green | `#2f6f4f` |

> Migration in progress. Keep the typed data-layer interface as the seam — swapping in Supabase is a new implementation, not an app-wide rewrite.

## Project structure

```
src/
  main.tsx              # entry
  App.tsx               # top-level layout / routing
  routes/               # one folder per page
  components/           # reusable presentational components
  features/             # domain features
  data/                 # swappable data layer (see below)
  types/                # shared domain types
  lib/                  # framework-agnostic helpers
  styles/               # index.css (Tailwind entry), tokens.css
```

Target (Next.js App Router): pages move to `app/` route segments. Prefer server components for data fetching; mark interactive pieces `'use client'`. `components/`, `features/`, `data/`, `types/`, `lib/` keep their roles. e2e specs in `e2e/` (Playwright).

Co-locate each component with its `.test.tsx` in the same folder.

## Data layer

**The most important convention.** All reads/writes go through the repository interface — components and pages never touch `localStorage`, mock arrays, fixtures, or the Supabase client directly.

- Interface: `src/data/types.ts` (`ProjectRepository`)
- `InMemoryProjectRepository` — in-memory + localStorage, seeded from `src/data/fixtures.ts`; used for tests and local dev without Supabase
- `SupabaseProjectRepository` — production implementation; Postgres tables mirror domain types; SQL migrations per table; all Supabase queries live here only
- File uploads: Supabase Storage in production (store path/URL on row); in-memory impl simulates with object URLs / base64
- Implementation selection: `src/data/index.ts` (one place)

If you're tempted to import Supabase or read mock data from a component, add a repository method instead.

## Commands

```bash
# Current (Vite)
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build
npm run test:run   # vitest once
npm run lint       # eslint
npm run typecheck  # tsc --noEmit

# Target (Next.js — update package.json as you migrate)
npm run dev        # http://localhost:3000
npm run build      # next build
npm run start      # next start
npm run test:run   # vitest run (unit/component)
npm run test:e2e   # playwright test (e2e)
npx supabase start # local Supabase stack
npx supabase db push
```

Before declaring work done: typecheck + lint + unit tests + relevant Playwright e2e specs must all pass.

## Conventions

- **TypeScript strict** — no `any`; model the domain with explicit types in `src/types/`
- **Functional components + hooks** only; extract non-trivial logic into custom hooks or `lib/` for unit testability
- **Tailwind v4** for new screens; CSS Modules legacy components are unused
- **State:** `useState`/`useReducer` first; ask before adding a shared store
- **Tests:** RTL for component behavior (use `getByRole`/`getByLabelText`, not test IDs); Playwright for critical user journeys

## Accessibility

Accessibility is a core acceptance criterion — not polish. Flag gaps rather than skipping them.

- **Semantic HTML first** — real `button`, `nav`, `main`, `ul/li`, ordered headings; ARIA only fills gaps
- **Labels on every control** — `<label htmlFor>` or wrapping label; placeholders are not labels
- **Validation announced** — `aria-invalid` on field, message in element referenced by `aria-describedby` with `role="alert"`, focus on first invalid field on submit
- **Full keyboard operability** — Tab/Shift+Tab, Enter/Space; custom controls expose correct role/state
- **Visible focus** — preserve `:focus-visible`; never remove outline without a clear replacement
- **Color is never the only signal** — pair with text/icon; WCAG AA contrast
- **Images & icons** — meaningful ones get `alt`/accessible name; decorative ones are `aria-hidden`
- **Test:** assert `aria-invalid`, `role="alert"`, checked/expanded in RTL tests
