/**
 * Data Quality Controller
 * 
 * Implements API endpoints for assessing and reporting on data quality
 * based on IAAO standards and industry best practices.
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { storage } from '../storage';
import { properties, propertySales as sales, neighborhoods } from '../../shared/schema';
import { 
  ValidationEngine, 
  ValidationScope, 
  ValidationCategory,
  ValidationSeverity,
  ValidationIssue,
  DataQualityReport,
  DataQualityMetrics,
  validationEngine
} from '../../shared/validation/data-quality-framework';
import { OptimizedLogger } from '../services/optimized-logging';
import { LogCategory } from '../../shared/schema';

// Create logger for the data quality controller
const logger = OptimizedLogger.getInstance();

/**
 * Get a data quality report
 */
export async function getDataQualityReport(req: Request, res: Response) {
  try {
    logger.info('Generating data quality report', LogCategory.API);
    
    // Get data for validation
    const [propertiesData, salesData, neighborhoodsData] = await Promise.all([
      fetchProperties(),
      fetchSales(),
      fetchNeighborhoods()
    ]);
    
    // Validate the data
    const propertyResults = validationEngine.validateEntities(
      propertiesData, 
      ValidationScope.PROPERTY,
      'id'
    );
    
    const saleResults = validationEngine.validateEntities(
      salesData,
      ValidationScope.SALE,
      'id'
    );
    
    const neighborhoodResults = validationEngine.validateEntities(
      neighborhoodsData,
      ValidationScope.NEIGHBORHOOD,
      'id'
    );
    
    // Combine all results
    const allResults = [
      ...propertyResults,
      ...saleResults,
      ...neighborhoodResults
    ];
    
    // Generate report
    const report = validationEngine.generateReport(allResults, {
      properties: propertiesData.length,
      sales: salesData.length,
      neighborhoods: neighborhoodsData.length
    });
    
    // Format the response
    const formattedReport = formatReportForResponse(report);
    
    // Return the report
    res.json(formattedReport);
    logger.info('Data quality report generated successfully', LogCategory.API);
  } catch (error) {
    logger.error(`Error generating data quality report: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      LogCategory.API, 
      { error }
    );
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate data quality report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get data quality metrics only
 */
export async function getDataQualityMetrics(req: Request, res: Response) {
  try {
    logger.info('Retrieving data quality metrics', LogCategory.API);
    
    // Get data for validation
    const [propertiesData, salesData, neighborhoodsData] = await Promise.all([
      fetchProperties(),
      fetchSales(),
      fetchNeighborhoods()
    ]);
    
    // Validate the data
    const propertyResults = validationEngine.validateEntities(
      propertiesData, 
      ValidationScope.PROPERTY,
      'id'
    );
    
    const saleResults = validationEngine.validateEntities(
      salesData,
      ValidationScope.SALE,
      'id'
    );
    
    const neighborhoodResults = validationEngine.validateEntities(
      neighborhoodsData,
      ValidationScope.NEIGHBORHOOD,
      'id'
    );
    
    // Combine all results
    const allResults = [
      ...propertyResults,
      ...saleResults,
      ...neighborhoodResults
    ];
    
    // Calculate metrics
    const metrics = validationEngine.calculateQualityMetrics(allResults, {
      properties: propertiesData.length,
      sales: salesData.length,
      neighborhoods: neighborhoodsData.length
    });
    
    // Return the metrics
    res.json({
      status: 'success',
      metrics,
      timestamp: new Date()
    });
    logger.info('Data quality metrics retrieved successfully', LogCategory.API);
  } catch (error) {
    logger.error(`Error retrieving data quality metrics: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      LogCategory.API, 
      { error }
    );
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve data quality metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get issues by scope
 */
export async function getIssuesByScope(req: Request, res: Response) {
  try {
    const scope = req.params.scope;
    
    // Validate scope parameter
    if (!Object.values(ValidationScope).includes(scope as ValidationScope)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid scope: ${scope}. Must be one of: ${Object.values(ValidationScope).join(', ')}`
      });
    }
    
    logger.info(`Retrieving data quality issues for scope: ${scope}`, LogCategory.API);
    
    // Get data for the specific scope
    let data: any[] = [];
    switch (scope) {
      case ValidationScope.PROPERTY:
        data = await fetchProperties();
        break;
      case ValidationScope.SALE:
        data = await fetchSales();
        break;
      case ValidationScope.NEIGHBORHOOD:
        data = await fetchNeighborhoods();
        break;
    }
    
    // Validate the data
    const results = validationEngine.validateEntities(
      data,
      scope as ValidationScope,
      'id'
    );
    
    // Extract all issues
    const issues = results.flatMap(r => r.issues);
    
    // Return the issues
    res.json({
      status: 'success',
      scope,
      count: issues.length,
      issues,
      timestamp: new Date()
    });
    logger.info(`Retrieved ${issues.length} issues for scope: ${scope}`, LogCategory.API);
  } catch (error) {
    logger.error(`Error retrieving issues by scope: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      LogCategory.API, 
      { error }
    );
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve issues by scope',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get validation rules
 */
export async function getValidationRules(req: Request, res: Response) {
  try {
    logger.info('Retrieving validation rules', LogCategory.API);
    
    // Get all rules from the validation engine
    const rules = validationEngine.getRules();
    
    // Return the rules
    res.json({
      status: 'success',
      count: rules.length,
      rules,
      timestamp: new Date()
    });
    logger.info(`Retrieved ${rules.length} validation rules`, LogCategory.API);
  } catch (error) {
    logger.error(`Error retrieving validation rules: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      LogCategory.API, 
      { error }
    );
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve validation rules',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Fetch properties from the database
 */
async function fetchProperties(): Promise<any[]> {
  try {
    // Return properties from the database
    return await db.select().from(properties);
  } catch (error) {
    logger.error(`Error fetching properties: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      LogCategory.DATABASE
    );
    throw error;
  }
}

/**
 * Fetch sales from the database
 */
async function fetchSales(): Promise<any[]> {
  try {
    // Return sales from the database
    return await db.select().from(sales);
  } catch (error) {
    logger.error(`Error fetching sales: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      LogCategory.DATABASE
    );
    throw error;
  }
}

/**
 * Fetch neighborhoods from the database
 */
async function fetchNeighborhoods(): Promise<any[]> {
  try {
    // Return neighborhoods from the database
    return await db.select().from(neighborhoods);
  } catch (error) {
    logger.error(`Error fetching neighborhoods: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      LogCategory.DATABASE
    );
    throw error;
  }
}

/**
 * Format data quality report for API response
 */
function formatReportForResponse(report: DataQualityReport): any {
  // Extract issues by scope and severity
  const propertyIssues = report.issues.filter(i => i.scope === ValidationScope.PROPERTY)
    .map(formatIssue);
  
  const neighborhoodIssues = report.issues.filter(i => i.scope === ValidationScope.NEIGHBORHOOD)
    .map(formatIssue);
  
  const salesIssues = report.issues.filter(i => i.scope === ValidationScope.SALE)
    .map(formatIssue);
  
  // Count issues by severity
  const criticalIssues = report.issues.filter(i => i.severity === ValidationSeverity.CRITICAL).length;
  const majorIssues = report.issues.filter(i => i.severity === ValidationSeverity.MAJOR).length;
  const minorIssues = report.issues.filter(i => i.severity === ValidationSeverity.MINOR).length;
  
  // Format response
  return {
    overallScore: report.metrics.overallScore,
    propertiesScore: report.metrics.propertiesScore,
    neighborhoodsScore: report.metrics.neighborhoodsScore,
    salesScore: report.metrics.salesScore,
    timestamp: report.timestamp.toISOString(),
    totals: {
      properties: report.metrics.totalProperties,
      neighborhoods: report.metrics.totalNeighborhoods,
      sales: report.metrics.totalSales
    },
    issues: {
      critical: criticalIssues,
      major: majorIssues,
      minor: minorIssues
    },
    propertyIssues,
    neighborhoodIssues,
    salesIssues,
    validationRules: {
      passed: report.metrics.rulesPassed,
      failed: report.metrics.rulesFailed,
      total: report.metrics.totalRules
    },
    completenessMetrics: {
      properties: calculateCompletenessMetrics(report.metrics, ValidationScope.PROPERTY),
      neighborhoods: calculateCompletenessMetrics(report.metrics, ValidationScope.NEIGHBORHOOD),
      sales: calculateCompletenessMetrics(report.metrics, ValidationScope.SALE)
    }
  };
}

/**
 * Format a validation issue for API response
 */
function formatIssue(issue: ValidationIssue): any {
  return {
    id: issue.entityId,
    field: issue.field,
    issue: issue.message,
    severity: issue.severity,
    suggestedFix: issue.suggestedFix
  };
}

/**
 * Calculate completeness metrics based on the report metrics
 */
function calculateCompletenessMetrics(metrics: DataQualityMetrics, scope: ValidationScope): any {
  // This would typically be based on actual completeness statistics
  // Here we're making a simplified estimation based on quality scores
  
  let total = 0;
  let score = 0;
  
  switch (scope) {
    case ValidationScope.PROPERTY:
      total = metrics.totalProperties;
      score = metrics.propertiesScore;
      break;
    case ValidationScope.NEIGHBORHOOD:
      total = metrics.totalNeighborhoods;
      score = metrics.neighborhoodsScore;
      break;
    case ValidationScope.SALE:
      total = metrics.totalSales;
      score = metrics.salesScore;
      break;
  }
  
  // Estimate completeness categories based on score
  // This is just an example - real implementation would use more sophisticated logic
  const complete = Math.round(total * (score / 100) * 0.7);
  const partial = Math.round(total * (score / 100) * 0.2);
  const minimal = total - complete - partial;
  
  return {
    complete,
    partial,
    minimal,
    total
  };
}