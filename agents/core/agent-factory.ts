/**
 * Agent Factory
 * 
 * This file implements the agent factory which creates and configures
 * different types of agents.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentCapability, AgentConfig } from '../interfaces/agent-interface';
import { agentRegistry } from './agent-registry';

/**
 * Types of agents that can be created
 */
export enum AgentType {
  DEVELOPER = 'developer',
  REAL_ESTATE = 'real_estate',
  ANALYTICS = 'analytics',
  DOCUMENT = 'document',
  GENERAL = 'general',
  COORDINATOR = 'coordinator'
}

/**
 * Agent factory that creates and initializes agents of different types
 */
class AgentFactory {
  private initialized = false;
  private agentConstructors: Record<AgentType, (id: string, config: AgentConfig) => Promise<Agent>> = {} as any;
  
  /**
   * Initialize the agent factory
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Agent factory already initialized');
      return;
    }
    
    console.log('Initializing agent factory...');
    
    // Register agent constructors
    // These are placeholder implementations until we create the actual agent classes
    
    this.agentConstructors[AgentType.DEVELOPER] = async (id, config) => {
      // Placeholder developer agent
      return {
        ...this.createBaseAgent(id, {
          ...config,
          capabilities: [...(config.capabilities || []), AgentCapability.CODE_GENERATION, AgentCapability.CODE_UNDERSTANDING]
        }),
        getType: () => AgentType.DEVELOPER,
        useTool: async () => ({ success: false, error: new Error('Not implemented') }),
        processTask: async () => {},
        initialize: async () => {}
      };
    };
    
    this.agentConstructors[AgentType.REAL_ESTATE] = async (id, config) => {
      // Placeholder real estate agent
      return {
        ...this.createBaseAgent(id, {
          ...config,
          capabilities: [...(config.capabilities || []), AgentCapability.REAL_ESTATE_ANALYSIS, AgentCapability.MARKET_PREDICTION]
        }),
        getType: () => AgentType.REAL_ESTATE,
        useTool: async () => ({ success: false, error: new Error('Not implemented') }),
        processTask: async () => {},
        initialize: async () => {}
      };
    };
    
    this.agentConstructors[AgentType.ANALYTICS] = async (id, config) => {
      // Placeholder analytics agent
      return {
        ...this.createBaseAgent(id, {
          ...config,
          capabilities: [...(config.capabilities || []), AgentCapability.DATA_VISUALIZATION, AgentCapability.REASONING]
        }),
        getType: () => AgentType.ANALYTICS,
        useTool: async () => ({ success: false, error: new Error('Not implemented') }),
        processTask: async () => {},
        initialize: async () => {}
      };
    };
    
    this.agentConstructors[AgentType.DOCUMENT] = async (id, config) => {
      // Placeholder document agent
      return {
        ...this.createBaseAgent(id, {
          ...config,
          capabilities: [...(config.capabilities || []), AgentCapability.DOCUMENT_ANALYSIS, AgentCapability.TEXT_UNDERSTANDING]
        }),
        getType: () => AgentType.DOCUMENT,
        useTool: async () => ({ success: false, error: new Error('Not implemented') }),
        processTask: async () => {},
        initialize: async () => {}
      };
    };
    
    this.agentConstructors[AgentType.GENERAL] = async (id, config) => {
      // Placeholder general purpose agent
      return {
        ...this.createBaseAgent(id, {
          ...config,
          capabilities: [...(config.capabilities || []), AgentCapability.TEXT_GENERATION, AgentCapability.TEXT_UNDERSTANDING]
        }),
        getType: () => AgentType.GENERAL,
        useTool: async () => ({ success: false, error: new Error('Not implemented') }),
        processTask: async () => {},
        initialize: async () => {}
      };
    };
    
    this.agentConstructors[AgentType.COORDINATOR] = async (id, config) => {
      // Placeholder coordinator agent
      return {
        ...this.createBaseAgent(id, {
          ...config,
          capabilities: [...(config.capabilities || []), AgentCapability.MULTI_AGENT_COORDINATION, AgentCapability.PLANNING]
        }),
        getType: () => AgentType.COORDINATOR,
        useTool: async () => ({ success: false, error: new Error('Not implemented') }),
        processTask: async () => {},
        initialize: async () => {}
      };
    };
    
    this.initialized = true;
    console.log('Agent factory initialized');
  }
  
  /**
   * Create an agent of the specified type
   */
  public async createAgent(type: AgentType, config: Partial<AgentConfig>): Promise<Agent> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const constructor = this.agentConstructors[type];
    if (!constructor) {
      throw new Error(`Unknown agent type: ${type}`);
    }
    
    // Generate a unique ID for the agent if not provided
    const agentId = config.id || `agent_${type}_${uuidv4()}`;
    
    // Create default capabilities array if not provided
    const capabilities = config.capabilities || [];
    
    // Create the agent with the specified configuration
    const agent = await constructor(agentId, {
      name: config.name || `${type} Agent`,
      description: config.description || `Agent of type ${type}`,
      capabilities,
      ...config
    });
    
    // Register the agent in the registry
    agentRegistry.registerAgent(agent);
    
    return agent;
  }
  
  /**
   * Create a base agent with common functionality
   */
  private createBaseAgent(id: string, config: AgentConfig): Partial<Agent> {
    // This creates a base agent that will be extended by the specific agent types
    return {
      getId: () => id,
      getName: () => config.name,
      getDescription: () => config.description,
      getCapabilities: () => config.capabilities || [],
      hasCapability: (capability: AgentCapability) => config.capabilities?.includes(capability) || false,
      getAvailableTools: () => config.tools || [],
      canUseTool: (toolName: string) => config.tools?.includes(toolName) || false
    };
  }
}

/**
 * Singleton instance of the agent factory
 */
export const agentFactory = new AgentFactory();