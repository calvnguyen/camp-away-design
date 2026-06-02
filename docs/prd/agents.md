# Agent System — PRD

Camp Away Design uses a suite of Claude-backed agents to handle the intelligence-heavy steps in both the Rentals and Projects workflows. Each agent follows the same architectural contract as the existing Layout Recommendation Agent: a typed interface, a Claude implementation, and a deterministic fallback — all living behind the data-layer seam so components never call the API directly.

**Status:** Layout Recommendation Agent — implemented. All others — planned.

---

## Agent Inventory

| Agent | Workflow | Status | Model |
|---|---|---|---|
| Inventory Matching Agent | Rentals → Projects gate | Planned | claude-sonnet-4-6 |
| Intake Agent | Rentals + Projects | Planned | claude-sonnet-4-6 |
| Towability & Compliance Agent | Rentals + Projects | Planned | claude-sonnet-4-6 |
| Pricing Recommendation Agent | Rentals + Projects | Planned | claude-sonnet-4-6 |
| Layout Recommendation Agent | Projects | Implemented | claude-opus-4-8 |

---

## 1. Inventory Matching Agent

**Purpose:** Given a client's requirements, score available rental inventory and decide whether to route the client to a rental booking or a custom project.

**Trigger:** Client submits requirements (via form or Intake Agent output) before being routed anywhere.

### Inputs

```ts
interface InventoryMatchInput {
  sizeCategory: TrailerSizeCategory;
  sleeps: number;
  bathroomType: BathroomType;
  kitchenType: KitchenType;
  towVehicle: TowVehicle;
  powerOptions: PowerOption[];
  intendedUsage: UsageIntent;
  notes: string;
}
```

### Outputs

```ts
type MatchQuality = 'exact' | 'close' | 'none';

interface InventoryMatchResult {
  quality: MatchQuality;
  matchedBuildIds: string[];   // references STANDARD_BUILDS[].id
  explanation: string;         // plain-language summary for the client
  recommendRental: boolean;    // true → route to /book; false → route to /new
  suggestedSize?: TrailerSizeCategory;  // if close match requires size adjustment
}
```

### Logic

- **Exact match** — size + sleeps + bathroom + kitchen align with a `STANDARD_BUILD`. Recommend rental.
- **Close match** — 1–2 fields differ (e.g., slightly larger size, different kitchen tier). Claude explains the delta and whether it's acceptable, still recommends rental if practical.
- **No match** — fundamental incompatibility (e.g., sleeps 6 in a small). Route to custom project.
- Tow vehicle is advisory: if the tow vehicle can't handle the matched size, flag it (Towability Agent handles the deep check).

### Fallback

Deterministic rule-based matching identical to current `findEquivalentBuild()` in `src/lib/standardBuilds.ts`. Returns `quality: 'exact'` or `quality: 'none'`, no explanation text.

### UI Surface

Shown between requirement collection and the booking/project decision. Two outcome states:

> **Match found:** "We found available trailers that match most of your requirements. [view rentals]"

> **No match:** "No available rental fully matches your requirements. You can request a custom concept design. [start project]"

---

## 2. Intake Agent

**Purpose:** Collect requirements conversationally — accepting free-text or partial input and producing a fully structured `TrailerBrief` with follow-up questions for any gaps.

**Trigger:** Client clicks "Start" on the rental or project entry point without going through the full static form.

### Inputs

```ts
interface IntakeAgentInput {
  userMessage: string;                   // free-text from the client
  conversationHistory: IntakeTurn[];     // prior turns (multi-turn support)
  mode: 'rental' | 'project';           // shapes which fields are prioritized
}

interface IntakeTurn {
  role: 'user' | 'assistant';
  content: string;
}
```

### Outputs

```ts
interface IntakeAgentResult {
  partialBrief: Partial<TrailerBrief>;   // fields extracted so far
  followUpQuestions: string[];           // questions for missing required fields
  isComplete: boolean;                   // true when all required fields are filled
  assistantMessage: string;             // conversational response to show the client
}
```

### Required fields before `isComplete`

`sizeCategory`, `sleeps`, `bathroomType`, `kitchenType`, `towVehicle`, `intendedUsage`

Optional fields (filled with defaults if not provided): `powerOptions`, `budgetRange`, `designStyle`, `notes`

### Behavior

- Accepts natural language: *"I need something for 2 people that my Subaru Outback can tow"* → maps to `sleeps: 2`, `towVehicle: 'suv'`, `sizeCategory: 'small'`
- Asks targeted follow-ups — never re-asks already-answered fields
- Soft-validates tow vehicle vs. size during intake and flags issues early
- On completion, surfaces the structured brief for client confirmation before proceeding

### Fallback

Falls back to the static `RequirementForm` at `src/routes/RequirementForm/RequirementForm.tsx`. The form and agent produce the same `TrailerBrief` shape.

---

## 3. Towability & Compliance Agent

**Purpose:** Validate the selected trailer size, estimated weight, and upgrade selections against the client's tow vehicle capabilities. Surface warnings before a booking or project is submitted.

**Trigger:** Any time a trailer size + upgrade combination is finalized (booking form, project brief, or after Inventory Matching).

> **Scope:** This is a practical compatibility check — not a structural engineering certification or road-legal sign-off. Results are advisory, not blocking (except hard fails).

### Inputs

```ts
interface TowabilityInput {
  towVehicle: TowVehicle;                  // 'suv' | 'truck' | 'unsure'
  towVehicleDetail?: string;               // optional: "Subaru Outback 2022"
  sizeCategory: TrailerSizeCategory;
  upgradeIds: string[];                    // selected upgrades (add weight)
}
```

### Outputs

```ts
type ComplianceStatus = 'pass' | 'warning' | 'fail';

interface TowabilityResult {
  status: ComplianceStatus;
  estimatedWeightLbs: number;       // base weight + upgrade adders
  towCapacityNote: string;          // e.g. "Midsize SUVs typically tow 3,500–5,000 lbs"
  issues: string[];                 // specific problems found
  recommendations: string[];        // suggested fixes (e.g., downsize, remove upgrades)
  disclaimer: string;               // always appended — not a certified safety check
}
```

### Weight Adders (per upgrade)

| Upgrade | Est. Weight Add |
|---|---|
| Solar Package | +150 lbs |
| Off-Grid Battery System | +200 lbs |
| Roof-Top Tent | +120 lbs |
| Roof Rack / Outdoor Package | +80 lbs |
| Premium Interior Finish | +50 lbs |
| Expanded Storage Package | +30 lbs |
| Custom Exterior Wrap | +10 lbs |

### Validation Rules

| Tow Vehicle | Compatible Size | Typical Tow Capacity |
|---|---|---|
| Midsize SUV (`suv`) | Small only | 3,500–5,000 lbs |
| Large SUV / Truck (`truck`) | Small or Medium | 6,000–8,500 lbs |
| Unsure (`unsure`) | Small only (conservative) | Unknown — assume limited |

- `pass` — estimated weight comfortably within vehicle class range
- `warning` — within range but close to upper limit, or vehicle class is a stretch
- `fail` — estimated weight exceeds vehicle class capability, or `unsure` + Large trailer

### Fallback

Static rule table lookup (no AI). Uses weight ranges from `TRAILER_SIZE_CATEGORIES` in `src/lib/constraints.ts` plus the upgrade weight adders above.

### UI Surface

Inline warning card on the booking form and project brief. Never blocks submission on `warning`; blocks or strongly discourages on `fail` with override option.

---

## 4. Pricing Recommendation Agent

**Purpose:** Given the client's brief, recommend the right concept package tier, surface the relevant pricing, and explain the estimate in plain language.

**Trigger:** After the brief is complete (Intake Agent or RequirementForm) and before submission.

### Inputs

```ts
interface PricingRecommendationInput {
  sizeCategory: TrailerSizeCategory;
  upgradeIds: string[];
  isCustomConcept: boolean;
  budgetRange: BudgetRange;
  intendedUsage: UsageIntent;
  powerOptions: PowerOption[];
  notes: string;
}
```

### Outputs

```ts
interface PricingRecommendationResult {
  rentalEstimate: {
    nightlyRateUsd: number;
    note: string;                        // e.g. "based on Medium trailer"
  };
  conceptRecommendation: {
    packageId: string;                   // references CONCEPT_PACKAGES[].id
    packageLabel: string;
    priceUsd: number;
    rationale: string;                   // why this tier fits the client's needs
  } | null;                              // null if standard rental, no custom
  buildEstimate: {
    basePriceUsd: number;
    upgradesTotal: number;
    estimatedRangeMin: number;
    estimatedRangeMax: number;
    selectedUpgrades: { label: string; priceUsd: number }[];
  } | null;                              // null if rental path
  summaryMessage: string;                // plain-language explanation for the client
  disclaimer: string;                    // always: PRICING_DISCLAIMER from constraints.ts
}
```

### Recommendation Logic

- **Rental path:** Surface nightly rate + estimated total for given nights. No concept package.
- **Custom concept path:**
  - `Basic` ($199) — standard brief, no unusual requirements, budget-conscious
  - `Advanced` ($499) — off-grid power needs, multiple upgrades, specific style preferences
  - `Premium` ($999+) — full-time living, complex requirements, high budget, luxury finishes
- Upgrade selections that significantly impact cost (battery + solar combined) are called out explicitly
- Budget range mismatch (e.g., Large trailer + Premium finishes vs. `under_40k` budget) triggers a plain-language note

### Fallback

Deterministic calculator using constants from `src/lib/constraints.ts`. No recommendation rationale — just the computed totals. Identical to current BookingForm pricing math.

---

## 5. Layout Recommendation Agent

**Purpose:** Generate a rough 2D concept layout (zone partition) for a trailer brief that has no equivalent standard build.

**Status:** Implemented. See `src/data/conceptLayoutGenerator.ts` and [concept-layout.md](concept-layout.md).

### Current Implementation

- `ClaudeConceptLayoutGenerator` — Claude API (`claude-opus-4-8`, adaptive thinking), structured JSON via `output_config.format` json_schema, validates zones against envelope before accepting
- `TemplateConceptLayoutGenerator` — deterministic fallback; always works offline and in tests
- System prompt cached with `cache_control: { type: 'ephemeral' }`
- Called from `ProjectRepository.generateConceptLayout()`

### Planned Improvements

| Gap | Target |
|---|---|
| Browser-side API call (`dangerouslyAllowBrowser: true`) | Move to Next.js Route Handler — API key server-only |
| Single layout output | Return 2–3 layout variants for client to choose from |
| Style-aware zoning | Use `designStyle` from brief to weight zone positions (e.g., open-plan modern vs. defined-space rustic) |
| Usage-aware sizing | Full-time living → larger kitchenette; weekend use → maximize sleeping area |

---

## Architecture

All agents share the same structural pattern as the existing Layout Recommendation Agent.

### File structure

```
src/data/agents/
  types.ts                      # shared agent input/output interfaces
  inventoryMatchingAgent.ts     # interface + ClaudeInventoryMatchingAgent + RuleBasedFallback
  intakeAgent.ts                # interface + ClaudeIntakeAgent + StaticFormFallback
  towabilityAgent.ts            # interface + ClaudeTowabilityAgent + RuleTableFallback
  pricingAgent.ts               # interface + ClaudePricingAgent + CalculatorFallback
  conceptLayoutGenerator.ts     # existing — ClaudeConceptLayoutGenerator + TemplateGenerator
  index.ts                      # selects implementations based on env (API key present?)
```

### Shared contract

```ts
interface Agent<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
}
```

Every agent: typed interface, Claude implementation with graceful fallback, deterministic fallback that works offline and in tests.

### API call pattern

- **Target:** Next.js Route Handler (`app/api/agents/[agent]/route.ts`) — API key is server-only, never in the browser bundle
- **Model:** `claude-sonnet-4-6` for Intake, Matching, Towability, Pricing. `claude-opus-4-8` for Layout (existing, needs spatial reasoning)
- **Output format:** `output_config.format: json_schema` for all structured outputs
- **Caching:** system prompt cached with `cache_control: { type: 'ephemeral' }` on all agents
- **Fallback:** every agent catches errors and returns the deterministic result rather than surfacing an AI failure to the user

### Selection in `src/data/agents/index.ts`

```ts
// Claude implementations when ANTHROPIC_API_KEY is set (server); 
// fallbacks when key is absent (tests, local dev without key).
export const inventoryMatchingAgent = process.env.ANTHROPIC_API_KEY
  ? new ClaudeInventoryMatchingAgent(process.env.ANTHROPIC_API_KEY)
  : new RuleBasedInventoryMatchingAgent();
// ... same pattern for each
```

---

## Agent Orchestration

The agents compose in sequence across the user journey:

```
[Intake Agent]
  → collects TrailerBrief from free text or form

[Towability & Compliance Agent]
  → validates tow vehicle vs. size + upgrades
  → surfaces warnings before submission

[Inventory Matching Agent]
  → checks brief against rental inventory
  → routes: rental booking OR custom project

  ─ Rental path ─────────────────────────────
  [Pricing Recommendation Agent]
    → surfaces nightly rate, upgrade costs

  ─ Custom project path ──────────────────────
  [Pricing Recommendation Agent]
    → recommends concept package tier, build estimate

  [Layout Recommendation Agent]
    → generates 2D zone layout when no standard build matches
```

No agent calls another agent directly. The orchestration happens at the route/repository layer.

---

## Out of Scope

- Multi-agent conversation threads persisted across sessions (beyond the Intake Agent's in-session history)
- Autonomous booking confirmation (agents advise; humans confirm)
- Builder assignment or construction scheduling automation
- Real tow-safety certification or regulatory compliance sign-off
- Payment or deposit processing

---

## Open Questions

- Should the Intake Agent be a chat widget or replace the static RequirementForm entirely?
- How much conversation history does the Intake Agent retain — session only, or persisted to Supabase?
- Should the Towability Agent block submission on `fail`, or always allow with strong warning?
- Does the Pricing Agent need admin override capability (e.g., custom quote that differs from published estimates)?
