/**
 * Spatial Analytics Controller
 * 
 * This controller provides access to advanced spatial analytics capabilities
 * including spatial feature engineering, GWR modeling, and quantile regression.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Define interface for spatial analytics results
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
const executePythonScript = async (scriptPath: string, args: string[] = []): Promise<{ output: string, error: string }> => {
  return new Promise((resolve, reject) => {
    // Ensure the script exists
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error(`Script not found at path: ${scriptPath}`));
    }

    // Get Python executable
    const pythonCommand: string = process.platform === 'win32' ? 'python' : 'python3';
    
    // Execute the script
    const pythonProcess = spawn(pythonCommand, [scriptPath, ...args]);
    
    let output = '';
    let errorOutput = '';
    
    // Collect standard output data
    pythonProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });
    
    // Collect error output data
    pythonProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });
    
    // Handle process exit
    pythonProcess.on('close', (code: number) => {
      if (code !== 0) {
        logger.error(`Child process exited with code ${code}`);
        return resolve({ output, error: errorOutput });
      }
      
      resolve({ output, error: errorOutput });
    });
    
    pythonProcess.on('error', (err: Error) => {
      logger.error(`Failed to start child process: ${err.message}`);
      reject(err);
    });
  });
};

/**
 * Get a list of all available spatial analysis capabilities.
 */
export const getSpatialCapabilities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // List of available capabilities
    const capabilities = {
      spatial_features: {
        description: 'Extract spatial features from property data',
        parameters: {
          pois: 'Include points of interest features',
          network_centrality: 'Include network centrality metrics',
          viewshed: 'Include viewshed analysis',
          spatial_lag: 'Include spatial lag variables'
        }
      },
      geographically_weighted_regression: {
        description: 'Fit GWR models to capture spatial heterogeneity',
        parameters: {
          bandwidth: 'Bandwidth selection method (AIC, CV, fixed)',
          kernel_type: 'Kernel function (gaussian, bisquare, exponential)',
          fixed: 'Whether to use fixed or adaptive bandwidth'
        }
      },
      quantile_regression: {
        description: 'Fit quantile regression models for uncertainty estimation',
        parameters: {
          quantiles: 'List of quantiles to estimate',
          n_estimators: 'Number of boosting stages',
          max_depth: 'Maximum tree depth',
          learning_rate: 'Boosting learning rate'
        }
      }
    };
    
    res.status(200).json({ 
      status: 'success',
      data: capabilities 
    });
  } catch (error) {
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
      pois = false,
      network_centrality = false,
      viewshed = false,
      spatial_lag = false,
      knn_features = true,
      k = 5
    } = req.body;
    
    // Validate required parameters
    if (!dataset_id) {
      res.status(400).json({ 
        status: 'error',
        message: 'Missing required parameter: dataset_id'
      });
      return;
    }
    
    // Path to the Python runner script
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_spatial_features.py');
    
    // Convert boolean parameters to string arguments
    const args = [
      dataset_id,
      pois ? '1' : '0',
      network_centrality ? '1' : '0',
      viewshed ? '1' : '0',
      spatial_lag ? '1' : '0',
      knn_features ? '1' : '0',
      k.toString()
    ];
    
    try {
      // Execute the feature engineering script
      const { output, error } = await executePythonScript(scriptPath, args);
      
      if (error && error.trim() !== '') {
        logger.error(`Error in spatial feature engineering: ${error}`);
        
        res.status(500).json({
          status: 'error',
          message: 'Failed to engineer spatial features',
          error: error
        });
        return;
      }
      
      // Parse the output as JSON
      const result = JSON.parse(output) as SpatialFeaturesResponse;
      
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          engineered_features: result.engineered_features
        }
      });
    } catch (err: any) {
      logger.error(`Error executing spatial feature script: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to execute spatial feature engineering',
        error: err.message
      });
    }
  } catch (error) {
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
    
    // Validate required parameters
    if (!dataset_id || !dependent_var || !independent_vars) {
      res.status(400).json({ 
        status: 'error',
        message: 'Missing required parameters: dataset_id, dependent_var, independent_vars'
      });
      return;
    }
    
    // Path to the Python runner script
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_gwr_model.py');
    
    // Prepare arguments
    const args = [
      dataset_id,
      dependent_var,
      JSON.stringify(independent_vars),
      bandwidth,
      kernel_type,
      fixed ? '1' : '0'
    ];
    
    try {
      // Execute the GWR model script
      const { output, error } = await executePythonScript(scriptPath, args);
      
      if (error && error.trim() !== '') {
        logger.error(`Error in GWR modeling: ${error}`);
        
        res.status(500).json({
          status: 'error',
          message: 'Failed to fit GWR model',
          error: error
        });
        return;
      }
      
      // Parse the output as JSON
      const result = JSON.parse(output) as ModelingResponse;
      
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          model_id: result.model_id,
          model_path: result.model_path,
          model_summary: result.model_summary
        }
      });
    } catch (err: any) {
      logger.error(`Error executing GWR model script: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to execute GWR modeling',
        error: err.message
      });
    }
  } catch (error) {
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
      n_estimators = 100,
      max_depth = 5,
      learning_rate = 0.1,
      subsample = 0.8,
      test_size = 0.2
    } = req.body;
    
    // Validate required parameters
    if (!dataset_id || !dependent_var || !independent_vars) {
      res.status(400).json({ 
        status: 'error',
        message: 'Missing required parameters: dataset_id, dependent_var, independent_vars'
      });
      return;
    }
    
    // Path to the Python runner script
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_quantile_model.py');
    
    // Prepare arguments
    const args = [
      dataset_id,
      dependent_var,
      JSON.stringify(independent_vars),
      JSON.stringify(quantiles),
      n_estimators.toString(),
      max_depth.toString(),
      learning_rate.toString(),
      subsample.toString(),
      test_size.toString()
    ];
    
    try {
      // Execute the quantile regression model script
      const { output, error } = await executePythonScript(scriptPath, args);
      
      if (error && error.trim() !== '') {
        logger.error(`Error in quantile regression modeling: ${error}`);
        
        res.status(500).json({
          status: 'error',
          message: 'Failed to fit quantile regression model',
          error: error
        });
        return;
      }
      
      // Parse the output as JSON
      const result = JSON.parse(output) as ModelingResponse;
      
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          model_id: result.model_id,
          model_path: result.model_path,
          model_summary: result.model_summary
        }
      });
    } catch (err: any) {
      logger.error(`Error executing quantile regression model script: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to execute quantile regression modeling',
        error: err.message
      });
    }
  } catch (error) {
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
      model_type,
      dataset_id,
      independent_vars
    } = req.body;
    
    // Validate required parameters
    if (!model_id || !model_type || !dataset_id) {
      res.status(400).json({ 
        status: 'error',
        message: 'Missing required parameters: model_id, model_type, dataset_id'
      });
      return;
    }
    
    // Check model type
    if (!['gwr', 'quantile'].includes(model_type)) {
      res.status(400).json({ 
        status: 'error',
        message: 'Invalid model_type. Must be "gwr" or "quantile"'
      });
      return;
    }
    
    // Path to the Python runner script
    const scriptPath = path.join(process.cwd(), 'scripts', `run_${model_type}_predict.py`);
    
    // Prepare arguments
    const args = [
      model_id,
      dataset_id,
      independent_vars ? JSON.stringify(independent_vars) : ''
    ];
    
    try {
      // Execute the prediction script
      const { output, error } = await executePythonScript(scriptPath, args);
      
      if (error && error.trim() !== '') {
        logger.error(`Error in model prediction: ${error}`);
        
        res.status(500).json({
          status: 'error',
          message: `Failed to predict with ${model_type} model`,
          error: error
        });
        return;
      }
      
      // Parse the output as JSON
      const result = JSON.parse(output);
      
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: result.predictions
      });
    } catch (err: any) {
      logger.error(`Error executing prediction script: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to execute model prediction',
        error: err.message
      });
    }
  } catch (error) {
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
      dataset_id
    } = req.body;
    
    // Validate required parameters
    if (!model_id || !dataset_id) {
      res.status(400).json({ 
        status: 'error',
        message: 'Missing required parameters: model_id, dataset_id'
      });
      return;
    }
    
    // Path to the Python runner script
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_gwr_coefficient_maps.py');
    
    // Prepare arguments
    const args = [
      model_id,
      dataset_id
    ];
    
    try {
      // Execute the coefficient maps script
      const { output, error } = await executePythonScript(scriptPath, args);
      
      if (error && error.trim() !== '') {
        logger.error(`Error in generating coefficient maps: ${error}`);
        
        res.status(500).json({
          status: 'error',
          message: 'Failed to generate coefficient maps',
          error: error
        });
        return;
      }
      
      // Parse the output as JSON
      const result = JSON.parse(output);
      
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          map_paths: result.map_paths
        }
      });
    } catch (err: any) {
      logger.error(`Error executing coefficient maps script: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate coefficient maps',
        error: err.message
      });
    }
  } catch (error) {
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
      dataset_id,
      dependent_var
    } = req.body;
    
    // Validate required parameters
    if (!model_id || !dataset_id || !dependent_var) {
      res.status(400).json({ 
        status: 'error',
        message: 'Missing required parameters: model_id, dataset_id, dependent_var'
      });
      return;
    }
    
    // Path to the Python runner script
    const scriptPath = path.join(process.cwd(), 'scripts', 'run_quantile_uncertainty_plots.py');
    
    // Prepare arguments
    const args = [
      model_id,
      dataset_id,
      dependent_var
    ];
    
    try {
      // Execute the uncertainty plots script
      const { output, error } = await executePythonScript(scriptPath, args);
      
      if (error && error.trim() !== '') {
        logger.error(`Error in generating uncertainty plots: ${error}`);
        
        res.status(500).json({
          status: 'error',
          message: 'Failed to generate uncertainty plots',
          error: error
        });
        return;
      }
      
      // Parse the output as JSON
      const result = JSON.parse(output);
      
      res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
          plot_paths: result.plot_paths
        }
      });
    } catch (err: any) {
      logger.error(`Error executing uncertainty plots script: ${err.message}`);
      
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate uncertainty plots',
        error: err.message
      });
    }
  } catch (error) {
    next(error);
  }
};