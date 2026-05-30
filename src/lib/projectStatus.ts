// Single source of truth for how a ProjectStatus is presented: a human label
// plus the Tailwind classes for its pill. Every status pill always renders the
// label text, so colour is never the only signal (WCAG — accessibility.md).

import type { FloorplanStatus, ProjectStatus } from '../types';

export interface StatusBadgeStyle {
  label: string;
  /** Tailwind background + text colour classes for the pill. */
  className: string;
}

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, StatusBadgeStyle> = {
  draft: { label: 'Draft', className: 'bg-[#f7f6f3] text-[#6b6560]' },
  submitted: { label: 'Submitted', className: 'bg-[#e7eefb] text-[#2563eb]' },
  in_review: { label: 'In review', className: 'bg-[#fbf0e2] text-[#b45309]' },
  approved: { label: 'Approved', className: 'bg-[#e7f0eb] text-[#2f6f4f]' },
};

export const FLOORPLAN_STATUS_LABEL: Record<FloorplanStatus, string> = {
  current: 'Current',
  superseded: 'Superseded',
};

/** A one-line "17 ft · sleeps 2 · $45,000" summary for cards and headers. */
export function briefSummary(brief: {
  trailerLengthFt: number;
  sleeps: number;
  budgetUsd: number;
}): string {
  return `${brief.trailerLengthFt} ft · sleeps ${brief.sleeps} · ${formatUsd(
    brief.budgetUsd,
  )}`;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
