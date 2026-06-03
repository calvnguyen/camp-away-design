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

## Access and demo roles

Authentication uses Supabase Auth. Every user has a `role` stored in the `profiles` table.

| Role | How you get it | Behavior |
|---|---|---|
| `demo` | Sign up with any email/password | Default for all new accounts. Sees a **client / designer toggle** on project and review pages for exploration. |
| `client` | Fixed demo account (`demo-client@campaway.dev`) | No toggle — locked to the client view (intake, booking, approve/request revision). |
| `designer` | Fixed demo account (`demo-designer@campaway.dev`) | No toggle — locked to the designer view (assigned projects, floorplan upload, revision response). |
| `admin` | Manual SQL: `UPDATE profiles SET role = 'admin' WHERE id = '<uuid>';` | No toggle — full platform access. Not exposed as a public demo option. |

The login screen shows **Continue as Client Demo** and **Continue as Designer Demo** quick-access buttons when the following env vars are set:

```bash
NEXT_PUBLIC_DEMO_CLIENT_EMAIL=demo-client@campaway.dev
NEXT_PUBLIC_DEMO_CLIENT_PASSWORD=...
NEXT_PUBLIC_DEMO_DESIGNER_EMAIL=demo-designer@campaway.dev
NEXT_PUBLIC_DEMO_DESIGNER_PASSWORD=...
```

See `.env.local.example` for the full list of required environment variables.

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

### Agent system (`docs/prd/agents/`)

Each file follows the agent doc format: YAML frontmatter (`name`, `description`, `model`, `tools`, `memory`) + system-prompt instructions + technical spec.

| File | What's in it |
|---|---|
| [index.md](docs/prd/agents/index.md) | Orchestrator architecture, agent inventory, workflow sequence, file structure |
| [intake.md](docs/prd/agents/intake.md) | Intake Agent — collects requirements via chat, produces `TrailerBrief` |
| [inventory-matching.md](docs/prd/agents/inventory-matching.md) | Inventory Matching Agent — scores brief against rental inventory, routes rental vs. project |
| [towability.md](docs/prd/agents/towability.md) | Towability & Compliance Agent — validates tow vehicle vs. trailer weight and upgrades |
| [pricing.md](docs/prd/agents/pricing.md) | Pricing Recommendation Agent — estimates nightly rate, build cost, concept package tier |

### Architecture (`docs/architecture/`)

| File | What's in it |
|---|---|
| [stack.md](docs/architecture/stack.md) | Tech stack, Tailwind palette, Rentals vs Projects separation, data layer conventions, accessibility rules |

### Architecture decisions (`docs/decisions/`)

| File | Decision |
|---|---|
| [adr-001](docs/decisions/adr-001-redesign-migration.md) | Next.js App Router migration from Vite |
| [adr-002](docs/decisions/adr-002-concept-layout-generator.md) | Claude API for concept layout generation over third-party services |
| [adr-003](docs/decisions/adr-003-floorplan-role-toggle.md) | MVP role toggle (designer/client) in place of real auth — superseded; toggle now shown only for `demo` role users |
| [adr-004](docs/decisions/adr-004-agent-architecture.md) | Uniform Agent interface — Claude implementation + deterministic fallback |
| [adr-005](docs/decisions/adr-005-orchestrator.md) | Sequential TypeScript orchestrator over multi-agent frameworks |

## Folder structure (key paths)

```
app/
  api/agent/
    intake/route.ts          # POST /api/agent/intake
    orchestrate-intake/      # POST /api/agent/orchestrate-intake (planned)

src/
  data/agents/
    types.ts                 # Agent<TInput, TOutput> base contract
    intakeAgent.ts           # I/O types + StaticFormFallbackIntakeAgent
    inventoryMatchingAgent.ts# I/O types + RuleBasedInventoryMatchingAgent
    towabilityAgent.ts       # I/O types + RuleTableTowabilityAgent
    pricingAgent.ts          # I/O types + CalculatorFallbackPricingAgent
    index.ts                 # exports all agent instances
  components/IntakeChat/     # chat widget used on /new
  routes/NewProject/         # two-column /new page: RequirementForm + IntakeChat

docs/prd/agents/             # per-agent specs (frontmatter + system prompt + I/O types)
```
