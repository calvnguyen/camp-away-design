import { describe, expect, it } from 'vitest';
import { TRAILER_CONSTRAINTS, validateBriefConstraints } from './constraints';

describe('validateBriefConstraints', () => {
  it('accepts a brief within the PRD targets', () => {
    const errors = validateBriefConstraints({
      trailerLengthFt: TRAILER_CONSTRAINTS.trailerLengthFt.default,
      budgetUsd: 45_000,
    });
    expect(errors).toEqual({});
  });

  it('flags a trailer length outside 16–18 ft', () => {
    const errors = validateBriefConstraints({ trailerLengthFt: 22, budgetUsd: 45_000 });
    expect(errors.trailerLengthFt).toBeDefined();
  });

  it('flags a budget over the ~$50k target', () => {
    const errors = validateBriefConstraints({ trailerLengthFt: 17, budgetUsd: 60_000 });
    expect(errors.budgetUsd).toBeDefined();
  });
});
