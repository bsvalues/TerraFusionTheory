/**
 * Data Validation Framework
 * 
 * Provides types and interfaces for validating data across the GAMA system.
 * Implements IAAO standards for data quality control.
 */

/**
 * Types of validation rules that can be applied to data fields
 */
export type ValidationRuleType = 'range' | 'pattern' | 'required' | 'custom' | 'relationship';

/**
 * Severity levels for validation rule failures
 */
export type ValidationSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * The result of a validation rule check
 */
export interface ValidationResult {
  field: string;
  valid: boolean;
  message?: string;
  severity: ValidationSeverity;
  originalValue: any;
  suggestedValue?: any;
  metadata?: Record<string, any>;
}

/**
 * Base interface for all validation rules
 */
export interface ValidationRule {
  field: string;
  type: ValidationRuleType;
  message: string;
  severity: ValidationSeverity;
  metadata?: Record<string, any>;
}

/**
 * Range validation rule for numeric fields
 */
export interface RangeValidationRule extends ValidationRule {
  type: 'range';
  min?: number;
  max?: number;
  condition?: (value: number) => boolean;
}

/**
 * Pattern validation rule for string fields
 */
export interface PatternValidationRule extends ValidationRule {
  type: 'pattern';
  pattern: RegExp | string;
}

/**
 * Required field validation rule
 */
export interface RequiredValidationRule extends ValidationRule {
  type: 'required';
}

/**
 * Custom validation rule with arbitrary logic
 */
export interface CustomValidationRule extends ValidationRule {
  type: 'custom';
  condition: (value: any, allValues?: Record<string, any>) => boolean;
  remediation?: (value: any, allValues?: Record<string, any>) => any;
}

/**
 * Relationship validation rule to validate relationships between fields
 */
export interface RelationshipValidationRule extends ValidationRule {
  type: 'relationship';
  relatedFields: string[];
  condition: (values: Record<string, any>) => boolean;
}

/**
 * A set of validation rules for a specific entity type
 */
export interface ValidationRuleSet {
  entityType: string;
  rules: (RangeValidationRule | PatternValidationRule | RequiredValidationRule | CustomValidationRule | RelationshipValidationRule)[];
}

/**
 * Summary of validation results for an entity
 */
export interface ValidationSummary {
  entityType: string;
  entityId: string;
  valid: boolean;
  results: ValidationResult[];
  metadata?: Record<string, any>;
}

/**
 * The overall validation report for a dataset
 */
export interface ValidationReport {
  timestamp: Date;
  datasetName: string;
  totalEntities: number;
  validEntities: number;
  invalidEntities: number;
  criticalIssues: number;
  errorIssues: number;
  warningIssues: number;
  infoIssues: number;
  summaries: ValidationSummary[];
  metadata?: Record<string, any>;
}