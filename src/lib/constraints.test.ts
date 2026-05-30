import { describe, expect, it } from 'vitest';
import { TRAILER_CONSTRAINTS, validateRequirements } from './constraints';

describe('validateRequirements', () => {
  it('accepts a length within the small-trailer range', () => {
    const errors = validateRequirements({
      trailerLengthFt: TRAILER_CONSTRAINTS.trailerLengthFt.default,
    });
    expect(errors).toEqual({});
  });

  it('flags a trailer length outside 16–18 ft', () => {
    expect(validateRequirements({ trailerLengthFt: 22 }).trailerLengthFt).toBeDefined();
    expect(validateRequirements({ trailerLengthFt: 12 }).trailerLengthFt).toBeDefined();
  });
});
