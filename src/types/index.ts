// Shared domain types for Camp Away Design — a design-first rental platform for
// small, SUV-towable tiny trailers. See ../../../../docs/prd.md for the spec.
//
// Model: a renter DESIGNS the trailer they want (a TrailerSpec) and submits it
// as a RentalRequest; the platform matches it to an AVAILABLE Trailer in the
// fleet. A renter can SAVE a design (TrailerDesign) to reuse, and when nothing
// matches they can RESERVE a build — a BuildOrder flagged for their request,
// whose finished unit is HELD ('reserved') for them before it joins the general
// fleet. Ops also commission BuildOrders from third-party Builders against
// aggregate demand, decoupled from any single request.

export type UserRole = 'client' | 'builder' | 'admin';

/** The shared shape of a trailer's capabilities — used both for fleet units
 *  and for what a renter requires. */
export interface TrailerSpec {
  trailerLengthFt: number; // small only, target 16-18
  sleeps: number; // adults
  hasWetBath: boolean;
  hasKitchenette: boolean;
  solar: boolean;
  battery: boolean;
}

export type TrailerStatus =
  | 'available' // rentable now
  | 'rented' // currently out on a confirmed rental
  | 'maintenance'; // temporarily not rentable

/** A rentable unit in the fleet. */
export interface Trailer {
  id: string;
  /** Fleet label, e.g. "CA-017". */
  name: string;
  spec: TrailerSpec;
  status: TrailerStatus;
  /** The third-party builder that built it, if it came from a commissioned build. */
  builtByBuilderId: string | null;
}

export type RentalRequestStatus =
  | 'open' // submitted, matching not yet resolved
  | 'matched' // at least one available unit fits; awaiting renter confirmation
  | 'confirmed' // renter confirmed a unit (held for the dates)
  | 'unfulfilled'; // no available unit fits — recorded as demand signal

/** A renter's request for a trailer rental. */
export interface RentalRequest {
  id: string;
  clientName: string;
  requirements: TrailerSpec;
  startDate: string; // ISO date
  endDate: string; // ISO date
  notes: string;
  status: RentalRequestStatus;
  /** The unit the renter confirmed (or the leading match), else null. */
  matchedTrailerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BuildStatus = 'commissioned' | 'in_progress' | 'completed';

/** A build the platform commissions from a third-party builder to grow the
 *  fleet. Decoupled from any specific rental request. */
export interface BuildOrder {
  id: string;
  spec: TrailerSpec;
  builderId: string | null;
  status: BuildStatus;
  createdAt: string;
  updatedAt: string;
}

/** A third-party builder that builds small trailers for the fleet. */
export interface Builder {
  id: string;
  name: string;
}
