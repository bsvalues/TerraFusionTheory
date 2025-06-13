import { logStorage } from '../logStorage';

describe('LogStorage', () => {
  it('should create, fetch, and delete a log', async () => {
    // Create
    const newLog = { message: 'Test log', level: 'INFO', category: 'GENERAL' };
    const created = await logStorage.createLog(newLog as any);
    expect(created.message).toBe('Test log');

    // Fetch
    const fetched = await logStorage.getLogById(created.id);
    expect(fetched).toBeDefined();
    expect(fetched?.level).toBe('INFO');

    // Delete
    const deleted = await logStorage.deleteLogById(created.id);
    expect(deleted).toBe(true);
  });
});
