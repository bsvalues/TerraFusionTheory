/**
 * Agent Coordinator
 * 
 * This file implements the agent coordinator which manages communication
 * and coordination between multiple agents.
 */

import { EventEmitter } from 'events';
import { Agent, AgentCoordinator, AgentState, ExecutionResult } from '../interfaces/agent-interface';

/**
 * Implementation of the Agent Coordinator
 */
class AgentCoordinatorImpl extends EventEmitter implements AgentCoordinator {
  private agents: Map<string, Agent> = new Map();
  private agentStates: Map<string, AgentState> = new Map();
  private activeAssignments: Map<string, any> = new Map();
  
  constructor() {
    super();
    
    // Set up event handlers
    this.on('agentAdded', this.handleAgentAdded.bind(this));
    this.on('agentRemoved', this.handleAgentRemoved.bind(this));
    this.on('messageReceived', this.handleMessageReceived.bind(this));
    this.on('taskAssigned', this.handleTaskAssigned.bind(this));
    this.on('taskCompleted', this.handleTaskCompleted.bind(this));
  }
  
  /**
   * Add an agent to the coordinator
   */
  public addAgent(agent: Agent): void {
    if (this.agents.has(agent.getId())) {
      console.warn(`Agent with ID ${agent.getId()} already exists in coordinator`);
      return;
    }
    
    this.agents.set(agent.getId(), agent);
    this.agentStates.set(agent.getId(), AgentState.READY);
    
    // Subscribe to agent events
    agent.on('started', this.handleAgentStarted.bind(this));
    agent.on('paused', this.handleAgentPaused.bind(this));
    agent.on('resumed', this.handleAgentResumed.bind(this));
    agent.on('stopped', this.handleAgentStopped.bind(this));
    agent.on('messageSent', this.handleAgentMessageSent.bind(this));
    
    this.emit('agentAdded', { agentId: agent.getId() });
  }
  
  /**
   * Remove an agent from the coordinator
   */
  public removeAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }
    
    // Unsubscribe from agent events
    agent.removeAllListeners('started');
    agent.removeAllListeners('paused');
    agent.removeAllListeners('resumed');
    agent.removeAllListeners('stopped');
    agent.removeAllListeners('messageSent');
    
    this.agents.delete(agentId);
    this.agentStates.delete(agentId);
    this.activeAssignments.delete(agentId);
    
    this.emit('agentRemoved', { agentId });
    return true;
  }
  
  /**
   * Assign a task to a specific agent
   */
  public async assignTask(
    agentId: string,
    task: string,
    inputs: Record<string, any>,
    options?: Record<string, any>
  ): Promise<ExecutionResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return {
        success: false,
        error: new Error(`Agent with ID ${agentId} not found`),
        metadata: { task, agentId }
      };
    }
    
    // Check if agent is available
    const state = this.agentStates.get(agentId);
    if (state !== AgentState.READY && state !== AgentState.IDLE) {
      return {
        success: false,
        error: new Error(`Agent ${agentId} is not available (state: ${state})`),
        metadata: { task, agentId, agentState: state }
      };
    }
    
    // Update agent state
    this.agentStates.set(agentId, AgentState.BUSY);
    this.activeAssignments.set(agentId, { task, inputs, options, startTime: Date.now() });
    
    this.emit('taskAssigned', { agentId, task, inputs });
    
    try {
      if (!agent.execute) {
        throw new Error(`Agent ${agentId} does not implement execute method`);
      }
      
      // Execute the task
      const result = await agent.execute(task, inputs, options);
      
      // Update agent state
      this.agentStates.set(agentId, AgentState.READY);
      this.activeAssignments.delete(agentId);
      
      this.emit('taskCompleted', { agentId, task, success: result.success });
      
      return result;
    } catch (error) {
      // Update agent state to error
      this.agentStates.set(agentId, AgentState.ERROR);
      this.activeAssignments.delete(agentId);
      
      this.emit('taskFailed', { 
        agentId, 
        task, 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: { task, agentId }
      };
    }
  }
  
  /**
   * Broadcast a task to all available agents
   */
  public async broadcastTask(
    task: string,
    inputs: Record<string, any>,
    options?: Record<string, any>
  ): Promise<Record<string, ExecutionResult>> {
    const results: Record<string, ExecutionResult> = {};
    const promises: Promise<void>[] = [];
    
    // Assign task to each available agent
    for (const [agentId, state] of this.agentStates.entries()) {
      if (state === AgentState.READY || state === AgentState.IDLE) {
        const promise = this.assignTask(agentId, task, inputs, options)
          .then(result => {
            results[agentId] = result;
          })
          .catch(error => {
            results[agentId] = {
              success: false,
              error: error instanceof Error ? error : new Error(String(error)),
              metadata: { task, agentId }
            };
          });
        
        promises.push(promise);
      }
    }
    
    // Wait for all tasks to complete
    await Promise.all(promises);
    
    return results;
  }
  
  /**
   * Get the status of a specific agent
   */
  public getAgentStatus(agentId: string): AgentState {
    return this.agentStates.get(agentId) || AgentState.TERMINATED;
  }
  
  /**
   * Get the status of all agents
   */
  public getAllAgentStatuses(): Record<string, AgentState> {
    const statuses: Record<string, AgentState> = {};
    for (const [agentId, state] of this.agentStates.entries()) {
      statuses[agentId] = state;
    }
    return statuses;
  }
  
  /**
   * Get the current assignment of a specific agent
   */
  public getAgentAssignment(agentId: string): any {
    return this.activeAssignments.get(agentId) || null;
  }
  
  /**
   * Get all current assignments
   */
  public getAllAssignments(): Record<string, any> {
    const assignments: Record<string, any> = {};
    for (const [agentId, assignment] of this.activeAssignments.entries()) {
      assignments[agentId] = assignment;
    }
    return assignments;
  }
  
  /**
   * Handle agent added event
   */
  private handleAgentAdded(data: { agentId: string }): void {
    console.log(`Agent ${data.agentId} added to coordinator`);
  }
  
  /**
   * Handle agent removed event
   */
  private handleAgentRemoved(data: { agentId: string }): void {
    console.log(`Agent ${data.agentId} removed from coordinator`);
  }
  
  /**
   * Handle agent started event
   */
  private handleAgentStarted(data: { agentId: string }): void {
    this.agentStates.set(data.agentId, AgentState.READY);
    this.emit('agentStatusChanged', { agentId: data.agentId, state: AgentState.READY });
  }
  
  /**
   * Handle agent paused event
   */
  private handleAgentPaused(data: { agentId: string }): void {
    this.agentStates.set(data.agentId, AgentState.PAUSED);
    this.emit('agentStatusChanged', { agentId: data.agentId, state: AgentState.PAUSED });
  }
  
  /**
   * Handle agent resumed event
   */
  private handleAgentResumed(data: { agentId: string }): void {
    this.agentStates.set(data.agentId, AgentState.READY);
    this.emit('agentStatusChanged', { agentId: data.agentId, state: AgentState.READY });
  }
  
  /**
   * Handle agent stopped event
   */
  private handleAgentStopped(data: { agentId: string }): void {
    this.agentStates.set(data.agentId, AgentState.TERMINATED);
    this.activeAssignments.delete(data.agentId);
    this.emit('agentStatusChanged', { agentId: data.agentId, state: AgentState.TERMINATED });
  }
  
  /**
   * Handle message sent from one agent to another
   */
  private handleAgentMessageSent(data: { fromAgentId: string; toAgentId: string; message: any }): void {
    const targetAgent = this.agents.get(data.toAgentId);
    if (!targetAgent) {
      console.warn(`Target agent ${data.toAgentId} not found for message from ${data.fromAgentId}`);
      return;
    }
    
    // Forward the message to the target agent
    this.emit('messageReceived', {
      fromAgentId: data.fromAgentId,
      toAgentId: data.toAgentId,
      message: data.message
    });
    
    // Let the target agent handle the message
    if (targetAgent.updateContext) {
      targetAgent.updateContext({
        messages: [
          {
            fromAgentId: data.fromAgentId,
            message: data.message
          }
        ]
      });
    }
  }
  
  /**
   * Handle message received by the coordinator
   */
  private handleMessageReceived(data: { fromAgentId: string; toAgentId: string; message: any }): void {
    console.log(`Message from ${data.fromAgentId} to ${data.toAgentId} received by coordinator`);
  }
  
  /**
   * Handle task assigned to an agent
   */
  private handleTaskAssigned(data: { agentId: string; task: string; inputs: Record<string, any> }): void {
    console.log(`Task ${data.task} assigned to agent ${data.agentId}`);
  }
  
  /**
   * Handle task completed by an agent
   */
  private handleTaskCompleted(data: { agentId: string; task: string; success: boolean }): void {
    console.log(`Task ${data.task} completed by agent ${data.agentId} (success: ${data.success})`);
  }
}

/**
 * Singleton instance of the agent coordinator
 */
export const agentCoordinator = new AgentCoordinatorImpl();