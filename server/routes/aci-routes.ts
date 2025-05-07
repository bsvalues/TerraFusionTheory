/**
 * ACI Integration Routes
 * 
 * Provides routes for integrating with aipotheosis-labs ACI.dev platform
 * to add 600+ tool integrations to our GAMA agents.
 */

import { Router } from 'express';
import { spawn } from 'child_process';
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { OptimizedLogger } from '../services/optimized-logging';

const logger = OptimizedLogger.getInstance();
const router = Router();

/**
 * Execute a Python script and return the result
 * 
 * @param scriptPath Path to the Python script
 * @param functionName Name of the function to call
 * @param args Arguments to pass to the function
 * @returns Promise with the result from the Python script
 */
async function executePythonFunction(scriptPath: string, functionName: string, args: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const process = spawn('python3', [
      '-c',
      `
import sys
import json
import importlib.util

# Import the module
spec = importlib.util.spec_from_file_location("aci_module", "${scriptPath}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# Parse input arguments
args = json.loads('${JSON.stringify(args)}')

# Call the specified function
result = getattr(module.aci_integration, "${functionName}")(**args)

# Return result as JSON
print(json.dumps(result))
      `
    ]);

    let outputData = '';
    let errorData = '';

    process.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${errorData}`));
      }

      try {
        const result = JSON.parse(outputData.trim());
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${outputData}`));
      }
    });
  });
}

/**
 * @route GET /api/aci/status
 * @description Check if ACI integration is initialized
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await executePythonFunction('./server/services/aci-integration.py', 'is_initialized');
    
    res.json({
      status: 'success',
      initialized: result
    });
  } catch (error) {
    logger.error({
      message: `Error checking ACI status: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to check ACI integration status'
    });
  }
}));

/**
 * @route GET /api/aci/tools
 * @description Get available ACI tools in JSON schema format
 */
router.get('/tools', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await executePythonFunction('./server/services/aci-integration.py', 'get_tools_json_schema');
    
    res.json({
      status: 'success',
      tools: result
    });
  } catch (error) {
    logger.error({
      message: `Error getting ACI tools: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get ACI tools'
    });
  }
}));

/**
 * @route POST /api/aci/search
 * @description Search for ACI functions based on intent
 */
router.post('/search', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { intent, limit = 10 } = req.body;
    
    if (!intent) {
      return res.status(400).json({
        status: 'error',
        message: 'Intent is required'
      });
    }
    
    const result = await executePythonFunction(
      './server/services/aci-integration.py', 
      'search_functions',
      { intent, limit }
    );
    
    res.json({
      status: 'success',
      count: result.length,
      functions: result
    });
  } catch (error) {
    logger.error({
      message: `Error searching ACI functions: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to search ACI functions'
    });
  }
}));

/**
 * @route POST /api/aci/execute
 * @description Execute an ACI function
 */
router.post('/execute', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { app_name, function_name, parameters = {} } = req.body;
    
    if (!app_name || !function_name) {
      return res.status(400).json({
        status: 'error',
        message: 'App name and function name are required'
      });
    }
    
    const result = await executePythonFunction(
      './server/services/aci-integration.py', 
      'execute_function',
      { app_name, function_name, parameters }
    );
    
    res.json({
      status: 'success',
      result
    });
  } catch (error) {
    logger.error({
      message: `Error executing ACI function: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to execute ACI function'
    });
  }
}));

/**
 * @route POST /api/aci/call
 * @description Handle a unified function call
 */
router.post('/call', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { function_name, arguments: args = {} } = req.body;
    
    if (!function_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Function name is required'
      });
    }
    
    const result = await executePythonFunction(
      './server/services/aci-integration.py', 
      'handle_function_call',
      { function_name, arguments: args }
    );
    
    res.json({
      status: 'success',
      result
    });
  } catch (error) {
    logger.error({
      message: `Error handling ACI function call: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to handle ACI function call'
    });
  }
}));

/**
 * @route GET /api/aci/apps
 * @description List available ACI apps
 */
router.get('/apps', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await executePythonFunction('./server/services/aci-integration.py', 'list_available_apps');
    
    res.json({
      status: 'success',
      count: result.length,
      apps: result
    });
  } catch (error) {
    logger.error({
      message: `Error listing ACI apps: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to list ACI apps'
    });
  }
}));

/**
 * @route POST /api/aci/configure
 * @description Configure real estate apps
 */
router.post('/configure', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await executePythonFunction('./server/services/aci-integration.py', 'configure_real_estate_apps');
    
    res.json(result);
  } catch (error) {
    logger.error({
      message: `Error configuring real estate apps: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to configure real estate apps'
    });
  }
}));

/**
 * @route POST /api/aci/link/api-key
 * @description Link an account with API key
 */
router.post('/link/api-key', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { app_name, api_key } = req.body;
    
    if (!app_name || !api_key) {
      return res.status(400).json({
        status: 'error',
        message: 'App name and API key are required'
      });
    }
    
    const result = await executePythonFunction(
      './server/services/aci-integration.py', 
      'link_api_key_account',
      { app_name, api_key }
    );
    
    res.json(result);
  } catch (error) {
    logger.error({
      message: `Error linking API key account: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to link API key account'
    });
  }
}));

/**
 * @route POST /api/aci/link/oauth
 * @description Get OAuth link for linking an account
 */
router.post('/link/oauth', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { app_name, redirect_url } = req.body;
    
    if (!app_name) {
      return res.status(400).json({
        status: 'error',
        message: 'App name is required'
      });
    }
    
    const result = await executePythonFunction(
      './server/services/aci-integration.py', 
      'get_oauth_link',
      { app_name, redirect_url }
    );
    
    res.json(result);
  } catch (error) {
    logger.error({
      message: `Error getting OAuth link: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get OAuth link'
    });
  }
}));

/**
 * @route GET /api/aci/accounts
 * @description Get linked accounts
 */
router.get('/accounts', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await executePythonFunction('./server/services/aci-integration.py', 'get_linked_accounts');
    
    res.json({
      status: 'success',
      count: result.length,
      accounts: result
    });
  } catch (error) {
    logger.error({
      message: `Error getting linked accounts: ${error.message}`,
      category: 'API',
      source: 'aci-routes'
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get linked accounts'
    });
  }
}));

export const aciRoutes = router;