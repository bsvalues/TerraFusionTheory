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
import * as fs from 'fs';
import * as os from 'os';

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
    // Pass args via command line to avoid string escaping issues
    const argsStr = JSON.stringify(args);
    
    const process = spawn('python3', [
      '-c',
      `
import sys
import json
import importlib.util
import os

try:
    # Import the module
    script_path = "${scriptPath}"
    if not os.path.exists(script_path):
        print(json.dumps({"error": f"Script not found: {script_path}"}))
        sys.exit(1)
        
    spec = importlib.util.spec_from_file_location("aci_module", script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    
    # Parse arguments from command line
    args_str = '''${argsStr}'''
    function_name = "${functionName}"
    
    # Parse input arguments
    args = json.loads(args_str)
    
    # Get the function based on name
    if not hasattr(module.aci_integration, function_name):
        print(json.dumps({"error": f"Function not found: {function_name}"}))
        sys.exit(1)
        
    # Get the function
    func = getattr(module.aci_integration, function_name)
    
    # Call the function with arguments
    result = func(**args)
    
    # Return result as JSON
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
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
        logger.error({
          message: `Python process exited with code ${code}`,
          category: 'API',
          source: 'aci-routes',
          details: errorData
        });
        
        return reject(new Error(`Python process exited with code ${code}: ${errorData}`));
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        if (result && result.error) {
          logger.error({
            message: `Error in Python function: ${result.error}`,
            category: 'API',
            source: 'aci-routes'
          });
          
          return reject(new Error(result.error));
        }
        
        resolve(result);
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci-routes'
        });
        
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
    // Use a simpler approach to check the status
    const process = spawn('python3', [
      '-c',
      `
import os
import json
import sys
from aci._client import ACI

try:
    api_key = os.environ.get("ACI_API_KEY", "")
    client = ACI(api_key=api_key) if api_key else None
    is_initialized = api_key is not None and len(api_key) > 0
    
    print(json.dumps({
        "initialized": is_initialized,
        "api_key_present": api_key is not None and len(api_key) > 0
    }))
except Exception as e:
    print(json.dumps({
        "initialized": False,
        "error": str(e)
    }))
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
        logger.error({
          message: `Error checking ACI status: Process exited with code ${code}`,
          category: 'API',
          source: 'aci-routes',
          details: errorData
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to check ACI integration status',
          details: errorData
        });
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        return res.json({
          status: 'success',
          ...result
        });
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci-routes'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI status result',
          details: outputData
        });
      }
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
    
    // Use the direct approach with improved error handling
    const process = spawn('python3', [
      '-c',
      `
import sys
import json
import os
import traceback

try:
    sys.path.append('${process.cwd()}')
    from server.services.aci_direct import search_functions, is_initialized
    
    # First check if ACI is initialized
    if not is_initialized():
        print(json.dumps({"error": "ACI is not initialized. Please check ACI_API_KEY environment variable."}))
        sys.exit(1)
    
    intent = """${intent}"""
    limit = ${limit}
    
    result = search_functions(intent, limit)
    print(json.dumps(result))
except ImportError as e:
    print(json.dumps({"error": f"Import error: {str(e)}. Make sure the 'aci' package is installed."}))
except Exception as e:
    print(json.dumps({
        "error": str(e),
        "traceback": traceback.format_exc()
    }))
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
        logger.error({
          message: `Error in ACI search functions: Process exited with code ${code}`,
          category: 'API',
          source: 'aci-routes',
          details: errorData
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Error searching ACI functions',
          details: errorData
        });
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        if (result && result.error) {
          logger.error({
            message: `ACI search error: ${result.error}`,
            category: 'API',
            source: 'aci-routes',
            details: result.traceback || 'No traceback'
          });
          
          return res.status(500).json({
            status: 'error',
            message: result.error,
            details: result.traceback
          });
        }
        
        return res.json({
          status: 'success',
          count: result.length,
          functions: result
        });
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci-routes'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI search results',
          details: outputData
        });
      }
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
    
    // Use the direct approach
    const process = spawn('python3', [
      '-c',
      `
import sys
import json
import os

try:
    sys.path.append('${process.cwd()}')
    from server.services.aci_direct import execute_function
    
    app_name = "${app_name}"
    function_name = "${function_name}"
    parameters = json.loads('${JSON.stringify(parameters)}')
    
    result = execute_function(app_name, function_name, parameters)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
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
        logger.error({
          message: `Error in ACI function execution: Process exited with code ${code}`,
          category: 'API',
          source: 'aci-routes',
          details: errorData
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Error executing ACI function',
          details: errorData
        });
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        if (result && result.error) {
          return res.status(500).json({
            status: 'error',
            message: result.error
          });
        }
        
        return res.json({
          status: 'success',
          result
        });
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci-routes'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI execute result',
          details: outputData
        });
      }
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
    
    // Use the direct approach
    const process = spawn('python3', [
      '-c',
      `
import sys
import json
import os

try:
    sys.path.append('${process.cwd()}')
    from server.services.aci_direct import handle_function_call
    
    function_name = "${function_name}"
    args = json.loads('${JSON.stringify(args)}')
    
    result = handle_function_call(function_name, args)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
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
        logger.error({
          message: `Error in ACI function call: Process exited with code ${code}`,
          category: 'API',
          source: 'aci-routes',
          details: errorData
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Error executing ACI function call',
          details: errorData
        });
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        return res.json({
          status: 'success',
          result
        });
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci-routes'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI function call result',
          details: outputData
        });
      }
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
    // Use the direct approach
    const process = spawn('python3', [
      '-c',
      `
import sys
import json
import os

try:
    sys.path.append('${process.cwd()}')
    from server.services.aci_direct import list_available_apps
    
    result = list_available_apps()
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
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
        logger.error({
          message: `Error listing ACI apps: Process exited with code ${code}`,
          category: 'API',
          source: 'aci-routes',
          details: errorData
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Error listing ACI apps',
          details: errorData
        });
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        if (result && result.error) {
          return res.status(500).json({
            status: 'error',
            message: result.error
          });
        }
        
        return res.json({
          status: 'success',
          count: result.length,
          apps: result
        });
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci-routes'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI apps list',
          details: outputData
        });
      }
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
    
    // Use the direct approach
    const process = spawn('python3', [
      '-c',
      `
import sys
import json
import os

try:
    sys.path.append('${process.cwd()}')
    from server.services.aci_direct import link_api_key_account
    
    app_name = "${app_name}"
    api_key = """${api_key}"""
    
    result = link_api_key_account(app_name, api_key)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
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
        logger.error({
          message: `Error linking API key account: Process exited with code ${code}`,
          category: 'API',
          source: 'aci-routes',
          details: errorData
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Error linking API key account',
          details: errorData
        });
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        if (result && result.error) {
          return res.status(500).json({
            status: 'error',
            message: result.error
          });
        }
        
        return res.json(result);
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci-routes'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI link account result',
          details: outputData
        });
      }
    });
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
    
    // Use the direct approach
    const process = spawn('python3', [
      '-c',
      `
import sys
import json
import os

try:
    sys.path.append('${process.cwd()}')
    from server.services.aci_direct import get_oauth_link
    
    app_name = "${app_name}"
    redirect_url = ${redirect_url ? `"${redirect_url}"` : 'None'}
    
    result = get_oauth_link(app_name, redirect_url)
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
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
        logger.error({
          message: `Error getting OAuth link: Process exited with code ${code}`,
          category: 'API',
          source: 'aci-routes',
          details: errorData
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Error getting OAuth link',
          details: errorData
        });
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        if (result && result.error) {
          return res.status(500).json({
            status: 'error',
            message: result.error
          });
        }
        
        return res.json(result);
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci-routes'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI OAuth link result',
          details: outputData
        });
      }
    });
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
    // Use the direct approach
    const process = spawn('python3', [
      '-c',
      `
import sys
import json
import os

try:
    sys.path.append('${process.cwd()}')
    from server.services.aci_direct import get_linked_accounts
    
    result = get_linked_accounts()
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
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
        logger.error({
          message: `Error getting linked accounts: Process exited with code ${code}`,
          category: 'API',
          source: 'aci-routes',
          details: errorData
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Error getting linked accounts',
          details: errorData
        });
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        if (result && result.error) {
          return res.status(500).json({
            status: 'error',
            message: result.error
          });
        }
        
        return res.json({
          status: 'success',
          count: result.length,
          accounts: result
        });
      } catch (err) {
        logger.error({
          message: `Failed to parse Python output: ${outputData}`,
          category: 'API',
          source: 'aci-routes'
        });
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI linked accounts',
          details: outputData
        });
      }
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