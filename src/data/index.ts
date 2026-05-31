// Single entry point for the data layer. Import the repository from here so the
// concrete implementation can be swapped in one place (e.g. to a Supabase-backed
// ProjectRepository in production).

import { InMemoryProjectRepository } from './inMemoryProjectRepository';
import {
  ClaudeConceptLayoutGenerator,
  TemplateConceptLayoutGenerator,
} from './conceptLayoutGenerator';
import type { ConceptLayoutGenerator } from './conceptLayoutGenerator';
import type { ProjectRepository } from './types';

export type {
  ProjectRepository,
  CreateProjectInput,
  PostCommentInput,
} from './types';

// Select the concept-layout generator once. When a Claude API key is configured
// (Vite env `VITE_ANTHROPIC_API_KEY`), use the AI generator; otherwise fall back
// to the deterministic template so the feature works offline and in tests.
//
// Note: a browser-exposed key is acceptable only for this frontend-only
// prototype; in the target Next.js/Supabase stack this call moves server-side
// and the key stays secret. The generator lives behind the data-layer seam, so
// that swap is local to src/data/.
function selectGenerator(): ConceptLayoutGenerator {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
  if (apiKey) {
    return new ClaudeConceptLayoutGenerator(apiKey);
  }
  return new TemplateConceptLayoutGenerator();
}

export const projectRepository: ProjectRepository = new InMemoryProjectRepository(
  selectGenerator(),
);
