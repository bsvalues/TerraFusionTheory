/**
 * Agent Factory
 * 
 * This factory is responsible for creating instances of different types of agents
 * based on the requested agent type and configuration.
 */

import { 
  Agent, 
  AgentCapability, 
  AgentConfig, 
  AgentFactory as AgentFactoryInterface, 
  AgentType 
} from '../interfaces/agent-interface';

// Import the different agent type implementations
// These will be created in the next steps
import { RealEstateAgent } from '../types/real-estate-agent';
import { DeveloperAgent } from '../types/developer-agent';
import { AnalyticsAgent } from '../types/analytics-agent';

/**
 * Agent Factory implementation
 */
export class AgentFactory implements AgentFactoryInterface {
  // Singleton pattern
  private static instance: AgentFactory;
  
  // Private constructor for singleton
  private constructor() {}
  
  /**
   * Get the singleton instance of the factory
   */
  public static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }
  
  /**
   * Create a new agent of the specified type
   * 
   * @param type The type of agent to create
   * @param name Human-readable name for the agent
   * @param description Description of the agent's purpose
   * @param capabilities Optional set of capabilities the agent should have
   * @param config Optional configuration for the agent
   * @returns A new agent instance
   */
  public async createAgent(
    type: AgentType,
    name: string,
    description: string,
    capabilities: AgentCapability[] = [],
    config: AgentConfig = {}
  ): Promise<Agent> {
    // Create the agent based on the requested type
    switch (type) {
      case AgentType.REAL_ESTATE:
        return new RealEstateAgent(name, description, capabilities, config);
        
      case AgentType.DEVELOPER:
        return new DeveloperAgent(name, description, capabilities, config);
        
      case AgentType.ANALYTICS:
        return new AnalyticsAgent(name, description, capabilities, config);
      
      case AgentType.COORDINATOR:
        // Coordinator agent implementation will be added in the future
        throw new Error('Coordinator agent type not yet implemented');
      
      case AgentType.ASSISTANT:
        // Assistant agent implementation will be added in the future
        throw new Error('Assistant agent type not yet implemented');
      
      case AgentType.EXPERT:
        // Expert agent implementation will be added in the future
        throw new Error('Expert agent type not yet implemented');
      
      case AgentType.CUSTOM:
        // Custom agent implementation will be added in the future
        throw new Error('Custom agent type not yet implemented');
        
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
  
  /**
   * Get default capabilities for a specific agent type
   * 
   * @param type The agent type
   * @returns Array of default capabilities for that agent type
   */
  public getDefaultCapabilities(type: AgentType): AgentCapability[] {
    switch (type) {
      case AgentType.REAL_ESTATE:
        return [
          AgentCapability.CONVERSATION,
          AgentCapability.PROPERTY_ANALYSIS,
          AgentCapability.MARKET_ANALYSIS,
          AgentCapability.GEOSPATIAL_ANALYSIS,
        ];
        
      case AgentType.DEVELOPER:
        return [
          AgentCapability.CONVERSATION,
          AgentCapability.CODE_GENERATION,
          AgentCapability.CODE_REVIEW,
          AgentCapability.DEBUGGING,
          AgentCapability.DOCUMENTATION,
        ];
        
      case AgentType.ANALYTICS:
        return [
          AgentCapability.CONVERSATION,
          AgentCapability.DATA_ANALYSIS,
          AgentCapability.VISUALIZATION,
          AgentCapability.PREDICTION,
        ];
      
      case AgentType.COORDINATOR:
        return [
          AgentCapability.CONVERSATION,
          AgentCapability.AGENT_COORDINATION,
          AgentCapability.PLANNING,
        ];
      
      case AgentType.ASSISTANT:
        return [
          AgentCapability.CONVERSATION,
          AgentCapability.TEXT_GENERATION,
          AgentCapability.TOOL_USE,
        ];
      
      case AgentType.EXPERT:
        return [
          AgentCapability.CONVERSATION,
          AgentCapability.TEXT_GENERATION,
          AgentCapability.TOOL_USE,
          AgentCapability.LEARNING,
        ];
      
      case AgentType.CUSTOM:
        // Custom agents have no default capabilities
        return [];
        
      default:
        return [];
    }
  }
  
  /**
   * Get a default configuration for a specific agent type
   * 
   * @param type The agent type
   * @returns Default configuration for that agent type
   */
  public getDefaultConfig(type: AgentType): AgentConfig {
    // Common default configuration
    const baseConfig: AgentConfig = {
      maxHistoryLength: 100,
      maxMemoryItems: 1000,
      timeoutMs: 30000,
      autoSave: false,
      persistMemory: false,
    };
    
    // Add type-specific configuration
    switch (type) {
      case AgentType.REAL_ESTATE:
        return {
          ...baseConfig,
          model: 'gpt-4',
          tools: ['market-data', 'geospatial-analysis', 'property-valuation'],
        };
        
      case AgentType.DEVELOPER:
        return {
          ...baseConfig,
          model: 'gpt-4',
          tools: ['code-generator', 'code-analyzer', 'documentation-writer'],
        };
        
      case AgentType.ANALYTICS:
        return {
          ...baseConfig,
          model: 'gpt-4',
          tools: ['data-processor', 'chart-generator', 'predictive-modeling'],
        };
      
      default:
        return baseConfig;
    }
  }
}

// Export a singleton instance
export const agentFactory = AgentFactory.getInstance();