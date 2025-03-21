/**
 * Agent System Demonstration
 * 
 * This file demonstrates the capabilities of the agent system by creating
 * agents and having them perform tasks.
 */

import { AgentCapability } from './interfaces/agent-interface';
import { AgentType } from './core/agent-factory'; 
import { agentFactory } from './core/agent-factory';
import { agentRegistry } from './core/agent-registry';
import { agentCoordinator } from './core/agent-coordinator';
import { toolRegistry } from './core/tool-registry';
import { Tool } from './interfaces/tool-interface';

/**
 * Run a demonstration of the agent system
 */
export async function runAgentDemo() {
  console.log('--------------------------------------');
  console.log('Starting Agent System Demonstration');
  console.log('--------------------------------------');

  try {
    // Step 1: List all registered tools
    console.log('\n--- Available Tools ---');
    const tools = toolRegistry.getAllTools();
    tools.forEach(tool => {
      // Using the tool interface properties
      console.log(`- ${tool.id}: ${tool.description}`);
    });

    // Step 2: Create a developer agent
    console.log('\n--- Creating Developer Agent ---');
    const developerAgent = await agentFactory.createAgent(AgentType.DEVELOPER, {
      name: 'CodeCraftsman',
      description: 'A skilled developer agent that can generate, review, and debug code',
      specializations: ['frontend', 'backend', 'database'],
      preferredLanguages: ['javascript', 'typescript', 'python'],
      defaultStyle: 'detailed'
    });
    
    console.log(`Created developer agent: ${developerAgent.getName()} (${developerAgent.getId()})`);
    console.log(`Capabilities: ${developerAgent.getCapabilities().join(', ')}`);

    // Step 3: Create a real estate agent
    console.log('\n--- Creating Real Estate Agent ---');
    const realEstateAgent = await agentFactory.createAgent(AgentType.REAL_ESTATE, {
      name: 'PropertyPro',
      description: 'A real estate expert agent that can analyze markets and provide property valuations',
      regions: ['pacific_northwest', 'southwest', 'northeast'],
      propertyTypes: ['residential', 'commercial', 'investment'],
      dataSourcePreference: 'both'
    });
    
    console.log(`Created real estate agent: ${realEstateAgent.getName()} (${realEstateAgent.getId()})`);
    console.log(`Capabilities: ${realEstateAgent.getCapabilities().join(', ')}`);

    // Step 4: Register agents with the coordinator
    // Add agents one by one instead of using registerAgents
    agentCoordinator.addAgent(developerAgent);
    agentCoordinator.addAgent(realEstateAgent);
    console.log('\n--- Registered Agents with Coordinator ---');
    
    // Mock the task assignment since the actual method might not be implemented yet
    console.log('\n--- Simulating Task Assignment to Developer Agent ---');
    console.log('Task: Answer a question about JavaScript vs TypeScript');
    console.log('Question: What are the key differences between JavaScript and TypeScript?');
    console.log('Context: Considering switching a project from JavaScript to TypeScript');
    
    console.log('\n--- Simulating Task Assignment to Real Estate Agent ---');
    console.log('Task: Answer a question about property values');
    console.log('Question: What factors affect property values in urban areas?');
    console.log('Context: Researching investment opportunities in urban areas');

    // Step 7: Wait for tasks to complete 
    console.log('\n--- Waiting for Task Results (Mock Demo) ---');
    console.log('For this demo, we\'re not actually executing the tasks through AI models');
    console.log('In a real implementation, the agents would process these tasks using the MCP tool');
    console.log('and return results after interacting with AI models');

    // Step 8: Show coordinator capabilities
    console.log('\n--- Agent Coordinator Capabilities ---');
    console.log('The agent coordinator can:');
    console.log('- Route tasks to the most appropriate agent based on capabilities');
    console.log('- Orchestrate multi-agent workflows');
    console.log('- Handle agent-to-agent communication');
    console.log('- Monitor agent health and performance');
    
    // Step 9: Find agents by capability
    console.log('\n--- Finding Agents by Capability ---');
    const codeAgents = agentRegistry.getAgentsByCapability(AgentCapability.CODE_GENERATION);
    console.log(`Agents with CODE_GENERATION capability: ${codeAgents.map(agent => agent.getName()).join(', ')}`);
    
    const marketAgents = agentRegistry.getAgentsByCapability(AgentCapability.MARKET_PREDICTION);
    console.log(`Agents with MARKET_PREDICTION capability: ${marketAgents.map(agent => agent.getName()).join(', ')}`);

    // Step 10: Show agent-to-agent communication (simulated)
    console.log('\n--- Agent-to-Agent Communication (Simulated) ---');
    console.log('Developer Agent → Coordinator → Real Estate Agent:');
    console.log('"I need market data for a real estate visualization dashboard"');
    
    console.log('\nReal Estate Agent → Coordinator → Developer Agent:');
    console.log('"Here\'s the market data structure and sample data for your dashboard"');

    // Conclusion
    console.log('\n--------------------------------------');
    console.log('Agent System Demonstration Complete');
    console.log('--------------------------------------');
    console.log('The agent system provides a flexible framework for creating specialized AI agents');
    console.log('that can use tools, work together, and leverage their unique capabilities');
    console.log('to solve complex problems.');
    
  } catch (error) {
    console.error('Error during agent demo:', error);
  }
}

// This check isn't needed since we'll be importing this function
// from elsewhere rather than running it directly as a script
// runAgentDemo().catch(console.error);