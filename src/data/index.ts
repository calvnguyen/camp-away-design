// Single entry point for the data layer. Import the repository from here so
// the concrete implementation can be swapped in one place (e.g. to a
// Supabase-backed RentalRepository in production).

import { InMemoryRentalRepository } from './inMemoryRentalRepository';
import type { RentalRepository } from './types';

export type { RentalRepository, CreateRentalRequestInput } from './types';

export const rentalRepository: RentalRepository = new InMemoryRentalRepository();
