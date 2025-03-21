/**
 * Tool Interface Definitions
 * 
 * This file defines the core interfaces, types, and enums used for agent tools
 * within the IntelligentEstate agent system.
 */

import { Agent, AgentCapability } from './agent-interface';

/**
 * Tool execution context provided to tools when they run
 */
export interface ToolContext {
  // Agent that is running the tool (may be null for system-initiated calls)
  agent?: Agent;
  
  // Agent context from the agent
  agentContext?: Record<string, any>;
  
  // Input parameters for the tool
  inputs: Record<string, any>;
  
  // Execution context/environment
  environment?: Record<string, any>;
  
  // Tool-specific metadata
  metadata?: Record<string, any>;
}

/**
 * Result of tool execution
 */
export interface ToolResult {
  // Whether the tool execution was successful
  success: boolean;
  
  // Result data if successful
  result?: any;
  
  // Error message if not successful
  error?: string;
  
  // Additional metadata about the execution
  metadata?: Record<string, any>;
}

/**
 * Tool definition interface
 */
export interface Tool {
  // Unique name of the tool
  name: string;
  
  // Human-readable description
  description: string;
  
  // Schema for the inputs
  inputSchema?: Record<string, any>;
  
  // Schema for the outputs
  outputSchema?: Record<string, any>;
  
  // Capabilities required to use this tool
  requiredCapabilities: AgentCapability[];
  
  // Execute the tool
  execute: (context: ToolContext) => Promise<ToolResult>;
  
  // Validate inputs against schema (optional)
  validateInputs?: (inputs: Record<string, any>) => boolean;
}

/**
 * Tool registry interface
 */
export interface ToolRegistry {
  // Register a new tool
  registerTool(tool: Tool): void;
  
  // Get a tool by name
  getTool(name: string): Tool | undefined;
  
  // Get all registered tools
  getAllTools(): Tool[];
  
  // Get tools that require specific capabilities
  getToolsForCapabilities(capabilities: AgentCapability[]): Tool[];
  
  // Remove a tool from the registry
  unregisterTool(name: string): boolean;
}