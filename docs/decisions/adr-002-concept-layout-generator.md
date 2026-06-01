# ADR-002: Concept Layout Generator — Claude API over 3rd-party services

**Date:** 2026-05-31  
**Status:** Implemented

## Context

The AI concept layout feature needs a generator that produces 2D zone layouts (entry, kitchenette, bathroom, storage, sleeping) for tiny trailers within a 16–18 ft envelope. We evaluated third-party floorplan APIs vs. using the Claude API directly.

## Options considered

| Option | Notes |
|---|---|
| Maket.ai | Tuned for full houses, requires API key/cost, heavier integration |
| Giraffe360 | House-oriented, not suitable for tiny trailers |
| getfloorplan / ideal.house | Same issues — residential focus, overkill |
| **Claude API → JSON → SVG** | Fits the data-layer seam, honors the envelope, fully controllable |

## Decision

Use Claude API (`claude-opus-4-8`, adaptive thinking, cached system prompt) with `output_config.format` json_schema to produce structured zone data, validated against the envelope before use. Deterministic `TemplateConceptLayoutGenerator` as fallback.

## Consequences

- Works offline and in tests (template fallback always available)
- `dangerouslyAllowBrowser: true` acceptable for this FE-only prototype; moves server-side in Next.js/Supabase target
- Generator is behind the data-layer seam — can swap implementation without touching components
- See [concept-layout.md](../prd/concept-layout.md) for full implementation details
