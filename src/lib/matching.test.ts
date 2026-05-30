import { describe, expect, it } from 'vitest';
import { specSatisfies } from './matching';
import type { TrailerSpec } from '../types';

const unit: TrailerSpec = {
  trailerLengthFt: 18,
  sleeps: 2,
  hasWetBath: true,
  hasKitchenette: true,
  solar: true,
  battery: true,
};

function req(overrides: Partial<TrailerSpec> = {}): TrailerSpec {
  return {
    trailerLengthFt: 17,
    sleeps: 2,
    hasWetBath: true,
    hasKitchenette: true,
    solar: false,
    battery: false,
    ...overrides,
  };
}

describe('specSatisfies', () => {
  it('matches when the unit meets or exceeds every requirement', () => {
    expect(specSatisfies(unit, req())).toBe(true);
  });

  it('fails when the unit sleeps fewer than required', () => {
    expect(specSatisfies(unit, req({ sleeps: 3 }))).toBe(false);
  });

  it('fails when a required feature is missing', () => {
    const noSolar = { ...unit, solar: false };
    expect(specSatisfies(noSolar, req({ solar: true }))).toBe(false);
  });

  it('fails when the unit is smaller than requested', () => {
    expect(specSatisfies(unit, req({ trailerLengthFt: 20 }))).toBe(false);
  });

  it('ignores extras the renter did not ask for', () => {
    // unit has solar+battery; req wants neither — still a match
    expect(specSatisfies(unit, req({ solar: false, battery: false }))).toBe(true);
  });
});
