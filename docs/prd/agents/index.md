# Agent System — Overview

Camp Away Design uses a lightweight **Orchestrator** to coordinate five specialized Claude-backed sub-agents across the rental, pricing, inventory, and custom project workflows. The Orchestrator is a backend coordination layer — not itself an AI agent. Sub-agents are the intelligence; the Orchestrator sequences them and routes the result.

## Agent Inventory

| # | Agent | Workflow | Status | Model | Doc |
|---|---|---|---|---|---|
| 1 | Intake Agent | Rentals + Projects | Implemented (fallback) | claude-sonnet-4-6 | [intake.md](intake.md) |
| 2 | Inventory Matching Agent | Rentals → Projects gate | Implemented (fallback) | claude-sonnet-4-6 | [inventory-matching.md](inventory-matching.md) |
| 3 | Towability & Compliance Agent | Rentals + Projects | Implemented (fallback) | claude-sonnet-4-6 | [towability.md](towability.md) |
| 4 | Pricing Recommendation Agent | Rentals + Projects | Implemented (fallback) | claude-sonnet-4-6 | [pricing.md](pricing.md) |
| 5 | Layout Recommendation Agent | Projects | Implemented | claude-opus-4-8 | [layout.md](layout.md) |

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

**Status:** Planned. File: `src/data/agents/orchestrator.ts`

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

## Architecture

### File structure

```
src/data/agents/
  types.ts                      # Agent<TInput, TOutput> base contract ✓
  intakeAgent.ts                # I/O types + StaticFormFallbackIntakeAgent ✓
  inventoryMatchingAgent.ts     # I/O types + RuleBasedInventoryMatchingAgent ✓
  towabilityAgent.ts            # I/O types + RuleTableTowabilityAgent ✓
  pricingAgent.ts               # I/O types + CalculatorFallbackPricingAgent ✓
  conceptLayoutGenerator.ts     # I/O types + ClaudeConceptLayoutGenerator ✓
  orchestrator.ts               # OrchestratorService (planned)
  index.ts                      # exports all agent instances ✓

src/components/IntakeChat/
  IntakeChat.tsx                # chat widget on /new — calls POST /api/agent/intake ✓

src/routes/NewProject/
  NewProjectLayout.tsx          # two-column /new page: RequirementForm + IntakeChat ✓

app/api/agent/
  intake/route.ts               # POST /api/agent/intake ✓
  orchestrate-intake/route.ts   # POST /api/agent/orchestrate-intake (planned)
```

### Shared agent contract

```ts
// src/data/agents/types.ts
interface Agent<TInput, TOutput> {
  run(input: TInput): Promise<TOutput>;
}
```

Every sub-agent: typed I/O interfaces, Claude implementation (planned), deterministic fallback (implemented). The fallback is active when `ANTHROPIC_API_KEY` is absent or a Claude call fails — AI failures never surface to the user.

### Implementation selection (`src/data/agents/index.ts`)

```ts
// Swap each fallback for its Claude implementation when ANTHROPIC_API_KEY is present.
export const intakeAgent = new StaticFormFallbackIntakeAgent();
export const inventoryMatchingAgent = new RuleBasedInventoryMatchingAgent();
export const towabilityAgent = new RuleTableTowabilityAgent();
export const pricingAgent = new CalculatorFallbackPricingAgent();
```

### API call pattern (Claude implementations)

- **Route:** Next.js Route Handler — API key is server-only, never in the browser bundle
- **Model:** `claude-sonnet-4-6` for Intake, Matching, Towability, Pricing; `claude-opus-4-8` for Layout
- **Output format:** `output_config.format: json_schema` for all structured outputs
- **Caching:** system prompt cached with `cache_control: { type: 'ephemeral' }`
- **Fallback:** every agent catches errors and returns the deterministic result

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
