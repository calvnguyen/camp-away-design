# Product Overview

Camp Away Design is a rental platform for affordable, SUV-towable tiny trailers. Renters design the trailer they want; the platform matches that design to an available unit in its fleet. When nothing matches, a renter can save a design or reserve a build held for them to rent once built (after which it joins the general fleet). Fleet ops commissions third-party builders against aggregate demand to grow the fleet.

**It is always a rental — never a purchase.** Designing or reserving a build results in a rental. Designs must fit the standardized small SUV-towable envelope; no fully bespoke one-offs.

Full spec: [prd.md](prd.md)

## Domain rules

These constraints must be reflected in UI defaults, validation hints, and labels. Encode them as typed constants in `src/lib/` (e.g. `TRAILER_CONSTRAINTS`) — do not hardcode numbers across components.

| Constraint | Value |
|---|---|
| Trailer length | 16–18 ft |
| Sleeps | 2 adults |
| Wet bath | Required (combined shower/toilet) |
| Kitchenette | Required (compact) |
| Solar + battery | Optional, off by default |
| Max loaded weight | ~5,000 lbs |
| Budget target | Under ~$50k |

## Out of scope for MVP

Do not build without asking:

- Selling, financing, or brokering trailer **ownership** (rental only)
- Fully bespoke one-off builds (reserved builds re-enter the general fleet)
- Rental payments, deposits, or billing
- Structural/engineering or towing-safety certification
- Builder construction scheduling, procurement, or logistics
- Anything outside the small SUV-towable category
- Native mobile app (web-only, responsive)

> **In scope:** reserving a build is in scope — a renter's no-match design can trigger a build held for them. See [prd.md](prd.md) for the design → match → save/reserve flow.
