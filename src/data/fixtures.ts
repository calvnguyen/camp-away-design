import type {
  BuildOrder,
  Builder,
  RentalRequest,
  Reservation,
  Trailer,
  TrailerDesign,
  TrailerSpec,
} from '../types';

const now = '2026-05-01T12:00:00.000Z';

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

export function seedBuilders(): Builder[] {
  return [
    { id: 'builder-cedar-pine', name: 'Cedar & Pine Co.' },
    { id: 'builder-wander', name: 'Wander Studios' },
    { id: 'builder-tiny-foundry', name: 'Tiny Foundry' },
    { id: 'builder-hearth-haul', name: 'Hearth & Haul' },
  ];
}

export function seedTrailers(): Trailer[] {
  return [
    { id: 'ca-016', name: 'CA-016', status: 'available', builtByBuilderId: 'builder-cedar-pine', heldForReservationId: null, spec: spec({ trailerLengthFt: 16 }) },
    { id: 'ca-017', name: 'CA-017', status: 'rented', builtByBuilderId: 'builder-cedar-pine', heldForReservationId: null, spec: spec({ solar: true }) },
    { id: 'ca-018', name: 'CA-018', status: 'available', builtByBuilderId: 'builder-wander', heldForReservationId: null, spec: spec({ trailerLengthFt: 18, solar: true, battery: true }) },
    { id: 'ca-019', name: 'CA-019', status: 'maintenance', builtByBuilderId: 'builder-tiny-foundry', heldForReservationId: null, spec: spec() },
    { id: 'ca-020', name: 'CA-020', status: 'available', builtByBuilderId: 'builder-wander', heldForReservationId: null, spec: spec({ trailerLengthFt: 18, battery: true }) },
    { id: 'ca-021', name: 'CA-021', status: 'available', builtByBuilderId: 'builder-hearth-haul', heldForReservationId: null, spec: spec({ trailerLengthFt: 16, hasKitchenette: false }) },
  ];
}

export function seedRequests(): RentalRequest[] {
  return [
    {
      id: 'req-maria-jon',
      clientName: 'Maria & Jon',
      requirements: spec({ solar: true }),
      startDate: '2026-06-12',
      endDate: '2026-06-15',
      notes: 'Weekend getaway for two.',
      status: 'matched',
      matchedTrailerId: 'ca-018',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'req-okafors',
      clientName: 'The Okafors',
      requirements: spec(),
      startDate: '2026-05-20',
      endDate: '2026-05-24',
      notes: '',
      status: 'confirmed',
      matchedTrailerId: 'ca-017',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'req-dev-sam',
      clientName: 'Dev & Sam',
      requirements: spec({ sleeps: 3, solar: true, battery: true }),
      startDate: '2026-07-01',
      endDate: '2026-07-05',
      notes: 'Need to sleep three.',
      status: 'unfulfilled',
      matchedTrailerId: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'req-lena',
      clientName: 'Lena T.',
      requirements: spec({ trailerLengthFt: 16 }),
      startDate: '2026-06-01',
      endDate: '2026-06-03',
      notes: '',
      status: 'matched',
      matchedTrailerId: 'ca-016',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function seedBuildOrders(): BuildOrder[] {
  return [
    // build-1 fulfils Dev & Sam's reservation (res-dev-sam); it's already in progress.
    { id: 'build-1', spec: spec({ sleeps: 3, solar: true, battery: true }), builderId: 'builder-cedar-pine', status: 'in_progress', reservationId: 'res-dev-sam', createdAt: now, updatedAt: now },
    { id: 'build-2', spec: spec({ trailerLengthFt: 18, solar: true }), builderId: 'builder-wander', status: 'commissioned', reservationId: null, createdAt: now, updatedAt: now },
  ];
}

export function seedDesigns(): TrailerDesign[] {
  return [
    {
      id: 'design-dev-sam',
      clientName: 'Dev & Sam',
      spec: spec({ sleeps: 3, solar: true, battery: true }),
      notes: 'Need to sleep three, off-grid ready.',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function seedReservations(): Reservation[] {
  return [
    {
      id: 'res-dev-sam',
      clientName: 'Dev & Sam',
      designId: 'design-dev-sam',
      spec: spec({ sleeps: 3, solar: true, battery: true }),
      buildOrderId: 'build-1',
      heldTrailerId: null,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    },
  ];
}
