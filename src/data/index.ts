// Single entry point for the data layer. Import the repository from here so the
// concrete implementation can be swapped in one place (e.g. to a Supabase-backed
// ProjectRepository in production).

import { InMemoryProjectRepository } from './inMemoryProjectRepository';
import type { ProjectRepository } from './types';

export type {
  ProjectRepository,
  CreateProjectInput,
  PostCommentInput,
} from './types';

export const projectRepository: ProjectRepository =
  new InMemoryProjectRepository();
