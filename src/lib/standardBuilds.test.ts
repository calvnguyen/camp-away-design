import { describe, expect, it } from 'vitest';
import { findEquivalentBuild } from './standardBuilds';
import type { TrailerBrief } from '../types';

function brief(overrides: Partial<TrailerBrief> = {}): TrailerBrief {
  return {
    sizeCategory: 'medium',
    sleeps: 2,
    bathroomType: 'wet_bath',
    kitchenType: 'standard',
    powerOptions: [],
    intendedUsage: 'weekend',
    towVehicle: 'suv',
    budgetRange: '40k_50k',
    designStyle: 'modern',
    notes: '',
    ...overrides,
  };
}

describe('findEquivalentBuild', () => {
  it('matches a standard couple build on the core layout fields', () => {
    expect(findEquivalentBuild(brief())?.id).toBe('std-medium-couple');
  });

  it('ignores power options, usage, tow vehicle, and style when matching', () => {
    expect(findEquivalentBuild(brief({ powerOptions: ['solar', 'battery'], designStyle: 'rustic', towVehicle: 'truck' }))).not.toBeNull();
  });

  it('returns null when sleeping capacity has no standard build', () => {
    expect(findEquivalentBuild(brief({ sleeps: 3 }))).toBeNull();
  });

  it('returns null when bathroom type differs', () => {
    expect(findEquivalentBuild(brief({ bathroomType: 'dry_bath' }))).toBeNull();
  });

  it('matches a large family build', () => {
    expect(findEquivalentBuild(brief({ sizeCategory: 'large', sleeps: 4, kitchenType: 'extended_storage' }))?.id).toBe('std-large-family');
  });
});
