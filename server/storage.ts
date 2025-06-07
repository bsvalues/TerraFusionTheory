import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  conversations, type Conversation, type InsertConversation,
  analysis, type Analysis, type InsertAnalysis,
  logs, type Log, type InsertLog, type LogEntry,
  badges, type Badge, type InsertBadge,
  userBadges, type UserBadge, type InsertUserBadge,
  properties, propertySales, neighborhoods,
  type BadgeWithProgress,
  LogLevel, LogCategory, BadgeType, BadgeLevel,
  type Message,
  type FeedbackItem,
  insertPropertySchema, insertPropertySaleSchema, insertNeighborhoodSchema
} from "../shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, like, gte, lte, desc, asc, inArray, isNull, sql } from "drizzle-orm";
import { testDatabaseConnection } from "./db";

// Define types for new schemas
type InsertProperty = z.infer<typeof insertPropertySchema>;
type InsertPropertySale = z.infer<typeof insertPropertySaleSchema>;
type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;

// Complete storage interface with all CRUD methods needed
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(user: User): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(project: Project): Promise<Project>;
  
  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationByProjectId(projectId: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(conversation: Conversation): Promise<Conversation>;
  
  // Analysis methods
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysisByProjectId(projectId: number): Promise<Analysis | undefined>;
  saveAnalysis(analysis: Partial<Analysis> & { projectId: number }): Promise<Analysis>;
  updateAnalysis(analysis: Analysis): Promise<Analysis>;
  
  // Feedback methods
  getFeedback(): Promise<FeedbackItem[]>;
  saveFeedback(feedback: { message: string; timestamp: string }): Promise<FeedbackItem>;
  updateFeedbackStatus(id: number, resolved: boolean): Promise<FeedbackItem>;
  
  // Badge methods
  getBadges(): Promise<Badge[]>;
  getBadgeById(id: number): Promise<Badge | undefined>;
  getBadgesByType(type: BadgeType): Promise<Badge[]>;
  getBadgesByLevel(level: BadgeLevel): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(badge: Badge): Promise<Badge>;
  
  // User Badge methods
  getUserBadges(userId: number): Promise<UserBadge[]>;
  getUserBadgesByProject(userId: number, projectId: number): Promise<UserBadge[]>;
  awardBadgeToUser(userBadge: InsertUserBadge): Promise<UserBadge>;
  updateUserBadgeProgress(id: number, progress: number, metadata?: Record<string, any>): Promise<UserBadge>;
  getUserBadgesWithDetails(userId: number): Promise<BadgeWithProgress[]>;
  
  // Logging methods
  getLogs(options?: {
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
  }): Promise<LogEntry[]>;
  createLog(log: InsertLog): Promise<Log>;
  getLogById(id: number): Promise<Log | undefined>;
  getLogsByCategory(category: LogCategory): Promise<Log[]>;
  getLogStats(): Promise<{ 
    totalCount: number; 
    countByLevel: Record<LogLevel, number>;
    countByCategory: Record<LogCategory, number>;
    recentErrors: Log[];
    performanceAverage: number | null;
  }>;
  deleteLogById(id: number): Promise<boolean>;
  clearLogs(options?: { 
    olderThan?: Date; 
    level?: LogLevel;
    category?: LogCategory;
  }): Promise<number>;
  deleteLogs(olderThan: Date): Promise<number>;
}

// Database-backed implementation of the storage interface
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(user: User): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        username: user.username,
        password: user.password,
        email: user.email
      })
      .where(eq(users.id, user.id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(project: Project): Promise<Project> {
    const [updated] = await db
      .update(projects)
      .set({
        name: project.name,
        description: project.description,
        type: project.type,
        targetPlatform: project.targetPlatform,
        technologyStack: project.technologyStack,
        status: project.status,
        overview: project.overview,
        progress: project.progress,
        updatedAt: new Date()
      })
      .where(eq(projects.id, project.id))
      .returning();
    return updated;
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationByProjectId(projectId: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.projectId, projectId));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(conversation: Conversation): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({
        messages: conversation.messages,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, conversation.id))
      .returning();
    return updated;
  }

  // Analysis methods
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysisResult] = await db.select().from(analysis).where(eq(analysis.id, id));
    return analysisResult || undefined;
  }

  async getAnalysisByProjectId(projectId: number): Promise<Analysis | undefined> {
    const [analysisResult] = await db
      .select()
      .from(analysis)
      .where(eq(analysis.projectId, projectId));
    return analysisResult || undefined;
  }

  async saveAnalysis(analysisInput: Partial<Analysis> & { projectId: number }): Promise<Analysis> {
    // Check if analysis already exists for this project
    const existing = await this.getAnalysisByProjectId(analysisInput.projectId);
    
    if (existing) {
      // Update existing analysis
      const [updated] = await db
        .update(analysis)
        .set({
          identifiedRequirements: analysisInput.identifiedRequirements || existing.identifiedRequirements,
          suggestedTechStack: analysisInput.suggestedTechStack || existing.suggestedTechStack,
          missingInformation: analysisInput.missingInformation || existing.missingInformation,
          nextSteps: analysisInput.nextSteps || existing.nextSteps,
          updatedAt: new Date()
        })
        .where(eq(analysis.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new analysis
      const [newAnalysis] = await db
        .insert(analysis)
        .values({
          projectId: analysisInput.projectId,
          identifiedRequirements: analysisInput.identifiedRequirements || [],
          suggestedTechStack: analysisInput.suggestedTechStack || {},
          missingInformation: analysisInput.missingInformation || [],
          nextSteps: analysisInput.nextSteps || []
        })
        .returning();
      return newAnalysis;
    }
  }

  async updateAnalysis(analysisData: Analysis): Promise<Analysis> {
    const [updated] = await db
      .update(analysis)
      .set({
        identifiedRequirements: analysisData.identifiedRequirements,
        suggestedTechStack: analysisData.suggestedTechStack,
        missingInformation: analysisData.missingInformation,
        nextSteps: analysisData.nextSteps,
        updatedAt: new Date()
      })
      .where(eq(analysis.id, analysisData.id))
      .returning();
    return updated;
  }

  // Feedback methods - temporary memory implementation until feedback table is added
  private feedbackItems: Map<number, FeedbackItem> = new Map();
  private currentFeedbackId: number = 1;

  async getFeedback(): Promise<FeedbackItem[]> {
    return Array.from(this.feedbackItems.values());
  }

  async saveFeedback(feedback: { message: string; timestamp: string }): Promise<FeedbackItem> {
    const id = this.currentFeedbackId++;
    const feedbackItem: FeedbackItem = {
      id,
      message: feedback.message,
      timestamp: feedback.timestamp,
      resolved: false
    };
    this.feedbackItems.set(id, feedbackItem);
    return feedbackItem;
  }

  async updateFeedbackStatus(id: number, resolved: boolean): Promise<FeedbackItem> {
    const feedback = this.feedbackItems.get(id);
    if (!feedback) {
      throw new Error(`Feedback with id ${id} not found`);
    }
    
    const updatedFeedback: FeedbackItem = {
      ...feedback,
      resolved
    };
    this.feedbackItems.set(id, updatedFeedback);
    return updatedFeedback;
  }

  // Badge methods
  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getBadgeById(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge || undefined;
  }

  async getBadgesByType(type: BadgeType): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.type, type.toString()));
  }

  async getBadgesByLevel(level: BadgeLevel): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.level, level.toString()));
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const [badge] = await db
      .insert(badges)
      .values(insertBadge)
      .returning();
    return badge;
  }

  async updateBadge(badge: Badge): Promise<Badge> {
    const [updated] = await db
      .update(badges)
      .set({
        name: badge.name,
        description: badge.description,
        type: badge.type,
        level: badge.level,
        criteria: badge.criteria,
        icon: badge.icon,
        color: badge.color,
        updatedAt: new Date()
      })
      .where(eq(badges.id, badge.id))
      .returning();
    return updated;
  }

  // User Badge methods
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
  }

  async getUserBadgesByProject(userId: number, projectId: number): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(and(
        eq(userBadges.userId, userId),
        eq(userBadges.projectId, projectId)
      ));
  }

  async awardBadgeToUser(userBadge: InsertUserBadge): Promise<UserBadge> {
    const [awarded] = await db
      .insert(userBadges)
      .values(userBadge)
      .returning();
    return awarded;
  }

  async updateUserBadgeProgress(id: number, progress: number, metadata?: Record<string, any>): Promise<UserBadge> {
    let updateData: any = { progress };
    
    if (metadata) {
      const userBadge = await db
        .select()
        .from(userBadges)
        .where(eq(userBadges.id, id))
        .then(res => res[0]);
      
      if (!userBadge) {
        throw new Error(`User badge with id ${id} not found`);
      }
      
      updateData.metadata = {
        ...userBadge.metadata,
        ...metadata
      };
    }
    
    const [updated] = await db
      .update(userBadges)
      .set(updateData)
      .where(eq(userBadges.id, id))
      .returning();
    
    return updated;
  }

  async getUserBadgesWithDetails(userId: number): Promise<BadgeWithProgress[]> {
    const userBadgesData = await this.getUserBadges(userId);
    const badgesWithProgress: BadgeWithProgress[] = [];
    
    for (const userBadge of userBadgesData) {
      const badge = await this.getBadgeById(userBadge.badgeId);
      
      if (badge) {
        const badgeWithProgress: BadgeWithProgress = {
          ...badge,
          progress: userBadge.progress,
          isUnlocked: userBadge.progress >= 100,
          metadata: userBadge.metadata,
          variant: this.getBadgeVariantByLevel(badge.level as BadgeLevel),
          tooltip: this.generateBadgeTooltip(badge, userBadge),
          unlockDate: userBadge.progress >= 100 ? userBadge.awardedAt.toLocaleDateString() : undefined
        };
        
        badgesWithProgress.push(badgeWithProgress);
      }
    }
    
    return badgesWithProgress;
  }

  private getBadgeVariantByLevel(level: BadgeLevel): string {
    switch (level) {
      case BadgeLevel.BRONZE:
        return "secondary";
      case BadgeLevel.SILVER:
        return "outline";
      case BadgeLevel.GOLD:
        return "default";
      case BadgeLevel.PLATINUM:
        return "destructive";
      default:
        return "default";
    }
  }

  private generateBadgeTooltip(badge: Badge, userBadge: UserBadge): string {
    const progress = userBadge.progress;
    const isUnlocked = progress >= 100;
    
    if (isUnlocked) {
      return `${badge.name}: ${badge.description} (Awarded: ${userBadge.awardedAt.toLocaleDateString()})`;
    } else {
      return `${badge.name}: ${badge.description} (Progress: ${progress}%)`;
    }
  }

  // Logging methods
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
  }): Promise<LogEntry[]> {
    let query = db.select().from(logs);
    
    if (options) {
      const conditions = [];
      
      if (options.level) {
        if (Array.isArray(options.level)) {
          conditions.push(inArray(logs.level, options.level));
        } else {
          conditions.push(eq(logs.level, options.level));
        }
      }
      
      if (options.category) {
        if (Array.isArray(options.category)) {
          conditions.push(inArray(logs.category, options.category));
        } else {
          conditions.push(eq(logs.category, options.category));
        }
      }
      
      if (options.startDate) {
        conditions.push(gte(logs.timestamp, options.startDate));
      }
      
      if (options.endDate) {
        conditions.push(lte(logs.timestamp, options.endDate));
      }
      
      if (options.projectId) {
        conditions.push(eq(logs.projectId, options.projectId));
      }
      
      if (options.userId) {
        conditions.push(eq(logs.userId, options.userId));
      }
      
      if (options.search) {
        conditions.push(like(logs.message, `%${options.search}%`));
      }
      
      if (conditions.length > 0) {
        if (conditions.length === 1) {
          query = query.where(conditions[0]);
        } else {
          let combinedCondition = and(...conditions);
          query = query.where(combinedCondition);
        }
      }
      
      if (options.sortBy) {
        if (options.sortOrder === 'asc') {
          query = query.orderBy(asc(logs[options.sortBy as keyof typeof logs] as any));
        } else {
          query = query.orderBy(desc(logs[options.sortBy as keyof typeof logs] as any));
        }
      } else {
        // Default sort by timestamp desc
        query = query.orderBy(desc(logs.timestamp));
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
    } else {
      // Default sort and limit if no options provided
      query = query.orderBy(desc(logs.timestamp)).limit(100);
    }
    
    const logEntries = await query;
    
    // Add UI-specific properties
    return logEntries.map(log => ({
      ...log,
      color: this.getColorForLogLevel(log.level as LogLevel),
      expanded: false,
      formatted: `[${log.timestamp.toLocaleString()}] ${log.level.toUpperCase()} [${log.category}]: ${log.message}`
    }));
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [created] = await db
      .insert(logs)
      .values(log)
      .returning();
    return created;
  }

  async getLogById(id: number): Promise<Log | undefined> {
    const [log] = await db.select().from(logs).where(eq(logs.id, id));
    return log || undefined;
  }

  async getLogsByCategory(category: LogCategory): Promise<Log[]> {
    return await db
      .select()
      .from(logs)
      .where(eq(logs.category, category))
      .orderBy(desc(logs.timestamp));
  }

  async getLogStats(): Promise<{ 
    totalCount: number; 
    countByLevel: Record<LogLevel, number>;
    countByCategory: Record<LogCategory, number>;
    recentErrors: Log[];
    performanceAverage: number | null;
  }> {
    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(logs);
    
    const totalCount = Number(countResult.count);
    
    // Get counts by log level
    const levelCounts = await db
      .select({
        level: logs.level,
        count: sql<number>`count(*)`
      })
      .from(logs)
      .groupBy(logs.level);
    
    const countByLevel = Object.values(LogLevel).reduce((acc, level) => {
      acc[level] = 0;
      return acc;
    }, {} as Record<LogLevel, number>);
    
    levelCounts.forEach(item => {
      countByLevel[item.level as LogLevel] = Number(item.count);
    });
    
    // Get counts by category
    const categoryCounts = await db
      .select({
        category: logs.category,
        count: sql<number>`count(*)`
      })
      .from(logs)
      .groupBy(logs.category);
    
    const countByCategory = Object.values(LogCategory).reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<LogCategory, number>);
    
    categoryCounts.forEach(item => {
      countByCategory[item.category as LogCategory] = Number(item.count);
    });
    
    // Get recent errors
    const recentErrors = await db
      .select()
      .from(logs)
      .where(inArray(logs.level, [LogLevel.ERROR, LogLevel.CRITICAL]))
      .orderBy(desc(logs.timestamp))
      .limit(5);
    
    // Calculate performance average from performance logs
    const [performanceAvgResult] = await db
      .select({
        average: sql<number>`avg(duration)`
      })
      .from(logs)
      .where(and(
        eq(logs.category, LogCategory.PERFORMANCE),
        sql`duration IS NOT NULL`
      ));
    
    const performanceAverage = performanceAvgResult.average !== null
      ? Number(performanceAvgResult.average)
      : null;
    
    return {
      totalCount,
      countByLevel,
      countByCategory,
      recentErrors,
      performanceAverage
    };
  }

  async deleteLogById(id: number): Promise<boolean> {
    const result = await db
      .delete(logs)
      .where(eq(logs.id, id))
      .returning();
    return result.length > 0;
  }

  async clearLogs(options?: { 
    olderThan?: Date; 
    level?: LogLevel;
    category?: LogCategory;
  }): Promise<number> {
    let query = db.delete(logs);
    
    if (options) {
      if (options.olderThan) {
        query = query.where(lte(logs.timestamp, options.olderThan));
      }
      
      if (options.level) {
        query = query.where(eq(logs.level, options.level));
      }
      
      if (options.category) {
        query = query.where(eq(logs.category, options.category));
      }
    }
    
    const result = await query.returning();
    return result.length;
  }

  async deleteLogs(olderThan: Date): Promise<number> {
    const result = await db
      .delete(logs)
      .where(lte(logs.timestamp, olderThan))
      .returning();
    return result.length;
  }

  private getColorForLogLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'text-blue-500';
      case LogLevel.INFO:
        return 'text-green-500';
      case LogLevel.WARNING:
        return 'text-amber-500';
      case LogLevel.ERROR:
        return 'text-red-500';
      case LogLevel.CRITICAL:
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  }
}

// Export the storage instance
export const storage = new DatabaseStorage();