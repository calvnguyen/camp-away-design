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
