/**
 * Data Validation Framework Implementation
 * 
 * Provides core validation functionality for the GAMA system.
 * Implements IAAO standards for data quality control.
 */

import { 
  ValidationRule,
  ValidationResult,
  ValidationRuleSet,
  ValidationSummary,
  ValidationReport,
  RangeValidationRule,
  PatternValidationRule,
  RequiredValidationRule,
  CustomValidationRule,
  RelationshipValidationRule,
  ValidationSeverity
} from './validation.types';

/**
 * Core data validation engine
 */
export class DataValidator {
  private ruleSets: Map<string, ValidationRuleSet> = new Map();

  /**
   * Register a validation rule set for an entity type
   */
  registerRuleSet(ruleSet: ValidationRuleSet): void {
    this.ruleSets.set(ruleSet.entityType, ruleSet);
  }

  /**
   * Get a validation rule set for an entity type
   */
  getRuleSet(entityType: string): ValidationRuleSet | undefined {
    return this.ruleSets.get(entityType);
  }

  /**
   * Validate a single entity against its rule set
   */
  validateEntity(entity: Record<string, any>, entityType: string): ValidationSummary {
    const ruleSet = this.ruleSets.get(entityType);
    if (!ruleSet) {
      throw new Error(`No validation rules registered for entity type: ${entityType}`);
    }

    const results: ValidationResult[] = [];
    let isValid = true;

    // Process each rule in the rule set
    for (const rule of ruleSet.rules) {
      const result = this.applyRule(rule, entity);
      results.push(result);
      if (!result.valid && (result.severity === 'error' || result.severity === 'critical')) {
        isValid = false;
      }
    }

    return {
      entityType,
      entityId: entity.id ?? 'unknown',
      valid: isValid,
      results
    };
  }

  /**
   * Validate a collection of entities of the same type
   */
  validateEntities(entities: Record<string, any>[], entityType: string): ValidationReport {
    const summaries: ValidationSummary[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let criticalCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const entity of entities) {
      const summary = this.validateEntity(entity, entityType);
      summaries.push(summary);
      
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
      datasetName: entityType,
      totalEntities: entities.length,
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
   * Apply validation remediation to an entity based on validation results
   */
  applyRemediation(entity: Record<string, any>, summary: ValidationSummary): Record<string, any> {
    const remediatedEntity = { ...entity };
    
    for (const result of summary.results) {
      if (!result.valid && result.suggestedValue !== undefined) {
        remediatedEntity[result.field] = result.suggestedValue;
      }
    }

    return remediatedEntity;
  }

  /**
   * Apply a validation rule to an entity
   */
  private applyRule(rule: ValidationRule, entity: Record<string, any>): ValidationResult {
    const value = entity[rule.field];
    
    // Base result structure
    const result: ValidationResult = {
      field: rule.field,
      valid: true,
      severity: rule.severity,
      originalValue: value,
      metadata: rule.metadata
    };

    switch (rule.type) {
      case 'range':
        return this.applyRangeRule(rule as RangeValidationRule, value, result);
      
      case 'pattern':
        return this.applyPatternRule(rule as PatternValidationRule, value, result);
      
      case 'required':
        return this.applyRequiredRule(rule as RequiredValidationRule, value, result);
      
      case 'custom':
        return this.applyCustomRule(rule as CustomValidationRule, value, entity, result);
      
      case 'relationship':
        return this.applyRelationshipRule(rule as RelationshipValidationRule, entity, result);
      
      default:
        result.valid = false;
        result.message = `Unknown rule type: ${(rule as any).type}`;
        return result;
    }
  }

  /**
   * Apply a range validation rule
   */
  private applyRangeRule(rule: RangeValidationRule, value: any, result: ValidationResult): ValidationResult {
    if (typeof value !== 'number') {
      result.valid = false;
      result.message = `${rule.field} must be a number`;
      return result;
    }

    let isValid = true;
    if (rule.min !== undefined && value < rule.min) {
      isValid = false;
    }
    if (rule.max !== undefined && value > rule.max) {
      isValid = false;
    }
    if (rule.condition && !rule.condition(value)) {
      isValid = false;
    }

    if (!isValid) {
      result.valid = false;
      result.message = rule.message;
      
      // Suggest a remediated value within the valid range
      if (rule.min !== undefined && value < rule.min) {
        result.suggestedValue = rule.min;
      } else if (rule.max !== undefined && value > rule.max) {
        result.suggestedValue = rule.max;
      }
    }

    return result;
  }

  /**
   * Apply a pattern validation rule
   */
  private applyPatternRule(rule: PatternValidationRule, value: any, result: ValidationResult): ValidationResult {
    if (typeof value !== 'string') {
      result.valid = false;
      result.message = `${rule.field} must be a string`;
      return result;
    }

    const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
    if (!pattern.test(value)) {
      result.valid = false;
      result.message = rule.message;
    }

    return result;
  }

  /**
   * Apply a required validation rule
   */
  private applyRequiredRule(rule: RequiredValidationRule, value: any, result: ValidationResult): ValidationResult {
    if (value === undefined || value === null || value === '') {
      result.valid = false;
      result.message = rule.message;
    }

    return result;
  }

  /**
   * Apply a custom validation rule
   */
  private applyCustomRule(rule: CustomValidationRule, value: any, entity: Record<string, any>, result: ValidationResult): ValidationResult {
    if (!rule.condition(value, entity)) {
      result.valid = false;
      result.message = rule.message;

      // Apply remediation if available
      if (rule.remediation) {
        result.suggestedValue = rule.remediation(value, entity);
      }
    }

    return result;
  }

  /**
   * Apply a relationship validation rule
   */
  private applyRelationshipRule(rule: RelationshipValidationRule, entity: Record<string, any>, result: ValidationResult): ValidationResult {
    const relatedValues: Record<string, any> = {};
    for (const field of [rule.field, ...rule.relatedFields]) {
      relatedValues[field] = entity[field];
    }

    if (!rule.condition(relatedValues)) {
      result.valid = false;
      result.message = rule.message;
    }

    return result;
  }
}