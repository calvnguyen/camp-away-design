import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryRentalRepository } from './inMemoryRentalRepository';
import type { TrailerSpec } from '../types';

// Fresh repo with no storage so tests are isolated from localStorage.
function freshRepo() {
  return new InMemoryRentalRepository(null);
}

function spec(overrides: Partial<TrailerSpec> = {}): TrailerSpec {
  return {
    trailerLengthFt: 17,
    sleeps: 2,
    hasWetBath: true,
    hasKitchenette: true,
    solar: false,
    battery: false,
    ...overrides,
  };
}

describe('InMemoryRentalRepository', () => {
  let repo: InMemoryRentalRepository;

  beforeEach(() => {
    repo = freshRepo();
  });

  it('seeds with a fleet, requests, and builders', async () => {
    expect((await repo.listTrailers()).length).toBeGreaterThan(0);
    expect((await repo.listRequests()).length).toBeGreaterThan(0);
    expect((await repo.listBuilders()).length).toBeGreaterThan(0);
  });

  it('creates a matched request when an available unit fits', async () => {
    const req = await repo.createRequest({
      clientName: 'Test Renter',
      requirements: spec(),
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      notes: '',
    });
    expect(req.status).toBe('matched');
    expect(req.matchedTrailerId).not.toBeNull();
  });

  it('records an unfulfilled request when nothing available fits', async () => {
    const req = await repo.createRequest({
      clientName: 'Big Group',
      requirements: spec({ sleeps: 6 }),
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      notes: '',
    });
    expect(req.status).toBe('unfulfilled');
    expect(req.matchedTrailerId).toBeNull();
  });

  it('confirming a rental marks the unit rented and the request confirmed', async () => {
    const [available] = (await repo.listTrailers()).filter((t) => t.status === 'available');
    const req = await repo.createRequest({
      clientName: 'Confirmer',
      requirements: spec({ trailerLengthFt: 16, hasKitchenette: false }),
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      notes: '',
    });
    const confirmed = await repo.confirmRental(req.id, available.id);
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.matchedTrailerId).toBe(available.id);
    const trailer = (await repo.listTrailers()).find((t) => t.id === available.id);
    expect(trailer?.status).toBe('rented');
  });

  it('completing a build adds a new available trailer to the fleet', async () => {
    const before = (await repo.listTrailers()).length;
    const order = await repo.commissionBuild(spec({ sleeps: 3 }), 'builder-cedar-pine');
    await repo.advanceBuild(order.id); // commissioned -> in_progress
    await repo.advanceBuild(order.id); // in_progress -> completed (+1 trailer)
    const trailers = await repo.listTrailers();
    expect(trailers).toHaveLength(before + 1);
    expect(trailers.some((t) => t.spec.sleeps === 3 && t.status === 'available')).toBe(true);
  });

  it('saves a design that can be listed back', async () => {
    const design = await repo.saveDesign({
      clientName: 'Saver',
      spec: spec({ solar: true }),
      notes: 'reuse me',
    });
    const designs = await repo.listDesigns();
    expect(designs.some((d) => d.id === design.id && d.notes === 'reuse me')).toBe(true);
  });

  it('reserving a build saves the design and commissions an unassigned, reservation-bound build', async () => {
    const { design, reservation, buildOrder } = await repo.reserveBuild({
      clientName: 'Reserver',
      spec: spec({ sleeps: 4 }),
      notes: '',
    });

    expect(reservation.status).toBe('pending');
    expect(reservation.designId).toBe(design.id);
    expect(reservation.buildOrderId).toBe(buildOrder.id);
    // Build is tied to the reservation and starts without a builder.
    expect(buildOrder.reservationId).toBe(reservation.id);
    expect(buildOrder.builderId).toBeNull();
    // The design is persisted.
    expect((await repo.listDesigns()).some((d) => d.id === design.id)).toBe(true);
  });

  it('reuses an existing design when reserving with a designId', async () => {
    const design = await repo.saveDesign({
      clientName: 'Reuser',
      spec: spec({ battery: true }),
      notes: '',
    });
    const before = (await repo.listDesigns()).length;
    const { reservation } = await repo.reserveBuild({
      clientName: 'Reuser',
      spec: spec({ battery: true }),
      notes: '',
      designId: design.id,
    });
    expect(reservation.designId).toBe(design.id);
    expect((await repo.listDesigns()).length).toBe(before); // no duplicate design
  });

  it('requires a builder before a reservation build can start', async () => {
    const { buildOrder } = await repo.reserveBuild({
      clientName: 'NoBuilder',
      spec: spec({ sleeps: 3 }),
      notes: '',
    });
    await expect(repo.advanceBuild(buildOrder.id)).rejects.toThrow(/assign a builder/i);
  });

  it('completing a reservation build holds the unit and makes the reservation ready to rent', async () => {
    const { reservation, buildOrder } = await repo.reserveBuild({
      clientName: 'Holder',
      spec: spec({ sleeps: 3 }),
      notes: '',
    });
    await repo.assignBuilder(buildOrder.id, 'builder-wander');
    await repo.advanceBuild(buildOrder.id); // commissioned -> in_progress
    await repo.advanceBuild(buildOrder.id); // in_progress -> completed

    const updatedReservation = (await repo.listReservations()).find(
      (r) => r.id === reservation.id,
    );
    expect(updatedReservation?.status).toBe('ready');
    expect(updatedReservation?.heldTrailerId).not.toBeNull();

    const held = (await repo.listTrailers()).find(
      (t) => t.id === updatedReservation?.heldTrailerId,
    );
    expect(held?.status).toBe('reserved');
    expect(held?.heldForReservationId).toBe(reservation.id);

    // Renter rents the held unit: it becomes rented and the reservation fulfilled.
    const fulfilled = await repo.fulfillReservation(reservation.id);
    expect(fulfilled.status).toBe('fulfilled');
    const rented = (await repo.listTrailers()).find((t) => t.id === held?.id);
    expect(rented?.status).toBe('rented');
  });

  it('rejects fulfilling a reservation that has no unit ready', async () => {
    const { reservation } = await repo.reserveBuild({
      clientName: 'Early',
      spec: spec({ sleeps: 3 }),
      notes: '',
    });
    await expect(repo.fulfillReservation(reservation.id)).rejects.toThrow(/ready/i);
  });
});
