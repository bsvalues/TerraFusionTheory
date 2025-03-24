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
  COORDINATOR = 'coordinator',
  VALUATION = 'valuation'
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
    
    // Dynamically import the agent implementations to avoid circular dependencies
    const { createDeveloperAgent } = await import('../implementations/developer-agent');
    const { createRealEstateAgent } = await import('../implementations/real-estate-agent');
    const { ValuationAgent } = await import('../implementations/valuation-agent');
    
    // Register agent constructors with their concrete implementations
    
    this.agentConstructors[AgentType.DEVELOPER] = async (id, config) => {
      return await createDeveloperAgent({
        id,
        ...config,
        // Ensure developer-specific capabilities
        capabilities: [...(config.capabilities || []), 
          AgentCapability.CODE_GENERATION, 
          AgentCapability.CODE_UNDERSTANDING
        ]
      });
    };
    
    this.agentConstructors[AgentType.REAL_ESTATE] = async (id, config) => {
      return await createRealEstateAgent({
        id,
        ...config,
        // Ensure real estate-specific capabilities
        capabilities: [...(config.capabilities || []), 
          AgentCapability.REAL_ESTATE_ANALYSIS,
          AgentCapability.MARKET_PREDICTION
        ]
      });
    };
    
    // For now, we still have placeholder implementations for other agent types
    
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
    
    // Valuation agent constructor
    this.agentConstructors[AgentType.VALUATION] = async (id, config) => {
      // Create the valuation agent
      const valuationConfig = {
        ...config,
        // Ensure valuation-specific capabilities
        capabilities: [
          ...(config.capabilities || []), 
          AgentCapability.REAL_ESTATE_ANALYSIS,
          AgentCapability.REASONING,
          AgentCapability.TEXT_UNDERSTANDING,
          AgentCapability.TOOL_USE
        ]
      };
      
      // Return a new instance of ValuationAgent
      return new ValuationAgent(id, valuationConfig);
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