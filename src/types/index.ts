// Shared domain types for CampAwayDesign — a design front-door for affordable,
// SUV-towable tiny trailers. See ../../../../docs/prd.md for the product spec.
//
// Model (the redesigned "projects" IA): a client submits a Brief describing the
// trailer they want. That becomes a Project. If no equivalent standard build
// already exists, the system can generate a rough 2D ConceptLayout (zones) as a
// starting point for client/designer review — which must be APPROVED before the
// project can go to production (build). An assigned firm uploads Floorplan
// versions; client and designer discuss them via Comments; the client approves a
// floorplan, which moves the Project to `approved`. Ops oversee everything from
// an admin dashboard (all projects, firms, platform metrics).

export type ProjectStatus =
  | 'draft' // brief started, not yet submitted
  | 'submitted' // brief submitted, awaiting first floorplan
  | 'in_review' // a floorplan version is up for client review
  | 'approved'; // client approved the current floorplan

/** The client's requirements for their trailer — captured by the brief form and
 *  shown read-only on the project view. Mirrors the PRD's small-trailer envelope. */
export interface TrailerBrief {
  trailerLengthFt: number; // small only, target 16–18
  sleeps: number; // adults
  hasWetBath: boolean;
  hasKitchenette: boolean;
  solar: boolean; // optional upgrade
  battery: boolean; // optional upgrade
  budgetUsd: number; // target under ~50k
  notes: string;
}

export type FloorplanStatus =
  | 'current' // the latest version, up for review
  | 'superseded'; // an older version kept for history

/** One uploaded floorplan version for a project. */
export interface Floorplan {
  id: string;
  version: number; // 1-based; higher = newer
  status: FloorplanStatus;
  uploadedBy: string; // e.g. "designer"
  uploadedAt: string; // ISO date
  /** Human label shown on the canvas, e.g. "17ft Trailer Layout". */
  label: string;
}

export type CommentRole = 'client' | 'designer';

/** A message in a project's review thread. */
export interface Comment {
  id: string;
  author: string;
  role: CommentRole;
  body: string;
  createdAt: string; // ISO date
}

/** A client engagement: their brief, the floorplan versions produced for it, and
 *  the review conversation. */
export interface Project {
  id: string;
  clientName: string;
  brief: TrailerBrief;
  status: ProjectStatus;
  /** The firm assigned to design this project, or null if unassigned. */
  firmId: string | null;
  /** Cover image for the project card / hero. */
  thumbnailUrl: string;
  /** Additional hero gallery images on the project view. */
  galleryUrls: string[];
  floorplans: Floorplan[];
  comments: Comment[];
  /**
   * The rough 2D concept layout generated for this project's brief when no
   * equivalent standard build exists, or null if none has been generated.
   * Generating one is optional; it must be approved before the project can go to
   * production (build).
   */
  conceptLayout: ConceptLayout | null;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

/** The functional zones a concept layout partitions the trailer envelope into. */
export type ZoneKind = 'sleeping' | 'kitchenette' | 'bathroom' | 'storage' | 'entry';

/** Display order + labels for the zones, shared by the generator and the SVG. */
export const ZONE_LABELS: Record<ZoneKind, string> = {
  entry: 'Entry',
  kitchenette: 'Kitchenette',
  bathroom: 'Bathroom',
  storage: 'Storage',
  sleeping: 'Sleeping area',
};

/**
 * One zone rectangle, positioned in feet within the trailer envelope: x runs
 * along the length (0 = front/hitch end), y across the width (0 = one side).
 */
export interface LayoutZone {
  kind: ZoneKind;
  x: number; // ft from the front
  y: number; // ft from one side
  width: number; // ft along the length
  depth: number; // ft across the width
}

export type ConceptLayoutStatus =
  | 'pending_review' // generated; awaiting client/designer approval
  | 'approved' // approved — this is the gate that lets the project go to build
  | 'rejected'; // rejected; can be regenerated

/** How a concept layout was produced — useful for transparency in the UI. */
export type ConceptLayoutSource = 'ai' | 'template';

/**
 * A rough, non-architectural 2D concept layout: a starting point for review, not
 * a final drawing. Zones live inside an envelope of `lengthFt` × `widthFt` feet.
 */
export interface ConceptLayout {
  id: string;
  status: ConceptLayoutStatus;
  source: ConceptLayoutSource;
  /** Trailer envelope the zones are laid out within. */
  lengthFt: number;
  widthFt: number;
  zones: LayoutZone[];
  /** A short plain-language note on the zoning rationale. */
  rationale: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

/**
 * A standardized, already-engineered trailer build. When a client's brief
 * matches one of these, no concept layout is needed — the project can go
 * straight to production against the existing build.
 */
export interface StandardBuild {
  id: string;
  name: string;
  lengthFt: number;
  sleeps: number;
  hasWetBath: boolean;
  hasKitchenette: boolean;
}

/** A third-party design/build firm. */
export interface Firm {
  id: string;
  name: string;
  /** How many projects the firm is actively working on. */
  activeProjects: number;
}

/** Aggregate platform metrics for the admin dashboard. */
export interface DashboardStats {
  activeProjects: number;
  /** Share of projects that reached `approved` (0–1). */
  reachedApprovalRate: number;
  avgRevisionRounds: number;
  avgDaysToFirstPlan: number;
  activeFirms: number;
}
