// Shared domain types for CampAwayDesign.
// See ../../../../docs/prd.md for the product spec these model.

export type UserRole = 'client' | 'designer' | 'builder';

export type ProjectStatus =
  | 'draft' // client is still filling out the brief
  | 'submitted' // brief sent to a firm, awaiting first floorplan
  | 'in_review' // floorplan(s) uploaded, under client review
  | 'approved'; // client has approved the latest floorplan

/** A client's requirements for their trailer home. */
export interface Brief {
  trailerLengthFt: number; // target 16-18
  sleeps: number; // adults
  hasWetBath: boolean;
  hasKitchenette: boolean;
  solarUpgrade: boolean;
  batteryUpgrade: boolean;
  budgetUsd: number; // target under ~50_000
  notes: string;
  referenceImages: ReferenceImage[];
}

export interface ReferenceImage {
  id: string;
  /** Simulated upload: object URL or base64 data URL. No real storage in the MVP. */
  src: string;
  fileName: string;
}

export interface Floorplan {
  id: string;
  version: number; // 1-based, increments per upload
  /** Simulated upload, as with reference images. */
  src: string;
  fileName: string;
  uploadedBy: UserRole;
  uploadedAt: string; // ISO timestamp
}

export interface Comment {
  id: string;
  floorplanId: string;
  author: UserRole;
  body: string;
  createdAt: string; // ISO timestamp
}

export interface Project {
  id: string;
  clientName: string;
  status: ProjectStatus;
  brief: Brief;
  floorplans: Floorplan[];
  comments: Comment[];
  approvedFloorplanId: string | null;
  createdAt: string;
  updatedAt: string;
}
