import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  conversations, type Conversation, type InsertConversation,
  analysis, type Analysis, type InsertAnalysis,
  type Message,
  type FeedbackItem
} from "@shared/schema";

// Complete storage interface with all CRUD methods needed
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private conversations: Map<number, Conversation>;
  private analysisData: Map<number, Analysis>;
  private feedbackItems: Map<number, FeedbackItem>;
  
  private currentUserId: number;
  private currentProjectId: number;
  private currentConversationId: number;
  private currentAnalysisId: number;
  private currentFeedbackId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.conversations = new Map();
    this.analysisData = new Map();
    this.feedbackItems = new Map();
    
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentConversationId = 1;
    this.currentAnalysisId = 1;
    this.currentFeedbackId = 1;
    
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();