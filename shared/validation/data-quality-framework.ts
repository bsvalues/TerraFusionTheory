/**
 * Data Quality Framework
 * 
 * This framework provides a robust validation system for property data
 * based on IAAO standards and industry best practices.
 */

import { PropertyType, TransactionType } from '../schema';

/**
 * Validation rule severity level
 */
export enum ValidationSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor'
}

/**
 * Validation rule scope
 */
export enum ValidationScope {
  PROPERTY = 'property',
  SALE = 'sale',
  NEIGHBORHOOD = 'neighborhood'
}

/**
 * Validation rule category
 */
export enum ValidationCategory {
  COMPLETENESS = 'completeness',
  ACCURACY = 'accuracy',
  CONSISTENCY = 'consistency',
  TIMELINESS = 'timeliness',
  UNIQUENESS = 'uniqueness',
  VALIDITY = 'validity'
}

/**
 * Validation result status
 */
export enum ValidationStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped'
}

/**
 * Type for validation rule predicate function
 */
export type ValidationPredicate = (value: any, context?: any) => boolean;

/**
 * Type for validation rule
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  scope: ValidationScope;
  category: ValidationCategory;
  severity: ValidationSeverity;
  predicate: ValidationPredicate;
  applicableFields: string[];
  messageTemplate: string;
  suggestedFixTemplate?: string;
  dependencies?: string[];
  standardReference?: string; // Reference to IAAO/USPAP standard
}

/**
 * Type for validation issue
 */
export interface ValidationIssue {
  ruleId: string;
  entityId: string;
  field: string;
  message: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  scope: ValidationScope;
  suggestedFix?: string;
  data?: any;
}

/**
 * Type for validation result
 */
export interface ValidationResult {
  ruleId: string;
  entityId: string;
  field: string;
  status: ValidationStatus;
  issues: ValidationIssue[];
}

/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
  overallScore: number;
  propertiesScore: number;
  salesScore: number;
  neighborhoodsScore: number;
  completenessScore: number;
  accuracyScore: number;
  consistencyScore: number;
  timelinessScore: number;
  uniquenessScore: number;
  validityScore: number;
  rulesPassed: number;
  rulesFailed: number;
  rulesSkipped: number;
  totalRules: number;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  propertiesWithIssues: number;
  salesWithIssues: number;
  neighborhoodsWithIssues: number;
  totalProperties: number;
  totalSales: number;
  totalNeighborhoods: number;
}

/**
 * Data quality report
 */
export interface DataQualityReport {
  metrics: DataQualityMetrics;
  issues: ValidationIssue[];
  timestamp: Date;
}

/**
 * Validation rule builder - provides a fluent API for creating rules
 */
export class ValidationRuleBuilder {
  private rule: Partial<ValidationRule> = {
    applicableFields: [],
    dependencies: []
  };
  
  /**
   * Create a new rule with ID and name
   */
  static create(id: string, name: string): ValidationRuleBuilder {
    const builder = new ValidationRuleBuilder();
    builder.rule.id = id;
    builder.rule.name = name;
    return builder;
  }
  
  /**
   * Set rule description
   */
  withDescription(description: string): ValidationRuleBuilder {
    this.rule.description = description;
    return this;
  }
  
  /**
   * Set rule scope
   */
  withScope(scope: ValidationScope): ValidationRuleBuilder {
    this.rule.scope = scope;
    return this;
  }
  
  /**
   * Set rule category
   */
  withCategory(category: ValidationCategory): ValidationRuleBuilder {
    this.rule.category = category;
    return this;
  }
  
  /**
   * Set rule severity
   */
  withSeverity(severity: ValidationSeverity): ValidationRuleBuilder {
    this.rule.severity = severity;
    return this;
  }
  
  /**
   * Set the validation predicate function
   */
  withPredicate(predicate: ValidationPredicate): ValidationRuleBuilder {
    this.rule.predicate = predicate;
    return this;
  }
  
  /**
   * Add applicable fields
   */
  withApplicableFields(...fields: string[]): ValidationRuleBuilder {
    this.rule.applicableFields = [...(this.rule.applicableFields || []), ...fields];
    return this;
  }
  
  /**
   * Set error message template
   */
  withMessageTemplate(template: string): ValidationRuleBuilder {
    this.rule.messageTemplate = template;
    return this;
  }
  
  /**
   * Set suggested fix template
   */
  withSuggestedFixTemplate(template: string): ValidationRuleBuilder {
    this.rule.suggestedFixTemplate = template;
    return this;
  }
  
  /**
   * Add dependencies (other fields or rules that this rule depends on)
   */
  withDependencies(...dependencies: string[]): ValidationRuleBuilder {
    this.rule.dependencies = [...(this.rule.dependencies || []), ...dependencies];
    return this;
  }
  
  /**
   * Set standard reference (IAAO or USPAP)
   */
  withStandardReference(reference: string): ValidationRuleBuilder {
    this.rule.standardReference = reference;
    return this;
  }
  
  /**
   * Build and return the rule
   */
  build(): ValidationRule {
    // Verify required fields are present
    const requiredFields = ['id', 'name', 'description', 'scope', 'category', 
                           'severity', 'predicate', 'messageTemplate'];
    
    for (const field of requiredFields) {
      if (!(this.rule as any)[field]) {
        throw new Error(`Validation rule ${this.rule.id} is missing required field: ${field}`);
      }
    }
    
    return this.rule as ValidationRule;
  }
}

/**
 * Validation engine for processing validation rules
 */
export class ValidationEngine {
  private rules: ValidationRule[] = [];
  
  /**
   * Add validation rules to the engine
   */
  addRules(...rules: ValidationRule[]): ValidationEngine {
    this.rules.push(...rules);
    return this;
  }
  
  /**
   * Get all registered rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }
  
  /**
   * Get rules by scope
   */
  getRulesByScope(scope: ValidationScope): ValidationRule[] {
    return this.rules.filter(rule => rule.scope === scope);
  }
  
  /**
   * Get rule by ID
   */
  getRuleById(id: string): ValidationRule | undefined {
    return this.rules.find(rule => rule.id === id);
  }
  
  /**
   * Validate a single entity against all applicable rules
   */
  validateEntity(entity: any, entityId: string, scope: ValidationScope): ValidationResult[] {
    // Get rules applicable to this entity type
    const applicableRules = this.getRulesByScope(scope);
    
    // Apply each rule
    return applicableRules.map(rule => {
      const issues: ValidationIssue[] = [];
      
      // For each applicable field
      for (const field of rule.applicableFields) {
        // Get field value (supports nested paths with dot notation)
        const fieldPath = field.split('.');
        let value = entity;
        
        for (const path of fieldPath) {
          if (value === null || value === undefined) {
            value = undefined;
            break;
          }
          value = value[path];
        }
        
        // Skip if dependencies aren't met
        if (rule.dependencies && rule.dependencies.length > 0) {
          const dependenciesMet = rule.dependencies.every(dep => {
            const depPath = dep.split('.');
            let depValue = entity;
            
            for (const path of depPath) {
              if (depValue === null || depValue === undefined) {
                return false;
              }
              depValue = depValue[path];
            }
            
            return depValue !== null && depValue !== undefined;
          });
          
          if (!dependenciesMet) {
            return {
              ruleId: rule.id,
              entityId,
              field,
              status: ValidationStatus.SKIPPED,
              issues: []
            };
          }
        }
        
        // Apply the rule
        try {
          const contextData = { entity, field, entityId };
          const isValid = rule.predicate(value, contextData);
          
          if (!isValid) {
            // Create message from template
            const message = this.formatTemplate(rule.messageTemplate, {
              field,
              value: value !== undefined ? JSON.stringify(value) : 'undefined',
              entityId
            });
            
            // Create suggested fix from template if available
            let suggestedFix: string | undefined;
            if (rule.suggestedFixTemplate) {
              suggestedFix = this.formatTemplate(rule.suggestedFixTemplate, {
                field,
                value: value !== undefined ? JSON.stringify(value) : 'undefined',
                entityId
              });
            }
            
            // Add issue
            issues.push({
              ruleId: rule.id,
              entityId,
              field,
              message,
              severity: rule.severity,
              category: rule.category,
              scope: rule.scope,
              suggestedFix,
              data: { value }
            });
          }
        } catch (error) {
          // Rule evaluation failed
          console.error(`Error evaluating rule ${rule.id} on field ${field}:`, error);
          
          issues.push({
            ruleId: rule.id,
            entityId,
            field,
            message: `Failed to evaluate rule: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: ValidationSeverity.CRITICAL,
            category: rule.category,
            scope: rule.scope,
            data: { error }
          });
        }
      }
      
      return {
        ruleId: rule.id,
        entityId,
        field: rule.applicableFields.join(', '),
        status: issues.length > 0 ? ValidationStatus.FAILED : ValidationStatus.PASSED,
        issues
      };
    });
  }
  
  /**
   * Validate multiple entities of the same type
   */
  validateEntities(entities: any[], scope: ValidationScope, idField: string = 'id'): ValidationResult[] {
    return entities.flatMap(entity => {
      const entityId = entity[idField]?.toString() || 'unknown';
      return this.validateEntity(entity, entityId, scope);
    });
  }
  
  /**
   * Calculate data quality metrics from validation results
   */
  calculateQualityMetrics(results: ValidationResult[], entityCounts: {
    properties: number;
    sales: number;
    neighborhoods: number;
  }): DataQualityMetrics {
    // Count result statuses
    const passed = results.filter(r => r.status === ValidationStatus.PASSED).length;
    const failed = results.filter(r => r.status === ValidationStatus.FAILED).length;
    const skipped = results.filter(r => r.status === ValidationStatus.SKIPPED).length;
    const total = passed + failed + skipped;
    
    // Extract all issues
    const allIssues = results.flatMap(r => r.issues);
    
    // Count issues by severity
    const criticalIssues = allIssues.filter(i => i.severity === ValidationSeverity.CRITICAL).length;
    const majorIssues = allIssues.filter(i => i.severity === ValidationSeverity.MAJOR).length;
    const minorIssues = allIssues.filter(i => i.severity === ValidationSeverity.MINOR).length;
    
    // Count issues by scope
    const propertyIssues = allIssues.filter(i => i.scope === ValidationScope.PROPERTY);
    const salesIssues = allIssues.filter(i => i.scope === ValidationScope.SALE);
    const neighborhoodIssues = allIssues.filter(i => i.scope === ValidationScope.NEIGHBORHOOD);
    
    // Count entities with issues
    const uniquePropertiesWithIssues = new Set(propertyIssues.map(i => i.entityId)).size;
    const uniqueSalesWithIssues = new Set(salesIssues.map(i => i.entityId)).size;
    const uniqueNeighborhoodsWithIssues = new Set(neighborhoodIssues.map(i => i.entityId)).size;
    
    // Count issues by category
    const issuesByCategory = {
      completeness: allIssues.filter(i => i.category === ValidationCategory.COMPLETENESS).length,
      accuracy: allIssues.filter(i => i.category === ValidationCategory.ACCURACY).length,
      consistency: allIssues.filter(i => i.category === ValidationCategory.CONSISTENCY).length,
      timeliness: allIssues.filter(i => i.category === ValidationCategory.TIMELINESS).length,
      uniqueness: allIssues.filter(i => i.category === ValidationCategory.UNIQUENESS).length,
      validity: allIssues.filter(i => i.category === ValidationCategory.VALIDITY).length
    };
    
    // Calculate scores
    const calculateScore = (issueCount: number, totalCount: number, weight: number = 1): number => {
      if (totalCount === 0) return 100;
      return Math.round(Math.max(0, 100 - (issueCount / totalCount * 100 * weight)));
    };
    
    // Calculate category scores
    const completenessScore = calculateScore(issuesByCategory.completeness, total, 1);
    const accuracyScore = calculateScore(issuesByCategory.accuracy, total, 1.5);
    const consistencyScore = calculateScore(issuesByCategory.consistency, total, 1.25);
    const timelinessScore = calculateScore(issuesByCategory.timeliness, total, 0.75);
    const uniquenessScore = calculateScore(issuesByCategory.uniqueness, total, 1.25);
    const validityScore = calculateScore(issuesByCategory.validity, total, 1);
    
    // Calculate entity type scores with weighted severity
    const severityWeights = {
      [ValidationSeverity.CRITICAL]: 5,
      [ValidationSeverity.MAJOR]: 2,
      [ValidationSeverity.MINOR]: 0.5
    };
    
    const calculateEntityScore = (issues: ValidationIssue[], totalEntities: number): number => {
      if (totalEntities === 0) return 100;
      
      // Group issues by entity ID and calculate weighted issues per entity
      const issuesByEntity = issues.reduce((acc, issue) => {
        if (!acc[issue.entityId]) {
          acc[issue.entityId] = { weight: 0 };
        }
        acc[issue.entityId].weight += severityWeights[issue.severity];
        return acc;
      }, {} as Record<string, { weight: number }>);
      
      // Calculate average weighted issues per entity
      const totalWeight = Object.values(issuesByEntity).reduce((sum, entity) => sum + entity.weight, 0);
      const avgWeight = totalWeight / totalEntities;
      
      // Convert to score (0-100)
      return Math.round(Math.max(0, 100 - avgWeight * 10));
    };
    
    const propertiesScore = calculateEntityScore(propertyIssues, entityCounts.properties);
    const salesScore = calculateEntityScore(salesIssues, entityCounts.sales);
    const neighborhoodsScore = calculateEntityScore(neighborhoodIssues, entityCounts.neighborhoods);
    
    // Calculate overall score (weighted average of all scores)
    const overallScore = Math.round(
      (propertiesScore * 0.4) +
      (salesScore * 0.3) +
      (neighborhoodsScore * 0.3)
    );
    
    return {
      overallScore,
      propertiesScore,
      salesScore,
      neighborhoodsScore,
      completenessScore,
      accuracyScore,
      consistencyScore,
      timelinessScore,
      uniquenessScore,
      validityScore,
      rulesPassed: passed,
      rulesFailed: failed,
      rulesSkipped: skipped,
      totalRules: total,
      criticalIssues,
      majorIssues,
      minorIssues,
      propertiesWithIssues: uniquePropertiesWithIssues,
      salesWithIssues: uniqueSalesWithIssues,
      neighborhoodsWithIssues: uniqueNeighborhoodsWithIssues,
      totalProperties: entityCounts.properties,
      totalSales: entityCounts.sales,
      totalNeighborhoods: entityCounts.neighborhoods
    };
  }
  
  /**
   * Generate a data quality report
   */
  generateReport(results: ValidationResult[], entityCounts: {
    properties: number;
    sales: number;
    neighborhoods: number;
  }): DataQualityReport {
    const metrics = this.calculateQualityMetrics(results, entityCounts);
    const issues = results.flatMap(r => r.issues);
    
    return {
      metrics,
      issues,
      timestamp: new Date()
    };
  }
  
  /**
   * Format a template string with context variables
   */
  private formatTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match;
    });
  }
}

// Export a singleton instance of the validation engine
export const validationEngine = new ValidationEngine();