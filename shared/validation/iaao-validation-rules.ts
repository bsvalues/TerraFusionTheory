/**
 * IAAO Validation Rules
 * 
 * This module defines validation rules based on IAAO (International Association
 * of Assessing Officers) standards for property data quality.
 */

import { 
  ValidationRuleBuilder, 
  ValidationScope, 
  ValidationCategory, 
  ValidationSeverity,
  ValidationEngine,
  ValidationIssue,
  DataQualityReport,
  DataQualityMetrics,
  validationEngine
} from './data-quality-framework';
import { PropertyType, TransactionType } from '../schema';

// Helper functions
const isNotEmpty = (value: any) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const isValidNumber = (value: any) => {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
};

const isPositive = (value: any) => {
  if (!isValidNumber(value)) return false;
  return Number(value) > 0;
};

const isNonNegative = (value: any) => {
  if (!isValidNumber(value)) return false;
  return Number(value) >= 0;
};

const isInRange = (value: any, min: number, max: number) => {
  if (!isValidNumber(value)) return false;
  const num = Number(value);
  return num >= min && num <= max;
};

const isValidDate = (value: any) => {
  if (!value) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

const isAfterDate = (value: any, compareDate: Date) => {
  if (!isValidDate(value)) return false;
  const date = new Date(value);
  return date > compareDate;
};

const isBeforeDate = (value: any, compareDate: Date) => {
  if (!isValidDate(value)) return false;
  const date = new Date(value);
  return date < compareDate;
};

const isValidEnumValue = (value: any, enumType: any) => {
  if (value === null || value === undefined) return false;
  return Object.values(enumType).includes(value);
};

const hasValidFormat = (value: any, regex: RegExp) => {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'string') return false;
  return regex.test(value);
};

// Build IAAO validation rules
export function createIAAOValidationRules() {
  const propertyRules = [
    // Required Fields
    ValidationRuleBuilder.create('PROP-REQ-001', 'Property ID is required')
      .withDescription('Every property record must have a unique identifier.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('parcelId')
      .withPredicate(isNotEmpty)
      .withMessageTemplate('Property ID is missing for entity {entityId}')
      .withSuggestedFixTemplate('Add a valid property identifier to {field}')
      .withStandardReference('IAAO Standard on Property Data 2.1')
      .build(),
      
    ValidationRuleBuilder.create('PROP-REQ-002', 'Property address is required')
      .withDescription('Every property must have a valid address for identification.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('address')
      .withPredicate(isNotEmpty)
      .withMessageTemplate('Property address is missing for entity {entityId}')
      .withSuggestedFixTemplate('Add a valid street address to {field}')
      .withStandardReference('IAAO Standard on Property Data 2.3')
      .build(),
      
    ValidationRuleBuilder.create('PROP-REQ-003', 'Property location data is required')
      .withDescription('Properties must have basic location information (city, state, zip code).')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('city', 'state', 'zipCode')
      .withPredicate(isNotEmpty)
      .withMessageTemplate('{field} is missing for property {entityId}')
      .withSuggestedFixTemplate('Add a valid value to {field}')
      .withStandardReference('IAAO Standard on Property Data 2.3')
      .build(),
      
    ValidationRuleBuilder.create('PROP-REQ-004', 'Property type is required')
      .withDescription('Every property must have a classification type.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('propertyType')
      .withPredicate((value) => isValidEnumValue(value, PropertyType))
      .withMessageTemplate('Property type is invalid or missing for property {entityId}')
      .withSuggestedFixTemplate('Assign a valid property type from the approved list')
      .withStandardReference('IAAO Standard on Property Data 3.2')
      .build(),
    
    // Numerical Value Validation
    ValidationRuleBuilder.create('PROP-NUM-001', 'Building area must be positive')
      .withDescription('Building area must be a positive number when present.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('buildingArea')
      .withPredicate((value) => value === null || value === undefined || isPositive(value))
      .withMessageTemplate('Building area must be positive, got {value} for property {entityId}')
      .withSuggestedFixTemplate('Correct the building area to a positive value')
      .withStandardReference('IAAO Standard on Property Data 3.4')
      .build(),
      
    ValidationRuleBuilder.create('PROP-NUM-002', 'Lot size must be positive')
      .withDescription('Lot size must be a positive number when present.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('lotSize')
      .withPredicate((value) => value === null || value === undefined || isPositive(value))
      .withMessageTemplate('Lot size must be positive, got {value} for property {entityId}')
      .withSuggestedFixTemplate('Correct the lot size to a positive value')
      .withStandardReference('IAAO Standard on Property Data 3.4')
      .build(),
      
    ValidationRuleBuilder.create('PROP-NUM-003', 'Building values must be non-negative')
      .withDescription('Assessment values must be non-negative numbers.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('assessedValue', 'marketValue', 'taxableValue')
      .withPredicate((value) => value === null || value === undefined || isNonNegative(value))
      .withMessageTemplate('{field} must be non-negative, got {value} for property {entityId}')
      .withSuggestedFixTemplate('Correct {field} to a non-negative value')
      .withStandardReference('IAAO Standard on Property Data 4.2')
      .build(),
      
    ValidationRuleBuilder.create('PROP-NUM-004', 'Year built must be valid')
      .withDescription('Year built must be a valid year between 1600 and current year.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('yearBuilt')
      .withPredicate((value) => {
        if (value === null || value === undefined) return true;
        const currentYear = new Date().getFullYear();
        return isInRange(value, 1600, currentYear);
      })
      .withMessageTemplate('Year built ({value}) is not valid for property {entityId}')
      .withSuggestedFixTemplate('Correct year built to a valid year between 1600 and current year')
      .withStandardReference('IAAO Standard on Property Data 3.3')
      .build(),
      
    ValidationRuleBuilder.create('PROP-NUM-005', 'Bedrooms and bathrooms must be reasonable')
      .withDescription('Residential properties should have a reasonable number of bedrooms and bathrooms.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('bedrooms', 'bathrooms')
      .withPredicate((value, context) => {
        if (value === null || value === undefined) return true;
        
        // Only apply to residential properties
        if (context?.entity?.propertyType !== PropertyType.RESIDENTIAL) {
          return true;
        }
        
        // Bedrooms usually between 0 and 20
        if (context?.field === 'bedrooms') {
          return isInRange(value, 0, 20);
        }
        
        // Bathrooms usually between 0 and 15
        if (context?.field === 'bathrooms') {
          return isInRange(value, 0, 15);
        }
        
        return true;
      })
      .withMessageTemplate('{field} value ({value}) is unusually high for property {entityId}')
      .withSuggestedFixTemplate('Verify and correct {field} to a reasonable value')
      .withStandardReference('IAAO Standard on Property Data 3.3')
      .build(),
    
    // Date Validation
    ValidationRuleBuilder.create('PROP-DATE-001', 'Sale date must be valid')
      .withDescription('When present, sale date must be a valid date.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('lastSaleDate')
      .withPredicate((value) => value === null || value === undefined || isValidDate(value))
      .withMessageTemplate('Last sale date ({value}) is not a valid date for property {entityId}')
      .withSuggestedFixTemplate('Correct last sale date to a valid date format')
      .withStandardReference('IAAO Standard on Property Data 5.1')
      .build(),
      
    ValidationRuleBuilder.create('PROP-DATE-002', 'Sale date must not be in future')
      .withDescription('Sale dates cannot be in the future.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('lastSaleDate')
      .withPredicate((value) => {
        if (value === null || value === undefined) return true;
        return isBeforeDate(value, new Date());
      })
      .withMessageTemplate('Last sale date ({value}) is in the future for property {entityId}')
      .withSuggestedFixTemplate('Correct last sale date to a date not in the future')
      .withStandardReference('IAAO Standard on Property Data 5.1')
      .build(),
    
    // Consistency Validation
    ValidationRuleBuilder.create('PROP-CONS-001', 'Assessment ratio must be reasonable')
      .withDescription('The ratio between assessed value and market value should be reasonable.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.CONSISTENCY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('assessedValue', 'marketValue')
      .withPredicate((value, context) => {
        const assessedValue = context?.entity?.assessedValue;
        const marketValue = context?.entity?.marketValue;
        
        if (!assessedValue || !marketValue) return true;
        if (!isValidNumber(assessedValue) || !isValidNumber(marketValue)) return true;
        if (Number(marketValue) === 0) return true;
        
        const ratio = Number(assessedValue) / Number(marketValue);
        return isInRange(ratio, 0.05, 1.5); // Most jurisdictions have ratios between 5% and 150%
      })
      .withMessageTemplate('Assessment ratio is outside reasonable range for property {entityId}')
      .withSuggestedFixTemplate('Verify assessed value and market value for accuracy')
      .withStandardReference('IAAO Standard on Property Data 4.3')
      .build(),
      
    ValidationRuleBuilder.create('PROP-CONS-002', 'Building area should match bedroom count')
      .withDescription('For residential properties, building area should be reasonable for the number of bedrooms.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.CONSISTENCY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('buildingArea', 'bedrooms')
      .withPredicate((value, context) => {
        const buildingArea = context?.entity?.buildingArea;
        const bedrooms = context?.entity?.bedrooms;
        const propertyType = context?.entity?.propertyType;
        
        // Only applies to residential properties with both values present
        if (propertyType !== PropertyType.RESIDENTIAL) return true;
        if (!buildingArea || !bedrooms) return true;
        if (!isValidNumber(buildingArea) || !isValidNumber(bedrooms)) return true;
        
        // Very rough estimate: at least 200 sq ft per bedroom
        const minAreaPerBedroom = 200;
        const numBedrooms = Number(bedrooms);
        const area = Number(buildingArea);
        
        return area >= numBedrooms * minAreaPerBedroom;
      })
      .withMessageTemplate('Building area seems too small for the number of bedrooms in property {entityId}')
      .withSuggestedFixTemplate('Verify building area and bedroom count for consistency')
      .withStandardReference('IAAO Standard on Property Data 3.6')
      .build(),
    
    // Format Validation
    ValidationRuleBuilder.create('PROP-FMT-001', 'Zip code format must be valid')
      .withDescription('Zip code must be in valid format.')
      .withScope(ValidationScope.PROPERTY)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('zipCode')
      .withPredicate((value) => {
        if (!value) return true;
        // Basic US zip code format (5 digits or ZIP+4)
        return hasValidFormat(value, /^\d{5}(-\d{4})?$/);
      })
      .withMessageTemplate('Zip code ({value}) has invalid format for property {entityId}')
      .withSuggestedFixTemplate('Correct zip code to a valid 5-digit or ZIP+4 format')
      .withStandardReference('IAAO Standard on Property Data 2.3')
      .build(),
  ];
  
  const salesRules = [
    // Required Fields for Sales
    ValidationRuleBuilder.create('SALE-REQ-001', 'Sale price is required')
      .withDescription('Every property sale must have a valid sale price.')
      .withScope(ValidationScope.SALE)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('salePrice')
      .withPredicate(isNotEmpty)
      .withMessageTemplate('Sale price is missing for sale {entityId}')
      .withSuggestedFixTemplate('Add a valid sale price to {field}')
      .withStandardReference('IAAO Standard on Verification and Adjustment of Sales 2.1')
      .build(),
      
    ValidationRuleBuilder.create('SALE-REQ-002', 'Sale date is required')
      .withDescription('Every property sale must have a valid sale date.')
      .withScope(ValidationScope.SALE)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('saleDate')
      .withPredicate(isNotEmpty)
      .withMessageTemplate('Sale date is missing for sale {entityId}')
      .withSuggestedFixTemplate('Add a valid sale date to {field}')
      .withStandardReference('IAAO Standard on Verification and Adjustment of Sales 2.1')
      .build(),
      
    ValidationRuleBuilder.create('SALE-REQ-003', 'Property reference is required')
      .withDescription('Every sale must reference a valid property.')
      .withScope(ValidationScope.SALE)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('propertyId', 'parcelId')
      .withPredicate(isNotEmpty)
      .withMessageTemplate('Property reference is missing for sale {entityId}')
      .withSuggestedFixTemplate('Add a valid property ID to {field}')
      .withStandardReference('IAAO Standard on Verification and Adjustment of Sales 2.2')
      .build(),
      
    ValidationRuleBuilder.create('SALE-REQ-004', 'Transaction type is required')
      .withDescription('Every sale must have a valid transaction type.')
      .withScope(ValidationScope.SALE)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('transactionType')
      .withPredicate((value) => isValidEnumValue(value, TransactionType))
      .withMessageTemplate('Transaction type is invalid or missing for sale {entityId}')
      .withSuggestedFixTemplate('Assign a valid transaction type from the approved list')
      .withStandardReference('IAAO Standard on Verification and Adjustment of Sales 3.1')
      .build(),
    
    // Numerical Value Validation for Sales
    ValidationRuleBuilder.create('SALE-NUM-001', 'Sale price must be positive')
      .withDescription('Sale price must be a positive number.')
      .withScope(ValidationScope.SALE)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('salePrice')
      .withPredicate(isPositive)
      .withMessageTemplate('Sale price must be positive, got {value} for sale {entityId}')
      .withSuggestedFixTemplate('Correct the sale price to a positive value')
      .withStandardReference('IAAO Standard on Verification and Adjustment of Sales 3.2')
      .build(),
      
    ValidationRuleBuilder.create('SALE-NUM-002', 'Sale price per square foot must be reasonable')
      .withDescription('Sale price per square foot should be within reasonable market ranges.')
      .withScope(ValidationScope.SALE)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('salePricePerSqft')
      .withPredicate((value, context) => {
        if (value === null || value === undefined) return true;
        if (!isValidNumber(value)) return false;
        
        // Ranges vary widely by market, these are just examples
        // In a real system, these would be configurable by region and property type
        return isInRange(Number(value), 1, 10000);
      })
      .withMessageTemplate('Sale price per square foot ({value}) is outside reasonable range for sale {entityId}')
      .withSuggestedFixTemplate('Verify sale price and building area for accuracy')
      .withStandardReference('IAAO Standard on Verification and Adjustment of Sales 3.3')
      .build(),
      
    ValidationRuleBuilder.create('SALE-NUM-003', 'Assessment ratio must be reasonable')
      .withDescription('The ratio between assessed value at sale and sale price should be reasonable.')
      .withScope(ValidationScope.SALE)
      .withCategory(ValidationCategory.CONSISTENCY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('assessmentRatio')
      .withPredicate((value) => {
        if (value === null || value === undefined) return true;
        if (!isValidNumber(value)) return false;
        
        return isInRange(Number(value), 0.05, 1.5); // Most jurisdictions have ratios between 5% and 150%
      })
      .withMessageTemplate('Assessment ratio ({value}) is outside reasonable range for sale {entityId}')
      .withSuggestedFixTemplate('Verify assessed value and sale price for accuracy')
      .withStandardReference('IAAO Standard on Ratio Studies 5.2')
      .build(),
    
    // Date Validation for Sales
    ValidationRuleBuilder.create('SALE-DATE-001', 'Sale date must be valid')
      .withDescription('Sale date must be a valid date.')
      .withScope(ValidationScope.SALE)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('saleDate')
      .withPredicate(isValidDate)
      .withMessageTemplate('Sale date ({value}) is not a valid date for sale {entityId}')
      .withSuggestedFixTemplate('Correct sale date to a valid date format')
      .withStandardReference('IAAO Standard on Verification and Adjustment of Sales 2.3')
      .build(),
      
    ValidationRuleBuilder.create('SALE-DATE-002', 'Sale date must not be in future')
      .withDescription('Sale dates cannot be in the future.')
      .withScope(ValidationScope.SALE)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('saleDate')
      .withPredicate((value) => isBeforeDate(value, new Date()))
      .withMessageTemplate('Sale date ({value}) is in the future for sale {entityId}')
      .withSuggestedFixTemplate('Correct sale date to a date not in the future')
      .withStandardReference('IAAO Standard on Verification and Adjustment of Sales 2.3')
      .build(),
  ];
  
  const neighborhoodRules = [
    // Required Fields for Neighborhoods
    ValidationRuleBuilder.create('NEIGH-REQ-001', 'Neighborhood code is required')
      .withDescription('Every neighborhood must have a unique code.')
      .withScope(ValidationScope.NEIGHBORHOOD)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.CRITICAL)
      .withApplicableFields('code')
      .withPredicate(isNotEmpty)
      .withMessageTemplate('Neighborhood code is missing for neighborhood {entityId}')
      .withSuggestedFixTemplate('Add a valid neighborhood code to {field}')
      .withStandardReference('IAAO Standard on Neighborhood Delineation 2.1')
      .build(),
      
    ValidationRuleBuilder.create('NEIGH-REQ-002', 'Neighborhood name is required')
      .withDescription('Every neighborhood must have a name for identification.')
      .withScope(ValidationScope.NEIGHBORHOOD)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('name')
      .withPredicate(isNotEmpty)
      .withMessageTemplate('Neighborhood name is missing for neighborhood {entityId}')
      .withSuggestedFixTemplate('Add a valid name to {field}')
      .withStandardReference('IAAO Standard on Neighborhood Delineation 2.2')
      .build(),
      
    ValidationRuleBuilder.create('NEIGH-REQ-003', 'Location data is required')
      .withDescription('Neighborhoods must have basic location information (city, county, state).')
      .withScope(ValidationScope.NEIGHBORHOOD)
      .withCategory(ValidationCategory.COMPLETENESS)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('city', 'county', 'state')
      .withPredicate(isNotEmpty)
      .withMessageTemplate('{field} is missing for neighborhood {entityId}')
      .withSuggestedFixTemplate('Add a valid value to {field}')
      .withStandardReference('IAAO Standard on Neighborhood Delineation 2.3')
      .build(),
    
    // Numerical Value Validation for Neighborhoods
    ValidationRuleBuilder.create('NEIGH-NUM-001', 'Home values must be non-negative')
      .withDescription('Neighborhood home values must be non-negative numbers when present.')
      .withScope(ValidationScope.NEIGHBORHOOD)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MAJOR)
      .withApplicableFields('medianHomeValue', 'avgHomeValue')
      .withPredicate((value) => value === null || value === undefined || isNonNegative(value))
      .withMessageTemplate('{field} must be non-negative, got {value} for neighborhood {entityId}')
      .withSuggestedFixTemplate('Correct {field} to a non-negative value')
      .withStandardReference('IAAO Standard on Neighborhood Delineation 3.2')
      .build(),
      
    ValidationRuleBuilder.create('NEIGH-NUM-002', 'Year built must be valid')
      .withDescription('Average year built must be a valid year.')
      .withScope(ValidationScope.NEIGHBORHOOD)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('avgYearBuilt')
      .withPredicate((value) => {
        if (value === null || value === undefined) return true;
        const currentYear = new Date().getFullYear();
        return isInRange(value, 1600, currentYear);
      })
      .withMessageTemplate('Average year built ({value}) is not valid for neighborhood {entityId}')
      .withSuggestedFixTemplate('Correct average year built to a valid year between 1600 and current year')
      .withStandardReference('IAAO Standard on Neighborhood Delineation 3.3')
      .build(),
      
    ValidationRuleBuilder.create('NEIGH-NUM-003', 'Scores must be in valid range')
      .withDescription('Various neighborhood scores should be within valid ranges.')
      .withScope(ValidationScope.NEIGHBORHOOD)
      .withCategory(ValidationCategory.VALIDITY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('schoolRating', 'walkScore', 'transitScore')
      .withPredicate((value) => {
        if (value === null || value === undefined) return true;
        return isInRange(Number(value), 0, 100);
      })
      .withMessageTemplate('{field} ({value}) is outside valid range for neighborhood {entityId}')
      .withSuggestedFixTemplate('Correct {field} to a value between 0 and 100')
      .withStandardReference('IAAO Standard on Neighborhood Delineation 3.4')
      .build(),
    
    // Consistency Validation for Neighborhoods
    ValidationRuleBuilder.create('NEIGH-CONS-001', 'Total properties and sales should be consistent')
      .withDescription('Total properties should be greater than or equal to total sales.')
      .withScope(ValidationScope.NEIGHBORHOOD)
      .withCategory(ValidationCategory.CONSISTENCY)
      .withSeverity(ValidationSeverity.MINOR)
      .withApplicableFields('totalProperties', 'totalSales')
      .withPredicate((value, context) => {
        const totalProperties = context?.entity?.totalProperties;
        const totalSales = context?.entity?.totalSales;
        
        if (totalProperties === null || totalProperties === undefined || 
            totalSales === null || totalSales === undefined) return true;
            
        return Number(totalProperties) >= Number(totalSales);
      })
      .withMessageTemplate('Total sales exceeds total properties for neighborhood {entityId}')
      .withSuggestedFixTemplate('Verify total properties and total sales for consistency')
      .withStandardReference('IAAO Standard on Neighborhood Delineation 4.1')
      .build(),
  ];
  
  // Register all rules with the validation engine
  validationEngine.addRules(
    ...propertyRules,
    ...salesRules,
    ...neighborhoodRules
  );
  
  return {
    propertyRules,
    salesRules,
    neighborhoodRules,
    allRules: [...propertyRules, ...salesRules, ...neighborhoodRules]
  };
}

// Initialize the rules when the module is loaded
const rules = createIAAOValidationRules();

// Re-export necessary types and instances from the framework
export {
  ValidationScope,
  ValidationCategory,
  ValidationSeverity,
  ValidationEngine,
  ValidationIssue,
  DataQualityReport,
  DataQualityMetrics,
  validationEngine
};

// Export the created rules
export default rules;