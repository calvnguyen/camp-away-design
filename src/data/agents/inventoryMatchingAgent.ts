import type { TrailerSizeCategory, BathroomType, KitchenType, TowVehicle, PowerOption, UsageIntent } from '../../types';
import type { Agent } from './types';
import { STANDARD_BUILDS } from '../../lib/standardBuilds';

// ─── I/O types ────────────────────────────────────────────────────────────────

export interface InventoryMatchInput {
  sizeCategory: TrailerSizeCategory;
  sleeps: number;
  bathroomType: BathroomType;
  kitchenType: KitchenType;
  towVehicle: TowVehicle;
  powerOptions: PowerOption[];
  upgradeIds: string[];
  intendedUsage: UsageIntent;
  notes: string;
}

export type MatchQuality = 'exact' | 'close' | 'none';

export interface InventoryMatchResult {
  quality: MatchQuality;
  matchedBuildIds: string[];
  closestCategories: TrailerSizeCategory[];
  explanation: string;
  recommendRental: boolean;
  suggestedSize?: TrailerSizeCategory;
}

// ─── Fallback implementation ──────────────────────────────────────────────────

export class RuleBasedInventoryMatchingAgent
  implements Agent<InventoryMatchInput, InventoryMatchResult>
{
  async run(input: InventoryMatchInput): Promise<InventoryMatchResult> {
    const match = STANDARD_BUILDS.find(
      (b) =>
        b.sizeCategory === input.sizeCategory &&
        b.sleeps === input.sleeps &&
        b.bathroomType === input.bathroomType &&
        b.kitchenType === input.kitchenType,
    ) ?? null;

    const hasRoofTopTent = input.upgradeIds.includes('roof_top_tent');

    if (match && !hasRoofTopTent) {
      return {
        quality: 'exact',
        matchedBuildIds: [match.id],
        closestCategories: [input.sizeCategory],
        explanation: `Your requirements match the ${match.name} standard build.`,
        recommendRental: true,
      };
    }

    if (hasRoofTopTent) {
      return {
        quality: 'none',
        matchedBuildIds: [],
        closestCategories: [input.sizeCategory],
        explanation: 'No rental inventory supports a roof-top tent. A custom project is required.',
        recommendRental: false,
      };
    }

    return {
      quality: 'none',
      matchedBuildIds: [],
      closestCategories: [input.sizeCategory],
      explanation: 'No rental match found for your requirements. A custom project is recommended.',
      recommendRental: false,
    };
  }
}
