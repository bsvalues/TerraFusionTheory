import { db } from '../../db';
import { logs, type Log, type InsertLog, LogLevel, LogCategory } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export class LogStorage {
  async getLogs(options?: {
    level?: LogLevel | LogLevel[];
    category?: LogCategory | LogCategory[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    projectId?: number;
    userId?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<Log[]> {
    // Filtering logic can be expanded as needed
    let query = db.select().from(logs);
    // ...add filtering based on options
    return query;
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [created] = await db.insert(logs).values(log).returning();
    return created;
  }

  async getLogById(id: number): Promise<Log | undefined> {
    const result = await db.select().from(logs).where(eq(logs.id, id));
    return result[0];
  }

  async getLogsByCategory(category: LogCategory): Promise<Log[]> {
    return db.select().from(logs).where(eq(logs.category, category));
  }

  async deleteLogById(id: number): Promise<boolean> {
    const result = await db.delete(logs).where(eq(logs.id, id));
    return result.rowCount > 0;
  }
}

export const logStorage = new LogStorage();
