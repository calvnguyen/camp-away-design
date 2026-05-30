import type { TrailerSpec } from '../types';

/** Human-readable one-line summary of a trailer spec, e.g.
 *  "17 ft · sleeps 2 · wet bath · kitchenette · solar". */
export function specSummary(spec: TrailerSpec): string {
  const parts = [`${spec.trailerLengthFt} ft`, `sleeps ${spec.sleeps}`];
  if (spec.hasWetBath) parts.push('wet bath');
  if (spec.hasKitchenette) parts.push('kitchenette');
  if (spec.solar) parts.push('solar');
  if (spec.battery) parts.push('battery');
  return parts.join(' · ');
}
