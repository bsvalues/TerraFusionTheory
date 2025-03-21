/**
 * Tool Interface
 * 
 * This file defines the core interfaces, types, and enums used for tools
 * within the IntelligentEstate agent system.
 */

/**
 * Result from a tool execution
 */
export interface ToolResult {
  success: boolean;
  result?: any;
  error?: Error | string;
  metadata?: Record<string, any>;
}

/**
 * Parameter definition for a tool
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
}

/**
 * Tool interface
 */
export interface Tool {
  // Basic properties
  name: string;
  description: string;
  category?: string;
  version?: string;
  
  // Parameter definitions
  parameters: ToolParameter[];
  
  // Execution function
  execute(args: Record<string, any>): Promise<ToolResult>;
  
  // Optional methods
  validate?(args: Record<string, any>): boolean | { valid: boolean; errors?: string[] };
  getUsage?(): string;
  getExamples?(): Array<{ description: string; args: Record<string, any> }>;
  
  // MCP specific properties
  mcp?: {
    isModelControlled?: boolean;
    modelProvider?: string;
    modelName?: string;
    apiEndpoint?: string;
  };
}

/**
 * Create a new tool with the given properties
 */
export function createTool(
  name: string,
  description: string,
  parameters: ToolParameter[],
  executeFn: (args: Record<string, any>) => Promise<ToolResult>,
  options?: {
    category?: string;
    version?: string;
    validate?: (args: Record<string, any>) => boolean | { valid: boolean; errors?: string[] };
    getUsage?: () => string;
    getExamples?: () => Array<{ description: string; args: Record<string, any> }>;
    mcp?: {
      isModelControlled?: boolean;
      modelProvider?: string;
      modelName?: string;
      apiEndpoint?: string;
    };
  }
): Tool {
  return {
    name,
    description,
    category: options?.category,
    version: options?.version,
    parameters,
    execute: executeFn,
    validate: options?.validate,
    getUsage: options?.getUsage,
    getExamples: options?.getExamples,
    mcp: options?.mcp
  };
}