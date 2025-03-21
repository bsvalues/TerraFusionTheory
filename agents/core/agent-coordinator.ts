/**
 * Agent Coordinator
 * 
 * This class handles coordination between agents, enabling them to work together
 * on complex tasks that require multiple capabilities.
 */

import { EventEmitter } from 'events';
import { 
  Agent, 
  AgentCoordinator as AgentCoordinatorInterface,
  AgentState, 
  ExecutionResult 
} from '../interfaces/agent-interface';
import { storage } from '../../server/storage';
import { LogCategory, LogLevel } from '../../shared/schema';
import { agentRegistry } from './agent-registry';

/**
 * Agent Coordinator implementation
 */
export class AgentCoordinator extends EventEmitter implements AgentCoordinatorInterface {
  // Singleton pattern
  private static instance: AgentCoordinator;
  
  // Map of agents being coordinated
  private agents: Map<string, Agent>;
  
  // Map of agent task assignments
  private assignments: Map<string, {
    taskId: string;
    startTime: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  }>;
  
  /**
   * Private constructor for singleton
   */
  private constructor() {
    super();
    this.agents = new Map<string, Agent>();
    this.assignments = new Map<string, {
      taskId: string;
      startTime: Date;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
    }>();
  }
  
  /**
   * Get the singleton instance of the coordinator
   */
  public static getInstance(): AgentCoordinator {
    if (!AgentCoordinator.instance) {
      AgentCoordinator.instance = new AgentCoordinator();
    }
    return AgentCoordinator.instance;
  }
  
  /**
   * Add an agent to the coordinator
   * 
   * @param agent The agent to add
   */
  public addAgent(agent: Agent): void {
    const agentId = agent.getId();
    
    // Check if agent is already registered
    if (this.agents.has(agentId)) {
      throw new Error(`Agent with ID ${agentId} is already being coordinated`);
    }
    
    // Add agent to coordinator
    this.agents.set(agentId, agent);
    
    // Log addition
    this.logCoordinatorAction('added', agent);
    
    // Emit addition event
    this.emit('agent-added', { agentId });
  }
  
  /**
   * Remove an agent from the coordinator
   * 
   * @param agentId The ID of the agent to remove
   */
  public removeAgent(agentId: string): boolean {
    // Check if agent is registered
    if (!this.agents.has(agentId)) {
      return false;
    }
    
    const agent = this.agents.get(agentId)!;
    
    // Remove agent from coordinator
    this.agents.delete(agentId);
    
    // Remove any assignments for this agent
    this.assignments.delete(agentId);
    
    // Log removal
    this.logCoordinatorAction('removed', agent);
    
    // Emit removal event
    this.emit('agent-removed', { agentId });
    
    return true;
  }
  
  /**
   * Assign a task to a specific agent
   * 
   * @param agentId The ID of the agent to assign the task to
   * @param task The task to execute
   * @param inputs The inputs for the task
   * @param options Additional options for execution
   */
  public async assignTask(
    agentId: string,
    task: string,
    inputs: Record<string, any>,
    options?: Record<string, any>
  ): Promise<ExecutionResult> {
    // Check if agent is registered
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent with ID ${agentId} is not being coordinated`);
    }
    
    const agent = this.agents.get(agentId)!;
    
    // Check if agent is available
    if (agent.getState() !== AgentState.READY && agent.getState() !== AgentState.IDLE) {
      throw new Error(`Agent with ID ${agentId} is not ready (current state: ${agent.getState()})`);
    }
    
    // Record assignment
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.assignments.set(agentId, {
      taskId,
      startTime: new Date(),
      status: 'pending'
    });
    
    // Log assignment
    await this.logTaskAssignment(agent, task, taskId);
    
    // Emit assignment event
    this.emit('task-assigned', { agentId, taskId, task });
    
    try {
      // Update assignment status
      this.assignments.set(agentId, {
        taskId,
        startTime: new Date(),
        status: 'in-progress'
      });
      
      // Execute task
      const result = await agent.execute(task, inputs, options);
      
      // Update assignment status
      this.assignments.set(agentId, {
        taskId,
        startTime: new Date(),
        status: 'completed'
      });
      
      // Log completion
      await this.logTaskCompletion(agent, task, taskId, true);
      
      // Emit completion event
      this.emit('task-completed', { agentId, taskId, task, result });
      
      return result;
    } catch (error) {
      // Update assignment status
      this.assignments.set(agentId, {
        taskId,
        startTime: new Date(),
        status: 'failed'
      });
      
      // Log failure
      await this.logTaskCompletion(
        agent, 
        task, 
        taskId, 
        false, 
        error instanceof Error ? error : new Error(String(error))
      );
      
      // Emit failure event
      this.emit('task-failed', { 
        agentId, 
        taskId, 
        task, 
        error: error instanceof Error ? error : new Error(String(error)) 
      });
      
      throw error;
    }
  }
  
  /**
   * Broadcast a task to all coordinated agents
   * 
   * @param task The task to execute
   * @param inputs The inputs for the task
   * @param options Additional options for execution
   */
  public async broadcastTask(
    task: string,
    inputs: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Record<string, ExecutionResult>> {
    const results: Record<string, ExecutionResult> = {};
    const errors: Record<string, Error> = {};
    
    // Execute task on all available agents
    const promises = Array.from(this.agents.entries()).map(async ([agentId, agent]) => {
      try {
        // Check if agent is available
        if (agent.getState() !== AgentState.READY && agent.getState() !== AgentState.IDLE) {
          throw new Error(`Agent is not ready (current state: ${agent.getState()})`);
        }
        
        // Assign task
        const result = await this.assignTask(agentId, task, inputs, options);
        
        // Record result
        results[agentId] = result;
      } catch (error) {
        // Record error
        errors[agentId] = error instanceof Error ? error : new Error(String(error));
      }
    });
    
    // Wait for all tasks to complete
    await Promise.all(promises);
    
    // Log broadcast completion
    await this.logBroadcastCompletion(task, results, errors);
    
    // Emit broadcast completion event
    this.emit('broadcast-completed', { task, results, errors });
    
    return results;
  }
  
  /**
   * Get the current status of an agent
   * 
   * @param agentId The ID of the agent
   */
  public getAgentStatus(agentId: string): AgentState {
    // Check if agent is registered
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent with ID ${agentId} is not being coordinated`);
    }
    
    const agent = this.agents.get(agentId)!;
    
    return agent.getState();
  }
  
  /**
   * Get the current status of all coordinated agents
   */
  public getAllAgentStatuses(): Record<string, AgentState> {
    const statuses: Record<string, AgentState> = {};
    
    for (const [agentId, agent] of this.agents.entries()) {
      statuses[agentId] = agent.getState();
    }
    
    return statuses;
  }
  
  /**
   * Get the current task assignment for an agent
   * 
   * @param agentId The ID of the agent
   */
  public getAgentAssignment(agentId: string): {
    taskId: string;
    startTime: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  } | undefined {
    return this.assignments.get(agentId);
  }
  
  /**
   * Get all current task assignments
   */
  public getAllAssignments(): Record<string, {
    taskId: string;
    startTime: Date;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    agent: {
      id: string;
      name: string;
      type: string;
    };
  }> {
    const assignments: Record<string, {
      taskId: string;
      startTime: Date;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      agent: {
        id: string;
        name: string;
        type: string;
      };
    }> = {};
    
    for (const [agentId, assignment] of this.assignments.entries()) {
      const agent = this.agents.get(agentId);
      
      if (agent) {
        assignments[agentId] = {
          ...assignment,
          agent: {
            id: agent.getId(),
            name: agent.getName(),
            type: agent.getType()
          }
        };
      }
    }
    
    return assignments;
  }
  
  /**
   * Log a coordinator action
   * 
   * @param action The action that occurred
   * @param agent The agent involved
   */
  private async logCoordinatorAction(action: string, agent: Agent): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Agent Coordinator ${action} agent: ${agent.getName()} (${agent.getId()})`,
        details: JSON.stringify({
          agentId: agent.getId(),
          agentType: agent.getType(),
          agentName: agent.getName(),
          action
        }),
        source: 'AgentCoordinator',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'coordinator', action]
      });
    } catch (error) {
      console.error(`Failed to log coordinator ${action}:`, error);
    }
  }
  
  /**
   * Log a task assignment
   * 
   * @param agent The agent
   * @param task The task
   * @param taskId The task ID
   */
  private async logTaskAssignment(
    agent: Agent,
    task: string,
    taskId: string
  ): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Agent Coordinator assigned task to ${agent.getName()}: ${task}`,
        details: JSON.stringify({
          agentId: agent.getId(),
          agentType: agent.getType(),
          agentName: agent.getName(),
          taskId,
          task
        }),
        source: 'AgentCoordinator',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'coordinator', 'task-assignment']
      });
    } catch (error) {
      console.error('Failed to log task assignment:', error);
    }
  }
  
  /**
   * Log a task completion
   * 
   * @param agent The agent
   * @param task The task
   * @param taskId The task ID
   * @param success Whether the task was successful
   * @param error Any error that occurred
   */
  private async logTaskCompletion(
    agent: Agent,
    task: string,
    taskId: string,
    success: boolean,
    error?: Error
  ): Promise<void> {
    try {
      await storage.createLog({
        level: success ? LogLevel.INFO : LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Agent Coordinator task ${success ? 'completed' : 'failed'}: ${task} by ${agent.getName()}`,
        details: JSON.stringify({
          agentId: agent.getId(),
          agentType: agent.getType(),
          agentName: agent.getName(),
          taskId,
          task,
          success,
          error: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : undefined
        }),
        source: 'AgentCoordinator',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'coordinator', success ? 'task-completion' : 'task-failure']
      });
    } catch (logError) {
      console.error('Failed to log task completion:', logError);
      if (error) {
        console.error('Original error:', error);
      }
    }
  }
  
  /**
   * Log a broadcast completion
   * 
   * @param task The task
   * @param results The results
   * @param errors Any errors that occurred
   */
  private async logBroadcastCompletion(
    task: string,
    results: Record<string, ExecutionResult>,
    errors: Record<string, Error>
  ): Promise<void> {
    try {
      await storage.createLog({
        level: Object.keys(errors).length > 0 ? LogLevel.WARNING : LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Agent Coordinator broadcast completed: ${task}`,
        details: JSON.stringify({
          task,
          successCount: Object.keys(results).length,
          errorCount: Object.keys(errors).length,
          errors: Object.entries(errors).map(([agentId, error]) => ({
            agentId,
            error: {
              name: error.name,
              message: error.message
            }
          }))
        }),
        source: 'AgentCoordinator',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'coordinator', 'broadcast-completion']
      });
    } catch (error) {
      console.error('Failed to log broadcast completion:', error);
    }
  }
}

// Export a singleton instance
export const agentCoordinator = AgentCoordinator.getInstance();