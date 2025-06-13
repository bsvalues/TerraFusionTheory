import { db } from '../../db';
import { projects, type Project, type InsertProject } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export class ProjectStorage {
  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async getAllProjects(): Promise<Project[]> {
    return db.select().from(projects);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(project: Project): Promise<Project> {
    const [updated] = await db.update(projects).set(project).where(eq(projects.id, project.id)).returning();
    return updated;
  }
}

export const projectStorage = new ProjectStorage();
