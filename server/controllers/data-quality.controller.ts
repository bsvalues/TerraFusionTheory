/**
 * Data Quality Controller
 * 
 * Provides endpoints for data quality assessment, reporting, and remediation.
 * Implements IAAO (International Association of Assessing Officers) standards
 * for property data validation and quality measurement.
 */

import { Request, Response } from 'express';
import { OptimizedLogger } from '../services/optimized-logging';
import { 
  DataQualityFramework, 
  DataCategory, 
  SeverityLevel,
  DataQualityIssue,
  DataQualityReport
} from '../../shared/validation/data-quality-framework';
import { initializeIAAORules } from '../../shared/validation/iaao-validation-rules';
import { db } from '../db';
import { properties, propertySales as sales, neighborhoods } from '@shared/schema';
import { eq } from 'drizzle-orm';

const logger = OptimizedLogger.getInstance();

// Initialize the quality framework
const framework = DataQualityFramework.getInstance();
let isInitialized = false;

/**
 * Initialize the data quality module
 */
export async function initializeDataQuality(): Promise<boolean> {
  try {
    if (!isInitialized) {
      // Register IAAO validation rules
      initializeIAAORules();
      isInitialized = true;
      logger.info('Data quality module initialized with IAAO rules');
    }
    return true;
  } catch (error: any) {
    logger.error(`Failed to initialize data quality module: ${error.message}`);
    return false;
  }
}

/**
 * Get data quality report
 */
export async function getDataQualityReport(req: Request, res: Response): Promise<void> {
  try {
    if (!isInitialized) {
      await initializeDataQuality();
    }
    
    // Get latest report if available
    const latestReport = framework.getLatestReport();
    
    // If no report or report is older than 1 hour, generate a new one
    if (!latestReport || Date.now() - latestReport.timestamp > 3600000) {
      const newReport = await generateQualityReport();
      res.json({
        status: 'success',
        report: newReport,
        freshReport: true
      });
    } else {
      res.json({
        status: 'success',
        report: latestReport,
        freshReport: false
      });
    }
  } catch (error: any) {
    logger.error(`Error getting data quality report: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get data quality report',
      error: error.message
    });
  }
}

/**
 * Generate a full data quality report
 */
async function generateQualityReport(): Promise<DataQualityReport> {
  logger.info('Generating new data quality report');
  
  // Get all issues
  const propertyIssues = await validateProperties();
  const saleIssues = await validateSales();
  const neighborhoodIssues = await validateNeighborhoods();
  
  // Count records by category
  let propertyCount = 0;
  let saleCount = 0;
  let neighborhoodCount = 0;
  
  try {
    // Get record counts
    const propertyResult = await db.select().from(properties);
    const saleResult = await db.select().from(sales);
    const neighborhoodResult = await db.select().from(neighborhoods);
    
    propertyCount = propertyResult.length;
    saleCount = saleResult.length;
    neighborhoodCount = neighborhoodResult.length;
  } catch (error) {
    logger.error('Error counting records for quality report');
  }
  
  // Combine all issues
  const allIssues = [
    ...propertyIssues,
    ...saleIssues,
    ...neighborhoodIssues
  ];
  
  // Record counts by category
  const recordsByCategory: Record<DataCategory, number> = {
    [DataCategory.PROPERTY]: propertyCount,
    [DataCategory.SALE]: saleCount,
    [DataCategory.NEIGHBORHOOD]: neighborhoodCount,
    [DataCategory.MARKET]: 1 // Always at least one market analysis
  };
  
  // Generate report
  const report = framework.generateReport(allIssues, recordsByCategory);
  
  logger.info(`Generated quality report with ${allIssues.length} issues`);
  return report;
}

/**
 * Validate all properties
 */
async function validateProperties(): Promise<DataQualityIssue[]> {
  try {
    // Get properties from database
    const propertyData = await db.select().from(properties);
    
    // Validate properties
    const issues = framework.validateRecords(
      propertyData,
      DataCategory.PROPERTY,
      (record) => record.id
    );
    
    logger.info(`Validated ${propertyData.length} properties, found ${issues.length} issues`);
    return issues;
  } catch (error: any) {
    logger.error(`Error validating properties: ${error.message}`);
    return [];
  }
}

/**
 * Validate all sales
 */
async function validateSales(): Promise<DataQualityIssue[]> {
  try {
    // Get sales from database
    const salesData = await db.select().from(sales);
    
    // Validate sales
    const issues = framework.validateRecords(
      salesData,
      DataCategory.SALE,
      (record) => record.id
    );
    
    logger.info(`Validated ${salesData.length} sales, found ${issues.length} issues`);
    return issues;
  } catch (error: any) {
    logger.error(`Error validating sales: ${error.message}`);
    return [];
  }
}

/**
 * Validate all neighborhoods
 */
async function validateNeighborhoods(): Promise<DataQualityIssue[]> {
  try {
    // Get neighborhoods from database
    const neighborhoodData = await db.select().from(neighborhoods);
    
    // Validate neighborhoods
    const issues = framework.validateRecords(
      neighborhoodData,
      DataCategory.NEIGHBORHOOD,
      (record) => record.id
    );
    
    logger.info(`Validated ${neighborhoodData.length} neighborhoods, found ${issues.length} issues`);
    return issues;
  } catch (error: any) {
    logger.error(`Error validating neighborhoods: ${error.message}`);
    return [];
  }
}

/**
 * Validate a single property
 */
export async function validateProperty(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        status: 'error',
        message: 'Property ID is required'
      });
      return;
    }
    
    // Get property from database
    const [property] = await db.select().from(properties).where(eq(properties.id, parseInt(id)));
    
    if (!property) {
      res.status(404).json({
        status: 'error',
        message: `Property with ID ${id} not found`
      });
      return;
    }
    
    // Validate property
    const issues = framework.validateRecord(
      property,
      DataCategory.PROPERTY,
      property.id
    );
    
    res.json({
      status: 'success',
      property,
      issues,
      issueCount: issues.length
    });
  } catch (error: any) {
    logger.error(`Error validating property: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to validate property',
      error: error.message
    });
  }
}

/**
 * Validate a single sale
 */
export async function validateSale(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        status: 'error',
        message: 'Sale ID is required'
      });
      return;
    }
    
    // Get sale from database
    const [sale] = await db.select().from(sales).where(eq(sales.id, parseInt(id)));
    
    if (!sale) {
      res.status(404).json({
        status: 'error',
        message: `Sale with ID ${id} not found`
      });
      return;
    }
    
    // Validate sale
    const issues = framework.validateRecord(
      sale,
      DataCategory.SALE,
      sale.id
    );
    
    res.json({
      status: 'success',
      sale,
      issues,
      issueCount: issues.length
    });
  } catch (error: any) {
    logger.error(`Error validating sale: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to validate sale',
      error: error.message
    });
  }
}

/**
 * Get quality issues for a specific category
 */
export async function getQualityIssues(req: Request, res: Response): Promise<void> {
  try {
    const { category, severity } = req.query;
    
    // Get latest report
    const latestReport = framework.getLatestReport();
    
    if (!latestReport) {
      // Generate a new report if none exists
      const newReport = await generateQualityReport();
      
      filterAndReturnIssues(newReport, res, category as string, severity as string);
      return;
    }
    
    filterAndReturnIssues(latestReport, res, category as string, severity as string);
  } catch (error: any) {
    logger.error(`Error getting quality issues: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get quality issues',
      error: error.message
    });
  }
}

/**
 * Filter issues and return them
 */
function filterAndReturnIssues(
  report: DataQualityReport,
  res: Response,
  category?: string | undefined,
  severity?: string | undefined
): void {
  let filteredIssues = [...report.issues];
  
  // Filter by category if specified
  if (category && Object.values(DataCategory).includes(category as DataCategory)) {
    filteredIssues = filteredIssues.filter(
      issue => issue.category === category
    );
  }
  
  // Filter by severity if specified
  if (severity && Object.values(SeverityLevel).includes(severity as SeverityLevel)) {
    filteredIssues = filteredIssues.filter(
      issue => issue.severity === severity
    );
  }
  
  res.json({
    status: 'success',
    issues: filteredIssues,
    totalIssues: report.issues.length,
    filteredCount: filteredIssues.length,
    filters: {
      category,
      severity
    }
  });
}

/**
 * Get quality statistics
 */
export async function getQualityStats(req: Request, res: Response): Promise<void> {
  try {
    // Get latest report or generate new one
    const latestReport = framework.getLatestReport();
    
    if (!latestReport) {
      // Generate a new report if none exists
      const newReport = await generateQualityReport();
      
      res.json({
        status: 'success',
        stats: newReport.stats,
        scores: newReport.scores,
        freshReport: true
      });
      return;
    }
    
    res.json({
      status: 'success',
      stats: latestReport.stats,
      scores: latestReport.scores,
      freshReport: false
    });
  } catch (error: any) {
    logger.error(`Error getting quality stats: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get quality statistics',
      error: error.message
    });
  }
}

/**
 * Force regeneration of quality report
 */
export async function regenerateQualityReport(req: Request, res: Response): Promise<void> {
  try {
    const newReport = await generateQualityReport();
    
    res.json({
      status: 'success',
      report: newReport
    });
  } catch (error: any) {
    logger.error(`Error regenerating quality report: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to regenerate quality report',
      error: error.message
    });
  }
}