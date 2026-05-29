// Domain constraints from the PRD. Reference these constants for defaults,
// validation, and labels — never hardcode these numbers in components.

export const TRAILER_CONSTRAINTS = {
  trailerLengthFt: { min: 16, max: 18, default: 17 },
  sleeps: { default: 2 },
  maxLoadedWeightLbs: 5_000,
  budgetUsd: { target: 50_000, default: 45_000 },
} as const;

/** Validate a brief's headline fields against the PRD targets. Returns field-keyed messages. */
export function validateBriefConstraints(input: {
  trailerLengthFt: number;
  budgetUsd: number;
}): Partial<Record<'trailerLengthFt' | 'budgetUsd', string>> {
  const errors: Partial<Record<'trailerLengthFt' | 'budgetUsd', string>> = {};
  const { trailerLengthFt, budgetUsd } = TRAILER_CONSTRAINTS;

  if (
    input.trailerLengthFt < trailerLengthFt.min ||
    input.trailerLengthFt > trailerLengthFt.max
  ) {
    errors.trailerLengthFt = `Trailer length should be ${trailerLengthFt.min}–${trailerLengthFt.max} ft for SUV towing.`;
  }
  if (input.budgetUsd > budgetUsd.target) {
    errors.budgetUsd = `Budget is above the ~$${budgetUsd.target.toLocaleString()} target.`;
  }
  return errors;
}
