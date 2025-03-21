/**
 * Agent Registry
 * 
 * This module provides a centralized registry for all agents in the system,
 * allowing components to discover and interact with agents.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentCapability, AgentStatus } from '../interfaces/agent-interface';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';

/**
 * Agent Registry that manages all agents in the system
 */
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, Agent> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.logActivity('Initialized agent registry', LogLevel.INFO);
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }
  
  /**
   * Register a new agent in the registry
   */
  registerAgent(agent: Agent): void {
    const agentId = agent.getId();
    
    if (this.agents.has(agentId)) {
      this.logActivity(`Agent with ID ${agentId} already registered, replacing`, LogLevel.WARNING);
    }
    
    this.agents.set(agentId, agent);
    this.logActivity(`Registered agent: ${agent.getName()} (${agentId})`, LogLevel.INFO, {
      capabilities: agent.getCapabilities(),
      type: agent.getType?.() || 'unknown'
    });
  }
  
  /**
   * Get an agent by ID
   */
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }
  
  /**
   * Get all registered agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agents by capability
   */
  getAgentsByCapability(capability: AgentCapability): Agent[] {
    return this.getAllAgents().filter(agent => 
      agent.hasCapability(capability)
    );
  }
  
  /**
   * Get agents by status
   */
  getAgentsByStatus(status: AgentStatus): Agent[] {
    return this.getAllAgents().filter(agent => 
      agent.getStatus() === status
    );
  }
  
  /**
   * Remove an agent from the registry
   */
  unregisterAgent(id: string): boolean {
    const agent = this.agents.get(id);
    if (!agent) {
      return false;
    }
    
    this.agents.delete(id);
    this.logActivity(`Unregistered agent: ${agent.getName()} (${id})`, LogLevel.INFO);
    return true;
  }
  
  /**
   * Generate a new unique agent ID
   */
  generateAgentId(): string {
    return `agent_${uuidv4()}`;
  }
  
  /**
   * Get agent statistics
   */
  getAgentStats(): {
    total: number;
    byStatus: Record<AgentStatus, number>;
    byCapability: Partial<Record<AgentCapability, number>>;
  } {
    const stats = {
      total: this.agents.size,
      byStatus: {
        [AgentStatus.IDLE]: 0,
        [AgentStatus.INITIALIZING]: 0,
        [AgentStatus.WORKING]: 0,
        [AgentStatus.PAUSED]: 0,
        [AgentStatus.ERROR]: 0,
        [AgentStatus.TERMINATED]: 0
      },
      byCapability: {} as Partial<Record<AgentCapability, number>>
    };
    
    // Count by status and capability
    for (const agent of this.agents.values()) {
      // Count by status
      const status = agent.getStatus();
      stats.byStatus[status]++;
      
      // Count by capability
      for (const capability of agent.getCapabilities()) {
        stats.byCapability[capability] = (stats.byCapability[capability] || 0) + 1;
      }
    }
    
    return stats;
  }
  
  /**
   * Log activity to the storage system
   */
  private async logActivity(message: string, level: LogLevel, details?: any): Promise<void> {
    try {
      await storage.createLog({
        level,
        category: LogCategory.SYSTEM,
        message: `[AgentRegistry] ${message}`,
        details: details ? JSON.stringify(details) : null,
        source: 'agent-registry',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'registry']
      });
    } catch (error) {
      console.error('Failed to log agent registry activity:', error);
    }
  }
}

// Export singleton instance
export const agentRegistry = AgentRegistry.getInstance();