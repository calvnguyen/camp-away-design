# Camp Away Design

Rental platform for affordable, SUV-towable tiny trailers. Renters design the trailer they want; the platform matches it to an available unit or reserves a build. Always a rental — never a purchase. Designs stay within the standardized small SUV-towable envelope.

**Status:** Next.js 16 App Router. In-memory + localStorage data layer in place; migrating to Supabase (schema TBD).

Read before building:
- [docs/prd/overview.md](docs/prd/overview.md) — product requirements, domain rules, out-of-scope
- [docs/prd/floorplan-review.md](docs/prd/floorplan-review.md) — floorplan upload flow, roles
- [docs/architecture/stack.md](docs/architecture/stack.md) — stack, data layer, conventions, accessibility
- [docs/decisions/](docs/decisions/) — ADRs for key decisions

## Who I'm working with

**Calvin Nguyen** — senior frontend engineer, ~9 years experience, deep expertise in Angular and TypeScript, some React.

- Assume expert-level TypeScript and frontend architecture instincts — skip the basics, lead with the decision and trade-off.
- React is less familiar. When something differs from Angular (hooks lifecycle, state colocation vs. services/DI), call out the _why_, not just the _how_.
- Calvin judges work on: **UX, input validation, system reliability, and accessibility** — all first-class. Flag gaps rather than shipping past them.

## Stack

- **Next.js 16 App Router** — `app/` directory; server components for layout/metadata, `'use client'` for interactive route components.
- **Tailwind v4** — warm stone / forest-green palette. Legacy CSS Modules components are unused.
- **Supabase** (Postgres + Storage + Auth) behind the data-layer seam — `src/lib/supabase/client.ts` (browser) and `src/lib/supabase/server.ts` (RSC/Route Handlers). Never imported directly in components.
- **Vitest + RTL** for unit/component tests; **Playwright** for e2e.

Details: [docs/architecture/stack.md](docs/architecture/stack.md)

## Commands

```bash
npm run dev        # Next.js dev server (http://localhost:3000)
npm run build      # next build
npm run test:run   # vitest run (unit)
npm run test:e2e   # playwright test (e2e)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Before declaring done: typecheck + lint + unit tests + relevant Playwright e2e specs must pass.

## Key conventions

- **TypeScript strict** — no `any`; domain types in `src/types/`
- **Data layer seam** — all reads/writes via repository in `src/data/`; never import Supabase or fixtures from components
- **State:** `useState`/`useReducer` first; ask before adding a shared store
- **Tests:** `getByRole`/`getByLabelText` in RTL, assert a11y state; Playwright for critical journeys

## Accessibility (non-negotiable)

Accessibility is a core requirement on every UI change — not polish, not optional.

- **Semantic HTML first** — real `button`, `nav`, `main`, `ul/li`, ordered headings. ARIA only fills gaps native HTML can't express.
- **Every control has a label** — `<label htmlFor>` or wrapping label. Placeholders are not labels.
- **Validation is announced** — `aria-invalid` on the field, error message referenced by `aria-describedby` with `role="alert"`, focus moved to first invalid field on submit.
- **Full keyboard operability** — every interactive element reachable via Tab/Shift+Tab, Enter/Space. Custom controls expose correct role and state.
- **Visible focus** — never remove `:focus-visible` without an equally clear replacement.
- **Color is never the only signal** — pair with text or icon; meet WCAG AA contrast.
- **Images and icons** — meaningful ones get `alt` or accessible name; decorative ones are `aria-hidden`.
- **Test by behavior** — `getByRole`/`getByLabelText` in RTL, assert `aria-invalid`, `role="alert"`, checked/expanded states.

## Before implementing

1. Review `docs/prd/`, `docs/architecture/`, `docs/decisions/`, and relevant existing components.
2. Check for conflicting requirements or patterns that already exist.
3. Reuse existing flows and components before creating new abstractions.
4. Summarize the planned change, identify affected flows/components and docs, confirm whether existing patterns apply.

## After coding

- Update relevant documentation.
- Verify workflows still make sense end-to-end.
- Confirm role behaviors are clear and status transitions are consistent.

## PRD update rules

Whenever new requirements, workflows, or business logic are introduced, update the appropriate doc under `docs/prd/`. Keep docs in sync with implementation.

| Change type | Update target |
|---|---|
| New intake field | `docs/prd/intake-flow.md` |
| New workflow state or transition | relevant workflow doc |
| New AI behavior | `docs/prd/ai-concept-generation.md` (or equivalent) |
| New role behavior | relevant review/workflow doc |

## Architecture review rules

Before introducing new routes, services, state management patterns, database tables, or abstractions:

1. Review existing architecture docs.
2. Check whether the pattern already exists.
3. Prefer consistency over novelty.
4. Keep architecture modular and scalable; avoid unnecessary abstractions or premature optimization.
