# ADR-005: Agent Orchestrator — Sequential TypeScript Service over Multi-Agent Framework

**Date:** 2026-06-01
**Status:** Accepted

## Context

The agent system requires five sub-agents to run in a defined sequence (Intake → Inventory Matching → Towability → Pricing → Layout) and route the result to either a rental booking or custom project. We need a coordination layer that sequences agents, passes data between them, and determines the next workflow step.

## Decision

Implement a lightweight `OrchestratorService` in TypeScript (`src/data/agents/orchestrator.ts`) that:

- calls sub-agents sequentially in a fixed order
- passes each agent's output as input context to the next
- decides the recommended workflow path (`rental` vs. `project`) based on `InventoryMatchResult`
- conditionally runs the Layout Agent only when no rental match is found
- exposes a single Next.js Route Handler at `POST /api/agent/orchestrate-intake`

The Orchestrator is **not** an AI agent. It contains no Claude calls. It is a typed TypeScript function that sequences `Agent.run()` calls and aggregates their outputs into `OrchestratorResult`.

## Consequences

- **Simple to reason about** — sequential execution, no concurrency, no shared mutable state. Easy to trace in logs.
- **Easy to test** — inject mock agents; test orchestrator logic without any Claude calls.
- **Easy to extend** — adding a new agent is a new sequential step; adding parallel execution later is an incremental change, not a rewrite.
- **Tradeoff:** Sequential execution adds latency (each agent waits for the previous). Acceptable for MVP; parallel execution is a future enhancement once the workflow is validated.
- **Tradeoff:** No shared memory between agents — each receives only what the orchestrator explicitly passes. Intentional for MVP; avoids implicit state bugs.

## Alternatives considered

| Option | Rejected because |
|---|---|
| Each agent called independently from the UI | No central coordination; workflow routing logic would leak into components |
| LangChain / LangGraph or similar framework | Adds a heavy dependency; sequential TypeScript is sufficient for this workflow |
| One monolithic Claude prompt that does all steps | Loses individual agent fallbacks; harder to test; single point of failure |
| Parallel agent execution from the start | Agents 3–5 depend on earlier outputs; parallelism requires careful dependency mapping — save for when the workflow is stable |
