/**
 * IAAO Standard Validation Rules
 * 
 * Implements validation rules based on the International Association of Assessing Officers (IAAO)
 * standards for property assessment data.
 * 
 * These rules enforce data quality standards required for professional mass appraisal.
 */

import {
  ValidationRuleSet,
  RangeValidationRule,
  PatternValidationRule,
  RequiredValidationRule,
  CustomValidationRule,
  RelationshipValidationRule,
  ValidationSeverity
} from './validation.types';

/**
 * IAAO standard validation rules for property data
 */
export const propertyValidationRules: ValidationRuleSet = {
  entityType: 'properties',
  rules: [
    // Required identification fields
    {
      field: 'parcelId',
      type: 'required',
      message: 'Parcel ID is required for property identification',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'address',
      type: 'required',
      message: 'Property address is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'city',
      type: 'required',
      message: 'City is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'state',
      type: 'required',
      message: 'State is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'zipCode',
      type: 'required',
      message: 'ZIP code is required',
      severity: 'critical'
    } as RequiredValidationRule,
    
    // Pattern validations
    {
      field: 'state',
      type: 'pattern',
      pattern: /^[A-Z]{2}$/,
      message: 'State should be a 2-letter state code (e.g., CA, NY)',
      severity: 'error'
    } as PatternValidationRule,
    {
      field: 'zipCode',
      type: 'pattern',
      pattern: /^\d{5}(-\d{4})?$/,
      message: 'ZIP code should be in format 12345 or 12345-6789',
      severity: 'error'
    } as PatternValidationRule,
    
    // Range validations for physical characteristics
    {
      field: 'yearBuilt',
      type: 'range',
      min: 1700,
      max: new Date().getFullYear(),
      message: `Year built should be between 1700 and ${new Date().getFullYear()}`,
      severity: 'error'
    } as RangeValidationRule,
    {
      field: 'buildingArea',
      type: 'range',
      min: 100,
      max: 100000,
      message: 'Building area should be between 100 and 100,000 square feet',
      severity: 'warning'
    } as RangeValidationRule,
    {
      field: 'lotSize',
      type: 'range',
      min: 100,
      max: 1000000000, // 1 billion sq ft = ~23,000 acres
      message: 'Lot size should be between 100 and 1 billion square feet',
      severity: 'warning'
    } as RangeValidationRule,
    {
      field: 'bedrooms',
      type: 'range',
      min: 0,
      max: 20,
      message: 'Bedrooms should be between 0 and 20',
      severity: 'warning'
    } as RangeValidationRule,
    {
      field: 'bathrooms',
      type: 'range',
      min: 0,
      max: 20,
      message: 'Bathrooms should be between 0 and 20',
      severity: 'warning'
    } as RangeValidationRule,
    {
      field: 'stories',
      type: 'range',
      min: 1,
      max: 100,
      message: 'Stories should be between 1 and 100',
      severity: 'warning'
    } as RangeValidationRule,
    
    // Validation for coordinates
    {
      field: 'latitude',
      type: 'range',
      min: -90,
      max: 90,
      message: 'Latitude should be between -90 and 90 degrees',
      severity: 'error'
    } as RangeValidationRule,
    {
      field: 'longitude',
      type: 'range',
      min: -180,
      max: 180,
      message: 'Longitude should be between -180 and 180 degrees',
      severity: 'error'
    } as RangeValidationRule,
    
    // Custom validation for property type
    {
      field: 'propertyType',
      type: 'custom',
      condition: (value: string) => {
        const validTypes = [
          'residential', 'commercial', 'industrial', 'agricultural', 
          'vacant_land', 'mixed_use', 'special_purpose',
          'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 
          'VACANT_LAND', 'MIXED_USE', 'SPECIAL_PURPOSE'
        ];
        return validTypes.includes(value);
      },
      message: 'Property type must be a valid type',
      severity: 'error'
    } as CustomValidationRule,
    
    // Relationship validation for valuation
    {
      field: 'marketValue',
      type: 'relationship',
      relatedFields: ['assessedValue', 'buildingArea'],
      condition: (values) => {
        // If both market value and building area are present, check for reasonable price per sq ft
        if (values.marketValue && values.buildingArea) {
          const marketValue = parseFloat(values.marketValue as string);
          const buildingArea = parseFloat(values.buildingArea as string);
          
          if (isNaN(marketValue) || isNaN(buildingArea) || buildingArea === 0) {
            return true; // Skip validation if values are not numeric
          }
          
          const pricePerSqFt = marketValue / buildingArea;
          
          // Check if price per sq ft is within reasonable bounds
          // $5 to $10,000 per sq ft covers everything from rural to luxury
          return pricePerSqFt >= 5 && pricePerSqFt <= 10000;
        }
        return true; // Skip validation if either value is missing
      },
      message: 'Market value per square foot is outside reasonable bounds',
      severity: 'warning'
    } as RelationshipValidationRule,
    
    // Ensure consistency between assessment values
    {
      field: 'assessedValue',
      type: 'relationship',
      relatedFields: ['taxableValue', 'marketValue'],
      condition: (values) => {
        if (values.assessedValue && values.taxableValue) {
          const assessedValue = parseFloat(values.assessedValue as string);
          const taxableValue = parseFloat(values.taxableValue as string);
          
          if (isNaN(assessedValue) || isNaN(taxableValue)) {
            return true; // Skip validation if values are not numeric
          }
          
          // Taxable value should not be greater than assessed value
          return taxableValue <= assessedValue;
        }
        return true; // Skip validation if either value is missing
      },
      message: 'Taxable value should not exceed assessed value',
      severity: 'error'
    } as RelationshipValidationRule
  ]
};

/**
 * IAAO standard validation rules for property sales
 */
export const propertySaleValidationRules: ValidationRuleSet = {
  entityType: 'property_sales',
  rules: [
    // Required fields
    {
      field: 'propertyId',
      type: 'required',
      message: 'Property ID is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'parcelId',
      type: 'required',
      message: 'Parcel ID is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'salePrice',
      type: 'required',
      message: 'Sale price is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'saleDate',
      type: 'required',
      message: 'Sale date is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'transactionType',
      type: 'required',
      message: 'Transaction type is required',
      severity: 'error'
    } as RequiredValidationRule,
    
    // Range validations
    {
      field: 'salePrice',
      type: 'range',
      min: 100,
      max: 1000000000, // $1 billion
      message: 'Sale price should be between $100 and $1 billion',
      severity: 'warning'
    } as RangeValidationRule,
    
    // Custom validation for transaction type
    {
      field: 'transactionType',
      type: 'custom',
      condition: (value: string) => {
        const validTypes = [
          'sale', 'refinance', 'foreclosure', 'auction', 'short_sale', 'other',
          'SALE', 'REFINANCE', 'FORECLOSURE', 'AUCTION', 'SHORT_SALE', 'OTHER'
        ];
        return validTypes.includes(value);
      },
      message: 'Transaction type must be a valid type',
      severity: 'error'
    } as CustomValidationRule,
    
    // Validation for sale date
    {
      field: 'saleDate',
      type: 'custom',
      condition: (value: string) => {
        try {
          const date = new Date(value);
          const minDate = new Date('1700-01-01');
          const maxDate = new Date(); // Today
          
          return date >= minDate && date <= maxDate;
        } catch (e) {
          return false;
        }
      },
      message: 'Sale date must be a valid date between 1700 and today',
      severity: 'error'
    } as CustomValidationRule,
    
    // Relationship validation for assessment ratio
    {
      field: 'assessmentRatio',
      type: 'relationship',
      relatedFields: ['assessedValueAtSale', 'salePrice'],
      condition: (values) => {
        if (values.assessedValueAtSale && values.salePrice) {
          const assessedValue = parseFloat(values.assessedValueAtSale as string);
          const salePrice = parseFloat(values.salePrice as string);
          
          if (isNaN(assessedValue) || isNaN(salePrice) || salePrice === 0) {
            return true; // Skip validation if values are not numeric
          }
          
          const ratio = assessedValue / salePrice;
          
          // IAAO standard: assessment ratio should be within 0.1 to 2.0
          // Values outside this range may indicate non-arms-length transactions
          return ratio >= 0.1 && ratio <= 2.0;
        }
        return true; // Skip validation if either value is missing
      },
      message: 'Assessment ratio is outside IAAO standard bounds (0.1 to 2.0)',
      severity: 'warning'
    } as RelationshipValidationRule
  ]
};

/**
 * IAAO standard validation rules for neighborhoods
 */
export const neighborhoodValidationRules: ValidationRuleSet = {
  entityType: 'neighborhoods',
  rules: [
    // Required fields
    {
      field: 'name',
      type: 'required',
      message: 'Neighborhood name is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'code',
      type: 'required',
      message: 'Neighborhood code is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'city',
      type: 'required',
      message: 'City is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'county',
      type: 'required',
      message: 'County is required',
      severity: 'critical'
    } as RequiredValidationRule,
    {
      field: 'state',
      type: 'required',
      message: 'State is required',
      severity: 'critical'
    } as RequiredValidationRule,
    
    // Pattern validations
    {
      field: 'state',
      type: 'pattern',
      pattern: /^[A-Z]{2}$/,
      message: 'State should be a 2-letter state code (e.g., CA, NY)',
      severity: 'error'
    } as PatternValidationRule,
    
    // Custom validation for neighborhood code
    {
      field: 'code',
      type: 'pattern',
      pattern: /^[A-Z0-9-_]{3,10}$/,
      message: 'Neighborhood code should be 3-10 characters (letters, numbers, hyphens, underscores)',
      severity: 'warning'
    } as PatternValidationRule,
    
    // Range validations for neighborhood statistics
    {
      field: 'medianHomeValue',
      type: 'range',
      min: 1000,
      max: 100000000, // $100 million
      message: 'Median home value should be between $1,000 and $100 million',
      severity: 'warning'
    } as RangeValidationRule,
    {
      field: 'avgHomeValue',
      type: 'range',
      min: 1000,
      max: 100000000, // $100 million
      message: 'Average home value should be between $1,000 and $100 million',
      severity: 'warning'
    } as RangeValidationRule,
    {
      field: 'avgYearBuilt',
      type: 'range',
      min: 1700,
      max: new Date().getFullYear(),
      message: `Average year built should be between 1700 and ${new Date().getFullYear()}`,
      severity: 'warning'
    } as RangeValidationRule,
    
    // Range validation for walkability, transit, school scores
    {
      field: 'walkScore',
      type: 'range',
      min: 0,
      max: 100,
      message: 'Walk score should be between 0 and 100',
      severity: 'info'
    } as RangeValidationRule,
    {
      field: 'transitScore',
      type: 'range',
      min: 0,
      max: 100,
      message: 'Transit score should be between 0 and 100',
      severity: 'info'
    } as RangeValidationRule,
    {
      field: 'schoolRating',
      type: 'range',
      min: 0,
      max: 10,
      message: 'School rating should be between 0 and 10',
      severity: 'info'
    } as RangeValidationRule,
    
    // Validate boundaries (ensure it's a valid GeoJSON)
    {
      field: 'boundaries',
      type: 'custom',
      condition: (value: any) => {
        if (!value) return true; // Skip if no boundaries
        
        try {
          // Basic check for GeoJSON structure
          if (typeof value === 'string') {
            value = JSON.parse(value);
          }
          
          // Check for basic GeoJSON structure (type and coordinates properties)
          return value.type && 
                 (value.coordinates || 
                  (value.geometry && value.geometry.coordinates));
        } catch (e) {
          return false;
        }
      },
      message: 'Boundaries must be valid GeoJSON',
      severity: 'error'
    } as CustomValidationRule
  ]
};

// Export all IAAO validation rule sets
export const iaaoValidationRules: Record<string, ValidationRuleSet> = {
  properties: propertyValidationRules,
  property_sales: propertySaleValidationRules,
  neighborhoods: neighborhoodValidationRules
};