/**
 * IAAO Ratio Studies Implementation
 * 
 * This module implements statistical measures recommended by the
 * International Association of Assessing Officers (IAAO) for evaluating
 * the quality and uniformity of property assessments.
 * 
 * Reference: IAAO Standard on Ratio Studies
 */

/**
 * Results of a completed ratio study
 */
export interface RatioStudyResults {
  medianRatio: number;
  meanRatio: number;
  weightedMeanRatio: number;
  coefficientOfDispersion: number; // COD
  priceRelatedDifferential: number; // PRD
  priceRelatedBias: number; // PRB
  coefficientOfVariation: number; // COV
  standardDeviation: number;
  confidenceInterval: [number, number];
  sampleSize: number;
  iaaoCodStandard: boolean; // Whether COD meets IAAO standards
  iaaoConfidenceLevel: number; // Usually 95%
  metadata: {
    propertyType: string;
    assessmentYear: number;
    salesPeriodStart: string;
    salesPeriodEnd: string;
    geographicArea: string;
    outlierTrimming: boolean;
    adjustmentsApplied: string[];
  };
}

/**
 * Property sale data for ratio study calculations
 */
export interface PropertySale {
  id: string;
  parcelId: string;
  assessedValue: number;
  salePrice: number;
  saleDate: string;
  propertyType: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  assessmentYear: number;
  adjustments?: Record<string, number>; // Any applied adjustments (time, financing, etc)
  [key: string]: any; // Additional property data
}

/**
 * Configuration for ratio study analysis
 */
export interface RatioStudyConfig {
  trimOutliers?: boolean;
  outlierThreshold?: number; // Standard deviations from median (default: 3)
  confidenceLevel?: number; // Default: 0.95 (95%)
  propertyFilter?: (sale: PropertySale) => boolean;
  timeAdjustment?: boolean;
  timeAdjustmentMethod?: 'monthly' | 'quarterly' | 'custom';
  customTimeAdjustment?: (sale: PropertySale, baseDate: string) => number;
}

/**
 * Implementation of IAAO ratio studies
 */
export class RatioStudies {
  private config: RatioStudyConfig;

  constructor(config: RatioStudyConfig = {}) {
    this.config = {
      trimOutliers: true,
      outlierThreshold: 3,
      confidenceLevel: 0.95,
      timeAdjustment: false,
      timeAdjustmentMethod: 'monthly',
      ...config
    };
  }

  /**
   * Perform a comprehensive ratio study on a set of sales data
   */
  public performRatioStudy(sales: PropertySale[], metadata: Partial<RatioStudyResults['metadata']> = {}): RatioStudyResults {
    // Filter sales if a propertyFilter is provided
    let filteredSales = this.config.propertyFilter 
      ? sales.filter(this.config.propertyFilter)
      : [...sales];
    
    // Apply time adjustments if enabled
    if (this.config.timeAdjustment) {
      filteredSales = this.applyTimeAdjustments(filteredSales);
    }
    
    // Calculate ratios for each sale
    const ratios = filteredSales.map(sale => sale.assessedValue / sale.salePrice);
    
    // Trim outliers if enabled
    const trimmedRatios = this.config.trimOutliers
      ? this.trimOutliers(ratios, this.config.outlierThreshold!)
      : ratios;
    
    // Calculate assessment values for weighted measures
    const assessedValues = filteredSales.map(sale => sale.assessedValue);
    const salePrices = filteredSales.map(sale => sale.salePrice);
    
    // Calculate all required statistics
    const medianRatio = this.calculateMedian(trimmedRatios);
    const meanRatio = this.calculateMean(trimmedRatios);
    const weightedMeanRatio = this.calculateWeightedMean(assessedValues, salePrices);
    const standardDeviation = this.calculateStandardDeviation(trimmedRatios);
    const cod = this.calculateCOD(trimmedRatios);
    const prd = this.calculatePRD(assessedValues, salePrices);
    const prb = this.calculatePRB(salePrices, ratios);
    const cov = this.calculateCOV(trimmedRatios);
    const confidenceInterval = this.calculateConfidenceInterval(
      meanRatio, 
      standardDeviation, 
      trimmedRatios.length, 
      this.config.confidenceLevel!
    );
    
    // Determine if COD meets IAAO standards based on property type
    const propertyType = metadata.propertyType || 'residential';
    const iaaoCodStandard = this.checkIaaoCodStandard(cod, propertyType);
    
    return {
      medianRatio,
      meanRatio,
      weightedMeanRatio,
      coefficientOfDispersion: cod,
      priceRelatedDifferential: prd,
      priceRelatedBias: prb,
      coefficientOfVariation: cov,
      standardDeviation,
      confidenceInterval,
      sampleSize: trimmedRatios.length,
      iaaoCodStandard,
      iaaoConfidenceLevel: this.config.confidenceLevel! * 100,
      metadata: {
        propertyType: propertyType,
        assessmentYear: metadata.assessmentYear || new Date().getFullYear(),
        salesPeriodStart: metadata.salesPeriodStart || '',
        salesPeriodEnd: metadata.salesPeriodEnd || '',
        geographicArea: metadata.geographicArea || '',
        outlierTrimming: this.config.trimOutliers || false,
        adjustmentsApplied: this.config.timeAdjustment ? ['time'] : []
      }
    };
  }

  /**
   * Calculate the Coefficient of Dispersion (COD)
   * 
   * Measures the average percentage deviation of sales ratios from the median ratio.
   * Lower values indicate more uniform assessments.
   * 
   * IAAO Standards:
   * - Single-family residential: 5.0 to 15.0
   * - Income-producing properties: 5.0 to 20.0
   * - Vacant land: 5.0 to 25.0
   */
  public calculateCOD(ratios: number[]): number {
    if (ratios.length === 0) return 0;
    
    const medianRatio = this.calculateMedian(ratios);
    if (medianRatio === 0) return 0;
    
    const absoluteDeviations = ratios.map(ratio => Math.abs(ratio - medianRatio));
    const meanAbsoluteDeviation = this.calculateMean(absoluteDeviations);
    
    return (meanAbsoluteDeviation / medianRatio) * 100;
  }

  /**
   * Calculate the Price-Related Differential (PRD)
   * 
   * Measures vertical equity (progressivity or regressivity) in assessments.
   * - PRD > 1.03: Assessment system is regressive (higher-valued properties are under-assessed)
   * - PRD < 0.98: Assessment system is progressive (higher-valued properties are over-assessed)
   * - 0.98 <= PRD <= 1.03: Assessment system is vertically equitable (IAAO standard)
   */
  public calculatePRD(assessedValues: number[], salePrices: number[]): number {
    if (assessedValues.length === 0 || assessedValues.length !== salePrices.length) return 0;
    
    const ratios = assessedValues.map((av, i) => av / salePrices[i]);
    const meanRatio = this.calculateMean(ratios);
    
    const weightedMeanRatio = this.calculateWeightedMean(assessedValues, salePrices);
    
    return meanRatio / weightedMeanRatio;
  }

  /**
   * Calculate the Price-Related Bias (PRB)
   * 
   * A regression-based alternative to PRD that directly measures the relationship
   * between assessment ratios and property values.
   * 
   * - PRB near 0: No systematic bias
   * - PRB > 0: Regressive assessments (higher-valued properties are under-assessed)
   * - PRB < 0: Progressive assessments (higher-valued properties are over-assessed)
   * 
   * IAAO Standard: -0.05 to 0.05
   */
  public calculatePRB(salePrices: number[], ratios: number[]): number {
    if (salePrices.length === 0 || salePrices.length !== ratios.length) return 0;
    
    const n = salePrices.length;
    const logSalePrices = salePrices.map(price => Math.log(price));
    
    // Center the variables to improve numerical stability
    const meanLogPrice = this.calculateMean(logSalePrices);
    const meanRatio = this.calculateMean(ratios);
    
    const centeredLogPrices = logSalePrices.map(lp => lp - meanLogPrice);
    const centeredRatios = ratios.map(r => r - meanRatio);
    
    // Calculate regression slope: sum(xy) / sum(x²)
    let sumXY = 0;
    let sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumXY += centeredLogPrices[i] * centeredRatios[i];
      sumX2 += centeredLogPrices[i] * centeredLogPrices[i];
    }
    
    if (sumX2 === 0) return 0;
    
    return sumXY / sumX2;
  }

  /**
   * Calculate the Coefficient of Variation (COV)
   * 
   * Standard statistical measure of dispersion, calculated as the
   * standard deviation divided by the mean.
   * 
   * While not an official IAAO measure, it's useful for comparisons
   * with other statistical applications.
   */
  public calculateCOV(ratios: number[]): number {
    if (ratios.length === 0) return 0;
    
    const mean = this.calculateMean(ratios);
    if (mean === 0) return 0;
    
    const stdDev = this.calculateStandardDeviation(ratios);
    
    return (stdDev / mean) * 100;
  }

  /**
   * Calculate confidence interval for the mean ratio
   * 
   * Uses the t-distribution to calculate interval for the given confidence level
   */
  public calculateConfidenceInterval(mean: number, stdDev: number, sampleSize: number, confidenceLevel: number): [number, number] {
    if (sampleSize <= 1) return [0, 0];
    
    // This is an approximation of the t-distribution critical value for the given confidence level
    // For a more accurate value, we would need to implement the t-distribution or use a lookup table
    const alpha = 1 - confidenceLevel;
    const tCritical = this.approximateTCritical(sampleSize - 1, alpha);
    
    const marginOfError = tCritical * (stdDev / Math.sqrt(sampleSize));
    
    return [mean - marginOfError, mean + marginOfError];
  }

  /**
   * Apply time adjustments to sales prices
   */
  private applyTimeAdjustments(sales: PropertySale[]): PropertySale[] {
    if (!this.config.timeAdjustment) return sales;
    
    // Find the most recent sale date to use as the base
    const saleDates = sales.map(sale => new Date(sale.saleDate));
    const maxDate = new Date(Math.max(...saleDates.map(d => d.getTime())));
    const baseDate = maxDate.toISOString().split('T')[0];
    
    return sales.map(sale => {
      const adjustedSale = { ...sale };
      
      if (this.config.customTimeAdjustment) {
        // Apply custom adjustment if provided
        const adjustmentFactor = this.config.customTimeAdjustment(sale, baseDate);
        adjustedSale.salePrice = sale.salePrice * adjustmentFactor;
      } else {
        // Apply standard adjustment based on method
        const saleDate = new Date(sale.saleDate);
        let adjustmentFactor = 1.0;
        
        if (this.config.timeAdjustmentMethod === 'monthly') {
          // Calculate months difference and apply 0.5% per month adjustment (example rate)
          const monthsDiff = this.monthsDifference(saleDate, maxDate);
          adjustmentFactor = 1 + (monthsDiff * 0.005);
        } else if (this.config.timeAdjustmentMethod === 'quarterly') {
          // Calculate quarters difference and apply 1.5% per quarter adjustment (example rate)
          const monthsDiff = this.monthsDifference(saleDate, maxDate);
          const quartersDiff = Math.floor(monthsDiff / 3);
          adjustmentFactor = 1 + (quartersDiff * 0.015);
        }
        
        adjustedSale.salePrice = sale.salePrice * adjustmentFactor;
      }
      
      return adjustedSale;
    });
  }

  /**
   * Trim outliers from a dataset based on standard deviations from the median
   */
  private trimOutliers(values: number[], threshold: number): number[] {
    const median = this.calculateMedian(values);
    const deviations = values.map(v => Math.abs(v - median));
    const medianDeviation = this.calculateMedian(deviations);
    
    // Use median absolute deviation (MAD) which is more robust than standard deviation
    return values.filter(v => {
      const deviation = Math.abs(v - median);
      return deviation <= threshold * medianDeviation;
    });
  }

  /**
   * Calculate median of an array of numbers
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);
    
    if (sortedValues.length % 2 === 0) {
      return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
    } else {
      return sortedValues[mid];
    }
  }

  /**
   * Calculate mean of an array of numbers
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * Calculate weighted mean (sum of numerators / sum of denominators)
   */
  private calculateWeightedMean(numerators: number[], denominators: number[]): number {
    if (numerators.length === 0 || numerators.length !== denominators.length) return 0;
    
    const sumNumerators = numerators.reduce((sum, value) => sum + value, 0);
    const sumDenominators = denominators.reduce((sum, value) => sum + value, 0);
    
    if (sumDenominators === 0) return 0;
    return sumNumerators / sumDenominators;
  }

  /**
   * Calculate standard deviation of an array of numbers
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / (values.length - 1);
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate the number of months between two dates
   */
  private monthsDifference(start: Date, end: Date): number {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }

  /**
   * Approximate the t-distribution critical value for given degrees of freedom and alpha
   * This is an approximation that works reasonably well for common confidence levels
   */
  private approximateTCritical(df: number, alpha: number): number {
    if (df <= 0) return 0;
    
    // Common confidence levels approximation
    if (alpha === 0.05) { // 95% confidence
      if (df >= 30) return 1.96; // Large sample approximation using normal distribution
      if (df >= 20) return 2.086;
      if (df >= 15) return 2.131;
      if (df >= 10) return 2.228;
      if (df >= 5) return 2.571;
      return 3.0; // Very small df approximation
    } else if (alpha === 0.01) { // 99% confidence
      if (df >= 30) return 2.576; // Large sample approximation using normal distribution
      if (df >= 20) return 2.845;
      if (df >= 15) return 2.947;
      if (df >= 10) return 3.169;
      if (df >= 5) return 4.032;
      return 5.0; // Very small df approximation
    } else if (alpha === 0.10) { // 90% confidence
      if (df >= 30) return 1.645; // Large sample approximation using normal distribution
      if (df >= 20) return 1.725;
      if (df >= 15) return 1.753;
      if (df >= 10) return 1.812;
      if (df >= 5) return 2.015;
      return 2.5; // Very small df approximation
    }
    
    // Default approximation for other alpha values
    // This uses an approximation of the normal distribution quantile function
    const z = this.approximateNormalQuantile(1 - alpha / 2);
    return z + 1 / (4 * df);
  }

  /**
   * Approximate the standard normal quantile function
   * Based on Abramowitz and Stegun approximation
   */
  private approximateNormalQuantile(p: number): number {
    if (p <= 0 || p >= 1) return 0;
    
    // Handle symmetric cases
    if (p > 0.5) return -this.approximateNormalQuantile(1 - p);
    
    // Constants for the approximation
    const a = [2.515517, 0.802853, 0.010328];
    const b = [1.432788, 0.189269, 0.001308];
    
    const t = Math.sqrt(-2 * Math.log(p));
    
    return t - (a[0] + a[1] * t + a[2] * t * t) / 
               (1 + b[0] * t + b[1] * t * t + b[2] * t * t * t);
  }

  /**
   * Check if COD meets IAAO standards based on property type
   */
  private checkIaaoCodStandard(cod: number, propertyType: string): boolean {
    // IAAO standards for COD based on property type and market activity
    switch (propertyType.toLowerCase()) {
      case 'residential':
      case 'single-family':
        return cod >= 5.0 && cod <= 15.0;
      
      case 'commercial':
      case 'industrial':
      case 'income':
      case 'income-producing':
        return cod >= 5.0 && cod <= 20.0;
      
      case 'vacant':
      case 'land':
      case 'vacant land':
        return cod >= 5.0 && cod <= 25.0;
      
      default: // Generic test
        return cod >= 5.0 && cod <= 20.0;
    }
  }
}