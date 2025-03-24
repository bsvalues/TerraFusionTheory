/**
 * Valuation Agent Creator
 * 
 * This file provides a convenient function to create and configure a valuation agent
 * for use in property valuation and appraisal tasks.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent } from '../interfaces/agent-interface';
import { ValuationAgent } from './valuation-agent';
import { DEFAULT_VALUATION_AGENT_CONFIG, ValuationAgentConfig } from '../types/valuation-agent';

/**
 * Create and configure a valuation agent with the provided options
 * 
 * @param options Configuration options for the valuation agent
 * @returns A configured ValuationAgent instance
 */
export async function createValuationAgent(options: Partial<ValuationAgentConfig> = {}): Promise<Agent> {
  // Generate a unique ID for the agent if not provided
  const id = options.id || `valuation_agent_${uuidv4()}`;
  
  // Merge with default configuration
  const config: ValuationAgentConfig = {
    ...DEFAULT_VALUATION_AGENT_CONFIG,
    ...options,
    tools: [...(DEFAULT_VALUATION_AGENT_CONFIG.tools || []), ...(options.tools || [])]
  };
  
  // Create the agent instance
  const agent = new ValuationAgent(id, config);
  
  // Initialize the agent
  await agent.initialize();
  
  return agent;
}