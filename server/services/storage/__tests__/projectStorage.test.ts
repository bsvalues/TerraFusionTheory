import { projectStorage } from '../projectStorage';
import { db } from '../../../db';
import { projects } from '../../../../shared/schema';

describe('ProjectStorage', () => {
  beforeAll(async () => {
    // Optionally seed test DB
  });

  afterAll(async () => {
    // Optionally cleanup test DB
  });

  it('should create, fetch, and update a project', async () => {
    // Create
    const newProject = { name: 'Test Project', ownerId: 1 };
    const created = await projectStorage.createProject(newProject as any);
    expect(created.name).toBe('Test Project');

    // Fetch
    const fetched = await projectStorage.getProject(created.id);
    expect(fetched).toBeDefined();
    expect(fetched?.ownerId).toBe(1);

    // Update
    const updated = await projectStorage.updateProject({ ...created, name: 'Updated Project' });
    expect(updated.name).toBe('Updated Project');
  });
});
