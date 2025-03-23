/**
 * Agent Service
 * 
 * This service handles communication with the AI agents API endpoints.
 * It provides functions for interacting with property and technical specialists,
 * as well as collaborative queries and memory search.
 */

// Agent interfaces
export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  trainingData?: string[];
}

export interface AgentResponse {
  success: boolean;
  response: string;
  message?: string;
}

export interface AgentListResponse {
  success: boolean;
  agents: Agent[];
  message?: string;
}

export interface AgentDetailResponse {
  success: boolean;
  agent: Agent;
  message?: string;
}

export interface MemorySearchResult {
  id: string;
  text: string;
  score: number;
}

export interface MemorySearchResponse {
  success: boolean;
  results: MemorySearchResult[];
  message?: string;
}

// Type for context parameters
export interface QueryContext {
  currentSpecialist?: string;
  source?: string;
  [key: string]: any;
}

/**
 * Fetch a list of all available AI agents
 */
export async function listAgents(): Promise<Agent[]> {
  try {
    const response = await fetch('/api/agents');
    
    if (!response.ok) {
      throw new Error(`Failed to get agents list: ${response.statusText}`);
    }
    
    const data: AgentListResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get agents list');
    }
    
    return data.agents;
  } catch (error) {
    console.error('Error listing agents:', error);
    throw error;
  }
}

/**
 * Get details about the real estate agent
 */
export async function getRealEstateAgent(): Promise<Agent> {
  try {
    const response = await fetch('/api/agents/real-estate');
    
    if (!response.ok) {
      throw new Error(`Failed to get real estate agent: ${response.statusText}`);
    }
    
    const data: AgentDetailResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get real estate agent details');
    }
    
    return data.agent;
  } catch (error) {
    console.error('Error getting real estate agent:', error);
    throw error;
  }
}

/**
 * Get details about the developer agent
 */
export async function getDeveloperAgent(): Promise<Agent> {
  try {
    const response = await fetch('/api/agents/developer');
    
    if (!response.ok) {
      throw new Error(`Failed to get developer agent: ${response.statusText}`);
    }
    
    const data: AgentDetailResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get developer agent details');
    }
    
    return data.agent;
  } catch (error) {
    console.error('Error getting developer agent:', error);
    throw error;
  }
}

/**
 * Ask a question to the real estate agent
 */
export async function askRealEstateAgent(question: string, context?: QueryContext): Promise<string> {
  try {
    const response = await fetch('/api/agents/real-estate/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question,
        context: context || { source: 'user_chat' }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get answer from real estate agent: ${response.statusText}`);
    }
    
    const data: AgentResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get answer from real estate agent');
    }
    
    return data.response;
  } catch (error) {
    console.error('Error asking real estate agent:', error);
    throw error;
  }
}

/**
 * Ask a question to the developer agent
 */
export async function askDeveloperAgent(question: string, context?: QueryContext): Promise<string> {
  try {
    const response = await fetch('/api/agents/developer/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question,
        context: context || { source: 'user_chat' }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get answer from developer agent: ${response.statusText}`);
    }
    
    const data: AgentResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get answer from developer agent');
    }
    
    return data.response;
  } catch (error) {
    console.error('Error asking developer agent:', error);
    throw error;
  }
}

/**
 * Ask a collaborative question to both agents
 */
export async function askCollaborative(question: string, context?: QueryContext): Promise<string> {
  try {
    const response = await fetch('/api/agents/collaborate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question,
        context: context || { source: 'user_chat', enableCollaboration: true }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get collaborative answer: ${response.statusText}`);
    }
    
    const data: AgentResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get collaborative answer');
    }
    
    return data.response;
  } catch (error) {
    console.error('Error asking collaborative question:', error);
    throw error;
  }
}

/**
 * Search agent memory for relevant information
 */
export async function searchAgentMemory(query: string, limit: number = 5): Promise<MemorySearchResult[]> {
  try {
    const response = await fetch('/api/agents/memory/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query,
        limit
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search agent memory: ${response.statusText}`);
    }
    
    const data: MemorySearchResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to search agent memory');
    }
    
    return data.results;
  } catch (error) {
    console.error('Error searching agent memory:', error);
    throw error;
  }
}

// Default export for the entire service
const agentService = {
  listAgents,
  getRealEstateAgent,
  getDeveloperAgent,
  askRealEstateAgent,
  askDeveloperAgent,
  askCollaborative,
  searchAgentMemory
};

export default agentService;