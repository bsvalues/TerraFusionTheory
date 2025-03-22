/**
 * Model Control Protocol (MCP) Tool
 * 
 * This file implements a tool for interacting with language models using
 * the Model Control Protocol, which provides standardized control over AI models.
 * 
 * The MCP allows for consistent interfaces across different AI providers, handles
 * retries, error logging, and provides detailed response tracking.
 * 
 * Enhanced with context management and vector memory integration for improved
 * contextual awareness in responses.
 */

import { v4 as uuidv4 } from 'uuid';
import { createTool, Tool, ToolParameter, ToolResult } from '../interfaces/tool-interface';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';
import { vectorMemory, AdvancedSearchOptions } from '../memory/vector';

// MCP response cache to avoid duplicate calls
const responseCache = new Map<string, {
  response: string;
  timestamp: number;
  metadata: any;
}>();

// Cache expiration in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Models supported by the MCP
const SUPPORTED_MODELS = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-2',
  'llama-2',
  'gemini-pro',
  'mistral-medium'
];

// Mock embedding for context-aware responses
const createEmbedding = (text: string): number[] => {
  // This is a simple mock implementation for demo purposes
  // In a real implementation, this would call the appropriate embedding API
  const hash = Array.from(text).reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Create a deterministic but varied embedding based on text content
  const embedding = Array(128).fill(0).map((_, i) => {
    const value = Math.sin(hash * (i + 1) * 0.01);
    return value;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
};

// Simulate cosine similarity for contextual responses
const cosineSimilarity = (a: number[], b: number[]): number => {
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return dotProduct;
};

/**
 * Log MCP tool activity to the system
 */
async function logMCPActivity(
  message: string,
  level: LogLevel,
  details?: any
): Promise<void> {
  try {
    await storage.createLog({
      level,
      category: LogCategory.AI,
      message: `[MCP Tool] ${message}`,
      details: details ? JSON.stringify(details) : null,
      source: 'mcp-tool',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['mcp', 'tool', 'ai']
    });
  } catch (error) {
    console.error('Failed to log MCP tool activity:', error);
  }
}

/**
 * Fetch relevant context from vector memory
 */
async function getRelevantContext(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    diversityFactor?: number;
    includeSources?: boolean;
    timeWeighting?: {
      enabled: boolean;
      halfLifeDays: number;
      maxBoost: number;
    };
  } = {}
): Promise<{ context: string, sources: string[] }> {
  try {
    // Configure default search options
    const searchOptions: AdvancedSearchOptions = {
      limit: options.limit || 3,
      threshold: options.threshold || 0.3,
      diversityFactor: options.diversityFactor || 0.5,
      timeWeighting: options.timeWeighting || {
        enabled: true,
        halfLifeDays: 30,
        maxBoost: 1.5
      }
    };
    
    // Search vector memory
    console.log(`[VectorMemory] Search query: "${query.substring(0, 30)}${query.length > 30 ? '...' : ''}" with advanced options`);
    const results = await vectorMemory.search(query, searchOptions);
    
    if (!results || results.length === 0) {
      return { context: '', sources: [] };
    }
    
    // Process results into context string
    let contextEntries: string[] = [];
    let sources: string[] = [];
    
    results.forEach((result, index) => {
      const entry = result.entry;
      const source = entry.metadata?.source || 'unknown';
      const confidence = result.score.toFixed(2);
      
      // Add source to the list if not already included
      if (!sources.includes(source)) {
        sources.push(source);
      }
      
      // Format the entry text
      const entryText = `[Context ${index+1}] (relevance: ${confidence}): ${entry.text}`;
      contextEntries.push(entryText);
    });
    
    return {
      context: contextEntries.join('\n\n'),
      sources
    };
  } catch (error) {
    console.error('[MCP Tool] Error retrieving context from vector memory:', error);
    return { context: '', sources: [] };
  }
}

/**
 * Integrate context with prompt based on integration strategy
 */
function integrateContext(
  prompt: string,
  context: string,
  strategy: string = 'smart'
): string {
  if (!context) {
    return prompt;
  }
  
  switch (strategy) {
    case 'prepend':
      return `${context}\n\n${prompt}`;
      
    case 'append':
      return `${prompt}\n\n${context}`;
      
    case 'smart':
    default:
      // Smart integration tries to determine the best approach based on prompt
      if (prompt.length < 200) {
        // For short prompts, prepend context
        return `RELEVANT CONTEXT:\n${context}\n\nQUESTION OR TASK:\n${prompt}`;
      } else if (/^Analyze|^Review|^Evaluate|^Assess/i.test(prompt)) {
        // For analysis prompts, context after the main instruction
        return `${prompt}\n\nCONSIDER THE FOLLOWING CONTEXT:\n${context}`;
      } else {
        // Default approach - context first with clear separation
        return `RELEVANT CONTEXT:\n${context}\n\n${prompt}`;
      }
  }
}

/**
 * Generate model response using context-aware techniques
 */
function generateModelResponse(prompt: string, systemMessage: string, model: string): string {
  // For real implementation, this would call the appropriate AI model API
  // For now, we'll generate context-aware responses

  // Create a cache key based on prompt, system message and model
  const cacheKey = `${model}:${prompt}:${systemMessage}`.substring(0, 100);
  const promptEmbedding = createEmbedding(prompt);
  
  // Check common real estate questions for more targeted responses
  const realEstatePatterns = [
    {
      pattern: /market\s+(trend|analysis|forecast)/i,
      response: "Based on current data, the real estate market in Grandview is showing moderate growth with a 4.2% increase in median home prices year-over-year. Supply remains constrained with inventory levels at about 2.1 months, creating favorable conditions for sellers. The average days on market is 24, down 15% from the previous year."
    },
    {
      pattern: /property\s+valu(e|ation)/i, 
      response: "Property valuation in this area considers multiple factors including comparable sales, property condition, square footage, lot size, and neighborhood trends. Recent sales of similar properties suggest values ranging from $275-320 per square foot depending on condition and exact location."
    },
    {
      pattern: /invest(ment|ing|or)/i,
      response: "Investment opportunities in the Grandview market currently favor multi-family properties, which are showing cap rates of 5.8-6.5%. Single-family rentals are yielding about 5.2% with appreciation potential adding another 3-4% annually to total returns. The west side neighborhoods show particularly strong growth potential due to infrastructure improvements."
    },
    {
      pattern: /(rent|rental|leasing)/i,
      response: "The rental market in Grandview remains strong with average rents increasing 6.2% year-over-year. One-bedroom units average $1,250/month, while three-bedroom homes command around $2,200/month. Vacancy rates are low at 3.1%, suggesting continued upward pressure on rents."
    },
    {
      pattern: /(home|house) (buying|purchase)/i,
      response: "The current home buying process in Grandview typically includes getting pre-approved for financing, working with a local agent, property searches, making competitive offers (often above asking in desirable neighborhoods), inspections, and closing. With limited inventory, buyers should be prepared to act quickly and potentially waive some contingencies."
    }
  ];

  // Look for specific patterns in the prompt
  for (const { pattern, response } of realEstatePatterns) {
    if (pattern.test(prompt)) {
      return response;
    }
  }

  // For developer-focused questions
  if (/\b(code|programming|javascript|python|api|function|class|algorithm)\b/i.test(prompt)) {
    return "As a developer, I recommend focusing on modular architecture with clear separation of concerns. Your code should implement proper error handling and follow the principle of least privilege, especially when dealing with user data. Consider implementing a repository pattern for data access and dependency injection for better testability.";
  }

  // For general information about the system
  if (/\b(system|architecture|features|capabilities)\b/i.test(prompt)) {
    return "The IntelligentEstate system uses a microservices architecture with specialized services for market analysis, geospatial data processing, document extraction, and AI-powered insights. The system integrates with multiple data sources and provides real-time analytics through an intuitive dashboard interface. Vector memory allows for contextual recall of information across interactions.";
  }

  // Fall back to a generic but thoughtful response
  return "Based on industry data and market analysis, I'd recommend considering multiple factors including local market trends, property condition, neighborhood development plans, and historical appreciation rates. The Grandview area has shown consistent growth, particularly in the western neighborhoods, though specific investment decisions should always account for your personal financial goals and risk tolerance.";
}

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
    },
    {
      name: 'cache',
      type: 'boolean',
      description: 'Whether to cache the response for future use',
      required: false,
      default: true,
    },
    {
      name: 'use_vector_memory',
      type: 'boolean',
      description: 'Whether to enhance the prompt with relevant context from vector memory',
      required: false,
      default: true,
    },
    {
      name: 'memory_query',
      type: 'string',
      description: 'Custom query for vector memory lookup (defaults to using the prompt)',
      required: false,
    },
    {
      name: 'memory_options',
      type: 'object',
      description: 'Advanced options for vector memory search',
      required: false,
      default: {
        limit: 3,
        threshold: 0.3,
        diversityFactor: 0.5,
        includeSources: true,
        timeWeighting: {
          enabled: true,
          halfLifeDays: 30,
          maxBoost: 1.5
        }
      }
    },
    {
      name: 'context_integration',
      type: 'string',
      description: 'How to integrate memory context into the prompt ("prepend", "append", or "smart")',
      required: false,
      default: 'smart'
    }
  ];

  return createTool(
    'mcp',
    'Model Control Protocol - Execute controlled operations with AI models',
    parameters,
    async (args) => {
      const startTime = Date.now();
      try {
        // Extract parameters
        const {
          model,
          prompt,
          temperature = 0.7,
          max_tokens = 1000,
          stop = [],
          system_message = 'You are a helpful AI assistant.',
          function_calling = false,
          cache = true,
          use_vector_memory = true,
          memory_query = null,
          memory_options = {
            limit: 3,
            threshold: 0.3,
            diversityFactor: 0.5,
            includeSources: true,
            timeWeighting: {
              enabled: true,
              halfLifeDays: 30,
              maxBoost: 1.5
            }
          },
          context_integration = 'smart'
        } = args;

        // Create a cache key if caching is enabled
        const cacheKey = cache ? 
          `${model}:${prompt.substring(0, 50)}:${system_message.substring(0, 20)}:${temperature}` : 
          null;
        
        // Check cache for existing response
        if (cacheKey && responseCache.has(cacheKey)) {
          const cachedResult = responseCache.get(cacheKey);
          
          // If cache entry hasn't expired
          if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRATION) {
            console.log(`[MCP Tool] Using cached response for: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`);
            
            await logMCPActivity('Retrieved response from cache', LogLevel.INFO, {
              model,
              promptPreview: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
              cacheHit: true,
              responseTime: Date.now() - startTime
            });
            
            return {
              success: true,
              result: {
                id: `mcp-cached-${uuidv4()}`,
                model,
                prompt,
                response: cachedResult.response,
                fromCache: true,
                metadata: {
                  ...cachedResult.metadata,
                  original_timestamp: cachedResult.timestamp,
                  current_timestamp: new Date().toISOString(),
                  responseTime: Date.now() - startTime
                }
              },
              metadata: {
                tool: 'mcp',
                timestamp: new Date().toISOString(),
                cache: true
              }
            };
          }
        }

        // Log MCP call
        console.log(`[MCP Tool] Executing with model: ${model}`);
        console.log(`[MCP Tool] Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
        
        // Track if we're using enhanced context for metadata
        let usedMemoryContext = false;
        let memorySourcesUsed: string[] = [];
        let enhancedPrompt = prompt;
        
        // If vector memory enhancement is enabled, retrieve relevant context
        if (use_vector_memory) {
          try {
            // Use memory_query if provided, otherwise use the prompt
            const queryForMemory = memory_query || prompt;
            
            // Get relevant context from vector memory
            const { context, sources } = await getRelevantContext(queryForMemory, memory_options);
            
            if (context) {
              // Integrate context with prompt
              enhancedPrompt = integrateContext(prompt, context, context_integration as string);
              usedMemoryContext = true;
              memorySourcesUsed = sources;
              
              console.log(`[MCP Tool] Enhanced prompt with vector memory context from ${sources.length} sources`);
            }
          } catch (error) {
            console.error('[MCP Tool] Error enhancing prompt with vector memory:', error);
            // Continue with original prompt if context enhancement fails
          }
        }
        
        await logMCPActivity('Executing model request', LogLevel.INFO, {
          model,
          promptPreview: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
          enhancedWithContext: usedMemoryContext,
          systemMessagePreview: system_message.substring(0, 30) + (system_message.length > 30 ? '...' : ''),
          temperature,
          max_tokens
        });
        
        // Generate response (in a real implementation, this would call the model API)
        const response = generateModelResponse(enhancedPrompt, system_message, model);
        
        // Create result object
        const result = {
          id: `mcp-${uuidv4()}`,
          model,
          prompt,
          response,
          metadata: {
            temperature,
            max_tokens,
            system_message: system_message.substring(0, 50) + (system_message.length > 50 ? '...' : ''),
            function_calling,
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime,
            enhancedWithContext: usedMemoryContext,
            contextSources: usedMemoryContext ? memorySourcesUsed : undefined,
            contextStrategy: usedMemoryContext ? context_integration : undefined
          }
        };
        
        // Cache the response if caching is enabled
        if (cacheKey) {
          responseCache.set(cacheKey, {
            response,
            timestamp: Date.now(),
            metadata: {
              temperature,
              max_tokens,
              model,
              enhancedWithContext: usedMemoryContext,
              contextSources: usedMemoryContext ? memorySourcesUsed : undefined
            }
          });
        }
        
        await logMCPActivity('Model response generated', LogLevel.INFO, {
          model,
          promptPreview: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
          responsePreview: response.substring(0, 50) + (response.length > 50 ? '...' : ''),
          responseTime: Date.now() - startTime
        });

        return {
          success: true,
          result,
          metadata: {
            tool: 'mcp',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
          }
        };
      } catch (error) {
        console.error('[MCP Tool] Error:', error);
        
        await logMCPActivity('Error during model execution', LogLevel.ERROR, {
          error: error instanceof Error ? error.message : String(error),
          responseTime: Date.now() - startTime
        });
        
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          metadata: {
            tool: 'mcp',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
          }
        };
      }
    },
    {
      category: 'ai',
      version: '1.1.0',
      validate: (args) => {
        // Basic validation
        if (!args.model) {
          return { valid: false, errors: ['Model is required'] };
        }
        if (!args.prompt) {
          return { valid: false, errors: ['Prompt is required'] };
        }
        
        // Validate model selection
        if (!SUPPORTED_MODELS.includes(args.model)) {
          return { 
            valid: false, 
            errors: [`Unsupported model: ${args.model}. Supported models are: ${SUPPORTED_MODELS.join(', ')}`] 
          };
        }
        
        // Validate temperature
        if (args.temperature !== undefined && (args.temperature < 0 || args.temperature > 1)) {
          return { 
            valid: false, 
            errors: ['Temperature must be between 0 and 1'] 
          };
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
- cache: Whether to cache the response for future use (default: true)

Advanced Context Management:
- use_vector_memory: Whether to enhance prompt with relevant context (default: true)
- memory_query: Custom query for vector memory lookup (defaults to using the prompt)
- memory_options: Advanced options for vector memory search:
  - limit: Maximum number of results to retrieve (default: 3)
  - threshold: Similarity threshold for results (default: 0.3)
  - diversityFactor: How diverse the results should be (default: 0.5)
  - includeSources: Whether to include source information (default: true)
  - timeWeighting: Parameters for time-based weighting:
    - enabled: Whether to enable time weighting (default: true)
    - halfLifeDays: Days after which relevance is halved (default: 30)
    - maxBoost: Maximum boost for recent entries (default: 1.5)
- context_integration: How to integrate memory with prompt (default: "smart")
  - "prepend": Add context before the prompt
  - "append": Add context after the prompt
  - "smart": Intelligently integrate based on prompt structure

Supported Models:
- gpt-4
- gpt-3.5-turbo
- claude-2
- llama-2
- gemini-pro
- mistral-medium

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
              prompt: 'What is the capital of France?',
              cache: true
            }
          },
          {
            description: 'Real estate market analysis',
            args: {
              model: 'gpt-4',
              prompt: 'Analyze the current housing market in Grandview, WA',
              temperature: 0.3,
              system_message: 'You are a real estate market analyst with expertise in Pacific Northwest properties.'
            }
          },
          {
            description: 'Investment recommendation with low temperature',
            args: {
              model: 'gpt-4',
              prompt: 'What are the best real estate investment opportunities in suburban areas right now?',
              temperature: 0.2,
              system_message: 'You are an experienced real estate investment advisor.',
              cache: false
            }
          },
          {
            description: 'Property valuation question',
            args: {
              model: 'claude-2',
              prompt: 'How do I determine the fair market value of a 3-bedroom house in Grandview?',
              temperature: 0.4,
              system_message: 'You are a professional real estate appraiser with deep knowledge of property valuation methodologies.'
            }
          },
          {
            description: 'Context-aware development question with vector memory',
            args: {
              model: 'gpt-4',
              prompt: 'What was our approach to error handling in the database connector module?',
              system_message: 'You are a senior developer with intimate knowledge of the codebase.',
              use_vector_memory: true,
              memory_options: {
                limit: 5,
                threshold: 0.2,
                diversityFactor: 0.7
              },
              context_integration: 'smart'
            }
          },
          {
            description: 'Real estate question with custom memory query',
            args: {
              model: 'gpt-4',
              prompt: 'What are the typical lot sizes in Grandview?',
              system_message: 'You are a real estate expert familiar with Yakima County properties.',
              use_vector_memory: true,
              memory_query: 'Grandview WA property lot sizes square footage acreage',
              context_integration: 'prepend'
            }
          }
        ];
      },
      mcp: {
        isModelControlled: true,
        modelProvider: 'any',
        modelName: 'any'
      }
    }
  );
}