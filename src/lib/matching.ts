// Whether a fleet trailer's spec satisfies a renter's requirements.
// Pure + framework-agnostic so it's unit-testable and reusable by the data
// layer and any matching UI.

import type { TrailerSpec } from '../types';

export function specSatisfies(unit: TrailerSpec, req: TrailerSpec): boolean {
  if (unit.sleeps < req.sleeps) return false;
  // A renter can be matched to an equal-or-slightly-larger small trailer.
  if (unit.trailerLengthFt < req.trailerLengthFt) return false;
  // Required features must be present; the unit may have extras.
  if (req.hasWetBath && !unit.hasWetBath) return false;
  if (req.hasKitchenette && !unit.hasKitchenette) return false;
  if (req.solar && !unit.solar) return false;
  if (req.battery && !unit.battery) return false;
  return true;
}
