/**
 * Property Data Validation Rules
 * 
 * Implements IAAO-compliant validation rules for property assessment data.
 * These rules ensure data quality and consistency for mass appraisal systems.
 */

import { 
  ValidationRuleSet,
  RangeValidationRule,
  PatternValidationRule,
  RequiredValidationRule,
  RelationshipValidationRule,
  CustomValidationRule,
  ValidationSeverity
} from './validation.types';
import { PropertyData } from '../../server/services/connectors/cama.connector';

/**
 * Validation rules for property data
 */
export const propertyValidationRules: ValidationRuleSet = {
  entityType: 'property',
  rules: [
    // Required fields
    {
      field: 'id',
      type: 'required',
      message: 'Property ID is required',
      severity: 'critical'
    },
    {
      field: 'parcelId',
      type: 'required',
      message: 'Parcel ID is required',
      severity: 'critical'
    },
    {
      field: 'address',
      type: 'required',
      message: 'Property address is required',
      severity: 'error'
    },
    {
      field: 'assessedValue',
      type: 'required',
      message: 'Assessed value is required',
      severity: 'error'
    },
    {
      field: 'assessmentYear',
      type: 'required',
      message: 'Assessment year is required',
      severity: 'error'
    },
    
    // Pattern validations
    {
      field: 'parcelId',
      type: 'pattern',
      pattern: /^[A-Za-z0-9\-_\.]+$/,
      message: 'Parcel ID contains invalid characters',
      severity: 'warning'
    },
    {
      field: 'address',
      type: 'pattern',
      pattern: /^[A-Za-z0-9\s\.\,\-\#\&\']+$/,
      message: 'Address contains invalid characters',
      severity: 'warning'
    },
    
    // Range validations
    {
      field: 'assessedValue',
      type: 'range',
      min: 0,
      message: 'Assessed value cannot be negative',
      severity: 'error'
    },
    {
      field: 'marketValue',
      type: 'range',
      min: 0,
      message: 'Market value cannot be negative',
      severity: 'error'
    },
    {
      field: 'landValue',
      type: 'range',
      min: 0,
      message: 'Land value cannot be negative',
      severity: 'error'
    },
    {
      field: 'improvementValue',
      type: 'range',
      min: 0,
      message: 'Improvement value cannot be negative',
      severity: 'error'
    },
    {
      field: 'acres',
      type: 'range',
      min: 0,
      message: 'Acres cannot be negative',
      severity: 'error'
    },
    {
      field: 'squareFeet',
      type: 'range',
      min: 0,
      message: 'Square feet cannot be negative',
      severity: 'error'
    },
    {
      field: 'assessmentYear',
      type: 'range',
      min: 1900,
      max: new Date().getFullYear() + 1, // Allow current year + 1 for upcoming assessments
      message: 'Assessment year is outside valid range',
      severity: 'error'
    },
    {
      field: 'lastSalePrice',
      type: 'range',
      min: 0,
      message: 'Last sale price cannot be negative',
      severity: 'error'
    },
    {
      field: 'latitude',
      type: 'range',
      min: -90,
      max: 90,
      message: 'Latitude must be between -90 and 90 degrees',
      severity: 'error'
    },
    {
      field: 'longitude',
      type: 'range',
      min: -180,
      max: 180,
      message: 'Longitude must be between -180 and 180 degrees',
      severity: 'error'
    },
    
    // Custom validations
    {
      field: 'lastSaleDate',
      type: 'custom',
      condition: (value: string | undefined) => {
        if (!value) return true;
        const saleDate = new Date(value);
        return !isNaN(saleDate.getTime()) && saleDate <= new Date();
      },
      message: 'Last sale date must be valid and not in the future',
      severity: 'warning'
    },
    {
      field: 'propertyClass',
      type: 'custom',
      condition: (value: string | undefined) => {
        if (!value) return true;
        // Common property classifications
        const validClasses = [
          'residential',
          'commercial',
          'industrial',
          'agricultural',
          'vacant',
          'exempt',
          'special'
        ];
        return validClasses.includes(value.toLowerCase()) || /^[A-Z0-9]{1,3}$/.test(value);
      },
      message: 'Property class is not recognized',
      severity: 'info'
    },
    
    // Relationship validations
    {
      field: 'improvementValue',
      type: 'relationship',
      relatedFields: ['assessedValue'],
      condition: (values: Record<string, any>) => {
        // Improvement value should not exceed assessed value
        const improvementValue = values.improvementValue || 0;
        const assessedValue = values.assessedValue || 0;
        return improvementValue <= assessedValue;
      },
      message: 'Improvement value exceeds assessed value',
      severity: 'warning'
    },
    {
      field: 'landValue',
      type: 'relationship',
      relatedFields: ['assessedValue'],
      condition: (values: Record<string, any>) => {
        // Land value should not exceed assessed value
        const landValue = values.landValue || 0;
        const assessedValue = values.assessedValue || 0;
        return landValue <= assessedValue;
      },
      message: 'Land value exceeds assessed value',
      severity: 'warning'
    },
    {
      field: 'assessedValue',
      type: 'relationship',
      relatedFields: ['landValue', 'improvementValue'],
      condition: (values: Record<string, any>) => {
        // Assessed value should approximately equal land + improvements
        const landValue = values.landValue || 0;
        const improvementValue = values.improvementValue || 0;
        const assessedValue = values.assessedValue || 0;
        
        // Allow for small discrepancies (1% tolerance)
        const calculatedValue = landValue + improvementValue;
        const difference = Math.abs(assessedValue - calculatedValue);
        const tolerance = assessedValue * 0.01; // 1% tolerance
        
        return difference <= tolerance;
      },
      message: 'Assessed value does not match sum of land and improvement values',
      severity: 'warning'
    },
    {
      field: 'lastSalePrice',
      type: 'relationship',
      relatedFields: ['assessedValue'],
      condition: (values: Record<string, any>) => {
        // Check if assessment ratio is within reasonable bounds
        // Typical assessment ratios are between 0.7 and 1.3 of market value
        const lastSalePrice = values.lastSalePrice;
        const assessedValue = values.assessedValue;
        
        if (!lastSalePrice || !assessedValue) return true;
        
        const ratio = assessedValue / lastSalePrice;
        return ratio >= 0.5 && ratio <= 1.5; // Wider tolerance for individual properties
      },
      message: 'Assessment ratio (assessed value / sale price) appears unusual',
      severity: 'info'
    }
  ]
};

/**
 * Validation rules for property sale data
 */
export const propertySaleValidationRules: ValidationRuleSet = {
  entityType: 'property_sale',
  rules: [
    // Required fields
    {
      field: 'id',
      type: 'required',
      message: 'Sale ID is required',
      severity: 'critical'
    },
    {
      field: 'parcelId',
      type: 'required',
      message: 'Parcel ID is required',
      severity: 'critical'
    },
    {
      field: 'salePrice',
      type: 'required',
      message: 'Sale price is required',
      severity: 'error'
    },
    {
      field: 'saleDate',
      type: 'required',
      message: 'Sale date is required',
      severity: 'error'
    },
    
    // Pattern validations
    {
      field: 'parcelId',
      type: 'pattern',
      pattern: /^[A-Za-z0-9\-_\.]+$/,
      message: 'Parcel ID contains invalid characters',
      severity: 'warning'
    },
    
    // Range validations
    {
      field: 'salePrice',
      type: 'range',
      min: 0,
      message: 'Sale price cannot be negative',
      severity: 'error'
    },
    {
      field: 'assessedValue',
      type: 'range',
      min: 0,
      message: 'Assessed value cannot be negative',
      severity: 'error'
    },
    
    // Custom validations
    {
      field: 'saleDate',
      type: 'custom',
      condition: (value: string | undefined) => {
        if (!value) return true;
        const saleDate = new Date(value);
        return !isNaN(saleDate.getTime()) && saleDate <= new Date();
      },
      message: 'Sale date must be valid and not in the future',
      severity: 'error'
    },
    {
      field: 'salePrice',
      type: 'custom',
      condition: (value: number, allValues?: Record<string, any>) => {
        // Flag extremely low sales that might not be arm's length transactions
        if (!value || !allValues) return true;
        
        // For residential properties, flag sales below $1,000
        if (allValues.propertyType?.toLowerCase() === 'residential' && value < 1000) {
          return false;
        }
        
        // For commercial properties, flag sales below $5,000
        if (allValues.propertyType?.toLowerCase() === 'commercial' && value < 5000) {
          return false;
        }
        
        return true;
      },
      message: 'Sale price is unusually low, may not be an arm\'s length transaction',
      severity: 'warning'
    }
  ]
};

/**
 * Get validation rules for a specific property based on its characteristics
 * This allows for context-sensitive validation based on property attributes
 */
export function getPropertyValidationRules(property: Partial<PropertyData>): ValidationRuleSet {
  // Start with the base validation rules
  const baseRules = [...propertyValidationRules.rules];
  const propertyType = property.propertyClass?.toLowerCase() || '';
  
  // Add property-type specific validation rules
  if (propertyType.includes('residential')) {
    // Residential property rules
    baseRules.push({
      field: 'squareFeet',
      type: 'range',
      min: 100, // Minimum reasonable size for a residential structure
      message: 'Residential square footage is unusually small',
      severity: 'warning'
    } as RangeValidationRule);
    
    baseRules.push({
      field: 'squareFeet',
      type: 'range',
      max: 20000, // Maximum reasonable size for a residential structure
      message: 'Residential square footage is unusually large',
      severity: 'warning'
    } as RangeValidationRule);
  }
  
  if (propertyType.includes('commercial')) {
    // Commercial property rules
    baseRules.push({
      field: 'squareFeet',
      type: 'range',
      min: 500, // Minimum reasonable size for a commercial structure
      message: 'Commercial square footage is unusually small',
      severity: 'warning'
    } as RangeValidationRule);
  }
  
  if (propertyType.includes('vacant') || propertyType.includes('land')) {
    // Vacant land rules
    baseRules.push({
      field: 'improvementValue',
      type: 'range',
      max: 0,
      message: 'Vacant land should not have improvement value',
      severity: 'warning'
    } as RangeValidationRule);
    
    baseRules.push({
      field: 'squareFeet',
      type: 'range',
      max: 0,
      message: 'Vacant land should not have building square footage',
      severity: 'warning'
    } as RangeValidationRule);
  }
  
  // Geographic-specific validation (if location information is available)
  if (property.latitude && property.longitude) {
    // For example, properties in certain areas should have specific characteristics
    // This would need to be customized based on the jurisdiction
  }
  
  return {
    entityType: 'property',
    rules: baseRules
  };
}