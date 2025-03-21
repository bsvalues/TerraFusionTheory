/**
 * Base Agent Class
 * 
 * This abstract class defines the core functionality and interface for all agents
 * in the IntelligentEstate system. All specialized agents should extend this class.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { 
  Agent,
  AgentCapability, 
  AgentConfig, 
  AgentContext, 
  AgentMessage,
  AgentState, 
  AgentTask,
  AgentType, 
  ExecutionResult 
} from '../interfaces/agent-interface';

export abstract class BaseAgent extends EventEmitter implements Agent {
  protected id: string;
  protected type: AgentType;
  protected name: string;
  protected description: string;
  protected capabilities: Set<AgentCapability>;
  protected state: AgentState;
  protected context: AgentContext;
  protected config: AgentConfig;
  protected isActive: boolean;
  protected createdAt: Date;
  protected lastActive: Date;

  /**
   * Create a new agent instance
   * 
   * @param type The type of agent
   * @param name Human-readable name for the agent
   * @param description Description of the agent's purpose
   * @param capabilities Set of capabilities this agent supports
   * @param config Configuration options for the agent
   */
  constructor(
    type: AgentType,
    name: string,
    description: string,
    capabilities: AgentCapability[] = [],
    config: AgentConfig = {}
  ) {
    super();
    this.id = uuidv4();
    this.type = type;
    this.name = name;
    this.description = description;
    this.capabilities = new Set(capabilities);
    this.state = AgentState.IDLE;
    this.context = {
      history: [],
      memory: new Map(),
      currentTask: null,
      environment: {},
      metadata: {}
    };
    this.config = {
      maxHistoryLength: 100,
      maxMemoryItems: 1000,
      timeoutMs: 30000,
      autoSave: false,
      persistMemory: false,
      ...config
    };
    this.isActive = false;
    this.createdAt = new Date();
    this.lastActive = new Date();
  }

  /**
   * Initialize the agent with any required setup
   */
  public async initialize(): Promise<boolean> {
    try {
      this.setState(AgentState.INITIALIZING);
      
      // Perform initialization tasks
      // Subclasses should override this method to perform specific initialization
      
      this.isActive = true;
      this.setState(AgentState.READY);
      this.emit('initialized', { agentId: this.id });
      
      return true;
    } catch (error) {
      this.setState(AgentState.ERROR);
      this.emit('error', { agentId: this.id, error });
      return false;
    }
  }

  /**
   * Shutdown the agent and clean up resources
   */
  public async shutdown(): Promise<boolean> {
    try {
      // Perform cleanup tasks
      // Subclasses should override this method to perform specific cleanup
      
      this.isActive = false;
      this.setState(AgentState.TERMINATED);
      this.emit('shutdown', { agentId: this.id });
      
      return true;
    } catch (error) {
      this.setState(AgentState.ERROR);
      this.emit('error', { agentId: this.id, error });
      return false;
    }
  }

  /**
   * Pause the agent's activity temporarily
   */
  public async pause(): Promise<boolean> {
    try {
      if (this.state === AgentState.BUSY) {
        // Cannot pause while executing a task
        throw new Error('Cannot pause agent while it is executing a task');
      }
      
      this.isActive = false;
      this.setState(AgentState.PAUSED);
      this.emit('paused', { agentId: this.id });
      
      return true;
    } catch (error) {
      this.emit('error', { agentId: this.id, error });
      return false;
    }
  }

  /**
   * Resume the agent after being paused
   */
  public async resume(): Promise<boolean> {
    try {
      if (this.state !== AgentState.PAUSED) {
        throw new Error('Agent is not paused');
      }
      
      this.isActive = true;
      this.setState(AgentState.READY);
      this.emit('resumed', { agentId: this.id });
      
      return true;
    } catch (error) {
      this.emit('error', { agentId: this.id, error });
      return false;
    }
  }

  /**
   * Execute a task with the agent
   * 
   * This method must be implemented by each agent type with its specific logic
   * 
   * @param task The task to execute
   * @param inputs The inputs for the task
   * @param options Additional options for execution
   */
  public abstract execute(
    task: string,
    inputs: Record<string, any>,
    options?: Record<string, any>
  ): Promise<ExecutionResult>;

  /**
   * Get the agent's ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get the agent's type
   */
  public getType(): AgentType {
    return this.type;
  }

  /**
   * Get the agent's name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get the agent's description
   */
  public getDescription(): string {
    return this.description;
  }

  /**
   * Check if the agent has a specific capability
   * 
   * @param capability The capability to check for
   */
  public hasCapability(capability: AgentCapability): boolean {
    return this.capabilities.has(capability);
  }

  /**
   * Get all capabilities of the agent
   */
  public getCapabilities(): AgentCapability[] {
    return Array.from(this.capabilities);
  }

  /**
   * Add a capability to the agent
   * 
   * @param capability The capability to add
   */
  public addCapability(capability: AgentCapability): void {
    this.capabilities.add(capability);
    this.emit('capability-added', { agentId: this.id, capability });
  }

  /**
   * Remove a capability from the agent
   * 
   * @param capability The capability to remove
   */
  public removeCapability(capability: AgentCapability): boolean {
    const removed = this.capabilities.delete(capability);
    if (removed) {
      this.emit('capability-removed', { agentId: this.id, capability });
    }
    return removed;
  }

  /**
   * Get the current state of the agent
   */
  public getState(): AgentState {
    return this.state;
  }

  /**
   * Set the agent's state
   * 
   * @param state The new state
   */
  protected setState(state: AgentState): void {
    const previousState = this.state;
    this.state = state;
    this.lastActive = new Date();
    this.emit('state-changed', { 
      agentId: this.id, 
      previousState, 
      newState: state 
    });
  }

  /**
   * Get the current context of the agent
   */
  public getContext(): AgentContext {
    return this.context;
  }

  /**
   * Update the agent's context
   * 
   * @param contextUpdate Partial context update to merge
   */
  public updateContext(contextUpdate: Partial<AgentContext>): void {
    // Deep merge the context update with the current context
    if (contextUpdate.history) {
      this.context.history = [...this.context.history, ...contextUpdate.history];
      
      // Trim history if it exceeds the maximum length
      if (this.config.maxHistoryLength && this.context.history.length > this.config.maxHistoryLength) {
        this.context.history = this.context.history.slice(-this.config.maxHistoryLength);
      }
    }
    
    if (contextUpdate.memory) {
      // Convert Map to Object for merging
      const newMemoryEntries = Array.from(contextUpdate.memory.entries());
      for (const [key, value] of newMemoryEntries) {
        this.context.memory.set(key, value);
      }
      
      // Trim memory if it exceeds the maximum size
      if (this.config.maxMemoryItems && this.context.memory.size > this.config.maxMemoryItems) {
        const keysToRemove = Array.from(this.context.memory.keys())
          .slice(0, this.context.memory.size - this.config.maxMemoryItems);
        
        for (const key of keysToRemove) {
          this.context.memory.delete(key);
        }
      }
    }
    
    if (contextUpdate.currentTask) {
      this.context.currentTask = contextUpdate.currentTask;
    }
    
    if (contextUpdate.environment) {
      this.context.environment = { 
        ...this.context.environment, 
        ...contextUpdate.environment 
      };
    }
    
    if (contextUpdate.metadata) {
      this.context.metadata = { 
        ...this.context.metadata, 
        ...contextUpdate.metadata 
      };
    }
    
    this.lastActive = new Date();
    this.emit('context-updated', { agentId: this.id });
  }

  /**
   * Add a message to the agent's history
   * 
   * @param role The role of the message sender
   * @param content The content of the message
   * @param metadata Additional metadata for the message
   */
  protected addMessage(role: 'user' | 'agent' | 'system', content: string, metadata?: Record<string, any>): AgentMessage {
    const message: AgentMessage = {
      id: uuidv4(),
      timestamp: new Date(),
      role,
      content,
      metadata
    };
    
    this.context.history.push(message);
    
    // Trim history if it exceeds the maximum length
    if (this.config.maxHistoryLength && this.context.history.length > this.config.maxHistoryLength) {
      this.context.history = this.context.history.slice(-this.config.maxHistoryLength);
    }
    
    this.emit('message-added', { agentId: this.id, message });
    
    return message;
  }

  /**
   * Update the current task of the agent
   * 
   * @param task The task to set as current
   */
  protected setCurrentTask(task: AgentTask | null): void {
    this.context.currentTask = task;
    
    if (task) {
      this.emit('task-assigned', { agentId: this.id, taskId: task.id });
    } else {
      this.emit('task-cleared', { agentId: this.id });
    }
  }

  /**
   * Store a value in the agent's memory
   * 
   * @param key The key to store the value under
   * @param value The value to store
   */
  public remember(key: string, value: any): void {
    this.context.memory.set(key, value);
    
    // Trim memory if it exceeds the maximum size
    if (this.config.maxMemoryItems && this.context.memory.size > this.config.maxMemoryItems) {
      const oldestKey = Array.from(this.context.memory.keys())[0];
      this.context.memory.delete(oldestKey);
    }
    
    this.emit('memory-updated', { agentId: this.id, key });
  }

  /**
   * Retrieve a value from the agent's memory
   * 
   * @param key The key to retrieve
   */
  public recall(key: string): any {
    return this.context.memory.get(key);
  }

  /**
   * Forget a value in the agent's memory
   * 
   * @param key The key to forget
   */
  public forget(key: string): boolean {
    const deleted = this.context.memory.delete(key);
    
    if (deleted) {
      this.emit('memory-item-deleted', { agentId: this.id, key });
    }
    
    return deleted;
  }

  /**
   * Clear all values from the agent's memory
   */
  public clearMemory(): void {
    this.context.memory.clear();
    this.emit('memory-cleared', { agentId: this.id });
  }

  /**
   * Check if the agent is currently active
   */
  public isActiveAgent(): boolean {
    return this.isActive;
  }

  /**
   * Get configuration information about the agent
   */
  public getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Update the agent's configuration
   * 
   * @param configUpdate Partial configuration update to merge
   */
  public updateConfig(configUpdate: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...configUpdate };
    this.emit('config-updated', { agentId: this.id });
  }

  /**
   * Get diagnostics information about the agent
   */
  public getDiagnostics(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      state: this.state,
      isActive: this.isActive,
      capabilities: Array.from(this.capabilities),
      createdAt: this.createdAt,
      lastActive: this.lastActive,
      contextSize: {
        historyLength: this.context.history.length,
        memorySize: this.context.memory.size
      },
      currentTask: this.context.currentTask ? {
        id: this.context.currentTask.id,
        name: this.context.currentTask.name,
        status: this.context.currentTask.status
      } : null
    };
  }
}