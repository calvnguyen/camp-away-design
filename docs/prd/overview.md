# Product Overview

Camp Away Design is a rental platform for affordable, SUV-towable tiny trailers. Renters design the trailer they want; the platform matches that design to an available unit in its fleet. When nothing matches, a renter can save a design or reserve a build held for them to rent once built (after which it joins the general fleet). Fleet ops commissions third-party builders against aggregate demand to grow the fleet.

**It is always a rental — never a purchase.** Designing or reserving a build results in a rental. Designs must fit the standardized SUV-towable envelope; no fully bespoke one-offs.

Full spec: [prd.md](prd.md)

## Two Distinct Workflows

The platform has two separate, non-overlapping workflows:

| Workflow | Purpose | Feel |
|---|---|---|
| **Rentals** | Browse and book existing inventory | Inventory marketplace |
| **Projects** | Custom design collaboration | Workflow / collaboration system |

- **Rentals** (`/trailers`, `/book`) — existing fleet inventory; browse, check availability, book. See [rentals-workflow.md](rentals-workflow.md).
- **Projects** (`/`, `/new`, `/project/:id`) — custom design flow; intake brief, AI concept, designer assignment, floorplan review, approval. See [projects-workflow.md](projects-workflow.md).

Projects are only created when no rental inventory matches, or when the client explicitly requests a custom concept.

## Inventory-First Matching

The system always checks rental inventory before offering a custom project:

```
Client need → Check inventory → Match found? → YES: Rental booking
                                              → NO:  Custom project
```

## Trailer Size Categories

Three standardized size tiers. All specs are constants in `src/lib/constraints.ts` (`TRAILER_SIZE_CATEGORIES`) — never hardcode these values in components.

| Size | Length | Width | Sleeps | Tow Vehicle | Est. Dry Weight |
|---|---|---|---|---|---|
| Small | 14–16 ft | 7 ft | 2 | Midsize SUV | 3,000–4,500 lbs |
| Medium | 17–20 ft | 7.5 ft | 2–4 | Large SUV / Light Truck | 4,500–6,500 lbs |
| Large | 21–24 ft | 8 ft | 4–6 | Full-Size Truck / Heavy SUV | 6,500–9,000 lbs |

## Out of scope for MVP

Do not build without asking:

- Selling, financing, or brokering trailer **ownership** (rental only)
- Fully bespoke one-off builds (reserved builds re-enter the general fleet)
- Rental payments, deposits, or billing
- Real availability calendar / conflict checking
- Structural/engineering or towing-safety certification
- Builder construction scheduling, procurement, or logistics
- Anything outside the SUV-towable trailer categories
- Native mobile app (web-only, responsive)

> **In scope:** reserving a build is in scope — a renter's no-match design can trigger a build held for them. See [prd.md](prd.md) for the design → match → save/reserve flow.
