import { badgeStorage } from '../badgeStorage';

describe('BadgeStorage', () => {
  it('should create, fetch, and update a badge', async () => {
    // Create
    const newBadge = { name: 'Test Badge', type: 'ACHIEVEMENT', level: 'BRONZE' };
    const created = await badgeStorage.createBadge(newBadge as any);
    expect(created.name).toBe('Test Badge');

    // Fetch
    const fetched = await badgeStorage.getBadgeById(created.id);
    expect(fetched).toBeDefined();
    expect(fetched?.type).toBe('ACHIEVEMENT');

    // Update
    const updated = await badgeStorage.updateBadge({ ...created, name: 'Updated Badge' });
    expect(updated.name).toBe('Updated Badge');
  });

  it('should award badge to user and update progress', async () => {
    const userBadge = { userId: 1, badgeId: 1, progress: 0 };
    const awarded = await badgeStorage.awardBadgeToUser(userBadge as any);
    expect(awarded.userId).toBe(1);
    const updated = await badgeStorage.updateUserBadgeProgress(awarded.id, 50);
    expect(updated.progress).toBe(50);
  });
});
