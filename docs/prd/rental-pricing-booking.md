# Rental Pricing, Booking & Custom Concept Pricing (MVP)

**Status:** In development
**Scope:** Demo-only — no Stripe, no real availability locking, no production invoicing.

## Overview

CampAway Design supports:
- Rental trailer browsing with nightly pricing
- Booking request workflows (client → admin approval)
- Custom trailer design requests for non-standard needs
- AI-assisted concept recommendations
- Pricing estimates for both rentals and custom designs

## Demo Rental Pricing

| Size | Nightly Rate |
|---|---|
| Small (14–16 ft) | $129/night |
| Medium (17–20 ft) | $179/night |
| Large (21–24 ft) | $229/night |

Static mock pricing for MVP. Final pricing = `nightly_rate × total_nights`.

**Optional future add-ons (not in scope for MVP):** cleaning fee, delivery fee, solar package, insurance, pet fee.

## Booking Statuses

| Status | Meaning |
|---|---|
| `draft` | Booking started, not submitted |
| `booking_requested` | Request submitted by client |
| `pending_review` | Admin reviewing |
| `booking_confirmed` | Booking approved by admin |
| `declined` | Booking declined |
| `cancelled` | Booking cancelled |

## Booking Flow (Client)

1. Browse trailer categories (`/trailers`)
2. View trailer details and nightly pricing
3. Select rental dates
4. View estimated total
5. Enter contact information (name, email, phone)
6. Submit booking request

## Booking Form Fields

**Required:** trailer category, rental dates (start + end), name, email, phone number

**Optional:** off-grid requirements, customization request, special notes, style preferences, inspiration image URL

## Custom Design Workflow

When no available trailer layout matches, client may request a custom concept.
Use cases: unique floorplans, off-grid living, premium finishes, expanded storage, family/luxury layouts.

## Custom Concept Pricing

| Concept Type | Estimated Price |
|---|---|
| Basic AI Concept Layout | $199 |
| Advanced Concept Package | $499 |
| Premium Custom Concept Study | $999+ |

These are design consultation estimates only — not full trailer production pricing.

## Custom Design Base Pricing

| Trailer Size | Estimated Base Build Price |
|---|---|
| Small | Starting at $35,000 |
| Medium | Starting at $50,000 |
| Large | Starting at $75,000 |

## Optional Upgrade Pricing

| Upgrade | Estimated Price |
|---|---|
| Solar Package | +$4,000 |
| Off-Grid Battery System | +$6,000 |
| Premium Interior Finish | +$5,000 |
| Expanded Storage Package | +$2,500 |
| Roof-Top Tent | +$2,500 |
| Roof Rack / Outdoor Package | +$1,500 |
| Custom Exterior Wrap | +$3,000 |

## AI-Assisted Estimate Logic

The Intake Agent may recommend trailer size, layout category, upgrade packages, and estimated pricing based on: budget, tow vehicle, people count, bathroom requirements, off-grid needs, storage.

Example output:
```
Recommended: Medium Trailer + Solar Package + Premium Interior
Estimated Build Range: $59,000–$65,000
Recommended Concept Package: Advanced Concept Package ($499)
```

## Inventory-First Matching

Before routing a client to a custom project, the system checks rental inventory first.

If rentals match: *"We found available trailers that match most of your requirements."*
If no rentals match: *"No available rental fully matches your requirements. You can request a custom concept design."*

See [rentals-workflow.md](rentals-workflow.md) for the full matching flow.

## UI Requirements

### Rental Listing Cards (`/trailers`)
Display: trailer image, trailer name, trailer category, sleeps count, tow vehicle recommendation, estimated dry weight, nightly pricing, availability status badge, "Book Now" button, "Request Custom Concept" CTA.

### Pricing Summary Card (on booking form)
Display: selected trailer category, selected upgrades, estimated rental total, estimated custom concept pricing, estimated build pricing range, disclaimer.

### Disclaimer (required on all pricing surfaces)
> Pricing shown is estimate-only for demo purposes. Final pricing determined after architect/designer review.

## Role Capabilities

**Client:** browse rentals, compare pricing, request bookings, request custom concepts, review concept layouts, request revisions, track project status.

**Designer:** review assigned projects, upload concept layouts/floorplans, respond to revisions, review client requirements.

**Admin:** review/approve/decline booking requests, review custom design requests, assign designers, manage statuses, adjust estimates.

## Technical Notes

- Supabase for booking/project storage (new `bookings` table)
- Existing role-based auth applies
- Pricing logic is frontend-driven (constants in `src/lib/constraints.ts`)
- No Stripe integration
- No availability conflict checking
- Concept pricing stored as project estimate metadata

## Future Enhancements

Stripe payments, financing calculator, dynamic pricing engine, availability calendars, AI-generated SVG floorplans, towability/compliance validation agent, delivery scheduling, vendor/contractor marketplace.
