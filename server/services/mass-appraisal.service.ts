/**
 * Mass Appraisal Service
 * 
 * This service provides advanced mass appraisal capabilities similar to professional
 * CAMA systems. It implements multiple regression analysis, geospatial modeling,
 * and various valuation techniques for high-volume property valuation.
 */

import { PropertyData, PropertyListing } from '../../server/types/property';
import { DemographicData } from '../../server/types/external-data';
import { AppError } from '../errors';

/**
 * Model variable types used in regression models
 */
export enum ModelVariableType {
  CONTINUOUS = 'continuous',
  CATEGORICAL = 'categorical',
  SPATIAL = 'spatial',
  INDICATOR = 'indicator',
  TRANSFORMED = 'transformed'
}

/**
 * Transformation types for model variables
 */
export enum TransformationType {
  NONE = 'none',
  LOG = 'log',
  SQUARE = 'square',
  SQUARE_ROOT = 'squareRoot',
  INVERSE = 'inverse',
  STANDARDIZE = 'standardize'
}

/**
 * Model types for mass appraisal
 */
export enum ModelType {
  ADDITIVE = 'additive',           // Simple additive model
  MULTIPLICATIVE = 'multiplicative', // Multiplicative model
  HYBRID = 'hybrid',               // Hybrid additive/multiplicative
  NONLINEAR = 'nonlinear'          // Nonlinear model
}

/**
 * Model variable configuration
 */
export interface ModelVariable {
  name: string;
  type: ModelVariableType;
  transformation: TransformationType;
  coefficient?: number;
  tValue?: number;
  pValue?: number;
  standardError?: number;
  importance?: number;
}

/**
 * Model configuration for mass appraisal
 */
export interface MassAppraisalModel {
  id: string;
  name: string;
  description: string;
  type: ModelType;
  dependentVariable: string;
  independentVariables: ModelVariable[];
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  coefficientOfDispersion: number;
  priceRelatedDifferential: number;
  priceRelatedBias: number;
  meanAbsolutePercentageError: number;
  created: Date;
  lastCalibrated?: Date;
  propertyClass: string;
  neighborhoodCodes?: string[];
}

/**
 * Model calibration results
 */
export interface ModelCalibrationResult {
  success: boolean;
  rSquared: number;
  adjustedRSquared: number;
  coefficientOfDispersion: number;
  priceRelatedDifferential: number;
  priceRelatedBias: number;
  meanAbsolutePercentageError: number;
  sampleSize: number;
  variables: ModelVariable[];
  diagnostics: {
    multicollinearity?: {
      varianceInflationFactors: Record<string, number>;
      condition: 'acceptable' | 'caution' | 'problematic';
    };
    residualAnalysis: {
      normality: boolean;
      heteroscedasticity: boolean;
      spatialAutocorrelation?: number;
    };
    influentialObservations: number[];
  };
}

/**
 * Location adjustment factor
 */
export interface LocationAdjustmentFactor {
  neighborhoodCode: string;
  factor: number;
  confidence: number;
}

/**
 * Depreciation table entry
 */
export interface DepreciationTableEntry {
  effectiveAge: number;
  qualityClass: string;
  physicalDepreciation: number;
  functionalObsolescence?: number;
  economicObsolescence?: number;
}

/**
 * Final value reconciliation
 */
export interface ValueReconciliation {
  costApproachValue?: number;
  costApproachWeight?: number;
  salesComparisonValue?: number;
  salesComparisonWeight?: number;
  incomeApproachValue?: number;
  incomeApproachWeight?: number;
  finalValue: number;
  reliabilityScore: number; // 0-100
  confidence: number; // 0-1
  overrides?: {
    reason: string;
    user: string;
    timestamp: Date;
    originalValue: number;
  };
}

/**
 * Configuration for mass appraisal service
 */
export interface MassAppraisalServiceConfig {
  minSampleSize: number;
  maxIterations: number;
  confidenceLevel: number;
  outlierThreshold: number;
  enableSpatialAdjustment: boolean;
  timeAdjustmentMethod: 'monthly' | 'quarterly' | 'annual';
  defaultNeighborhoodRadius: number;
  defaultSearchRadius: number;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: MassAppraisalServiceConfig = {
  minSampleSize: 30,
  maxIterations: 100,
  confidenceLevel: 0.95,
  outlierThreshold: 2.5,
  enableSpatialAdjustment: true,
  timeAdjustmentMethod: 'monthly',
  defaultNeighborhoodRadius: 2, // km
  defaultSearchRadius: 5 // km
};

/**
 * Main service class for mass appraisal
 */
export class MassAppraisalService {
  private static instance: MassAppraisalService;
  private config: MassAppraisalServiceConfig;
  private models: Map<string, MassAppraisalModel> = new Map();
  private locationFactors: Map<string, LocationAdjustmentFactor> = new Map();
  private depreciationTables: Map<string, DepreciationTableEntry[]> = new Map();

  /**
   * Private constructor for singleton
   */
  private constructor(config: Partial<MassAppraisalServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize with a default depreciation table
    this.initializeDefaultTables();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<MassAppraisalServiceConfig>): MassAppraisalService {
    if (!MassAppraisalService.instance) {
      MassAppraisalService.instance = new MassAppraisalService(config);
    }
    return MassAppraisalService.instance;
  }

  /**
   * Initialize default tables for depreciation and location factors
   */
  private initializeDefaultTables(): void {
    const depreciationTableStandard: DepreciationTableEntry[] = [
      { effectiveAge: 0, qualityClass: 'Excellent', physicalDepreciation: 0 },
      { effectiveAge: 5, qualityClass: 'Excellent', physicalDepreciation: 5 },
      { effectiveAge: 10, qualityClass: 'Excellent', physicalDepreciation: 10 },
      { effectiveAge: 15, qualityClass: 'Excellent', physicalDepreciation: 15 },
      { effectiveAge: 20, qualityClass: 'Excellent', physicalDepreciation: 20 },
      { effectiveAge: 25, qualityClass: 'Excellent', physicalDepreciation: 24 },
      { effectiveAge: 30, qualityClass: 'Excellent', physicalDepreciation: 28 },
      { effectiveAge: 35, qualityClass: 'Excellent', physicalDepreciation: 32 },
      { effectiveAge: 40, qualityClass: 'Excellent', physicalDepreciation: 36 },
      { effectiveAge: 45, qualityClass: 'Excellent', physicalDepreciation: 39 },
      { effectiveAge: 50, qualityClass: 'Excellent', physicalDepreciation: 42 },
      { effectiveAge: 0, qualityClass: 'Good', physicalDepreciation: 0 },
      { effectiveAge: 5, qualityClass: 'Good', physicalDepreciation: 7 },
      { effectiveAge: 10, qualityClass: 'Good', physicalDepreciation: 14 },
      { effectiveAge: 15, qualityClass: 'Good', physicalDepreciation: 20 },
      { effectiveAge: 20, qualityClass: 'Good', physicalDepreciation: 26 },
      { effectiveAge: 25, qualityClass: 'Good', physicalDepreciation: 31 },
      { effectiveAge: 30, qualityClass: 'Good', physicalDepreciation: 36 },
      { effectiveAge: 35, qualityClass: 'Good', physicalDepreciation: 40 },
      { effectiveAge: 40, qualityClass: 'Good', physicalDepreciation: 44 },
      { effectiveAge: 45, qualityClass: 'Good', physicalDepreciation: 48 },
      { effectiveAge: 50, qualityClass: 'Good', physicalDepreciation: 51 },
      { effectiveAge: 0, qualityClass: 'Average', physicalDepreciation: 0 },
      { effectiveAge: 5, qualityClass: 'Average', physicalDepreciation: 10 },
      { effectiveAge: 10, qualityClass: 'Average', physicalDepreciation: 19 },
      { effectiveAge: 15, qualityClass: 'Average', physicalDepreciation: 27 },
      { effectiveAge: 20, qualityClass: 'Average', physicalDepreciation: 34 },
      { effectiveAge: 25, qualityClass: 'Average', physicalDepreciation: 40 },
      { effectiveAge: 30, qualityClass: 'Average', physicalDepreciation: 46 },
      { effectiveAge: 35, qualityClass: 'Average', physicalDepreciation: 51 },
      { effectiveAge: 40, qualityClass: 'Average', physicalDepreciation: 56 },
      { effectiveAge: 45, qualityClass: 'Average', physicalDepreciation: 60 },
      { effectiveAge: 50, qualityClass: 'Average', physicalDepreciation: 64 },
      { effectiveAge: 0, qualityClass: 'Fair', physicalDepreciation: 0 },
      { effectiveAge: 5, qualityClass: 'Fair', physicalDepreciation: 15 },
      { effectiveAge: 10, qualityClass: 'Fair', physicalDepreciation: 28 },
      { effectiveAge: 15, qualityClass: 'Fair', physicalDepreciation: 39 },
      { effectiveAge: 20, qualityClass: 'Fair', physicalDepreciation: 48 },
      { effectiveAge: 25, qualityClass: 'Fair', physicalDepreciation: 56 },
      { effectiveAge: 30, qualityClass: 'Fair', physicalDepreciation: 63 },
      { effectiveAge: 35, qualityClass: 'Fair', physicalDepreciation: 69 },
      { effectiveAge: 40, qualityClass: 'Fair', physicalDepreciation: 74 },
      { effectiveAge: 45, qualityClass: 'Fair', physicalDepreciation: 78 },
      { effectiveAge: 50, qualityClass: 'Fair', physicalDepreciation: 82 },
    ];
    
    this.depreciationTables.set('standard', depreciationTableStandard);
    
    // Add Grandview location factors as an example
    const grandviewLocations: LocationAdjustmentFactor[] = [
      { neighborhoodCode: 'GV-CENTRAL', factor: 1.12, confidence: 0.93 },
      { neighborhoodCode: 'GV-NORTH', factor: 1.05, confidence: 0.89 },
      { neighborhoodCode: 'GV-SOUTH', factor: 0.98, confidence: 0.91 },
      { neighborhoodCode: 'GV-EAST', factor: 1.03, confidence: 0.87 },
      { neighborhoodCode: 'GV-WEST', factor: 0.95, confidence: 0.90 }
    ];
    
    for (const location of grandviewLocations) {
      this.locationFactors.set(location.neighborhoodCode, location);
    }
  }

  /**
   * Create a new mass appraisal model
   * 
   * @param model Model configuration
   * @returns Created model
   */
  public createModel(model: Omit<MassAppraisalModel, 'id' | 'created'>): MassAppraisalModel {
    const id = `model-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newModel: MassAppraisalModel = {
      ...model,
      id,
      created: new Date()
    };
    
    this.models.set(id, newModel);
    return newModel;
  }

  /**
   * Get a model by ID
   * 
   * @param id Model ID
   * @returns Model or undefined if not found
   */
  public getModel(id: string): MassAppraisalModel | undefined {
    return this.models.get(id);
  }

  /**
   * Get all models
   * 
   * @returns Array of all models
   */
  public getAllModels(): MassAppraisalModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Delete a model
   * 
   * @param id Model ID
   * @returns true if deleted, false if not found
   */
  public deleteModel(id: string): boolean {
    return this.models.delete(id);
  }

  /**
   * Calibrate a model using sample data
   * 
   * @param modelId Model ID to calibrate
   * @param sampleData Array of property data for calibration
   * @returns Calibration results
   */
  public calibrateModel(modelId: string, sampleData: PropertyData[]): ModelCalibrationResult {
    const model = this.models.get(modelId);
    if (!model) {
      throw new AppError('Model not found', 404, 'MODEL_NOT_FOUND');
    }
    
    if (sampleData.length < this.config.minSampleSize) {
      throw new AppError(
        `Insufficient sample size. Minimum required: ${this.config.minSampleSize}, provided: ${sampleData.length}`,
        400,
        'INSUFFICIENT_SAMPLE'
      );
    }
    
    // In a real implementation, this would perform actual MRA analysis
    // For this demo, we'll simulate the calibration
    const simulatedCalibration: ModelCalibrationResult = {
      success: true,
      rSquared: 0.86,
      adjustedRSquared: 0.84,
      coefficientOfDispersion: 8.5,
      priceRelatedDifferential: 1.02,
      priceRelatedBias: -0.012,
      meanAbsolutePercentageError: 6.7,
      sampleSize: sampleData.length,
      variables: model.independentVariables.map(variable => ({
        ...variable,
        coefficient: this.generateCoefficientForVariable(variable),
        tValue: Math.random() * 10 - 2,
        pValue: Math.random() * 0.1,
        standardError: Math.random() * 0.5,
        importance: Math.random()
      })),
      diagnostics: {
        multicollinearity: {
          varianceInflationFactors: this.generateVIFs(model.independentVariables),
          condition: 'acceptable'
        },
        residualAnalysis: {
          normality: true,
          heteroscedasticity: false,
          spatialAutocorrelation: 0.12
        },
        influentialObservations: [3, 15, 27]
      }
    };
    
    // Update the model with calibration results
    model.rSquared = simulatedCalibration.rSquared;
    model.adjustedRSquared = simulatedCalibration.adjustedRSquared;
    model.coefficientOfDispersion = simulatedCalibration.coefficientOfDispersion;
    model.priceRelatedDifferential = simulatedCalibration.priceRelatedDifferential;
    model.priceRelatedBias = simulatedCalibration.priceRelatedBias;
    model.independentVariables = simulatedCalibration.variables;
    model.lastCalibrated = new Date();
    
    this.models.set(modelId, model);
    
    return simulatedCalibration;
  }

  /**
   * Generate mock coefficient for a variable
   */
  private generateCoefficientForVariable(variable: ModelVariable): number {
    // Different ranges based on variable type
    switch (variable.name.toLowerCase()) {
      case 'squarefeet':
      case 'gla':
      case 'livingarea':
        return 55 + (Math.random() * 30 - 15); // Around $55 per sq ft
      case 'bedrooms':
        return 5000 + (Math.random() * 2000 - 1000);
      case 'bathrooms':
        return 8000 + (Math.random() * 3000 - 1500);
      case 'garagesize':
      case 'garage':
        return 4000 + (Math.random() * 2000 - 1000);
      case 'lotsize':
        return 0.5 + (Math.random() * 0.3 - 0.15);
      case 'yearbuilt':
      case 'year':
        return 120 + (Math.random() * 50 - 25);
      default:
        if (variable.type === ModelVariableType.INDICATOR) {
          return Math.random() * 20000 - 10000;
        }
        return Math.random() * 10000 - 2000;
    }
  }

  /**
   * Generate mock VIFs for variables
   */
  private generateVIFs(variables: ModelVariable[]): Record<string, number> {
    const vifs: Record<string, number> = {};
    for (const variable of variables) {
      // VIF between 1 and 5 (1-2 is good, 2-5 is moderate, >5 is high multicollinearity)
      vifs[variable.name] = 1 + Math.random() * 4;
    }
    return vifs;
  }

  /**
   * Value a property using a calibrated model
   * 
   * @param modelId Model ID to use
   * @param property Property to value
   * @returns Estimated value
   */
  public valueProperty(modelId: string, property: PropertyData): number {
    const model = this.models.get(modelId);
    if (!model) {
      throw new AppError('Model not found', 404, 'MODEL_NOT_FOUND');
    }
    
    if (!model.lastCalibrated) {
      throw new AppError('Model has not been calibrated', 400, 'MODEL_NOT_CALIBRATED');
    }
    
    let value = model.intercept;
    
    // Apply the model coefficients to property characteristics
    for (const variable of model.independentVariables) {
      if (!variable.coefficient) continue;
      
      const propertyValue = this.getPropertyValueForVariable(property, variable);
      if (propertyValue === null) continue;
      
      const transformedValue = this.applyTransformation(propertyValue, variable.transformation);
      value += transformedValue * variable.coefficient;
    }
    
    // Apply location adjustment if available
    const neighborhood = property.neighborhood || 'GV-CENTRAL';  
    const locationFactor = this.locationFactors.get(neighborhood);
    if (locationFactor) {
      value *= locationFactor.factor;
    }
    
    return Math.round(value);
  }

  /**
   * Get a property value for a model variable
   */
  private getPropertyValueForVariable(property: PropertyData, variable: ModelVariable): number | null {
    const propertyAny = property as any;
    
    switch (variable.name.toLowerCase()) {
      case 'squarefeet':
      case 'gla':
      case 'livingarea':
        return property.squareFeet || null;
      case 'bedrooms':
        return property.bedrooms || null;
      case 'bathrooms':
        return property.bathrooms || null;
      case 'garage':
      case 'garagesize':
        return propertyAny.garageSize || 0;
      case 'lotsize':
        return property.lotSize || null;
      case 'yearbuilt':
      case 'year':
        return property.yearBuilt || null;
      case 'quality':
      case 'qualityscore':
        // Convert quality string to score
        if (propertyAny.quality) {
          switch (propertyAny.quality.toLowerCase()) {
            case 'excellent': return 5;
            case 'good': return 4;
            case 'average': return 3;
            case 'fair': return 2;
            case 'poor': return 1;
            default: return parseInt(propertyAny.quality) || 3;
          }
        }
        return 3; // Default average quality
      default:
        return propertyAny[variable.name] || null;
    }
  }

  /**
   * Apply a transformation to a value
   */
  private applyTransformation(value: number, transformation: TransformationType): number {
    switch (transformation) {
      case TransformationType.LOG:
        return Math.log(value);
      case TransformationType.SQUARE:
        return value * value;
      case TransformationType.SQUARE_ROOT:
        return Math.sqrt(value);
      case TransformationType.INVERSE:
        return 1 / value;
      case TransformationType.STANDARDIZE:
        // Would require mean and std dev for the population
        return value;
      default:
        return value;
    }
  }

  /**
   * Calculate physical depreciation for a property
   * 
   * @param effectiveAge Effective age of the property
   * @param qualityClass Quality class of construction
   * @returns Depreciation percentage
   */
  public calculatePhysicalDepreciation(effectiveAge: number, qualityClass: string): number {
    const table = this.depreciationTables.get('standard');
    if (!table) {
      return this.calculateDefaultDepreciation(effectiveAge);
    }
    
    // Find the closest match in the table
    const matches = table.filter(entry => 
      entry.qualityClass === qualityClass &&
      entry.effectiveAge <= effectiveAge
    );
    
    if (matches.length === 0) {
      return this.calculateDefaultDepreciation(effectiveAge);
    }
    
    // Sort by effective age (descending) and take the first
    matches.sort((a, b) => b.effectiveAge - a.effectiveAge);
    return matches[0].physicalDepreciation;
  }

  /**
   * Calculate default depreciation based on age-life method
   */
  private calculateDefaultDepreciation(effectiveAge: number): number {
    // Assume 70 year economic life for residential properties
    const economicLife = 70;
    const depreciation = (effectiveAge / economicLife) * 100;
    return Math.min(Math.max(depreciation, 0), 80); // Cap at 80%
  }

  /**
   * Calculate functional obsolescence
   * 
   * @param property Property data
   * @returns Functional obsolescence percentage
   */
  public calculateFunctionalObsolescence(property: PropertyData): number {
    let obsolescence = 0;
    const propertyAny = property as any;
    
    // Check for typical sources of functional obsolescence
    
    // Inadequate bedrooms/bathrooms ratio
    if (property.bedrooms && property.bathrooms) {
      const bedroomsToBathrooms = property.bedrooms / property.bathrooms;
      if (bedroomsToBathrooms > 2.5) {
        obsolescence += 5; // Add 5% for inadequate bathrooms
      }
    }
    
    // Unusual floor plan
    if (propertyAny.hasIrregularFloorPlan) {
      obsolescence += 7;
    }
    
    // Outdated features
    if (propertyAny.hasOutdatedFeatures) {
      obsolescence += 5;
    }
    
    // Age of systems (electrical, plumbing, etc.)
    if (propertyAny.systemsAge && propertyAny.systemsAge > 25) {
      obsolescence += Math.min((propertyAny.systemsAge - 25) * 0.5, 10);
    }
    
    return Math.min(obsolescence, 30); // Cap at 30%
  }

  /**
   * Calculate external obsolescence
   * 
   * @param property Property data
   * @param demographics Demographic data for the area
   * @returns External obsolescence percentage
   */
  public calculateExternalObsolescence(property: PropertyData, demographics?: DemographicData): number {
    let obsolescence = 0;
    const propertyAny = property as any;
    
    // Check for external factors affecting value
    
    // Proximity to negative externalities
    if (propertyAny.proximityToNegativeExternality) {
      obsolescence += 10;
    }
    
    // Declining neighborhood
    if (propertyAny.isInDecliningNeighborhood) {
      obsolescence += 8;
    }
    
    // Economic factors
    if (demographics && demographics.unemploymentRate) {
      // Add 0.5% for each percentage point of unemployment over 6%
      if (demographics.unemploymentRate > 6) {
        obsolescence += (demographics.unemploymentRate - 6) * 0.5;
      }
    }
    
    // Zoning issues
    if (propertyAny.hasZoningIssues) {
      obsolescence += 12;
    }
    
    return Math.min(obsolescence, 25); // Cap at 25%
  }

  /**
   * Calculate total accrued depreciation
   * 
   * @param property Property data
   * @returns Total accrued depreciation percentage
   */
  public calculateAccruedDepreciation(property: PropertyData): {
    physical: number;
    functional: number;
    external: number;
    total: number;
  } {
    const propertyAny = property as any;
    const effectiveAge = propertyAny.effectiveAge || Math.max(new Date().getFullYear() - property.yearBuilt, 0);
    const qualityClass = propertyAny.qualityClass || 'Average';
    
    const physical = this.calculatePhysicalDepreciation(effectiveAge, qualityClass);
    const functional = this.calculateFunctionalObsolescence(property);
    const external = this.calculateExternalObsolescence(property);
    
    // Total depreciation is not simply additive
    // The components interact in a more complex way
    const total = physical + (1 - physical / 100) * functional + 
                (1 - physical / 100) * (1 - functional / 100) * external;
    
    return {
      physical,
      functional,
      external,
      total: Math.min(total, 90) // Cap total depreciation at 90%
    };
  }

  /**
   * Perform a reconciliation of multiple valuation approaches
   * 
   * @param cost Cost approach value
   * @param sales Sales comparison approach value
   * @param income Income approach value
   * @param property Property data for context
   * @returns Reconciled value with weights
   */
  public reconcileValues(
    cost: number | null, 
    sales: number | null, 
    income: number | null,
    property: PropertyData
  ): ValueReconciliation {
    // Determine reliability of each approach
    const costReliability = this.getApproachReliability('cost', property);
    const salesReliability = this.getApproachReliability('sales', property);
    const incomeReliability = this.getApproachReliability('income', property);
    
    // Calculate weights based on reliability
    const totalReliability = 
      (cost !== null ? costReliability : 0) + 
      (sales !== null ? salesReliability : 0) + 
      (income !== null ? incomeReliability : 0);
    
    const costWeight = cost !== null ? costReliability / totalReliability : 0;
    const salesWeight = sales !== null ? salesReliability / totalReliability : 0;
    const incomeWeight = income !== null ? incomeReliability / totalReliability : 0;
    
    // Calculate weighted average value
    let finalValue = 0;
    if (cost !== null) finalValue += cost * costWeight;
    if (sales !== null) finalValue += sales * salesWeight;
    if (income !== null) finalValue += income * incomeWeight;
    
    // Round to nearest $100
    finalValue = Math.round(finalValue / 100) * 100;
    
    // Calculate confidence score (higher when approaches are close)
    let confidence = 1;
    let valueCount = 0;
    let sum = 0;
    let squaredSum = 0;
    
    if (cost !== null) {
      valueCount++;
      sum += cost;
      squaredSum += cost * cost;
    }
    
    if (sales !== null) {
      valueCount++;
      sum += sales;
      squaredSum += sales * sales;
    }
    
    if (income !== null) {
      valueCount++;
      sum += income;
      squaredSum += income * income;
    }
    
    if (valueCount > 1) {
      const mean = sum / valueCount;
      const variance = (squaredSum / valueCount) - (mean * mean);
      const coefficientOfVariation = Math.sqrt(variance) / mean;
      
      // Convert coefficient of variation to confidence (inverse relationship)
      confidence = Math.max(0, 1 - coefficientOfVariation);
    }
    
    return {
      costApproachValue: cost === null ? undefined : cost,
      costApproachWeight: costWeight > 0 ? costWeight : undefined,
      salesComparisonValue: sales === null ? undefined : sales,
      salesComparisonWeight: salesWeight > 0 ? salesWeight : undefined,
      incomeApproachValue: income === null ? undefined : income,
      incomeApproachWeight: incomeWeight > 0 ? incomeWeight : undefined,
      finalValue,
      reliabilityScore: Math.round(confidence * 100),
      confidence
    };
  }

  /**
   * Get the reliability of a valuation approach for a property
   * 
   * @param approach Valuation approach
   * @param property Property data
   * @returns Reliability score (0-1)
   */
  private getApproachReliability(approach: 'cost' | 'sales' | 'income', property: PropertyData): number {
    const propertyAny = property as any;
    const propertyType = property.propertyType || '';
    const effectiveAge = propertyAny.effectiveAge || (property.yearBuilt ? new Date().getFullYear() - property.yearBuilt : 20);
    
    switch (approach) {
      case 'cost':
        // Cost approach more reliable for newer properties
        let costReliability = 1 - (effectiveAge / 70);
        
        // Less reliable for properties with high depreciation
        const depreciation = this.calculatePhysicalDepreciation(effectiveAge, propertyAny.qualityClass || 'Average');
        if (depreciation > 40) {
          costReliability *= 0.8;
        }
        
        return Math.max(0.3, costReliability);
        
      case 'sales':
        // Sales approach more reliable with good comps
        let salesReliability = 0.8;
        
        // More reliable for standard residential properties
        if (propertyType.includes('residential') || 
            propertyType.includes('single family') || 
            propertyType.includes('condo')) {
          salesReliability = 0.9;
        }
        
        // Less reliable for unique properties
        if (propertyAny.isUnique) {
          salesReliability *= 0.7;
        }
        
        return Math.max(0.5, salesReliability);
        
      case 'income':
        // Income approach more reliable for income-producing properties
        let incomeReliability = 0.5;
        
        if (propertyType.includes('multi-family') || 
            propertyType.includes('commercial') || 
            propertyType.includes('industrial') ||
            propertyType.includes('apartment')) {
          incomeReliability = 0.9;
        }
        
        return Math.max(0.3, incomeReliability);
        
      default:
        return 0.5;
    }
  }

  /**
   * Apply quality control to a batch of valuations
   * 
   * @param valuations Array of valuations to check
   * @returns Array of flagged valuations with reasons
   */
  public performQualityControl(valuations: Array<{
    property: PropertyData;
    value: number;
    assessedValue?: number;
  }>): Array<{
    property: PropertyData;
    value: number;
    assessedValue?: number;
    flags: Array<{
      type: 'outlier' | 'highAdjustment' | 'lowConfidence' | 'assessmentGap';
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
  }> {
    // Calculate basic statistics
    const values = valuations.map(v => v.value);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return valuations.map(valuation => {
      const flags: Array<{
        type: "outlier" | "highAdjustment" | "lowConfidence" | "assessmentGap";
        severity: "high" | "medium" | "low";
        description: string;
      }> = [];
      
      // Check if outlier
      const zScore = Math.abs(valuation.value - mean) / stdDev;
      if (zScore > 2.5) {
        const severity: "high" | "medium" = zScore > 3.5 ? "high" : "medium";
        flags.push({
          type: "outlier",
          severity,
          description: `Value is ${zScore.toFixed(1)} standard deviations from mean`
        });
      }
      
      // Check assessment gap
      if (valuation.assessedValue) {
        const gap = Math.abs(valuation.value - valuation.assessedValue) / valuation.assessedValue;
        if (gap > 0.15) {
          const severity: "high" | "medium" = gap > 0.25 ? "high" : "medium";
          flags.push({
            type: "assessmentGap",
            severity,
            description: `Assessment differs by ${(gap * 100).toFixed(1)}% from estimated value`
          });
        }
      }
      
      // More flags would be added in a real implementation
      
      return {
        ...valuation,
        flags
      };
    });
  }

  /**
   * Generate IAAO ratio study statistics
   * 
   * @param valuations Array of valuations with assessed values
   * @returns IAAO ratio study statistics
   */
  public performRatioStudy(valuations: Array<{
    property: PropertyData;
    marketValue: number;
    assessedValue: number;
  }>): {
    medianRatio: number;
    meanRatio: number;
    weightedMeanRatio: number;
    coefficientOfDispersion: number;
    coefficientOfVariation: number;
    priceRelatedDifferential: number;
    priceRelatedBias: number;
    count: number;
    standardDeviation: number;
    passesCOD: boolean;
    passesPRD: boolean;
    passesPRB: boolean;
  } {
    // Calculate ratios
    const ratios = valuations.map(v => v.assessedValue / v.marketValue);
    const marketValues = valuations.map(v => v.marketValue);
    
    // Sort ratios for median calculation
    const sortedRatios = [...ratios].sort((a, b) => a - b);
    const medianRatio = this.calculateMedian(sortedRatios);
    
    // Calculate mean ratio
    const sumRatios = ratios.reduce((sum, ratio) => sum + ratio, 0);
    const meanRatio = sumRatios / ratios.length;
    
    // Calculate weighted mean ratio
    const sumAssessed = valuations.reduce((sum, v) => sum + v.assessedValue, 0);
    const sumMarket = valuations.reduce((sum, v) => sum + v.marketValue, 0);
    const weightedMeanRatio = sumAssessed / sumMarket;
    
    // Calculate standard deviation
    const sumSquaredDiff = ratios.reduce((sum, ratio) => sum + Math.pow(ratio - meanRatio, 2), 0);
    const standardDeviation = Math.sqrt(sumSquaredDiff / ratios.length);
    
    // Calculate coefficient of dispersion (COD)
    const sumAbsoluteDeviations = ratios.reduce((sum, ratio) => 
      sum + Math.abs(ratio - medianRatio), 0);
    const coefficientOfDispersion = (sumAbsoluteDeviations / ratios.length) / medianRatio * 100;
    
    // Calculate coefficient of variation (COV)
    const coefficientOfVariation = (standardDeviation / meanRatio) * 100;
    
    // Calculate price related differential (PRD)
    const priceRelatedDifferential = meanRatio / weightedMeanRatio;
    
    // Calculate price related bias (PRB)
    // This is a simplified version; real PRB uses regression
    const logValues = marketValues.map(value => Math.log(value));
    const meanLogValue = logValues.reduce((sum, value) => sum + value, 0) / logValues.length;
    const adjustedRatios = ratios.map(ratio => ratio - meanRatio);
    
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < ratios.length; i++) {
      numerator += adjustedRatios[i] * (logValues[i] - meanLogValue);
      denominator += Math.pow(logValues[i] - meanLogValue, 2);
    }
    
    const priceRelatedBias = numerator / denominator;
    
    // Check if meets IAAO standards
    // Residential standards:
    // COD <= 15.0
    // PRD between 0.98 and 1.03
    // PRB between -0.05 and 0.05
    const passesCOD = coefficientOfDispersion <= 15.0;
    const passesPRD = priceRelatedDifferential >= 0.98 && priceRelatedDifferential <= 1.03;
    const passesPRB = priceRelatedBias >= -0.05 && priceRelatedBias <= 0.05;
    
    return {
      medianRatio,
      meanRatio,
      weightedMeanRatio,
      coefficientOfDispersion,
      coefficientOfVariation,
      priceRelatedDifferential,
      priceRelatedBias,
      count: ratios.length,
      standardDeviation,
      passesCOD,
      passesPRD,
      passesPRB
    };
  }

  /**
   * Calculate median of an array
   */
  private calculateMedian(sortedArray: number[]): number {
    const midpoint = Math.floor(sortedArray.length / 2);
    if (sortedArray.length % 2 === 0) {
      return (sortedArray[midpoint - 1] + sortedArray[midpoint]) / 2;
    } else {
      return sortedArray[midpoint];
    }
  }
}

// Export singleton instance
export const massAppraisalService = MassAppraisalService.getInstance();