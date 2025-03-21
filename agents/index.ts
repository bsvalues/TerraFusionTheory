/**
 * IntelligentEstate Agent System
 * 
 * This module provides agent-based functionality for the IntelligentEstate platform.
 * Agents can work independently or collaboratively to perform various tasks related
 * to real estate analytics, software development, and data analysis.
 */

// Export core interfaces and types
export * from './interfaces/agent-interface';

// Export core components
export { BaseAgent } from './core/agent-base';
export { AgentFactory, agentFactory } from './core/agent-factory';
export { AgentRegistry, agentRegistry } from './core/agent-registry';
export { AgentCoordinator, agentCoordinator } from './core/agent-coordinator';

// Export agent implementations
export { RealEstateAgent } from './types/real-estate-agent';
export { DeveloperAgent } from './types/developer-agent';
export { AnalyticsAgent } from './types/analytics-agent';

/**
 * Initialize the agent system
 * 
 * This function initializes the agent system and creates default agents
 * for use in the application.
 */
export async function initializeAgentSystem(): Promise<void> {
  console.log('Initializing Agent System...');
  
  try {
    // Create default real estate agent
    const realEstateAgent = await agentFactory.createAgent(
      'real-estate', 
      'Property Advisor', 
      'Provides real estate analytics and property insights'
    );
    
    // Create default developer agent
    const developerAgent = await agentFactory.createAgent(
      'developer', 
      'Code Assistant', 
      'Assists with software development tasks'
    );
    
    // Create default analytics agent
    const analyticsAgent = await agentFactory.createAgent(
      'analytics', 
      'Data Analyst', 
      'Analyzes data and provides visualizations and insights'
    );
    
    // Initialize the agents
    await realEstateAgent.initialize();
    await developerAgent.initialize();
    await analyticsAgent.initialize();
    
    // Register the agents
    agentRegistry.registerAgent(realEstateAgent);
    agentRegistry.registerAgent(developerAgent);
    agentRegistry.registerAgent(analyticsAgent);
    
    // Add the agents to the coordinator
    agentCoordinator.addAgent(realEstateAgent);
    agentCoordinator.addAgent(developerAgent);
    agentCoordinator.addAgent(analyticsAgent);
    
    console.log('Agent System initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Agent System:', error);
    throw error;
  }
}