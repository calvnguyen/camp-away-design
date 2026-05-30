// MVP implementation: in-memory state persisted to localStorage, seeded from
// fixtures. All mock-specific concerns (persistence, ID generation, latency)
// live here so the rest of the app stays backend-agnostic. The production
// implementation (Supabase/Postgres) will satisfy the same RentalRepository
// interface.

import type {
  BuildOrder,
  Builder,
  RentalRequest,
  Reservation,
  Trailer,
  TrailerDesign,
  TrailerSpec,
} from '../types';
import { specSatisfies } from '../lib/matching';
import {
  seedBuildOrders,
  seedBuilders,
  seedDesigns,
  seedRequests,
  seedReservations,
  seedTrailers,
} from './fixtures';
import type {
  CreateRentalRequestInput,
  RentalRepository,
  ReserveBuildInput,
  ReserveBuildResult,
  SaveDesignInput,
} from './types';

const STORAGE_KEY = 'camp-away:rental-state';
const SIMULATED_LATENCY_MS = 120;

interface PersistedState {
  trailers: Trailer[];
  requests: RentalRequest[];
  buildOrders: BuildOrder[];
  designs: TrailerDesign[];
  reservations: Reservation[];
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), SIMULATED_LATENCY_MS),
  );
}

export class InMemoryRentalRepository implements RentalRepository {
  private trailers: Trailer[];
  private requests: RentalRequest[];
  private buildOrders: BuildOrder[];
  private designs: TrailerDesign[];
  private reservations: Reservation[];
  private readonly builders: Builder[] = seedBuilders();

  constructor(private storage: Storage | null = safeLocalStorage()) {
    const loaded = this.load();
    this.trailers = loaded.trailers;
    this.requests = loaded.requests;
    this.buildOrders = loaded.buildOrders;
    this.designs = loaded.designs;
    this.reservations = loaded.reservations;
  }

  private load(): PersistedState {
    const raw = this.storage?.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        // Tolerate state persisted before designs/reservations existed.
        return {
          trailers: parsed.trailers ?? seedTrailers(),
          requests: parsed.requests ?? seedRequests(),
          buildOrders: parsed.buildOrders ?? seedBuildOrders(),
          designs: parsed.designs ?? seedDesigns(),
          reservations: parsed.reservations ?? seedReservations(),
        };
      } catch {
        // fall through to seed on corrupt data
      }
    }
    const seeded: PersistedState = {
      trailers: seedTrailers(),
      requests: seedRequests(),
      buildOrders: seedBuildOrders(),
      designs: seedDesigns(),
      reservations: seedReservations(),
    };
    this.persist(seeded);
    return seeded;
  }

  private persist(state: PersistedState): void {
    this.trailers = state.trailers;
    this.requests = state.requests;
    this.buildOrders = state.buildOrders;
    this.designs = state.designs;
    this.reservations = state.reservations;
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private save(): void {
    this.persist({
      trailers: this.trailers,
      requests: this.requests,
      buildOrders: this.buildOrders,
      designs: this.designs,
      reservations: this.reservations,
    });
  }

  // --- Fleet ---

  listTrailers(): Promise<Trailer[]> {
    return delay([...this.trailers]);
  }

  findMatches(requirements: TrailerSpec): Promise<Trailer[]> {
    return delay(
      this.trailers.filter(
        (t) => t.status === 'available' && specSatisfies(t.spec, requirements),
      ),
    );
  }

  // --- Rental requests ---

  listRequests(): Promise<RentalRequest[]> {
    return delay([...this.requests]);
  }

  createRequest(input: CreateRentalRequestInput): Promise<RentalRequest> {
    const matches = this.trailers.filter(
      (t) => t.status === 'available' && specSatisfies(t.spec, input.requirements),
    );
    const ts = new Date().toISOString();
    const request: RentalRequest = {
      id: uid('req'),
      clientName: input.clientName,
      requirements: input.requirements,
      startDate: input.startDate,
      endDate: input.endDate,
      notes: input.notes,
      status: matches.length ? 'matched' : 'unfulfilled',
      matchedTrailerId: matches[0]?.id ?? null,
      createdAt: ts,
      updatedAt: ts,
    };
    this.requests = [...this.requests, request];
    this.save();
    return delay(request);
  }

  confirmRental(requestId: string, trailerId: string): Promise<RentalRequest> {
    const request = this.requests.find((r) => r.id === requestId);
    if (!request) return Promise.reject(new Error(`Request not found: ${requestId}`));
    const trailer = this.trailers.find((t) => t.id === trailerId);
    if (!trailer) return Promise.reject(new Error(`Trailer not found: ${trailerId}`));
    if (trailer.status !== 'available') {
      return Promise.reject(new Error(`Trailer ${trailer.name} is not available`));
    }
    const ts = new Date().toISOString();
    this.trailers = this.trailers.map((t) =>
      t.id === trailerId ? { ...t, status: 'rented' } : t,
    );
    const updated: RentalRequest = {
      ...request,
      status: 'confirmed',
      matchedTrailerId: trailerId,
      updatedAt: ts,
    };
    this.requests = this.requests.map((r) => (r.id === requestId ? updated : r));
    this.save();
    return delay(updated);
  }

  // --- Saved designs ---

  listDesigns(): Promise<TrailerDesign[]> {
    return delay([...this.designs]);
  }

  saveDesign(input: SaveDesignInput): Promise<TrailerDesign> {
    return delay(this.persistDesign(input));
  }

  /** Save a design synchronously (shared by saveDesign and reserveBuild). */
  private persistDesign(input: SaveDesignInput): TrailerDesign {
    const ts = new Date().toISOString();
    const design: TrailerDesign = {
      id: uid('design'),
      clientName: input.clientName,
      spec: input.spec,
      notes: input.notes,
      createdAt: ts,
      updatedAt: ts,
    };
    this.designs = [...this.designs, design];
    this.save();
    return design;
  }

  // --- Reservations ---

  listReservations(): Promise<Reservation[]> {
    return delay([...this.reservations]);
  }

  reserveBuild(input: ReserveBuildInput): Promise<ReserveBuildResult> {
    const existing = input.designId
      ? this.designs.find((d) => d.id === input.designId)
      : undefined;
    if (input.designId && !existing) {
      return Promise.reject(new Error(`Design not found: ${input.designId}`));
    }
    const design =
      existing ??
      this.persistDesign({
        clientName: input.clientName,
        spec: input.spec,
        notes: input.notes,
      });

    const ts = new Date().toISOString();
    const reservationId = uid('res');
    // The build that fulfils the reservation starts unassigned — ops assigns a builder.
    const buildOrder: BuildOrder = {
      id: uid('build'),
      spec: design.spec,
      builderId: null,
      status: 'commissioned',
      reservationId,
      createdAt: ts,
      updatedAt: ts,
    };
    const reservation: Reservation = {
      id: reservationId,
      clientName: input.clientName,
      designId: design.id,
      spec: design.spec,
      buildOrderId: buildOrder.id,
      heldTrailerId: null,
      status: 'pending',
      createdAt: ts,
      updatedAt: ts,
    };
    this.buildOrders = [...this.buildOrders, buildOrder];
    this.reservations = [...this.reservations, reservation];
    this.save();
    return delay({ design, reservation, buildOrder });
  }

  fulfillReservation(reservationId: string): Promise<Reservation> {
    const reservation = this.reservations.find((r) => r.id === reservationId);
    if (!reservation) {
      return Promise.reject(new Error(`Reservation not found: ${reservationId}`));
    }
    if (reservation.status !== 'ready' || !reservation.heldTrailerId) {
      return Promise.reject(
        new Error(`Reservation ${reservationId} has no unit ready to rent`),
      );
    }
    const ts = new Date().toISOString();
    this.trailers = this.trailers.map((t) =>
      t.id === reservation.heldTrailerId
        ? { ...t, status: 'rented', heldForReservationId: null }
        : t,
    );
    const updated: Reservation = { ...reservation, status: 'fulfilled', updatedAt: ts };
    this.reservations = this.reservations.map((r) =>
      r.id === reservationId ? updated : r,
    );
    this.save();
    return delay(updated);
  }

  // --- Builds ---

  listBuildOrders(): Promise<BuildOrder[]> {
    return delay([...this.buildOrders]);
  }

  commissionBuild(spec: TrailerSpec, builderId: string): Promise<BuildOrder> {
    if (!this.builders.some((b) => b.id === builderId)) {
      return Promise.reject(new Error(`Builder not found: ${builderId}`));
    }
    const ts = new Date().toISOString();
    const order: BuildOrder = {
      id: uid('build'),
      spec,
      builderId,
      status: 'commissioned',
      reservationId: null,
      createdAt: ts,
      updatedAt: ts,
    };
    this.buildOrders = [...this.buildOrders, order];
    this.save();
    return delay(order);
  }

  assignBuilder(buildOrderId: string, builderId: string): Promise<BuildOrder> {
    const order = this.buildOrders.find((b) => b.id === buildOrderId);
    if (!order) return Promise.reject(new Error(`Build order not found: ${buildOrderId}`));
    if (!this.builders.some((b) => b.id === builderId)) {
      return Promise.reject(new Error(`Builder not found: ${builderId}`));
    }
    const updated: BuildOrder = {
      ...order,
      builderId,
      updatedAt: new Date().toISOString(),
    };
    this.buildOrders = this.buildOrders.map((b) => (b.id === buildOrderId ? updated : b));
    this.save();
    return delay(updated);
  }

  advanceBuild(buildOrderId: string): Promise<BuildOrder> {
    const order = this.buildOrders.find((b) => b.id === buildOrderId);
    if (!order) return Promise.reject(new Error(`Build order not found: ${buildOrderId}`));
    if (order.status === 'commissioned' && !order.builderId) {
      return Promise.reject(
        new Error(`Assign a builder before starting build ${buildOrderId}`),
      );
    }
    const next: BuildOrder['status'] =
      order.status === 'commissioned'
        ? 'in_progress'
        : order.status === 'in_progress'
          ? 'completed'
          : 'completed';
    const ts = new Date().toISOString();
    const updated: BuildOrder = { ...order, status: next, updatedAt: ts };
    this.buildOrders = this.buildOrders.map((b) => (b.id === buildOrderId ? updated : b));

    // On completion the build adds a unit to the fleet — held 'reserved' for the
    // reserving renter if it fulfils a reservation, otherwise generally available.
    if (next === 'completed' && order.status === 'in_progress') {
      const seq = String(this.trailers.length + 16).padStart(3, '0');
      const isReserved = order.reservationId !== null;
      const trailer: Trailer = {
        id: uid('ca'),
        name: `CA-${seq}`,
        spec: order.spec,
        status: isReserved ? 'reserved' : 'available',
        builtByBuilderId: order.builderId,
        heldForReservationId: order.reservationId,
      };
      this.trailers = [...this.trailers, trailer];

      if (isReserved) {
        // Hold the finished unit for its reservation and mark it ready to rent.
        this.reservations = this.reservations.map((r) =>
          r.id === order.reservationId
            ? { ...r, status: 'ready', heldTrailerId: trailer.id, updatedAt: ts }
            : r,
        );
      }
    }
    this.save();
    return delay(updated);
  }

  // --- Builders ---

  listBuilders(): Promise<Builder[]> {
    return delay([...this.builders]);
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}
