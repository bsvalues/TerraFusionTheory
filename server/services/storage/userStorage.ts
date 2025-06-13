import { db } from '../../db';
import { users, type User, type InsertUser } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export class UserStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(user: User): Promise<User> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, user.id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }
}

export const userStorage = new UserStorage();
