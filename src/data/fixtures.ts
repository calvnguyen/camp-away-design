// Seed data for the in-memory repository, mirroring the redesign mockups
// (Maria & Jon, Dev & Sam, The Okafors, …). Kept here so the repository stays
// the only place that knows about concrete data.

import type { ConceptLayout, Firm, Project, TrailerBrief } from '../types';
import { envelopeFor, templateLayout, templateRationale } from '../lib/conceptLayout';

/** A pre-generated, template-sourced concept layout awaiting review. */
function pendingConceptLayout(brief: TrailerBrief, id: string, at: string): ConceptLayout {
  const envelope = envelopeFor(brief);
  return {
    id,
    status: 'pending_review',
    source: 'template',
    lengthFt: envelope.lengthFt,
    widthFt: envelope.widthFt,
    zones: templateLayout(envelope),
    rationale: templateRationale(envelope),
    createdAt: at,
    updatedAt: at,
  };
}

const now = '2026-05-29T12:00:00.000Z';

// Unsplash cover/gallery images used by the mockups. Centralised so we don't
// scatter raw URLs across fixtures.
const img = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=${w}`;

function brief(overrides: Partial<TrailerBrief> = {}): TrailerBrief {
  return {
    sizeCategory: 'medium',
    sleeps: 2,
    bathroomType: 'wet_bath',
    kitchenType: 'standard',
    powerOptions: [],
    intendedUsage: 'weekend',
    towVehicle: 'suv',
    budgetRange: '40k_50k',
    designStyle: 'modern',
    notes: '',
    ...overrides,
  };
}

export function seedFirms(): Firm[] {
  return [
    { id: 'firm-cedar-pine', name: 'Cedar & Pine Co.', activeProjects: 8 },
    { id: 'firm-wander', name: 'Wander Studios', activeProjects: 5 },
    { id: 'firm-tiny-foundry', name: 'Tiny Foundry', activeProjects: 4 },
    { id: 'firm-hearth-haul', name: 'Hearth & Haul', activeProjects: 3 },
    { id: 'firm-drift', name: 'Drift Cabins', activeProjects: 2 },
    { id: 'firm-nomad', name: 'Nomad Build Co.', activeProjects: 2 },
  ];
}

export function seedProjects(): Project[] {
  return [
    {
      id: '1',
      clientName: 'Maria & Jon',
      brief: brief({
        sizeCategory: 'medium',
        budgetRange: '40k_50k',
        designStyle: 'rustic',
        notes: 'Weekend getaways for two; prefer light wood interior.',
      }),
      status: 'under_architect_review',
      firmId: 'firm-cedar-pine',
      thumbnailUrl: img('1604549053344-d353adf347d7', 400),
      galleryUrls: [
        img('1604549053344-d353adf347d7', 1080),
        img('1773123441753-e87f821ec76d', 1080),
        img('1759398430338-8057876edf61', 1080),
      ],
      floorplans: [
        {
          id: 'fp-1-v1',
          version: 1,
          status: 'superseded',
          uploadedBy: 'designer',
          uploadedAt: '2026-05-24T12:00:00.000Z',
          label: '17ft Trailer Layout',
        },
        {
          id: 'fp-1-v2',
          version: 2,
          status: 'current',
          uploadedBy: 'designer',
          uploadedAt: '2026-05-28T12:00:00.000Z',
          label: '17ft Trailer Layout',
        },
      ],
      comments: [
        {
          id: 'c-1-1',
          author: 'Maria',
          role: 'client',
          body: 'Could the kitchenette be a bit larger?',
          createdAt: '2026-05-25T12:00:00.000Z',
        },
        {
          id: 'c-1-2',
          author: 'Designer',
          role: 'designer',
          body: 'Done — v2 widens it by 20cm.',
          createdAt: '2026-05-28T12:00:00.000Z',
        },
      ],
      conceptLayout: null,
      createdAt: '2026-05-15T12:00:00.000Z',
      updatedAt: '2026-05-28T12:00:00.000Z',
    },
    {
      id: '2',
      clientName: 'Dev & Sam',
      brief: brief({
        sizeCategory: 'medium',
        powerOptions: ['solar'],
        intendedUsage: 'weekend',
        budgetRange: '40k_50k',
        notes: 'Off-grid weekends; would love solar.',
      }),
      status: 'intake_submitted',
      firmId: null,
      thumbnailUrl: img('1604549001484-df28edea610b', 400),
      galleryUrls: [img('1604549001484-df28edea610b', 1080)],
      floorplans: [],
      comments: [],
      conceptLayout: null,
      createdAt: '2026-05-26T12:00:00.000Z',
      updatedAt: '2026-05-26T12:00:00.000Z',
    },
    {
      id: '3',
      clientName: 'The Okafors',
      brief: brief({
        sizeCategory: 'small',
        budgetRange: 'under_40k',
        designStyle: 'minimalist',
        notes: 'Compact and light; two kids occasionally.',
      }),
      status: 'approved',
      firmId: 'firm-wander',
      thumbnailUrl: img('1771022136054-208a15f1126f', 400),
      galleryUrls: [img('1771022136054-208a15f1126f', 1080)],
      floorplans: [
        {
          id: 'fp-3-v1',
          version: 1,
          status: 'superseded',
          uploadedBy: 'designer',
          uploadedAt: '2026-05-10T12:00:00.000Z',
          label: '16ft Trailer Layout',
        },
        {
          id: 'fp-3-v2',
          version: 2,
          status: 'superseded',
          uploadedBy: 'designer',
          uploadedAt: '2026-05-14T12:00:00.000Z',
          label: '16ft Trailer Layout',
        },
        {
          id: 'fp-3-v3',
          version: 3,
          status: 'current',
          uploadedBy: 'designer',
          uploadedAt: '2026-05-18T12:00:00.000Z',
          label: '16ft Trailer Layout',
        },
      ],
      comments: [],
      conceptLayout: null,
      createdAt: '2026-05-02T12:00:00.000Z',
      updatedAt: '2026-05-18T12:00:00.000Z',
    },
    {
      id: '4',
      clientName: 'Lena T.',
      // Sleeps 3 → no equivalent standard build, so a concept layout applies
      // (not yet generated — the project view offers to generate one).
      brief: brief({ sizeCategory: 'medium', sleeps: 3, budgetRange: '50k_70k', notes: 'Needs to sleep three.' }),
      status: 'draft',
      firmId: 'firm-cedar-pine',
      thumbnailUrl: img('1641996992441-244ee607935b', 400),
      galleryUrls: [img('1641996992441-244ee607935b', 1080)],
      floorplans: [],
      comments: [],
      conceptLayout: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '5',
      clientName: 'Priya & Rui',
      brief: brief({ sizeCategory: 'medium', budgetRange: '40k_50k', powerOptions: ['battery'] }),
      status: 'revision_requested',
      firmId: 'firm-tiny-foundry',
      thumbnailUrl: img('1604549001484-df28edea610b', 400),
      galleryUrls: [img('1604549001484-df28edea610b', 1080)],
      floorplans: [
        {
          id: 'fp-5-v1',
          version: 1,
          status: 'current',
          uploadedBy: 'designer',
          uploadedAt: '2026-05-27T12:00:00.000Z',
          label: '17ft Trailer Layout',
        },
      ],
      comments: [],
      conceptLayout: null,
      createdAt: '2026-05-20T12:00:00.000Z',
      updatedAt: '2026-05-27T12:00:00.000Z',
    },
    {
      id: '6',
      clientName: 'Aria & Sky',
      // Dry bath → no equivalent standard build; concept layout generated awaiting approval.
      brief: brief({
        sizeCategory: 'medium',
        sleeps: 2,
        bathroomType: 'dry_bath',
        budgetRange: 'under_40k',
        notes: 'Prefer a dry bath and more storage.',
      }),
      status: 'concept_generated',
      firmId: null,
      thumbnailUrl: img('1641996992441-244ee607935b', 400),
      galleryUrls: [img('1641996992441-244ee607935b', 1080)],
      floorplans: [],
      comments: [],
      conceptLayout: pendingConceptLayout(
        brief({ sizeCategory: 'medium', sleeps: 2, bathroomType: 'dry_bath' }),
        'concept-aria-sky',
        '2026-05-29T12:00:00.000Z',
      ),
      createdAt: '2026-05-29T12:00:00.000Z',
      updatedAt: '2026-05-29T12:00:00.000Z',
    },
  ];
}

/**
 * Platform-wide aggregate metrics shown on the admin dashboard. These represent
 * the whole platform (larger than the handful of sample projects above), so they
 * are seeded constants rather than derived from `seedProjects()`.
 */
export const SEED_DASHBOARD_TOTALS = {
  activeProjects: 24,
  reachedApprovalRate: 0.38,
  avgRevisionRounds: 2.4,
  avgDaysToFirstPlan: 3.1,
} as const;
