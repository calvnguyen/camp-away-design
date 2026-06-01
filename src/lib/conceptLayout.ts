// Concept-layout geometry: the deterministic template generator and the
// validator that any AI-produced layout must pass. Kept framework-agnostic and
// pure so it's unit-testable without rendering and reusable by both the template
// generator and the Claude generator's output check.

import { TRAILER_SIZE_CATEGORIES } from './constraints';
import type { LayoutZone, TrailerBrief, ZoneKind } from '../types';

/** Zones every concept layout must contain (entry, kitchenette, bath, storage, sleeping). */
export const REQUIRED_ZONES: ZoneKind[] = [
  'entry',
  'kitchenette',
  'bathroom',
  'storage',
  'sleeping',
];

/** Small float tolerance for envelope/overlap checks (feet). */
const EPS = 0.01;

export interface ConceptEnvelope {
  lengthFt: number;
  widthFt: number;
}

/** The trailer envelope a layout is built within, derived from the brief's size category. */
export function envelopeFor(brief: Pick<TrailerBrief, 'sizeCategory'>): ConceptEnvelope {
  const spec = TRAILER_SIZE_CATEGORIES[brief.sizeCategory];
  return { lengthFt: spec.envelopeLengthFt, widthFt: spec.widthFt };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Deterministic rough zoning: partition the length front→back into entry,
 * kitchenette, bathroom, storage, and a rear sleeping area, each spanning the
 * full width. Proportions scale with the trailer length. This is intentionally
 * simple — a starting point for review, not an architectural drawing. It is also
 * the fallback when the AI generator is unavailable or returns invalid output.
 */
export function templateLayout(envelope: ConceptEnvelope): LayoutZone[] {
  const { lengthFt, widthFt } = envelope;

  // Fractions of the length allocated front→back; they sum to 1.
  const order: { kind: ZoneKind; fraction: number }[] = [
    { kind: 'entry', fraction: 0.1 },
    { kind: 'kitchenette', fraction: 0.24 },
    { kind: 'bathroom', fraction: 0.18 },
    { kind: 'storage', fraction: 0.12 },
    { kind: 'sleeping', fraction: 0.36 },
  ];

  const zones: LayoutZone[] = [];
  let x = 0;
  order.forEach((seg, i) => {
    // Absorb rounding drift into the last zone so the layout fills the envelope.
    const width =
      i === order.length - 1 ? round(lengthFt - x) : round(lengthFt * seg.fraction);
    zones.push({ kind: seg.kind, x: round(x), y: 0, width, depth: widthFt });
    x = round(x + width);
  });
  return zones;
}

export interface LayoutValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * Validate a set of zones against the envelope: required zones present, no
 * duplicates, each rectangle within bounds and positive-sized. Used to vet the
 * AI generator's output before trusting it (else we fall back to the template).
 */
export function validateLayout(
  zones: LayoutZone[],
  envelope: ConceptEnvelope,
): LayoutValidationResult {
  const errors: string[] = [];
  const kinds = zones.map((z) => z.kind);

  for (const required of REQUIRED_ZONES) {
    if (!kinds.includes(required)) errors.push(`Missing zone: ${required}`);
  }
  if (new Set(kinds).size !== kinds.length) {
    errors.push('Duplicate zones are not allowed.');
  }

  for (const z of zones) {
    if (z.width <= 0 || z.depth <= 0) {
      errors.push(`Zone ${z.kind} must have positive size.`);
    }
    if (
      z.x < -EPS ||
      z.y < -EPS ||
      z.x + z.width > envelope.lengthFt + EPS ||
      z.y + z.depth > envelope.widthFt + EPS
    ) {
      errors.push(`Zone ${z.kind} falls outside the trailer envelope.`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/** A short, plain-language summary of the zoning for display under the diagram. */
export function templateRationale(envelope: ConceptEnvelope): string {
  return (
    `Rough zoning for a ${envelope.lengthFt}ft × ${envelope.widthFt}ft trailer: entry at the ` +
    `hitch end, then kitchenette and wet bath mid-body, storage, and a rear sleeping area. ` +
    `A starting point for review — not a final architectural drawing.`
  );
}
