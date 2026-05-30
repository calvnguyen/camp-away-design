// The repository interface every component depends on. Components, pages, and
// server code NEVER touch localStorage, fixtures, mock arrays, or a real
// backend client directly — they go through this. Swapping to Supabase later
// means writing a new implementation of this interface and nothing else.

import type {
  BuildOrder,
  Builder,
  RentalRequest,
  Trailer,
  TrailerSpec,
} from '../types';

export interface CreateRentalRequestInput {
  clientName: string;
  requirements: TrailerSpec;
  startDate: string;
  endDate: string;
  notes: string;
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

  // --- Builds (decoupled fleet growth) ---
  listBuildOrders(): Promise<BuildOrder[]>;
  commissionBuild(spec: TrailerSpec, builderId: string): Promise<BuildOrder>;
  /**
   * Advances a build commissioned → in_progress → completed. On completion a
   * new AVAILABLE trailer with that spec is added to the fleet — it is not
   * assigned to any past requester.
   */
  advanceBuild(buildOrderId: string): Promise<BuildOrder>;

  // --- Builders ---
  listBuilders(): Promise<Builder[]>;
}
