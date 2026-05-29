// Single entry point for the data layer. Import the repository from here so
// the concrete implementation can be swapped in one place.

import { InMemoryProjectRepository } from './inMemoryProjectRepository';
import type { ProjectRepository } from './types';

export type { ProjectRepository, CreateProjectInput } from './types';

export const projectRepository: ProjectRepository = new InMemoryProjectRepository();
