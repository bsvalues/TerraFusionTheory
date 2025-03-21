/**
 * Agent Interface Definitions
 * 
 * This file defines the core interfaces, types, and enums used for agents
 * within the IntelligentEstate agent system.
 */

import { EventEmitter } from 'events';

/**
 * Agent capabilities define what an agent can do
 */
export enum AgentCapability {
  // Basic capabilities
  TEXT_GENERATION = 'text_generation',
  TEXT_UNDERSTANDING = 'text_understanding',
  CODE_GENERATION = 'code_generation',
  CODE_UNDERSTANDING = 'code_understanding',
  
  // Domain capabilities
  REAL_ESTATE_ANALYSIS = 'real_estate_analysis',
  MARKET_PREDICTION = 'market_prediction',
  GIS_DATA_PROCESSING = 'gis_data_processing',
  DOCUMENT_ANALYSIS = 'document_analysis',
  
  // Advanced capabilities
  PLANNING = 'planning',
  REASONING = 'reasoning',
  MEMORY_MANAGEMENT = 'memory_management',
  MULTI_STEP_EXECUTION = 'multi_step_execution',
  MULTI_AGENT_COORDINATION = 'multi_agent_coordination',
  
  // Tool-related capabilities
  TOOL_USE = 'tool_use',
  TOOL_SELECTION = 'tool_selection',
  VECTOR_SEARCH = 'vector_search',
  DATA_VISUALIZATION = 'data_visualization'
}

/**
 * Agent status types
 */
export enum AgentStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  WORKING = 'working',
  PAUSED = 'paused',
  ERROR = 'error',
  TERMINATED = 'terminated'
}

/**
 * Agent state used in coordinator
 */
export enum AgentState {
  INITIALIZING = 'initializing',
  IDLE = 'idle',
  READY = 'ready',
  BUSY = 'busy',
  PAUSED = 'paused',
  ERROR = 'error',
  TERMINATED = 'terminated'
}

/**
 * Execution result from agent tasks
 */
export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: Error;
  metadata?: Record<string, any>;
  duration?: number;
}

/**
 * Agent configuration options
 */
export interface AgentConfig {
  id?: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  maxConcurrentTasks?: number;
  defaultTimeout?: number;
  autoRestart?: boolean;
  memory?: {
    useVectorMemory?: boolean;
    memoryConfig?: Record<string, any>;
  };
  tools?: string[]; // Tool names that the agent can use
  [key: string]: any; // Additional configuration options
}

/**
 * Agent task definition
 */
export interface AgentTask {
  id: string;
  type: string;
  description: string;
  inputs: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  priority: number; // 1-10, with 10 being highest
  startTime?: number;
  endTime?: number;
  result?: any;
  error?: string;
  parentTaskId?: string; // For subtasks
}

/**
 * Agent interface defining the core functionality all agents must implement
 */
export interface Agent extends EventEmitter {
  // Basic information
  getId(): string;
  getName(): string;
  getDescription(): string;
  getCapabilities(): AgentCapability[];
  getStatus(): AgentStatus;
  getType?(): string;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  
  // Task management
  addTask(task: Omit<AgentTask, 'id' | 'status'>): Promise<string>;
  getTask(taskId: string): Promise<AgentTask | null>;
  cancelTask(taskId: string): Promise<boolean>;
  
  // Memory operations
  remember(key: string, value: any): Promise<void>;
  recall(key: string): Promise<any>;
  forget(key: string): Promise<boolean>;
  
  // Tool usage
  hasCapability(capability: AgentCapability): boolean;
  getAvailableTools(): string[];
  canUseTool(toolName: string): boolean;
  useTool(toolName: string, inputs: Record<string, any>): Promise<any>;
  
  // Context and state
  getContext(): Record<string, any>;
  updateContext(context: Record<string, any>): void;
  getState(): Record<string, any>;
  
  // Agent coordination
  canCoordinateWith(agentId: string): boolean;
  sendMessage(targetAgentId: string, message: any): Promise<void>;
  
  // Task execution (for agent coordinator)
  execute?(task: string, inputs: Record<string, any>, options?: Record<string, any>): Promise<ExecutionResult>;
}

/**
 * Agent coordinator interface
 */
export interface AgentCoordinator extends EventEmitter {
  // Add or remove agents from coordination
  addAgent(agent: Agent): void;
  removeAgent(agentId: string): boolean;
  
  // Task assignment and execution
  assignTask(
    agentId: string,
    task: string,
    inputs: Record<string, any>,
    options?: Record<string, any>
  ): Promise<ExecutionResult>;
  
  // Broadcast task to all agents
  broadcastTask(
    task: string,
    inputs: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Record<string, ExecutionResult>>;
  
  // Get agent status and assignments
  getAgentStatus(agentId: string): AgentState;
  getAllAgentStatuses(): Record<string, AgentState>;
  getAgentAssignment(agentId: string): any;
  getAllAssignments(): Record<string, any>;
}

/**
 * Base agent implementation that provides common functionality
 */
export abstract class BaseAgent extends EventEmitter implements Agent {
  protected id: string;
  protected config: AgentConfig;
  protected status: AgentStatus = AgentStatus.IDLE;
  protected tasks: Map<string, AgentTask> = new Map();
  protected context: Record<string, any> = {};
  protected memoryStore: Map<string, any> = new Map();
  protected toolRegistry: Set<string> = new Set();
  
  constructor(id: string, config: AgentConfig) {
    super();
    this.id = id;
    this.config = config;
    
    // Set up default configuration
    this.config = {
      maxConcurrentTasks: 5,
      defaultTimeout: 60000, // 1 minute
      autoRestart: false,
      ...config
    };
    
    // Register available tools
    if (config.tools) {
      for (const tool of config.tools) {
        this.toolRegistry.add(tool);
      }
    }
  }
  
  /**
   * Get the agent's unique ID
   */
  getId(): string {
    return this.id;
  }
  
  /**
   * Get the agent's name
   */
  getName(): string {
    return this.config.name;
  }
  
  /**
   * Get the agent's description
   */
  getDescription(): string {
    return this.config.description;
  }
  
  /**
   * Get the agent's capabilities
   */
  getCapabilities(): AgentCapability[] {
    return [...this.config.capabilities];
  }
  
  /**
   * Get the agent's current status
   */
  getStatus(): AgentStatus {
    return this.status;
  }
  
  /**
   * Get the agent's type (for coordinator)
   */
  getType(): string {
    return 'base';
  }
  
  /**
   * Initialize the agent
   * Should be implemented by subclasses
   */
  abstract initialize(): Promise<void>;
  
  /**
   * Start the agent
   */
  async start(): Promise<void> {
    if (this.status !== AgentStatus.IDLE && this.status !== AgentStatus.PAUSED) {
      throw new Error(`Cannot start agent in ${this.status} status`);
    }
    
    this.status = AgentStatus.WORKING;
    this.emit('started', { agentId: this.id });
  }
  
  /**
   * Pause the agent
   */
  async pause(): Promise<void> {
    if (this.status !== AgentStatus.WORKING) {
      throw new Error(`Cannot pause agent in ${this.status} status`);
    }
    
    this.status = AgentStatus.PAUSED;
    this.emit('paused', { agentId: this.id });
  }
  
  /**
   * Resume the agent
   */
  async resume(): Promise<void> {
    if (this.status !== AgentStatus.PAUSED) {
      throw new Error(`Cannot resume agent in ${this.status} status`);
    }
    
    this.status = AgentStatus.WORKING;
    this.emit('resumed', { agentId: this.id });
  }
  
  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    if (this.status === AgentStatus.TERMINATED) {
      return;
    }
    
    // Cancel all running tasks
    for (const task of this.tasks.values()) {
      if (task.status === 'running' || task.status === 'pending') {
        task.status = 'canceled';
        this.emit('taskCanceled', { agentId: this.id, taskId: task.id });
      }
    }
    
    this.status = AgentStatus.TERMINATED;
    this.emit('stopped', { agentId: this.id });
  }
  
  /**
   * Add a task to the agent
   */
  async addTask(task: Omit<AgentTask, 'id' | 'status'>): Promise<string> {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask: AgentTask = {
      ...task,
      id,
      status: 'pending'
    };
    
    this.tasks.set(id, newTask);
    this.emit('taskAdded', { agentId: this.id, taskId: id, task: newTask });
    
    // Auto-start task processing if agent is working
    if (this.status === AgentStatus.WORKING) {
      this.processTask(id).catch(error => {
        console.error(`Error processing task ${id}:`, error);
      });
    }
    
    return id;
  }
  
  /**
   * Get a task by ID
   */
  async getTask(taskId: string): Promise<AgentTask | null> {
    return this.tasks.get(taskId) || null;
  }
  
  /**
   * Cancel a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }
    
    if (task.status === 'completed' || task.status === 'failed' || task.status === 'canceled') {
      return false;
    }
    
    task.status = 'canceled';
    this.emit('taskCanceled', { agentId: this.id, taskId });
    return true;
  }
  
  /**
   * Remember a value with a key
   */
  async remember(key: string, value: any): Promise<void> {
    this.memoryStore.set(key, value);
  }
  
  /**
   * Recall a value by key
   */
  async recall(key: string): Promise<any> {
    return this.memoryStore.get(key);
  }
  
  /**
   * Forget a value by key
   */
  async forget(key: string): Promise<boolean> {
    return this.memoryStore.delete(key);
  }
  
  /**
   * Check if the agent has a capability
   */
  hasCapability(capability: AgentCapability): boolean {
    return this.config.capabilities.includes(capability);
  }
  
  /**
   * Get available tools for this agent
   */
  getAvailableTools(): string[] {
    return Array.from(this.toolRegistry);
  }
  
  /**
   * Check if the agent can use a specific tool
   */
  canUseTool(toolName: string): boolean {
    return this.toolRegistry.has(toolName);
  }
  
  /**
   * Use a tool
   * Should be implemented by subclasses
   */
  abstract useTool(toolName: string, inputs: Record<string, any>): Promise<any>;
  
  /**
   * Get the agent's context
   */
  getContext(): Record<string, any> {
    return { ...this.context };
  }
  
  /**
   * Update the agent's context
   */
  updateContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }
  
  /**
   * Get the agent's state
   */
  getState(): Record<string, any> {
    return {
      id: this.id,
      name: this.getName(),
      status: this.status,
      tasks: Array.from(this.tasks.values()).map(task => ({
        id: task.id,
        type: task.type,
        status: task.status,
        priority: task.priority
      })),
      capabilities: this.getCapabilities(),
      tools: this.getAvailableTools()
    };
  }
  
  /**
   * Check if the agent can coordinate with another agent
   */
  canCoordinateWith(agentId: string): boolean {
    return this.hasCapability(AgentCapability.MULTI_AGENT_COORDINATION);
  }
  
  /**
   * Send a message to another agent
   */
  async sendMessage(targetAgentId: string, message: any): Promise<void> {
    if (!this.hasCapability(AgentCapability.MULTI_AGENT_COORDINATION)) {
      throw new Error(`Agent ${this.id} does not have multi-agent coordination capability`);
    }
    
    this.emit('messageSent', { 
      fromAgentId: this.id, 
      toAgentId: targetAgentId, 
      message 
    });
  }
  
  /**
   * Execute a task (for agent coordinator)
   */
  async execute(task: string, inputs: Record<string, any>, options?: Record<string, any>): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Create a new task
      const taskId = await this.addTask({
        type: task,
        description: options?.description || `Task ${task}`,
        inputs,
        priority: options?.priority || 5
      });
      
      // Wait for task to complete
      const taskResult = await this.waitForTaskCompletion(taskId);
      
      // Format result
      return {
        success: true,
        data: taskResult,
        metadata: {
          taskId,
          task,
          duration: Date.now() - startTime
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          task,
          duration: Date.now() - startTime
        },
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Wait for a task to complete
   */
  private async waitForTaskCompletion(taskId: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const checkTaskStatus = async () => {
        const task = await this.getTask(taskId);
        
        if (!task) {
          reject(new Error(`Task ${taskId} not found`));
          return;
        }
        
        if (task.status === 'completed') {
          resolve(task.result);
          return;
        } else if (task.status === 'failed') {
          reject(new Error(task.error || 'Task failed without error message'));
          return;
        } else if (task.status === 'canceled') {
          reject(new Error('Task was canceled'));
          return;
        }
        
        // Check again after a short delay
        setTimeout(checkTaskStatus, 100);
      };
      
      checkTaskStatus();
    });
  }
  
  /**
   * Process a task (to be implemented by subclasses)
   */
  protected abstract processTask(taskId: string): Promise<void>;
}