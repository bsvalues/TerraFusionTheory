/**
 * Spatial Regression Model Implementation
 * 
 * This module implements spatial regression models for property valuation,
 * accounting for the influence of location and spatial autocorrelation in
 * property values. It follows best practices in geospatial analysis and
 * mass appraisal methodology.
 */

import { PropertyData } from '../services/connectors/cama.connector';

/**
 * Spatial weight matrix definition
 */
export interface SpatialWeightMatrix {
  // Maps property IDs to the property IDs that are neighbors, with weights
  weights: Map<string, Map<string, number>>;
  // Sum of weights for each property ID
  rowSums: Map<string, number>;
}

/**
 * Diagnostics for the spatial regression model
 */
export interface ModelDiagnostics {
  // General regression statistics
  r2: number;          // R-squared
  adjR2: number;       // Adjusted R-squared
  logLikelihood: number;
  aic: number;         // Akaike Information Criterion
  bic: number;         // Bayesian Information Criterion
  
  // Spatial diagnostics
  moranI: number;      // Moran's I statistic
  moranIPValue: number; // P-value for Moran's I
  
  // Parameter statistics
  coefficients: Map<string, {
    value: number;
    standardError: number;
    tStat: number;
    pValue: number;
  }>;
  
  // Model quality statistics
  rmse: number;        // Root Mean Squared Error
  mape: number;        // Mean Absolute Percentage Error
  
  // Spatial autocorrelation test results
  lmLag: number;       // Lagrange Multiplier test (lag)
  lmLagPValue: number;
  lmError: number;     // Lagrange Multiplier test (error)
  lmErrorPValue: number;
  
  // Additional model information
  sampleSize: number;
  variableCount: number;
  spatialLagCoefficient?: number; // Only for spatial lag models
  spatialErrorCoefficient?: number; // Only for spatial error models
  
  // Cross-validation results
  crossValidationRMSE?: number;
  crossValidationR2?: number;
}

/**
 * Prediction result from the spatial regression model
 */
export interface PredictionResult {
  predictedValue: number;
  confidenceInterval: [number, number];
  standardError: number;
  propertyId: string;
  inputs: Record<string, any>;
}

/**
 * Model specification for spatial regression
 */
export interface ModelSpecification {
  // Dependent variable (e.g., "salePrice")
  dependentVariable: string;
  
  // Independent variables (e.g., ["squareFeet", "bedrooms", "bathrooms"])
  independentVariables: string[];
  
  // Whether to include an intercept term
  includeIntercept: boolean;
  
  // Type of spatial model to use
  modelType: 'ols' | 'spatial_lag' | 'spatial_error' | 'spatial_durbin';
  
  // Transform functions for dependent and independent variables
  transforms?: {
    [variable: string]: 'log' | 'sqrt' | 'squared' | ((x: number) => number);
  };
  
  // Properties for which the coefficient should be constrained to be positive
  positiveCoefficients?: string[];
  
  // Configuration for spatial weight matrix calculation
  spatialWeights?: {
    method: 'knn' | 'distance' | 'contiguity';
    parameters: {
      k?: number;              // For k-nearest neighbors
      distance?: number;       // For distance-based weights (meters)
      distanceDecay?: 'inverse' | 'inverse_squared' | 'gaussian'; // Distance decay function
      standardize?: boolean;   // Whether to row-standardize the weights
    };
  };
  
  // Cross-validation settings
  crossValidation?: {
    folds: number;             // Number of folds for cross-validation
    randomSeed?: number;       // Random seed for reproducibility
  };
}

/**
 * Spatial regression model implementation
 */
export class SpatialRegressionModel {
  private specification: ModelSpecification;
  private coefficients: Map<string, number>;
  private spatialWeights: SpatialWeightMatrix | null = null;
  private diagnostics: ModelDiagnostics | null = null;
  private properties: PropertyData[] = [];
  private propertyMap: Map<string, PropertyData> = new Map();
  private spatialLagCoefficient: number = 0;
  private spatialErrorCoefficient: number = 0;
  private isTrained: boolean = false;
  
  /**
   * Create a new spatial regression model
   */
  constructor(specification: ModelSpecification) {
    this.specification = specification;
    this.coefficients = new Map<string, number>();
    
    // Add intercept to coefficients if included in specification
    if (specification.includeIntercept) {
      this.coefficients.set('_intercept', 0);
    }
    
    // Initialize coefficients for all independent variables
    for (const variable of specification.independentVariables) {
      this.coefficients.set(variable, 0);
    }
  }
  
  /**
   * Get the model specification
   */
  public getSpecification(): ModelSpecification {
    return this.specification;
  }
  
  /**
   * Get the model diagnostics
   */
  public getDiagnostics(): ModelDiagnostics | null {
    return this.diagnostics;
  }
  
  /**
   * Get the model coefficients
   */
  public getCoefficients(): Map<string, number> {
    return new Map(this.coefficients);
  }
  
  /**
   * Check if the model has been trained
   */
  public isFitted(): boolean {
    return this.isTrained;
  }
  
  /**
   * Train the spatial regression model
   */
  public trainModel(properties: PropertyData[], spatialWeights?: SpatialWeightMatrix): void {
    if (properties.length === 0) {
      throw new Error("Cannot train model with empty property dataset");
    }
    
    // Store properties and create a property map for quick lookup
    this.properties = [...properties];
    this.propertyMap = new Map();
    for (const property of properties) {
      this.propertyMap.set(property.id, property);
    }
    
    // Create or use provided spatial weights
    if (spatialWeights) {
      this.spatialWeights = spatialWeights;
    } else if (this.specification.spatialWeights) {
      this.spatialWeights = this.createSpatialWeightMatrix(properties);
    }
    
    // Train the appropriate model based on specification
    switch (this.specification.modelType) {
      case 'ols':
        this.trainOLSModel();
        break;
      case 'spatial_lag':
        this.trainSpatialLagModel();
        break;
      case 'spatial_error':
        this.trainSpatialErrorModel();
        break;
      case 'spatial_durbin':
        this.trainSpatialDurbinModel();
        break;
      default:
        throw new Error(`Unsupported model type: ${this.specification.modelType}`);
    }
    
    // Calculate model diagnostics
    this.calculateModelDiagnostics();
    
    // Mark model as trained
    this.isTrained = true;
  }
  
  /**
   * Predict property value using the trained model
   */
  public predict(property: PropertyData): PredictionResult {
    if (!this.isTrained) {
      throw new Error("Model must be trained before making predictions");
    }
    
    // Prepare the input data
    const inputs = this.prepareInputs(property);
    
    // Calculate the predicted value based on model type
    let predictedValue = 0;
    
    // Start with the intercept if included
    if (this.specification.includeIntercept) {
      predictedValue += this.coefficients.get('_intercept') || 0;
    }
    
    // Add contributions from independent variables
    for (const variable of this.specification.independentVariables) {
      const coefficient = this.coefficients.get(variable) || 0;
      let value = inputs[variable];
      
      // Apply transforms if specified
      if (this.specification.transforms && this.specification.transforms[variable]) {
        value = this.applyTransform(value, this.specification.transforms[variable]);
      }
      
      predictedValue += coefficient * value;
    }
    
    // Add spatial lag term if applicable (for spatial lag and Durbin models)
    if (this.specification.modelType === 'spatial_lag' || 
        this.specification.modelType === 'spatial_durbin') {
      if (this.spatialWeights && property.id) {
        const spatialLag = this.calculateSpatialLag(property.id);
        predictedValue += this.spatialLagCoefficient * spatialLag;
      }
    }
    
    // Calculate standard error and confidence interval
    // This is a simplified approach; a more sophisticated method would 
    // account for prediction variance properly
    const standardError = this.diagnostics?.rmse || 0;
    const tCritical = 1.96; // Approximation for 95% confidence
    const confidenceInterval: [number, number] = [
      predictedValue - tCritical * standardError,
      predictedValue + tCritical * standardError
    ];
    
    return {
      predictedValue,
      confidenceInterval,
      standardError,
      propertyId: property.id,
      inputs
    };
  }
  
  /**
   * Create a spatial weight matrix from property data
   */
  private createSpatialWeightMatrix(properties: PropertyData[]): SpatialWeightMatrix {
    const weights = new Map<string, Map<string, number>>();
    const rowSums = new Map<string, number>();
    
    if (!this.specification.spatialWeights) {
      throw new Error("Spatial weights configuration is required");
    }
    
    const { method, parameters } = this.specification.spatialWeights;
    
    // Filter properties with valid coordinates
    const propertiesWithCoords = properties.filter(p => 
      p.latitude !== undefined && p.longitude !== undefined);
    
    for (const property of propertiesWithCoords) {
      weights.set(property.id, new Map<string, number>());
      rowSums.set(property.id, 0);
      
      switch (method) {
        case 'knn':
          this.computeKNNWeights(property, propertiesWithCoords, weights, rowSums, parameters);
          break;
        case 'distance':
          this.computeDistanceWeights(property, propertiesWithCoords, weights, rowSums, parameters);
          break;
        case 'contiguity':
          // Contiguity requires polygon geometry which isn't available in this simplification
          // For actual implementation, this would use GeoJSON polygon data
          throw new Error("Contiguity weights not implemented in this simplified model");
          break;
        default:
          throw new Error(`Unsupported spatial weights method: ${method}`);
      }
    }
    
    // Row-standardize weights if specified
    if (parameters.standardize) {
      this.standardizeWeights(weights, rowSums);
    }
    
    return { weights, rowSums };
  }
  
  /**
   * Compute k-nearest neighbors weights for a property
   */
  private computeKNNWeights(
    property: PropertyData,
    allProperties: PropertyData[],
    weights: Map<string, Map<string, number>>,
    rowSums: Map<string, number>,
    parameters: ModelSpecification['spatialWeights']['parameters']
  ): void {
    const k = parameters.k || 5;
    
    // Calculate distances to all other properties
    const distances: Array<{id: string, distance: number}> = [];
    
    for (const other of allProperties) {
      if (other.id === property.id) continue;
      
      const distance = this.calculateDistance(
        property.latitude!,
        property.longitude!,
        other.latitude!,
        other.longitude!
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
      let weight = 1.0; // Basic weight
      
      // Apply distance decay if specified
      if (parameters.distanceDecay) {
        weight = this.applyDistanceDecay(neighbor.distance, parameters.distanceDecay);
      }
      
      propertyWeights.set(neighbor.id, weight);
      rowSum += weight;
    }
    
    rowSums.set(property.id, rowSum);
  }
  
  /**
   * Compute distance-based weights for a property
   */
  private computeDistanceWeights(
    property: PropertyData,
    allProperties: PropertyData[],
    weights: Map<string, Map<string, number>>,
    rowSums: Map<string, number>,
    parameters: ModelSpecification['spatialWeights']['parameters']
  ): void {
    const maxDistance = parameters.distance || 1000; // Default 1000 meters
    
    // Calculate weights for properties within the distance threshold
    const propertyWeights = weights.get(property.id)!;
    let rowSum = 0;
    
    for (const other of allProperties) {
      if (other.id === property.id) continue;
      
      const distance = this.calculateDistance(
        property.latitude!,
        property.longitude!,
        other.latitude!,
        other.longitude!
      );
      
      if (distance <= maxDistance) {
        let weight = 1.0;
        
        // Apply distance decay if specified
        if (parameters.distanceDecay) {
          weight = this.applyDistanceDecay(distance, parameters.distanceDecay);
        }
        
        propertyWeights.set(other.id, weight);
        rowSum += weight;
      }
    }
    
    rowSums.set(property.id, rowSum);
  }
  
  /**
   * Standardize weights so each row sums to 1.0
   */
  private standardizeWeights(
    weights: Map<string, Map<string, number>>,
    rowSums: Map<string, number>
  ): void {
    for (const [propertyId, propertyWeights] of weights.entries()) {
      const rowSum = rowSums.get(propertyId) || 0;
      
      if (rowSum > 0) {
        for (const [neighborId, weight] of propertyWeights.entries()) {
          propertyWeights.set(neighborId, weight / rowSum);
        }
        
        rowSums.set(propertyId, 1.0);
      }
    }
  }
  
  /**
   * Apply distance decay function to a distance value
   */
  private applyDistanceDecay(distance: number, method: string): number {
    if (distance === 0) return 1.0;
    
    switch (method) {
      case 'inverse':
        return 1.0 / distance;
      case 'inverse_squared':
        return 1.0 / (distance * distance);
      case 'gaussian':
        // Using a standardized Gaussian decay with bandwidth = 1
        return Math.exp(-0.5 * distance * distance);
      default:
        return 1.0;
    }
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
   * Train ordinary least squares (OLS) model
   */
  private trainOLSModel(): void {
    // Prepare input matrix X and output vector y
    const X: number[][] = [];
    const y: number[] = [];
    
    // Process each property
    for (const property of this.properties) {
      const row: number[] = [];
      
      // Add intercept term if included
      if (this.specification.includeIntercept) {
        row.push(1.0);
      }
      
      // Add independent variables
      for (const variable of this.specification.independentVariables) {
        let value = property[variable as keyof PropertyData] as number;
        
        // Apply transforms if specified
        if (this.specification.transforms && this.specification.transforms[variable]) {
          value = this.applyTransform(value, this.specification.transforms[variable]);
        }
        
        row.push(value);
      }
      
      // Get dependent variable value
      let depValue = property[this.specification.dependentVariable as keyof PropertyData] as number;
      
      // Apply transform to dependent variable if specified
      if (this.specification.transforms && 
          this.specification.transforms[this.specification.dependentVariable]) {
        depValue = this.applyTransform(
          depValue, 
          this.specification.transforms[this.specification.dependentVariable]
        );
      }
      
      X.push(row);
      y.push(depValue);
    }
    
    // Compute OLS coefficients using normal equations: β = (X'X)^(-1)X'y
    const beta = this.computeOLS(X, y);
    
    // Store coefficients
    let index = 0;
    
    if (this.specification.includeIntercept) {
      this.coefficients.set('_intercept', beta[index++]);
    }
    
    for (const variable of this.specification.independentVariables) {
      this.coefficients.set(variable, beta[index++]);
    }
  }
  
  /**
   * Train spatial lag model
   */
  private trainSpatialLagModel(): void {
    // For simplicity in this implementation, we'll use a two-stage approach:
    // 1. Estimate initial OLS model
    // 2. Estimate spatial lag parameter using residuals
    
    // First train an OLS model
    this.trainOLSModel();
    
    // Calculate OLS residuals
    const residuals = this.calculateResiduals();
    
    // Calculate spatial lag of residuals
    const spatialLagResiduals = this.calculateSpatialLagVector(residuals);
    
    // Estimate spatial lag coefficient (simplified approach)
    // In a complete implementation, this would use maximum likelihood estimation
    this.spatialLagCoefficient = this.estimateSpatialParameter(residuals, spatialLagResiduals);
    
    // Re-estimate coefficients accounting for spatial lag
    // This is a simplified approach; a true spatial lag model would use ML estimation
    // or a proper 2SLS estimation method
    
    // For now, we keep the OLS coefficients but adjust predictions with spatial lag
  }
  
  /**
   * Train spatial error model
   */
  private trainSpatialErrorModel(): void {
    // Similar to spatial lag model, but with a different structure
    // This is a simplified implementation
    
    // First train an OLS model
    this.trainOLSModel();
    
    // Calculate OLS residuals
    const residuals = this.calculateResiduals();
    
    // Calculate spatial lag of residuals
    const spatialLagResiduals = this.calculateSpatialLagVector(residuals);
    
    // Estimate spatial error coefficient (simplified approach)
    this.spatialErrorCoefficient = this.estimateSpatialParameter(residuals, spatialLagResiduals);
    
    // In a complete implementation, we would re-estimate the model with the 
    // spatial error structure using generalized least squares or ML estimation
  }
  
  /**
   * Train spatial Durbin model
   */
  private trainSpatialDurbinModel(): void {
    // This is a simplified implementation
    // The Durbin model includes spatial lags of the independent variables
    
    // First train a spatial lag model
    this.trainSpatialLagModel();
    
    // In a complete implementation, we would include spatial lags of all 
    // independent variables as additional regressors
  }
  
  /**
   * Compute ordinary least squares regression coefficients
   */
  private computeOLS(X: number[][], y: number[]): number[] {
    // Compute X'X (transpose of X multiplied by X)
    const XtX = this.matrixMultiply(this.transposeMatrix(X), X);
    
    // Compute X'y (transpose of X multiplied by y)
    const Xty = this.matrixVectorMultiply(this.transposeMatrix(X), y);
    
    // Compute (X'X)^(-1)
    const XtXInv = this.invertMatrix(XtX);
    
    // Compute β = (X'X)^(-1)X'y
    return this.matrixVectorMultiply(XtXInv, Xty);
  }
  
  /**
   * Calculate model residuals
   */
  private calculateResiduals(): number[] {
    const residuals: number[] = [];
    
    for (const property of this.properties) {
      // Get actual value
      let actual = property[this.specification.dependentVariable as keyof PropertyData] as number;
      
      // Apply transform to dependent variable if specified
      if (this.specification.transforms && 
          this.specification.transforms[this.specification.dependentVariable]) {
        actual = this.applyTransform(
          actual, 
          this.specification.transforms[this.specification.dependentVariable]
        );
      }
      
      // Get predicted value (without spatial effects)
      const predicted = this.predictNonSpatial(property);
      
      // Calculate residual
      residuals.push(actual - predicted);
    }
    
    return residuals;
  }
  
  /**
   * Calculate the spatial lag vector for a vector of values
   */
  private calculateSpatialLagVector(values: number[]): number[] {
    if (!this.spatialWeights) {
      throw new Error("Spatial weights matrix is required");
    }
    
    const result: number[] = [];
    
    for (let i = 0; i < this.properties.length; i++) {
      const property = this.properties[i];
      const value = values[i];
      
      // Calculate spatial lag for this property
      let spatialLag = 0;
      const propertyWeights = this.spatialWeights.weights.get(property.id);
      
      if (propertyWeights) {
        for (const [neighborId, weight] of propertyWeights.entries()) {
          // Find the index of the neighbor in the properties array
          const neighborIndex = this.properties.findIndex(p => p.id === neighborId);
          
          if (neighborIndex >= 0) {
            spatialLag += weight * values[neighborIndex];
          }
        }
      }
      
      result.push(spatialLag);
    }
    
    return result;
  }
  
  /**
   * Calculate the spatial lag for a specific property
   */
  private calculateSpatialLag(propertyId: string): number {
    if (!this.spatialWeights) {
      return 0;
    }
    
    const propertyWeights = this.spatialWeights.weights.get(propertyId);
    if (!propertyWeights) {
      return 0;
    }
    
    let spatialLag = 0;
    
    for (const [neighborId, weight] of propertyWeights.entries()) {
      const neighbor = this.propertyMap.get(neighborId);
      
      if (neighbor) {
        // Get value for the dependent variable
        let value = neighbor[this.specification.dependentVariable as keyof PropertyData] as number;
        
        // Apply transform if specified
        if (this.specification.transforms && 
            this.specification.transforms[this.specification.dependentVariable]) {
          value = this.applyTransform(
            value, 
            this.specification.transforms[this.specification.dependentVariable]
          );
        }
        
        spatialLag += weight * value;
      }
    }
    
    return spatialLag;
  }
  
  /**
   * Estimate spatial parameter (rho) from residuals and their spatial lag
   */
  private estimateSpatialParameter(residuals: number[], spatialLagResiduals: number[]): number {
    // Simple estimation using correlation between residuals and their spatial lag
    // In a complete implementation, this would use ML estimation
    
    let sumProducts = 0;
    let sumSquares = 0;
    
    for (let i = 0; i < residuals.length; i++) {
      sumProducts += residuals[i] * spatialLagResiduals[i];
      sumSquares += spatialLagResiduals[i] * spatialLagResiduals[i];
    }
    
    return sumSquares > 0 ? sumProducts / sumSquares : 0;
  }
  
  /**
   * Calculate model diagnostics
   */
  private calculateModelDiagnostics(): void {
    if (this.properties.length === 0) {
      throw new Error("Cannot calculate diagnostics without property data");
    }
    
    // Calculate actual and predicted values
    const actual: number[] = [];
    const predicted: number[] = [];
    
    for (const property of this.properties) {
      // Get actual value
      let actualValue = property[this.specification.dependentVariable as keyof PropertyData] as number;
      
      // Apply transform to dependent variable if specified
      if (this.specification.transforms && 
          this.specification.transforms[this.specification.dependentVariable]) {
        actualValue = this.applyTransform(
          actualValue, 
          this.specification.transforms[this.specification.dependentVariable]
        );
      }
      
      // Get predicted value
      const predictedValue = this.specification.modelType === 'ols' 
        ? this.predictNonSpatial(property)
        : this.predict(property).predictedValue;
      
      actual.push(actualValue);
      predicted.push(predictedValue);
    }
    
    // Calculate residuals
    const residuals = actual.map((a, i) => a - predicted[i]);
    
    // Calculate total sum of squares (TSS)
    const mean = actual.reduce((sum, value) => sum + value, 0) / actual.length;
    const tss = actual.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0);
    
    // Calculate residual sum of squares (RSS)
    const rss = residuals.reduce((sum, value) => sum + Math.pow(value, 2), 0);
    
    // Calculate explained sum of squares (ESS)
    const ess = tss - rss;
    
    // Calculate R-squared
    const r2 = ess / tss;
    
    // Calculate adjusted R-squared
    const n = actual.length;
    const p = this.specification.independentVariables.length + 
              (this.specification.includeIntercept ? 1 : 0);
    const adjR2 = 1 - ((1 - r2) * (n - 1) / (n - p - 1));
    
    // Calculate root mean squared error (RMSE)
    const rmse = Math.sqrt(rss / n);
    
    // Calculate mean absolute percentage error (MAPE)
    const absolutePercentageErrors = actual.map((a, i) => 
      Math.abs((a - predicted[i]) / a) * 100
    );
    const mape = absolutePercentageErrors.reduce((sum, value) => sum + value, 0) / n;
    
    // Calculate Moran's I for residuals (spatial autocorrelation)
    const moranI = this.calculateMoransI(residuals);
    
    // Estimate p-value for Moran's I (simplified approach)
    const moranIPValue = this.estimateMoransIPValue(moranI, n);
    
    // Create coefficient statistics (simplified)
    const coefficientsStats = new Map<string, {
      value: number;
      standardError: number;
      tStat: number;
      pValue: number;
    }>();
    
    for (const [variable, coefficient] of this.coefficients.entries()) {
      // In a complete implementation, we would calculate proper standard errors
      // considering the covariance matrix of the estimators
      const standardError = rmse / Math.sqrt(n); // Simplified
      const tStat = coefficient / standardError;
      const pValue = this.estimateParameterPValue(tStat, n - p); // Simplified
      
      coefficientsStats.set(variable, {
        value: coefficient,
        standardError,
        tStat,
        pValue
      });
    }
    
    // Create model diagnostics object
    this.diagnostics = {
      r2,
      adjR2,
      logLikelihood: this.calculateLogLikelihood(rss, n),
      aic: this.calculateAIC(rss, n, p),
      bic: this.calculateBIC(rss, n, p),
      moranI,
      moranIPValue,
      coefficients: coefficientsStats,
      rmse,
      mape,
      lmLag: 0, // Simplified
      lmLagPValue: 1.0, // Simplified
      lmError: 0, // Simplified
      lmErrorPValue: 1.0, // Simplified
      sampleSize: n,
      variableCount: p,
      spatialLagCoefficient: this.spatialLagCoefficient,
      spatialErrorCoefficient: this.spatialErrorCoefficient
    };
  }
  
  /**
   * Calculate Moran's I statistic for spatial autocorrelation
   */
  private calculateMoransI(values: number[]): number {
    if (!this.spatialWeights || this.properties.length === 0) {
      return 0;
    }
    
    const n = values.length;
    const mean = values.reduce((sum, value) => sum + value, 0) / n;
    
    // Calculate sum of squared deviations
    let sumSquaredDev = 0;
    for (const value of values) {
      sumSquaredDev += Math.pow(value - mean, 2);
    }
    
    // Calculate Moran's I numerator
    let numerator = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < this.properties.length; i++) {
      const propertyId = this.properties[i].id;
      const propertyValue = values[i];
      
      const propertyWeights = this.spatialWeights.weights.get(propertyId);
      if (!propertyWeights) continue;
      
      for (const [neighborId, weight] of propertyWeights.entries()) {
        // Find the neighbor's index
        const neighborIndex = this.properties.findIndex(p => p.id === neighborId);
        if (neighborIndex < 0) continue;
        
        const neighborValue = values[neighborIndex];
        
        // Add to numerator
        numerator += weight * (propertyValue - mean) * (neighborValue - mean);
        
        // Add to total weight
        totalWeight += weight;
      }
    }
    
    // Calculate Moran's I
    if (sumSquaredDev === 0 || totalWeight === 0) {
      return 0;
    }
    
    return (n / totalWeight) * (numerator / sumSquaredDev);
  }
  
  /**
   * Predict property value without spatial effects
   */
  private predictNonSpatial(property: PropertyData): number {
    // Start with intercept if included
    let prediction = this.specification.includeIntercept 
      ? (this.coefficients.get('_intercept') || 0)
      : 0;
    
    // Add contributions from independent variables
    for (const variable of this.specification.independentVariables) {
      const coefficient = this.coefficients.get(variable) || 0;
      let value = property[variable as keyof PropertyData] as number;
      
      // Apply transforms if specified
      if (this.specification.transforms && this.specification.transforms[variable]) {
        value = this.applyTransform(value, this.specification.transforms[variable]);
      }
      
      prediction += coefficient * value;
    }
    
    return prediction;
  }
  
  /**
   * Apply transform to a value
   */
  private applyTransform(value: number, transform: string | ((x: number) => number)): number {
    if (typeof transform === 'function') {
      return transform(value);
    }
    
    switch (transform) {
      case 'log':
        return value > 0 ? Math.log(value) : 0;
      case 'sqrt':
        return value >= 0 ? Math.sqrt(value) : 0;
      case 'squared':
        return value * value;
      default:
        return value;
    }
  }
  
  /**
   * Prepare inputs for prediction
   */
  private prepareInputs(property: PropertyData): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    for (const variable of this.specification.independentVariables) {
      inputs[variable] = property[variable as keyof PropertyData];
    }
    
    return inputs;
  }
  
  /**
   * Calculate log likelihood of the model
   */
  private calculateLogLikelihood(rss: number, n: number): number {
    // Simplified calculation based on OLS
    const sigma2 = rss / n; // Residual variance
    return -n/2 * (Math.log(2 * Math.PI) + Math.log(sigma2) + 1);
  }
  
  /**
   * Calculate Akaike Information Criterion (AIC)
   */
  private calculateAIC(rss: number, n: number, p: number): number {
    const logLikelihood = this.calculateLogLikelihood(rss, n);
    return -2 * logLikelihood + 2 * p;
  }
  
  /**
   * Calculate Bayesian Information Criterion (BIC)
   */
  private calculateBIC(rss: number, n: number, p: number): number {
    const logLikelihood = this.calculateLogLikelihood(rss, n);
    return -2 * logLikelihood + p * Math.log(n);
  }
  
  /**
   * Estimate p-value for a parameter's t-statistic
   */
  private estimateParameterPValue(tStat: number, df: number): number {
    // Simplified approach using normal approximation for large df
    // For a proper implementation, we'd use the t-distribution CDF
    const absT = Math.abs(tStat);
    
    if (df > 30) {
      // Use normal approximation for large df
      return 2 * (1 - this.normalCDF(absT));
    } else {
      // Simplified approximation for small df
      const adjustedT = absT * (1 - 1 / (4 * df));
      return 2 * (1 - this.normalCDF(adjustedT));
    }
  }
  
  /**
   * Estimate p-value for Moran's I
   */
  private estimateMoransIPValue(moranI: number, n: number): number {
    // Simplified approach using normal approximation
    // For a proper implementation, we'd use the asymptotic distribution of Moran's I
    
    // Expected value of Moran's I under the null hypothesis
    const expectedI = -1 / (n - 1);
    
    // Standardized Moran's I
    const z = (moranI - expectedI) / Math.sqrt(1 / (n - 1));
    
    // Two-tailed p-value
    return 2 * (1 - this.normalCDF(Math.abs(z)));
  }
  
  /**
   * Standard normal cumulative distribution function
   */
  private normalCDF(x: number): number {
    // Approximation of the standard normal CDF
    // For a proper implementation, we'd use a more accurate approximation
    
    if (x < -6) return 0;
    if (x > 6) return 1;
    
    let sum = 0;
    let term = x;
    let i = 3;
    
    while (Math.abs(term) > 1e-10) {
      sum += term;
      term = term * x * x / i;
      i += 2;
    }
    
    return 0.5 + sum * 0.3989422804;
  }
  
  /**
   * Transpose a matrix
   */
  private transposeMatrix(m: number[][]): number[][] {
    if (m.length === 0) return [];
    
    const rows = m.length;
    const cols = m[0].length;
    const result: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = m[i][j];
      }
    }
    
    return result;
  }
  
  /**
   * Multiply two matrices
   */
  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    if (a.length === 0 || b.length === 0) return [];
    
    const aRows = a.length;
    const aCols = a[0].length;
    const bRows = b.length;
    const bCols = b[0].length;
    
    if (aCols !== bRows) {
      throw new Error("Cannot multiply matrices: dimensions don't match");
    }
    
    const result: number[][] = Array(aRows).fill(0).map(() => Array(bCols).fill(0));
    
    for (let i = 0; i < aRows; i++) {
      for (let j = 0; j < bCols; j++) {
        for (let k = 0; k < aCols; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    
    return result;
  }
  
  /**
   * Multiply a matrix by a vector
   */
  private matrixVectorMultiply(a: number[][], v: number[]): number[] {
    if (a.length === 0 || v.length === 0) return [];
    
    const rows = a.length;
    const cols = a[0].length;
    
    if (cols !== v.length) {
      throw new Error("Cannot multiply matrix by vector: dimensions don't match");
    }
    
    const result: number[] = Array(rows).fill(0);
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[i] += a[i][j] * v[j];
      }
    }
    
    return result;
  }
  
  /**
   * Invert a matrix
   * 
   * This is a simplified implementation using Gauss-Jordan elimination
   * and only works reliably for small, well-conditioned matrices
   */
  private invertMatrix(m: number[][]): number[][] {
    if (m.length === 0) return [];
    
    const n = m.length;
    
    if (n !== m[0].length) {
      throw new Error("Cannot invert non-square matrix");
    }
    
    // Create augmented matrix [m|I]
    const augmented: number[][] = [];
    for (let i = 0; i < n; i++) {
      augmented[i] = [...m[i]];
      for (let j = 0; j < n; j++) {
        augmented[i].push(i === j ? 1 : 0);
      }
    }
    
    // Perform Gauss-Jordan elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxVal = Math.abs(augmented[i][i]);
      let maxRow = i;
      
      for (let j = i + 1; j < n; j++) {
        const val = Math.abs(augmented[j][i]);
        if (val > maxVal) {
          maxVal = val;
          maxRow = j;
        }
      }
      
      // Swap rows if needed
      if (maxRow !== i) {
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      }
      
      // Scale pivot row
      const pivot = augmented[i][i];
      
      if (Math.abs(pivot) < 1e-10) {
        throw new Error("Matrix is singular or nearly singular");
      }
      
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }
      
      // Eliminate other rows
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          const factor = augmented[j][i];
          for (let k = 0; k < 2 * n; k++) {
            augmented[j][k] -= factor * augmented[i][k];
          }
        }
      }
    }
    
    // Extract right half of augmented matrix (the inverse)
    const inverse: number[][] = [];
    for (let i = 0; i < n; i++) {
      inverse[i] = augmented[i].slice(n);
    }
    
    return inverse;
  }
}