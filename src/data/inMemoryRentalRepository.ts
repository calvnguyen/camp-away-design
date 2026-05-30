// MVP implementation: in-memory state persisted to localStorage, seeded from
// fixtures. All mock-specific concerns (persistence, ID generation, latency)
// live here so the rest of the app stays backend-agnostic. The production
// implementation (Supabase/Postgres) will satisfy the same RentalRepository
// interface.

import type {
  BuildOrder,
  Builder,
  RentalRequest,
  Trailer,
  TrailerSpec,
} from '../types';
import { specSatisfies } from '../lib/matching';
import {
  seedBuildOrders,
  seedBuilders,
  seedRequests,
  seedTrailers,
} from './fixtures';
import type { CreateRentalRequestInput, RentalRepository } from './types';

const STORAGE_KEY = 'camp-away:rental-state';
const SIMULATED_LATENCY_MS = 120;

interface PersistedState {
  trailers: Trailer[];
  requests: RentalRequest[];
  buildOrders: BuildOrder[];
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
  private readonly builders: Builder[] = seedBuilders();

  constructor(private storage: Storage | null = safeLocalStorage()) {
    const loaded = this.load();
    this.trailers = loaded.trailers;
    this.requests = loaded.requests;
    this.buildOrders = loaded.buildOrders;
  }

  private load(): PersistedState {
    const raw = this.storage?.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as PersistedState;
      } catch {
        // fall through to seed on corrupt data
      }
    }
    const seeded: PersistedState = {
      trailers: seedTrailers(),
      requests: seedRequests(),
      buildOrders: seedBuildOrders(),
    };
    this.persist(seeded);
    return seeded;
  }

  private persist(state: PersistedState): void {
    this.trailers = state.trailers;
    this.requests = state.requests;
    this.buildOrders = state.buildOrders;
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private save(): void {
    this.persist({
      trailers: this.trailers,
      requests: this.requests,
      buildOrders: this.buildOrders,
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
      createdAt: ts,
      updatedAt: ts,
    };
    this.buildOrders = [...this.buildOrders, order];
    this.save();
    return delay(order);
  }

  advanceBuild(buildOrderId: string): Promise<BuildOrder> {
    const order = this.buildOrders.find((b) => b.id === buildOrderId);
    if (!order) return Promise.reject(new Error(`Build order not found: ${buildOrderId}`));
    const next: BuildOrder['status'] =
      order.status === 'commissioned'
        ? 'in_progress'
        : order.status === 'in_progress'
          ? 'completed'
          : 'completed';
    const ts = new Date().toISOString();
    const updated: BuildOrder = { ...order, status: next, updatedAt: ts };
    this.buildOrders = this.buildOrders.map((b) => (b.id === buildOrderId ? updated : b));

    // On completion, the build grows the fleet with a new available unit.
    if (next === 'completed' && order.status === 'in_progress') {
      const seq = String(this.trailers.length + 16).padStart(3, '0');
      this.trailers = [
        ...this.trailers,
        {
          id: uid('ca'),
          name: `CA-${seq}`,
          spec: order.spec,
          status: 'available',
          builtByBuilderId: order.builderId,
        },
      ];
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
