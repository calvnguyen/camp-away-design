// Fleet & rental metrics for the ops dashboard, derived from domain data.
// Pure functions so they can be unit-tested without rendering.

import type {
  BuildOrder,
  Builder,
  RentalRequest,
  Reservation,
  Trailer,
} from '../types';

export interface FleetMetrics {
  fleetSize: number;
  available: number;
  rented: number;
  /** Units built and held for a reservation, not yet rented. */
  reserved: number;
  maintenance: number;
  /** % of the fleet currently rented (0–100, rounded). */
  utilizationPct: number;
  totalRequests: number;
  /** % of requests that reached a confirmed rental (0–100, rounded). */
  fulfilledPct: number;
  /** Requests with no available match — demand signal for builds. */
  unfulfilled: number;
  /** Reservations whose build is still in progress. */
  pendingReservations: number;
  /** Reservations with a unit built and held, awaiting the renter's rental. */
  readyReservations: number;
}

export function computeFleetMetrics(
  trailers: Trailer[],
  requests: RentalRequest[],
  reservations: Reservation[] = [],
): FleetMetrics {
  const fleetSize = trailers.length;
  const rented = trailers.filter((t) => t.status === 'rented').length;
  const totalRequests = requests.length;
  const confirmed = requests.filter((r) => r.status === 'confirmed').length;

  return {
    fleetSize,
    available: trailers.filter((t) => t.status === 'available').length,
    rented,
    reserved: trailers.filter((t) => t.status === 'reserved').length,
    maintenance: trailers.filter((t) => t.status === 'maintenance').length,
    utilizationPct: fleetSize ? Math.round((rented / fleetSize) * 100) : 0,
    totalRequests,
    fulfilledPct: totalRequests ? Math.round((confirmed / totalRequests) * 100) : 0,
    unfulfilled: requests.filter((r) => r.status === 'unfulfilled').length,
    pendingReservations: reservations.filter((r) => r.status === 'pending').length,
    readyReservations: reservations.filter((r) => r.status === 'ready').length,
  };
}

export interface BuilderLoad {
  builder: Builder;
  /** Build orders not yet completed. */
  activeBuilds: number;
}

export function computeBuilderLoads(
  buildOrders: BuildOrder[],
  builders: Builder[],
): BuilderLoad[] {
  return builders
    .map((builder) => ({
      builder,
      activeBuilds: buildOrders.filter(
        (b) => b.builderId === builder.id && b.status !== 'completed',
      ).length,
    }))
    .sort((a, b) => b.activeBuilds - a.activeBuilds);
}
