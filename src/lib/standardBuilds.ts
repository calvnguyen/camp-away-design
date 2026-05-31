// Catalog of standardized, already-engineered builds, plus the matcher that
// decides whether a brief has an "equivalent build". When one matches, no
// concept layout is needed — the project can go straight to production. When
// none does, the system offers to generate a rough 2D concept layout.

import type { StandardBuild, TrailerBrief } from '../types';

/** The standard SUV-towable builds the fleet already knows how to make. */
export const STANDARD_BUILDS: StandardBuild[] = [
  { id: 'std-16-couple', name: 'Standard 16 — Couple', lengthFt: 16, sleeps: 2, hasWetBath: true, hasKitchenette: true },
  { id: 'std-17-couple', name: 'Standard 17 — Couple', lengthFt: 17, sleeps: 2, hasWetBath: true, hasKitchenette: true },
  { id: 'std-18-couple', name: 'Standard 18 — Couple', lengthFt: 18, sleeps: 2, hasWetBath: true, hasKitchenette: true },
];

/**
 * Find a standard build equivalent to the brief: same length, same sleeping
 * capacity, and the same wet-bath / kitchenette decisions. Optional upgrades
 * (solar, battery) are bolt-ons that don't change the layout, so they're
 * ignored. Returns the matching build, or null when none fits — that null is
 * what makes a concept layout relevant.
 */
export function findEquivalentBuild(brief: TrailerBrief): StandardBuild | null {
  return (
    STANDARD_BUILDS.find(
      (b) =>
        b.lengthFt === brief.trailerLengthFt &&
        b.sleeps === brief.sleeps &&
        b.hasWetBath === brief.hasWetBath &&
        b.hasKitchenette === brief.hasKitchenette,
    ) ?? null
  );
}
