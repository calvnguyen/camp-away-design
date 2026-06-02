# Rentals Workflow

Rentals are for **existing rentable trailer inventory** — not custom designs. The rental section of the platform functions as an inventory marketplace: browse, check availability, and book.

## Rental Categories

| Size | Length | Width | Sleeps | Tow Vehicle | Est. Dry Weight |
|---|---|---|---|---|---|
| Small | 14–16 ft | 7 ft | 2 | Midsize SUV | 3,000–4,500 lbs |
| Medium | 17–20 ft | 7.5 ft | 2–4 | Large SUV / Light Truck | 4,500–6,500 lbs |
| Large | 21–24 ft | 8 ft | 4–6 | Full-Size Truck / Heavy SUV | 6,500–9,000 lbs |

All specs are constants in `src/lib/constraints.ts` (`TRAILER_SIZE_CATEGORIES`). Never hardcode these values in components.

## Demo Rental Pricing

| Size | Nightly Rate |
|---|---|
| Small | $129/night |
| Medium | $179/night |
| Large | $229/night |

Pricing formula: `nightly_rate × total_nights`. Optional upgrades added on top.

## Rental Card Display

Each rental listing card shows:
- Trailer image
- Trailer name / size category label
- Trailer category (Small / Medium / Large)
- Sleeps count
- Tow vehicle recommendation
- Estimated dry weight range
- Nightly pricing (prominent)
- Availability status badge (Available / Unavailable)
- **Book Now** primary CTA → `/book?size={size}`
- **Request Custom Concept** secondary CTA → `/book?size={size}&custom=true`

## Inventory-First Matching Flow

Before routing a client to a custom project, the system should first attempt to match them with existing inventory.

```
Client Intake / Rental Search
  → Check Available Inventory
  → Suitable match found?
      YES → "We found available trailers that match most of your requirements."
             → Recommend rental → Booking flow (/book)
      NO  → "No available rental fully matches your requirements.
              You can request a custom concept design."
             → Suggest Custom Concept → Project flow (/new)
```

This matching is currently UI-driven (category/feature filters). A future backend matching engine will automate the recommendation.

## Booking Flow (Client)

1. Browse trailer categories (`/trailers`)
2. Select a size — view specs, nightly pricing, availability
3. Click "Book Now" → `/book?size={size}`
4. Select rental dates
5. View estimated total
6. Choose optional upgrades
7. Enter contact information (name, email, phone)
8. Submit booking request

## Booking Form Fields

**Required:** trailer size, start date, end date, name, email
**Optional:** phone, off-grid notes, customization notes, special notes

## Booking Statuses

| Status | Meaning |
|---|---|
| `draft` | Booking started, not yet submitted |
| `booking_requested` | Client submitted the request |
| `pending_review` | Admin reviewing |
| `booking_confirmed` | Approved by admin |
| `declined` | Declined by admin |
| `cancelled` | Cancelled by client or admin |

## Optional Upgrades

| Upgrade | Est. Price |
|---|---|
| Solar Package | +$4,000 |
| Off-Grid Battery System | +$6,000 |
| Premium Interior Finish | +$5,000 |
| Expanded Storage Package | +$2,500 |
| Roof-Top Tent | +$2,500 |
| Roof Rack / Outdoor Package | +$1,500 |
| Custom Exterior Wrap | +$3,000 |

## Role Capabilities

| Action | Client | Admin |
|---|---|---|
| Browse rental listings | ✅ | ✅ |
| Submit booking request | ✅ | ❌ |
| View booking status | ✅ | ✅ |
| Approve / decline booking | ❌ | ✅ |
| Cancel booking | ✅ | ✅ |

## Technical Notes

- Booking records stored in Supabase `bookings` table
- Pricing constants in `src/lib/constraints.ts`
- No Stripe integration — demo only
- No real availability conflict checking in MVP
- Availability badge is static ("Available") in MVP; future: calendar-based checking

## Out of Scope (MVP)

- Real availability calendar / conflict checking
- Payment, deposit, or billing
- Delivery scheduling
- Dynamic pricing
