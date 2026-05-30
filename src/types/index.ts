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
  | 'reserved' // built and held for a specific renter's reservation; not generally rentable until they rent it (or the hold is released)
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
  /** When status is 'reserved', the reservation this unit is held for. */
  heldForReservationId: string | null;
}

/** A renter's saved trailer design — reusable/refinable and re-submittable, and
 *  the thing a reservation is built from when nothing in the fleet matches. */
export interface TrailerDesign {
  id: string;
  clientName: string;
  spec: TrailerSpec;
  notes: string;
  createdAt: string;
  updatedAt: string;
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
 *  fleet. Usually decoupled from any single request, but can be tied to a
 *  renter's Reservation (see `reservationId`) — when that build completes, the
 *  finished unit is held for the reserving renter instead of joining the
 *  general pool. */
export interface BuildOrder {
  id: string;
  spec: TrailerSpec;
  builderId: string | null;
  status: BuildStatus;
  /** Set when this build fulfils a renter's reservation; null for fleet-growth builds. */
  reservationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus =
  | 'pending' // build commissioned for the design, not yet complete
  | 'ready' // build complete; a unit is held for the renter to rent
  | 'fulfilled' // renter rented the held unit
  | 'cancelled'; // reservation withdrawn before fulfilment

/** A renter's claim on the first rental of a build their no-match design
 *  triggered. Ties the renter + design to the BuildOrder constructing it and,
 *  once built, to the held unit. */
export interface Reservation {
  id: string;
  clientName: string;
  /** The saved design this reservation is built from. */
  designId: string;
  spec: TrailerSpec;
  /** The build commissioned to fulfil this reservation. */
  buildOrderId: string;
  /** The finished unit held for the renter, once the build completes. */
  heldTrailerId: string | null;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

/** A third-party builder that builds small trailers for the fleet. */
export interface Builder {
  id: string;
  name: string;
}
