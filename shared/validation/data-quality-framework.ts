/**
 * Data Quality Framework
 * 
 * Implements IAAO (International Association of Assessing Officers) standards for
 * property data quality assessment. Provides a comprehensive framework for validating
 * property characteristics, sales data, and location information.
 */

import { OptimizedLogger } from '../../server/services/optimized-logging';

const logger = OptimizedLogger.getInstance();

// Types of data that can be validated
export enum DataCategory {
  PROPERTY = 'property',
  SALE = 'sale',
  NEIGHBORHOOD = 'neighborhood',
  MARKET = 'market'
}

// Severity levels for data quality issues
export enum SeverityLevel {
  INFO = 'info',         // Informational only
  WARNING = 'warning',   // May affect accuracy
  ERROR = 'error',       // Definitely affects accuracy
  CRITICAL = 'critical'  // Makes data unusable
}

// Types of validation rules
export enum RuleType {
  REQUIRED = 'required',              // Field must be present
  TYPE = 'type',                      // Field must be of correct type
  RANGE = 'range',                    // Value must be within range
  PATTERN = 'pattern',                // Value must match pattern
  RELATIONSHIP = 'relationship',      // Relationship between fields
  HISTORICAL = 'historical',          // Comparison with historical data
  STATISTICAL = 'statistical',        // Statistical validation
  GEOSPATIAL = 'geospatial'           // Spatial data validation
}

// Data Quality Issue
export interface DataQualityIssue {
  id: string;                // Unique identifier
  category: DataCategory;    // Category of data
  field: string;             // Field name with issue
  ruleType: RuleType;        // Type of rule that failed
  severity: SeverityLevel;   // Severity of the issue
  message: string;           // Human-readable description
  recordId?: number | string; // ID of the affected record
  value?: any;               // Value that failed validation
  expectedValue?: any;       // Expected value or pattern
  timestamp: number;         // When issue was detected
  remediation?: string;      // Suggested fix
}

// Data Quality Score (0-100)
export interface QualityScore {
  category: DataCategory;
  score: number;             // 0-100 score
  issueCount: number;        // Number of issues
  criticalCount: number;     // Number of critical issues
  lastUpdated: number;       // Timestamp
}

// Validation Rule Definition
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: DataCategory;
  ruleType: RuleType;
  severity: SeverityLevel;
  fields: string[];
  validate: (data: any, context?: any) => boolean;
  getMessage: (data: any, context?: any) => string;
  getSuggestion?: (data: any, context?: any) => string;
  getExpectedValue?: (data: any, context?: any) => any;
}

// Data Quality Report
export interface DataQualityReport {
  timestamp: number;
  scores: {
    overall: number;
    byCategory: QualityScore[];
  };
  issues: DataQualityIssue[];
  stats: {
    recordsProcessed: number;
    issuesBySeverity: Record<SeverityLevel, number>;
    issuesByCategory: Record<DataCategory, number>;
    issuesByRule: Record<string, number>;
  };
}

/**
 * Main Data Quality Service
 */
export class DataQualityFramework {
  private static instance: DataQualityFramework;
  private rules: Map<string, ValidationRule> = new Map();
  private latestReport: DataQualityReport | null = null;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DataQualityFramework {
    if (!DataQualityFramework.instance) {
      DataQualityFramework.instance = new DataQualityFramework();
    }
    return DataQualityFramework.instance;
  }
  
  /**
   * Register a validation rule
   */
  public registerRule(rule: ValidationRule): void {
    if (this.rules.has(rule.id)) {
      logger.warn(`Validation rule with ID ${rule.id} already exists. Overwriting.`);
    }
    this.rules.set(rule.id, rule);
    logger.debug(`Registered validation rule: ${rule.id}`);
  }
  
  /**
   * Register multiple validation rules
   */
  public registerRules(rules: ValidationRule[]): void {
    rules.forEach(rule => this.registerRule(rule));
  }
  
  /**
   * Get all registered rules
   */
  public getAllRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }
  
  /**
   * Get rules by category
   */
  public getRulesByCategory(category: DataCategory): ValidationRule[] {
    return this.getAllRules().filter(rule => rule.category === category);
  }
  
  /**
   * Validate a single data record
   */
  public validateRecord(
    data: any,
    category: DataCategory,
    recordId?: number | string,
    context?: any
  ): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // Get rules for this category
    const rules = this.getRulesByCategory(category);
    
    // Apply each rule
    rules.forEach(rule => {
      try {
        const isValid = rule.validate(data, context);
        
        if (!isValid) {
          const issue: DataQualityIssue = {
            id: `${rule.id}_${recordId || Date.now()}`,
            category,
            field: rule.fields.join(', '),
            ruleType: rule.ruleType,
            severity: rule.severity,
            message: rule.getMessage(data, context),
            recordId,
            value: rule.fields.length === 1 ? data[rule.fields[0]] : undefined,
            timestamp: Date.now()
          };
          
          // Add remediation if available
          if (rule.getSuggestion) {
            issue.remediation = rule.getSuggestion(data, context);
          }
          
          // Add expected value if available
          if (rule.getExpectedValue) {
            issue.expectedValue = rule.getExpectedValue(data, context);
          }
          
          issues.push(issue);
        }
      } catch (error) {
        logger.error(`Error applying rule ${rule.id}: ${error}`);
      }
    });
    
    return issues;
  }
  
  /**
   * Validate multiple records
   */
  public validateRecords(
    records: any[],
    category: DataCategory,
    getRecordId?: (record: any) => number | string,
    context?: any
  ): DataQualityIssue[] {
    let allIssues: DataQualityIssue[] = [];
    
    records.forEach(record => {
      const recordId = getRecordId ? getRecordId(record) : undefined;
      const issues = this.validateRecord(record, category, recordId, context);
      allIssues = [...allIssues, ...issues];
    });
    
    return allIssues;
  }
  
  /**
   * Calculate quality score for a set of issues
   */
  private calculateQualityScore(
    issuesByCategory: Record<DataCategory, DataQualityIssue[]>,
    totalRecordsByCategory: Record<DataCategory, number>
  ): {
    overall: number;
    byCategory: QualityScore[];
  } {
    const scores: QualityScore[] = [];
    let totalScore = 0;
    let totalWeight = 0;
    
    // Define weights for each category
    const categoryWeights: Record<DataCategory, number> = {
      [DataCategory.PROPERTY]: 0.4,
      [DataCategory.SALE]: 0.3,
      [DataCategory.NEIGHBORHOOD]: 0.2,
      [DataCategory.MARKET]: 0.1
    };
    
    // Calculate score for each category
    Object.entries(issuesByCategory).forEach(([category, issues]) => {
      const dataCategory = category as DataCategory;
      const recordCount = totalRecordsByCategory[dataCategory] || 0;
      
      if (recordCount === 0) {
        return; // Skip categories with no records
      }
      
      // Count issues by severity
      const criticalCount = issues.filter(i => i.severity === SeverityLevel.CRITICAL).length;
      const errorCount = issues.filter(i => i.severity === SeverityLevel.ERROR).length;
      const warningCount = issues.filter(i => i.severity === SeverityLevel.WARNING).length;
      const infoCount = issues.filter(i => i.severity === SeverityLevel.INFO).length;
      
      // Calculate penalty points (0-100)
      const criticalPenalty = Math.min(50, criticalCount * 10);
      const errorPenalty = Math.min(30, errorCount * 3);
      const warningPenalty = Math.min(15, warningCount * 0.5);
      const infoPenalty = Math.min(5, infoCount * 0.1);
      
      // Calculate record penalty
      const recordPenalty = recordCount > 0 
        ? Math.min(30, ((criticalCount + errorCount) / recordCount) * 100)
        : 0;
      
      // Calculate final score (0-100)
      const totalPenalty = criticalPenalty + errorPenalty + warningPenalty + infoPenalty + recordPenalty;
      const categoryScore = Math.max(0, 100 - totalPenalty);
      
      // Add to scores list
      scores.push({
        category: dataCategory,
        score: categoryScore,
        issueCount: issues.length,
        criticalCount,
        lastUpdated: Date.now()
      });
      
      // Add to weighted average
      totalScore += categoryScore * categoryWeights[dataCategory];
      totalWeight += categoryWeights[dataCategory];
    });
    
    // Calculate overall score
    const overall = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    return {
      overall,
      byCategory: scores
    };
  }
  
  /**
   * Generate a data quality report
   */
  public generateReport(
    issues: DataQualityIssue[],
    totalRecordsByCategory: Record<DataCategory, number>
  ): DataQualityReport {
    // Group issues by category
    const issuesByCategory: Record<DataCategory, DataQualityIssue[]> = {
      [DataCategory.PROPERTY]: [],
      [DataCategory.SALE]: [],
      [DataCategory.NEIGHBORHOOD]: [],
      [DataCategory.MARKET]: []
    };
    
    issues.forEach(issue => {
      if (!issuesByCategory[issue.category]) {
        issuesByCategory[issue.category] = [];
      }
      issuesByCategory[issue.category].push(issue);
    });
    
    // Count issues by severity
    const issuesBySeverity: Record<SeverityLevel, number> = {
      [SeverityLevel.INFO]: 0,
      [SeverityLevel.WARNING]: 0,
      [SeverityLevel.ERROR]: 0,
      [SeverityLevel.CRITICAL]: 0
    };
    
    issues.forEach(issue => {
      issuesBySeverity[issue.severity]++;
    });
    
    // Count issues by category
    const issueCountByCategory: Record<DataCategory, number> = {
      [DataCategory.PROPERTY]: issuesByCategory[DataCategory.PROPERTY].length,
      [DataCategory.SALE]: issuesByCategory[DataCategory.SALE].length,
      [DataCategory.NEIGHBORHOOD]: issuesByCategory[DataCategory.NEIGHBORHOOD].length,
      [DataCategory.MARKET]: issuesByCategory[DataCategory.MARKET].length
    };
    
    // Count issues by rule
    const issuesByRule: Record<string, number> = {};
    issues.forEach(issue => {
      const ruleId = issue.id.split('_')[0]; // Extract rule ID from issue ID
      issuesByRule[ruleId] = (issuesByRule[ruleId] || 0) + 1;
    });
    
    // Calculate quality scores
    const scores = this.calculateQualityScore(issuesByCategory, totalRecordsByCategory);
    
    // Total records processed
    const recordsProcessed = Object.values(totalRecordsByCategory).reduce((a, b) => a + b, 0);
    
    // Create report
    const report: DataQualityReport = {
      timestamp: Date.now(),
      scores,
      issues,
      stats: {
        recordsProcessed,
        issuesBySeverity,
        issuesByCategory: issueCountByCategory,
        issuesByRule
      }
    };
    
    // Store latest report
    this.latestReport = report;
    
    return report;
  }
  
  /**
   * Get the most recent report
   */
  public getLatestReport(): DataQualityReport | null {
    return this.latestReport;
  }
}