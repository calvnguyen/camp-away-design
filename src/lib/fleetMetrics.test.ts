import { describe, expect, it } from 'vitest';
import { computeBuilderLoads, computeFleetMetrics } from './fleetMetrics';
import type {
  BuildOrder,
  Builder,
  RentalRequest,
  Reservation,
  ReservationStatus,
  Trailer,
  TrailerStatus,
  RentalRequestStatus,
  BuildStatus,
} from '../types';

const spec = {
  trailerLengthFt: 17,
  sleeps: 2,
  hasWetBath: true,
  hasKitchenette: true,
  solar: false,
  battery: false,
};

function trailer(id: string, status: TrailerStatus): Trailer {
  return { id, name: id, status, builtByBuilderId: null, heldForReservationId: null, spec };
}

function reservation(id: string, status: ReservationStatus): Reservation {
  return {
    id,
    clientName: id,
    designId: `design-${id}`,
    spec,
    buildOrderId: `build-${id}`,
    heldTrailerId: null,
    status,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  };
}

function request(id: string, status: RentalRequestStatus): RentalRequest {
  return {
    id,
    clientName: id,
    requirements: spec,
    startDate: '2026-06-01',
    endDate: '2026-06-03',
    notes: '',
    status,
    matchedTrailerId: null,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  };
}

function build(id: string, builderId: string, status: BuildStatus): BuildOrder {
  return {
    id,
    spec,
    builderId,
    status,
    reservationId: null,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  };
}

describe('computeFleetMetrics', () => {
  it('summarizes fleet status, utilization and request fulfilment', () => {
    const trailers = [
      trailer('a', 'available'),
      trailer('b', 'rented'),
      trailer('c', 'rented'),
      trailer('d', 'maintenance'),
    ];
    const requests = [
      request('1', 'confirmed'),
      request('2', 'matched'),
      request('3', 'unfulfilled'),
      request('4', 'open'),
    ];
    const m = computeFleetMetrics(trailers, requests);
    expect(m.fleetSize).toBe(4);
    expect(m.rented).toBe(2);
    expect(m.available).toBe(1);
    expect(m.maintenance).toBe(1);
    expect(m.utilizationPct).toBe(50); // 2 of 4 rented
    expect(m.totalRequests).toBe(4);
    expect(m.fulfilledPct).toBe(25); // 1 of 4 confirmed
    expect(m.unfulfilled).toBe(1);
  });

  it('counts held units and reservation demand', () => {
    const trailers = [
      trailer('a', 'available'),
      trailer('b', 'reserved'),
      trailer('c', 'reserved'),
    ];
    const reservations = [
      reservation('1', 'pending'),
      reservation('2', 'pending'),
      reservation('3', 'ready'),
      reservation('4', 'fulfilled'),
    ];
    const m = computeFleetMetrics(trailers, [], reservations);
    expect(m.reserved).toBe(2);
    expect(m.pendingReservations).toBe(2);
    expect(m.readyReservations).toBe(1);
  });

  it('returns zeros for an empty fleet', () => {
    const m = computeFleetMetrics([], []);
    expect(m).toMatchObject({
      fleetSize: 0,
      utilizationPct: 0,
      fulfilledPct: 0,
      reserved: 0,
      pendingReservations: 0,
    });
  });
});

describe('computeBuilderLoads', () => {
  const builders: Builder[] = [
    { id: 'b-a', name: 'Builder A' },
    { id: 'b-b', name: 'Builder B' },
  ];

  it('counts only non-completed builds per builder, sorted by load', () => {
    const orders = [
      build('1', 'b-a', 'commissioned'),
      build('2', 'b-a', 'in_progress'),
      build('3', 'b-a', 'completed'), // excluded
      build('4', 'b-b', 'in_progress'),
    ];
    const loads = computeBuilderLoads(orders, builders);
    expect(loads[0]).toEqual({ builder: builders[0], activeBuilds: 2 });
    expect(loads[1]).toEqual({ builder: builders[1], activeBuilds: 1 });
  });
});
