# Product Requirements Document: Camp Away Design — Design-Your-Own, SUV-Towable Tiny Trailer Rental Platform

> **Business model:** Camp Away Design is a **rental platform with a design front door**, not a design-and-own platform. Renters **design** the small, SUV-towable tiny trailer they want — size, sleeping capacity, wet bath, kitchenette, optional solar/battery, dates — and the platform first tries to **match that design to an available unit in its fleet**. Renters always **rent**; they never buy or own the trailer. A renter can **save** a design to re-use or refine. When a design has no available match, it does two things: it feeds the platform's **build demand signal**, and the renter can **reserve** a build of that design — a third-party builder constructs it (quick to build, under ~$50k, SUV-towable), and the unit is **held for that renter** to rent once complete, then joins the general fleet afterward. Builds are still commissioned against **aggregate demand**, not one-off custom whims; the reserve option simply lets a specific renter claim the first rental of a build their design triggered.

## 1. Problem Statement

People who want an affordable, SUV-towable tiny trailer — for weekend getaways or short-term mobile living — have no good way to get one. Buying or commissioning a custom build is slow and expensive, and the rentals that exist are typically bulky RVs that are hard to tow with a mid-size SUV or that don't match what the renter actually needs. There's no simple way to **describe the exact small trailer you want** and reliably rent one.

This matters now because demand for compact, towable getaway spaces is growing while supply is fragmented and ownership-oriented. Camp Away Design closes the gap with a **design-first rental** experience: renters design the rental they want (size, sleeping capacity, wet bath, kitchenette, optional solar/battery, and rental dates), save it, and the platform fulfils it from its **fleet of small trailers** — matching them to units that are already available. When a design has no available match, the renter isn't sent to a dead end: their design is recorded as **build demand**, and they can **reserve a build** and rent that unit when it's done. Separately, the platform **offloads builds to third-party builders** to produce small trailers (quick to build, under ~$50k, SUV-towable) that grow the fleet. Keeping every unit small and standardized is what keeps builds fast and cheap and keeps trailers SUV-towable.

## 2. Goals

1. Fulfil at least 70% of rental requests from available fleet inventory within the target lead time, in the first 6 months of launch. `[ASSUMPTION — target % and lead time not yet set]`
2. Reduce the median time from rental request to a confirmed rental by 40% vs. the manual baseline within 6 months. `[ASSUMPTION — baseline not yet measured]`
3. Achieve a design-form completion rate of 80% among renters who start one within 3 months of launch.
4. Convert at least 25% of no-match designs into either a saved design or a reserved build within 6 months. `[ASSUMPTION — reserve conversion target not yet validated]`
5. Reach a renter satisfaction score of 4.2 out of 5 or higher on the rental experience within 6 months.
6. Onboard at least 10 active third-party builders and grow the fleet to 100 rentable trailers within the first 9 months, keeping healthy fleet utilization. `[ASSUMPTION — depends on go-to-market and capital]`

## 3. Non-Goals

- This is a **rental** platform — it will **not** sell, finance, or broker **ownership** of trailers to renters. Designing and reserving a build still results in a **rental**, never a purchase.
- It will **not** build a one-off, fully bespoke trailer per renter. Designs are expressed within the standardized **small SUV-towable** envelope; reserved builds must fit the buildable spec range, and the resulting unit re-enters the **general fleet** after the reserving renter's rental.
- It will **not** perform structural engineering calculations or certify towing safety/road-legality. It coordinates designs, rentals, and builds, not regulatory compliance sign-off.
- It will **not** process rental payments, deposits, or billing in the MVP — the MVP covers design capture, fleet matching, build reservation, and commissioning builds. `[ASSUMPTION — payment/booking and reservation deposits are the eventual core but deferred past MVP]`
- It will **not** manage the third-party builders' construction scheduling, material procurement, or on-site logistics — it hands off a build spec and tracks status, nothing more.
- It will **not** support anything outside the **small** SUV-towable trailer category (e.g., full-size RVs, stationary tiny homes, or multi-trailer builds). Small-only is a core constraint, not a limitation to lift later.
- It will **not** include a native mobile app for the MVP — it will be a responsive web application only.

## 4. Users & Use Cases

**Primary users:**
- **Renters (clients)** wanting a small, SUV-towable trailer for weekend or short-term use — they **design** what they want, then rent it. They don't own.
- **Platform operations / fleet admin** — manages the rental fleet, matches designs to available units, fulfils build reservations, and commissions/assigns builds to grow the fleet.
- **Third-party builders** — build small trailers to spec (under ~$50k, SUV-towable) that join the rental fleet, including reserved builds tied to a specific renter's design.

**Scenario 1 — The renter who designs and gets matched from the fleet**
Maria and Jon design a small trailer they can tow behind their mid-size SUV for a long weekend — sleeping space for two, wet bath, kitchenette, their preferred dates. The platform surfaces an available fleet unit that fits their design, which they confirm without a single phone call.

**Scenario 2 — A design with no available match: save or reserve a build**
Dev & Sam design a configuration that no available unit currently matches for their dates. Instead of a dead end, the platform lets them **save the design** and offers two paths: be **notified** if a matching unit frees up, or **reserve a build** of their design — a builder constructs it and the unit is **held for them** to rent when complete. Their design is also recorded as **demand signal** for fleet planning.

**Scenario 3 — Ops grows the fleet via a third-party build**
The fleet admin sees a cluster of similar designs and reservations for a particular configuration. They **commission a third-party builder** to build that small-trailer spec (under ~$50k, target loaded weight under ~5,000 lbs, SUV-towable), assign it to a builder, and track it through to completion. If the build fulfils a **reservation**, it's held for that renter's first rental; otherwise it becomes a rentable fleet unit available to whoever matches next.

## 5. User Stories

**Must-have**
- As a renter, I want to **design** the trailer I want to rent (size, sleeping capacity, features, dates) so the platform can find me a match.
- As a renter, I want to **save** a design so I can re-use or refine it later.
- As a renter, I want to see the available fleet units that match my design so I can choose one.
- As a renter, I want to confirm a rental of an available unit so my booking is held.
- As a renter, when nothing is available, I want to **reserve a build** of my design (or be notified of a match) rather than hitting a dead end.
- As a fleet admin, I want to see all designs, rental requests (matched and unmet), reservations, and the full fleet so I can manage availability.
- As a fleet admin, I want to commission a build from a third-party builder to grow the fleet when demand exceeds supply.
- As a fleet admin, I want to assign a build to a specific builder and track it until it joins the fleet, including whether it fulfils a reservation.
- As a third-party builder, I want to see the build specs assigned to me (small trailer, under ~$50k, SUV-towable) so I can build to spec.

**Should-have**
- As a fleet admin, I want to see fleet utilization, saved-design trends, and unmet-design/reservation demand so I know what configurations to build next.
- As a third-party builder, I want to mark a build complete so the unit enters the rentable fleet (or is held for its reservation).
- As a renter, I want email notifications when a matching unit becomes available, or when my reserved build is ready, so I don't have to keep checking.

**Nice-to-have**
- As a renter, I want to see similar available alternatives when there's no exact match so I can still find something workable.
- As a renter, I want to filter available units by dates and features so I can browse the fleet directly.
- As a renter, I want to start a new design from a saved one so I don't re-enter everything.

## 6. Acceptance Criteria

**Story: Renter designs a rental**
- Given a renter starting a design, when they open the design form, then they see fields for trailer size (16–18 ft), sleeping capacity, wet bath, kitchenette, optional solar/battery, and rental dates, pre-filled with sensible defaults.
- Given a renter completing the design, when they leave a required field blank and submit, then submission is blocked and the missing field is highlighted.
- Given a completed design, when the renter submits it, then a rental request is created from the design and the platform attempts to match it against available fleet units.

**Story: Renter saves a design**
- Given a renter with an in-progress or completed design, when they save it, then the design is persisted to their saved designs and can be reopened to refine or re-submit.

**Story: Renter sees matching available units**
- Given a submitted design, when one or more available fleet units satisfy it, then they are listed as matches with their specs.
- Given a submitted design, when no available unit satisfies it, then the renter sees a clear "no match available" state offering **save**, **notify me**, and **reserve a build**, and the design is recorded as unmet demand.

**Story: Renter confirms a rental**
- Given a renter viewing a matching available unit, when they confirm, then that unit is marked rented for the dates, the request is marked confirmed, and the booking is attributed and timestamped. `[ASSUMPTION — payment is deferred past MVP, so "confirm" holds the unit without charging]`

**Story: Renter reserves a build of their design**
- Given a no-match design, when the renter reserves a build, then a build reservation is created tied to that renter and design, the design is added to the build demand signal, and the renter sees a pending-reservation state.
- Given a reserved build, when ops commissions and a builder completes it, then the unit is **held for the reserving renter** to rent first (not auto-assigned to any other requester), and the renter is notified it's ready. `[ASSUMPTION — hold duration / deposit deferred past MVP]`

**Story: Fleet admin commissions a build**
- Given a fleet admin reviewing demand, when they commission a build with a target spec and assign a builder, then a build order is created with status "commissioned" and appears in that builder's queue, flagged if it fulfils a reservation.
- Given a build order, when the builder advances it, then its status moves commissioned → in progress → completed, preserving who changed it and when.
- Given a build order reaches "completed," when it is finalized, then a new unit with that spec is added to the fleet — **held for its reservation** if it has one, otherwise available to whoever matches next.

**Story: Third-party builder works a build spec**
- Given a builder assigned a build, when they open it, then they see the full spec and constraints (size, sleeping capacity, features, target weight under ~5,000 lbs, under ~$50k).

## 7. Risks & Assumptions

| Risks | Assumptions |
|---|---|
| A design front door may raise renter expectations toward bespoke customization the standardized envelope can't meet. | Renters accept designing **within** a small, standardized spec range rather than fully bespoke. |
| Renters may abandon long design forms before completing them. | Renters are willing to self-serve a structured design instead of talking to a person first. |
| Reserve-a-build introduces wait times that conflict with "rent something now" expectations. | A meaningful share of no-match renters will accept waiting for a reserved build over an immediate alternative. |
| Holding fleet capital is expensive; idle units hurt margins, but too little inventory means unmet designs. | Standardized small trailers have broad enough appeal that fleet utilization can stay healthy. |
| Build lead times from third parties could lag behind demand or reservation promises. | Demand patterns and saved designs are predictable enough to commission builds ahead of need. |
| Inconsistent quality or reliability across third-party builders. | Builders can deliver to a standardized small-trailer spec under ~$50k and the target weight. |
| Notification fatigue could cause renters to ignore availability or reservation-ready alerts. | Email is an acceptable notification channel for the MVP. |

## 8. Open Questions

- How is rental pricing set, and when is payment/deposit taken — at confirmation, at reservation, at pickup, or not in MVP? `[NEEDS INPUT — Owner: Product]`
- Does reserving a build require a deposit or commitment, and how long is the unit held for the reserving renter once built? `[NEEDS INPUT — Owner: Product/Business]`
- What can a renter actually vary in a "design" — a fixed set of options within the small envelope, or free-form within ranges? Where are the hard build limits? `[NEEDS INPUT — Owner: Product/Engineering]`
- How are rental dates and availability modeled — calendar booking, simple available/rented flag, or overlapping-date checks? `[NEEDS INPUT — Owner: Product/Engineering]`
- How are designs matched to units — exact spec match, "good enough" tolerance, or admin-assisted? `[NEEDS INPUT — Owner: Product]`
- Delivery vs. pickup: does the platform deliver/tow trailers, or do renters collect them? `[NEEDS INPUT — Owner: Product/Ops]`
- Who owns the fleet capital, and how are commissioned/reserved builds financed? `[NEEDS INPUT — Owner: Business]`
- How are third-party builders vetted, rated, and paid? `[NEEDS INPUT — Owner: Ops/Legal]`
- Insurance, damage deposits, and liability for rented units? `[NEEDS INPUT — Owner: Legal]`
- Is multi-language or accessibility (WCAG) support required at launch? `[NEEDS INPUT — Owner: Product]`

## 9. Success Metrics

**Leading indicators (early signals)**
- Design-form start and completion rates
- Saved-design count and re-use rate
- Match rate: % of designs with at least one available matching unit
- No-match outcomes: % saved, notified, or converted to a reserved build
- Unmet-design / reservation volume by configuration (build demand signal)
- Time from design submission to confirmed rental
- Active third-party builders and build orders in progress

**Lagging indicators (final outcomes)**
- Rental request fulfilment rate (vs. 70% goal)
- Reserve-to-rental conversion (reserved builds that become a completed rental)
- Fleet utilization (% of fleet rented over time)
- Median request-to-confirmation time (vs. 40% reduction goal)
- Renter satisfaction score (target ≥ 4.2 / 5)
- Repeat-rental rate and builder retention over 6–9 months

---

## Appendix A: Detailed User Stories — Trailer Design Form (MVP)

> Scope note: This is the **MVP** version of the trailer design form. The form is the platform's front door: a renter designs a small trailer, the design becomes a rental request matched against the fleet, and the design can be **saved** or, on no match, used to **reserve a build**. MVP delivers Stories 1–4.

**Story 1:** As a renter, I want to design a small trailer through a structured form so that I can clearly describe what I want to rent — size, features, and dates — without writing long emails.

**Acceptance Criteria:**
- Given a renter starting a design, when they open the form, then they see fields for trailer length (16–18 ft), sleeping capacity, wet bath, kitchenette, optional solar/battery, rental dates, and free-text notes, pre-filled with sensible default values.
- Given a renter completing the design, when they submit with all required fields valid, then a rental request is created with status "open" and the platform attempts to match it to available fleet units.
- Given a renter editing the trailer length, when the value falls outside the small-trailer range (16–18 ft), then an inline warning appears but does not block submission.

**Priority:** Must-have
**Effort:** Medium (2-3 days)

**Story 2:** As a renter, I want required fields validated before I submit so that I don't send an incomplete design.

**Acceptance Criteria:**
- Given a renter on the form, when they leave a required field (e.g. name, dates) blank and try to submit, then submission is blocked and the missing field is highlighted with a message.
- Given a renter who fixes a previously-invalid field, when the field becomes valid, then its error message clears immediately.
- Given a form with validation errors, when the renter submits, then focus moves to the first field with an error for accessibility.

**Priority:** Must-have
**Effort:** Small (< 1 day)

**Story 3:** As a renter, I want to toggle optional upgrades (solar, battery) so that the platform only matches me to units that have what I need.

**Acceptance Criteria:**
- Given a renter on the form, when they enable the solar or battery toggle, then matching only returns units that include those upgrades.
- Given both upgrades are off by default, when the renter submits without touching them, then the design records both as not required.

**Priority:** Should-have
**Effort:** Small (< 1 day)

**Story 4:** As a renter, I want to save my design so that I can refine it, re-submit it later, or reserve a build of it if nothing is available.

**Acceptance Criteria:**
- Given a renter with a valid design, when they choose save, then the design is persisted to their saved designs and can be reopened later with all values intact.
- Given a renter on a no-match result, when they reserve a build, then the saved design backs a build reservation tied to them.
- Given a renter who confirms a rental from a matched unit, when the booking is created, then the originating design remains available in saved designs (it is not discarded).

**Priority:** Must-have
**Effort:** Medium (2-3 days)

### Edge Cases to Discuss
- What happens if the renter designs dates with no available match — save, notify-me, reserve-a-build, or suggest alternatives? (MVP offers save / notify / reserve.)
- How should the form behave on mobile — single column with the same field order, or a stepped/multi-page flow?
- Can a renter have multiple open designs/requests or reservations at once, or one at a time?
- Should out-of-range length be a soft warning (current assumption) or a hard block?
- How are overlapping rental dates handled when a unit is already booked or held for a reservation?
- What's the limit of "design" freedom before a config is unbuildable within the small envelope?

### Questions for the Team
1. Does matching happen instantly on submit, or is there an admin review step before a renter sees matches?
2. Should the form collect rental dates in the MVP, or is date-based availability a later addition?
3. Is "reserve a build" fully in MVP scope (renter-initiated reservation + hold), or just a recorded unmet design + notify for now?

---

Review the `[ASSUMPTION]`, `[NEEDS INPUT]`, and `[NEEDS CLARIFICATION]` sections before sharing with engineering.
