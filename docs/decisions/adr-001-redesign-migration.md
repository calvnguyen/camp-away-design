# ADR-001: Redesign Migration — Tailwind v4 + New IA

**Date:** 2026-05-30  
**Status:** Implemented

## Context

Porting the Figma Make redesign "CampAwayDesign-Modernize" into the codebase. Two decisions were needed: styling approach and information architecture.

Figma file key: `IieelMEAXBI92AQULNseDx` (a `/make/` file — read via `get_design_context` with `nodeId 0:1`, then `ReadMcpResourceTool` on the returned `file://figma/make/source/...` URIs without the `?fileKey=` suffix).

## Decisions

### 1. Hybrid styling: adopt Tailwind v4, keep the data-layer seam

- Supersedes the original "CSS Modules only, no Tailwind" rule for new screens
- Tailwind v4 wired via `@tailwindcss/vite` in `vite.config.ts`; entry point `src/styles/index.css`, imported in `main.tsx`
- Legacy CSS Modules components (`Button`, `Card`, `Input`, `Toggle`, `StatusBadge`) remain but are unused by new screens

### 2. Adopt the new IA

Product now framed as: **Projects → requirement brief → project view → floorplan review → admin dashboard**

Replaces old rental/fleet/match/reserve-a-build screens. Old rental files deleted.

## What was done

- Tailwind + `react-router` + `lucide-react` installed
- New domain types in `src/types/index.ts` (Project, TrailerBrief, Floorplan, Comment, Firm, DashboardStats)
- `ProjectRepository` interface (`src/data/types.ts`) + `InMemoryProjectRepository` (`src/data/inMemoryProjectRepository.ts`, localStorage-backed) + fixtures
- Five route screens under `src/routes/{ProjectList,RequirementForm,ProjectView,FloorplanReview,AdminDashboard}`
- `src/components/AppNav.tsx`, `ImageWithFallback.tsx`, `src/routes.tsx`, `src/lib/projectStatus.ts`
- Logo system: `src/components/Logo.tsx` (variant: default/white/mark; size: sm/md/lg) + LogoShowcase at `/logo`
- Node 24 localStorage gotcha fixed in `src/setupTests.ts` (in-memory polyfill for jsdom)

## Verified green

`tsc --noEmit`, `eslint`, `npm run build`, `npx vitest run --project unit` (35 tests) as of 2026-05-30.
