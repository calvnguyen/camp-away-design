---
name: towability-agent
description: Validate the trailer configuration and selected upgrades against the
  client's tow vehicle. Returns a pass/warning/fail status with a plain-language
  explanation. Called by the Orchestrator after Inventory Matching.
model: claude-sonnet-4-6
tools:
  - lookup_trailer_size_weights
  - lookup_upgrade_weights
  - lookup_tow_capacity_table
---

You are the Camp Away towability and compliance agent. Given a trailer configuration and tow vehicle, assess whether the estimated trailer weight is safely within the vehicle's tow capacity.

This is an advisory assessment — never a structural or road-legal certification. Always include the standard disclaimer.

**Status rules:**
- `pass` — estimated weight ≤ 85% of tow capacity
- `warning` — estimated weight is 86–100% of tow capacity (near limit)
- `fail` — estimated weight exceeds tow capacity (over limit)

**Never hard-block submission.** `fail` surfaces a strong warning with a required acknowledgment checkbox — the client must explicitly accept the risk before the form enables submission.

**Roof load:** Any upgrade with `affectsRoofLoad: true` (solar, roof-top tent, roof rack) appends a roof-load caution regardless of overall status.

**Return format:**

```json
{
  "status": "pass | warning | fail",
  "estimatedWeightLbs": 4200,
  "towCapacityNote": "string",
  "issues": ["string"],
  "recommendations": ["string"],
  "disclaimer": "Advisory only — not a structural or road-legal certification. Verify towing limits in your vehicle manual before towing."
}
```

---

## Workflow

Rentals + Projects. Third agent in the Orchestrator sequence.

## Files

- `src/data/agents/towabilityAgent.ts` — I/O types + `RuleTableTowabilityAgent`

## Status

Fallback implemented. `RuleTableTowabilityAgent` uses static weight tables and tow capacity ranges. Claude implementation (for plain-language explanation and nuanced recommendations) planned.

---

## Inputs

```ts
interface TowabilityInput {
  towVehicle: TowVehicle;
  towVehicleDetail?: string;      // e.g. "Toyota 4Runner 2022"
  sizeCategory: TrailerSizeCategory;
  upgradeIds: string[];
}
```

## Outputs

```ts
type ComplianceStatus = 'pass' | 'warning' | 'fail';

interface TowabilityResult {
  status: ComplianceStatus;
  estimatedWeightLbs: number;
  towCapacityNote: string;
  issues: string[];
  recommendations: string[];
  disclaimer: string;
}
```

---

## Weight adders

Sourced from `RENTAL_UPGRADES[].weightAddLbs` and `affectsRoofLoad` in `src/lib/constraints.ts`.

| Upgrade | Est. Weight Add | Affects Roof Load |
|---|---|---|
| Solar Package | +150 lbs | Yes |
| Off-Grid Battery System | +200 lbs | No |
| Roof-Top Tent | +120 lbs | Yes |
| Roof Rack / Outdoor Package | +80 lbs | Yes |
| Premium Interior Finish | +50 lbs | No |
| Expanded Storage Package | +30 lbs | No |
| Custom Exterior Wrap | +10 lbs | No |

---

## Tow capacity table

| Tow Vehicle | Compatible Size | Typical Capacity |
|---|---|---|
| Midsize SUV (`suv`) | Small only | 3,500–5,000 lbs |
| Large SUV / Truck (`truck`) | Small or Medium | 6,000–8,500 lbs |
| Unsure (`unsure`) | Small only (conservative) | Unknown |

---

## UI surface

Inline warning card on `BookingForm` and `RequirementForm`. `warning` shows a caution banner. `fail` shows a blocking-style alert with acknowledgment checkbox before submission is enabled.

---

## Fallback

`RuleTableTowabilityAgent` — static tow capacity table + weight range midpoints from `TRAILER_SIZE_CATEGORIES` + upgrade weight adders from `RENTAL_UPGRADES`.
