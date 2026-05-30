// Fleet & rental metrics for the ops dashboard, derived from domain data.
// Pure functions so they can be unit-tested without rendering.

import type { BuildOrder, Builder, RentalRequest, Trailer } from '../types';

export interface FleetMetrics {
  fleetSize: number;
  available: number;
  rented: number;
  maintenance: number;
  /** % of the fleet currently rented (0–100, rounded). */
  utilizationPct: number;
  totalRequests: number;
  /** % of requests that reached a confirmed rental (0–100, rounded). */
  fulfilledPct: number;
  /** Requests with no available match — demand signal for builds. */
  unfulfilled: number;
}

export function computeFleetMetrics(
  trailers: Trailer[],
  requests: RentalRequest[],
): FleetMetrics {
  const fleetSize = trailers.length;
  const rented = trailers.filter((t) => t.status === 'rented').length;
  const totalRequests = requests.length;
  const confirmed = requests.filter((r) => r.status === 'confirmed').length;

  return {
    fleetSize,
    available: trailers.filter((t) => t.status === 'available').length,
    rented,
    maintenance: trailers.filter((t) => t.status === 'maintenance').length,
    utilizationPct: fleetSize ? Math.round((rented / fleetSize) * 100) : 0,
    totalRequests,
    fulfilledPct: totalRequests ? Math.round((confirmed / totalRequests) * 100) : 0,
    unfulfilled: requests.filter((r) => r.status === 'unfulfilled').length,
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
