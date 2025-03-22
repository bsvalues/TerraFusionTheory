/**
 * Agent Coordinator Memory Optimizations
 * 
 * This file contains memory optimizations for the agent coordinator
 * to improve memory efficiency in multi-agent communications.
 */

import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';
import { agentCoordinator } from './agent-coordinator';
import { Agent, ExecutionResult } from '../interfaces/agent-interface';

/**
 * Interface for memory-optimized task assignment options
 */
export interface OptimizedTaskOptions {
  // Regular task options
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  
  // Memory optimization options
  maxResponseSize?: number;     // Maximum size of response in bytes
  truncateResponse?: boolean;   // Whether to truncate responses exceeding limit
  cacheResult?: boolean;        // Whether to cache the result
  cacheTTL?: number;            // How long to cache (milliseconds)
  clearContextAfter?: boolean;  // Whether to clear agent context after task
  minimalLogging?: boolean;     // Use minimal logging for this task
}

/**
 * Cache for agent task results
 * Using a memory-efficient LRU cache structure
 */
class TaskResultCache {
  private cache: Map<string, {
    result: ExecutionResult;
    timestamp: number;
    expiresAt: number;
  }> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  
  constructor(maxSize: number = 50, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }
  
  /**
   * Set a result in the cache
   */
  set(key: string, result: ExecutionResult, ttl: number = this.defaultTTL): void {
    // Create cache key that's memory efficient (hash or truncate)
    const cacheKey = this.createEfficientKey(key);
    
    // Enforce cache size limit (LRU eviction)
    if (this.cache.size >= this.maxSize) {
      // Find oldest entry
      let oldestKey = '';
      let oldestTime = Infinity;
      
      for (const [entryKey, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = entryKey;
        }
      }
      
      // Remove oldest
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    // Store result with timestamps
    const now = Date.now();
    this.cache.set(cacheKey, {
      result: this.optimizeResult(result),
      timestamp: now,
      expiresAt: now + ttl
    });
  }
  
  /**
   * Get a result from the cache
   */
  get(key: string): ExecutionResult | null {
    const cacheKey = this.createEfficientKey(key);
    const entry = this.cache.get(cacheKey);
    
    // Not found
    if (!entry) {
      return null;
    }
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      // Expired - remove and return null
      this.cache.delete(cacheKey);
      return null;
    }
    
    // Update timestamp (for LRU)
    entry.timestamp = Date.now();
    
    // Return result
    return entry.result;
  }
  
  /**
   * Create an efficient cache key
   */
  private createEfficientKey(key: string): string {
    // Just truncate to 50 chars max for memory efficiency
    return key.length > 50 ? key.substring(0, 50) : key;
  }
  
  /**
   * Optimize a result object for storage
   */
  private optimizeResult(result: ExecutionResult): ExecutionResult {
    // Create a copy
    const optimized = { ...result };
    
    // If result has a data field with large properties, optimize them
    if (optimized.data) {
      // Truncate large string properties
      for (const key in optimized.data) {
        const value = optimized.data[key];
        if (typeof value === 'string' && value.length > 1000) {
          optimized.data[key] = value.substring(0, 1000);
        }
      }
    }
    
    return optimized;
  }
  
  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { size: number; averageAge: number } {
    const now = Date.now();
    let totalAge = 0;
    
    for (const entry of this.cache.values()) {
      totalAge += (now - entry.timestamp);
    }
    
    const averageAge = this.cache.size > 0 
      ? totalAge / this.cache.size 
      : 0;
    
    return {
      size: this.cache.size,
      averageAge
    };
  }
}

/**
 * Communication buffer for memory-efficient agent messages
 */
export class AgentMessageBuffer {
  private buffers: Map<string, string[]> = new Map();
  private maxBufferSize: number = 20; // Max messages per agent
  
  /**
   * Add a message to an agent's buffer
   */
  addMessage(agentId: string, message: string): void {
    let buffer = this.buffers.get(agentId);
    
    if (!buffer) {
      buffer = [];
      this.buffers.set(agentId, buffer);
    }
    
    // Add message to buffer
    buffer.push(message);
    
    // Trim if exceeding max size
    if (buffer.length > this.maxBufferSize) {
      buffer.shift(); // Remove oldest
    }
  }
  
  /**
   * Get messages for an agent
   */
  getMessages(agentId: string): string[] {
    return this.buffers.get(agentId) || [];
  }
  
  /**
   * Clear messages for an agent
   */
  clearMessages(agentId: string): void {
    this.buffers.delete(agentId);
  }
}

/**
 * Memory-optimized agent task tracking
 */
export class AgentTaskTracker {
  private activeTasks: Map<string, {
    agentId: string;
    task: string;
    startTime: number;
    priority: string;
  }> = new Map();
  
  /**
   * Start tracking a task
   */
  startTask(taskId: string, agentId: string, task: string, priority: string): void {
    this.activeTasks.set(taskId, {
      agentId,
      task,
      startTime: Date.now(),
      priority
    });
  }
  
  /**
   * End tracking a task
   */
  endTask(taskId: string): { agentId: string; task: string; duration: number } | null {
    const taskData = this.activeTasks.get(taskId);
    
    if (!taskData) {
      return null;
    }
    
    // Calculate duration
    const duration = Date.now() - taskData.startTime;
    
    // Remove from active tasks
    this.activeTasks.delete(taskId);
    
    return {
      agentId: taskData.agentId,
      task: taskData.task,
      duration
    };
  }
  
  /**
   * Get all active tasks
   */
  getActiveTasks(): { taskId: string; agentId: string; task: string; duration: number }[] {
    const now = Date.now();
    const tasks: { taskId: string; agentId: string; task: string; duration: number }[] = [];
    
    for (const [taskId, taskData] of this.activeTasks.entries()) {
      tasks.push({
        taskId,
        agentId: taskData.agentId,
        task: taskData.task,
        duration: now - taskData.startTime
      });
    }
    
    return tasks;
  }
}

/**
 * Enhanced agent coordinator with memory optimizations
 */
export class EnhancedAgentCoordinator {
  private static instance: EnhancedAgentCoordinator;
  private resultCache: TaskResultCache;
  private messageBuffer: AgentMessageBuffer;
  private taskTracker: AgentTaskTracker;
  
  /**
   * Private constructor for singleton
   */
  private constructor() {
    this.resultCache = new TaskResultCache(50, 10 * 60 * 1000);
    this.messageBuffer = new AgentMessageBuffer();
    this.taskTracker = new AgentTaskTracker();
    
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): EnhancedAgentCoordinator {
    if (!EnhancedAgentCoordinator.instance) {
      EnhancedAgentCoordinator.instance = new EnhancedAgentCoordinator();
    }
    return EnhancedAgentCoordinator.instance;
  }
  
  /**
   * Assign a task to an agent with memory optimization
   */
  public async assignTask(
    agentId: string,
    task: string,
    inputs: Record<string, any>,
    options: OptimizedTaskOptions = {}
  ): Promise<ExecutionResult> {
    const taskId = `${agentId}-${task}-${Date.now()}`;
    
    try {
      // Check cache first if caching is enabled
      if (options.cacheResult !== false) {
        const cacheKey = this.createCacheKey(agentId, task, inputs);
        const cachedResult = this.resultCache.get(cacheKey);
        
        if (cachedResult) {
          // Log cache hit with minimal logging
          if (!options.minimalLogging) {
            await this.logActivity('cache_hit', LogLevel.INFO, {
              agentId,
              task,
              taskId
            });
          }
          
          return cachedResult;
        }
      }
      
      // Start tracking task
      this.taskTracker.startTask(
        taskId, 
        agentId, 
        task, 
        options.priority || 'normal'
      );
      
      // Execute task with standard coordinator
      const result = await agentCoordinator.assignTask(
        agentId,
        task,
        inputs,
        {
          priority: options.priority,
          timeout: options.timeout
        }
      );
      
      // Record task completion
      const taskResult = this.taskTracker.endTask(taskId);
      
      // Optimize response if needed
      if (options.maxResponseSize && options.truncateResponse && result.success) {
        if (result.data) {
          // Check for long string properties
          for (const key in result.data) {
            if (typeof result.data[key] === 'string' && 
                result.data[key].length > options.maxResponseSize) {
              // Truncate string
              result.data[key] = result.data[key].substring(0, options.maxResponseSize);
            }
          }
        }
      }
      
      // Cache result if enabled
      if (options.cacheResult !== false && result.success) {
        const cacheKey = this.createCacheKey(agentId, task, inputs);
        this.resultCache.set(
          cacheKey, 
          result, 
          options.cacheTTL || 10 * 60 * 1000
        );
      }
      
      // Log task execution with minimal logging if requested
      if (!options.minimalLogging) {
        await this.logActivity('task_completed', result.success ? LogLevel.INFO : LogLevel.ERROR, {
          agentId,
          task,
          taskId,
          duration: taskResult?.duration,
          success: result.success
        });
      }
      
      return result;
    } catch (error) {
      // End task tracking
      this.taskTracker.endTask(taskId);
      
      // Log error
      await this.logActivity('task_error', LogLevel.ERROR, {
        agentId,
        task,
        taskId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Return error result
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * Create a cache key for task results
   */
  private createCacheKey(
    agentId: string,
    task: string,
    inputs: Record<string, any>
  ): string {
    // Create a compact representation of inputs
    const inputsStr = JSON.stringify(inputs);
    
    // Combine into a cache key
    return `${agentId}:${task}:${inputsStr}`;
  }
  
  /**
   * Perform periodic cleanup
   */
  private async cleanup(): Promise<void> {
    try {
      // Cleanup caches
      const removedCount = this.resultCache.cleanup();
      
      // Log cleanup
      if (removedCount > 0) {
        await this.logActivity('cache_cleanup', LogLevel.DEBUG, {
          removedEntries: removedCount,
          cacheStats: this.resultCache.getStats()
        });
      }
    } catch (error) {
      console.error('Error in coordinator cleanup:', error);
    }
  }
  
  /**
   * Log activity with minimal overhead
   */
  private async logActivity(
    action: string,
    level: LogLevel,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Only log if not debug or if debug logging is enabled
      if (level !== LogLevel.DEBUG || process.env.DEBUG_COORDINATOR === 'true') {
        await storage.createLog({
          level,
          category: LogCategory.AI,
          message: `[CoordOpt] ${action}`,
          details: JSON.stringify(details),
          source: 'agent-coordinator-optimizer',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['agent', 'coordinator', 'optimization']
        });
      }
    } catch (error) {
      // Fail silently for logging errors in optimization module
      console.error('Failed to log coordinator activity:', error);
    }
  }
}

/**
 * Singleton instance
 */
export const enhancedCoordinator = EnhancedAgentCoordinator.getInstance();