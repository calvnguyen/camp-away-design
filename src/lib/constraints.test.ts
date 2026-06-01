import { describe, expect, it } from 'vitest';
import { TRAILER_SIZE_CATEGORIES } from './constraints';

describe('TRAILER_SIZE_CATEGORIES', () => {
  it('has entries for small, medium, and large', () => {
    expect(TRAILER_SIZE_CATEGORIES.small).toBeDefined();
    expect(TRAILER_SIZE_CATEGORIES.medium).toBeDefined();
    expect(TRAILER_SIZE_CATEGORIES.large).toBeDefined();
  });

  it('envelope lengths fall within their length ranges', () => {
    for (const [, spec] of Object.entries(TRAILER_SIZE_CATEGORIES)) {
      expect(spec.envelopeLengthFt).toBeGreaterThanOrEqual(spec.minLengthFt);
      expect(spec.envelopeLengthFt).toBeLessThanOrEqual(spec.maxLengthFt);
    }
  });

  it('weight ranges are ordered low-to-high across categories', () => {
    expect(TRAILER_SIZE_CATEGORIES.small.maxWeightLbs).toBeLessThanOrEqual(TRAILER_SIZE_CATEGORIES.medium.minWeightLbs);
    expect(TRAILER_SIZE_CATEGORIES.medium.maxWeightLbs).toBeLessThanOrEqual(TRAILER_SIZE_CATEGORIES.large.minWeightLbs);
  });
});
