# AI Concept Layout

When a submitted brief has no equivalent standard build, the system can generate a rough 2D concept layout (zones: entry, kitchenette, bathroom, storage, sleeping) as a starting point for review. Generating it is optional; it **must be approved before the project can go to production (build)** — that approval is the gate.

## Match logic

"No equivalent build" is decided by `src/lib/standardBuilds.ts` → `findEquivalentBuild(brief)`. Matches on length + sleeps + wet-bath + kitchenette; ignores solar/battery upgrades. Catalog: `STANDARD_BUILDS`.

## Domain types

`ConceptLayout` lives on `Project.conceptLayout`:

- `status`: `pending_review` | `approved` | `rejected`
- `source`: `ai` | `template`
- `zones: LayoutZone[]` — positions in feet within a length×width envelope

Types in `src/types/index.ts`. Geometry + validation in `src/lib/conceptLayout.ts` (`envelopeFor`, `templateLayout`, `validateLayout`, `REQUIRED_ZONES`).

## Generator

`src/data/conceptLayoutGenerator.ts` — `ConceptLayoutGenerator` interface with two implementations:

**`ClaudeConceptLayoutGenerator`** (primary)
- Claude API → structured JSON via `output_config.format` json_schema
- Validated against the envelope
- Model: `claude-opus-4-8`, adaptive thinking, cached system prompt
- `dangerouslyAllowBrowser: true` — acceptable for this FE-only prototype; moves server-side in the Next.js/Supabase target

**`TemplateConceptLayoutGenerator`** (fallback)
- Deterministic; always works offline and in tests
- Used when `VITE_ANTHROPIC_API_KEY` is not set, or when Claude generator errors/returns invalid output

Selection in `src/data/index.ts`: AI generator when `VITE_ANTHROPIC_API_KEY` is set, else template.

## Repository methods

`ProjectRepository` (`src/data/types.ts`):

- `findEquivalentBuild(brief)` — checks catalog
- `generateConceptLayout(projectId)` — throws if equivalent build exists
- `approveConceptLayout(projectId)` — production gate
- `rejectConceptLayout(projectId)`

## UI components

- `src/components/ConceptLayoutDiagram.tsx` — accessible SVG (`role="img"` + title/desc, every zone labeled so color isn't the only signal)
- `src/components/ConceptLayoutSection.tsx` — three states: matches-a-build / generate / review+approve
- Wired into `ProjectView`

## Why Claude API, not a 3rd-party floorplan service

Researched: Maket.ai, Giraffe360, getfloorplan, ideal.house — all tuned for full houses, require API keys/cost, heavier integration. Claude → JSON → SVG fits the data-layer seam, honors the 16–18 ft envelope, and is fully controllable.

See also: [ADR-002](../decisions/adr-002-concept-layout-generator.md)
