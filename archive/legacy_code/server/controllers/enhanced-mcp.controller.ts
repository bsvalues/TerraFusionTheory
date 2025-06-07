/**
 * Enhanced MCP (Model Control Protocol) Controller
 * 
 * Provides advanced API endpoints for using the MCP tool with full context
 * management, hybrid response generation, and enhanced memory integration.
 */

import { Request, Response } from 'express';
import { createErrorFromUnknown } from '../errors';
import { OptimizedLogger } from '../services/optimized-logging';
import { toolRegistry } from '../../agents/core/tool-registry';

const logger = OptimizedLogger.getInstance();

/**
 * Execute an enhanced MCP operation with context-aware response generation
 * 
 * @param req.body.prompt The prompt to send to the model
 * @param req.body.options Configuration options for the model and context
 */
export async function executeEnhancedMCP(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    logger.info({
      message: 'Enhanced MCP execution request received',
      category: 'AI',
      source: 'enhanced-mcp.controller',
      details: {
        userId: req.session.user?.id || null,
        promptLength: req.body.prompt?.length || 0,
        options: req.body.options
      }
    });

    // Extract parameters from request
    const { prompt, options = {} } = req.body;

    // Validate required parameters
    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Get the MCP tool from the tool registry
    const mcpTool = toolRegistry.getTool('mcp');

    if (!mcpTool) {
      return res.status(500).json({
        error: 'MCP tool not available'
      });
    }

    // Default model configuration with our enhanced options
    const model = options.model || 'gpt-4';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options.max_tokens || options.maxTokens || 1000;
    const systemMessage = options.system_message || options.systemMessage || 'You are a helpful assistant with expertise in real estate.';
    
    // Vector memory and context options
    const useVectorMemory = options.use_vector_memory !== undefined ? options.use_vector_memory : true;
    const memoryQuery = options.memory_query || null;
    const contextIntegration = options.context_integration || 'smart';

    // Advanced memory options (with defaults if not provided)
    const memoryOptions = options.memory_options || {
      limit: 3,
      threshold: 0.3,
      diversityFactor: 0.5,
      includeSources: true,
      timeWeighting: {
        enabled: true,
        halfLifeDays: 30,
        maxBoost: 1.5
      }
    };

    // Prepare arguments for the MCP tool
    const toolArgs = {
      model,
      prompt,
      temperature,
      max_tokens: maxTokens,
      system_message: systemMessage,
      use_vector_memory: useVectorMemory,
      memory_query: memoryQuery,
      memory_options: memoryOptions,
      context_integration: contextIntegration,
      cache: options.cache !== undefined ? options.cache : true
    };

    // Execute the MCP tool with our enhanced arguments
    const result = await mcpTool.execute(toolArgs);
    
    if (!result.success) {
      throw result.error || new Error('Failed to execute MCP tool');
    }

    // Track performance metrics
    const executionTime = Date.now() - startTime;
    
    // Format the response with additional metadata
    const responseText = typeof result.result.response === 'string' 
      ? result.result.response 
      : String(result.result.response || '');
      
    const response = {
      result: responseText,
      enhancedResponse: true,
      hybridGeneration: result.result.metadata?.hybrid || false,
      vectorContext: {
        used: result.result.metadata?.enhanced || false,
        sources: result.result.metadata?.contextSources || 0
      },
      usage: {
        promptTokens: Math.floor(prompt.length / 4), // Rough estimate
        responseTokens: Math.floor(responseText.length / 4), // Rough estimate
        totalTokens: Math.floor((prompt.length + responseText.length) / 4) // Rough estimate
      },
      metadata: {
        model,
        executionTime,
        generationTime: result.result.metadata?.ms,
        totalTime: executionTime,
        timestamp: new Date().toISOString()
      }
    };

    logger.info({
      message: 'Enhanced MCP execution completed successfully',
      category: 'AI',
      source: 'enhanced-mcp.controller',
      details: {
        userId: req.session.user?.id || null,
        model,
        responseLength: response.result.length,
        executionTime,
        hybridGeneration: response.hybridGeneration,
        vectorContextUsed: response.vectorContext.used
      }
    });

    return res.json(response);
  } catch (error) {
    const appError = createErrorFromUnknown(error);
    const executionTime = Date.now() - startTime;
    
    logger.error({
      message: `Enhanced MCP execution failed: ${appError.message}`,
      category: 'AI',
      source: 'enhanced-mcp.controller',
      details: {
        error: appError,
        executionTime
      }
    });

    return res.status(appError.statusCode).json({
      error: appError.message,
      metadata: {
        executionTime
      }
    });
  }
}

/**
 * Get context information about a prompt without generating a response
 * Useful for debugging and understanding what context would be used
 * 
 * @param req.body.prompt The prompt to analyze for context
 * @param req.body.options Configuration options for context retrieval
 */
export async function getContextForPrompt(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    // Extract parameters from request
    const { prompt, options = {} } = req.body;

    // Validate required parameters
    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    // Get the MCP tool from the tool registry
    const mcpTool = toolRegistry.getTool('mcp');

    if (!mcpTool) {
      return res.status(500).json({
        error: 'MCP tool not available'
      });
    }

    // Vector memory options
    const memoryQuery = options.memory_query || prompt;
    
    // Advanced memory options (with defaults if not provided)
    const memoryOptions = options.memory_options || {
      limit: 5, // Get more context for analysis
      threshold: 0.25, // Lower threshold to see more potential matches
      diversityFactor: 0.7, // Higher diversity to see more varied context
      includeSources: true
    };

    // Prepare arguments for just the context retrieval
    // Note: We're using a direct import here for demonstration
    // In a real implementation, you might want to expose a method from the MCP tool
    const { vectorMemory } = require('../../agents/memory/vector');
    const results = await vectorMemory.search(memoryQuery, memoryOptions);

    // Format the context results
    const contextResults = results.map(result => {
      // Ensure text is a string
      const text = typeof result.entry.text === 'string' ? result.entry.text : String(result.entry.text || '');
      const textPreview = text.length > 300 ? `${text.substring(0, 300)}...` : text;
      
      return {
        text: textPreview,
        score: result.score,
        source: result.entry.metadata?.source || 'unknown',
        timestamp: result.entry.metadata?.timestamp || null
      };
    });

    // Track performance metrics
    const executionTime = Date.now() - startTime;
    
    logger.info({
      message: 'Context retrieval completed successfully',
      category: 'AI',
      source: 'enhanced-mcp.controller',
      details: {
        userId: req.session.user?.id || null,
        contextCount: contextResults.length,
        executionTime
      }
    });

    return res.json({
      prompt,
      contextResults,
      metadata: {
        executionTime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const appError = createErrorFromUnknown(error);
    const executionTime = Date.now() - startTime;
    
    logger.error({
      message: `Context retrieval failed: ${appError.message}`,
      category: 'AI',
      source: 'enhanced-mcp.controller',
      details: {
        error: appError,
        executionTime
      }
    });

    return res.status(appError.statusCode).json({
      error: appError.message,
      metadata: {
        executionTime
      }
    });
  }
}

/**
 * Get statistics about the MCP system's performance and usage
 */
export async function getMCPStats(req: Request, res: Response) {
  try {
    // In a real implementation, we would gather real statistics
    // For now, we'll return mock statistics
    const stats = {
      requests: {
        total: 125,
        successful: 118,
        failed: 7
      },
      performance: {
        averageResponseTime: 1250, // ms
        p95ResponseTime: 2200, // ms
        p99ResponseTime: 3500 // ms
      },
      memory: {
        vectorStoreEntries: 20,
        cacheHitRate: 0.32,
        averageEmbeddingTime: 78 // ms
      },
      models: {
        gpt4: {
          requests: 78,
          averageTokens: 850
        },
        gpt35turbo: {
          requests: 47,
          averageTokens: 720
        }
      },
      contextUsage: {
        enhancedContextRate: 0.75,
        averageContextItems: 2.3,
        hybridResponseRate: 0.62
      },
      timestamp: new Date().toISOString()
    };

    return res.json(stats);
  } catch (error) {
    const appError = createErrorFromUnknown(error);
    
    logger.error({
      message: `Failed to get MCP stats: ${appError.message}`,
      category: 'AI',
      source: 'enhanced-mcp.controller',
      details: {
        error: appError
      }
    });

    return res.status(appError.statusCode).json({
      error: appError.message
    });
  }
}