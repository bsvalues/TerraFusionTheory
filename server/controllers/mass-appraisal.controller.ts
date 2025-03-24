/**
 * Mass Appraisal Controller
 * 
 * This controller exposes API endpoints for mass appraisal functionality
 * similar to professional CAMA systems.
 */

import { Request, Response } from 'express';
import { 
  massAppraisalService, 
  MassAppraisalModel, 
  ModelType, 
  ModelVariableType,
  TransformationType
} from '../services/mass-appraisal.service';
import { AppError } from '../errors';

/**
 * Get all mass appraisal models
 * 
 * @param req The request object
 * @param res The response object
 */
export async function getAllModels(req: Request, res: Response) {
  try {
    const models = massAppraisalService.getAllModels();
    return res.status(200).json(models);
  } catch (error) {
    console.error('Error getting mass appraisal models:', error);
    return res.status(500).json({ error: 'Failed to get mass appraisal models' });
  }
}

/**
 * Get a specific mass appraisal model by ID
 * 
 * @param req The request object
 * @param res The response object
 */
export async function getModelById(req: Request, res: Response) {
  try {
    const modelId = req.params.id;
    
    if (!modelId) {
      return res.status(400).json({ error: 'Missing model ID' });
    }
    
    const model = massAppraisalService.getModel(modelId);
    
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    return res.status(200).json(model);
  } catch (error) {
    console.error('Error getting mass appraisal model:', error);
    return res.status(500).json({ error: 'Failed to get mass appraisal model' });
  }
}

/**
 * Create a new mass appraisal model
 * 
 * @param req The request object
 * @param res The response object
 */
export async function createModel(req: Request, res: Response) {
  try {
    const modelData = req.body;
    
    if (!modelData || !modelData.name || !modelData.type || !modelData.dependentVariable) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['name', 'type', 'dependentVariable'] 
      });
    }
    
    // Create the model
    const model = massAppraisalService.createModel({
      name: modelData.name,
      description: modelData.description || '',
      type: modelData.type as ModelType,
      dependentVariable: modelData.dependentVariable,
      independentVariables: modelData.independentVariables || [],
      intercept: modelData.intercept || 0,
      rSquared: modelData.rSquared || 0,
      adjustedRSquared: modelData.adjustedRSquared || 0,
      coefficientOfDispersion: modelData.coefficientOfDispersion || 0,
      priceRelatedDifferential: modelData.priceRelatedDifferential || 0,
      priceRelatedBias: modelData.priceRelatedBias || 0,
      meanAbsolutePercentageError: modelData.meanAbsolutePercentageError || 0,
      propertyClass: modelData.propertyClass || 'Residential',
      neighborhoodCodes: modelData.neighborhoodCodes || []
    });
    
    return res.status(201).json(model);
  } catch (error) {
    console.error('Error creating mass appraisal model:', error);
    return res.status(500).json({ error: 'Failed to create mass appraisal model' });
  }
}

/**
 * Delete a mass appraisal model
 * 
 * @param req The request object
 * @param res The response object
 */
export async function deleteModel(req: Request, res: Response) {
  try {
    const modelId = req.params.id;
    
    if (!modelId) {
      return res.status(400).json({ error: 'Missing model ID' });
    }
    
    const deleted = massAppraisalService.deleteModel(modelId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    return res.status(200).json({ success: true, message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting mass appraisal model:', error);
    return res.status(500).json({ error: 'Failed to delete mass appraisal model' });
  }
}

/**
 * Calibrate a mass appraisal model
 * 
 * @param req The request object
 * @param res The response object
 */
export async function calibrateModel(req: Request, res: Response) {
  try {
    const modelId = req.params.id;
    const { sampleData } = req.body;
    
    if (!modelId) {
      return res.status(400).json({ error: 'Missing model ID' });
    }
    
    if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid sample data' });
    }
    
    try {
      const result = massAppraisalService.calibrateModel(modelId, sampleData);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error calibrating mass appraisal model:', error);
    return res.status(500).json({ error: 'Failed to calibrate mass appraisal model' });
  }
}

/**
 * Value a property using a calibrated model
 * 
 * @param req The request object
 * @param res The response object
 */
export async function valueProperty(req: Request, res: Response) {
  try {
    const modelId = req.params.id;
    const { property } = req.body;
    
    if (!modelId) {
      return res.status(400).json({ error: 'Missing model ID' });
    }
    
    if (!property) {
      return res.status(400).json({ error: 'Missing property data' });
    }
    
    try {
      const value = massAppraisalService.valueProperty(modelId, property);
      return res.status(200).json({ 
        value,
        property,
        modelId
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error valuing property:', error);
    return res.status(500).json({ error: 'Failed to value property' });
  }
}

/**
 * Calculate depreciation for a property
 * 
 * @param req The request object
 * @param res The response object
 */
export async function calculateDepreciation(req: Request, res: Response) {
  try {
    const { property } = req.body;
    
    if (!property) {
      return res.status(400).json({ error: 'Missing property data' });
    }
    
    const depreciation = massAppraisalService.calculateAccruedDepreciation(property);
    
    return res.status(200).json(depreciation);
  } catch (error) {
    console.error('Error calculating depreciation:', error);
    return res.status(500).json({ error: 'Failed to calculate depreciation' });
  }
}

/**
 * Reconcile multiple valuation approaches
 * 
 * @param req The request object
 * @param res The response object
 */
export async function reconcileValues(req: Request, res: Response) {
  try {
    const { cost, sales, income, property } = req.body;
    
    if (!property) {
      return res.status(400).json({ error: 'Missing property data' });
    }
    
    const reconciliation = massAppraisalService.reconcileValues(
      cost || null, 
      sales || null, 
      income || null,
      property
    );
    
    return res.status(200).json(reconciliation);
  } catch (error) {
    console.error('Error reconciling values:', error);
    return res.status(500).json({ error: 'Failed to reconcile values' });
  }
}

/**
 * Perform quality control on a batch of valuations
 * 
 * @param req The request object
 * @param res The response object
 */
export async function performQualityControl(req: Request, res: Response) {
  try {
    const { valuations } = req.body;
    
    if (!valuations || !Array.isArray(valuations) || valuations.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid valuations' });
    }
    
    const results = massAppraisalService.performQualityControl(valuations);
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error performing quality control:', error);
    return res.status(500).json({ error: 'Failed to perform quality control' });
  }
}

/**
 * Perform IAAO ratio study on a batch of valuations
 * 
 * @param req The request object
 * @param res The response object
 */
export async function performRatioStudy(req: Request, res: Response) {
  try {
    const { valuations } = req.body;
    
    if (!valuations || !Array.isArray(valuations) || valuations.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid valuations' });
    }
    
    if (!valuations.every(v => v.marketValue && v.assessedValue)) {
      return res.status(400).json({ 
        error: 'Each valuation must include marketValue and assessedValue' 
      });
    }
    
    const results = massAppraisalService.performRatioStudy(valuations);
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error performing ratio study:', error);
    return res.status(500).json({ error: 'Failed to perform ratio study' });
  }
}

/**
 * Get sample models for demonstration purposes
 * 
 * @param req The request object
 * @param res The response object
 */
export async function getSampleModels(req: Request, res: Response) {
  try {
    // Create sample models if none exist
    if (massAppraisalService.getAllModels().length === 0) {
      createSampleModels();
    }
    
    const models = massAppraisalService.getAllModels();
    return res.status(200).json(models);
  } catch (error) {
    console.error('Error getting sample models:', error);
    return res.status(500).json({ error: 'Failed to get sample models' });
  }
}

/**
 * Create sample models for demonstration
 */
function createSampleModels() {
  // Sample models based on IAAO standards and professional CAMA implementations
  
  // 1. Residential Market Value Model (Additive)
  massAppraisalService.createModel({
    name: 'Residential Market Value Model',
    description: 'Standard additive model for residential properties using IAAO-compliant methodology',
    type: ModelType.ADDITIVE,
    dependentVariable: 'marketValue',
    independentVariables: [
      {
        name: 'squareFeet',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: 110.5,
        tValue: 12.3,
        pValue: 0.0001,
        standardError: 9.2,
        importance: 0.45
      },
      {
        name: 'bedrooms',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: 12500,
        tValue: 4.2,
        pValue: 0.0012,
        standardError: 2976.19,
        importance: 0.12
      },
      {
        name: 'bathrooms',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: 18500,
        tValue: 5.8,
        pValue: 0.0003,
        standardError: 3189.66,
        importance: 0.18
      },
      {
        name: 'garageSize',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: 9500,
        tValue: 3.1,
        pValue: 0.0083,
        standardError: 3064.52,
        importance: 0.06
      },
      {
        name: 'lotSize',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.SQUARE_ROOT,
        coefficient: 2.35,
        tValue: 3.5,
        pValue: 0.0032,
        standardError: 0.67,
        importance: 0.08
      },
      {
        name: 'yearBuilt',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: 175.5,
        tValue: 6.2,
        pValue: 0.0001,
        standardError: 28.31,
        importance: 0.11
      }
    ],
    intercept: -290650,
    rSquared: 0.86,
    adjustedRSquared: 0.84,
    coefficientOfDispersion: 8.5,
    priceRelatedDifferential: 1.01,
    priceRelatedBias: -0.012,
    meanAbsolutePercentageError: 6.7,
    propertyClass: 'Residential',
    neighborhoodCodes: ['GV-CENTRAL', 'GV-NORTH', 'GV-SOUTH', 'GV-EAST', 'GV-WEST']
  });
  
  // 2. Multiplicative Model (Common in CAMA systems)
  massAppraisalService.createModel({
    name: 'Residential Multiplicative Value Model',
    description: 'Multiplicative model with location factors for improved vertical equity in residential assessments',
    type: ModelType.MULTIPLICATIVE,
    dependentVariable: 'marketValue',
    independentVariables: [
      {
        name: 'squareFeet',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.LOG,
        coefficient: 1.12,
        tValue: 14.8,
        pValue: 0.00001,
        standardError: 0.076,
        importance: 0.52
      },
      {
        name: 'qualityScore',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: 0.15,
        tValue: 8.3,
        pValue: 0.00006,
        standardError: 0.018,
        importance: 0.14
      },
      {
        name: 'yearBuilt',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: 0.002,
        tValue: 7.4,
        pValue: 0.0001,
        standardError: 0.00027,
        importance: 0.12
      },
      {
        name: 'neighborhood',
        type: ModelVariableType.CATEGORICAL,
        transformation: TransformationType.NONE,
        importance: 0.22
      }
    ],
    intercept: 9.45,
    rSquared: 0.89,
    adjustedRSquared: 0.87,
    coefficientOfDispersion: 7.2,
    priceRelatedDifferential: 1.005,
    priceRelatedBias: -0.008,
    meanAbsolutePercentageError: 5.8,
    propertyClass: 'Residential',
    neighborhoodCodes: ['GV-CENTRAL', 'GV-NORTH', 'GV-SOUTH', 'GV-EAST', 'GV-WEST']
  });
  
  // 3. Commercial Income Model
  massAppraisalService.createModel({
    name: 'Commercial Income Value Model',
    description: 'Income-focused commercial property valuation model using direct capitalization approach',
    type: ModelType.HYBRID,
    dependentVariable: 'marketValue',
    independentVariables: [
      {
        name: 'potentialGrossIncome',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: 8.5,
        tValue: 16.2,
        pValue: 0.00001,
        standardError: 0.525,
        importance: 0.63
      },
      {
        name: 'expenseRatio',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: -150000,
        tValue: 7.8,
        pValue: 0.0001,
        standardError: 19230.77,
        importance: 0.18
      },
      {
        name: 'vacancyRate',
        type: ModelVariableType.CONTINUOUS,
        transformation: TransformationType.NONE,
        coefficient: -280000,
        tValue: 4.5,
        pValue: 0.001,
        standardError: 62222.22,
        importance: 0.09
      },
      {
        name: 'buildingClass',
        type: ModelVariableType.CATEGORICAL,
        transformation: TransformationType.NONE,
        importance: 0.10
      }
    ],
    intercept: 115000,
    rSquared: 0.92,
    adjustedRSquared: 0.91,
    coefficientOfDispersion: 8.8,
    priceRelatedDifferential: 1.02,
    priceRelatedBias: 0.004,
    meanAbsolutePercentageError: 7.2,
    propertyClass: 'Commercial',
    neighborhoodCodes: ['GV-COMMERCIAL', 'GV-CBD', 'GV-INDUSTRIAL']
  });
}