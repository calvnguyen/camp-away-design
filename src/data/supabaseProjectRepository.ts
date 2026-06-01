import { createClient } from '../lib/supabase/client';
import type {
  BathroomType,
  BudgetRange,
  Comment,
  CommentRole,
  ConceptLayout,
  ConceptLayoutSource,
  ConceptLayoutStatus,
  DashboardStats,
  DesignStyle,
  Firm,
  FloorplanStatus,
  KitchenType,
  LayoutZone,
  PowerOption,
  Project,
  ProjectStatus,
  StandardBuild,
  TrailerSizeCategory,
  TowVehicle,
  UsageIntent,
} from '../types';
import type { CreateProjectInput, PostCommentInput, ProjectRepository } from './types';
import { envelopeFor, validateLayout } from '../lib/conceptLayout';
import { TemplateConceptLayoutGenerator } from './conceptLayoutGenerator';
import type { ConceptLayoutGenerator } from './conceptLayoutGenerator';

// ─── DB row shapes (snake_case) ───────────────────────────────────────────────

interface ProjectRow {
  id: string;
  client_name: string;
  status: string;
  firm_id: string | null;
  thumbnail_url: string;
  gallery_urls: string[];
  brief_size_category: string;
  brief_sleeps: number;
  brief_bathroom_type: string;
  brief_kitchen_type: string;
  brief_power_options: string[];
  brief_intended_usage: string;
  brief_tow_vehicle: string;
  brief_budget_range: string;
  brief_design_style: string;
  brief_notes: string;
  created_at: string;
  updated_at: string;
  floorplans?: FloorplanRow[];
  comments?: CommentRow[];
  concept_layouts?: ConceptLayoutRow[] | null;
}

interface FloorplanRow {
  id: string;
  project_id: string;
  version: number;
  status: string;
  uploaded_by: string;
  uploaded_at: string;
  label: string;
  file_url: string | null;
  file_type: string | null;
  revision_note: string | null;
}

interface CommentRow {
  id: string;
  project_id: string;
  author: string;
  role: string;
  body: string;
  created_at: string;
}

interface ConceptLayoutRow {
  id: string;
  project_id: string;
  status: string;
  source: string;
  length_ft: string | number;
  width_ft: string | number;
  zones: LayoutZone[];
  rationale: string;
  created_at: string;
  updated_at: string;
}

interface StandardBuildRow {
  id: string;
  name: string;
  size_category: string;
  sleeps: number;
  bathroom_type: string;
  kitchen_type: string;
}

interface FirmRow {
  id: string;
  name: string;
  active_projects: number;
}

interface DashboardStatsRow {
  active_projects: number | null;
  reached_approval_rate: number | null;
  avg_revision_rounds: number | null;
  avg_days_to_first_plan: number | null;
  active_firms: number | null;
}

// ─── Row → domain type mappers ────────────────────────────────────────────────

function rowToProject(row: ProjectRow): Project {
  const floorplanRows = Array.isArray(row.floorplans) ? row.floorplans : [];
  const commentRows = Array.isArray(row.comments) ? row.comments : [];
  const layoutRow = Array.isArray(row.concept_layouts)
    ? (row.concept_layouts[0] ?? null)
    : null;

  return {
    id: row.id,
    clientName: row.client_name,
    brief: {
      sizeCategory: row.brief_size_category as TrailerSizeCategory,
      sleeps: row.brief_sleeps,
      bathroomType: row.brief_bathroom_type as BathroomType,
      kitchenType: row.brief_kitchen_type as KitchenType,
      powerOptions: row.brief_power_options as PowerOption[],
      intendedUsage: row.brief_intended_usage as UsageIntent,
      towVehicle: row.brief_tow_vehicle as TowVehicle,
      budgetRange: row.brief_budget_range as BudgetRange,
      designStyle: row.brief_design_style as DesignStyle,
      notes: row.brief_notes,
    },
    status: row.status as ProjectStatus,
    firmId: row.firm_id,
    thumbnailUrl: row.thumbnail_url,
    galleryUrls: row.gallery_urls,
    floorplans: floorplanRows.map(rowToFloorplan).sort((a, b) => a.version - b.version),
    comments: commentRows.map(rowToComment).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    conceptLayout: layoutRow ? rowToConceptLayout(layoutRow) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToFloorplan(row: FloorplanRow) {
  return {
    id: row.id,
    version: row.version,
    status: row.status as FloorplanStatus,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    label: row.label,
    fileUrl: row.file_url,
    fileType: row.file_type,
    revisionNote: row.revision_note,
  };
}

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    author: row.author,
    role: row.role as CommentRole,
    body: row.body,
    createdAt: row.created_at,
  };
}

function rowToConceptLayout(row: ConceptLayoutRow): ConceptLayout {
  return {
    id: row.id,
    status: row.status as ConceptLayoutStatus,
    source: row.source as ConceptLayoutSource,
    lengthFt: Number(row.length_ft),
    widthFt: Number(row.width_ft),
    zones: row.zones as LayoutZone[],
    rationale: row.rationale,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToStandardBuild(row: StandardBuildRow): StandardBuild {
  return {
    id: row.id,
    name: row.name,
    sizeCategory: row.size_category as TrailerSizeCategory,
    sleeps: row.sleeps,
    bathroomType: row.bathroom_type as BathroomType,
    kitchenType: row.kitchen_type as KitchenType,
  };
}

function rowToFirm(row: FirmRow): Firm {
  return { id: row.id, name: row.name, activeProjects: row.active_projects };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertOk<T>(data: T | null, error: { message: string } | null, ctx: string): T {
  if (error) throw new Error(`${ctx}: ${error.message}`);
  if (data === null) throw new Error(`${ctx}: no data returned`);
  return data;
}

const PROJECT_SELECT = '*, floorplans(*), comments(*), concept_layouts(*)';

const DEFAULT_THUMBNAIL =
  'https://images.unsplash.com/photo-1604549001484-df28edea610b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400';

// ─── Repository ───────────────────────────────────────────────────────────────

export class SupabaseProjectRepository implements ProjectRepository {
  private generator: ConceptLayoutGenerator;

  // Getter so createClient() is called at query time (browser context with live
  // session cookies), not once at module-init time where SSR has no cookie storage.
  private get db(): ReturnType<typeof createClient> {
    return createClient();
  }

  constructor(generator: ConceptLayoutGenerator = new TemplateConceptLayoutGenerator()) {
    this.generator = generator;
  }

  // ── Projects ──────────────────────────────────────────────────────────────

  async listProjects(): Promise<Project[]> {
    const { data, error } = await this.db
      .from('projects')
      .select(PROJECT_SELECT)
      .order('created_at', { ascending: false });
    return (assertOk(data, error, 'listProjects') as ProjectRow[]).map(rowToProject);
  }

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await this.db
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`getProject: ${error.message}`);
    return data ? rowToProject(data as ProjectRow) : null;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const { data, error } = await this.db
      .from('projects')
      .insert({
        client_name: input.clientName,
        status: input.submit ? 'intake_submitted' : 'draft',
        thumbnail_url: DEFAULT_THUMBNAIL,
        brief_size_category: input.brief.sizeCategory,
        brief_sleeps: input.brief.sleeps,
        brief_bathroom_type: input.brief.bathroomType,
        brief_kitchen_type: input.brief.kitchenType,
        brief_power_options: input.brief.powerOptions,
        brief_intended_usage: input.brief.intendedUsage,
        brief_tow_vehicle: input.brief.towVehicle,
        brief_budget_range: input.brief.budgetRange,
        brief_design_style: input.brief.designStyle,
        brief_notes: input.brief.notes,
      })
      .select(PROJECT_SELECT)
      .single();
    return rowToProject(assertOk(data, error, 'createProject') as ProjectRow);
  }

  async assignFirm(projectId: string, firmId: string): Promise<Project> {
    const { data, error } = await this.db
      .from('projects')
      .update({ firm_id: firmId })
      .eq('id', projectId)
      .select(PROJECT_SELECT)
      .single();
    return rowToProject(assertOk(data, error, 'assignFirm') as ProjectRow);
  }

  // ── Floorplans ────────────────────────────────────────────────────────────

  async uploadFloorplan(
    projectId: string,
    file: File,
    uploadedBy: string,
    label: string,
    revisionNote?: string,
  ): Promise<Project> {
    // Determine next version
    const { data: existing } = await this.db
      .from('floorplans')
      .select('version')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1);
    const nextVersion = ((existing as { version: number }[] | null)?.[0]?.version ?? 0) + 1;

    // Upload file to Storage
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${projectId}/${nextVersion}-${Date.now()}.${ext}`;
    const { error: storageErr } = await this.db.storage
      .from('floorplans')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (storageErr) throw new Error(`uploadFloorplan (storage): ${storageErr.message}`);

    const { data: urlData } = this.db.storage.from('floorplans').getPublicUrl(path);

    // Supersede previous current version
    await this.db
      .from('floorplans')
      .update({ status: 'superseded' })
      .eq('project_id', projectId)
      .eq('status', 'current');

    // Insert new floorplan row
    const { error: fpErr } = await this.db.from('floorplans').insert({
      project_id: projectId,
      version: nextVersion,
      status: 'current',
      uploaded_by: uploadedBy,
      label,
      file_url: urlData.publicUrl,
      file_type: file.type,
      revision_note: revisionNote ?? null,
    });
    if (fpErr) throw new Error(`uploadFloorplan (insert): ${fpErr.message}`);

    // Advance project status if still in intake
    const { data: proj } = await this.db
      .from('projects')
      .select('status')
      .eq('id', projectId)
      .single();
    const currentStatus = (proj as { status: string } | null)?.status;
    if (currentStatus === 'intake_submitted' || currentStatus === 'awaiting_concept') {
      await this.db
        .from('projects')
        .update({ status: 'under_architect_review' })
        .eq('id', projectId);
    }

    const updated = await this.getProject(projectId);
    if (!updated) throw new Error(`uploadFloorplan: project ${projectId} not found after upload`);
    return updated;
  }

  async postComment(input: PostCommentInput): Promise<Comment> {
    const { data, error } = await this.db
      .from('comments')
      .insert({
        project_id: input.projectId,
        author: input.author,
        role: input.role,
        body: input.body,
      })
      .select()
      .single();
    return rowToComment(assertOk(data, error, 'postComment') as CommentRow);
  }

  async approveCurrentFloorplan(projectId: string): Promise<Project> {
    const { count } = await this.db
      .from('floorplans')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'current');
    if (!count) throw new Error(`Project ${projectId} has no floorplan to approve.`);

    const { data, error } = await this.db
      .from('projects')
      .update({ status: 'approved' })
      .eq('id', projectId)
      .select(PROJECT_SELECT)
      .single();
    return rowToProject(assertOk(data, error, 'approveCurrentFloorplan') as ProjectRow);
  }

  async requestRevision(projectId: string): Promise<Project> {
    const { data, error } = await this.db
      .from('projects')
      .update({ status: 'revision_requested' })
      .eq('id', projectId)
      .select(PROJECT_SELECT)
      .single();
    return rowToProject(assertOk(data, error, 'requestRevision') as ProjectRow);
  }

  // ── Concept layout ────────────────────────────────────────────────────────

  async findEquivalentBuild(projectId: string): Promise<StandardBuild | null> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    const { data, error } = await this.db.from('standard_builds').select('*');
    const builds = (assertOk(data, error, 'findEquivalentBuild') as StandardBuildRow[]).map(
      rowToStandardBuild,
    );
    return (
      builds.find(
        (b) =>
          b.sizeCategory === project.brief.sizeCategory &&
          b.sleeps === project.brief.sleeps &&
          b.bathroomType === project.brief.bathroomType &&
          b.kitchenType === project.brief.kitchenType,
      ) ?? null
    );
  }

  async generateConceptLayout(projectId: string): Promise<ConceptLayout> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);

    if (await this.findEquivalentBuild(projectId)) {
      throw new Error(
        `Project ${projectId} matches a standard build — no concept layout needed.`,
      );
    }

    const envelope = envelopeFor(project.brief);
    const generated = await this.generator.generate(project.brief);

    const { data, error } = await this.db
      .from('concept_layouts')
      .upsert(
        {
          project_id: projectId,
          status: 'pending_review',
          source: generated.source,
          length_ft: envelope.lengthFt,
          width_ft: envelope.widthFt,
          zones: generated.zones,
          rationale: generated.rationale,
        },
        { onConflict: 'project_id' },
      )
      .select()
      .single();
    return rowToConceptLayout(assertOk(data, error, 'generateConceptLayout') as ConceptLayoutRow);
  }

  async approveConceptLayout(projectId: string): Promise<ConceptLayout> {
    return this.setLayoutStatus(projectId, 'approved');
  }

  async rejectConceptLayout(projectId: string): Promise<ConceptLayout> {
    return this.setLayoutStatus(projectId, 'rejected');
  }

  private async setLayoutStatus(
    projectId: string,
    status: ConceptLayoutStatus,
  ): Promise<ConceptLayout> {
    const { data, error } = await this.db
      .from('concept_layouts')
      .update({ status })
      .eq('project_id', projectId)
      .select()
      .single();
    return rowToConceptLayout(assertOk(data, error, `setLayoutStatus(${status})`) as ConceptLayoutRow);
  }

  async updateConceptLayoutZones(projectId: string, zones: LayoutZone[]): Promise<ConceptLayout> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    if (!project.conceptLayout) throw new Error(`Project ${projectId} has no concept layout.`);

    const envelope = envelopeFor(project.brief);
    const result = validateLayout(zones, envelope);
    if (!result.ok) throw new Error(`Invalid zone positions: ${result.errors.join('; ')}`);

    const { data, error } = await this.db
      .from('concept_layouts')
      .update({ zones })
      .eq('project_id', projectId)
      .select()
      .single();
    return rowToConceptLayout(
      assertOk(data, error, 'updateConceptLayoutZones') as ConceptLayoutRow,
    );
  }

  // ── Firms & stats ─────────────────────────────────────────────────────────

  async listFirms(): Promise<Firm[]> {
    const { data, error } = await this.db.from('firms').select('*').order('name');
    return (assertOk(data, error, 'listFirms') as FirmRow[]).map(rowToFirm);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const { data, error } = await this.db
      .from('dashboard_stats')
      .select('*')
      .single();
    const row = assertOk(data, error, 'getDashboardStats') as DashboardStatsRow;
    return {
      activeProjects: Number(row.active_projects ?? 0),
      reachedApprovalRate: Number(row.reached_approval_rate ?? 0),
      avgRevisionRounds: Number(row.avg_revision_rounds ?? 0),
      avgDaysToFirstPlan: Number(row.avg_days_to_first_plan ?? 0),
      activeFirms: Number(row.active_firms ?? 0),
    };
  }
}
