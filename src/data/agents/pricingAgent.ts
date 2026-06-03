import type { TrailerSizeCategory, BudgetRange, UsageIntent, PowerOption } from '../../types';
import type { Agent } from './types';
import {
  TRAILER_SIZE_CATEGORIES,
  RENTAL_UPGRADES,
  CONCEPT_PACKAGES,
  PRICING_DISCLAIMER,
} from '../../lib/constraints';

// ─── I/O types ────────────────────────────────────────────────────────────────

export interface PricingRecommendationInput {
  sizeCategory: TrailerSizeCategory;
  upgradeIds: string[];
  isCustomConcept: boolean;
  budgetRange: BudgetRange;
  intendedUsage: UsageIntent;
  powerOptions: PowerOption[];
  notes: string;
}

export interface PricingRecommendationResult {
  rentalEstimate: {
    nightlyRateUsd: number;
    note: string;
  };
  conceptRecommendation: {
    packageId: string;
    packageLabel: string;
    priceUsd: number;
    rationale: string;
  } | null;
  buildEstimate: {
    basePriceUsd: number;
    upgradesTotal: number;
    estimatedRangeMin: number;
    estimatedRangeMax: number;
    selectedUpgrades: { label: string; priceUsd: number }[];
  } | null;
  summaryMessage: string;
  disclaimer: string;
}

export interface PricingOverride {
  estimatedPrice: number;
  adminOverridePrice: number;
  adminQuoteNotes: string;
}

// ─── Build base prices ────────────────────────────────────────────────────────

const BUILD_BASE_PRICE: Record<TrailerSizeCategory, number> = {
  small:  35000,
  medium: 50000,
  large:  75000,
};

// ─── Fallback implementation ──────────────────────────────────────────────────

export class CalculatorFallbackPricingAgent
  implements Agent<PricingRecommendationInput, PricingRecommendationResult>
{
  async run(input: PricingRecommendationInput): Promise<PricingRecommendationResult> {
    const sizeSpec = TRAILER_SIZE_CATEGORIES[input.sizeCategory];
    const nightlyRateUsd = sizeSpec.nightlyRateUsd;

    const selectedUpgrades = input.upgradeIds
      .map((id) => RENTAL_UPGRADES.find((u) => u.id === id))
      .filter((u): u is NonNullable<typeof u> => u !== undefined);

    const upgradesTotal = selectedUpgrades.reduce((sum, u) => sum + u.priceUsd, 0);
    const basePriceUsd = BUILD_BASE_PRICE[input.sizeCategory];

    const rentalEstimate = {
      nightlyRateUsd,
      note: `${sizeSpec.label} trailer — $${nightlyRateUsd}/night`,
    };

    if (!input.isCustomConcept) {
      return {
        rentalEstimate,
        conceptRecommendation: null,
        buildEstimate: null,
        summaryMessage: `Rental estimate: $${nightlyRateUsd}/night for a ${sizeSpec.label} trailer.`,
        disclaimer: PRICING_DISCLAIMER,
      };
    }

    // Pick concept package tier based on complexity
    const isComplex =
      input.intendedUsage === 'full_time' ||
      input.powerOptions.length >= 2 ||
      selectedUpgrades.length >= 3;
    const isAdvanced =
      input.powerOptions.includes('solar') ||
      input.powerOptions.includes('battery') ||
      selectedUpgrades.length >= 2;

    const pkg = isComplex
      ? CONCEPT_PACKAGES.find((p) => p.id === 'premium')!
      : isAdvanced
        ? CONCEPT_PACKAGES.find((p) => p.id === 'advanced')!
        : CONCEPT_PACKAGES.find((p) => p.id === 'basic')!;

    const conceptRecommendation = {
      packageId: pkg.id,
      packageLabel: pkg.label,
      priceUsd: pkg.priceUsd,
      rationale: pkg.description,
    };

    const buildEstimate = {
      basePriceUsd,
      upgradesTotal,
      estimatedRangeMin: basePriceUsd + upgradesTotal,
      estimatedRangeMax: Math.round((basePriceUsd + upgradesTotal) * 1.15),
      selectedUpgrades: selectedUpgrades.map((u) => ({ label: u.label, priceUsd: u.priceUsd })),
    };

    return {
      rentalEstimate,
      conceptRecommendation,
      buildEstimate,
      summaryMessage:
        `Custom concept: ${pkg.label} ($${pkg.priceUsd.toLocaleString()}). ` +
        `Estimated build: $${buildEstimate.estimatedRangeMin.toLocaleString()}–` +
        `$${buildEstimate.estimatedRangeMax.toLocaleString()}.`,
      disclaimer: PRICING_DISCLAIMER,
    };
  }
}
