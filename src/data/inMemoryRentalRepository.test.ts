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
});
