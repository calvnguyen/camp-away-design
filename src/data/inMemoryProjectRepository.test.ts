import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryProjectRepository } from './inMemoryProjectRepository';

// Use a fresh repo with no storage so tests are isolated from localStorage.
function freshRepo() {
  return new InMemoryProjectRepository(null);
}

describe('InMemoryProjectRepository', () => {
  let repo: InMemoryProjectRepository;

  beforeEach(() => {
    repo = freshRepo();
  });

  it('seeds with fixture projects', async () => {
    const projects = await repo.listProjects();
    expect(projects.length).toBeGreaterThan(0);
  });

  it('adds a floorplan as a new version and resets approval', async () => {
    const [project] = await repo.listProjects();
    await repo.approveFloorplan(project.id, project.floorplans[0].id, 'client');

    const updated = await repo.addFloorplan(project.id, {
      src: '',
      fileName: 'v2.png',
      uploadedBy: 'designer',
    });

    expect(updated.floorplans).toHaveLength(2);
    expect(updated.floorplans[1].version).toBe(2);
    expect(updated.approvedFloorplanId).toBeNull();
    expect(updated.status).toBe('in_review');
  });

  it('locks the approved floorplan and moves status to approved', async () => {
    const [project] = await repo.listProjects();
    const updated = await repo.approveFloorplan(
      project.id,
      project.floorplans[0].id,
      'client',
    );

    expect(updated.approvedFloorplanId).toBe(project.floorplans[0].id);
    expect(updated.status).toBe('approved');
  });
});
