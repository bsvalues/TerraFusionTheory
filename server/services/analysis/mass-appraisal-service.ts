/**
 * Mass Appraisal Analysis Service
 * 
 * Provides comprehensive analysis capabilities for mass appraisal,
 * including data validation, statistical analysis, and spatial modeling.
 * Implements IAAO standards.
 */

import { DataValidator } from '../../../shared/validation/data-validator';
import { PropertyData, CAMAConnector } from '../connectors/cama.connector';
import { propertyValidationRules, propertySaleValidationRules, getPropertyValidationRules } from '../../../shared/validation/property-validation-rules';
import { ValidationReport, ValidationSummary } from '../../../shared/validation/validation.types';
import { RatioStudies, PropertySale, RatioStudyResults, RatioStudyConfig } from '../../../shared/statistics/ratio-studies';
import { SpatialRegressionModel, ModelSpecification, SpatialWeightMatrix, PredictionResult } from '../../../shared/statistics/spatial-regression';
import { SpatialAutocorrelation, SpatialAutocorrelationOptions, SpatialAutocorrelationResults } from '../../../shared/statistics/spatial-autocorrelation';
import { connectorFactory } from '../connectors/connector.factory';
import { LogCategory, LogLevel } from '@shared/schema';
import { storage } from '../../storage';

/**
 * Configuration for mass appraisal analysis
 */
export interface MassAppraisalConfig {
  camaConnectorName: string;
  ratioStudyConfig?: RatioStudyConfig;
  spatialModelConfig?: ModelSpecification;
  spatialAutocorrelationConfig?: SpatialAutocorrelationOptions;
  validationOptions?: {
    validateIndividualProperties?: boolean;
    validateSales?: boolean;
    applyRemediation?: boolean;
  };
}

/**
 * Mass appraisal analysis results
 */
export interface MassAppraisalResults {
  dataValidation?: ValidationReport;
  ratioStudy?: RatioStudyResults;
  spatialAnalysis?: {
    autocorrelation?: SpatialAutocorrelationResults;
    regression?: {
      model: any;
      predictions?: PredictionResult[];
      performance: {
        r2: number;
        adjR2: number;
        rmse: number;
        mape: number;
      };
    };
  };
  summary: {
    validProperties: number;
    invalidProperties: number;
    assessmentLevel: number; // Median ratio
    codeOfDispersion: number;
    priceRelatedDifferential: number;
    spatialAutocorrelation: number; // Moran's I
    modelFit: number; // R-squared
    timestamp: string;
  };
}

/**
 * Service for performing mass appraisal analysis
 */
export class MassAppraisalService {
  private validator: DataValidator;
  private ratioStudies: RatioStudies;
  private spatialAutocorrelation: SpatialAutocorrelation;
  
  constructor() {
    this.validator = new DataValidator();
    this.ratioStudies = new RatioStudies();
    this.spatialAutocorrelation = new SpatialAutocorrelation();
    
    // Register validation rule sets
    this.validator.registerRuleSet(propertyValidationRules);
    this.validator.registerRuleSet(propertySaleValidationRules);
  }
  
  /**
   * Perform a comprehensive mass appraisal analysis
   */
  public async performAnalysis(config: MassAppraisalConfig): Promise<MassAppraisalResults> {
    try {
      // Get CAMA connector
      const camaConnector = connectorFactory.getConnector(config.camaConnectorName) as CAMAConnector;
      
      if (!camaConnector) {
        throw new Error(`CAMA connector '${config.camaConnectorName}' not found`);
      }
      
      // Fetch property data
      const { properties } = await camaConnector.fetchData({});
      
      // Log analysis start
      await this.logAnalysisActivity('start', {
        connectorName: config.camaConnectorName,
        propertyCount: properties.length
      });
      
      // Initialize results object
      const results: MassAppraisalResults = {
        summary: {
          validProperties: 0,
          invalidProperties: 0,
          assessmentLevel: 0,
          codeOfDispersion: 0,
          priceRelatedDifferential: 0,
          spatialAutocorrelation: 0,
          modelFit: 0,
          timestamp: new Date().toISOString()
        }
      };
      
      // Step 1: Validate property data
      if (config.validationOptions?.validateIndividualProperties) {
        results.dataValidation = await this.validateProperties(properties);
        
        results.summary.validProperties = results.dataValidation.validEntities;
        results.summary.invalidProperties = results.dataValidation.invalidEntities;
        
        // Log validation results
        await this.logAnalysisActivity('validation', {
          validProperties: results.dataValidation.validEntities,
          invalidProperties: results.dataValidation.invalidEntities,
          criticalIssues: results.dataValidation.criticalIssues,
          errorIssues: results.dataValidation.errorIssues,
          warningIssues: results.dataValidation.warningIssues
        });
      }
      
      // Step 2: Prepare sales data for ratio study
      // For this implementation, we'll use the same data but filter properties with sale data
      const sales: PropertySale[] = properties
        .filter(p => p.lastSaleDate && p.lastSalePrice && p.lastSalePrice > 0)
        .map(p => ({
          id: p.id,
          parcelId: p.parcelId,
          assessedValue: p.assessedValue,
          salePrice: p.lastSalePrice || 0,
          saleDate: p.lastSaleDate || '',
          propertyType: p.propertyClass,
          neighborhood: p.neighborhood || '',
          latitude: p.latitude,
          longitude: p.longitude,
          assessmentYear: p.assessmentYear
        }));
      
      // Log sales data preparation
      await this.logAnalysisActivity('prepare_sales', {
        salesCount: sales.length
      });
      
      // Step 3: Perform ratio study
      if (sales.length > 0) {
        results.ratioStudy = this.ratioStudies.performRatioStudy(
          sales,
          {
            propertyType: 'mixed',
            assessmentYear: new Date().getFullYear(),
            salesPeriodStart: this.getEarliestDate(sales.map(s => s.saleDate)),
            salesPeriodEnd: this.getLatestDate(sales.map(s => s.saleDate)),
            geographicArea: config.camaConnectorName
          }
        );
        
        results.summary.assessmentLevel = results.ratioStudy.medianRatio;
        results.summary.codeOfDispersion = results.ratioStudy.coefficientOfDispersion;
        results.summary.priceRelatedDifferential = results.ratioStudy.priceRelatedDifferential;
        
        // Log ratio study results
        await this.logAnalysisActivity('ratio_study', {
          medianRatio: results.ratioStudy.medianRatio,
          cod: results.ratioStudy.coefficientOfDispersion,
          prd: results.ratioStudy.priceRelatedDifferential,
          prb: results.ratioStudy.priceRelatedBias,
          sampleSize: results.ratioStudy.sampleSize
        });
      }
      
      // Step 4: Create spatial weights matrix for spatial analysis
      // Only perform if we have properties with coordinates
      const propertiesWithCoords = properties.filter(p => 
        p.latitude !== undefined && p.longitude !== undefined);
      
      if (propertiesWithCoords.length > 1) {
        const spatialWeights = this.createSpatialWeightMatrix(propertiesWithCoords);
        
        // Step 5: Perform spatial autocorrelation analysis
        const autocorrelationResults = this.spatialAutocorrelation.analyze(
          propertiesWithCoords,
          'assessedValue',
          spatialWeights,
          config.spatialAutocorrelationConfig
        );
        
        results.spatialAnalysis = {
          autocorrelation: autocorrelationResults
        };
        
        results.summary.spatialAutocorrelation = autocorrelationResults.moransI.value;
        
        // Log spatial autocorrelation results
        await this.logAnalysisActivity('spatial_autocorrelation', {
          moransI: autocorrelationResults.moransI.value,
          zScore: autocorrelationResults.moransI.zScore,
          pValue: autocorrelationResults.moransI.pValue,
          interpretation: autocorrelationResults.moransI.interpretation
        });
        
        // Step 6: Perform spatial regression analysis if sales data is available
        if (sales.length > 10) { // Need enough sales for regression
          const salesWithCoords = sales.filter(s => {
            const property = properties.find(p => p.id === s.id);
            return property && property.latitude !== undefined && property.longitude !== undefined;
          });
          
          if (salesWithCoords.length > 10) {
            // Create default model specification if not provided
            const modelSpec: ModelSpecification = config.spatialModelConfig || {
              dependentVariable: 'salePrice',
              independentVariables: ['squareFeet', 'assessedValue'],
              includeIntercept: true,
              modelType: 'spatial_lag',
              spatialWeights: {
                method: 'distance',
                parameters: {
                  distance: 10000, // 10km
                  distanceDecay: 'inverse',
                  standardize: true
                }
              }
            };
            
            // Create and train spatial regression model
            const model = new SpatialRegressionModel(modelSpec);
            
            // Convert sales to PropertyData format for the model
            const salesAsProperties: PropertyData[] = salesWithCoords.map(sale => {
              const property = properties.find(p => p.id === sale.id);
              if (!property) {
                return {
                  id: sale.id,
                  parcelId: sale.parcelId,
                  address: '',
                  owner: '',
                  assessedValue: sale.assessedValue,
                  marketValue: sale.salePrice,
                  landValue: 0,
                  improvementValue: 0,
                  assessmentYear: sale.assessmentYear,
                  propertyClass: sale.propertyType,
                  acres: 0,
                  squareFeet: 0,
                  latitude: sale.latitude,
                  longitude: sale.longitude,
                  salePrice: sale.salePrice
                };
              }
              return {
                ...property,
                salePrice: sale.salePrice
              };
            });
            
            // Train the model
            model.trainModel(salesAsProperties, spatialWeights);
            
            // Get model diagnostics
            const diagnostics = model.getDiagnostics();
            
            // Generate predictions for all properties
            const predictions = propertiesWithCoords.map(property => 
              model.predict(property)
            );
            
            // Store regression results
            if (diagnostics) {
              results.spatialAnalysis.regression = {
                model: {
                  specification: modelSpec,
                  coefficients: Array.from(model.getCoefficients().entries())
                },
                predictions,
                performance: {
                  r2: diagnostics.r2,
                  adjR2: diagnostics.adjR2,
                  rmse: diagnostics.rmse,
                  mape: diagnostics.mape
                }
              };
              
              results.summary.modelFit = diagnostics.r2;
              
              // Log spatial regression results
              await this.logAnalysisActivity('spatial_regression', {
                r2: diagnostics.r2,
                adjR2: diagnostics.adjR2,
                rmse: diagnostics.rmse,
                modelType: modelSpec.modelType,
                variables: modelSpec.independentVariables
              });
            }
          }
        }
      }
      
      // Log analysis completion
      await this.logAnalysisActivity('complete', {
        timestamp: results.summary.timestamp
      });
      
      return results;
    } catch (error) {
      // Log error
      await this.logAnalysisActivity('error', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Validate property data against rules
   */
  private async validateProperties(properties: PropertyData[]): Promise<ValidationReport> {
    // For each property, get property-specific validation rules and validate
    const summaries: ValidationSummary[] = [];
    
    for (const property of properties) {
      const ruleSet = getPropertyValidationRules(property);
      this.validator.registerRuleSet(ruleSet);
      const summary = this.validator.validateEntity(property, 'property');
      summaries.push(summary);
    }
    
    // Count valid and invalid properties
    let validCount = 0;
    let invalidCount = 0;
    let criticalCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    
    for (const summary of summaries) {
      if (summary.valid) {
        validCount++;
      } else {
        invalidCount++;
      }
      
      // Count issues by severity
      for (const result of summary.results) {
        if (!result.valid) {
          switch (result.severity) {
            case 'critical': criticalCount++; break;
            case 'error': errorCount++; break;
            case 'warning': warningCount++; break;
            case 'info': infoCount++; break;
          }
        }
      }
    }
    
    return {
      timestamp: new Date(),
      datasetName: 'properties',
      totalEntities: properties.length,
      validEntities: validCount,
      invalidEntities: invalidCount,
      criticalIssues: criticalCount,
      errorIssues: errorCount,
      warningIssues: warningCount,
      infoIssues: infoCount,
      summaries
    };
  }
  
  /**
   * Create a spatial weight matrix from property data
   */
  private createSpatialWeightMatrix(properties: PropertyData[]): SpatialWeightMatrix {
    const weights = new Map<string, Map<string, number>>();
    const rowSums = new Map<string, number>();
    
    // Create a k-nearest neighbors weight matrix (k=5)
    const k = 5;
    
    for (const property of properties) {
      if (!property.latitude || !property.longitude) continue;
      
      weights.set(property.id, new Map<string, number>());
      rowSums.set(property.id, 0);
      
      // Calculate distances to all other properties
      const distances: Array<{id: string, distance: number}> = [];
      
      for (const other of properties) {
        if (other.id === property.id || !other.latitude || !other.longitude) continue;
        
        const distance = this.calculateDistance(
          property.latitude,
          property.longitude,
          other.latitude,
          other.longitude
        );
        
        distances.push({ id: other.id, distance });
      }
      
      // Sort by distance and take the k nearest
      distances.sort((a, b) => a.distance - b.distance);
      const neighbors = distances.slice(0, k);
      
      // Add weights for the k-nearest neighbors
      const propertyWeights = weights.get(property.id)!;
      let rowSum = 0;
      
      for (const neighbor of neighbors) {
        // Use inverse distance as weight
        const weight = 1 / Math.max(neighbor.distance, 0.001); // Avoid division by zero
        propertyWeights.set(neighbor.id, weight);
        rowSum += weight;
      }
      
      rowSums.set(property.id, rowSum);
    }
    
    // Row-standardize weights
    for (const [propertyId, propertyWeights] of weights.entries()) {
      const rowSum = rowSums.get(propertyId) || 0;
      
      if (rowSum > 0) {
        for (const [neighborId, weight] of propertyWeights.entries()) {
          propertyWeights.set(neighborId, weight / rowSum);
        }
        
        rowSums.set(propertyId, 1.0);
      }
    }
    
    return { weights, rowSums };
  }
  
  /**
   * Calculate the Haversine distance between two points (in meters)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  /**
   * Get the earliest date from an array of date strings
   */
  private getEarliestDate(dates: string[]): string {
    if (dates.length === 0) return '';
    
    const validDates = dates
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()));
    
    if (validDates.length === 0) return '';
    
    const earliest = new Date(Math.min(...validDates.map(d => d.getTime())));
    return earliest.toISOString().split('T')[0];
  }
  
  /**
   * Get the latest date from an array of date strings
   */
  private getLatestDate(dates: string[]): string {
    if (dates.length === 0) return '';
    
    const validDates = dates
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()));
    
    if (validDates.length === 0) return '';
    
    const latest = new Date(Math.max(...validDates.map(d => d.getTime())));
    return latest.toISOString().split('T')[0];
  }
  
  /**
   * Log analysis activity
   */
  private async logAnalysisActivity(
    stage: string,
    details: Record<string, any>
  ): Promise<void> {
    await storage.createLog({
      level: stage === 'error' ? LogLevel.ERROR : LogLevel.INFO,
      category: LogCategory.ANALYTICS,
      message: `Mass appraisal analysis ${stage}`,
      details: JSON.stringify(details),
      source: 'mass-appraisal-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['mass-appraisal', 'analysis', stage]
    });
  }
}