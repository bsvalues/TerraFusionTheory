/**
 * Data Quality Service
 * 
 * Provides tools for assessing and improving data quality in the GAMA system.
 * Follows IAAO standards for data quality assessment.
 */

import { db } from '../db';
import { properties, propertySales, neighborhoods } from '@shared/schema';
import { DataValidator } from '@shared/validation/data-validator';
import { 
  iaaoValidationRules, 
  propertyValidationRules, 
  propertySaleValidationRules, 
  neighborhoodValidationRules 
} from '@shared/validation/iaao-validation-rules';
import { ValidationReport, ValidationSummary } from '@shared/validation/validation.types';

/**
 * Quality scoring thresholds
 */
export enum QualityLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  AVERAGE = 'average',
  FAIR = 'fair',
  POOR = 'poor'
}

/**
 * Quality score thresholds
 */
const QUALITY_THRESHOLDS = {
  [QualityLevel.EXCELLENT]: 90,
  [QualityLevel.GOOD]: 75,
  [QualityLevel.AVERAGE]: 60,
  [QualityLevel.FAIR]: 40,
  [QualityLevel.POOR]: 0
};

/**
 * Represents a data quality score
 */
export interface QualityScore {
  score: number;
  level: QualityLevel;
  description: string;
}

/**
 * Represents a data quality metric
 */
export interface QualityMetric {
  name: string;
  description: string;
  score: number;
  importance: number; // 1-10 scale
  recommendations: string[];
}

/**
 * Detailed data quality report
 */
export interface DataQualityReport {
  timestamp: Date;
  entityType: string;
  entityCount: number;
  overallScore: QualityScore;
  metrics: QualityMetric[];
  criticalIssues: string[];
  recommendations: string[];
  validationReport?: ValidationReport;
}

/**
 * Data quality service for assessing and improving data quality
 */
export class DataQualityService {
  private validator: DataValidator;
  
  constructor() {
    this.validator = new DataValidator();
    
    // Register IAAO validation rules
    this.validator.registerRuleSet(propertyValidationRules);
    this.validator.registerRuleSet(propertySaleValidationRules);
    this.validator.registerRuleSet(neighborhoodValidationRules);
  }
  
  /**
   * Generate a quality level from a numeric score
   */
  getQualityLevel(score: number): QualityScore {
    let level: QualityLevel;
    let description: string;
    
    if (score >= QUALITY_THRESHOLDS[QualityLevel.EXCELLENT]) {
      level = QualityLevel.EXCELLENT;
      description = 'Excellent data quality meeting all IAAO standards';
    } else if (score >= QUALITY_THRESHOLDS[QualityLevel.GOOD]) {
      level = QualityLevel.GOOD;
      description = 'Good data quality meeting most IAAO standards';
    } else if (score >= QUALITY_THRESHOLDS[QualityLevel.AVERAGE]) {
      level = QualityLevel.AVERAGE;
      description = 'Average data quality meeting basic IAAO standards';
    } else if (score >= QUALITY_THRESHOLDS[QualityLevel.FAIR]) {
      level = QualityLevel.FAIR;
      description = 'Fair data quality with multiple issues to address';
    } else {
      level = QualityLevel.POOR;
      description = 'Poor data quality requiring significant improvement';
    }
    
    return { score, level, description };
  }
  
  /**
   * Generate a comprehensive quality report for property data
   */
  async generatePropertyDataQualityReport(): Promise<DataQualityReport> {
    try {
      // Get all properties
      const propertyData = await db.select().from(properties);
      
      // Define quality metrics
      const metrics: QualityMetric[] = [
        {
          name: 'Completeness',
          description: 'Percentage of required fields that are populated',
          score: 0,
          importance: 9,
          recommendations: []
        },
        {
          name: 'Accuracy',
          description: 'Correctness of data based on validation rules',
          score: 0,
          importance: 10,
          recommendations: []
        },
        {
          name: 'Consistency',
          description: 'Consistency of data across related fields',
          score: 0, 
          importance: 8,
          recommendations: []
        },
        {
          name: 'Geospatial',
          description: 'Quality of geospatial data (coordinates, boundaries)',
          score: 0,
          importance: 7,
          recommendations: []
        },
        {
          name: 'Timeliness',
          description: 'Recency of data updates',
          score: 0,
          importance: 6,
          recommendations: []
        }
      ];
      
      // Validate all properties against IAAO rules
      const validationReport = await this.validator.validateEntities(propertyData, 'properties');
      
      // Calculate completeness metric
      const requiredFields = [
        'parcelId', 'address', 'city', 'state', 'zipCode', 'county', 'propertyType'
      ];
      
      const valuableFields = [
        ...requiredFields,
        'yearBuilt', 'buildingArea', 'lotSize', 'bedrooms', 'bathrooms',
        'latitude', 'longitude', 'assessedValue', 'marketValue'
      ];
      
      let completenessTotal = 0;
      let missingFields: Record<string, number> = {};
      
      propertyData.forEach(property => {
        let entityCompleteness = 0;
        let fieldsPresent = 0;
        
        valuableFields.forEach(field => {
          if (property[field] !== null && property[field] !== undefined && property[field] !== '') {
            fieldsPresent++;
          } else {
            missingFields[field] = (missingFields[field] || 0) + 1;
          }
        });
        
        entityCompleteness = (fieldsPresent / valuableFields.length) * 100;
        completenessTotal += entityCompleteness;
      });
      
      // Calculate overall completeness score
      const completenessScore = propertyData.length > 0 ? 
        completenessTotal / propertyData.length : 0;
      
      metrics[0].score = Math.round(completenessScore);
      
      // Generate recommendations for completeness
      Object.entries(missingFields)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5) // Top 5 missing fields
        .forEach(([field, count]) => {
          const percentage = Math.round((count / propertyData.length) * 100);
          metrics[0].recommendations.push(
            `Add ${field} data (missing in ${percentage}% of properties)`
          );
        });
      
      // Calculate accuracy metric based on validation results
      const errorRate = propertyData.length > 0 ? 
        (validationReport.invalidEntities / propertyData.length) : 0;
      
      metrics[1].score = Math.round(100 - (errorRate * 100));
      
      // Generate recommendations for accuracy issues
      const errorCounts: Record<string, { count: number, message: string }> = {};
      
      validationReport.summaries.forEach(summary => {
        summary.results.forEach(result => {
          if (!result.valid) {
            const key = `${result.field}:${result.message}`;
            if (!errorCounts[key]) {
              errorCounts[key] = { count: 0, message: result.message || 'Unknown error' };
            }
            errorCounts[key].count++;
          }
        });
      });
      
      Object.entries(errorCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5) // Top 5 error types
        .forEach(([field, { count, message }]) => {
          const percentage = Math.round((count / propertyData.length) * 100);
          const fieldName = field.split(':')[0];
          metrics[1].recommendations.push(
            `Fix ${fieldName} data: ${message} (affects ${percentage}% of properties)`
          );
        });
      
      // Calculate geospatial metric
      let geoCount = 0;
      propertyData.forEach(property => {
        if (property.latitude && property.longitude) {
          geoCount++;
        }
      });
      
      const geoScore = propertyData.length > 0 ? 
        (geoCount / propertyData.length) * 100 : 0;
      
      metrics[3].score = Math.round(geoScore);
      
      if (geoScore < 95) {
        metrics[3].recommendations.push(
          `Geocode ${propertyData.length - geoCount} properties missing coordinates`
        );
      }
      
      // Calculate consistency metric based on relationship validations
      // This looks at logical relationships between fields
      let consistencyIssues = 0;
      validationReport.summaries.forEach(summary => {
        summary.results.forEach(result => {
          if (!result.valid && result.metadata?.ruleType === 'relationship') {
            consistencyIssues++;
          }
        });
      });
      
      const consistencyScore = 100 - (consistencyIssues / propertyData.length) * 20;
      metrics[2].score = Math.round(Math.max(consistencyScore, 0));
      
      // Calculate timeliness metric based on update timestamps
      const now = new Date();
      let timelinessTotal = 0;
      
      propertyData.forEach(property => {
        if (property.updatedAt) {
          const daysSinceUpdate = (now.getTime() - new Date(property.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
          
          // Score decreases with age, approximately 10 points per year
          // 100 for updated today, 90 for ~36 days old, 0 for ~10 years old
          const recordTimelinessScore = Math.max(0, 100 - (daysSinceUpdate / 36.5) * 10);
          timelinessTotal += recordTimelinessScore;
        } else {
          // Default score for records with no updated timestamp
          timelinessTotal += 50;
        }
      });
      
      const timelinessScore = propertyData.length > 0 ? 
        timelinessTotal / propertyData.length : 0;
      
      metrics[4].score = Math.round(timelinessScore);
      
      if (timelinessScore < 70) {
        metrics[4].recommendations.push(
          'Update property data with more recent assessment information'
        );
      }
      
      // Calculate overall score based on weighted metrics
      let weightedScoreSum = 0;
      let weightSum = 0;
      
      metrics.forEach(metric => {
        weightedScoreSum += metric.score * metric.importance;
        weightSum += metric.importance;
      });
      
      const overallScore = weightSum > 0 ? weightedScoreSum / weightSum : 0;
      
      // Compile critical issues
      const criticalIssues: string[] = [];
      
      // Completeness issues
      if (metrics[0].score < 50) {
        criticalIssues.push('Significant data completeness issues require addressing');
      }
      
      // Accuracy issues
      if (metrics[1].score < 60) {
        criticalIssues.push('Data accuracy issues need to be fixed for reliable mass appraisal');
      }
      
      // Geospatial issues
      if (metrics[3].score < 70) {
        criticalIssues.push('Many properties lack proper geospatial data');
      }
      
      // Add specific critical issues from validation
      const criticalValidationIssues = validationReport.summaries
        .flatMap(summary => 
          summary.results
            .filter(result => !result.valid && result.severity === 'critical')
            .map(result => `${result.field}: ${result.message}`)
        )
        .filter((value, index, self) => self.indexOf(value) === index) // Get unique issues
        .slice(0, 5); // Top 5 critical issues
      
      criticalIssues.push(...criticalValidationIssues);
      
      // Compile overall recommendations
      const recommendations: string[] = [
        ...new Set(
          metrics
            .flatMap(metric => metric.recommendations)
            .sort((a, b) => b.length - a.length)
            .slice(0, 8) // Limit to top 8 recommendations
        )
      ];
      
      return {
        timestamp: new Date(),
        entityType: 'properties',
        entityCount: propertyData.length,
        overallScore: this.getQualityLevel(Math.round(overallScore)),
        metrics,
        criticalIssues,
        recommendations,
        validationReport
      };
    } catch (error) {
      console.error('Error generating property data quality report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a comprehensive quality report for property sales data
   */
  async generatePropertySalesDataQualityReport(): Promise<DataQualityReport> {
    try {
      // Get all property sales
      const salesData = await db.select().from(propertySales);
      
      // Define quality metrics
      const metrics: QualityMetric[] = [
        {
          name: 'Completeness',
          description: 'Percentage of required fields that are populated',
          score: 0,
          importance: 9,
          recommendations: []
        },
        {
          name: 'Accuracy',
          description: 'Correctness of data based on validation rules',
          score: 0,
          importance: 10,
          recommendations: []
        },
        {
          name: 'Verification',
          description: 'Percentage of sales that have been verified',
          score: 0, 
          importance: 8,
          recommendations: []
        },
        {
          name: 'Recency',
          description: 'Recency of sales data',
          score: 0,
          importance: 7,
          recommendations: []
        },
        {
          name: 'Analysis Suitability',
          description: 'Percentage of sales suitable for ratio studies',
          score: 0,
          importance: 9,
          recommendations: []
        }
      ];
      
      // Validate all sales against IAAO rules
      const validationReport = await this.validator.validateEntities(salesData, 'property_sales');
      
      // Calculate completeness metric
      const requiredFields = [
        'propertyId', 'parcelId', 'salePrice', 'saleDate', 'transactionType'
      ];
      
      const valuableFields = [
        ...requiredFields,
        'deedType', 'buyerName', 'sellerName', 'financingType', 
        'assessedValueAtSale', 'salePricePerSqFt', 'assessmentRatio'
      ];
      
      let completenessTotal = 0;
      let missingFields: Record<string, number> = {};
      
      salesData.forEach(sale => {
        let entityCompleteness = 0;
        let fieldsPresent = 0;
        
        valuableFields.forEach(field => {
          if (sale[field] !== null && sale[field] !== undefined && sale[field] !== '') {
            fieldsPresent++;
          } else {
            missingFields[field] = (missingFields[field] || 0) + 1;
          }
        });
        
        entityCompleteness = (fieldsPresent / valuableFields.length) * 100;
        completenessTotal += entityCompleteness;
      });
      
      // Calculate overall completeness score
      const completenessScore = salesData.length > 0 ? 
        completenessTotal / salesData.length : 0;
      
      metrics[0].score = Math.round(completenessScore);
      
      // Generate recommendations for completeness
      Object.entries(missingFields)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5) // Top 5 missing fields
        .forEach(([field, count]) => {
          const percentage = Math.round((count / salesData.length) * 100);
          metrics[0].recommendations.push(
            `Add ${field} data (missing in ${percentage}% of sales)`
          );
        });
      
      // Calculate accuracy metric based on validation results
      const errorRate = salesData.length > 0 ? 
        (validationReport.invalidEntities / salesData.length) : 0;
      
      metrics[1].score = Math.round(100 - (errorRate * 100));
      
      // Generate recommendations for accuracy issues
      const errorCounts: Record<string, { count: number, message: string }> = {};
      
      validationReport.summaries.forEach(summary => {
        summary.results.forEach(result => {
          if (!result.valid) {
            const key = `${result.field}:${result.message}`;
            if (!errorCounts[key]) {
              errorCounts[key] = { count: 0, message: result.message || 'Unknown error' };
            }
            errorCounts[key].count++;
          }
        });
      });
      
      Object.entries(errorCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5) // Top 5 error types
        .forEach(([field, { count, message }]) => {
          const percentage = Math.round((count / salesData.length) * 100);
          const fieldName = field.split(':')[0];
          metrics[1].recommendations.push(
            `Fix ${fieldName} data: ${message} (affects ${percentage}% of sales)`
          );
        });
      
      // Calculate verification metric
      let verifiedCount = 0;
      salesData.forEach(sale => {
        if (sale.verified) {
          verifiedCount++;
        }
      });
      
      const verificationScore = salesData.length > 0 ? 
        (verifiedCount / salesData.length) * 100 : 0;
      
      metrics[2].score = Math.round(verificationScore);
      
      if (verificationScore < 80) {
        metrics[2].recommendations.push(
          `Verify ${salesData.length - verifiedCount} unverified sales`
        );
      }
      
      // Calculate recency metric based on sale dates
      const now = new Date();
      let recencyTotal = 0;
      
      salesData.forEach(sale => {
        if (sale.saleDate) {
          // Calculate months since sale
          const monthsSinceSale = (now.getTime() - new Date(sale.saleDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
          
          // Score decreases with age:
          // 100 for sales in the last month
          // 80 for sales within 1 year
          // 60 for sales within 2 years
          // 40 for sales within 3 years
          // 20 for sales within 5 years
          // 0 for sales older than 5 years
          let saleRecencyScore = 0;
          if (monthsSinceSale <= 1) saleRecencyScore = 100;
          else if (monthsSinceSale <= 12) saleRecencyScore = 80;
          else if (monthsSinceSale <= 24) saleRecencyScore = 60;
          else if (monthsSinceSale <= 36) saleRecencyScore = 40;
          else if (monthsSinceSale <= 60) saleRecencyScore = 20;
          
          recencyTotal += saleRecencyScore;
        } else {
          // Default score for records with no sale date
          recencyTotal += 0; // Consider no date as very old
        }
      });
      
      const recencyScore = salesData.length > 0 ? 
        recencyTotal / salesData.length : 0;
      
      metrics[3].score = Math.round(recencyScore);
      
      if (recencyScore < 60) {
        metrics[3].recommendations.push(
          'Current sales data may be too old for reliable market analysis'
        );
      }
      
      // Calculate analysis suitability metric
      let validForAnalysisCount = 0;
      salesData.forEach(sale => {
        if (sale.validForAnalysis) {
          validForAnalysisCount++;
        }
      });
      
      const suitabilityScore = salesData.length > 0 ? 
        (validForAnalysisCount / salesData.length) * 100 : 0;
      
      metrics[4].score = Math.round(suitabilityScore);
      
      if (suitabilityScore < 70) {
        metrics[4].recommendations.push(
          `Many sales (${salesData.length - validForAnalysisCount}) are not suitable for analysis`
        );
      }
      
      // Calculate overall score based on weighted metrics
      let weightedScoreSum = 0;
      let weightSum = 0;
      
      metrics.forEach(metric => {
        weightedScoreSum += metric.score * metric.importance;
        weightSum += metric.importance;
      });
      
      const overallScore = weightSum > 0 ? weightedScoreSum / weightSum : 0;
      
      // Compile critical issues
      const criticalIssues: string[] = [];
      
      // Completeness issues
      if (metrics[0].score < 50) {
        criticalIssues.push('Significant sales data completeness issues require addressing');
      }
      
      // Accuracy issues
      if (metrics[1].score < 60) {
        criticalIssues.push('Sales data accuracy issues need to be fixed for reliable ratio studies');
      }
      
      // Verification issues
      if (metrics[2].score < 50) {
        criticalIssues.push('Many sales have not been verified for validity');
      }
      
      // Analysis suitability issues
      if (metrics[4].score < 60) {
        criticalIssues.push('Insufficient number of sales suitable for analysis');
      }
      
      // Add specific critical issues from validation
      const criticalValidationIssues = validationReport.summaries
        .flatMap(summary => 
          summary.results
            .filter(result => !result.valid && result.severity === 'critical')
            .map(result => `${result.field}: ${result.message}`)
        )
        .filter((value, index, self) => self.indexOf(value) === index) // Get unique issues
        .slice(0, 5); // Top 5 critical issues
      
      criticalIssues.push(...criticalValidationIssues);
      
      // Compile overall recommendations
      const recommendations: string[] = [
        ...new Set(
          metrics
            .flatMap(metric => metric.recommendations)
            .sort((a, b) => b.length - a.length)
            .slice(0, 8) // Limit to top 8 recommendations
        )
      ];
      
      return {
        timestamp: new Date(),
        entityType: 'property_sales',
        entityCount: salesData.length,
        overallScore: this.getQualityLevel(Math.round(overallScore)),
        metrics,
        criticalIssues,
        recommendations,
        validationReport
      };
    } catch (error) {
      console.error('Error generating property sales data quality report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a comprehensive quality report for neighborhood data
   */
  async generateNeighborhoodDataQualityReport(): Promise<DataQualityReport> {
    try {
      // Get all neighborhoods
      const neighborhoodData = await db.select().from(neighborhoods);
      
      // Define quality metrics
      const metrics: QualityMetric[] = [
        {
          name: 'Completeness',
          description: 'Percentage of required fields that are populated',
          score: 0,
          importance: 9,
          recommendations: []
        },
        {
          name: 'Accuracy',
          description: 'Correctness of data based on validation rules',
          score: 0,
          importance: 10,
          recommendations: []
        },
        {
          name: 'Boundary Quality',
          description: 'Quality of boundary definitions',
          score: 0, 
          importance: 8,
          recommendations: []
        },
        {
          name: 'Statistical Validity',
          description: 'Quality of statistical data about neighborhoods',
          score: 0,
          importance: 7,
          recommendations: []
        }
      ];
      
      // Validate all neighborhoods against IAAO rules
      const validationReport = await this.validator.validateEntities(neighborhoodData, 'neighborhoods');
      
      // Calculate completeness metric
      const requiredFields = [
        'name', 'code', 'city', 'county', 'state'
      ];
      
      const valuableFields = [
        ...requiredFields,
        'description', 'boundaries', 'medianHomeValue', 'avgHomeValue',
        'avgYearBuilt', 'totalProperties', 'schoolRating', 'crimeRate'
      ];
      
      let completenessTotal = 0;
      let missingFields: Record<string, number> = {};
      
      neighborhoodData.forEach(neighborhood => {
        let entityCompleteness = 0;
        let fieldsPresent = 0;
        
        valuableFields.forEach(field => {
          if (neighborhood[field] !== null && neighborhood[field] !== undefined && neighborhood[field] !== '') {
            fieldsPresent++;
          } else {
            missingFields[field] = (missingFields[field] || 0) + 1;
          }
        });
        
        entityCompleteness = (fieldsPresent / valuableFields.length) * 100;
        completenessTotal += entityCompleteness;
      });
      
      // Calculate overall completeness score
      const completenessScore = neighborhoodData.length > 0 ? 
        completenessTotal / neighborhoodData.length : 0;
      
      metrics[0].score = Math.round(completenessScore);
      
      // Generate recommendations for completeness
      Object.entries(missingFields)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5) // Top 5 missing fields
        .forEach(([field, count]) => {
          const percentage = Math.round((count / neighborhoodData.length) * 100);
          metrics[0].recommendations.push(
            `Add ${field} data (missing in ${percentage}% of neighborhoods)`
          );
        });
      
      // Calculate accuracy metric based on validation results
      const errorRate = neighborhoodData.length > 0 ? 
        (validationReport.invalidEntities / neighborhoodData.length) : 0;
      
      metrics[1].score = Math.round(100 - (errorRate * 100));
      
      // Generate recommendations for accuracy issues
      const errorCounts: Record<string, { count: number, message: string }> = {};
      
      validationReport.summaries.forEach(summary => {
        summary.results.forEach(result => {
          if (!result.valid) {
            const key = `${result.field}:${result.message}`;
            if (!errorCounts[key]) {
              errorCounts[key] = { count: 0, message: result.message || 'Unknown error' };
            }
            errorCounts[key].count++;
          }
        });
      });
      
      Object.entries(errorCounts)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 5) // Top 5 error types
        .forEach(([field, { count, message }]) => {
          const percentage = Math.round((count / neighborhoodData.length) * 100);
          const fieldName = field.split(':')[0];
          metrics[1].recommendations.push(
            `Fix ${fieldName} data: ${message} (affects ${percentage}% of neighborhoods)`
          );
        });
      
      // Calculate boundary quality metric
      let boundaryQualityTotal = 0;
      let missingBoundaries = 0;
      
      neighborhoodData.forEach(neighborhood => {
        if (neighborhood.boundaries) {
          // Calculate a quality score for the boundary
          // For now, we'll use a simple scoring system
          let boundaryScore = 75; // Base score for having boundaries
          
          // Use a simple test of complexity - more complex boundaries are generally better
          try {
            const boundaries = typeof neighborhood.boundaries === 'string' 
              ? JSON.parse(neighborhood.boundaries) 
              : neighborhood.boundaries;
            
            if (boundaries.type === 'Polygon') {
              const coordinates = boundaries.coordinates || [];
              if (coordinates.length > 0 && coordinates[0].length > 0) {
                // Add points for more complex polygons (more vertices)
                const vertices = coordinates[0].length;
                boundaryScore += Math.min(vertices / 2, 25); // Up to 25 points for vertices
              }
            } else if (boundaries.type === 'MultiPolygon') {
              const polygons = boundaries.coordinates || [];
              if (polygons.length > 0) {
                // Add points for having multiple polygons
                boundaryScore += Math.min(polygons.length * 5, 15); // Up to 15 points for multiple polygons
                
                // Add points for complexity of first polygon
                if (polygons[0].length > 0 && polygons[0][0].length > 0) {
                  const vertices = polygons[0][0].length;
                  boundaryScore += Math.min(vertices / 3, 10); // Up to 10 points for vertices
                }
              }
            }
            
            // Cap at 100
            boundaryScore = Math.min(boundaryScore, 100);
          } catch (e) {
            boundaryScore = 50; // Penalty for invalid GeoJSON
          }
          
          boundaryQualityTotal += boundaryScore;
        } else {
          missingBoundaries++;
          boundaryQualityTotal += 0; // No score for missing boundaries
        }
      });
      
      const boundaryQualityScore = neighborhoodData.length > 0 ? 
        boundaryQualityTotal / neighborhoodData.length : 0;
      
      metrics[2].score = Math.round(boundaryQualityScore);
      
      if (missingBoundaries > 0) {
        metrics[2].recommendations.push(
          `Add boundary definitions for ${missingBoundaries} neighborhoods`
        );
      }
      
      if (boundaryQualityScore < 70) {
        metrics[2].recommendations.push(
          'Improve boundary definitions with more precise delineation'
        );
      }
      
      // Calculate statistical validity metric
      let statValidityTotal = 0;
      let neighborsWithStats = 0;
      
      const statFields = [
        'medianHomeValue', 'avgHomeValue', 'avgYearBuilt', 
        'totalProperties', 'totalSales', 'avgSalePrice'
      ];
      
      neighborhoodData.forEach(neighborhood => {
        let hasStats = false;
        let statScore = 0;
        let fieldsPresent = 0;
        
        statFields.forEach(field => {
          if (neighborhood[field] !== null && neighborhood[field] !== undefined) {
            fieldsPresent++;
            hasStats = true;
          }
        });
        
        if (hasStats) {
          neighborsWithStats++;
          statScore = (fieldsPresent / statFields.length) * 100;
        }
        
        statValidityTotal += statScore;
      });
      
      const statValidityScore = neighborhoodData.length > 0 ? 
        statValidityTotal / neighborhoodData.length : 0;
      
      metrics[3].score = Math.round(statValidityScore);
      
      if (statValidityScore < 60) {
        metrics[3].recommendations.push(
          'Update neighborhood statistics to improve analytical capabilities'
        );
      }
      
      if (neighborsWithStats < neighborhoodData.length) {
        metrics[3].recommendations.push(
          `Add statistical data for ${neighborhoodData.length - neighborsWithStats} neighborhoods`
        );
      }
      
      // Calculate overall score based on weighted metrics
      let weightedScoreSum = 0;
      let weightSum = 0;
      
      metrics.forEach(metric => {
        weightedScoreSum += metric.score * metric.importance;
        weightSum += metric.importance;
      });
      
      const overallScore = weightSum > 0 ? weightedScoreSum / weightSum : 0;
      
      // Compile critical issues
      const criticalIssues: string[] = [];
      
      // Completeness issues
      if (metrics[0].score < 50) {
        criticalIssues.push('Significant neighborhood data completeness issues require addressing');
      }
      
      // Accuracy issues
      if (metrics[1].score < 60) {
        criticalIssues.push('Neighborhood data accuracy issues need to be fixed');
      }
      
      // Boundary issues
      if (metrics[2].score < 50) {
        criticalIssues.push('Neighborhood boundary data is inadequate for spatial analysis');
      }
      
      // Add specific critical issues from validation
      const criticalValidationIssues = validationReport.summaries
        .flatMap(summary => 
          summary.results
            .filter(result => !result.valid && result.severity === 'critical')
            .map(result => `${result.field}: ${result.message}`)
        )
        .filter((value, index, self) => self.indexOf(value) === index) // Get unique issues
        .slice(0, 5); // Top 5 critical issues
      
      criticalIssues.push(...criticalValidationIssues);
      
      // Compile overall recommendations
      const recommendations: string[] = [
        ...new Set(
          metrics
            .flatMap(metric => metric.recommendations)
            .sort((a, b) => b.length - a.length)
            .slice(0, 8) // Limit to top 8 recommendations
        )
      ];
      
      return {
        timestamp: new Date(),
        entityType: 'neighborhoods',
        entityCount: neighborhoodData.length,
        overallScore: this.getQualityLevel(Math.round(overallScore)),
        metrics,
        criticalIssues,
        recommendations,
        validationReport
      };
    } catch (error) {
      console.error('Error generating neighborhood data quality report:', error);
      throw error;
    }
  }
  
  /**
   * Generate a consolidated data quality dashboard for all entity types
   */
  async generateDataQualityDashboard() {
    try {
      // Generate reports for each entity type
      const propertyReport = await this.generatePropertyDataQualityReport();
      const salesReport = await this.generatePropertySalesDataQualityReport();
      const neighborhoodReport = await this.generateNeighborhoodDataQualityReport();
      
      // Compile an overall system quality score
      const reports = [propertyReport, salesReport, neighborhoodReport];
      const overallScore = Math.round(
        reports.reduce((sum, report) => sum + report.overallScore.score, 0) / reports.length
      );
      
      // Compile critical issues across all reports
      const allCriticalIssues = reports.flatMap(report => 
        report.criticalIssues.map(issue => `[${report.entityType}] ${issue}`)
      );
      
      // Compile top recommendations across all reports
      const allRecommendations = reports.flatMap(report => 
        report.recommendations.map(rec => `[${report.entityType}] ${rec}`)
      );
      
      // Return the dashboard
      return {
        timestamp: new Date(),
        systemQuality: this.getQualityLevel(overallScore),
        entityReports: {
          properties: propertyReport,
          propertySales: salesReport,
          neighborhoods: neighborhoodReport
        },
        criticalIssues: allCriticalIssues,
        recommendations: allRecommendations.slice(0, 10) // Top 10 overall recommendations
      };
    } catch (error) {
      console.error('Error generating data quality dashboard:', error);
      throw error;
    }
  }
}

export const dataQualityService = new DataQualityService();