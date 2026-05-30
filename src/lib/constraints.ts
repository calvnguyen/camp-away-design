// Domain constraints from the PRD. Reference these constants for defaults,
// validation, and labels — never hardcode these numbers in components.

export const TRAILER_CONSTRAINTS = {
  trailerLengthFt: { min: 16, max: 18, default: 17 },
  sleeps: { default: 2 },
  maxLoadedWeightLbs: 5_000,
  /** Small trailers must be buildable under this to stay quick + cheap (build-side ceiling). */
  buildCostCeilingUsd: 50_000,
} as const;

/**
 * Validate a rental request's headline fields against the small-trailer range.
 * Returns field-keyed warning messages (soft — these warn, they don't block).
 */
export function validateRequirements(input: {
  trailerLengthFt: number;
}): Partial<Record<'trailerLengthFt', string>> {
  const errors: Partial<Record<'trailerLengthFt', string>> = {};
  const { trailerLengthFt } = TRAILER_CONSTRAINTS;

  if (
    input.trailerLengthFt < trailerLengthFt.min ||
    input.trailerLengthFt > trailerLengthFt.max
  ) {
    errors.trailerLengthFt = `Trailer length should be ${trailerLengthFt.min}–${trailerLengthFt.max} ft for a small, SUV-towable rental.`;
  }
  return errors;
}
