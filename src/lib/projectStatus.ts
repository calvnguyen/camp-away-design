// Single source of truth for how a ProjectStatus is presented: a human label
// plus the Tailwind classes for its pill. Every status pill always renders the
// label text, so colour is never the only signal (WCAG — accessibility.md).

import type { FloorplanStatus, ProjectStatus, TrailerBrief, TrailerSizeCategory, BudgetRange } from '../types';
import { TRAILER_SIZE_CATEGORIES } from './constraints';

export interface StatusBadgeStyle {
  label: string;
  /** Tailwind background + text colour classes for the pill. */
  className: string;
}

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, StatusBadgeStyle> = {
  draft:                    { label: 'Draft',                    className: 'bg-[#f7f6f3] text-[#6b6560]' },
  intake_submitted:         { label: 'Intake Submitted',         className: 'bg-[#e7eefb] text-[#2563eb]' },
  awaiting_concept:         { label: 'Awaiting Concept',         className: 'bg-[#fbf0e2] text-[#b45309]' },
  concept_generated:        { label: 'Concept Generated',        className: 'bg-[#f3e8f0] text-[#9333ea]' },
  under_architect_review:   { label: 'Under Architect Review',   className: 'bg-[#fbf0e2] text-[#b45309]' },
  revision_requested:       { label: 'Revision Requested',       className: 'bg-[#fde8e8] text-[#b4231d]' },
  approved:                 { label: 'Approved',                 className: 'bg-[#e7f0eb] text-[#2f6f4f]' },
  final_design_in_progress: { label: 'Final Design In Progress', className: 'bg-[#e7f0eb] text-[#2f6f4f]' },
};

export const FLOORPLAN_STATUS_LABEL: Record<FloorplanStatus, string> = {
  current: 'Current',
  superseded: 'Superseded',
};

const SIZE_LABEL: Record<TrailerSizeCategory, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

const BUDGET_LABEL: Record<BudgetRange, string> = {
  under_40k: 'Under $40k',
  '40k_50k': '$40k–$50k',
  '50k_70k': '$50k–$70k',
  '70k_plus': '$70k+',
};

/** A one-line "Medium · sleeps 2 · $40k–$50k" summary for cards and headers. */
export function briefSummary(brief: TrailerBrief): string {
  const spec = TRAILER_SIZE_CATEGORIES[brief.sizeCategory];
  const size = `${SIZE_LABEL[brief.sizeCategory]} (${spec.minLengthFt}–${spec.maxLengthFt} ft)`;
  const sleepLabel = brief.sleeps === 6 ? '5–6 adults' : `${brief.sleeps} adults`;
  return `${size} · sleeps ${sleepLabel} · ${BUDGET_LABEL[brief.budgetRange]}`;
}
