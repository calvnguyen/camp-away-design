# Camp Away Design

**Demo:** [camp-away-design.vercel.app](https://camp-away-design.vercel.app/)

---

## Overview

Camp Away Design is a rental platform for affordable, SUV-towable tiny trailers. It's always a rental — never a purchase.

Clients describe the trailer they want and the platform either matches them to available inventory or walks them through a custom concept design workflow. The core idea: reduce the friction between "I want a small trailer for a weekend trip" and an actual confirmed booking.

### Two workflows

**Rentals** — browse existing fleet inventory, check availability, and book. Three size tiers (Small, Medium, Large) cover most use cases. Clients can add optional upgrades (solar, off-grid battery, roof-top tent, etc.) and submit a booking request for admin approval.

**Projects** — for when no rental matches. The client submits an intake brief, an AI agent generates a rough 2D concept layout, a designer uploads a floorplan, and the client reviews and approves it. The full workflow covers intake → concept generation → designer assignment → floorplan review → approval.

### Agent system

An Orchestrator coordinates five Claude-backed sub-agents across both workflows:

1. **Intake Agent** — collects requirements via chat, structures a `TrailerBrief`
2. **Inventory Matching Agent** — scores available rentals against the brief; routes to rental or custom project
3. **Towability & Compliance Agent** — validates tow vehicle compatibility against trailer size and upgrade weight
4. **Pricing Recommendation Agent** — estimates rental pricing, upgrade costs, and custom concept package tiers
5. **Layout Recommendation Agent** — generates a 2D zone layout when no rental match exists (implemented)

### Business model

- Rental only — no ownership, financing, or bespoke one-off builds
- Three trailer size categories: Small (14–16 ft), Medium (17–20 ft), Large (21–24 ft)
- Nightly pricing: $129 / $179 / $229 depending on size
- Custom concept packages: $199 (Basic) / $499 (Advanced) / $999+ (Premium)

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
