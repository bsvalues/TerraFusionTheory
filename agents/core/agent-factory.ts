/**
 * Agent Factory
 * 
 * This module provides a factory for creating different types of agents
 * with their required configurations and tools.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentCapability, AgentConfig } from '../interfaces/agent-interface';
import { GenericAgent } from './agent-base';
import { MCPAgent, MCPAgentConfig } from '../implementations/mcp-agent';
import { toolRegistry } from './tool-registry';
import { registerMCPTool } from '../tools/mcp';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';

/**
 * Agent types available for creation
 */
export enum AgentType {
  GENERIC = 'generic',
  MCP = 'mcp',
  REAL_ESTATE = 'real_estate',
  DEVELOPER = 'developer',
  ANALYTICS = 'analytics'
}

/**
 * Agent factory for creating and managing different types of agents
 */
export class AgentFactory {
  private static instance: AgentFactory;
  private agents: Map<string, Agent> = new Map();
  private initialized = false;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }
  
  /**
   * Initialize the agent factory and register all tools
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Register all available tools
      this.registerDefaultTools();
      
      this.initialized = true;
      this.logActivity('Agent factory initialized', LogLevel.INFO);
    } catch (error) {
      this.logActivity('Failed to initialize agent factory', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Create a new agent of the specified type
   */
  public async createAgent(type: AgentType, config: Partial<AgentConfig> = {}): Promise<Agent> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const id = config.id || uuidv4();
    let agent: Agent;
    
    try {
      switch (type) {
        case AgentType.GENERIC:
          agent = new GenericAgent(id, this.createGenericAgentConfig(config));
          break;
          
        case AgentType.MCP:
          agent = new MCPAgent(id, this.createMCPAgentConfig(config));
          break;
          
        case AgentType.REAL_ESTATE:
          agent = new MCPAgent(id, this.createRealEstateAgentConfig(config));
          break;
          
        case AgentType.DEVELOPER:
          agent = new MCPAgent(id, this.createDeveloperAgentConfig(config));
          break;
          
        case AgentType.ANALYTICS:
          agent = new MCPAgent(id, this.createAnalyticsAgentConfig(config));
          break;
          
        default:
          throw new Error(`Unknown agent type: ${type}`);
      }
      
      // Initialize the agent
      await agent.initialize();
      
      // Store the agent in the registry
      this.agents.set(id, agent);
      
      this.logActivity(`Created agent of type ${type}`, LogLevel.INFO, {
        agentId: id,
        agentName: agent.getName(),
        capabilities: agent.getCapabilities()
      });
      
      return agent;
    } catch (error) {
      this.logActivity(`Failed to create agent of type ${type}`, LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error),
        agentId: id
      });
      throw error;
    }
  }
  
  /**
   * Get an agent by ID
   */
  public getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }
  
  /**
   * Get all registered agents
   */
  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Remove an agent from the registry
   */
  public async removeAgent(id: string): Promise<boolean> {
    const agent = this.agents.get(id);
    if (!agent) {
      return false;
    }
    
    try {
      // Stop the agent if it's running
      await agent.stop();
      
      // Remove from registry
      this.agents.delete(id);
      
      this.logActivity(`Removed agent`, LogLevel.INFO, { agentId: id });
      
      return true;
    } catch (error) {
      this.logActivity(`Failed to remove agent`, LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error),
        agentId: id
      });
      
      return false;
    }
  }
  
  /**
   * Create a configuration for a generic agent
   */
  private createGenericAgentConfig(config: Partial<AgentConfig>): AgentConfig {
    return {
      name: config.name || 'Generic Agent',
      description: config.description || 'A general-purpose agent',
      capabilities: config.capabilities || [
        AgentCapability.TEXT_GENERATION,
        AgentCapability.TEXT_UNDERSTANDING
      ],
      tools: config.tools || [],
      maxConcurrentTasks: config.maxConcurrentTasks || 5,
      defaultTimeout: config.defaultTimeout || 60000,
      autoRestart: config.autoRestart || false,
      memory: config.memory || { useVectorMemory: false },
      ...config
    };
  }
  
  /**
   * Create a configuration for an MCP agent
   */
  private createMCPAgentConfig(config: Partial<MCPAgentConfig>): MCPAgentConfig {
    const mcpConfig: MCPAgentConfig = {
      name: config.name || 'MCP Agent',
      description: config.description || 'An agent with Model Control Protocol capabilities',
      capabilities: config.capabilities || [
        AgentCapability.TEXT_GENERATION,
        AgentCapability.TEXT_UNDERSTANDING,
        AgentCapability.REASONING,
        AgentCapability.TOOL_USE
      ],
      tools: config.tools || ['mcp'],
      maxConcurrentTasks: config.maxConcurrentTasks || 5,
      defaultTimeout: config.defaultTimeout || 60000,
      autoRestart: config.autoRestart || false,
      memory: config.memory || { useVectorMemory: true },
      mcp: {
        defaultModel: 'gpt-4-turbo',
        temperature: 0.7,
        ...config.mcp
      },
      promptTemplates: config.promptTemplates || {},
      ...config
    };
    
    return mcpConfig;
  }
  
  /**
   * Create a configuration for a real estate agent
   */
  private createRealEstateAgentConfig(config: Partial<MCPAgentConfig>): MCPAgentConfig {
    return {
      ...this.createMCPAgentConfig(config),
      name: config.name || 'Real Estate Agent',
      description: config.description || 'An agent specialized in real estate analysis and market insights',
      capabilities: config.capabilities || [
        AgentCapability.TEXT_GENERATION,
        AgentCapability.TEXT_UNDERSTANDING,
        AgentCapability.REASONING,
        AgentCapability.TOOL_USE,
        AgentCapability.REAL_ESTATE_ANALYSIS,
        AgentCapability.MARKET_PREDICTION,
        AgentCapability.GIS_DATA_PROCESSING,
        AgentCapability.DOCUMENT_ANALYSIS,
        AgentCapability.VECTOR_SEARCH
      ],
      tools: config.tools || ['mcp'],
      mcp: {
        defaultModel: 'gpt-4-turbo',
        temperature: 0.5,
        ...config.mcp
      }
    };
  }
  
  /**
   * Create a configuration for a developer agent
   */
  private createDeveloperAgentConfig(config: Partial<MCPAgentConfig>): MCPAgentConfig {
    return {
      ...this.createMCPAgentConfig(config),
      name: config.name || 'Developer Agent',
      description: config.description || 'An agent specialized in software development and code generation',
      capabilities: config.capabilities || [
        AgentCapability.TEXT_GENERATION,
        AgentCapability.TEXT_UNDERSTANDING,
        AgentCapability.REASONING,
        AgentCapability.TOOL_USE,
        AgentCapability.CODE_GENERATION,
        AgentCapability.CODE_UNDERSTANDING,
        AgentCapability.PLANNING,
        AgentCapability.VECTOR_SEARCH
      ],
      tools: config.tools || ['mcp'],
      mcp: {
        defaultModel: 'gpt-4-turbo',
        temperature: 0.3, // Lower temperature for coding tasks
        ...config.mcp
      }
    };
  }
  
  /**
   * Create a configuration for an analytics agent
   */
  private createAnalyticsAgentConfig(config: Partial<MCPAgentConfig>): MCPAgentConfig {
    return {
      ...this.createMCPAgentConfig(config),
      name: config.name || 'Analytics Agent',
      description: config.description || 'An agent specialized in data analysis and visualization',
      capabilities: config.capabilities || [
        AgentCapability.TEXT_GENERATION,
        AgentCapability.TEXT_UNDERSTANDING,
        AgentCapability.REASONING,
        AgentCapability.TOOL_USE,
        AgentCapability.DATA_VISUALIZATION,
        AgentCapability.VECTOR_SEARCH
      ],
      tools: config.tools || ['mcp'],
      mcp: {
        defaultModel: 'gpt-4-turbo',
        temperature: 0.2, // Lower temperature for analytical tasks
        ...config.mcp
      }
    };
  }
  
  /**
   * Register all default tools
   */
  private registerDefaultTools(): void {
    // Register the MCP tool
    toolRegistry.registerTool(registerMCPTool());
    
    // Register other tools as they're implemented
    // This would include tools for specific agent types
  }
  
  /**
   * Log activity to the storage system
   */
  private async logActivity(message: string, level: LogLevel, details?: any): Promise<void> {
    try {
      await storage.createLog({
        level,
        category: LogCategory.SYSTEM,
        message: `[AgentFactory] ${message}`,
        details: details ? JSON.stringify(details) : null,
        source: 'agent-factory',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'factory']
      });
    } catch (error) {
      console.error('Failed to log agent factory activity:', error);
    }
  }
}

// Export singleton instance
export const agentFactory = AgentFactory.getInstance();