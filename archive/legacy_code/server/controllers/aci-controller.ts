/**
 * ACI (Agent-Computer Interface) Controller
 * 
 * Provides API endpoints for integrating with aipotheosis-labs ACI.dev platform
 * for enhanced agent capabilities.
 */

import { Request, Response } from 'express';
import { createErrorFromUnknown } from '../errors';
import { OptimizedLogger } from '../services/optimized-logging';
import axios from 'axios';

const logger = OptimizedLogger.getInstance();

/**
 * Request the ACI API key from the user
 */
export async function requestACIApiKey(req: Request, res: Response) {
  try {
    const { api_key } = req.body;
    
    if (!api_key) {
      return res.status(400).json({
        error: 'API key is required'
      });
    }
    
    // Store the API key as an environment variable
    process.env.ACI_API_KEY = api_key;
    
    logger.info({
      message: 'ACI API key received and stored',
      category: 'API',
      source: 'aci.controller'
    });
    
    // Test the API key by making a call to the ACI status endpoint
    const python = await import('child_process');
    const { spawn } = python;
    
    const testProcess = spawn('python3', [
      '-c',
      `
import os
import sys
import json
from aci import ACI

os.environ['ACI_API_KEY'] = '${api_key}'

try:
    client = ACI()
    test = client.apps.search(limit=1)
    print(json.dumps({"status": "success", "valid": True}))
except Exception as e:
    print(json.dumps({"status": "error", "valid": False, "message": str(e)}))
      `
    ]);
    
    let outputData = '';
    let errorData = '';
    
    testProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });
    
    testProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    testProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error({
          message: `Error testing ACI API key: ${errorData}`,
          category: 'API',
          source: 'aci.controller'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to test ACI API key',
          details: errorData
        });
      }
      
      try {
        const result = JSON.parse(outputData.trim());
        
        if (result.valid) {
          return res.json({
            status: 'success',
            message: 'ACI API key is valid and stored'
          });
        } else {
          return res.status(400).json({
            status: 'error',
            message: 'ACI API key is invalid',
            details: result.message
          });
        }
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci.controller'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse test result',
          details: outputData
        });
      }
    });
  } catch (error) {
    const appError = createErrorFromUnknown(error);
    
    logger.error({
      message: `Error storing ACI API key: ${appError.message}`,
      category: 'API',
      source: 'aci.controller'
    });
    
    return res.status(500).json({
      error: 'Failed to store ACI API key'
    });
  }
}

/**
 * Enhance MCP execution with ACI tools
 * 
 * This function integrates ACI tools into our existing MCP execution flow.
 */
export async function enhancedMCPWithACI(req: Request, res: Response) {
  try {
    logger.info({
      message: 'Enhanced MCP execution with ACI request received',
      category: 'AI',
      source: 'aci.controller',
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
    
    // Default model configuration
    const model = options.model || 'gpt-3.5-turbo';
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const maxTokens = options.maxTokens || 1024;
    const tools = options.tools || [];
    const contextItems = options.contextItems || [];
    
    // Get ACI tools if requested
    let aciTools = [];
    if (options.includeACITools) {
      try {
        // Call our ACI integration to get tool schemas
        const response = await axios.get('http://localhost:5000/api/aci/tools');
        aciTools = response.data.tools || [];
        
        logger.info({
          message: `Loaded ${aciTools.length} ACI tools`,
          category: 'AI',
          source: 'aci.controller'
        });
      } catch (error) {
        logger.warn({
          message: `Failed to load ACI tools: ${error.message}`,
          category: 'AI',
          source: 'aci.controller'
        });
      }
    }
    
    // Combine all tools
    const allTools = [...tools, ...aciTools];
    
    // Ensure prompt is a string
    const promptStr = typeof prompt === 'string' ? prompt : String(prompt || '');
    const promptExcerpt = promptStr.length > 50 ? promptStr.substring(0, 50) + '...' : promptStr;
    
    // For demonstration purposes, we'll just mock the response
    // In a production environment, this would make an actual API call to a model provider
    const response = {
      result: `This is a simulated response from the Enhanced MCP+ACI tool using model ${model}.
Your prompt was: "${promptExcerpt}"
The response is generated with temperature=${temperature}.

MCP+ACI processing included:
- Context management: ${contextItems.length} items provided
- Tool integration: ${allTools.length} tools available (including ${aciTools.length} ACI tools)
- Token management: Limited to ${maxTokens} tokens

This is a placeholder response. In a production environment, this would be the 
actual response from an AI model with the requested parameters and tools, 
including access to 600+ external tool integrations via ACI.`,
      usage: {
        promptTokens: Math.floor(promptStr.length / 4),
        completionTokens: 150,
        totalTokens: Math.floor(promptStr.length / 4) + 150
      },
      metadata: {
        model,
        toolsUsed: allTools.length > 0 ? [allTools[0].name || allTools[0].function?.name] : [],
        processingTime: 850,
        timestamp: new Date().toISOString(),
        aciToolsCount: aciTools.length
      }
    };
    
    logger.info({
      message: 'Enhanced MCP+ACI execution completed successfully',
      category: 'AI',
      source: 'aci.controller',
      details: {
        userId: req.session.user?.id || null,
        model,
        responseLength: response.result.length,
        tokenUsage: response.usage,
        aciToolsCount: aciTools.length
      }
    });
    
    return res.json(response);
  } catch (error) {
    const appError = createErrorFromUnknown(error);
    
    logger.error({
      message: `Enhanced MCP+ACI execution failed: ${appError.message}`,
      category: 'AI',
      source: 'aci.controller',
      details: {
        userId: req.session.user?.id || null,
        error: appError
      }
    });
    
    return res.status(500).json({
      error: 'Enhanced MCP execution with ACI failed',
      message: appError.message
    });
  }
}

/**
 * Handle an ACI tool call from an agent
 */
export async function handleACIToolCall(req: Request, res: Response) {
  try {
    const { function_name, arguments: args } = req.body;
    
    if (!function_name) {
      return res.status(400).json({
        error: 'Function name is required'
      });
    }
    
    logger.info({
      message: `Handling ACI tool call: ${function_name}`,
      category: 'AI',
      source: 'aci.controller',
      details: {
        userId: req.session.user?.id || null,
        functionName: function_name,
        arguments: args
      }
    });
    
    try {
      // Call our ACI integration to handle the function call
      const response = await axios.post('http://localhost:5000/api/aci/call', {
        function_name,
        arguments: args
      });
      
      const result = response.data.result;
      
      logger.info({
        message: `ACI tool call successful: ${function_name}`,
        category: 'AI',
        source: 'aci.controller'
      });
      
      return res.json({
        status: 'success',
        result
      });
    } catch (error) {
      logger.error({
        message: `Error in ACI tool call: ${error.message}`,
        category: 'AI',
        source: 'aci.controller'
      });
      
      return res.status(500).json({
        status: 'error',
        message: `Failed to execute ACI tool call: ${error.message}`
      });
    }
  } catch (error) {
    const appError = createErrorFromUnknown(error);
    
    logger.error({
      message: `ACI tool call handling failed: ${appError.message}`,
      category: 'AI',
      source: 'aci.controller'
    });
    
    return res.status(500).json({
      error: 'Failed to handle ACI tool call',
      message: appError.message
    });
  }
}

/**
 * Search for ACI tools based on a natural language intent
 */
export async function searchACITools(req: Request, res: Response) {
  try {
    const { intent, limit = 10 } = req.body;
    
    if (!intent) {
      return res.status(400).json({
        error: 'Intent is required'
      });
    }
    
    logger.info({
      message: `Searching ACI tools for intent: ${intent}`,
      category: 'AI',
      source: 'aci.controller'
    });
    
    try {
      // Call our ACI integration to search for tools
      const response = await axios.post('http://localhost:5000/api/aci/search', {
        intent,
        limit
      });
      
      const functions = response.data.functions;
      
      logger.info({
        message: `Found ${functions.length} ACI tools for intent: ${intent}`,
        category: 'AI',
        source: 'aci.controller'
      });
      
      return res.json({
        status: 'success',
        count: functions.length,
        functions
      });
    } catch (error) {
      logger.error({
        message: `Error searching ACI tools: ${error.message}`,
        category: 'AI',
        source: 'aci.controller'
      });
      
      return res.status(500).json({
        status: 'error',
        message: `Failed to search ACI tools: ${error.message}`
      });
    }
  } catch (error) {
    const appError = createErrorFromUnknown(error);
    
    logger.error({
      message: `ACI tool search failed: ${appError.message}`,
      category: 'AI',
      source: 'aci.controller'
    });
    
    return res.status(500).json({
      error: 'Failed to search ACI tools',
      message: appError.message
    });
  }
}