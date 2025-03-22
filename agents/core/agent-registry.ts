/**
 * Agent Registry
 * 
 * This file implements the agent registry which maintains a registry of all
 * agents and handles agent discovery and lookup.
 */

import { Agent, AgentCapability } from '../interfaces/agent-interface';

/**
 * Interface for the Agent Registry
 */
export interface IAgentRegistry {
  registerAgent(agent: Agent): void;
  unregisterAgent(agentId: string): boolean;
  getAgent(agentId: string): Agent | undefined;
  getAllAgents(): Agent[];
  getAgentsByCapability(capability: AgentCapability): Agent[];
  getAgentsByType(type: string): Agent[];
}

/**
 * Implementation of the Agent Registry
 */
class AgentRegistryImpl implements IAgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private capabilityIndex: Map<AgentCapability, Set<string>> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();
  
  /**
   * Register an agent with the registry
   */
  public registerAgent(agent: Agent): void {
    const agentId = agent.getId();
    
    // Check if agent is already registered
    if (this.agents.has(agentId)) {
      console.warn(`Agent with ID ${agentId} already registered`);
      return;
    }
    
    // Store the agent
    this.agents.set(agentId, agent);
    
    // Index by capabilities
    const capabilities = agent.getCapabilities();
    for (const capability of capabilities) {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, new Set());
      }
      this.capabilityIndex.get(capability)?.add(agentId);
    }
    
    // Index by type if available
    if (agent.getType) {
      const type = agent.getType();
      if (!this.typeIndex.has(type)) {
        this.typeIndex.set(type, new Set());
      }
      this.typeIndex.get(type)?.add(agentId);
    }
    
    console.log(`Agent registered: ${agentId} (${agent.getName()})`);
  }
  
  /**
   * Unregister an agent from the registry
   */
  public unregisterAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }
    
    // Remove from main store
    this.agents.delete(agentId);
    
    // Remove from capability index
    const capabilities = agent.getCapabilities();
    for (const capability of capabilities) {
      this.capabilityIndex.get(capability)?.delete(agentId);
      // Clean up empty sets
      if (this.capabilityIndex.get(capability)?.size === 0) {
        this.capabilityIndex.delete(capability);
      }
    }
    
    // Remove from type index if available
    if (agent.getType) {
      const type = agent.getType();
      this.typeIndex.get(type)?.delete(agentId);
      // Clean up empty sets
      if (this.typeIndex.get(type)?.size === 0) {
        this.typeIndex.delete(type);
      }
    }
    
    console.log(`Agent unregistered: ${agentId}`);
    return true;
  }
  
  /**
   * Get an agent by ID
   */
  public getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
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
    return Array.from(this.agents.values())
      .filter(agent => agent.getStatus() !== 'terminated' && agent.getStatus() !== 'error');
  }
  
  /**
   * Get agents by capability
   */
  public getAgentsByCapability(capability: AgentCapability): Agent[] {
    const agentIds = this.capabilityIndex.get(capability);
    if (!agentIds || agentIds.size === 0) {
      return [];
    }
    
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is Agent => agent !== undefined);
  }
  
  /**
   * Get agents by type
   */
  public getAgentsByType(type: string): Agent[] {
    const agentIds = this.typeIndex.get(type);
    if (!agentIds || agentIds.size === 0) {
      return [];
    }
    
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is Agent => agent !== undefined);
  }
}

/**
 * Singleton instance of the Agent Registry
 */
export const agentRegistry = new AgentRegistryImpl();