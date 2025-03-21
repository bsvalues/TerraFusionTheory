/**
 * Model Control Protocol (MCP) Tool
 * 
 * This file implements a tool for interacting with language models using
 * the Model Control Protocol.
 */

import { v4 as uuidv4 } from 'uuid';
import { createTool, Tool, ToolParameter, ToolResult } from '../interfaces/tool-interface';

/**
 * Register the MCP tool
 */
export function registerMCPTool(): Tool {
  const parameters: ToolParameter[] = [
    {
      name: 'model',
      type: 'string',
      description: 'The model to use for the MCP request',
      required: true,
    },
    {
      name: 'prompt',
      type: 'string',
      description: 'The prompt or query to send to the model',
      required: true,
    },
    {
      name: 'temperature',
      type: 'number',
      description: 'Controls randomness. Lower values make responses more deterministic',
      required: false,
      default: 0.7,
    },
    {
      name: 'max_tokens',
      type: 'number',
      description: 'Maximum number of tokens to generate',
      required: false,
      default: 1000,
    },
    {
      name: 'stop',
      type: 'array',
      description: 'Sequences where the model should stop generating further tokens',
      required: false,
      default: [],
    },
    {
      name: 'system_message',
      type: 'string',
      description: 'System message to provide context to the model',
      required: false,
      default: 'You are a helpful AI assistant.',
    },
    {
      name: 'function_calling',
      type: 'boolean',
      description: 'Whether to enable function calling in the model',
      required: false,
      default: false,
    }
  ];

  return createTool(
    'mcp',
    'Model Control Protocol - Execute controlled operations with AI models',
    parameters,
    async (args) => {
      try {
        // Extract parameters
        const {
          model,
          prompt,
          temperature = 0.7,
          max_tokens = 1000,
          stop = [],
          system_message = 'You are a helpful AI assistant.',
          function_calling = false
        } = args;

        // For now, this is a placeholder implementation that just echoes back the input
        // In a real implementation, this would call the appropriate AI model API
        console.log(`[MCP Tool] Executing with model: ${model}`);
        console.log(`[MCP Tool] Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);

        // Mock result for now
        const mockResult = {
          id: `mcp-${uuidv4()}`,
          model,
          prompt,
          response: `This is a placeholder response for: "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"`,
          metadata: {
            temperature,
            max_tokens,
            system_message: system_message.substring(0, 50) + (system_message.length > 50 ? '...' : ''),
            function_calling,
            timestamp: new Date().toISOString()
          }
        };

        return {
          success: true,
          result: mockResult,
          metadata: {
            tool: 'mcp',
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        console.error('[MCP Tool] Error:', error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          metadata: {
            tool: 'mcp',
            timestamp: new Date().toISOString()
          }
        };
      }
    },
    {
      category: 'ai',
      version: '1.0.0',
      validate: (args) => {
        // Basic validation
        if (!args.model) {
          return { valid: false, errors: ['Model is required'] };
        }
        if (!args.prompt) {
          return { valid: false, errors: ['Prompt is required'] };
        }
        return true;
      },
      getUsage: () => {
        return `
MCP Tool Usage:
--------------
The Model Control Protocol (MCP) tool provides a standardized interface for interacting with
AI language models in a controlled manner. It supports various parameters to customize the
behavior of the model.

Required Parameters:
- model: The model to use for the MCP request (e.g., "gpt-4", "claude-2")
- prompt: The prompt or query to send to the model

Optional Parameters:
- temperature: Controls randomness (default: 0.7)
- max_tokens: Maximum number of tokens to generate (default: 1000)
- stop: Sequences where the model should stop generating (default: [])
- system_message: System message for context (default: "You are a helpful AI assistant.")
- function_calling: Whether to enable function calling (default: false)

Example:
mcp.execute({
  model: "gpt-4",
  prompt: "Explain the concept of recursion in programming",
  temperature: 0.5,
  max_tokens: 500,
  system_message: "You are a programming tutor. Explain concepts clearly and provide examples."
})
`;
      },
      getExamples: () => {
        return [
          {
            description: 'Basic question',
            args: {
              model: 'gpt-4',
              prompt: 'What is the capital of France?'
            }
          },
          {
            description: 'Code generation with custom settings',
            args: {
              model: 'gpt-4',
              prompt: 'Write a JavaScript function to find the factorial of a number',
              temperature: 0.2,
              system_message: 'You are a senior JavaScript developer. Write clean, well-documented code with error handling.'
            }
          },
          {
            description: 'Creative writing with high temperature',
            args: {
              model: 'claude-2',
              prompt: 'Write a short poem about artificial intelligence',
              temperature: 0.9,
              max_tokens: 200,
              system_message: 'You are a creative poet with a deep understanding of technology and humanity.'
            }
          }
        ];
      },
      mcp: {
        isModelControlled: true,
        modelProvider: 'openai',
        modelName: 'gpt-4'
      }
    }
  );
}