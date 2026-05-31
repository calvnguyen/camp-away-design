import { describe, expect, it } from 'vitest';
import { findEquivalentBuild } from './standardBuilds';
import type { TrailerBrief } from '../types';

function brief(overrides: Partial<TrailerBrief> = {}): TrailerBrief {
  return {
    trailerLengthFt: 17,
    sleeps: 2,
    hasWetBath: true,
    hasKitchenette: true,
    solar: false,
    battery: false,
    budgetUsd: 45_000,
    notes: '',
    ...overrides,
  };
}

describe('findEquivalentBuild', () => {
  it('matches a standard couple build on the core layout fields', () => {
    expect(findEquivalentBuild(brief())?.id).toBe('std-17-couple');
  });

  it('ignores optional solar/battery upgrades when matching', () => {
    expect(findEquivalentBuild(brief({ solar: true, battery: true }))).not.toBeNull();
  });

  it('returns null when sleeping capacity has no standard build', () => {
    expect(findEquivalentBuild(brief({ sleeps: 3 }))).toBeNull();
  });

  it('returns null when the wet bath is omitted', () => {
    expect(findEquivalentBuild(brief({ hasWetBath: false }))).toBeNull();
  });
});
