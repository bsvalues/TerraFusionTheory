import { db } from '../../db';
import { analysis, type Analysis, type InsertAnalysis } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export class AnalysisStorage {
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const result = await db.select().from(analysis).where(eq(analysis.id, id));
    return result[0];
  }

  async getAnalysisByProjectId(projectId: number): Promise<Analysis | undefined> {
    const result = await db.select().from(analysis).where(eq(analysis.projectId, projectId));
    return result[0];
  }

  async saveAnalysis(analysisInput: Partial<Analysis> & { projectId: number }): Promise<Analysis> {
    // Upsert logic: update if exists, else insert
    const existing = await this.getAnalysisByProjectId(analysisInput.projectId);
    if (existing) {
      const [updated] = await db.update(analysis).set(analysisInput).where(eq(analysis.projectId, analysisInput.projectId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(analysis).values(analysisInput).returning();
      return created;
    }
  }

  async updateAnalysis(analysisData: Analysis): Promise<Analysis> {
    const [updated] = await db.update(analysis).set(analysisData).where(eq(analysis.id, analysisData.id)).returning();
    return updated;
  }
}

export const analysisStorage = new AnalysisStorage();
