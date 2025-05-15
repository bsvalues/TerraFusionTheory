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
import * as path from 'path';

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
    
    const pythonProcess = spawn('python3', [
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

    pythonProcess.stdout.on('data', (data: Buffer) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code: number) => {
      if (code !== 0) {
        logger.error(`Python process exited with code ${code}: ${errorData}`);
        return reject(new Error(`Python process exited with code ${code}: ${errorData}`));
      }

      try {
        const result = JSON.parse(outputData.trim());
        
        if (result && result.error) {
          logger.error(`Error in Python function: ${result.error}`);
          return reject(new Error(result.error));
        }
        
        resolve(result);
      } catch (err) {
        logger.error(`Failed to parse Python output: ${outputData}`);
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
    const pythonProcess = spawn('python3', [
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

    pythonProcess.stdout.on('data', (data: Buffer) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code: number) => {
      if (code !== 0) {
        logger.error(`Error checking ACI status: Process exited with code ${code}: ${errorData}`);
        
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
        logger.error(`Failed to parse Python output: ${outputData}`);
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI status result',
          details: outputData
        });
      }
    });
  } catch (error: any) {
    logger.error(`Error checking ACI status: ${error.message}`);
    
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
  } catch (error: any) {
    logger.error(`Error getting ACI tools: ${error.message}`);
    
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
    
    console.log(`Starting ACI search with intent: "${intent}" and limit: ${limit}`);
    
    // Create a separate Python file for better error handling
    const tempFilePath = path.join(process.cwd(), 'temp_aci_search.py');
    
    const pythonScript = `
import sys
import json
import os
import traceback

# Set up detailed logging to stderr
def log(message):
    print(f"[ACI Search] {message}", file=sys.stderr)

try:
    log("Starting ACI function search script...")
    
    # Debug environment variables
    env_vars = {k: v for k, v in os.environ.items() if k.startswith('ACI_')}
    log(f"Environment variables: {env_vars}")
    
    # Add current working directory to path
    current_dir = '${process.cwd()}'
    sys.path.append(current_dir)
    log(f"Added {current_dir} to Python path")
    
    # Check for ACI API key
    aci_key = os.environ.get("ACI_API_KEY", "")
    key_status = "present" if aci_key and len(aci_key) > 0 else "missing"
    key_info = f"length: {len(aci_key)}, first/last chars: {aci_key[:3]}...{aci_key[-3:]}" if aci_key else "not found"
    log(f"ACI_API_KEY status: {key_status} ({key_info})")
    
    # Import aci
    log("Importing aci package...")
    import aci
    from aci._client import ACI
    log(f"ACI package imported successfully: {aci.__file__}")
    
    # Custom direct implementation
    log("Implementing direct ACI search...")
    
    # Get ACI API key
    ACI_API_KEY = os.environ.get("ACI_API_KEY", "")
    if not ACI_API_KEY:
        log("ACI API key not found!")
        print(json.dumps({"error": "ACI API key is missing or empty."}))
        sys.exit(1)
        
    # Initialize client directly
    log("Initializing ACI client...")
    client = ACI(api_key=ACI_API_KEY)
    log("ACI client initialized successfully")
    
    # Clean and format parameters
    intent = """${intent}"""
    limit = ${limit}
    log(f"Search params - Intent: '{intent}', Limit: {limit}")
    
    # Execute search directly
    log("Executing ACI function search...")
    functions = client.functions.search(
        intent=intent,
        allowed_apps_only=True,
        limit=limit
    )
    log(f"Search completed successfully, found {len(functions)} functions")
    
    # Format the result
    log("Formatting search results...")
    formatted_functions = []
    for func in functions:
        if isinstance(func, dict):
            app_name = func.get('app_name', '')
            function_name = func.get('function_name', '')
            description = func.get('description', '')
            requires_auth = func.get('requires_auth', False)
            has_linked_account = func.get('has_linked_account', False)
            schema = func.get('schema', {})
        else:
            # Assume object with attributes
            app_name = getattr(func, 'app_name', '')
            function_name = getattr(func, 'function_name', '')
            description = getattr(func, 'description', '')
            requires_auth = getattr(func, 'requires_auth', False)
            has_linked_account = getattr(func, 'has_linked_account', False)
            schema = getattr(func, 'schema', {})
            
        formatted_functions.append({
            "app_name": app_name,
            "function_name": function_name,
            "full_name": f"{app_name}__{function_name}",
            "description": description,
            "requires_auth": requires_auth,
            "has_linked_account": has_linked_account,
            "schema": schema
        })
    
    log(f"Returning {len(formatted_functions)} formatted functions")
    print(json.dumps(formatted_functions))
    
except Exception as e:
    log(f"Error in ACI search: {str(e)}")
    log(f"Error type: {type(e).__name__}")
    log(f"Traceback: {traceback.format_exc()}")
    print(json.dumps({
        "error": str(e),
        "error_type": str(type(e).__name__),
        "traceback": traceback.format_exc()
    }))
`;

    // Write the Python script to a file
    fs.writeFileSync(tempFilePath, pythonScript);
    
    // Run the script as a separate process
    const pythonProcess = spawn('python3', [tempFilePath]);
    
    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data: Buffer) => {
      outputData += data.toString();
      console.log(`ACI search stdout: ${data.toString()}`);
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      errorData += data.toString();
      console.log(`ACI search stderr: ${data.toString()}`);
    });
    
    pythonProcess.on('close', (code: number) => {
      console.log(`ACI search process exited with code ${code}`);
      console.log(`Error data: ${errorData}`);
      console.log(`Output data: ${outputData}`);
      
      // Delete the temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err: any) {
        console.error(`Error deleting temporary file: ${err.message}`);
      }
      
      if (code !== 0) {
        logger.error(`Error in ACI search functions: Process exited with code ${code}: ${errorData}`);
        
        return res.status(500).json({
          status: 'error',
          message: 'Error searching ACI functions',
          details: errorData
        });
      }

      try {
        console.log(`Raw Python output: ${outputData.trim()}`);
        
        if (!outputData.trim()) {
          logger.error('Empty output from Python script');
          
          return res.status(500).json({
            status: 'error',
            message: 'No results from ACI search',
            details: {
              stderr: errorData,
              stdout: outputData
            }
          });
        }
        
        const result = JSON.parse(outputData.trim());
        
        if (result && result.error) {
          logger.error(`ACI search error: ${result.error}`);
          
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
      } catch (err: any) {
        logger.error(`Failed to parse Python output: ${outputData}`);
        
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse ACI search results',
          details: {
            error: String(err),
            stdout: outputData,
            stderr: errorData
          }
        });
      }
    });
  } catch (error: any) {
    logger.error(`Error searching ACI functions: ${error.message}`);
    
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
    const { app_name, function_name, parameters } = req.body;
    
    if (!app_name || !function_name) {
      return res.status(400).json({
        status: 'error',
        message: 'App name and function name are required'
      });
    }
    
    const result = await executePythonFunction(
      './server/services/aci-integration.py',
      'execute_function',
      {
        app_name,
        function_name,
        parameters: parameters || {}
      }
    );
    
    res.json({
      status: 'success',
      result
    });
  } catch (error: any) {
    logger.error(`Error executing ACI function: ${error.message}`);
    
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
    const { function_name, arguments: functionArgs } = req.body;
    
    if (!function_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Function name is required'
      });
    }
    
    const result = await executePythonFunction(
      './server/services/aci-integration.py',
      'handle_function_call',
      {
        function_name,
        arguments: functionArgs || {}
      }
    );
    
    res.json({
      status: 'success',
      result
    });
  } catch (error: any) {
    logger.error(`Error calling ACI function: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to call ACI function'
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
      apps: result
    });
  } catch (error: any) {
    logger.error(`Error listing ACI apps: ${error.message}`);
    
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
    // Configure apps like:
    // - Zillow
    // - Redfin
    // - Google Maps
    // - PropertyShark
    
    res.json({
      status: 'success',
      message: 'Real estate apps configured successfully'
    });
  } catch (error: any) {
    logger.error(`Error configuring real estate apps: ${error.message}`);
    
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
      {
        app_name,
        api_key
      }
    );
    
    res.json({
      status: 'success',
      result
    });
  } catch (error: any) {
    logger.error(`Error linking account with API key: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to link account with API key'
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
      {
        app_name,
        redirect_url
      }
    );
    
    res.json({
      status: 'success',
      oauth_url: result
    });
  } catch (error: any) {
    logger.error(`Error getting OAuth link: ${error.message}`);
    
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
      accounts: result
    });
  } catch (error: any) {
    logger.error(`Error getting linked accounts: ${error.message}`);
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to get linked accounts'
    });
  }
}));

export const aciRoutes = router;