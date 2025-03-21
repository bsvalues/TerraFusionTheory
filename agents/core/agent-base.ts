/**
 * Base Agent Implementation
 * 
 * This file provides a concrete implementation of the BaseAgent abstract class,
 * with common functionality that can be inherited by specialized agent types.
 */

import { v4 as uuidv4 } from 'uuid';
import { BaseAgent, AgentConfig, AgentStatus, AgentTask, AgentCapability } from '../interfaces/agent-interface';
import { Tool } from '../interfaces/tool-interface';
import { toolRegistry } from './tool-registry';
import { vectorMemory } from '../memory/vector';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';

/**
 * Generic base agent implementation that can be extended by specialized agents
 */
export class GenericAgent extends BaseAgent {
  private runningTasks: Set<string> = new Set();
  private taskQueue: string[] = [];
  private processingQueue = false;
  
  constructor(id: string = uuidv4(), config: AgentConfig) {
    super(id, config);
    
    // Register event handlers
    this.on('taskAdded', this.handleTaskAdded.bind(this));
    this.on('taskCanceled', this.handleTaskCanceled.bind(this));
  }
  
  /**
   * Initialize the agent
   */
  async initialize(): Promise<void> {
    try {
      this.status = AgentStatus.INITIALIZING;
      
      // Initialize vector memory if configured
      if (this.config.memory?.useVectorMemory) {
        // We'll use the shared vector memory instance, but could create a specialized one
        // if needed with custom configuration
      }
      
      this.status = AgentStatus.IDLE;
      this.logActivity('Agent initialized', LogLevel.INFO);
      
      this.emit('initialized', { agentId: this.id });
    } catch (error) {
      this.status = AgentStatus.ERROR;
      this.logActivity('Initialization failed', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Use a specific tool with the given inputs
   */
  async useTool(toolName: string, inputs: Record<string, any>): Promise<any> {
    // Check if agent has permission to use the tool
    if (!this.canUseTool(toolName)) {
      throw new Error(`Agent ${this.id} does not have permission to use tool: ${toolName}`);
    }
    
    // Get the tool from the registry
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    // Validate inputs if the tool has a validator
    if (tool.validateInputs && !tool.validateInputs(inputs)) {
      throw new Error(`Invalid inputs for tool: ${toolName}`);
    }
    
    // Log tool usage
    this.logActivity(`Using tool: ${toolName}`, LogLevel.INFO, {
      inputs: JSON.stringify(inputs)
    });
    
    try {
      // Execute the tool with the agent's context
      const toolContext = {
        agent: this,
        agentContext: this.getContext(),
        inputs
      };
      
      const result = await tool.execute(toolContext);
      
      // Log success
      this.logActivity(`Tool execution succeeded: ${toolName}`, LogLevel.INFO, {
        success: result.success,
        hasResult: !!result.result
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Tool execution failed without specific error');
      }
      
      return result.result;
    } catch (error) {
      // Log failure
      this.logActivity(`Tool execution failed: ${toolName}`, LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Process a task from the queue
   */
  protected async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      this.logActivity(`Task not found: ${taskId}`, LogLevel.WARNING);
      return;
    }
    
    // Skip if task is not pending
    if (task.status !== 'pending') {
      return;
    }
    
    try {
      // Mark as running and record start time
      task.status = 'running';
      task.startTime = Date.now();
      this.runningTasks.add(taskId);
      
      this.emit('taskStarted', { agentId: this.id, taskId, task });
      this.logActivity(`Started task: ${taskId}`, LogLevel.INFO, {
        type: task.type,
        description: task.description
      });
      
      // Delegate to task-specific handler
      const result = await this.handleTask(task);
      
      // Mark as completed
      task.status = 'completed';
      task.endTime = Date.now();
      task.result = result;
      this.runningTasks.delete(taskId);
      
      this.emit('taskCompleted', { agentId: this.id, taskId, task, result });
      this.logActivity(`Completed task: ${taskId}`, LogLevel.INFO, {
        type: task.type,
        duration: task.endTime - (task.startTime || task.endTime)
      });
    } catch (error) {
      // Mark as failed
      task.status = 'failed';
      task.endTime = Date.now();
      task.error = error instanceof Error ? error.message : String(error);
      this.runningTasks.delete(taskId);
      
      this.emit('taskFailed', { agentId: this.id, taskId, task, error });
      this.logActivity(`Failed task: ${taskId}`, LogLevel.ERROR, {
        type: task.type,
        error: task.error,
        duration: task.endTime - (task.startTime || task.endTime)
      });
    }
    
    // Process next task in queue
    this.processNextTask();
  }
  
  /**
   * Process the next task in the queue if available
   */
  private async processNextTask(): Promise<void> {
    // Don't process if already processing or if we've hit the concurrency limit
    if (this.processingQueue || 
        (this.config.maxConcurrentTasks !== undefined && 
         this.runningTasks.size >= this.config.maxConcurrentTasks)) {
      return;
    }
    
    this.processingQueue = true;
    
    try {
      // Get next task from queue
      const nextTaskId = this.taskQueue.shift();
      if (nextTaskId) {
        // Process in background without waiting
        this.processTask(nextTaskId).catch(error => {
          console.error(`Error processing task ${nextTaskId}:`, error);
        });
      }
    } finally {
      this.processingQueue = false;
    }
    
    // If there are more tasks and we have capacity, process another
    if (this.taskQueue.length > 0 && 
        (this.config.maxConcurrentTasks === undefined || 
         this.runningTasks.size < this.config.maxConcurrentTasks)) {
      // Process next task after a small delay to prevent tight loops
      setTimeout(() => this.processNextTask(), 10);
    }
  }
  
  /**
   * Handle a specific task - must be implemented by subclasses
   */
  protected async handleTask(task: AgentTask): Promise<any> {
    // Base implementation just returns an unsupported task error
    throw new Error(`Task type '${task.type}' is not supported by agent '${this.getName()}'`);
  }
  
  /**
   * Handler for taskAdded event
   */
  private handleTaskAdded({ taskId }: { taskId: string }): void {
    // Add task to queue
    this.taskQueue.push(taskId);
    
    // Try to process it if we have capacity
    if (this.status === AgentStatus.WORKING) {
      this.processNextTask();
    }
  }
  
  /**
   * Handler for taskCanceled event
   */
  private handleTaskCanceled({ taskId }: { taskId: string }): void {
    // Remove from running tasks
    this.runningTasks.delete(taskId);
    
    // Remove from queue if present
    const index = this.taskQueue.indexOf(taskId);
    if (index >= 0) {
      this.taskQueue.splice(index, 1);
    }
  }
  
  /**
   * Add an item to vector memory
   */
  protected async addToVectorMemory(content: string, metadata: Record<string, any> = {}, ttl?: number): Promise<string | null> {
    if (!this.hasCapability(AgentCapability.VECTOR_SEARCH)) {
      return null;
    }
    
    try {
      return await vectorMemory.add(content, metadata, ttl);
    } catch (error) {
      this.logActivity('Failed to add to vector memory', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
  
  /**
   * Search vector memory for similar content
   */
  protected async searchVectorMemory(
    query: string, 
    options: { limit?: number; threshold?: number; } = {}
  ): Promise<any[] | null> {
    if (!this.hasCapability(AgentCapability.VECTOR_SEARCH)) {
      return null;
    }
    
    try {
      const results = await vectorMemory.search(query, options);
      return results.items;
    } catch (error) {
      this.logActivity('Failed to search vector memory', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
  
  /**
   * Log activity to the storage system
   */
  protected async logActivity(message: string, level: LogLevel, details?: any): Promise<void> {
    try {
      await storage.createLog({
        level,
        category: LogCategory.AI,
        message: `[Agent:${this.getName()}] ${message}`,
        details: details ? JSON.stringify(details) : null,
        source: `agent-${this.id}`,
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', this.getName(), ...this.getCapabilities()]
      });
    } catch (error) {
      console.error(`Failed to log agent activity:`, error);
    }
  }
}