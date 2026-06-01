import { describe, expect, it } from 'vitest';
import {
  REQUIRED_ZONES,
  envelopeFor,
  templateLayout,
  validateLayout,
} from './conceptLayout';
import { TRAILER_SIZE_CATEGORIES } from './constraints';
import type { LayoutZone } from '../types';

describe('envelopeFor', () => {
  it('returns the envelope length for each size category', () => {
    for (const [cat, spec] of Object.entries(TRAILER_SIZE_CATEGORIES)) {
      expect(envelopeFor({ sizeCategory: cat as 'small' | 'medium' | 'large' }).lengthFt)
        .toBe(spec.envelopeLengthFt);
    }
  });

  it('uses the per-category interior width', () => {
    expect(envelopeFor({ sizeCategory: 'small' }).widthFt).toBe(TRAILER_SIZE_CATEGORIES.small.widthFt);
    expect(envelopeFor({ sizeCategory: 'large' }).widthFt).toBe(TRAILER_SIZE_CATEGORIES.large.widthFt);
  });
});

describe('templateLayout', () => {
  it('includes every required zone exactly once', () => {
    const zones = templateLayout(envelopeFor({ sizeCategory: 'medium' }));
    const kinds = zones.map((z) => z.kind).sort();
    expect(kinds).toEqual([...REQUIRED_ZONES].sort());
  });

  it('produces a layout that fills the envelope and passes validation', () => {
    const envelope = envelopeFor({ sizeCategory: 'medium' });
    const zones = templateLayout(envelope);
    expect(validateLayout(zones, envelope).ok).toBe(true);
    const covered = zones.reduce((sum, z) => sum + z.width, 0);
    expect(covered).toBeCloseTo(envelope.lengthFt, 1);
  });
});

describe('validateLayout', () => {
  const envelope = { lengthFt: 17, widthFt: 7 };
  const full = (): LayoutZone[] => templateLayout(envelope);

  it('rejects a layout missing a required zone', () => {
    const zones = full().filter((z) => z.kind !== 'bathroom');
    const result = validateLayout(zones, envelope);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/bathroom/);
  });

  it('rejects a zone that escapes the envelope', () => {
    const zones = full();
    zones[0] = { ...zones[0], x: 16, width: 5 }; // runs past lengthFt = 17
    const result = validateLayout(zones, envelope);
    expect(result.ok).toBe(false);
    expect(result.errors.join(' ')).toMatch(/outside/);
  });

  it('rejects duplicate zones', () => {
    const zones = full();
    zones[1] = { ...zones[1], kind: zones[0].kind };
    expect(validateLayout(zones, envelope).ok).toBe(false);
  });

  it('rejects non-positive sizes', () => {
    const zones = full();
    zones[0] = { ...zones[0], width: 0 };
    expect(validateLayout(zones, envelope).ok).toBe(false);
  });
});
