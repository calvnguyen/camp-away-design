import type { TrailerSizeCategory, TowVehicle } from '../../types';
import type { Agent } from './types';
import { TRAILER_SIZE_CATEGORIES, RENTAL_UPGRADES } from '../../lib/constraints';

// ─── I/O types ────────────────────────────────────────────────────────────────

export interface TowabilityInput {
  towVehicle: TowVehicle;
  towVehicleDetail?: string;
  sizeCategory: TrailerSizeCategory;
  upgradeIds: string[];
}

export type ComplianceStatus = 'pass' | 'warning' | 'fail';

export interface TowabilityResult {
  status: ComplianceStatus;
  estimatedWeightLbs: number;
  towCapacityNote: string;
  issues: string[];
  recommendations: string[];
  disclaimer: string;
}

// ─── Tow capacity table (conservative midpoints) ──────────────────────────────

const TOW_CAPACITY: Record<TowVehicle, { maxLbs: number; label: string }> = {
  suv:    { maxLbs: 5000, label: 'Midsize SUV' },
  truck:  { maxLbs: 8500, label: 'Large SUV / Truck' },
  unsure: { maxLbs: 3500, label: 'Unknown vehicle (conservative estimate)' },
};

const DISCLAIMER =
  'Advisory only — not a structural or road-legal certification. ' +
  'Verify towing limits in your vehicle manual before towing.';

// ─── Fallback implementation ──────────────────────────────────────────────────

export class RuleTableTowabilityAgent implements Agent<TowabilityInput, TowabilityResult> {
  async run(input: TowabilityInput): Promise<TowabilityResult> {
    const sizeSpec = TRAILER_SIZE_CATEGORIES[input.sizeCategory];
    const baseWeight = Math.round((sizeSpec.minWeightLbs + sizeSpec.maxWeightLbs) / 2);

    const upgradeWeight = input.upgradeIds.reduce((sum, id) => {
      const upgrade = RENTAL_UPGRADES.find((u) => u.id === id);
      return sum + (upgrade?.weightAddLbs ?? 0);
    }, 0);

    const estimatedWeightLbs = baseWeight + upgradeWeight;
    const capacity = TOW_CAPACITY[input.towVehicle];

    const roofLoadUpgrades = input.upgradeIds
      .map((id) => RENTAL_UPGRADES.find((u) => u.id === id))
      .filter((u) => u?.affectsRoofLoad);

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (roofLoadUpgrades.length > 0) {
      const labels = roofLoadUpgrades.map((u) => u!.label).join(', ');
      recommendations.push(
        `Selected ${labels} may increase total trailer height and weight. ` +
        'Review tow vehicle roof load capacity and any height restrictions at your destination.',
      );
    }

    let status: ComplianceStatus;
    if (estimatedWeightLbs <= capacity.maxLbs * 0.85) {
      status = 'pass';
    } else if (estimatedWeightLbs <= capacity.maxLbs) {
      status = 'warning';
      issues.push(
        `Estimated weight (${estimatedWeightLbs.toLocaleString()} lbs) is near your vehicle's ` +
        `tow limit (~${capacity.maxLbs.toLocaleString()} lbs). Consider a lighter configuration.`,
      );
    } else {
      status = 'fail';
      issues.push(
        `Estimated weight (${estimatedWeightLbs.toLocaleString()} lbs) exceeds the typical tow ` +
        `capacity for a ${capacity.label} (~${capacity.maxLbs.toLocaleString()} lbs).`,
      );
      recommendations.push('Consider a smaller trailer size or fewer weight-adding upgrades.');
    }

    return {
      status,
      estimatedWeightLbs,
      towCapacityNote: `${capacity.label} — typical capacity up to ${capacity.maxLbs.toLocaleString()} lbs`,
      issues,
      recommendations,
      disclaimer: DISCLAIMER,
    };
  }
}
