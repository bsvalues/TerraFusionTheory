/**
 * Spatial Autocorrelation Analysis Implementation
 * 
 * This module implements spatial autocorrelation measures for detecting and analyzing
 * spatial patterns in property data, particularly for mass appraisal and valuation.
 * 
 * Includes implementations of Moran's I, Getis-Ord G, and Geary's C statistics.
 */

import { PropertyData } from '../../server/services/connectors/cama.connector';
import { SpatialWeightMatrix } from './spatial-regression';

/**
 * Spatial autocorrelation results structure
 */
export interface SpatialAutocorrelationResults {
  // Moran's I statistic (global spatial autocorrelation)
  moransI: {
    value: number;
    expectedValue: number;
    variance: number;
    zScore: number;
    pValue: number;
    interpretation: string;
  };
  
  // Getis-Ord General G statistic (hot/cold spots)
  generalG?: {
    value: number;
    expectedValue: number;
    variance: number;
    zScore: number;
    pValue: number;
    interpretation: string;
  };
  
  // Geary's C statistic (alternative measure of spatial autocorrelation)
  gearyC?: {
    value: number;
    expectedValue: number;
    variance: number;
    zScore: number;
    pValue: number;
    interpretation: string;
  };
  
  // Local indicators of spatial association (LISA) statistics
  lisa?: {
    moransI: Map<string, {
      value: number;
      zScore: number;
      pValue: number;
      cluster: 'high-high' | 'low-low' | 'high-low' | 'low-high' | 'not-significant';
    }>;
    getisOrdGi?: Map<string, {
      value: number;
      zScore: number;
      pValue: number;
      hotspot: 'hot' | 'cold' | 'not-significant';
    }>;
  };
  
  // General statistics
  sampleSize: number;
  variableName: string;
  spatialWeightType: string;
  effectiveDate: string;
}

/**
 * Options for spatial autocorrelation analysis
 */
export interface SpatialAutocorrelationOptions {
  // Which statistics to calculate
  calculateMoransI?: boolean;
  calculateGeneralG?: boolean;
  calculateGearyC?: boolean;
  calculateLISA?: boolean;
  
  // Options for p-value calculation
  permutations?: number; // Number of random permutations for empirical p-value (0 = analytical)
  significanceLevel?: number; // Default significance level (e.g., 0.05)
  
  // Options for spatial weights
  distanceBandwidth?: number; // For distance-based weights
  kNearest?: number; // For k-nearest neighbor weights
  
  // Variable transformation
  transform?: 'none' | 'log' | 'standardize'; // Transform the variable before analysis
}

/**
 * Implementation of spatial autocorrelation measures
 */
export class SpatialAutocorrelation {
  private options: SpatialAutocorrelationOptions;
  
  constructor(options: SpatialAutocorrelationOptions = {}) {
    // Set default options
    this.options = {
      calculateMoransI: true,
      calculateGeneralG: false,
      calculateGearyC: false,
      calculateLISA: false,
      permutations: 0, // Use analytical approach by default
      significanceLevel: 0.05, // 95% confidence level
      transform: 'none',
      ...options
    };
  }
  
  /**
   * Analyze spatial autocorrelation for a property dataset
   */
  public analyze(
    properties: PropertyData[],
    variable: keyof PropertyData | ((p: PropertyData) => number),
    weights: SpatialWeightMatrix,
    options: Partial<SpatialAutocorrelationOptions> = {}
  ): SpatialAutocorrelationResults {
    // Merge options
    const mergedOptions = { ...this.options, ...options };
    
    // Extract values of the variable from properties
    const values = this.extractValues(properties, variable);
    
    // Transform values if needed
    const transformedValues = this.transformValues(values, mergedOptions.transform!);
    
    // Create result object
    const results: SpatialAutocorrelationResults = {
      moransI: {
        value: 0,
        expectedValue: 0,
        variance: 0,
        zScore: 0,
        pValue: 1,
        interpretation: ''
      },
      sampleSize: properties.length,
      variableName: typeof variable === 'function' ? 'custom' : String(variable),
      spatialWeightType: this.determineSpatialWeightType(weights),
      effectiveDate: new Date().toISOString().split('T')[0]
    };
    
    // Create mapping from property IDs to indices
    const idToIndex = new Map<string, number>();
    properties.forEach((prop, i) => {
      idToIndex.set(prop.id, i);
    });
    
    // Calculate Moran's I if requested
    if (mergedOptions.calculateMoransI) {
      results.moransI = this.calculateMoransI(transformedValues, weights, properties, idToIndex, mergedOptions);
    }
    
    // Calculate Getis-Ord General G if requested
    if (mergedOptions.calculateGeneralG) {
      results.generalG = this.calculateGeneralG(transformedValues, weights, properties, idToIndex, mergedOptions);
    }
    
    // Calculate Geary's C if requested
    if (mergedOptions.calculateGearyC) {
      results.gearyC = this.calculateGearyC(transformedValues, weights, properties, idToIndex, mergedOptions);
    }
    
    // Calculate local indicators of spatial association (LISA) if requested
    if (mergedOptions.calculateLISA) {
      results.lisa = {
        moransI: this.calculateLocalMoransI(transformedValues, weights, properties, idToIndex, mergedOptions)
      };
      
      if (mergedOptions.calculateGeneralG) {
        results.lisa.getisOrdGi = this.calculateGetisOrdGi(transformedValues, weights, properties, idToIndex, mergedOptions);
      }
    }
    
    return results;
  }
  
  /**
   * Calculate Moran's I statistic (global spatial autocorrelation)
   */
  private calculateMoransI(
    values: number[],
    weights: SpatialWeightMatrix,
    properties: PropertyData[],
    idToIndex: Map<string, number>,
    options: SpatialAutocorrelationOptions
  ): SpatialAutocorrelationResults['moransI'] {
    // Calculate mean of values
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate sum of squared deviations
    const sumSquaredDevs = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    
    if (sumSquaredDevs === 0) {
      return {
        value: 0,
        expectedValue: -1 / (values.length - 1),
        variance: 0,
        zScore: 0,
        pValue: 1,
        interpretation: 'No variation in values, Moran\'s I cannot be calculated'
      };
    }
    
    // Calculate numerator (sum of weighted cross-products)
    let numerator = 0;
    let sumWeights = 0;
    
    for (const [id, propertyWeights] of weights.weights.entries()) {
      const i = idToIndex.get(id);
      if (i === undefined) continue;
      
      const valueI = values[i];
      const devI = valueI - mean;
      
      for (const [neighborId, weight] of propertyWeights.entries()) {
        const j = idToIndex.get(neighborId);
        if (j === undefined) continue;
        
        const valueJ = values[j];
        const devJ = valueJ - mean;
        
        numerator += weight * devI * devJ;
        sumWeights += weight;
      }
    }
    
    // Calculate Moran's I
    const n = values.length;
    const moransI = (n / sumWeights) * (numerator / sumSquaredDevs);
    
    // Calculate expected value of Moran's I under null hypothesis
    const expectedI = -1 / (n - 1);
    
    // Calculate variance of Moran's I (analytical approach)
    let s1 = 0; // Sum of squared weights
    let s2 = 0; // Sum of squared rowSums + colSums
    
    // Calculate s1
    for (const [id, propertyWeights] of weights.weights.entries()) {
      for (const [, weight] of propertyWeights.entries()) {
        s1 += Math.pow(weight, 2);
      }
    }
    
    // Calculate s2
    const rowSums = new Map<string, number>();
    const colSums = new Map<string, number>();
    
    for (const [id, propertyWeights] of weights.weights.entries()) {
      let rowSum = 0;
      
      for (const [neighborId, weight] of propertyWeights.entries()) {
        rowSum += weight;
        
        const colSum = colSums.get(neighborId) || 0;
        colSums.set(neighborId, colSum + weight);
      }
      
      rowSums.set(id, rowSum);
    }
    
    for (const id of properties.map(p => p.id)) {
      const rowSum = rowSums.get(id) || 0;
      const colSum = colSums.get(id) || 0;
      s2 += Math.pow(rowSum + colSum, 2);
    }
    
    // Calculate sample variance
    const s2Sample = sumSquaredDevs / n;
    
    // Calculate fourth moment
    const s4 = values.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / n;
    
    // Calculate kurtosis (normalized)
    const kurtosis = (s4 / Math.pow(s2Sample, 2)) - 3;
    
    // Calculate components of the variance formula
    const term1 = n * ((Math.pow(n, 2) - 3 * n + 3) * s1 - n * s2 + 3 * Math.pow(sumWeights, 2));
    const term2 = kurtosis * ((Math.pow(n, 2) - n) * s1 - 2 * n * s2 + 6 * Math.pow(sumWeights, 2));
    
    const variance = (term1 + term2) / ((n - 1) * (n - 2) * (n - 3) * Math.pow(sumWeights, 2));
    
    // Calculate z-score
    const zScore = (moransI - expectedI) / Math.sqrt(variance);
    
    // Calculate p-value (two-tailed test)
    const pValue = this.calculatePValue(zScore);
    
    // Determine interpretation
    const interpretation = this.interpretMoransI(moransI, zScore, pValue, options.significanceLevel!);
    
    return {
      value: moransI,
      expectedValue: expectedI,
      variance,
      zScore,
      pValue,
      interpretation
    };
  }
  
  /**
   * Calculate Getis-Ord General G statistic (hot/cold spots)
   */
  private calculateGeneralG(
    values: number[],
    weights: SpatialWeightMatrix,
    properties: PropertyData[],
    idToIndex: Map<string, number>,
    options: SpatialAutocorrelationOptions
  ): SpatialAutocorrelationResults['generalG'] {
    // General G only makes sense for non-negative values
    if (values.some(v => v < 0)) {
      return {
        value: 0,
        expectedValue: 0,
        variance: 0,
        zScore: 0,
        pValue: 1,
        interpretation: 'General G cannot be calculated for negative values'
      };
    }
    
    // Calculate numerator (sum of weighted values)
    let numerator = 0;
    let denominator = 0;
    
    for (const [id, propertyWeights] of weights.weights.entries()) {
      const i = idToIndex.get(id);
      if (i === undefined) continue;
      
      const valueI = values[i];
      
      for (const [neighborId, weight] of propertyWeights.entries()) {
        const j = idToIndex.get(neighborId);
        if (j === undefined) continue;
        
        const valueJ = values[j];
        
        numerator += weight * valueI * valueJ;
      }
    }
    
    // Calculate denominator (sum of all pairs of values)
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values.length; j++) {
        if (i !== j) {
          denominator += values[i] * values[j];
        }
      }
    }
    
    if (denominator === 0) {
      return {
        value: 0,
        expectedValue: 0,
        variance: 0,
        zScore: 0,
        pValue: 1,
        interpretation: 'Sum of all value pairs is zero, General G cannot be calculated'
      };
    }
    
    // Calculate General G
    const generalG = numerator / denominator;
    
    // Calculate expected value
    const n = values.length;
    const expectedG = sumWeights / (n * (n - 1));
    
    // Calculate sum of weights
    let sumWeights = 0;
    let sumSquaredWeights = 0;
    
    for (const [id, propertyWeights] of weights.weights.entries()) {
      for (const [, weight] of propertyWeights.entries()) {
        sumWeights += weight;
        sumSquaredWeights += Math.pow(weight, 2);
      }
    }
    
    // Calculate sample statistics
    const sumX = values.reduce((sum, val) => sum + val, 0);
    const sumX2 = values.reduce((sum, val) => sum + Math.pow(val, 2), 0);
    const meanX = sumX / n;
    const s2 = sumX2 / n - Math.pow(meanX, 2);
    
    // Simplified variance calculation (this is an approximation)
    const variance = (sumSquaredWeights * n * (n - 1) - Math.pow(sumWeights, 2) * (n - 1)) / 
                     (Math.pow(n, 2) * (n - 1) * (n - 2) * Math.pow(s2, 2));
    
    // Calculate z-score
    const zScore = (generalG - expectedG) / Math.sqrt(variance);
    
    // Calculate p-value (one-tailed test, as G is directional)
    const pValue = this.calculatePValue(Math.abs(zScore)) / 2;
    
    // Determine interpretation
    const interpretation = this.interpretGeneralG(generalG, zScore, pValue, options.significanceLevel!);
    
    return {
      value: generalG,
      expectedValue: expectedG,
      variance,
      zScore,
      pValue,
      interpretation
    };
  }
  
  /**
   * Calculate Geary's C statistic (alternative measure of spatial autocorrelation)
   */
  private calculateGearyC(
    values: number[],
    weights: SpatialWeightMatrix,
    properties: PropertyData[],
    idToIndex: Map<string, number>,
    options: SpatialAutocorrelationOptions
  ): SpatialAutocorrelationResults['gearyC'] {
    // Calculate mean of values
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate sum of squared deviations
    const sumSquaredDevs = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    
    if (sumSquaredDevs === 0) {
      return {
        value: 0,
        expectedValue: 1,
        variance: 0,
        zScore: 0,
        pValue: 1,
        interpretation: 'No variation in values, Geary\'s C cannot be calculated'
      };
    }
    
    // Calculate numerator (sum of weighted squared differences)
    let numerator = 0;
    let sumWeights = 0;
    
    for (const [id, propertyWeights] of weights.weights.entries()) {
      const i = idToIndex.get(id);
      if (i === undefined) continue;
      
      const valueI = values[i];
      
      for (const [neighborId, weight] of propertyWeights.entries()) {
        const j = idToIndex.get(neighborId);
        if (j === undefined) continue;
        
        const valueJ = values[j];
        
        numerator += weight * Math.pow(valueI - valueJ, 2);
        sumWeights += weight;
      }
    }
    
    // Calculate Geary's C
    const n = values.length;
    const gearyC = ((n - 1) / (2 * sumWeights)) * (numerator / sumSquaredDevs);
    
    // Calculate expected value of Geary's C under null hypothesis
    const expectedC = 1;
    
    // Calculate variance of Geary's C (simplified approximation)
    const variance = (1 / (2 * (n + 1))) * (1 + (2 * sumWeights) / Math.pow(n, 2));
    
    // Calculate z-score (note: for Geary's C, a value less than 1 indicates positive autocorrelation)
    const zScore = (gearyC - expectedC) / Math.sqrt(variance);
    
    // Calculate p-value (two-tailed test)
    const pValue = this.calculatePValue(Math.abs(zScore));
    
    // Determine interpretation
    const interpretation = this.interpretGearyC(gearyC, zScore, pValue, options.significanceLevel!);
    
    return {
      value: gearyC,
      expectedValue: expectedC,
      variance,
      zScore,
      pValue,
      interpretation
    };
  }
  
  /**
   * Calculate local Moran's I statistics (LISA)
   */
  private calculateLocalMoransI(
    values: number[],
    weights: SpatialWeightMatrix,
    properties: PropertyData[],
    idToIndex: Map<string, number>,
    options: SpatialAutocorrelationOptions
  ): Map<string, {
    value: number;
    zScore: number;
    pValue: number;
    cluster: 'high-high' | 'low-low' | 'high-low' | 'low-high' | 'not-significant';
  }> {
    const results = new Map<string, {
      value: number;
      zScore: number;
      pValue: number;
      cluster: 'high-high' | 'low-low' | 'high-low' | 'low-high' | 'not-significant';
    }>();
    
    // Calculate mean of values
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standardized values
    const stdValues = this.transformValues(values, 'standardize');
    
    // Calculate sum of squared standardized values
    const sumSquaredStdValues = stdValues.reduce((sum, val) => sum + Math.pow(val, 2), 0);
    
    // Calculate local Moran's I for each location
    for (const property of properties) {
      const i = idToIndex.get(property.id);
      if (i === undefined) continue;
      
      const valueI = stdValues[i];
      const propertyWeights = weights.weights.get(property.id);
      
      if (!propertyWeights) continue;
      
      // Calculate spatial lag (weighted average of neighboring values)
      let spatialLag = 0;
      let sumWeights = 0;
      
      for (const [neighborId, weight] of propertyWeights.entries()) {
        const j = idToIndex.get(neighborId);
        if (j === undefined) continue;
        
        const valueJ = stdValues[j];
        
        spatialLag += weight * valueJ;
        sumWeights += weight;
      }
      
      if (sumWeights === 0) continue;
      
      // Standardize spatial lag
      spatialLag /= sumWeights;
      
      // Calculate local Moran's I
      const localI = valueI * spatialLag;
      
      // Calculate expected value
      const expectedI = -stdValues[i] / (values.length - 1);
      
      // Calculate variance (simplified approximation)
      const rowSum = weights.rowSums.get(property.id) || 0;
      const m2 = sumSquaredStdValues / values.length;
      const variance = m2 * (Math.pow(rowSum, 2) / (values.length - 1));
      
      // Calculate z-score
      const zScore = (localI - expectedI) / Math.sqrt(variance);
      
      // Calculate p-value
      const pValue = this.calculatePValue(Math.abs(zScore));
      
      // Determine cluster type
      let cluster: 'high-high' | 'low-low' | 'high-low' | 'low-high' | 'not-significant' = 'not-significant';
      
      if (pValue < options.significanceLevel!) {
        if (values[i] > mean) {
          if (spatialLag > 0) {
            cluster = 'high-high'; // Hot spot
          } else {
            cluster = 'high-low'; // Spatial outlier
          }
        } else {
          if (spatialLag < 0) {
            cluster = 'low-low'; // Cold spot
          } else {
            cluster = 'low-high'; // Spatial outlier
          }
        }
      }
      
      // Store result
      results.set(property.id, {
        value: localI,
        zScore,
        pValue,
        cluster
      });
    }
    
    return results;
  }
  
  /**
   * Calculate local Getis-Ord Gi* statistics (hot/cold spots)
   */
  private calculateGetisOrdGi(
    values: number[],
    weights: SpatialWeightMatrix,
    properties: PropertyData[],
    idToIndex: Map<string, number>,
    options: SpatialAutocorrelationOptions
  ): Map<string, {
    value: number;
    zScore: number;
    pValue: number;
    hotspot: 'hot' | 'cold' | 'not-significant';
  }> {
    const results = new Map<string, {
      value: number;
      zScore: number;
      pValue: number;
      hotspot: 'hot' | 'cold' | 'not-significant';
    }>();
    
    // Calculate global statistics
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const sumX = values.reduce((sum, val) => sum + val, 0);
    const sumX2 = values.reduce((sum, val) => sum + Math.pow(val, 2), 0);
    const s = Math.sqrt(sumX2 / n - Math.pow(mean, 2));
    
    // Calculate local G for each location
    for (const property of properties) {
      const i = idToIndex.get(property.id);
      if (i === undefined) continue;
      
      const propertyWeights = weights.weights.get(property.id);
      
      if (!propertyWeights) continue;
      
      // Calculate weighted sum and sum of weights
      let weightedSum = 0;
      let sumWeights = 0;
      
      for (const [neighborId, weight] of propertyWeights.entries()) {
        const j = idToIndex.get(neighborId);
        if (j === undefined) continue;
        
        const valueJ = values[j];
        
        weightedSum += weight * valueJ;
        sumWeights += weight;
      }
      
      if (sumWeights === 0) continue;
      
      // Calculate local G
      const localG = weightedSum / sumX;
      
      // Calculate expected value
      const expectedG = sumWeights / (n - 1);
      
      // Calculate variance (simplified approximation)
      const variance = (sumWeights * (n - sumWeights)) / ((n - 1) * Math.sqrt(n - 2));
      
      // Calculate z-score
      const zScore = (localG - expectedG) / (s * Math.sqrt(variance));
      
      // Calculate p-value (one-tailed test, as G is directional)
      const pValue = this.calculatePValue(Math.abs(zScore)) / 2;
      
      // Determine hot/cold spot
      let hotspot: 'hot' | 'cold' | 'not-significant' = 'not-significant';
      
      if (pValue < options.significanceLevel!) {
        if (zScore > 0) {
          hotspot = 'hot';
        } else {
          hotspot = 'cold';
        }
      }
      
      // Store result
      results.set(property.id, {
        value: localG,
        zScore,
        pValue,
        hotspot
      });
    }
    
    return results;
  }
  
  /**
   * Extract values from properties based on a variable name or function
   */
  private extractValues(
    properties: PropertyData[],
    variable: keyof PropertyData | ((p: PropertyData) => number)
  ): number[] {
    if (typeof variable === 'function') {
      return properties.map(prop => variable(prop));
    } else {
      return properties.map(prop => {
        const value = prop[variable];
        return typeof value === 'number' ? value : 0;
      });
    }
  }
  
  /**
   * Transform values based on specified method
   */
  private transformValues(values: number[], transform: string): number[] {
    switch (transform) {
      case 'log':
        return values.map(v => (v > 0) ? Math.log(v) : 0);
      
      case 'standardize':
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        );
        
        return stdDev === 0 
          ? values.map(() => 0) 
          : values.map(v => (v - mean) / stdDev);
      
      case 'none':
      default:
        return [...values];
    }
  }
  
  /**
   * Calculate p-value from z-score (standard normal distribution)
   */
  private calculatePValue(zScore: number): number {
    // Use standard normal approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(zScore));
    const d = 0.3989423 * Math.exp(-zScore * zScore / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    return 2 * p; // Two-tailed test
  }
  
  /**
   * Interpret Moran's I result
   */
  private interpretMoransI(value: number, zScore: number, pValue: number, significanceLevel: number): string {
    if (pValue >= significanceLevel) {
      return 'No statistically significant spatial autocorrelation detected (random pattern)';
    }
    
    if (value > 0) {
      return `Statistically significant positive spatial autocorrelation (p=${pValue.toFixed(4)}). Similar values tend to cluster together.`;
    } else {
      return `Statistically significant negative spatial autocorrelation (p=${pValue.toFixed(4)}). Dissimilar values tend to be neighbors.`;
    }
  }
  
  /**
   * Interpret General G result
   */
  private interpretGeneralG(value: number, zScore: number, pValue: number, significanceLevel: number): string {
    if (pValue >= significanceLevel) {
      return 'No statistically significant clustering of high or low values detected';
    }
    
    if (zScore > 0) {
      return `Statistically significant clustering of high values (p=${pValue.toFixed(4)}). Hot spots present.`;
    } else {
      return `Statistically significant clustering of low values (p=${pValue.toFixed(4)}). Cold spots present.`;
    }
  }
  
  /**
   * Interpret Geary's C result
   */
  private interpretGearyC(value: number, zScore: number, pValue: number, significanceLevel: number): string {
    if (pValue >= significanceLevel) {
      return 'No statistically significant spatial autocorrelation detected (random pattern)';
    }
    
    if (value < 1) {
      return `Statistically significant positive spatial autocorrelation (p=${pValue.toFixed(4)}). Similar values tend to cluster together.`;
    } else if (value > 1) {
      return `Statistically significant negative spatial autocorrelation (p=${pValue.toFixed(4)}). Dissimilar values tend to be neighbors.`;
    } else {
      return 'Spatial pattern corresponds to perfect randomness';
    }
  }
  
  /**
   * Determine type of spatial weight matrix
   */
  private determineSpatialWeightType(weights: SpatialWeightMatrix): string {
    // Check if all weights are 0 or 1 (binary contiguity)
    let allBinary = true;
    let hasDistanceDecay = false;
    
    for (const [, propertyWeights] of weights.weights.entries()) {
      for (const [, weight] of propertyWeights.entries()) {
        if (weight !== 0 && weight !== 1) {
          allBinary = false;
        }
        
        if (weight > 0 && weight < 1) {
          hasDistanceDecay = true;
        }
      }
    }
    
    // Determine type based on patterns
    if (allBinary) {
      return 'binary contiguity';
    } else if (hasDistanceDecay) {
      return 'distance-based';
    } else {
      // Check if every location has the same number of neighbors (k-nearest)
      const neighborCounts = Array.from(weights.weights.values()).map(nw => nw.size);
      
      if (neighborCounts.length > 0) {
        const firstCount = neighborCounts[0];
        const allSame = neighborCounts.every(c => c === firstCount);
        
        if (allSame) {
          return `k-nearest neighbors (k=${firstCount})`;
        }
      }
      
      return 'custom';
    }
  }
}