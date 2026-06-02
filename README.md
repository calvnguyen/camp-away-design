# Camp Away Design

Rental platform for affordable, SUV-towable tiny trailers. Clients design the trailer they want; the platform matches it to available inventory or routes them to a custom concept workflow.

**Demo:** [camp-away-design.vercel.app](https://camp-away-design.vercel.app/)

---

## Stack

- **Next.js 16** App Router
- **Tailwind v4** — warm stone / forest-green palette
- **Supabase** — Postgres + Auth + Storage
- **Claude API** — AI concept layout generation
- **Vercel** — hosting

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test:run   # vitest (unit)
npm run test:e2e   # playwright (e2e)
```

## Documentation

All design, requirements, and architecture docs live under `docs/`.

### Product requirements (`docs/prd/`)

| File | What's in it |
|---|---|
| [overview.md](docs/prd/overview.md) | Product summary, trailer size categories, Rentals vs Projects separation, out-of-scope |
| [prd.md](docs/prd/prd.md) | Full product requirements document — goals, user stories, acceptance criteria, risks |
| [rentals-workflow.md](docs/prd/rentals-workflow.md) | Rental inventory marketplace — categories, booking flow, statuses, upgrade pricing |
| [projects-workflow.md](docs/prd/projects-workflow.md) | Custom design workflow — project statuses, role capabilities, concept and build pricing |
| [rental-pricing-booking.md](docs/prd/rental-pricing-booking.md) | Pricing tables, booking form fields, inventory-first matching, UI requirements |
| [floorplan-review.md](docs/prd/floorplan-review.md) | Floorplan upload flow, review roles, file formats, version history |
| [concept-layout.md](docs/prd/concept-layout.md) | AI concept layout generation — match logic, generator implementations, UI components |
| [agents.md](docs/prd/agents.md) | Agent system — Orchestrator architecture, all 5 sub-agents, inputs/outputs, workflow |

### Architecture (`docs/architecture/`)

| File | What's in it |
|---|---|
| [stack.md](docs/architecture/stack.md) | Tech stack, Tailwind palette, Rentals vs Projects separation, data layer conventions, accessibility rules |

### Architecture decisions (`docs/decisions/`)

| File | Decision |
|---|---|
| [adr-001](docs/decisions/adr-001-redesign-migration.md) | Next.js App Router migration from Vite |
| [adr-002](docs/decisions/adr-002-concept-layout-generator.md) | Claude API for concept layout generation over third-party services |
| [adr-003](docs/decisions/adr-003-floorplan-role-toggle.md) | MVP role toggle (designer/client) in place of real auth |
| [adr-004](docs/decisions/adr-004-agent-architecture.md) | Uniform Agent interface — Claude implementation + deterministic fallback |
| [adr-005](docs/decisions/adr-005-orchestrator.md) | Sequential TypeScript orchestrator over multi-agent frameworks |
