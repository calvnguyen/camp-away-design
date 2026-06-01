// Single entry point for the data layer. Import the repository from here —
// never import a concrete implementation or Supabase directly from a component.

import { InMemoryProjectRepository } from './inMemoryProjectRepository';
import { SupabaseProjectRepository } from './supabaseProjectRepository';
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

function selectGenerator(): ConceptLayoutGenerator {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (apiKey) return new ClaudeConceptLayoutGenerator(apiKey);
  return new TemplateConceptLayoutGenerator();
}

function selectRepository(): ProjectRepository {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseProjectRepository(selectGenerator());
  }
  return new InMemoryProjectRepository(selectGenerator());
}

export const projectRepository: ProjectRepository = selectRepository();
