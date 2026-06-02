# ADR-004: Agent Architecture — Uniform Interface + Claude + Deterministic Fallback

**Date:** 2026-06-01
**Status:** Accepted

## Context

Camp Away Design requires five Claude-backed agents: Inventory Matching, Intake, Towability & Compliance, Pricing Recommendation, and Layout Recommendation (existing). Each handles a distinct intelligence step in the rental or project workflow. We need to decide how to structure these agents so they're consistent, testable, swappable, and don't leak API keys to the browser.

## Decision

All agents follow the same structural pattern established by the existing `ClaudeConceptLayoutGenerator`:

1. **Typed interface** — `Agent<TInput, TOutput>` — components and routes depend only on the interface, never on a concrete implementation.
2. **Claude implementation** — calls `claude-sonnet-4-6` (or `claude-opus-4-8` for layout) via the Anthropic API from a **Next.js Route Handler**, not the browser. Structured JSON output via `output_config.format: json_schema`. System prompt cached with `cache_control: { type: 'ephemeral' }`.
3. **Deterministic fallback** — every agent has a rule-based or calculator fallback that produces valid output without any API call. Selected automatically when `ANTHROPIC_API_KEY` is absent (tests, local dev) or when the Claude call fails.

Agents live in `src/data/agents/`. Selection happens once in `src/data/agents/index.ts`. Components call agents through the repository layer — never directly.

## Model selection

| Agent | Model | Reason |
|---|---|---|
| Intake | claude-sonnet-4-6 | Conversational, fast; doesn't need deep spatial reasoning |
| Inventory Matching | claude-sonnet-4-6 | Ranking + explanation; fast turn required |
| Towability & Compliance | claude-sonnet-4-6 | Rule application + plain-language output |
| Pricing Recommendation | claude-sonnet-4-6 | Arithmetic + recommendation rationale |
| Layout Recommendation | claude-opus-4-8 | 2D spatial reasoning; quality over speed |

## Consequences

- **No browser API key exposure** — all Claude calls move through Next.js Route Handlers; `ANTHROPIC_API_KEY` is server-only.
- **Always works offline** — deterministic fallbacks mean the app functions in tests and local dev without any API credentials.
- **Consistent seam** — adding or replacing an agent is a new file + `index.ts` entry, not a component change.
- **Cache efficiency** — frozen system prompts hit Anthropic's prompt cache across users on the same agent, reducing latency and cost.
- **Tradeoff:** Route Handlers add a network hop vs. the current browser-direct approach. Acceptable — this is the correct security boundary for production.

## Alternatives considered

| Option | Rejected because |
|---|---|
| Direct browser fetch (current Layout Agent approach) | Leaks API key to client; `dangerouslyAllowBrowser` not acceptable in production |
| Supabase Edge Functions per agent | More operational overhead; Next.js Route Handlers already in the stack |
| One monolithic "orchestrator" agent | Harder to test and replace individual capabilities; agents compose at the route layer instead |
| Third-party AI services (e.g., OpenAI, Bedrock) | Already using Claude; consistency preferred; Claude's json_schema output_config is a strong fit |
