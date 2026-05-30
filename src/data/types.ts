// The repository interface every component depends on. Components, pages, and
// server code NEVER touch localStorage, fixtures, mock arrays, or a real
// backend client directly — they go through this. Swapping to Supabase later
// means writing a new implementation of this interface and nothing else.

import type {
  BuildOrder,
  Builder,
  RentalRequest,
  Reservation,
  Trailer,
  TrailerDesign,
  TrailerSpec,
} from '../types';

export interface CreateRentalRequestInput {
  clientName: string;
  requirements: TrailerSpec;
  startDate: string;
  endDate: string;
  notes: string;
}

export interface SaveDesignInput {
  clientName: string;
  spec: TrailerSpec;
  notes: string;
}

export interface ReserveBuildInput {
  clientName: string;
  spec: TrailerSpec;
  notes: string;
  /** Reuse an already-saved design instead of saving a new one. */
  designId?: string;
}

/** What `reserveBuild` returns: the saved design, the renter's reservation, and
 *  the commissioned build that will fulfil it. */
export interface ReserveBuildResult {
  design: TrailerDesign;
  reservation: Reservation;
  buildOrder: BuildOrder;
}

export interface RentalRepository {
  // --- Fleet ---
  listTrailers(): Promise<Trailer[]>;
  /** Available units whose spec satisfies the given requirements. */
  findMatches(requirements: TrailerSpec): Promise<Trailer[]>;

  // --- Rental requests ---
  listRequests(): Promise<RentalRequest[]>;
  /**
   * Creates a request and resolves it by matching available units:
   * 'matched' (with a leading match) if any fit, else 'unfulfilled' (recorded
   * as demand signal — never queued behind a not-yet-built unit).
   */
  createRequest(input: CreateRentalRequestInput): Promise<RentalRequest>;
  /** Renter confirms an available unit: marks the unit rented and the request confirmed. */
  confirmRental(requestId: string, trailerId: string): Promise<RentalRequest>;

  // --- Saved designs ---
  listDesigns(): Promise<TrailerDesign[]>;
  /** Persist a design so the renter can reopen, refine, re-submit, or reserve a build of it. */
  saveDesign(input: SaveDesignInput): Promise<TrailerDesign>;

  // --- Reservations (renter claims the first rental of a build their design triggered) ---
  listReservations(): Promise<Reservation[]>;
  /**
   * For a no-match design: saves the design (or reuses `designId`), creates a
   * pending Reservation tied to the renter + design, and commissions a
   * BuildOrder linked to that reservation (builder unassigned — ops assigns it).
   */
  reserveBuild(input: ReserveBuildInput): Promise<ReserveBuildResult>;
  /** Renter rents the unit held for a 'ready' reservation: unit → rented, reservation → fulfilled. */
  fulfillReservation(reservationId: string): Promise<Reservation>;

  // --- Builds (fleet growth + reservation fulfilment) ---
  listBuildOrders(): Promise<BuildOrder[]>;
  commissionBuild(spec: TrailerSpec, builderId: string): Promise<BuildOrder>;
  /** Assign (or reassign) a builder to a build — used for reservation builds that start unassigned. */
  assignBuilder(buildOrderId: string, builderId: string): Promise<BuildOrder>;
  /**
   * Advances a build commissioned → in_progress → completed. On completion a
   * new trailer with that spec is added to the fleet: held 'reserved' for the
   * reserving renter if the build has a `reservationId`, otherwise 'available'
   * to whoever matches next.
   */
  advanceBuild(buildOrderId: string): Promise<BuildOrder>;

  // --- Builders ---
  listBuilders(): Promise<Builder[]>;
}
