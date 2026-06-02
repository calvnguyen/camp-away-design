# Agent System — PRD

Camp Away Design uses a lightweight **Orchestrator** to coordinate five specialized Claude-backed sub-agents across the rental, pricing, inventory, and custom project workflows. The Orchestrator is a backend coordination layer — not itself an AI agent. Sub-agents are the intelligence; the Orchestrator sequences them and routes the result.

**Status:** Layout Recommendation Agent — implemented. Orchestrator and all others — planned.

---

## Orchestrator

### What it is

A TypeScript backend service (`OrchestratorService`) that:

- receives a structured intake or rental request
- executes sub-agents in sequence
- passes outputs between agents
- determines the next workflow step (rental booking vs. custom project)
- aggregates outputs into a single `OrchestratorResult` for the client

It does **not** call Claude. It calls sub-agents, each of which may call Claude internally.

### API entry point

```
POST /api/agent/orchestrate-intake
```

Accepts a structured `OrchestratorInput` and returns an `OrchestratorResult`. All sub-agent calls happen server-side; no AI keys reach the browser.

### Inputs

```ts
interface OrchestratorInput {
  userMessage: string;                    // free text or structured brief
  conversationHistory: IntakeTurn[];      // prior Intake Agent turns
  mode: 'rental' | 'project';
  existingBrief?: Partial<TrailerBrief>;  // pre-filled from static form, if any
}
```

### Outputs

```ts
interface OrchestratorResult {
  intake: IntakeAgentResult;
  inventoryMatch: InventoryMatchResult;
  towability: TowabilityResult;
  pricing: PricingRecommendationResult;
  layout?: ConceptLayout;                 // only on custom project path
  recommendedPath: 'rental' | 'project';
  nextAction: 'continue_booking' | 'continue_project' | 'needs_more_input';
}
```

### Workflow — Inventory-First

```
Client Intake (chat widget or static form)
        ↓
POST /api/agent/orchestrate-intake
        ↓
  OrchestratorService
        │
        ├─ 1. Intake Agent
        │      └─ structures TrailerBrief, surfaces follow-up questions
        │
        ├─ 2. Inventory Matching Agent
        │      └─ checks brief against rental inventory
        │
        ├─ 3. Towability & Compliance Agent
        │      └─ validates tow vehicle + weight + roof load
        │
        ├─ 4. Pricing Recommendation Agent
        │      └─ estimates rental or custom build pricing
        │
        └─ 5. Layout Recommendation Agent  ← only if no rental match
               └─ generates 2D concept layout
        │
        ↓
  OrchestratorResult
        │
  recommendedPath = 'rental'?
     YES → Continue Booking Flow  (/book)
     NO  → Continue Custom Concept Flow  (/new)
```

No sub-agent calls another sub-agent directly. All sequencing is in `OrchestratorService`.

### Example workflow

**Input:** Sleeps 4 · Roof-Top Tent · Toyota 4Runner · Budget under $50k · Off-grid capable

| Step | Agent | What happens |
|---|---|---|
| 1 | Intake Agent | Structures brief: `sizeCategory: medium`, `sleeps: 4`, `powerOptions: [solar, battery]`, `upgradeIds: [roof_top_tent]` |
| 2 | Inventory Matching Agent | Searches standard builds; roof-top tent + off-grid narrows matches; returns `quality: 'close'` |
| 3 | Towability & Compliance Agent | Medium trailer + roof-top tent + solar + battery ≈ 5,200 lbs. 4Runner (midsize SUV) is `warning` — near upper limit |
| 4 | Pricing Recommendation Agent | Medium nightly rate + upgrade costs; if no close rental match, recommends Advanced Concept Package ($499) |
| 5 | Layout Recommendation Agent | No strong rental match → generates 2D zone layout with off-grid and outdoor focus |

---

## Sub-Agents

### Agent Inventory

| # | Agent | Workflow | Status | Model |
|---|---|---|---|---|
| 1 | Intake Agent | Rentals + Projects | Planned | claude-sonnet-4-6 |
| 2 | Inventory Matching Agent | Rentals → Projects gate | Planned | claude-sonnet-4-6 |
| 3 | Towability & Compliance Agent | Rentals + Projects | Planned | claude-sonnet-4-6 |
| 4 | Pricing Recommendation Agent | Rentals + Projects | Planned | claude-sonnet-4-6 |
| 5 | Layout Recommendation Agent | Projects | Implemented | claude-opus-4-8 |

---

### 1. Intake Agent

**Purpose:** Collect requirements conversationally — accepting free-text or partial input and producing a fully structured `TrailerBrief` with follow-up questions for any gaps.

**UX:** Chat widget alongside the static `RequirementForm`. Does not replace the form. The static form is the source of truth; the chat helps users fill fields and surface recommendations.

#### Inputs

```ts
interface IntakeAgentInput {
  userMessage: string;
  conversationHistory: IntakeTurn[];  // multi-turn support
  mode: 'rental' | 'project';
}

interface IntakeTurn {
  role: 'user' | 'assistant';
  content: string;
}
```

#### Outputs

```ts
interface IntakeAgentResult {
  partialBrief: Partial<TrailerBrief>;
  followUpQuestions: string[];
  isComplete: boolean;
  assistantMessage: string;
  trailerCategoryRecommendation?: TrailerSizeCategory;
  requirementSummary?: string;
}
```

#### Required fields before `isComplete`

`sizeCategory`, `sleeps`, `bathroomType`, `kitchenType`, `towVehicle`, `intendedUsage`

Optional (filled with defaults): `powerOptions`, `budgetRange`, `designStyle`, `notes`

#### Behavior

- Accepts natural language: *"I need something for 2 people that my Subaru Outback can tow"* → `sleeps: 2`, `towVehicle: 'suv'`, `sizeCategory: 'small'`
- Never re-asks already-answered fields
- Soft-validates tow vehicle vs. size during intake and flags issues early
- On completion, surfaces the structured brief for client confirmation before the Orchestrator proceeds

#### Conversation persistence

- Supabase — submitted and meaningfully progressed intake history must be saved
- Session-only draft state is acceptable for temporary/incomplete turns

#### Fallback

Falls back to the static `RequirementForm` (`src/routes/RequirementForm/RequirementForm.tsx`). Both produce the same `TrailerBrief` shape.

---

### 2. Inventory Matching Agent

**Purpose:** Score available rental inventory against the client's requirements. Determine whether to route to a rental booking or a custom project.

**Trigger:** Orchestrator calls this after the Intake Agent produces a complete (or partial) brief.

#### Inputs

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

#### Outputs

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

#### Logic

- **Exact** — size + sleeps + bathroom + kitchen align with a `STANDARD_BUILD`. Recommend rental.
- **Close** — 1–2 fields differ. Claude explains the delta and whether it's acceptable.
- **None** — fundamental mismatch. Route to custom project.
- **Roof-Top Tent:** if `roof_top_tent` is selected, checks whether matched inventory supports it. No compatible inventory → custom project regardless of other match quality.

#### UI states

> **Match found:** "We found available trailers that match most of your requirements."

> **No match:** "No available rental fully matches your requirements. You can request a custom concept design."

#### Fallback

Exact-match rule lookup using `findEquivalentBuild()` from `src/lib/standardBuilds.ts`. Returns `quality: 'exact'` or `quality: 'none'`, no explanation.

---

### 3. Towability & Compliance Agent

**Purpose:** Validate the trailer size, estimated weight, and upgrades against the client's tow vehicle. Advisory only — never a structural or road-legal certification.

**Trigger:** Orchestrator calls this after Inventory Matching, with the brief + selected upgrades.

**Fail behavior:** Never hard-blocks submission. `fail` status shows a strong warning and requires explicit user acknowledgment.

#### Inputs

```ts
interface TowabilityInput {
  towVehicle: TowVehicle;
  towVehicleDetail?: string;      // e.g. "Toyota 4Runner 2022"
  sizeCategory: TrailerSizeCategory;
  upgradeIds: string[];
}
```

#### Outputs

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

#### Weight adders

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

#### Validation rules

| Tow Vehicle | Compatible Size | Typical Tow Capacity |
|---|---|---|
| Midsize SUV (`suv`) | Small only | 3,500–5,000 lbs |
| Large SUV / Truck (`truck`) | Small or Medium | 6,000–8,500 lbs |
| Unsure (`unsure`) | Small only (conservative) | Unknown |

**Roof load note:** Any upgrade with `affectsRoofLoad: true` appends: *"Selected [upgrade] may increase total trailer height and weight. Review tow vehicle roof load capacity and any height restrictions at your destination."*

#### UI surface

Inline warning card on BookingForm and RequirementForm. `warning` shows a caution banner. `fail` shows a blocking-style alert with acknowledgment checkbox before submission is enabled.

#### Fallback

Static rule table lookup using weight ranges from `TRAILER_SIZE_CATEGORIES` + upgrade weight adders.

---

### 4. Pricing Recommendation Agent

**Purpose:** Estimate rental pricing, recommend the right concept package tier, calculate upgrade costs, and explain the estimate in plain language.

**Trigger:** Orchestrator calls this after Towability, on both rental and custom project paths.

#### Inputs

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

#### Outputs

```ts
interface PricingRecommendationResult {
  rentalEstimate: {
    nightlyRateUsd: number;
    note: string;
  };
  conceptRecommendation: {
    packageId: string;
    packageLabel: string;
    priceUsd: number;
    rationale: string;
  } | null;
  buildEstimate: {
    basePriceUsd: number;
    upgradesTotal: number;
    estimatedRangeMin: number;
    estimatedRangeMax: number;
    selectedUpgrades: { label: string; priceUsd: number }[];
  } | null;
  summaryMessage: string;
  disclaimer: string;   // always PRICING_DISCLAIMER from constraints.ts
}
```

#### Admin override

Admin can replace published estimates with a custom quote. Both values are persisted:

```ts
interface PricingOverride {
  estimatedPrice: number;
  adminOverridePrice: number;
  adminQuoteNotes: string;
}
```

Agent always writes `estimatedPrice`. Admin writes `adminOverridePrice` and `adminQuoteNotes` from the Admin Dashboard. Client-facing surfaces show `adminOverridePrice` when set.

#### Recommendation logic

- **Rental path:** nightly rate + estimated total. No concept package.
- **Custom concept path:**
  - `Basic` ($199) — standard brief, no unusual requirements, budget-conscious
  - `Advanced` ($499) — off-grid power, multiple upgrades, specific style
  - `Premium` ($999+) — full-time living, complex requirements, high budget
- Budget range mismatch (e.g., Large + Premium finishes vs. `under_40k`) surfaces a plain-language note.

#### Fallback

Deterministic calculator using constants from `src/lib/constraints.ts`. No rationale — just computed totals. Same math as the current BookingForm.

---

### 5. Layout Recommendation Agent

**Purpose:** Generate a rough 2D concept layout for a brief that has no equivalent standard build.

**Trigger:** Orchestrator calls this only when `InventoryMatchResult.quality === 'none'` or the client explicitly requests a custom concept.

**Status:** Implemented. See `src/data/conceptLayoutGenerator.ts` and [concept-layout.md](concept-layout.md).

#### Outputs

- Concept summary (rationale text)
- Suggested zone layout (`LayoutZone[]` within the trailer envelope)
- Storage and sleeping recommendations derived from brief

#### Current implementation

- `ClaudeConceptLayoutGenerator` — `claude-opus-4-8`, adaptive thinking, structured JSON via `output_config.format` json_schema, geometry-validated before accepting
- `TemplateConceptLayoutGenerator` — deterministic fallback; always works offline and in tests
- System prompt cached with `cache_control: { type: 'ephemeral' }`
- Currently called from `ProjectRepository.generateConceptLayout()`

#### Planned improvements

| Gap | Target |
|---|---|
| Browser-side API call (`dangerouslyAllowBrowser: true`) | Move to Route Handler via Orchestrator — API key server-only |
| Single layout output | Return 2–3 layout variants for client to choose from |
| Style-aware zoning | Use `designStyle` from brief to influence zone positions |
| Usage-aware sizing | Full-time living → larger kitchenette; weekend → maximize sleeping |

---

## Architecture

### File structure

```
src/data/agents/
  orchestrator.ts               # OrchestratorService — sequences agents, routes workflow
  types.ts                      # shared Agent<TInput, TOutput> interface + all I/O types
  intakeAgent.ts                # ClaudeIntakeAgent + StaticFormFallback
  inventoryMatchingAgent.ts     # ClaudeInventoryMatchingAgent + RuleBasedFallback
  towabilityAgent.ts            # ClaudeTowabilityAgent + RuleTableFallback
  pricingAgent.ts               # ClaudePricingAgent + CalculatorFallback
  conceptLayoutGenerator.ts     # existing — ClaudeConceptLayoutGenerator + TemplateGenerator
  index.ts                      # selects implementations based on ANTHROPIC_API_KEY

app/api/agent/
  orchestrate-intake/route.ts   # POST — receives OrchestratorInput, returns OrchestratorResult
```

### Shared agent contract

```ts
interface Agent<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
}
```

Every sub-agent: typed interface, Claude implementation, deterministic fallback. The fallback is selected automatically when `ANTHROPIC_API_KEY` is absent or when the Claude call fails.

### Implementation selection (`src/data/agents/index.ts`)

```ts
export const intakeAgent = process.env.ANTHROPIC_API_KEY
  ? new ClaudeIntakeAgent(process.env.ANTHROPIC_API_KEY)
  : new StaticFormFallbackIntakeAgent();
// same pattern for each agent
```

### API call pattern (all agents)

- **Route:** Next.js Route Handler — API key is server-only, never in the browser bundle
- **Model:** `claude-sonnet-4-6` for Intake, Matching, Towability, Pricing; `claude-opus-4-8` for Layout
- **Output format:** `output_config.format: json_schema` for all structured outputs
- **Caching:** system prompt cached with `cache_control: { type: 'ephemeral' }`
- **Fallback:** every agent catches errors and returns the deterministic result — AI failures are never surfaced to the user

---

## Resolved Decisions

| Question | Decision |
|---|---|
| Intake Agent UX | Chat widget alongside the static RequirementForm — does not replace it. The form is the source of truth; the chat helps users fill fields and surface recommendations. |
| Intake conversation persistence | Persist to Supabase. Session-only acceptable for draft state; submitted or meaningfully progressed history must be saved. |
| Towability fail behavior | Never hard-block submission (MVP). `fail` shows a strong warning with required acknowledgment before submission is enabled. |
| Pricing admin override | Yes. Agent writes `estimatedPrice`; admin writes `adminOverridePrice` + `adminQuoteNotes` from Admin Dashboard. |
| Orchestrator implementation | Lightweight sequential TypeScript service — no advanced multi-agent infrastructure for MVP. |

---

## Out of Scope (MVP)

- Async / parallel agent execution
- Agent memory or context sharing across agent boundaries
- Autonomous booking confirmation (agents advise; humans confirm)
- Builder assignment or construction scheduling automation
- Real tow-safety certification or regulatory compliance sign-off
- Payment or deposit processing

---

## Future Enhancements

- Async agent execution and parallel sub-agent runs
- Agent memory and context sharing across workflow steps
- Recommendation scoring and ranking
- Workflow analytics (which agents triggered, match rates, override frequency)
- Streaming agent responses to the client
- AI-generated SVG floorplans
- Advanced inventory ranking (beyond exact/close/none)
- Autonomous designer-assistant workflows
- Roof-top tent image previews on upgrade selection
- Outdoor package bundling (roof-top tent + roof rack at a combined price)
- Dynamic towability adjustments as upgrades are added/removed in real time
