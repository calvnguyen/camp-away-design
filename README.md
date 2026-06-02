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

## Docs

- [Product overview](docs/prd/overview.md)
- [Rentals workflow](docs/prd/rentals-workflow.md)
- [Projects workflow](docs/prd/projects-workflow.md)
- [Agent system](docs/prd/agents.md)
- [Architecture](docs/architecture/stack.md)
