import type { Project } from '../types';
import { TRAILER_CONSTRAINTS } from '../lib/constraints';

const now = '2026-05-01T12:00:00.000Z';

export function seedProjects(): Project[] {
  return [
    {
      id: 'proj-maria-jon',
      clientName: 'Maria & Jon',
      status: 'in_review',
      brief: {
        trailerLengthFt: TRAILER_CONSTRAINTS.trailerLengthFt.default,
        sleeps: TRAILER_CONSTRAINTS.sleeps.default,
        hasWetBath: true,
        hasKitchenette: true,
        solarUpgrade: true,
        batteryUpgrade: false,
        budgetUsd: 45_000,
        notes: 'Weekend getaway rig. Want a bigger kitchenette if it fits the budget.',
        referenceImages: [],
      },
      floorplans: [
        {
          id: 'fp-1',
          version: 1,
          src: '',
          fileName: 'draft-v1.png',
          uploadedBy: 'designer',
          uploadedAt: now,
        },
      ],
      comments: [
        {
          id: 'c-1',
          floorplanId: 'fp-1',
          author: 'client',
          body: 'Love it — can the kitchenette be a bit larger?',
          createdAt: now,
        },
      ],
      approvedFloorplanId: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
