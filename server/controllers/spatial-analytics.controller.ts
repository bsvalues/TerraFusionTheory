/**
 * Spatial Analytics Controller
 * 
 * This controller provides access to advanced spatial analytics capabilities
 * including spatial feature engineering, GWR modeling, and quantile regression.
 */

import { Request, Response, NextFunction } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { OptimizedLogger } from '../services/optimized-logging';
import { LogCategory } from '../../shared/schema';

// Initialize logger
const logger = OptimizedLogger.getInstance();

interface SpatialFeaturesResponse {
  status: string;
  message: string;
  engineered_features?: string[];
  error?: string;
}

interface ModelingResponse {
  status: string;
  message: string;
  model_id?: string;
  model_path?: string;
  model_summary?: Record<string, unknown>;
  error?: string;
}

/**
 * Execute a Python script with specified arguments and handle the response.
 * 
 * @param scriptPath Path to the Python script
 * @param args Arguments to pass to the script
 * @returns Promise that resolves to the script output
 */
function executePythonScript(scriptPath: string, args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scriptPath, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
      logger.error(`Python script stderr: ${data.toString()}`, LogCategory.SPATIAL_ANALYTICS);
    });
    
    pythonProcess.on('error', (err: Error) => {
      logger.error(`Failed to execute Python script: ${err.message}`, LogCategory.SPATIAL_ANALYTICS);
      reject(err);
    });
    
    pythonProcess.on('close', (code: number) => {
      if (code !== 0) {
        logger.error(`Python process exited with code ${code}`, LogCategory.SPATIAL_ANALYTICS);
        logger.error(`stderr: ${stderr}`, LogCategory.SPATIAL_ANALYTICS);
        return reject(new Error(`Python process exited with code ${code}\n${stderr}`));
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        logger.error(`Failed to parse Python script output: ${e}`, LogCategory.SPATIAL_ANALYTICS);
        if (stdout) {
          logger.error(`stdout: ${stdout}`, LogCategory.SPATIAL_ANALYTICS);
        }
        reject(new Error(`Failed to parse Python script output: ${e}\n${stdout}`));
      }
    });
  });
}

/**
 * Get a list of all available spatial analysis capabilities.
 */
export const getSpatialCapabilities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Return a static list of capabilities for now
    // In the future, this could be dynamically generated based on available scripts and models
    const capabilities = {
      feature_engineering: [
        {
          name: 'k-nearest neighbors features',
          description: 'Generates features based on the k-nearest neighbors',
          parameters: {
            k: {
              type: 'integer',
              description: 'Number of neighbors to consider',
              default: 5,
              range: [3, 20]
            }
          }
        },
        {
          name: 'points of interest',
          description: 'Computes distances to points of interest like schools, hospitals, etc.',
          parameters: {
            categories: {
              type: 'array',
              description: 'Categories of POIs to include',
              default: ['school', 'hospital', 'park', 'shopping']
            }
          }
        },
        {
          name: 'network centrality',
          description: 'Calculates network centrality metrics for properties',
          parameters: {}
        },
        {
          name: 'viewshed analysis',
          description: 'Performs viewshed analysis to quantify views',
          parameters: {}
        },
        {
          name: 'spatial lag variables',
          description: 'Generates spatial lag variables for selected attributes',
          parameters: {
            variables: {
              type: 'array',
              description: 'Variables to create spatial lags for',
              default: []
            }
          }
        }
      ],
      modeling: [
        {
          name: 'Geographically Weighted Regression',
          description: 'GWR allows coefficients to vary over space to capture spatial non-stationarity',
          parameters: {
            bandwidth: {
              type: 'string',
              description: 'Bandwidth selection method',
              default: 'AIC',
              options: ['AIC', 'CV', 'fixed']
            },
            kernel_type: {
              type: 'string',
              description: 'Kernel function type',
              default: 'gaussian',
              options: ['gaussian', 'bisquare', 'exponential']
            },
            fixed: {
              type: 'boolean',
              description: 'Whether to use fixed bandwidth',
              default: false
            }
          }
        },
        {
          name: 'Quantile Regression',
          description: 'Quantile regression allows modeling different parts of the distribution',
          parameters: {
            quantiles: {
              type: 'array',
              description: 'Quantiles to model',
              default: [0.1, 0.5, 0.9]
            },
            use_gradient_boosting: {
              type: 'boolean',
              description: 'Whether to use gradient boosting for quantile regression',
              default: true
            }
          }
        }
      ],
      visualization: [
        {
          name: 'Coefficient Maps',
          description: 'Generates maps of GWR coefficients to visualize spatial variation',
          parameters: {}
        },
        {
          name: 'Uncertainty Visualization',
          description: 'Visualizes uncertainty in quantile regression models',
          parameters: {}
        }
      ]
    };
    
    res.json(capabilities);
  } catch (error) {
    logger.error(`Error getting spatial capabilities: ${error}`, LogCategory.SPATIAL_ANALYTICS);
    next(error);
  }
};

/**
 * Engineer spatial features for a dataset.
 */
export const engineerSpatialFeatures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      dataset_id,
      include_pois = false,
      include_network_centrality = false,
      include_viewshed = false,
      include_spatial_lag = false,
      include_knn_features = true,
      k = 5
    } = req.body;
    
    if (!dataset_id) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: dataset_id'
      });
      return;
    }
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_spatial_features.py');
    
    if (!fs.existsSync(scriptPath)) {
      logger.error(`Spatial features script not found at ${scriptPath}`);
      res.status(500).json({
        status: 'error',
        message: 'Spatial features script not found'
      });
      return;
    }
    
    const args = [
      dataset_id,
      String(include_pois),
      String(include_network_centrality),
      String(include_viewshed),
      String(include_spatial_lag),
      String(include_knn_features),
      String(k)
    ];
    
    const result = await executePythonScript(scriptPath, args) as SpatialFeaturesResponse;
    
    if (result.status === 'error') {
      res.status(400).json(result);
      return;
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Error engineering spatial features: ${error}`, LogCategory.SPATIAL_ANALYTICS);
    next(error);
  }
};

/**
 * Fit a GWR model to a dataset.
 */
export const fitGWRModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      dataset_id,
      dependent_var,
      independent_vars,
      bandwidth = 'AIC',
      kernel_type = 'gaussian',
      fixed = false
    } = req.body;
    
    if (!dataset_id || !dependent_var || !independent_vars) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: dataset_id, dependent_var, independent_vars'
      });
      return;
    }
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_gwr_model.py');
    
    if (!fs.existsSync(scriptPath)) {
      logger.error(`GWR model script not found at ${scriptPath}`);
      res.status(500).json({
        status: 'error',
        message: 'GWR model script not found'
      });
      return;
    }
    
    const args = [
      dataset_id,
      dependent_var,
      JSON.stringify(independent_vars),
      bandwidth,
      kernel_type,
      fixed ? '1' : '0'
    ];
    
    const result = await executePythonScript(scriptPath, args) as ModelingResponse;
    
    if (result.status === 'error') {
      res.status(400).json(result);
      return;
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Error fitting GWR model: ${error}`, LogCategory.SPATIAL_ANALYTICS);
    next(error);
  }
};

/**
 * Fit a quantile regression model to a dataset.
 */
export const fitQuantileModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      dataset_id,
      dependent_var,
      independent_vars,
      quantiles = [0.1, 0.5, 0.9],
      use_gradient_boosting = true
    } = req.body;
    
    if (!dataset_id || !dependent_var || !independent_vars) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: dataset_id, dependent_var, independent_vars'
      });
      return;
    }
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_quantile_model.py');
    
    if (!fs.existsSync(scriptPath)) {
      logger.error(`Quantile model script not found at ${scriptPath}`);
      res.status(500).json({
        status: 'error',
        message: 'Quantile model script not found. Please ensure the script is available.'
      });
      return;
    }
    
    const args = [
      dataset_id,
      dependent_var,
      JSON.stringify(independent_vars),
      JSON.stringify(quantiles),
      use_gradient_boosting ? '1' : '0'
    ];
    
    const result = await executePythonScript(scriptPath, args) as ModelingResponse;
    
    if (result.status === 'error') {
      res.status(400).json(result);
      return;
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Error fitting quantile model: ${error}`, LogCategory.SPATIAL_ANALYTICS);
    next(error);
  }
};

/**
 * Predict using a fitted model.
 */
export const predictWithModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      model_id,
      dataset_id
    } = req.body;
    
    if (!model_id || !dataset_id) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: model_id, dataset_id'
      });
      return;
    }
    
    // Determine model type from model_id (e.g., "gwr_abc123" or "quantile_abc123")
    const modelType = model_id.split('_')[0];
    
    let scriptPath;
    if (modelType === 'gwr') {
      scriptPath = path.join(process.cwd(), 'scripts', 'run_gwr_predict.py');
    } else if (modelType === 'quantile') {
      scriptPath = path.join(process.cwd(), 'scripts', 'run_quantile_predict.py');
    } else {
      res.status(400).json({
        status: 'error',
        message: `Unknown model type: ${modelType}`
      });
      return;
    }
    
    if (!fs.existsSync(scriptPath)) {
      logger.error(`Prediction script not found at ${scriptPath}`);
      res.status(500).json({
        status: 'error',
        message: `Prediction script not found for model type: ${modelType}`
      });
      return;
    }
    
    const args = [
      model_id,
      dataset_id
    ];
    
    const result = await executePythonScript(scriptPath, args);
    
    if (result.status === 'error') {
      res.status(400).json(result);
      return;
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Error predicting with model: ${error}`, LogCategory.SPATIAL_ANALYTICS);
    next(error);
  }
};

/**
 * Generate coefficient maps for GWR model.
 */
export const generateCoefficientMaps = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      model_id,
      variables = [],
      output_format = 'json'
    } = req.body;
    
    if (!model_id) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: model_id'
      });
      return;
    }
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_gwr_maps.py');
    
    if (!fs.existsSync(scriptPath)) {
      logger.error(`GWR maps script not found at ${scriptPath}`);
      res.status(500).json({
        status: 'error',
        message: 'GWR maps script not found'
      });
      return;
    }
    
    const args = [
      model_id,
      JSON.stringify(variables),
      output_format
    ];
    
    const result = await executePythonScript(scriptPath, args);
    
    if (result.status === 'error') {
      res.status(400).json(result);
      return;
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Error generating coefficient maps: ${error}`, LogCategory.SPATIAL_ANALYTICS);
    next(error);
  }
};

/**
 * Plot uncertainty for quantile regression model.
 */
export const plotUncertainty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      model_id,
      output_format = 'json'
    } = req.body;
    
    if (!model_id) {
      res.status(400).json({
        status: 'error',
        message: 'Missing required parameter: model_id'
      });
      return;
    }
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_quantile_uncertainty.py');
    
    if (!fs.existsSync(scriptPath)) {
      logger.error(`Quantile uncertainty script not found at ${scriptPath}`);
      res.status(500).json({
        status: 'error',
        message: 'Quantile uncertainty script not found'
      });
      return;
    }
    
    const args = [
      model_id,
      output_format
    ];
    
    const result = await executePythonScript(scriptPath, args);
    
    if (result.status === 'error') {
      res.status(400).json(result);
      return;
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Error plotting uncertainty: ${error}`, LogCategory.SPATIAL_ANALYTICS);
    next(error);
  }
};