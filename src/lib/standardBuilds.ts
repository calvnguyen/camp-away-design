// Catalog of standardized, already-engineered builds, plus the matcher that
// decides whether a brief has an "equivalent build". When one matches, no
// concept layout is needed — the project can go straight to production. When
// none does, the system offers to generate a rough 2D concept layout.

import type { StandardBuild, TrailerBrief } from '../types';

/** The standard SUV-towable builds the fleet already knows how to make. */
export const STANDARD_BUILDS: StandardBuild[] = [
  { id: 'std-small-couple', name: 'Standard Small — Couple', sizeCategory: 'small', sleeps: 2, bathroomType: 'wet_bath', kitchenType: 'standard' },
  { id: 'std-medium-couple', name: 'Standard Medium — Couple', sizeCategory: 'medium', sleeps: 2, bathroomType: 'wet_bath', kitchenType: 'standard' },
  { id: 'std-medium-family', name: 'Standard Medium — Family', sizeCategory: 'medium', sleeps: 4, bathroomType: 'wet_bath', kitchenType: 'standard' },
  { id: 'std-large-family', name: 'Standard Large — Family', sizeCategory: 'large', sleeps: 4, bathroomType: 'wet_bath', kitchenType: 'extended_storage' },
  { id: 'std-large-extended', name: 'Standard Large — Extended', sizeCategory: 'large', sleeps: 6, bathroomType: 'wet_bath', kitchenType: 'extended_storage' },
];

/**
 * Find a standard build equivalent to the brief: same size category, same
 * sleeping capacity, same bathroom type, and same kitchen type. Power options,
 * design style, and usage intent are bolt-ons that don't affect layout.
 * Returns the matching build, or null — that null makes a concept layout relevant.
 */
export function findEquivalentBuild(brief: TrailerBrief): StandardBuild | null {
  return (
    STANDARD_BUILDS.find(
      (b) =>
        b.sizeCategory === brief.sizeCategory &&
        b.sleeps === brief.sleeps &&
        b.bathroomType === brief.bathroomType &&
        b.kitchenType === brief.kitchenType,
    ) ?? null
  );
}
