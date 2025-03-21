/**
 * Agent System Initialization
 * 
 * This file initializes the entire agent system including tools, agents,
 * and services for the IntelligentEstate platform.
 */

import { LogCategory, LogLevel } from '../shared/schema';
import { storage } from '../server/storage';
import { toolRegistry } from './core/tool-registry';
import { agentRegistry } from './core/agent-registry';
import { agentCoordinator } from './core/agent-coordinator';
import { agentFactory, AgentType } from './core/agent-factory';
import { vectorMemory } from './memory/vector';
import { registerMCPTool } from './tools/mcp';
import { AgentCapability } from './interfaces/agent-interface';

/**
 * Initialize the entire agent system
 */
export async function initializeAgentSystem(): Promise<void> {
  try {
    console.log('Initializing Agent System...');
    
    // Log start
    await logSystemActivity('Agent system initialization started', LogLevel.INFO);
    
    // 1. Initialize the vector memory
    // Nothing to do here, it self-initializes on first use
    
    // 2. Register tools
    toolRegistry.registerTool(registerMCPTool());
    // Add other tool registrations as they are implemented
    
    // 3. Initialize the agent factory
    await agentFactory.initialize();
    
    // 4. Create and register system agents (lazy initialized, not started yet)
    // These will be started on-demand when needed
    
    // Log completion
    await logSystemActivity('Agent system initialized successfully', LogLevel.INFO);
    console.log('Agent System initialized successfully');
    
    return;
  } catch (error) {
    // Log failure
    await logSystemActivity('Agent system initialization failed', LogLevel.ERROR, {
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('Failed to initialize agent system:', error);
    throw error;
  }
}

/**
 * Create demo agents for testing and development
 */
export async function createDemoAgents(): Promise<void> {
  try {
    // Create a developer agent
    const developerAgent = await agentFactory.createAgent(AgentType.DEVELOPER, {
      name: 'Dev Assistant',
      description: 'Assists with development tasks and code generation',
    });
    
    // Create a real estate analytics agent
    const realEstateAgent = await agentFactory.createAgent(AgentType.REAL_ESTATE, {
      name: 'PropertyAnalyst',
      description: 'Analyzes real estate data and market trends',
    });
    
    // Add agents to coordinator
    agentCoordinator.addAgent(developerAgent);
    agentCoordinator.addAgent(realEstateAgent);
    
    // Log creation
    await logSystemActivity('Created demo agents', LogLevel.INFO, {
      agents: [
        {
          id: developerAgent.getId(),
          name: developerAgent.getName(),
          type: 'developer'
        },
        {
          id: realEstateAgent.getId(),
          name: realEstateAgent.getName(),
          type: 'real_estate'
        }
      ]
    });
  } catch (error) {
    await logSystemActivity('Failed to create demo agents', LogLevel.ERROR, {
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('Failed to create demo agents:', error);
  }
}

/**
 * Get a real estate agent instance
 */
export async function getRealEstateAgent(): Promise<any> {
  // Find an existing real estate agent
  const existingAgents = agentRegistry.getAgentsByCapability(AgentCapability.REAL_ESTATE_ANALYSIS);
  if (existingAgents.length > 0) {
    return existingAgents[0];
  }
  
  // Create a new one if none exists
  const agent = await agentFactory.createAgent(AgentType.REAL_ESTATE, {
    name: 'PropertyAnalyst',
    description: 'Analyzes real estate data and market trends',
  });
  
  // Register with coordinator
  agentCoordinator.addAgent(agent);
  
  return agent;
}

/**
 * Get a developer agent instance
 */
export async function getDeveloperAgent(): Promise<any> {
  // Find an existing developer agent
  const existingAgents = agentRegistry.getAgentsByCapability(AgentCapability.CODE_GENERATION);
  if (existingAgents.length > 0) {
    return existingAgents[0];
  }
  
  // Create a new one if none exists
  const agent = await agentFactory.createAgent(AgentType.DEVELOPER, {
    name: 'Dev Assistant',
    description: 'Assists with development tasks and code generation',
  });
  
  // Register with coordinator
  agentCoordinator.addAgent(agent);
  
  return agent;
}

/**
 * Shutdown the agent system
 */
export async function shutdownAgentSystem(): Promise<void> {
  try {
    console.log('Shutting down Agent System...');
    
    // Log start
    await logSystemActivity('Agent system shutdown started', LogLevel.INFO);
    
    // Get all agents from registry
    const agents = agentRegistry.getAllAgents();
    
    // Stop all agents
    for (const agent of agents) {
      try {
        await agent.stop();
      } catch (error) {
        console.error(`Failed to stop agent ${agent.getId()}:`, error);
      }
    }
    
    // Shutdown vector memory to persist if needed
    vectorMemory.shutdown();
    
    // Log completion
    await logSystemActivity('Agent system shutdown completed', LogLevel.INFO);
    console.log('Agent System shutdown completed');
  } catch (error) {
    // Log failure
    await logSystemActivity('Agent system shutdown failed', LogLevel.ERROR, {
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('Failed to shutdown agent system:', error);
  }
}

/**
 * Log activity to the storage system
 */
async function logSystemActivity(message: string, level: LogLevel, details?: any): Promise<void> {
  try {
    await storage.createLog({
      level,
      category: LogCategory.SYSTEM,
      message: `[AgentSystem] ${message}`,
      details: details ? JSON.stringify(details) : null,
      source: 'agent-system',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['agent', 'system']
    });
  } catch (error) {
    console.error('Failed to log agent system activity:', error);
  }
}