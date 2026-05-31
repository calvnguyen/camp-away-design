import { describe, expect, it } from 'vitest';
import {
  REQUIRED_ZONES,
  envelopeFor,
  templateLayout,
  validateLayout,
} from './conceptLayout';
import { TRAILER_CONSTRAINTS } from './constraints';
import type { LayoutZone } from '../types';

describe('envelopeFor', () => {
  it('clamps the length into the SUV-towable range', () => {
    expect(envelopeFor({ trailerLengthFt: 24 }).lengthFt).toBe(TRAILER_CONSTRAINTS.trailerLengthFt.max);
    expect(envelopeFor({ trailerLengthFt: 10 }).lengthFt).toBe(TRAILER_CONSTRAINTS.trailerLengthFt.min);
    expect(envelopeFor({ trailerLengthFt: 17 }).lengthFt).toBe(17);
  });

  it('uses the standard interior width', () => {
    expect(envelopeFor({ trailerLengthFt: 17 }).widthFt).toBe(TRAILER_CONSTRAINTS.widthFt);
  });
});

describe('templateLayout', () => {
  it('includes every required zone exactly once', () => {
    const zones = templateLayout(envelopeFor({ trailerLengthFt: 17 }));
    const kinds = zones.map((z) => z.kind).sort();
    expect(kinds).toEqual([...REQUIRED_ZONES].sort());
  });

  it('produces a layout that fills the envelope and passes validation', () => {
    const envelope = envelopeFor({ trailerLengthFt: 18 });
    const zones = templateLayout(envelope);
    expect(validateLayout(zones, envelope).ok).toBe(true);
    // The zones span the full length front-to-back.
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
