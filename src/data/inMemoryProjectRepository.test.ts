import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryProjectRepository } from './inMemoryProjectRepository';
import type { TrailerBrief } from '../types';

function brief(overrides: Partial<TrailerBrief> = {}): TrailerBrief {
  return {
    trailerLengthFt: 17,
    sleeps: 2,
    hasWetBath: true,
    hasKitchenette: true,
    solar: false,
    battery: false,
    budgetUsd: 45_000,
    notes: '',
    ...overrides,
  };
}

describe('InMemoryProjectRepository', () => {
  let repo: InMemoryProjectRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new InMemoryProjectRepository();
  });

  it('seeds the sample projects', async () => {
    const projects = await repo.listProjects();
    expect(projects.length).toBeGreaterThanOrEqual(5);
    expect(projects.map((p) => p.clientName)).toContain('Maria & Jon');
  });

  it('creates a submitted project from a brief', async () => {
    const project = await repo.createProject({ clientName: 'Ada L.', brief: brief(), submit: true });
    expect(project.status).toBe('submitted');
    expect(project.clientName).toBe('Ada L.');

    const fetched = await repo.getProject(project.id);
    expect(fetched?.id).toBe(project.id);
  });

  it('saves an un-submitted brief as a draft', async () => {
    const project = await repo.createProject({ clientName: 'Ada L.', brief: brief(), submit: false });
    expect(project.status).toBe('draft');
  });

  it('returns null for an unknown project', async () => {
    expect(await repo.getProject('does-not-exist')).toBeNull();
  });

  it('appends comments to the review thread', async () => {
    const comment = await repo.postComment({
      projectId: '1',
      author: 'You',
      role: 'designer',
      body: 'Looks great.',
    });
    expect(comment.body).toBe('Looks great.');

    const project = await repo.getProject('1');
    expect(project?.comments.at(-1)?.id).toBe(comment.id);
  });

  it('approves the current floorplan and moves the project to approved', async () => {
    const project = await repo.approveCurrentFloorplan('1');
    expect(project.status).toBe('approved');
  });

  it('throws when approving a project with no floorplan', async () => {
    // Project 2 (Dev & Sam) is submitted with no floorplans.
    await expect(repo.approveCurrentFloorplan('2')).rejects.toThrow(/no floorplan/i);
  });

  it('assigns a firm to a project', async () => {
    const project = await repo.assignFirm('2', 'firm-wander');
    expect(project.firmId).toBe('firm-wander');
  });

  it('rejects assigning an unknown firm', async () => {
    await expect(repo.assignFirm('2', 'firm-nope')).rejects.toThrow(/firm not found/i);
  });

  it('reports active firm count in dashboard stats', async () => {
    const firms = await repo.listFirms();
    const stats = await repo.getDashboardStats();
    expect(stats.activeFirms).toBe(firms.length);
  });

  it('persists new projects across instances via localStorage', async () => {
    await repo.createProject({ clientName: 'Persisted', brief: brief(), submit: true });
    const fresh = new InMemoryProjectRepository();
    const names = (await fresh.listProjects()).map((p) => p.clientName);
    expect(names).toContain('Persisted');
  });
});
