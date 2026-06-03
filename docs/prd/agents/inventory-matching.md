# Agent 2 — Inventory Matching Agent

**Purpose:** Score available rental inventory against the client's requirements. Determine whether to route to a rental booking or a custom project.

**Workflow:** Rentals → Projects gate

**Model:** `claude-sonnet-4-6`

**Status:** Fallback implemented. `RuleBasedInventoryMatchingAgent` matches against `STANDARD_BUILDS` and handles the roof-top tent edge case. Claude implementation (for `close` match quality + explanation) planned.

**Files:**
- `src/data/agents/inventoryMatchingAgent.ts` — I/O types + `RuleBasedInventoryMatchingAgent`

**Trigger:** Orchestrator calls this after the Intake Agent produces a complete (or partial) brief.

---

## Inputs

```ts
interface InventoryMatchInput {
  sizeCategory: TrailerSizeCategory;
  sleeps: number;
  bathroomType: BathroomType;
  kitchenType: KitchenType;
  towVehicle: TowVehicle;
  powerOptions: PowerOption[];
  upgradeIds: string[];
  intendedUsage: UsageIntent;
  notes: string;
}
```

## Outputs

```ts
type MatchQuality = 'exact' | 'close' | 'none';

interface InventoryMatchResult {
  quality: MatchQuality;
  matchedBuildIds: string[];
  closestCategories: TrailerSizeCategory[];
  explanation: string;
  recommendRental: boolean;
  suggestedSize?: TrailerSizeCategory;
}
```

---

## Logic

- **Exact** — size + sleeps + bathroom + kitchen align with a `STANDARD_BUILD`. Recommend rental.
- **Close** — 1–2 fields differ. Claude explains the delta and whether it's acceptable.
- **None** — fundamental mismatch. Route to custom project.
- **Roof-Top Tent:** if `roof_top_tent` is selected, checks whether matched inventory supports it. No compatible inventory → custom project regardless of other match quality.

---

## UI states

> **Match found:** "We found available trailers that match most of your requirements."

> **No match:** "No available rental fully matches your requirements. You can request a custom concept design."

---

## Fallback

`RuleBasedInventoryMatchingAgent` — exact-match lookup against `STANDARD_BUILDS` (`src/lib/standardBuilds.ts`). Returns `quality: 'exact'` or `quality: 'none'`; no `close` quality or plain-language explanation without Claude.
