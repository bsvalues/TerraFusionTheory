/**
 * Analysis API Routes
 * 
 * Provides endpoints for property analysis, validation, and mass appraisal.
 */

import { Router } from 'express';
import { MassAppraisalService, MassAppraisalConfig } from '../services/analysis/mass-appraisal-service';
import { storage } from '../storage';
import { LogCategory, LogLevel } from '@shared/schema';

// Create router
const router = Router();

// Create mass appraisal service
const massAppraisalService = new MassAppraisalService();

/**
 * Perform mass appraisal analysis
 * 
 * POST /api/analysis/mass-appraisal
 */
router.post('/mass-appraisal', async (req, res) => {
  try {
    const config: MassAppraisalConfig = req.body;
    
    // Validate config
    if (!config.camaConnectorName) {
      return res.status(400).json({
        success: false,
        error: 'CAMA connector name is required'
      });
    }
    
    // Default validation options if not provided
    if (!config.validationOptions) {
      config.validationOptions = {
        validateIndividualProperties: true,
        validateSales: true,
        applyRemediation: false
      };
    }
    
    // Log analysis request
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: 'Mass appraisal analysis request',
      details: JSON.stringify({
        camaConnector: config.camaConnectorName,
        validationOptions: config.validationOptions
      }),
      source: 'api',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: null,
      endpoint: '/api/analysis/mass-appraisal',
      tags: ['mass-appraisal', 'analysis', 'request']
    });
    
    // Perform analysis
    const results = await massAppraisalService.performAnalysis(config);
    
    // Return results
    return res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error performing mass appraisal analysis:', error);
    
    // Log error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: `Error performing mass appraisal analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }),
      source: 'api',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: '/api/analysis/mass-appraisal',
      tags: ['mass-appraisal', 'analysis', 'error']
    });
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Run data validation on a specific dataset
 * 
 * POST /api/analysis/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { datasetType, connectorName, options } = req.body;
    
    // Validate request
    if (!datasetType || !connectorName) {
      return res.status(400).json({
        success: false,
        error: 'Dataset type and connector name are required'
      });
    }
    
    // Create mass appraisal config
    const config: MassAppraisalConfig = {
      camaConnectorName: connectorName,
      validationOptions: {
        validateIndividualProperties: datasetType === 'properties',
        validateSales: datasetType === 'sales',
        applyRemediation: options?.applyRemediation || false
      }
    };
    
    // Perform analysis (only validation)
    const results = await massAppraisalService.performAnalysis(config);
    
    // Extract validation results
    const validationResults = results.dataValidation;
    
    if (!validationResults) {
      return res.status(404).json({
        success: false,
        error: 'No validation results available'
      });
    }
    
    // Return results
    return res.json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    console.error('Error performing data validation:', error);
    
    // Log error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: `Error performing data validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }),
      source: 'api',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: '/api/analysis/validate',
      tags: ['data-validation', 'error']
    });
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Perform ratio study on sales data
 * 
 * POST /api/analysis/ratio-study
 */
router.post('/ratio-study', async (req, res) => {
  try {
    const { connectorName, config } = req.body;
    
    // Validate request
    if (!connectorName) {
      return res.status(400).json({
        success: false,
        error: 'Connector name is required'
      });
    }
    
    // Create mass appraisal config
    const analysisConfig: MassAppraisalConfig = {
      camaConnectorName: connectorName,
      ratioStudyConfig: config || {}
    };
    
    // Perform analysis
    const results = await massAppraisalService.performAnalysis(analysisConfig);
    
    // Extract ratio study results
    const ratioStudyResults = results.ratioStudy;
    
    if (!ratioStudyResults) {
      return res.status(404).json({
        success: false,
        error: 'No ratio study results available. Ensure that sales data is available.'
      });
    }
    
    // Return results
    return res.json({
      success: true,
      data: ratioStudyResults
    });
  } catch (error) {
    console.error('Error performing ratio study:', error);
    
    // Log error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: `Error performing ratio study: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }),
      source: 'api',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: '/api/analysis/ratio-study',
      tags: ['ratio-study', 'error']
    });
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Perform spatial analysis
 * 
 * POST /api/analysis/spatial
 */
router.post('/spatial', async (req, res) => {
  try {
    const { connectorName, analysisType, config } = req.body;
    
    // Validate request
    if (!connectorName) {
      return res.status(400).json({
        success: false,
        error: 'Connector name is required'
      });
    }
    
    if (!analysisType || !['autocorrelation', 'regression', 'both'].includes(analysisType)) {
      return res.status(400).json({
        success: false,
        error: 'Analysis type is required and must be "autocorrelation", "regression", or "both"'
      });
    }
    
    // Create mass appraisal config
    const analysisConfig: MassAppraisalConfig = {
      camaConnectorName: connectorName
    };
    
    // Set specific configuration based on analysis type
    if (analysisType === 'autocorrelation' || analysisType === 'both') {
      analysisConfig.spatialAutocorrelationConfig = config?.autocorrelation || {};
    }
    
    if (analysisType === 'regression' || analysisType === 'both') {
      analysisConfig.spatialModelConfig = config?.regression || {};
    }
    
    // Perform analysis
    const results = await massAppraisalService.performAnalysis(analysisConfig);
    
    // Extract spatial analysis results
    const spatialResults = results.spatialAnalysis;
    
    if (!spatialResults) {
      return res.status(404).json({
        success: false,
        error: 'No spatial analysis results available. Ensure that property data with coordinates is available.'
      });
    }
    
    // Filter results based on analysis type
    let responseData: any = {};
    
    if (analysisType === 'autocorrelation' || analysisType === 'both') {
      responseData.autocorrelation = spatialResults.autocorrelation;
    }
    
    if (analysisType === 'regression' || analysisType === 'both') {
      responseData.regression = spatialResults.regression;
    }
    
    // Return results
    return res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error performing spatial analysis:', error);
    
    // Log error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: `Error performing spatial analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }),
      source: 'api',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: '/api/analysis/spatial',
      tags: ['spatial-analysis', 'error']
    });
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;