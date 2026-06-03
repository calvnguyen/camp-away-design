# Agent 1 — Intake Agent

**Purpose:** Collect requirements conversationally — accepting free-text or partial input and producing a fully structured `TrailerBrief` with follow-up questions for any gaps.

**Workflow:** Rentals + Projects

**Model:** `claude-sonnet-4-6`

**Status:** Fallback implemented. `StaticFormFallbackIntakeAgent` does keyword extraction and asks follow-up questions for missing required fields. `IntakeChat` widget is live on `/new` alongside the `RequirementForm`. Claude implementation slots in via `ANTHROPIC_API_KEY` in `src/data/agents/index.ts`.

**Files:**
- `src/data/agents/intakeAgent.ts` — I/O types + `StaticFormFallbackIntakeAgent`
- `src/components/IntakeChat/IntakeChat.tsx` — chat widget
- `src/routes/NewProject/NewProjectLayout.tsx` — two-column `/new` layout
- `app/api/agent/intake/route.ts` — `POST /api/agent/intake`

---

## UX

Chat widget alongside the static `RequirementForm` on `/new`. Does not replace the form. The static form is the source of truth; the chat helps users fill fields and surface recommendations.

---

## Inputs

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

## Outputs

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

---

## Required fields before `isComplete`

`sizeCategory`, `sleeps`, `bathroomType`, `kitchenType`, `towVehicle`, `intendedUsage`

Optional (filled with defaults): `powerOptions`, `budgetRange`, `designStyle`, `notes`

---

## Behavior

- Accepts natural language: *"I need something for 2 people that my Subaru Outback can tow"* → `sleeps: 2`, `towVehicle: 'suv'`, `sizeCategory: 'small'`
- Never re-asks already-answered fields
- Soft-validates tow vehicle vs. size during intake and flags issues early
- On completion, surfaces the structured brief for client confirmation before the Orchestrator proceeds

---

## Conversation persistence

- Supabase — submitted and meaningfully progressed intake history must be saved
- Session-only draft state is acceptable for temporary/incomplete turns

---

## Fallback

`StaticFormFallbackIntakeAgent` — keyword extraction across all user turns in history. Infers `sizeCategory` from `sleeps` and `towVehicle` when not explicitly stated. Asks follow-up questions for missing required fields in order.

Falls back gracefully to the static `RequirementForm` (`src/routes/RequirementForm/RequirementForm.tsx`). Both produce the same `TrailerBrief` shape.
