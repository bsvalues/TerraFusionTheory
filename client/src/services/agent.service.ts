/**
 * Agent Service
 * 
 * This service provides functions to interact with the agent system and MCP.
 */

import { apiRequest } from '@/lib/queryClient';

// Query context for agent requests
export interface QueryContext {
  currentSpecialist?: string;
  source?: string;
  enableCollaboration?: boolean;
  [key: string]: any;
}

// Agent Types and Interfaces

export interface Agent {
  id: string;
  name: string;
  type: string;
  description: string;
  version: string;
  capabilities: string[];
  tools: string[];
  icon?: string;
  status: 'idle' | 'busy' | 'error';
  memory: {
    totalEntries: number;
    lastAccessed?: string;
  };
  lastActive?: string;
}

export interface AgentQuestion {
  question: string;
  context?: Record<string, any>;
}

export interface AgentResponse {
  id: string;
  response: string;
  metadata: {
    responseTime: number;
    toolsUsed?: string[];
    confidence?: number;
    sources?: string[];
    timestamp: string;
  };
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  data: Record<string, any>;
  result?: Record<string, any>;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AgentMemoryEntry {
  id: string;
  content: string;
  metadata: {
    type: string;
    source: string;
    timestamp: string;
    tags?: string[];
  };
  embedding?: number[]; // Vector embedding if available
}

export interface MCPRequest {
  prompt: string;
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
    contextItems?: {
      id: string;
      content: string;
      type?: string;
    }[];
  };
}

export interface MCPResponse {
  result: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    model: string;
    toolsUsed?: string[];
    processingTime: number;
    timestamp: string;
  };
}

// Agent API Functions

/**
 * Get all available agents
 */
export async function getAgents(): Promise<Agent[]> {
  return apiRequest('/api/agents');
}

/**
 * Get a specific agent by ID
 */
export async function getAgentById(id: string): Promise<Agent> {
  return apiRequest(`/api/agents/${id}`);
}

/**
 * Ask a question to the valuation agent
 */
export async function askValuationAgent(
  question: string,
  context?: Record<string, any>
): Promise<AgentResponse> {
  return apiRequest('/api/agents/valuation/ask', {
    method: 'POST',
    data: { question, context }
  });
}

/**
 * Ask a question to the developer agent (returns full AgentResponse)
 */
export async function askDeveloperAgent(
  question: string,
  context?: Record<string, any> | QueryContext
): Promise<AgentResponse> {
  return apiRequest('/api/agents/developer/ask', {
    method: 'POST',
    data: { question, context }
  });
}

/**
 * Initiate collaboration between agents on a complex question
 */
export async function initiateAgentCollaboration(
  question: string,
  context?: Record<string, any>
): Promise<AgentResponse> {
  return apiRequest('/api/agents/collaborate', {
    method: 'POST',
    data: { question, context }
  });
}

/**
 * Search vector memory for relevant information
 */
export async function searchAgentMemory(
  query: string,
  agentId?: string,
  limit: number = 5
): Promise<AgentMemoryEntry[]> {
  return apiRequest('/api/agents/memory/search', {
    method: 'POST',
    data: { query, agentId, limit }
  });
}

/**
 * Execute an operation with the MCP tool
 */
export async function executeMCP(
  prompt: string,
  options?: MCPRequest['options']
): Promise<MCPResponse> {
  // Use the new MCP endpoint
  return apiRequest('/api/mcp/execute', {
    method: 'POST',
    data: { prompt, options }
  });
}

/**
 * Assign a task to an agent
 */
export async function assignAgentTask(
  agentId: string,
  taskType: string,
  data: Record<string, any>
): Promise<AgentTask> {
  return apiRequest(`/api/agents/${agentId}/tasks`, {
    method: 'POST',
    data: { type: taskType, data }
  });
}

/**
 * Get all tasks for an agent
 */
export async function getAgentTasks(agentId: string): Promise<AgentTask[]> {
  return apiRequest(`/api/agents/${agentId}/tasks`);
}

/**
 * Get a specific task
 */
export async function getAgentTask(
  agentId: string,
  taskId: string
): Promise<AgentTask> {
  return apiRequest(`/api/agents/${agentId}/tasks/${taskId}`);
}

/**
 * Ask the real estate agent a question (returns string response only)
 */
export async function askRealEstateAgent(
  question: string,
  context?: QueryContext
): Promise<string> {
  const response: any = await apiRequest('/api/agents/real-estate/ask', {
    method: 'POST',
    data: { question, context }
  });
  return response.response;
}

/**
 * Ask a question using collaborative mode with both agents (returns string response only)
 */
export async function askCollaborative(
  question: string,
  context?: QueryContext
): Promise<string> {
  const response: any = await apiRequest('/api/agents/collaborate', {
    method: 'POST',
    data: { question, context }
  });
  return response.response;
}

// Bundle all functions into a default export for backward compatibility
const agentService = {
  getAgents,
  getAgentById,
  askValuationAgent,
  initiateAgentCollaboration,
  searchAgentMemory,
  executeMCP,
  assignAgentTask,
  getAgentTasks,
  getAgentTask,
  askRealEstateAgent,
  askDeveloperAgent,
  askCollaborative
};

export default agentService;