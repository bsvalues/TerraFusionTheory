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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private conversations: Map<number, Conversation>;
  private analysisData: Map<number, Analysis>;
  private feedbackItems: Map<number, FeedbackItem>;
  private logsData: Map<number, Log>;
  private badgesData: Map<number, Badge>;
  private userBadgesData: Map<number, UserBadge>;
  
  private currentUserId: number;
  private currentProjectId: number;
  private currentConversationId: number;
  private currentAnalysisId: number;
  private currentFeedbackId: number;
  private currentLogId: number;
  private currentBadgeId: number;
  private currentUserBadgeId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.conversations = new Map();
    this.analysisData = new Map();
    this.feedbackItems = new Map();
    this.logsData = new Map();
    this.badgesData = new Map();
    this.userBadgesData = new Map();
    
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentConversationId = 1;
    this.currentAnalysisId = 1;
    this.currentFeedbackId = 1;
    this.currentLogId = 1;
    this.currentBadgeId = 1;
    this.currentUserBadgeId = 1;
    
    // Add a sample admin user
    const adminUser: User = {
      id: this.currentUserId,
      username: 'admin',
      password: 'admin123', // In a real app, this would be hashed
      email: 'admin@example.com'
    };
    this.users.set(this.currentUserId, adminUser);
    this.currentUserId++;
    
    // Initialize with sample project
    const sampleProject: Project = {
      id: this.currentProjectId,
      name: 'BS County Values Application',
      description: 'County Tax Assessment SaaS Application',
      type: 'County Tax Assessment SaaS Application',
      targetPlatform: 'Web Application (Responsive)',
      technologyStack: JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'AWS']),
      status: 'requirements_gathering',
      overview: 'A comprehensive SaaS solution for county tax assessors to manage property values, assessments, and taxpayer information. The system will provide tools for data management, reporting, and integration with existing county systems.',
      progress: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(this.currentProjectId, sampleProject);
    
    // Initialize with sample analysis
    const sampleAnalysis: Analysis = {
      id: this.currentAnalysisId,
      projectId: this.currentProjectId,
      identifiedRequirements: JSON.stringify([
        { name: 'Property data management', status: 'success' },
        { name: 'Regulatory compliance', status: 'success' },
        { name: 'Report generation', status: 'success' },
        { name: 'System integration', status: 'success' },
        { name: 'Authentication needs', status: 'warning' },
      ]),
      suggestedTechStack: JSON.stringify({
        frontend: { name: 'Frontend', description: 'React with Material UI' },
        backend: { name: 'Backend', description: 'Node.js with Express' },
        database: { name: 'Database', description: 'PostgreSQL with PostGIS' },
        hosting: { name: 'Hosting', description: 'AWS (Pending confirmation)' },
      }),
      missingInformation: JSON.stringify({
        items: [
          'Cloud hosting preferences',
          'Authentication requirements',
          'Data backup needs',
          'Mobile access requirements',
        ],
      }),
      nextSteps: JSON.stringify([
        { order: 1, description: 'Complete requirements gathering' },
        { order: 2, description: 'Finalize system architecture' },
        { order: 3, description: 'Define data models and relationships' },
        { order: 4, description: 'Create development plan and timeline' },
      ]),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.analysisData.set(this.currentAnalysisId, sampleAnalysis);
    
    // Initialize with sample conversation
    const sampleConversation: Conversation = {
      id: this.currentConversationId,
      projectId: this.currentProjectId,
      messages: JSON.stringify([
        {
          role: 'user',
          content: 'Hello BS, I need help with a county tax assessment application.',
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: 'Hi there! I\'d be happy to help you with your county tax assessment application. To get started, could you tell me more about the specific requirements and features you\'re looking for in this application?',
          timestamp: new Date().toISOString()
        }
      ]),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.set(this.currentConversationId, sampleConversation);
    
    // Initialize with sample feedback data
    const sampleFeedback: FeedbackItem = {
      id: this.currentFeedbackId,
      message: 'The AI agent sometimes misinterprets complex requirements.',
      timestamp: new Date().toISOString(),
      resolved: false
    };
    this.feedbackItems.set(this.currentFeedbackId, sampleFeedback);
    this.currentFeedbackId++;
    
    // Initialize with sample logs
    const sampleLogs: Log[] = [
      {
        id: this.currentLogId++,
        timestamp: new Date(),
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: 'Application started successfully',
        details: JSON.stringify({ version: '1.0.0', environment: 'development' }),
        source: 'server/index.ts'
      },
      {
        id: this.currentLogId++,
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        level: LogLevel.INFO,
        category: LogCategory.USER,
        message: 'User logged in',
        details: JSON.stringify({ userId: 1, username: 'admin' }),
        source: 'server/controllers/auth.controller.ts'
      },
      {
        id: this.currentLogId++,
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
        level: LogLevel.ERROR,
        category: LogCategory.API,
        message: 'API request failed',
        details: JSON.stringify({ endpoint: '/api/data', status: 500, error: 'Internal Server Error' }),
        source: 'server/routes.ts',
        endpoint: '/api/data',
        statusCode: 500
      },
      {
        id: this.currentLogId++,
        timestamp: new Date(Date.now() - 180000), // 3 minutes ago
        level: LogLevel.WARNING,
        category: LogCategory.DATABASE,
        message: 'Database query exceeded time threshold',
        details: JSON.stringify({ query: 'SELECT * FROM projects', duration: 3500 }),
        source: 'server/storage.ts',
        duration: 3500
      },
      {
        id: this.currentLogId++,
        timestamp: new Date(Date.now() - 240000), // 4 minutes ago
        level: LogLevel.DEBUG,
        category: LogCategory.PERFORMANCE,
        message: 'API performance metrics',
        details: JSON.stringify({ route: '/api/projects', avgResponseTime: 120 }),
        source: 'server/middleware/performance.middleware.ts',
        duration: 120
      },
      {
        id: this.currentLogId++,
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        level: LogLevel.INFO,
        category: LogCategory.AI,
        message: 'AI model inference completed',
        details: JSON.stringify({ modelId: 'gpt-4', promptTokens: 500, completionTokens: 350 }),
        source: 'server/services/openai.service.ts',
        duration: 2340
      }
    ];
    
    // Add sample logs to the map
    for (const log of sampleLogs) {
      this.logsData.set(log.id, log);
    }
    
    // Initialize with sample badges
    const sampleBadges: Badge[] = [
      {
        id: this.currentBadgeId++,
        name: 'Property Data Analyst',
        description: 'Successfully analyzed property data from multiple sources',
        type: BadgeType.EFFICIENCY,
        level: BadgeLevel.BRONZE,
        criteria: {},
        icon: 'chart-bar',
        color: '#CD7F32', // Bronze color
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentBadgeId++,
        name: 'Market Insight Pioneer',
        description: 'Discovered meaningful market trends through data analysis',
        type: BadgeType.ACCURACY, 
        level: BadgeLevel.SILVER,
        criteria: {},
        icon: 'trending-up',
        color: '#C0C0C0', // Silver color
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentBadgeId++,
        name: 'GIS Explorer',
        description: 'Used spatial analysis tools to uncover property relationships',
        type: BadgeType.INNOVATION,
        level: BadgeLevel.GOLD,
        criteria: {},
        icon: 'map',
        color: '#FFD700', // Gold color
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentBadgeId++,
        name: 'Prediction Master',
        description: 'Made accurate predictions about future market conditions',
        type: BadgeType.ACCURACY,
        level: BadgeLevel.PLATINUM,
        criteria: {},
        icon: 'sparkles',
        color: '#E5E4E2', // Platinum color
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.currentBadgeId++,
        name: 'Conversation Expert',
        description: 'Engaged in meaningful AI conversation to enhance project understanding',
        type: BadgeType.COLLABORATION,
        level: BadgeLevel.BRONZE,
        criteria: {},
        icon: 'message-circle',
        color: '#CD7F32', // Bronze color
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add sample badges to the map
    for (const badge of sampleBadges) {
      this.badgesData.set(badge.id, badge);
    }
    
    // Initialize with sample user badges (progress tracking)
    const sampleUserBadges: UserBadge[] = [
      {
        id: this.currentUserBadgeId++,
        userId: 1,
        badgeId: 1,
        projectId: 1,
        progress: 60,
        awardedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        metadata: {}
      },
      {
        id: this.currentUserBadgeId++,
        userId: 1,
        badgeId: 5,
        projectId: 1,
        progress: 100, // Completed
        awardedAt: new Date(Date.now() - 86400000), // 1 day ago
        metadata: {}
      }
    ];
    
    // Add sample user badges to the map
    for (const userBadge of sampleUserBadges) {
      this.userBadgesData.set(userBadge.id, userBadge);
    }
    

  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(user: User): Promise<User> {
    // Get existing user to ensure it exists
    const existingUser = await this.getUser(user.id);
    
    if (!existingUser) {
      throw new Error(`User with ID ${user.id} not found`);
    }
    
    // Update the user
    this.users.set(user.id, user);
    return user;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Get existing user to ensure it exists
    const existingUser = await this.getUser(id);
    
    if (!existingUser) {
      return false;
    }
    
    // Delete the user
    return this.users.delete(id);
  }
  
  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { 
      ...insertProject, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(id, project);
    return project;
  }
  
  async updateProject(project: Project): Promise<Project> {
    const updatedProject = { 
      ...project, 
      updatedAt: new Date() 
    };
    this.projects.set(project.id, updatedProject);
    return updatedProject;
  }
  
  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async getConversationByProjectId(projectId: number): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values()).find(
      (conversation) => conversation.projectId === projectId
    );
  }
  
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = { 
      ...insertConversation, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.set(id, conversation);
    return conversation;
  }
  
  async updateConversation(conversation: Conversation): Promise<Conversation> {
    const updatedConversation = { 
      ...conversation, 
      updatedAt: new Date() 
    };
    this.conversations.set(conversation.id, updatedConversation);
    return updatedConversation;
  }
  
  // Analysis methods
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analysisData.get(id);
  }
  
  async getAnalysisByProjectId(projectId: number): Promise<Analysis | undefined> {
    return Array.from(this.analysisData.values()).find(
      (analysis) => analysis.projectId === projectId
    );
  }
  
  async saveAnalysis(analysisInput: Partial<Analysis> & { projectId: number }): Promise<Analysis> {
    // Check if analysis for this project already exists
    const existingAnalysis = await this.getAnalysisByProjectId(analysisInput.projectId);
    
    if (existingAnalysis) {
      // Update existing analysis
      const updatedAnalysis: Analysis = {
        ...existingAnalysis,
        ...analysisInput,
        updatedAt: new Date()
      };
      this.analysisData.set(existingAnalysis.id, updatedAnalysis);
      return updatedAnalysis;
    } else {
      // Create new analysis
      const id = this.currentAnalysisId++;
      const analysis: Analysis = {
        id,
        projectId: analysisInput.projectId,
        identifiedRequirements: analysisInput.identifiedRequirements || JSON.stringify([]),
        suggestedTechStack: analysisInput.suggestedTechStack || JSON.stringify({}),
        missingInformation: analysisInput.missingInformation || JSON.stringify({ items: [] }),
        nextSteps: analysisInput.nextSteps || JSON.stringify([]),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.analysisData.set(id, analysis);
      return analysis;
    }
  }
  
  async updateAnalysis(analysis: Analysis): Promise<Analysis> {
    const updatedAnalysis = { 
      ...analysis, 
      updatedAt: new Date() 
    };
    this.analysisData.set(analysis.id, updatedAnalysis);
    return updatedAnalysis;
  }

  // Feedback methods
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
    const feedbackItem = this.feedbackItems.get(id);
    if (!feedbackItem) {
      throw new Error(`Feedback with id ${id} not found`);
    }
    
    const updatedFeedback: FeedbackItem = {
      ...feedbackItem,
      resolved
    };
    this.feedbackItems.set(id, updatedFeedback);
    return updatedFeedback;
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
    let logs = Array.from(this.logsData.values());
    
    // Apply filters
    if (options) {
      // Filter by level
      if (options.level) {
        const levels = Array.isArray(options.level) ? options.level : [options.level];
        logs = logs.filter(log => levels.includes(log.level as LogLevel));
      }
      
      // Filter by category
      if (options.category) {
        const categories = Array.isArray(options.category) ? options.category : [options.category];
        logs = logs.filter(log => categories.includes(log.category as LogCategory));
      }
      
      // Filter by date range
      if (options.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= options.startDate!);
      }
      if (options.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= options.endDate!);
      }
      
      // Filter by projectId
      if (options.projectId !== undefined) {
        logs = logs.filter(log => log.projectId === options.projectId);
      }
      
      // Filter by userId
      if (options.userId !== undefined) {
        logs = logs.filter(log => log.userId === options.userId);
      }
      
      // Filter by search text
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        logs = logs.filter(log => 
          log.message.toLowerCase().includes(searchLower) || 
          (log.source && log.source.toLowerCase().includes(searchLower)) ||
          (log.endpoint && log.endpoint.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply sorting
      if (options.sortBy) {
        const sortField = options.sortBy as keyof Log;
        const sortOrder = options.sortOrder === 'desc' ? -1 : 1;
        logs.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortOrder;
          if (a[sortField] > b[sortField]) return 1 * sortOrder;
          return 0;
        });
      } else {
        // Default sort by timestamp (newest first)
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      
      // Apply pagination
      if (options.offset !== undefined) {
        logs = logs.slice(options.offset);
      }
      if (options.limit !== undefined) {
        logs = logs.slice(0, options.limit);
      }
    }
    
    // Convert to LogEntry type with UI-specific properties
    return logs.map(log => ({
      ...log,
      // Add formatting based on level
      color: this.getColorForLogLevel(log.level as LogLevel),
      expanded: false
    }));
  }
  
  async createLog(log: InsertLog): Promise<Log> {
    const id = this.currentLogId++;
    const newLog: Log = {
      ...log,
      id,
      timestamp: log.timestamp || new Date()
    };
    this.logsData.set(id, newLog);
    return newLog;
  }
  
  async getLogById(id: number): Promise<Log | undefined> {
    return this.logsData.get(id);
  }
  
  async getLogsByCategory(category: LogCategory): Promise<Log[]> {
    return Array.from(this.logsData.values())
      .filter(log => log.category === category)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  async getLogStats(): Promise<{ 
    totalCount: number; 
    countByLevel: Record<LogLevel, number>;
    countByCategory: Record<LogCategory, number>;
    recentErrors: Log[];
    performanceAverage: number | null;
  }> {
    const logs = Array.from(this.logsData.values());
    
    // Initialize counts
    const countByLevel: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARNING]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.CRITICAL]: 0
    };
    
    const countByCategory: Record<LogCategory, number> = {
      [LogCategory.SYSTEM]: 0,
      [LogCategory.USER]: 0,
      [LogCategory.API]: 0,
      [LogCategory.DATABASE]: 0,
      [LogCategory.SECURITY]: 0,
      [LogCategory.PERFORMANCE]: 0,
      [LogCategory.AI]: 0
    };
    
    // Count logs by level and category
    for (const log of logs) {
      if (log.level in countByLevel) {
        countByLevel[log.level as LogLevel]++;
      }
      
      if (log.category in countByCategory) {
        countByCategory[log.category as LogCategory]++;
      }
    }
    
    // Get recent errors
    const recentErrors = logs
      .filter(log => log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
    
    // Calculate performance average (if performance logs exist)
    const performanceLogs = logs.filter(log => log.category === LogCategory.PERFORMANCE && log.duration);
    const performanceAverage = performanceLogs.length > 0
      ? performanceLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / performanceLogs.length
      : null;
    
    return {
      totalCount: logs.length,
      countByLevel,
      countByCategory,
      recentErrors,
      performanceAverage
    };
  }
  
  async deleteLogById(id: number): Promise<boolean> {
    const exists = this.logsData.has(id);
    if (exists) {
      this.logsData.delete(id);
      return true;
    }
    return false;
  }
  
  async clearLogs(options?: { 
    olderThan?: Date; 
    level?: LogLevel;
    category?: LogCategory;
  }): Promise<number> {
    const logs = Array.from(this.logsData.entries());
    let deletedCount = 0;
    
    for (const [id, log] of logs) {
      let shouldDelete = true;
      
      if (options) {
        // Keep if not older than the specified date
        if (options.olderThan && new Date(log.timestamp) > options.olderThan) {
          shouldDelete = false;
        }
        
        // Keep if not of the specified level
        if (options.level && log.level !== options.level) {
          shouldDelete = false;
        }
        
        // Keep if not of the specified category
        if (options.category && log.category !== options.category) {
          shouldDelete = false;
        }
      }
      
      if (shouldDelete) {
        this.logsData.delete(id);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
  
  // Helper function to determine color based on log level
  private getColorForLogLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '#6c757d'; // Gray
      case LogLevel.INFO:
        return '#0d6efd'; // Blue
      case LogLevel.WARNING:
        return '#ffc107'; // Yellow
      case LogLevel.ERROR:
        return '#dc3545'; // Red
      case LogLevel.CRITICAL:
        return '#721c24'; // Dark Red
      default:
        return '#6c757d'; // Default Gray
    }
  }
  
  // Badge methods
  async getBadges(): Promise<Badge[]> {
    return Array.from(this.badgesData.values());
  }
  
  async getBadgeById(id: number): Promise<Badge | undefined> {
    return this.badgesData.get(id);
  }
  
  async getBadgesByType(type: BadgeType): Promise<Badge[]> {
    return Array.from(this.badgesData.values())
      .filter(badge => badge.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getBadgesByLevel(level: BadgeLevel): Promise<Badge[]> {
    return Array.from(this.badgesData.values())
      .filter(badge => badge.level === level)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async createBadge(badge: InsertBadge): Promise<Badge> {
    const id = this.currentBadgeId++;
    const newBadge: Badge = {
      ...badge,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.badgesData.set(id, newBadge);
    return newBadge;
  }
  
  async updateBadge(badge: Badge): Promise<Badge> {
    const updatedBadge = {
      ...badge,
      updatedAt: new Date()
    };
    this.badgesData.set(badge.id, updatedBadge);
    return updatedBadge;
  }
  
  // User Badge methods
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return Array.from(this.userBadgesData.values())
      .filter(userBadge => userBadge.userId === userId)
      .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
  }
  
  async getUserBadgesByProject(userId: number, projectId: number): Promise<UserBadge[]> {
    return Array.from(this.userBadgesData.values())
      .filter(userBadge => userBadge.userId === userId && userBadge.projectId === projectId)
      .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
  }
  
  async awardBadgeToUser(userBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.currentUserBadgeId++;
    const newUserBadge: UserBadge = {
      ...userBadge,
      id,
      awardedAt: new Date(),
      progress: userBadge.progress || 0,
    };
    this.userBadgesData.set(id, newUserBadge);
    return newUserBadge;
  }
  
  async updateUserBadgeProgress(id: number, progress: number, metadata?: Record<string, any>): Promise<UserBadge> {
    const userBadge = this.userBadgesData.get(id);
    if (!userBadge) {
      throw new Error(`User badge with id ${id} not found`);
    }
    
    const updatedUserBadge: UserBadge = {
      ...userBadge,
      progress,
      metadata: metadata || userBadge.metadata
    };
    this.userBadgesData.set(id, updatedUserBadge);
    return updatedUserBadge;
  }
  
  async getUserBadgesWithDetails(userId: number): Promise<BadgeWithProgress[]> {
    const userBadges = await this.getUserBadges(userId);
    const result: BadgeWithProgress[] = [];
    
    for (const userBadge of userBadges) {
      const badge = await this.getBadgeById(userBadge.badgeId);
      if (badge) {
        // Create BadgeWithProgress by combining badge and user progress information
        const badgeWithProgress: BadgeWithProgress = {
          ...badge,
          progress: userBadge.progress,
          isUnlocked: userBadge.progress >= 100,
          metadata: userBadge.metadata ? 
            (typeof userBadge.metadata === 'string' ? 
              JSON.parse(userBadge.metadata) : 
              userBadge.metadata) : 
            {},
          unlockDate: userBadge.progress >= 100 ? new Date(userBadge.awardedAt).toLocaleDateString() : undefined,
          isNew: (new Date().getTime() - new Date(userBadge.awardedAt).getTime()) < (24 * 60 * 60 * 1000), // Is less than 24 hours old
          variant: this.getBadgeVariantByLevel(badge.level as BadgeLevel),
          tooltip: this.generateBadgeTooltip(badge, userBadge)
        };
        result.push(badgeWithProgress);
      }
    }
    
    return result;
  }
  
  // Helper to get badge UI variant based on level
  private getBadgeVariantByLevel(level: BadgeLevel): string {
    switch (level) {
      case BadgeLevel.BRONZE:
        return 'warning';
      case BadgeLevel.SILVER:
        return 'secondary';
      case BadgeLevel.GOLD:
        return 'success';
      case BadgeLevel.PLATINUM:
        return 'purple';
      default:
        return 'default';
    }
  }
  
  // Helper to generate badge tooltip text
  private generateBadgeTooltip(badge: Badge, userBadge: UserBadge): string {
    if (userBadge.progress >= 100) {
      return `${badge.description} (Awarded: ${new Date(userBadge.awardedAt).toLocaleDateString()})`;
    } else {
      return `${badge.description} (Progress: ${userBadge.progress}%)`;
    }
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(user: User): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, user.id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(project: Project): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set(project)
      .where(eq(projects.id, project.id))
      .returning();
    return updatedProject;
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationByProjectId(projectId: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.projectId, projectId));
    return conversation;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(conversation: Conversation): Promise<Conversation> {
    const [updatedConversation] = await db
      .update(conversations)
      .set(conversation)
      .where(eq(conversations.id, conversation.id))
      .returning();
    return updatedConversation;
  }

  // Analysis methods
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysisData] = await db.select().from(analysis).where(eq(analysis.id, id));
    return analysisData;
  }

  async getAnalysisByProjectId(projectId: number): Promise<Analysis | undefined> {
    const [analysisData] = await db
      .select()
      .from(analysis)
      .where(eq(analysis.projectId, projectId));
    return analysisData;
  }

  async saveAnalysis(analysisInput: Partial<Analysis> & { projectId: number }): Promise<Analysis> {
    // Check if there's an existing analysis for this project
    const existing = await this.getAnalysisByProjectId(analysisInput.projectId);
    
    if (existing) {
      // Update existing analysis
      const [updatedAnalysis] = await db
        .update(analysis)
        .set({ ...analysisInput, updatedAt: new Date() })
        .where(eq(analysis.id, existing.id))
        .returning();
      return updatedAnalysis;
    } else {
      // Create new analysis
      const [newAnalysis] = await db
        .insert(analysis)
        .values({
          ...analysisInput as any,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newAnalysis;
    }
  }

  async updateAnalysis(analysisData: Analysis): Promise<Analysis> {
    const [updatedAnalysis] = await db
      .update(analysis)
      .set({ ...analysisData, updatedAt: new Date() })
      .where(eq(analysis.id, analysisData.id))
      .returning();
    return updatedAnalysis;
  }

  // Feedback methods (currently implemented in memory - will be added to DB in future)
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
    return badge;
  }

  async getBadgesByType(type: BadgeType): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.type, type));
  }

  async getBadgesByLevel(level: BadgeLevel): Promise<Badge[]> {
    return await db.select().from(badges).where(eq(badges.level, level));
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const [badge] = await db.insert(badges).values(insertBadge).returning();
    return badge;
  }

  async updateBadge(badge: Badge): Promise<Badge> {
    const [updatedBadge] = await db
      .update(badges)
      .set(badge)
      .where(eq(badges.id, badge.id))
      .returning();
    return updatedBadge;
  }

  // User Badge methods
  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return await db.select().from(userBadges).where(eq(userBadges.userId, userId));
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
    const [newUserBadge] = await db
      .insert(userBadges)
      .values({
        ...userBadge,
        awardedAt: new Date()
      })
      .returning();
    return newUserBadge;
  }

  async updateUserBadgeProgress(id: number, progress: number, metadata?: Record<string, any>): Promise<UserBadge> {
    let updateValues: Partial<UserBadge> = { progress };
    if (metadata) {
      updateValues.metadata = metadata;
    }

    const [updatedUserBadge] = await db
      .update(userBadges)
      .set(updateValues)
      .where(eq(userBadges.id, id))
      .returning();
    return updatedUserBadge;
  }

  async getUserBadgesWithDetails(userId: number): Promise<BadgeWithProgress[]> {
    const userBadgesData = await this.getUserBadges(userId);
    const badgesData = await this.getBadges();
    
    const badgeMap = new Map(badgesData.map(b => [b.id, b]));
    
    return userBadgesData.map(userBadge => {
      const badge = badgeMap.get(userBadge.badgeId);
      if (!badge) {
        throw new Error(`Badge with id ${userBadge.badgeId} not found`);
      }
      
      const badgeWithProgress: BadgeWithProgress = {
        ...badge,
        progress: userBadge.progress || 0,
        isUnlocked: (userBadge.progress || 0) >= 100,
        metadata: userBadge.metadata || {},
        variant: this.getBadgeVariantByLevel(badge.level as BadgeLevel),
        tooltip: this.generateBadgeTooltip(badge, userBadge),
        unlockDate: userBadge.progress === 100 ? userBadge.awardedAt.toISOString() : undefined
      };
      
      return badgeWithProgress;
    });
  }

  private getBadgeVariantByLevel(level: BadgeLevel): string {
    switch (level) {
      case BadgeLevel.BRONZE: return 'default';
      case BadgeLevel.SILVER: return 'secondary';
      case BadgeLevel.GOLD: return 'warning';
      case BadgeLevel.PLATINUM: return 'success';
      default: return 'default';
    }
  }
  
  private generateBadgeTooltip(badge: Badge, userBadge: UserBadge): string {
    let tooltip = `${badge.name}: ${badge.description}`;
    
    if (userBadge.progress >= 100) {
      const unlockDate = new Date(userBadge.awardedAt).toLocaleDateString();
      tooltip += `\nUnlocked on ${unlockDate}`;
    } else {
      tooltip += `\nProgress: ${userBadge.progress}%`;
    }
    
    return tooltip;
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
      if (options.level) {
        const levels = Array.isArray(options.level) ? options.level : [options.level];
        query = query.where(inArray(logs.level, levels));
      }
      
      if (options.category) {
        const categories = Array.isArray(options.category) ? options.category : [options.category];
        query = query.where(inArray(logs.category, categories));
      }
      
      if (options.startDate) {
        query = query.where(gte(logs.timestamp, options.startDate));
      }
      
      if (options.endDate) {
        query = query.where(lte(logs.timestamp, options.endDate));
      }
      
      if (options.projectId) {
        query = query.where(eq(logs.projectId, options.projectId));
      }
      
      if (options.userId) {
        query = query.where(eq(logs.userId, options.userId));
      }
      
      if (options.search) {
        query = query.where(like(logs.message, `%${options.search}%`));
      }
      
      if (options.sortBy) {
        const orderFunc = options.sortOrder === 'asc' ? asc : desc;
        // Apply dynamic sorting based on the column name
        if (options.sortBy === 'timestamp') {
          query = query.orderBy(orderFunc(logs.timestamp));
        } else if (options.sortBy === 'level') {
          query = query.orderBy(orderFunc(logs.level));
        } else if (options.sortBy === 'category') {
          query = query.orderBy(orderFunc(logs.category));
        } else {
          // Default to timestamp
          query = query.orderBy(orderFunc(logs.timestamp));
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
      // Default ordering
      query = query.orderBy(desc(logs.timestamp));
    }
    
    const rawLogs = await query;
    
    // Enhance logs with UI-specific properties
    return rawLogs.map(log => ({
      ...log,
      color: this.getColorForLogLevel(log.level as LogLevel),
      formatted: `[${log.timestamp.toISOString()}] [${log.level}] [${log.category}] ${log.message}`,
      expanded: false
    }));
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [newLog] = await db
      .insert(logs)
      .values(log)
      .returning();
    return newLog;
  }

  async getLogById(id: number): Promise<Log | undefined> {
    const [log] = await db.select().from(logs).where(eq(logs.id, id));
    return log;
  }

  async getLogsByCategory(category: LogCategory): Promise<Log[]> {
    return await db.select().from(logs).where(eq(logs.category, category));
  }

  async getLogStats(): Promise<{ 
    totalCount: number; 
    countByLevel: Record<LogLevel, number>;
    countByCategory: Record<LogCategory, number>;
    recentErrors: Log[];
    performanceAverage: number | null;
  }> {
    // Get total count
    const [countResult] = await db.select({ count: sql`count(*)` }).from(logs);
    const totalCount = Number(countResult.count);
    
    // Get counts by level
    const levelCounts = await db
      .select({
        level: logs.level,
        count: sql`count(*)`
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
        count: sql`count(*)`
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
    
    // Get performance average
    const [performanceResult] = await db
      .select({
        average: sql`avg(duration)`
      })
      .from(logs)
      .where(and(
        eq(logs.category, LogCategory.PERFORMANCE),
        sql`duration is not null`
      ));
    
    const performanceAverage = performanceResult.average ? Number(performanceResult.average) : null;
    
    return {
      totalCount,
      countByLevel,
      countByCategory,
      recentErrors,
      performanceAverage
    };
  }

  async deleteLogById(id: number): Promise<boolean> {
    const result = await db.delete(logs).where(eq(logs.id, id));
    return result.rowCount > 0;
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
    
    const result = await query;
    return result.rowCount;
  }

  private getColorForLogLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '#9ca3af'; // Gray
      case LogLevel.INFO: return '#3b82f6';  // Blue
      case LogLevel.WARNING: return '#f59e0b'; // Amber
      case LogLevel.ERROR: return '#ef4444';  // Red
      case LogLevel.CRITICAL: return '#7f1d1d'; // Dark red
      default: return '#000000';
    }
  }
}

// Use database storage
export const storage = new DatabaseStorage();