import { userStorage } from '../userStorage';
import { db } from '../../../db';
import { users } from '../../../../shared/schema';

describe('UserStorage', () => {
  beforeAll(async () => {
    // Optionally seed test DB
  });

  afterAll(async () => {
    // Optionally cleanup test DB
  });

  it('should create, fetch, update, and delete a user', async () => {
    // Create
    const newUser = { username: 'testuser', email: 'test@example.com', password: 'secret' };
    const created = await userStorage.createUser(newUser as any);
    expect(created.username).toBe('testuser');

    // Fetch
    const fetched = await userStorage.getUser(created.id);
    expect(fetched).toBeDefined();
    expect(fetched?.email).toBe('test@example.com');

    // Update
    const updated = await userStorage.updateUser({ ...created, email: 'updated@example.com' });
    expect(updated.email).toBe('updated@example.com');

    // Delete
    const deleted = await userStorage.deleteUser(created.id);
    expect(deleted).toBe(true);
  });
});
