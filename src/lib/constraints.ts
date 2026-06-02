// Domain constraints from the PRD. Reference these constants for defaults,
// validation, and labels — never hardcode these numbers in components.

import type { TrailerSizeCategory } from '../types';

export interface SizeCategorySpec {
  label: string;
  minLengthFt: number;
  maxLengthFt: number;
  /** Representative length used for concept layout envelopes. */
  envelopeLengthFt: number;
  /** Interior width (ft). */
  widthFt: number;
  /** Typical sleeping range for UI hints. */
  sleepsRange: string;
  towVehicle: string;
  minWeightLbs: number;
  maxWeightLbs: number;
  /** Demo nightly rental rate in USD. */
  nightlyRateUsd: number;
  /** Estimated base custom build price in USD. */
  baseBuildPriceUsd: number;
}

export const TRAILER_SIZE_CATEGORIES: Record<TrailerSizeCategory, SizeCategorySpec> = {
  small: {
    label: 'Small (14–16 ft)',
    minLengthFt: 14,
    maxLengthFt: 16,
    envelopeLengthFt: 16,
    widthFt: 7,
    sleepsRange: '2',
    towVehicle: 'Midsize SUV',
    minWeightLbs: 3_000,
    maxWeightLbs: 4_500,
    nightlyRateUsd: 129,
    baseBuildPriceUsd: 35_000,
  },
  medium: {
    label: 'Medium (17–20 ft)',
    minLengthFt: 17,
    maxLengthFt: 20,
    envelopeLengthFt: 18,
    widthFt: 7.5,
    sleepsRange: '2–4',
    towVehicle: 'Large SUV / Light Truck',
    minWeightLbs: 4_500,
    maxWeightLbs: 6_500,
    nightlyRateUsd: 179,
    baseBuildPriceUsd: 50_000,
  },
  large: {
    label: 'Large (21–24 ft)',
    minLengthFt: 21,
    maxLengthFt: 24,
    envelopeLengthFt: 22,
    widthFt: 8,
    sleepsRange: '4–6',
    towVehicle: 'Full-Size Truck / Heavy SUV',
    minWeightLbs: 6_500,
    maxWeightLbs: 9_000,
    nightlyRateUsd: 229,
    baseBuildPriceUsd: 75_000,
  },
};

export const BUDGET_RANGE_LABELS: Record<string, string> = {
  under_40k: 'Under $40k',
  '40k_50k': '$40k–$50k',
  '50k_70k': '$50k–$70k',
  '70k_plus': '$70k+',
};

export const SLEEP_OPTIONS: { value: number; label: string }[] = [
  { value: 2, label: '2 People' },
  { value: 3, label: '3 People' },
  { value: 4, label: '4 People' },
  { value: 6, label: '5–6 People' },
];

// ─── Rental upgrade pricing ───────────────────────────────────────────────────

export interface UpgradeOption {
  id: string;
  label: string;
  description: string;
  priceUsd: number;
  /** Est. additional weight in lbs — used by Towability Agent. */
  weightAddLbs: number;
  /** True if this upgrade affects roof height or roof load rating. */
  affectsRoofLoad: boolean;
}

export const RENTAL_UPGRADES: UpgradeOption[] = [
  {
    id: 'solar',
    label: 'Solar Package',
    description: 'Roof-mounted solar panels for off-grid power generation.',
    priceUsd: 4_000,
    weightAddLbs: 150,
    affectsRoofLoad: true,
  },
  {
    id: 'battery',
    label: 'Off-Grid Battery System',
    description: 'High-capacity lithium battery bank for extended off-grid stays.',
    priceUsd: 6_000,
    weightAddLbs: 200,
    affectsRoofLoad: false,
  },
  {
    id: 'premium_interior',
    label: 'Premium Interior Finish',
    description: 'Upgraded cabinetry, countertops, and fixtures throughout.',
    priceUsd: 5_000,
    weightAddLbs: 50,
    affectsRoofLoad: false,
  },
  {
    id: 'storage',
    label: 'Expanded Storage Package',
    description: 'Additional under-bed and exterior pass-through storage compartments.',
    priceUsd: 2_500,
    weightAddLbs: 30,
    affectsRoofLoad: false,
  },
  {
    id: 'roof_top_tent',
    label: 'Roof-Top Tent',
    description: 'Adds elevated sleeping/storage functionality for outdoor-focused travel setups.',
    priceUsd: 2_500,
    weightAddLbs: 120,
    affectsRoofLoad: true,
  },
  {
    id: 'roof_rack',
    label: 'Roof Rack / Outdoor Package',
    description: 'Cargo rack, bike mounts, and tie-down system for outdoor gear.',
    priceUsd: 1_500,
    weightAddLbs: 80,
    affectsRoofLoad: true,
  },
  {
    id: 'exterior_wrap',
    label: 'Custom Exterior Wrap',
    description: 'Full custom vinyl wrap in your choice of color or pattern.',
    priceUsd: 3_000,
    weightAddLbs: 10,
    affectsRoofLoad: false,
  },
];

// ─── Concept consultation pricing ────────────────────────────────────────────

export interface ConceptPackage {
  id: string;
  label: string;
  priceUsd: number;
  description: string;
}

export const CONCEPT_PACKAGES: ConceptPackage[] = [
  {
    id: 'basic',
    label: 'Basic AI Concept Layout',
    priceUsd: 199,
    description: 'AI-generated zone layout with rationale',
  },
  {
    id: 'advanced',
    label: 'Advanced Concept Package',
    priceUsd: 499,
    description: 'AI layout + designer review and two revision rounds',
  },
  {
    id: 'premium',
    label: 'Premium Custom Concept Study',
    priceUsd: 999,
    description: 'Full bespoke study with unlimited revisions and final design spec',
  },
];

export const PRICING_DISCLAIMER =
  'Pricing shown is estimate-only for demo purposes. Final pricing determined after architect/designer review.';
