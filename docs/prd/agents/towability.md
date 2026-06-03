# Agent 3 — Towability & Compliance Agent

**Purpose:** Validate the trailer size, estimated weight, and upgrades against the client's tow vehicle. Advisory only — never a structural or road-legal certification.

**Workflow:** Rentals + Projects

**Model:** `claude-sonnet-4-6`

**Status:** Fallback implemented. `RuleTableTowabilityAgent` uses static weight tables and tow capacity ranges. Claude implementation (for plain-language explanation and nuanced recommendations) planned.

**Files:**
- `src/data/agents/towabilityAgent.ts` — I/O types + `RuleTableTowabilityAgent`

**Trigger:** Orchestrator calls this after Inventory Matching, with the brief + selected upgrades.

**Fail behavior:** Never hard-blocks submission. `fail` status shows a strong warning and requires explicit user acknowledgment.

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

## Validation rules

| Tow Vehicle | Compatible Size | Typical Tow Capacity |
|---|---|---|
| Midsize SUV (`suv`) | Small only | 3,500–5,000 lbs |
| Large SUV / Truck (`truck`) | Small or Medium | 6,000–8,500 lbs |
| Unsure (`unsure`) | Small only (conservative) | Unknown |

`pass` = estimated weight ≤ 85% of tow capacity · `warning` = 85–100% · `fail` = over capacity

**Roof load note:** Any upgrade with `affectsRoofLoad: true` appends: *"Selected [upgrade] may increase total trailer height and weight. Review tow vehicle roof load capacity and any height restrictions at your destination."*

---

## UI surface

Inline warning card on `BookingForm` and `RequirementForm`. `warning` shows a caution banner. `fail` shows a blocking-style alert with acknowledgment checkbox before submission is enabled.

---

## Fallback

`RuleTableTowabilityAgent` — static tow capacity table + weight range midpoints from `TRAILER_SIZE_CATEGORIES` + upgrade weight adders from `RENTAL_UPGRADES`.
