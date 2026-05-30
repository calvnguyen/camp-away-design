// The repository interface every component depends on. Components, routes, and
// server code NEVER touch localStorage, fixtures, mock arrays, or a real backend
// client directly — they go through this. Swapping to Supabase later means
// writing a new implementation of this interface and nothing else.

import type {
  Comment,
  CommentRole,
  DashboardStats,
  Firm,
  Project,
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

  // --- Firms & metrics ---
  listFirms(): Promise<Firm[]>;
  getDashboardStats(): Promise<DashboardStats>;
}
