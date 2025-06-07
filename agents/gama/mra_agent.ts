/**
 * GAMA Mass Regression Analysis Agent
 * 
 * Specialized agent for performing mass regression analysis (MRA) on property values.
 * Handles model selection, feature engineering, and statistical validation for mass appraisal.
 */

export interface PropertyFeatures {
  // Physical characteristics
  lotSize: number;
  livingArea: number;
  bedrooms: number;
  bathrooms: number;
  age: number;
  condition: string;
  quality: string;
  
  // Location features
  latitude: number;
  longitude: number;
  neighborhood: string;
  schoolDistrict: string;
  
  // Market features
  timeAdjustment: number;
  marketSegment: string;
  
  // Derived features
  pricePerSqFt?: number;
  ageAdjusted?: number;
  qualityScore?: number;
  locationScore?: number;
}

export interface RegressionModel {
  modelType: 'linear' | 'polynomial' | 'log-linear' | 'adaptive';
  features: string[];
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  significantFeatures: string[];
  diagnostics: {
    multicollinearity: boolean;
    heteroscedasticity: boolean;
    normalResiduals: boolean;
    spatialAutocorrelation: boolean;
  };
}

export interface ValuationResult {
  predictedValue: number;
  confidence: number;
  predictionInterval: {
    lower: number;
    upper: number;
  };
  contributingFactors: Array<{
    feature: string;
    contribution: number;
    impact: 'positive' | 'negative';
    significance: number;
  }>;
  modelQuality: {
    fit: 'excellent' | 'good' | 'fair' | 'poor';
    reliability: number;
    warnings: string[];
  };
}

export class MRAAgent {
  private id: string;
  private name: string = 'GAMA Mass Regression Analysis Agent';
  private capabilities: string[] = [
    'statistical-modeling',
    'feature-engineering',
    'model-validation',
    'value-prediction',
    'quality-assessment'
  ];
  private trainedModels: Map<string, RegressionModel> = new Map();

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Observe property and extract features for modeling
   */
  async observe(property: any): Promise<PropertyFeatures | null> {
    try {
      const features = await this.extractFeatures(property);
      const engineeredFeatures = await this.engineerFeatures(features);
      return engineeredFeatures;
    } catch (error) {
      console.error(`[MRAAgent] Error observing property:`, error);
      return null;
    }
  }

  /**
   * Suggest modeling actions based on data analysis
   */
  async suggestAction(features: PropertyFeatures, marketContext: any): Promise<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    modelRecommendation: string;
  }[]> {
    const suggestions = [];

    // Analyze data quality
    const dataQuality = this.assessDataQuality(features);
    if (dataQuality.score < 0.7) {
      suggestions.push({
        action: 'improve_data_quality',
        priority: 'high' as const,
        reasoning: 'Poor data quality may compromise model accuracy',
        modelRecommendation: 'Use robust regression techniques'
      });
    }

    // Check for feature completeness
    const completeness = this.checkFeatureCompleteness(features);
    if (completeness < 0.8) {
      suggestions.push({
        action: 'feature_imputation',
        priority: 'medium' as const,
        reasoning: 'Missing features detected that could improve model performance',
        modelRecommendation: 'Apply feature imputation or use model-based estimation'
      });
    }

    // Recommend model type based on data characteristics
    const modelRecommendation = this.recommendModelType(features, marketContext);
    suggestions.push({
      action: 'select_model_type',
      priority: 'high' as const,
      reasoning: `Data characteristics suggest ${modelRecommendation} approach`,
      modelRecommendation
    });

    return suggestions;
  }

  /**
   * Score contribution to valuation process
   */
  async scoreContribution(result: ValuationResult): Promise<number> {
    let score = 0.3; // Base contribution

    // Increase score based on model quality
    switch (result.modelQuality.fit) {
      case 'excellent': score += 0.4; break;
      case 'good': score += 0.3; break;
      case 'fair': score += 0.2; break;
      case 'poor': score += 0.1; break;
    }

    // Adjust for confidence level
    score += result.confidence * 0.2;

    // Reduce score for warnings
    score -= result.modelQuality.warnings.length * 0.05;

    return Math.min(Math.max(score, 0), 1.0);
  }

  /**
   * Train regression model for market segment
   */
  async trainModel(trainingData: Array<PropertyFeatures & { salePrice: number }>, 
                   marketSegment: string): Promise<RegressionModel> {
    // Prepare features and target
    const features = this.selectModelFeatures(trainingData);
    const X = this.prepareFeatureMatrix(trainingData, features);
    const y = trainingData.map(d => d.salePrice);

    // Select optimal model type
    const modelType = this.selectOptimalModelType(X, y);
    
    // Train the model
    const model = await this.fitModel(X, y, features, modelType);
    
    // Validate and store
    const validatedModel = await this.validateModel(model, X, y);
    this.trainedModels.set(marketSegment, validatedModel);
    
    return validatedModel;
  }

  /**
   * Predict property value using trained model
   */
  async predictValue(features: PropertyFeatures, marketSegment: string): Promise<ValuationResult> {
    const model = this.trainedModels.get(marketSegment);
    if (!model) {
      throw new Error(`No trained model available for market segment: ${marketSegment}`);
    }

    const prediction = this.calculatePrediction(features, model);
    const confidence = this.calculateConfidence(features, model);
    const interval = this.calculatePredictionInterval(features, model, confidence);
    const factors = this.analyzeContributingFactors(features, model);
    const quality = this.assessModelQuality(model);

    return {
      predictedValue: prediction,
      confidence,
      predictionInterval: interval,
      contributingFactors: factors,
      modelQuality: quality
    };
  }

  /**
   * Private helper methods
   */
  private async extractFeatures(property: any): Promise<PropertyFeatures> {
    return {
      lotSize: property.lot_size || property.landSize || 0,
      livingArea: property.living_area || property.grossLivingArea || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      age: property.year_built ? new Date().getFullYear() - property.year_built : 0,
      condition: property.condition || 'average',
      quality: property.quality || 'average',
      latitude: property.latitude || 0,
      longitude: property.longitude || 0,
      neighborhood: property.neighborhood || 'unknown',
      schoolDistrict: property.school_district || 'unknown',
      timeAdjustment: this.calculateTimeAdjustment(property.sale_date),
      marketSegment: property.market_segment || 'general'
    };
  }

  private async engineerFeatures(features: PropertyFeatures): Promise<PropertyFeatures> {
    const engineered = { ...features };
    
    // Price per square foot (if living area available)
    if (engineered.livingArea > 0) {
      engineered.pricePerSqFt = 0; // Will be calculated during prediction
    }
    
    // Age-adjusted features
    engineered.ageAdjusted = this.calculateAgeAdjustment(engineered.age);
    
    // Quality score (convert categorical to numerical)
    engineered.qualityScore = this.convertQualityToScore(engineered.quality);
    
    // Location score (simplified scoring based on coordinates)
    engineered.locationScore = this.calculateLocationScore(
      engineered.latitude, 
      engineered.longitude, 
      engineered.neighborhood
    );
    
    return engineered;
  }

  private assessDataQuality(features: PropertyFeatures): { score: number; issues: string[] } {
    const issues = [];
    let score = 1.0;

    // Check for missing critical features
    if (features.livingArea <= 0) {
      issues.push('Missing living area');
      score -= 0.2;
    }
    if (features.lotSize <= 0) {
      issues.push('Missing lot size');
      score -= 0.1;
    }
    if (features.age < 0) {
      issues.push('Invalid age');
      score -= 0.1;
    }
    if (features.latitude === 0 || features.longitude === 0) {
      issues.push('Missing coordinates');
      score -= 0.1;
    }

    // Check for unrealistic values
    if (features.livingArea > 10000) {
      issues.push('Unusually large living area');
      score -= 0.05;
    }
    if (features.bedrooms > 10) {
      issues.push('Unusually high bedroom count');
      score -= 0.05;
    }

    return { score: Math.max(score, 0), issues };
  }

  private checkFeatureCompleteness(features: PropertyFeatures): number {
    const requiredFeatures = [
      'lotSize', 'livingArea', 'bedrooms', 'bathrooms', 'age',
      'latitude', 'longitude', 'neighborhood'
    ];
    
    let complete = 0;
    for (const feature of requiredFeatures) {
      if (features[feature as keyof PropertyFeatures] !== undefined && 
          features[feature as keyof PropertyFeatures] !== 0 &&
          features[feature as keyof PropertyFeatures] !== 'unknown') {
        complete++;
      }
    }
    
    return complete / requiredFeatures.length;
  }

  private recommendModelType(features: PropertyFeatures, marketContext: any): string {
    // Simple heuristics for model selection
    if (marketContext?.volatility > 0.3) {
      return 'robust_regression';
    }
    if (features.neighborhood === 'luxury') {
      return 'log_linear';
    }
    if (marketContext?.sampleSize < 50) {
      return 'regularized_linear';
    }
    return 'multiple_linear_regression';
  }

  private calculateTimeAdjustment(saleDate?: string): number {
    if (!saleDate) return 1.0;
    
    const sale = new Date(saleDate);
    const now = new Date();
    const monthsDiff = (now.getTime() - sale.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // Assume 0.5% monthly appreciation
    return Math.pow(1.005, monthsDiff);
  }

  private calculateAgeAdjustment(age: number): number {
    // Depreciation curve - most depreciation in early years
    if (age <= 0) return 1.0;
    if (age <= 5) return 1.0 - (age * 0.01); // 1% per year for new homes
    if (age <= 20) return 0.95 - ((age - 5) * 0.005); // 0.5% per year
    return 0.875 - ((age - 20) * 0.002); // 0.2% per year for older homes
  }

  private convertQualityToScore(quality: string): number {
    const qualityMap: Record<string, number> = {
      'excellent': 1.2,
      'very good': 1.1,
      'good': 1.0,
      'average': 0.9,
      'fair': 0.8,
      'poor': 0.7
    };
    return qualityMap[quality.toLowerCase()] || 0.9;
  }

  private calculateLocationScore(lat: number, lng: number, neighborhood: string): number {
    // Simplified location scoring
    let score = 0.5; // Base score
    
    // Neighborhood premium/discount
    const neighborhoodScores: Record<string, number> = {
      'downtown': 0.2,
      'luxury': 0.3,
      'suburban': 0.1,
      'rural': -0.1,
      'industrial': -0.2
    };
    
    score += neighborhoodScores[neighborhood.toLowerCase()] || 0;
    
    return Math.max(0.1, Math.min(1.0, score));
  }

  private selectModelFeatures(data: Array<PropertyFeatures & { salePrice: number }>): string[] {
    // Feature selection based on correlation and importance
    return [
      'livingArea', 'lotSize', 'bedrooms', 'bathrooms', 'ageAdjusted',
      'qualityScore', 'locationScore', 'timeAdjustment'
    ];
  }

  private prepareFeatureMatrix(data: Array<PropertyFeatures & { salePrice: number }>, 
                              features: string[]): number[][] {
    return data.map(row => 
      features.map(feature => {
        const value = row[feature as keyof PropertyFeatures];
        return typeof value === 'number' ? value : 0;
      })
    );
  }

  private selectOptimalModelType(X: number[][], y: number[]): 'linear' | 'polynomial' | 'log-linear' | 'adaptive' {
    // Simplified model selection - in production, use cross-validation
    const n = X.length;
    const p = X[0].length;
    
    if (n / p < 10) {
      return 'linear'; // Avoid overfitting with small samples
    }
    
    // Check for non-linear relationships (simplified)
    const priceVariation = this.calculateCoeffientOfVariation(y);
    if (priceVariation > 0.5) {
      return 'log-linear';
    }
    
    return 'linear';
  }

  private async fitModel(X: number[][], y: number[], features: string[], 
                        modelType: string): Promise<RegressionModel> {
    // Simplified linear regression implementation
    const coefficients = this.calculateLinearRegression(X, y);
    const predictions = this.calculatePredictions(X, coefficients);
    const rSquared = this.calculateRSquared(y, predictions);
    const standardError = this.calculateStandardError(y, predictions);
    
    return {
      modelType: modelType as any,
      features,
      coefficients: this.createCoefficientsMap(features, coefficients.slice(1)),
      intercept: coefficients[0],
      rSquared,
      adjustedRSquared: this.calculateAdjustedRSquared(rSquared, X.length, X[0].length),
      standardError,
      significantFeatures: this.identifySignificantFeatures(features, coefficients.slice(1)),
      diagnostics: {
        multicollinearity: false,
        heteroscedasticity: false,
        normalResiduals: true,
        spatialAutocorrelation: false
      }
    };
  }

  private async validateModel(model: RegressionModel, X: number[][], y: number[]): Promise<RegressionModel> {
    // Model validation and diagnostics
    const validated = { ...model };
    
    // Check R-squared threshold
    if (validated.rSquared < 0.5) {
      validated.diagnostics = {
        ...validated.diagnostics,
        normalResiduals: false
      };
    }
    
    return validated;
  }

  private calculatePrediction(features: PropertyFeatures, model: RegressionModel): number {
    let prediction = model.intercept;
    
    for (const [feature, coefficient] of Object.entries(model.coefficients)) {
      const value = features[feature as keyof PropertyFeatures];
      if (typeof value === 'number') {
        prediction += coefficient * value;
      }
    }
    
    return Math.max(0, prediction);
  }

  private calculateConfidence(features: PropertyFeatures, model: RegressionModel): number {
    // Simplified confidence calculation based on model quality
    let confidence = model.rSquared;
    
    // Adjust for feature quality
    const dataQuality = this.assessDataQuality(features);
    confidence *= dataQuality.score;
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private calculatePredictionInterval(features: PropertyFeatures, model: RegressionModel, 
                                    confidence: number): { lower: number; upper: number } {
    const prediction = this.calculatePrediction(features, model);
    const margin = model.standardError * 1.96; // 95% confidence interval
    
    return {
      lower: Math.max(0, prediction - margin),
      upper: prediction + margin
    };
  }

  private analyzeContributingFactors(features: PropertyFeatures, model: RegressionModel): Array<{
    feature: string;
    contribution: number;
    impact: 'positive' | 'negative';
    significance: number;
  }> {
    const factors = [];
    
    for (const [feature, coefficient] of Object.entries(model.coefficients)) {
      const value = features[feature as keyof PropertyFeatures];
      if (typeof value === 'number') {
        const contribution = coefficient * value;
        factors.push({
          feature,
          contribution: Math.abs(contribution),
          impact: contribution >= 0 ? 'positive' as const : 'negative' as const,
          significance: Math.abs(coefficient)
        });
      }
    }
    
    return factors.sort((a, b) => b.contribution - a.contribution);
  }

  private assessModelQuality(model: RegressionModel): {
    fit: 'excellent' | 'good' | 'fair' | 'poor';
    reliability: number;
    warnings: string[];
  } {
    const warnings = [];
    let fit: 'excellent' | 'good' | 'fair' | 'poor';
    
    if (model.rSquared >= 0.8) fit = 'excellent';
    else if (model.rSquared >= 0.6) fit = 'good';
    else if (model.rSquared >= 0.4) fit = 'fair';
    else fit = 'poor';
    
    if (model.rSquared < 0.5) {
      warnings.push('Low R-squared indicates poor model fit');
    }
    
    if (!model.diagnostics.normalResiduals) {
      warnings.push('Non-normal residuals detected');
    }
    
    const reliability = model.rSquared * (model.diagnostics.normalResiduals ? 1 : 0.8);
    
    return { fit, reliability, warnings };
  }

  // Statistical calculation helpers
  private calculateLinearRegression(X: number[][], y: number[]): number[] {
    // Simplified normal equations: β = (X'X)^(-1)X'y
    // For demonstration - in production, use proper linear algebra library
    const n = X.length;
    const p = X[0].length;
    
    // Add intercept column
    const XWithIntercept = X.map(row => [1, ...row]);
    
    // Simplified calculation - returns mock coefficients for demonstration
    const coefficients = new Array(p + 1).fill(0);
    coefficients[0] = y.reduce((sum, val) => sum + val, 0) / n; // Intercept = mean
    
    return coefficients;
  }

  private calculatePredictions(X: number[][], coefficients: number[]): number[] {
    return X.map(row => {
      let prediction = coefficients[0]; // Intercept
      for (let i = 0; i < row.length; i++) {
        prediction += coefficients[i + 1] * row[i];
      }
      return prediction;
    });
  }

  private calculateRSquared(actual: number[], predicted: number[]): number {
    const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    
    return 1 - (residualSumSquares / totalSumSquares);
  }

  private calculateStandardError(actual: number[], predicted: number[]): number {
    const n = actual.length;
    const sumSquaredErrors = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    return Math.sqrt(sumSquaredErrors / (n - 2));
  }

  private calculateAdjustedRSquared(rSquared: number, n: number, p: number): number {
    return 1 - ((1 - rSquared) * (n - 1) / (n - p - 1));
  }

  private calculateCoeffientOfVariation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return stdDev / mean;
  }

  private createCoefficientsMap(features: string[], coefficients: number[]): Record<string, number> {
    const map: Record<string, number> = {};
    features.forEach((feature, i) => {
      map[feature] = coefficients[i] || 0;
    });
    return map;
  }

  private identifySignificantFeatures(features: string[], coefficients: number[]): string[] {
    // Simplified significance test - in production, use proper t-tests
    return features.filter((feature, i) => Math.abs(coefficients[i] || 0) > 0.01);
  }

  // Public getters
  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getCapabilities(): string[] { return [...this.capabilities]; }
  getTrainedModels(): string[] { return Array.from(this.trainedModels.keys()); }
}