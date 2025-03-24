/**
 * useAgent Hook
 * 
 * Custom React hooks for working with the agent system and MCP.
 * These hooks wrap the agent service with proper React Query integration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAgents, 
  getAgentById, 
  askValuationAgent, 
  askDeveloperAgent,
  initiateAgentCollaboration,
  searchAgentMemory,
  executeMCP,
  assignAgentTask,
  getAgentTasks,
  getAgentTask,
  type Agent,
  type AgentQuestion,
  type AgentResponse,
  type AgentTask,
  type AgentMemoryEntry,
  type MCPRequest,
  type MCPResponse
} from '@/services/agent.service';

/**
 * Hook to get all available agents
 */
export function useAgents() {
  return useQuery({
    queryKey: ['/api/agents'],
    queryFn: () => getAgents()
  });
}

/**
 * Hook to get details about a specific agent
 * @param id Agent ID
 */
export function useAgentById(id: string) {
  return useQuery({
    queryKey: ['/api/agents', id],
    queryFn: () => getAgentById(id),
    enabled: !!id
  });
}

/**
 * Hook for asking questions to the valuation agent
 */
export function useAskValuationAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ question, context }: AgentQuestion) => 
      askValuationAgent(question, context),
    onSuccess: () => {
      // Optionally invalidate relevant queries when a new question is asked
      queryClient.invalidateQueries({ queryKey: ['/api/agents/valuation'] });
    }
  });
}

/**
 * Hook for asking questions to the developer agent
 */
export function useAskDeveloperAgent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ question, context }: AgentQuestion) => 
      askDeveloperAgent(question, context),
    onSuccess: () => {
      // Optionally invalidate relevant queries when a new question is asked
      queryClient.invalidateQueries({ queryKey: ['/api/agents/developer'] });
    }
  });
}

/**
 * Hook for initiating agent collaboration
 */
export function useAgentCollaboration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ question, context }: AgentQuestion) => 
      initiateAgentCollaboration(question, context),
    onSuccess: () => {
      // Optionally invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    }
  });
}

/**
 * Hook for searching agent memory
 */
export function useSearchAgentMemory() {
  return useMutation({
    mutationFn: ({ 
      query, 
      agentId, 
      limit 
    }: { 
      query: string; 
      agentId?: string; 
      limit?: number 
    }) => searchAgentMemory(query, agentId, limit)
  });
}

/**
 * Hook for using the MCP tool
 */
export function useMCP() {
  return useMutation({
    mutationFn: ({ prompt, options }: MCPRequest) => 
      executeMCP(prompt, options)
  });
}

/**
 * Hook for getting tasks for a specific agent
 * @param agentId The ID of the agent
 */
export function useAgentTasks(agentId: string) {
  return useQuery({
    queryKey: ['/api/agents', agentId, 'tasks'],
    queryFn: () => getAgentTasks(agentId),
    enabled: !!agentId
  });
}

/**
 * Hook for getting a specific task
 * @param agentId The ID of the agent
 * @param taskId The ID of the task
 */
export function useAgentTask(agentId: string, taskId: string) {
  return useQuery({
    queryKey: ['/api/agents', agentId, 'tasks', taskId],
    queryFn: () => getAgentTask(agentId, taskId),
    enabled: !!agentId && !!taskId
  });
}

/**
 * Hook for assigning a task to an agent
 */
export function useAssignAgentTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      agentId, 
      taskType, 
      data 
    }: { 
      agentId: string; 
      taskType: string; 
      data: Record<string, any> 
    }) => assignAgentTask(agentId, taskType, data),
    onSuccess: (_, variables) => {
      // Invalidate tasks query for the specific agent
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agents', variables.agentId, 'tasks'] 
      });
    }
  });
}