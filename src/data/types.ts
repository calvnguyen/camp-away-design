// The repository interface every component depends on. Components NEVER touch
// localStorage, fixtures, or mock arrays directly — they go through this.
// Swapping to a real backend later means writing a new implementation of this
// interface and nothing else.

import type { Brief, Comment, Floorplan, Project, UserRole } from '../types';

export interface CreateProjectInput {
  clientName: string;
  brief: Brief;
}

export interface ProjectRepository {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: CreateProjectInput): Promise<Project>;
  updateBrief(projectId: string, brief: Brief): Promise<Project>;

  /** Adds a new floorplan version. Resets approval and moves status to in_review. */
  addFloorplan(
    projectId: string,
    floorplan: Pick<Floorplan, 'src' | 'fileName' | 'uploadedBy'>,
  ): Promise<Project>;

  addComment(
    projectId: string,
    comment: Pick<Comment, 'floorplanId' | 'author' | 'body'>,
  ): Promise<Project>;

  /** Locks the given floorplan as approved (client sign-off). */
  approveFloorplan(
    projectId: string,
    floorplanId: string,
    by: UserRole,
  ): Promise<Project>;
}
