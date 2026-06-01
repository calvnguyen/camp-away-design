// In-memory + localStorage implementation of ProjectRepository. Used for tests
// and local development without a backend. A Supabase-backed implementation of
// the same interface would replace this in production (selected in ./index.ts).

import type {
  Comment,
  ConceptLayout,
  DashboardStats,
  Firm,
  LayoutZone,
  Project,
  ProjectStatus,
  StandardBuild,
} from '../types';
import {
  SEED_DASHBOARD_TOTALS,
  seedFirms,
  seedProjects,
} from './fixtures';
import { findEquivalentBuild } from '../lib/standardBuilds';
import { envelopeFor, validateLayout } from '../lib/conceptLayout';
import {
  TemplateConceptLayoutGenerator,
  toConceptLayout,
} from './conceptLayoutGenerator';
import type { ConceptLayoutGenerator } from './conceptLayoutGenerator';
import type {
  CreateProjectInput,
  PostCommentInput,
  ProjectRepository,
} from './types';

const STORAGE_KEY = 'campaway.projects.v2';
/** Small simulated latency so loading states are exercised in dev. */
const LATENCY_MS = 120;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

/** Structured clone so callers can't mutate our internal state by reference. */
function clone<T>(value: T): T {
  return structuredClone(value);
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export class InMemoryProjectRepository implements ProjectRepository {
  private projects: Project[];
  private firms: Firm[];
  private generator: ConceptLayoutGenerator;

  constructor(generator: ConceptLayoutGenerator = new TemplateConceptLayoutGenerator()) {
    this.generator = generator;
    this.firms = seedFirms();
    this.projects = this.load();
  }

  private load(): Project[] {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          return JSON.parse(raw) as Project[];
        } catch {
          // Corrupt payload — fall through to a fresh seed.
        }
      }
    }
    const seeded = seedProjects();
    this.persist(seeded);
    return seeded;
  }

  private persist(projects: Project[]): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }

  private save(): void {
    this.persist(this.projects);
  }

  private requireProject(id: string): Project {
    const project = this.projects.find((p) => p.id === id);
    if (!project) throw new Error(`Project not found: ${id}`);
    return project;
  }

  async listProjects(): Promise<Project[]> {
    return delay(clone(this.projects));
  }

  async getProject(id: string): Promise<Project | null> {
    const project = this.projects.find((p) => p.id === id) ?? null;
    return delay(project ? clone(project) : null);
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const timestamp = new Date().toISOString();
    const project: Project = {
      id: nextId('project'),
      clientName: input.clientName,
      brief: input.brief,
      status: input.submit ? 'intake_submitted' : 'draft',
      firmId: null,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1604549001484-df28edea610b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      galleryUrls: [],
      floorplans: [],
      comments: [],
      conceptLayout: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.projects = [project, ...this.projects];
    this.save();
    return delay(clone(project));
  }

  async assignFirm(projectId: string, firmId: string): Promise<Project> {
    const project = this.requireProject(projectId);
    if (!this.firms.some((f) => f.id === firmId)) {
      throw new Error(`Firm not found: ${firmId}`);
    }
    project.firmId = firmId;
    project.updatedAt = new Date().toISOString();
    this.save();
    return delay(clone(project));
  }

  async postComment(input: PostCommentInput): Promise<Comment> {
    const project = this.requireProject(input.projectId);
    const comment: Comment = {
      id: nextId('comment'),
      author: input.author,
      role: input.role,
      body: input.body,
      createdAt: new Date().toISOString(),
    };
    project.comments = [...project.comments, comment];
    project.updatedAt = comment.createdAt;
    this.save();
    return delay(clone(comment));
  }

  async approveCurrentFloorplan(projectId: string): Promise<Project> {
    const project = this.requireProject(projectId);
    const hasCurrent = project.floorplans.some((f) => f.status === 'current');
    if (!hasCurrent) {
      throw new Error(`Project ${projectId} has no floorplan to approve.`);
    }
    project.status = 'approved';
    project.updatedAt = new Date().toISOString();
    this.save();
    return delay(clone(project));
  }

  async findEquivalentBuild(projectId: string): Promise<StandardBuild | null> {
    const project = this.requireProject(projectId);
    return delay(findEquivalentBuild(project.brief));
  }

  async generateConceptLayout(projectId: string): Promise<ConceptLayout> {
    const project = this.requireProject(projectId);
    if (findEquivalentBuild(project.brief)) {
      throw new Error(
        `Project ${projectId} matches a standard build — no concept layout needed.`,
      );
    }
    // Generation can be slow (AI call); do it BEFORE the latency shim, and
    // don't double-delay.
    const envelope = envelopeFor(project.brief);
    const generated = await this.generator.generate(project.brief);
    const timestamp = new Date().toISOString();
    const layout = toConceptLayout(generated, envelope, nextId('concept'), timestamp);
    project.conceptLayout = layout;
    project.updatedAt = timestamp;
    this.save();
    return clone(layout);
  }

  async approveConceptLayout(projectId: string): Promise<ConceptLayout> {
    const layout = this.requireConceptLayout(projectId);
    layout.status = 'approved';
    layout.updatedAt = new Date().toISOString();
    this.touch(projectId, layout.updatedAt);
    this.save();
    return delay(clone(layout));
  }

  async rejectConceptLayout(projectId: string): Promise<ConceptLayout> {
    const layout = this.requireConceptLayout(projectId);
    layout.status = 'rejected';
    layout.updatedAt = new Date().toISOString();
    this.touch(projectId, layout.updatedAt);
    this.save();
    return delay(clone(layout));
  }

  async updateConceptLayoutZones(projectId: string, zones: LayoutZone[]): Promise<ConceptLayout> {
    const project = this.requireProject(projectId);
    const layout = this.requireConceptLayout(projectId);
    const envelope = envelopeFor(project.brief);
    const result = validateLayout(zones, envelope);
    if (!result.ok) {
      throw new Error(`Invalid zone positions: ${result.errors.join('; ')}`);
    }
    layout.zones = zones;
    layout.updatedAt = new Date().toISOString();
    this.touch(projectId, layout.updatedAt);
    this.save();
    return delay(clone(layout));
  }

  private requireConceptLayout(projectId: string): ConceptLayout {
    const project = this.requireProject(projectId);
    if (!project.conceptLayout) {
      throw new Error(`Project ${projectId} has no concept layout.`);
    }
    return project.conceptLayout;
  }

  private touch(projectId: string, timestamp: string): void {
    const project = this.requireProject(projectId);
    project.updatedAt = timestamp;
  }

  async listFirms(): Promise<Firm[]> {
    return delay(clone(this.firms));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    // activeFirms is derived from seeded firms; the rest are platform-wide
    // aggregates that don't come from the sample projects.
    const stats: DashboardStats = {
      activeProjects: SEED_DASHBOARD_TOTALS.activeProjects,
      reachedApprovalRate: SEED_DASHBOARD_TOTALS.reachedApprovalRate,
      avgRevisionRounds: SEED_DASHBOARD_TOTALS.avgRevisionRounds,
      avgDaysToFirstPlan: SEED_DASHBOARD_TOTALS.avgDaysToFirstPlan,
      activeFirms: this.firms.length,
    };
    return delay(stats);
  }
}

/** Status values that count as "in progress" for high-level counts. */
export const IN_PROGRESS_STATUSES: ProjectStatus[] = [
  'intake_submitted',
  'awaiting_concept',
  'concept_generated',
  'under_architect_review',
  'revision_requested',
];
