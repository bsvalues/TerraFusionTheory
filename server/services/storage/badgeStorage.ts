import { db } from '../../db';
import { badges, type Badge, type InsertBadge, BadgeType, BadgeLevel, userBadges, type UserBadge, type InsertUserBadge } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export class BadgeStorage {
  async getBadges(): Promise<Badge[]> {
    return db.select().from(badges);
  }

  async getBadgeById(id: number): Promise<Badge | undefined> {
    const result = await db.select().from(badges).where(eq(badges.id, id));
    return result[0];
  }

  async getBadgesByType(type: BadgeType): Promise<Badge[]> {
    return db.select().from(badges).where(eq(badges.type, type));
  }

  async getBadgesByLevel(level: BadgeLevel): Promise<Badge[]> {
    return db.select().from(badges).where(eq(badges.level, level));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [created] = await db.insert(badges).values(badge).returning();
    return created;
  }

  async updateBadge(badge: Badge): Promise<Badge> {
    const [updated] = await db.update(badges).set(badge).where(eq(badges.id, badge.id)).returning();
    return updated;
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return db.select().from(userBadges).where(eq(userBadges.userId, userId));
  }

  async getUserBadgesByProject(userId: number, projectId: number): Promise<UserBadge[]> {
    return db.select().from(userBadges).where(eq(userBadges.userId, userId)).where(eq(userBadges.projectId, projectId));
  }

  async awardBadgeToUser(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [created] = await db.insert(userBadges).values(userBadge).returning();
    return created;
  }

  async updateUserBadgeProgress(id: number, progress: number, metadata?: Record<string, any>): Promise<UserBadge> {
    const [updated] = await db.update(userBadges).set({ progress, metadata }).where(eq(userBadges.id, id)).returning();
    return updated;
  }
}

export const badgeStorage = new BadgeStorage();
