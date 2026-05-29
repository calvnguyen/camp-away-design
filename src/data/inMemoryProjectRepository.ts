// MVP implementation: in-memory state persisted to localStorage, seeded from
// fixtures. All mock-specific concerns (persistence, ID generation, latency)
// live here so the rest of the app stays backend-agnostic.

import type { Brief, Comment, Floorplan, Project, UserRole } from '../types';
import { seedProjects } from './fixtures';
import type { CreateProjectInput, ProjectRepository } from './types';

const STORAGE_KEY = 'camp-away-design:projects';
const SIMULATED_LATENCY_MS = 120;

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(value), SIMULATED_LATENCY_MS),
  );
}

export class InMemoryProjectRepository implements ProjectRepository {
  private projects: Project[];

  constructor(private storage: Storage | null = safeLocalStorage()) {
    this.projects = this.load();
  }

  private load(): Project[] {
    const raw = this.storage?.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as Project[];
      } catch {
        // fall through to seed on corrupt data
      }
    }
    const seeded = seedProjects();
    this.persist(seeded);
    return seeded;
  }

  private persist(projects: Project[]): void {
    this.projects = projects;
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  private mutate(projectId: string, fn: (project: Project) => Project): Project {
    const index = this.projects.findIndex((p) => p.id === projectId);
    if (index === -1) throw new Error(`Project not found: ${projectId}`);
    const updated = { ...fn(this.projects[index]), updatedAt: new Date().toISOString() };
    const next = [...this.projects];
    next[index] = updated;
    this.persist(next);
    return updated;
  }

  listProjects(): Promise<Project[]> {
    return delay([...this.projects]);
  }

  getProject(id: string): Promise<Project | null> {
    return delay(this.projects.find((p) => p.id === id) ?? null);
  }

  createProject(input: CreateProjectInput): Promise<Project> {
    const ts = new Date().toISOString();
    const project: Project = {
      id: uid('proj'),
      clientName: input.clientName,
      status: 'submitted',
      brief: input.brief,
      floorplans: [],
      comments: [],
      approvedFloorplanId: null,
      createdAt: ts,
      updatedAt: ts,
    };
    this.persist([...this.projects, project]);
    return delay(project);
  }

  updateBrief(projectId: string, brief: Brief): Promise<Project> {
    return delay(this.mutate(projectId, (p) => ({ ...p, brief })));
  }

  addFloorplan(
    projectId: string,
    floorplan: Pick<Floorplan, 'src' | 'fileName' | 'uploadedBy'>,
  ): Promise<Project> {
    return delay(
      this.mutate(projectId, (p) => {
        const version = p.floorplans.length + 1;
        const next: Floorplan = {
          ...floorplan,
          id: uid('fp'),
          version,
          uploadedAt: new Date().toISOString(),
        };
        return {
          ...p,
          floorplans: [...p.floorplans, next],
          // A new version resets any prior approval (PRD §6).
          approvedFloorplanId: null,
          status: 'in_review',
        };
      }),
    );
  }

  addComment(
    projectId: string,
    comment: Pick<Comment, 'floorplanId' | 'author' | 'body'>,
  ): Promise<Project> {
    return delay(
      this.mutate(projectId, (p) => ({
        ...p,
        comments: [
          ...p.comments,
          { ...comment, id: uid('c'), createdAt: new Date().toISOString() },
        ],
      })),
    );
  }

  approveFloorplan(
    projectId: string,
    floorplanId: string,
    _by: UserRole,
  ): Promise<Project> {
    return delay(
      this.mutate(projectId, (p) => {
        if (!p.floorplans.some((fp) => fp.id === floorplanId)) {
          throw new Error(`Floorplan not found: ${floorplanId}`);
        }
        return { ...p, approvedFloorplanId: floorplanId, status: 'approved' };
      }),
    );
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}
