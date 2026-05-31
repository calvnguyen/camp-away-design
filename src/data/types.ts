// The repository interface every component depends on. Components, routes, and
// server code NEVER touch localStorage, fixtures, mock arrays, or a real backend
// client directly — they go through this. Swapping to Supabase later means
// writing a new implementation of this interface and nothing else.

import type {
  Comment,
  CommentRole,
  ConceptLayout,
  DashboardStats,
  Firm,
  Project,
  StandardBuild,
  TrailerBrief,
} from '../types';

export interface CreateProjectInput {
  clientName: string;
  brief: TrailerBrief;
  /** Submitted briefs become `submitted`; otherwise the project is saved as `draft`. */
  submit: boolean;
}

export interface PostCommentInput {
  projectId: string;
  author: string;
  role: CommentRole;
  body: string;
}

export interface ProjectRepository {
  // --- Projects ---
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  /** Create a project from a brief — `draft` or `submitted` per `input.submit`. */
  createProject(input: CreateProjectInput): Promise<Project>;
  /** Assign (or reassign) a firm to a project. */
  assignFirm(projectId: string, firmId: string): Promise<Project>;

  // --- Floorplan review ---
  /** Append a comment to a project's review thread. */
  postComment(input: PostCommentInput): Promise<Comment>;
  /**
   * Client approves the project's current floorplan: project → `approved`.
   * Throws if the project has no floorplan to approve.
   */
  approveCurrentFloorplan(projectId: string): Promise<Project>;

  // --- Concept layout (no-equivalent-build path) ---
  /**
   * The standard build equivalent to a project's brief, or null if none exists.
   * A null result is the precondition for generating a concept layout.
   */
  findEquivalentBuild(projectId: string): Promise<StandardBuild | null>;
  /**
   * Generate a rough 2D concept layout for a project whose brief has no
   * equivalent build, and attach it as `pending_review`. Throws if an
   * equivalent build already exists (a layout would be redundant).
   */
  generateConceptLayout(projectId: string): Promise<ConceptLayout>;
  /**
   * Approve the project's concept layout. This is the gate to production: only
   * an approved layout lets the project be built. Throws if there's no layout.
   */
  approveConceptLayout(projectId: string): Promise<ConceptLayout>;
  /** Reject the concept layout so it can be regenerated. Throws if none exists. */
  rejectConceptLayout(projectId: string): Promise<ConceptLayout>;

  // --- Firms & metrics ---
  listFirms(): Promise<Firm[]>;
  getDashboardStats(): Promise<DashboardStats>;
}
