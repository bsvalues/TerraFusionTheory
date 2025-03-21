/**
 * Agent Registry
 * 
 * This registry keeps track of all agents in the system and provides
 * methods to find, filter, and manage them.
 */

import { EventEmitter } from 'events';
import { 
  Agent, 
  AgentRegistry as AgentRegistryInterface, 
  AgentState, 
  AgentType 
} from '../interfaces/agent-interface';
import { storage } from '../../server/storage';
import { LogCategory, LogLevel } from '../../shared/schema';

/**
 * Agent Registry implementation
 */
export class AgentRegistry extends EventEmitter implements AgentRegistryInterface {
  // Singleton pattern
  private static instance: AgentRegistry;
  
  // Registry storage
  private agents: Map<string, Agent>;
  
  /**
   * Private constructor for singleton
   */
  private constructor() {
    super();
    this.agents = new Map<string, Agent>();
  }
  
  /**
   * Get the singleton instance of the registry
   */
  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }
  
  /**
   * Register an agent with the registry
   * 
   * @param agent The agent to register
   */
  public registerAgent(agent: Agent): void {
    const agentId = agent.getId();
    
    // Check if this agent is already registered
    if (this.agents.has(agentId)) {
      throw new Error(`Agent with ID ${agentId} is already registered`);
    }
    
    // Add agent to registry
    this.agents.set(agentId, agent);
    
    // Log registration
    this.logAgentAction('registered', agent);
    
    // Set up event listeners
    this.setupAgentEventListeners(agent);
    
    // Emit registration event
    this.emit('agent-registered', { agentId });
  }
  
  /**
   * Unregister an agent from the registry
   * 
   * @param agentId The ID of the agent to unregister
   */
  public unregisterAgent(agentId: string): boolean {
    // Check if this agent is registered
    if (!this.agents.has(agentId)) {
      return false;
    }
    
    const agent = this.agents.get(agentId)!;
    
    // Remove agent from registry
    this.agents.delete(agentId);
    
    // Log unregistration
    this.logAgentAction('unregistered', agent);
    
    // Emit unregistration event
    this.emit('agent-unregistered', { agentId });
    
    return true;
  }
  
  /**
   * Get an agent by ID
   * 
   * @param agentId The ID of the agent to get
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * Get all agents of a specific type
   * 
   * @param type The type of agents to get
   */
  public getAgentsByType(type: AgentType): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.getType() === type);
  }
  
  /**
   * Get all registered agents
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get all active agents
   */
  public getActiveAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.isActiveAgent());
  }
  
  /**
   * Set up event listeners for an agent
   * 
   * @param agent The agent to set up listeners for
   */
  private setupAgentEventListeners(agent: Agent): void {
    const agentId = agent.getId();
    
    // State change event
    agent.on('state-changed', (data: any) => {
      this.emit('agent-state-changed', { 
        agentId, 
        previousState: data.previousState, 
        newState: data.newState 
      });
      
      // Log state change
      this.logStateChange(agent, data.previousState, data.newState);
    });
    
    // Error event
    agent.on('error', (data: any) => {
      this.emit('agent-error', { 
        agentId, 
        error: data.error 
      });
      
      // Log error
      this.logAgentError(agent, data.error);
    });
  }
  
  /**
   * Log an agent action
   * 
   * @param action The action that occurred
   * @param agent The agent involved
   */
  private async logAgentAction(action: string, agent: Agent): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Agent ${action}: ${agent.getName()} (${agent.getId()})`,
        details: JSON.stringify({
          agentId: agent.getId(),
          agentType: agent.getType(),
          agentName: agent.getName(),
          action
        }),
        source: 'AgentRegistry',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'registry', action]
      });
    } catch (error) {
      console.error(`Failed to log agent ${action}:`, error);
    }
  }
  
  /**
   * Log an agent state change
   * 
   * @param agent The agent
   * @param previousState The previous state
   * @param newState The new state
   */
  private async logStateChange(
    agent: Agent,
    previousState: AgentState,
    newState: AgentState
  ): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.DEBUG,
        category: LogCategory.SYSTEM,
        message: `Agent state changed: ${agent.getName()} (${agent.getId()}) => ${newState}`,
        details: JSON.stringify({
          agentId: agent.getId(),
          agentType: agent.getType(),
          agentName: agent.getName(),
          previousState,
          newState
        }),
        source: 'AgentRegistry',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'state-change']
      });
    } catch (error) {
      console.error('Failed to log agent state change:', error);
    }
  }
  
  /**
   * Log an agent error
   * 
   * @param agent The agent
   * @param error The error that occurred
   */
  private async logAgentError(agent: Agent, error: Error): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Agent error: ${agent.getName()} (${agent.getId()}) - ${error.message}`,
        details: JSON.stringify({
          agentId: agent.getId(),
          agentType: agent.getType(),
          agentName: agent.getName(),
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        }),
        source: 'AgentRegistry',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'error']
      });
    } catch (logError) {
      console.error('Failed to log agent error:', logError);
      console.error('Original error:', error);
    }
  }
}

// Export a singleton instance
export const agentRegistry = AgentRegistry.getInstance();