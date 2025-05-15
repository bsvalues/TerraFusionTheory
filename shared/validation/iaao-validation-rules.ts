/**
 * IAAO Validation Rules
 * 
 * Implementation of property data validation rules based on IAAO
 * (International Association of Assessing Officers) standards.
 * 
 * These rules ensure property data meets professional standards
 * for mass appraisal and property assessment.
 */

import { 
  ValidationRule, 
  DataCategory, 
  RuleType, 
  SeverityLevel,
  DataQualityFramework
} from './data-quality-framework';

/**
 * Initialize IAAO validation rules
 */
export function initializeIAAORules(): void {
  const framework = DataQualityFramework.getInstance();
  
  // Register all IAAO rules
  framework.registerRules([
    // Property Characteristic Rules
    ...getPropertyCharacteristicRules(),
    
    // Sales Data Rules
    ...getSalesDataRules(),
    
    // Neighborhood Data Rules
    ...getNeighborhoodRules(),
    
    // Statistical Analysis Rules
    ...getStatisticalRules()
  ]);
}

/**
 * Property Characteristic Validation Rules
 */
function getPropertyCharacteristicRules(): ValidationRule[] {
  return [
    // Required Fields Rule
    {
      id: 'prop_req_fields',
      name: 'Required Property Fields',
      description: 'Validates that all required property fields are present',
      category: DataCategory.PROPERTY,
      ruleType: RuleType.REQUIRED,
      severity: SeverityLevel.ERROR,
      fields: ['parcelId', 'address', 'buildingArea', 'yearBuilt', 'landArea'],
      validate: (data) => {
        return (
          !!data.parcelId &&
          !!data.address &&
          !!data.buildingArea &&
          !!data.yearBuilt &&
          !!data.landArea
        );
      },
      getMessage: (data) => {
        const missingFields = ['parcelId', 'address', 'buildingArea', 'yearBuilt', 'landArea']
          .filter(field => !data[field]);
        return `Missing required fields: ${missingFields.join(', ')}`;
      }
    },
    
    // Property Type Validation
    {
      id: 'prop_type_valid',
      name: 'Property Type Validation',
      description: 'Validates that property type is a recognized IAAO classification',
      category: DataCategory.PROPERTY,
      ruleType: RuleType.TYPE,
      severity: SeverityLevel.ERROR,
      fields: ['propertyType'],
      validate: (data) => {
        const validTypes = [
          'residential', 'commercial', 'industrial', 'agricultural',
          'vacant', 'exempt', 'special', 'mixed'
        ];
        
        return data.propertyType && validTypes.includes(data.propertyType.toLowerCase());
      },
      getMessage: (data) => {
        return `Invalid property type: ${data.propertyType}`;
      },
      getSuggestion: (data) => {
        return 'Use a standard property type classification';
      }
    },
    
    // Building Area Range
    {
      id: 'prop_bldg_area_range',
      name: 'Building Area Range',
      description: 'Validates that building area is within reasonable range',
      category: DataCategory.PROPERTY,
      ruleType: RuleType.RANGE,
      severity: SeverityLevel.WARNING,
      fields: ['buildingArea'],
      validate: (data) => {
        const area = parseFloat(data.buildingArea);
        return !isNaN(area) && area > 100 && area < 50000;
      },
      getMessage: (data) => {
        const area = parseFloat(data.buildingArea);
        if (isNaN(area)) {
          return 'Building area is not a valid number';
        } else if (area <= 100) {
          return 'Building area is too small (< 100 sq ft)';
        } else {
          return 'Building area is too large (> 50,000 sq ft)';
        }
      },
      getSuggestion: (data) => {
        return 'Verify building area measurement and units';
      }
    },
    
    // Year Built Range
    {
      id: 'prop_year_built_range',
      name: 'Year Built Range',
      description: 'Validates that year built is within reasonable range',
      category: DataCategory.PROPERTY,
      ruleType: RuleType.RANGE,
      severity: SeverityLevel.WARNING,
      fields: ['yearBuilt'],
      validate: (data) => {
        const year = parseInt(data.yearBuilt);
        const currentYear = new Date().getFullYear();
        return !isNaN(year) && year >= 1700 && year <= currentYear;
      },
      getMessage: (data) => {
        const year = parseInt(data.yearBuilt);
        const currentYear = new Date().getFullYear();
        
        if (isNaN(year)) {
          return 'Year built is not a valid number';
        } else if (year < 1700) {
          return 'Year built is too early (< 1700)';
        } else if (year > currentYear) {
          return `Year built is in the future (> ${currentYear})`;
        }
        
        return 'Year built is outside valid range';
      },
      getSuggestion: (data) => {
        return 'Verify year built from property records';
      }
    },
    
    // Building to Land Ratio
    {
      id: 'prop_bldg_land_ratio',
      name: 'Building to Land Ratio',
      description: 'Validates that the building to land ratio is reasonable',
      category: DataCategory.PROPERTY,
      ruleType: RuleType.RELATIONSHIP,
      severity: SeverityLevel.WARNING,
      fields: ['buildingArea', 'landArea'],
      validate: (data) => {
        const buildingArea = parseFloat(data.buildingArea);
        const landArea = parseFloat(data.landArea);
        
        if (isNaN(buildingArea) || isNaN(landArea) || landArea === 0) {
          return false;
        }
        
        const ratio = buildingArea / landArea;
        return ratio > 0.01 && ratio < 3.0;
      },
      getMessage: (data) => {
        const buildingArea = parseFloat(data.buildingArea);
        const landArea = parseFloat(data.landArea);
        
        if (isNaN(buildingArea) || isNaN(landArea)) {
          return 'Building or land area is not a valid number';
        }
        
        if (landArea === 0) {
          return 'Land area cannot be zero';
        }
        
        const ratio = buildingArea / landArea;
        
        if (ratio <= 0.01) {
          return 'Building is too small for the land (ratio < 1%)';
        } else if (ratio >= 3.0) {
          return 'Building is too large for the land (ratio > 300%)';
        }
        
        return 'Building to land ratio is outside reasonable range';
      },
      getSuggestion: (data) => {
        return 'Verify building and land area measurements';
      }
    },
    
    // Address Format
    {
      id: 'prop_address_format',
      name: 'Address Format',
      description: 'Validates that the address follows standard format',
      category: DataCategory.PROPERTY,
      ruleType: RuleType.PATTERN,
      severity: SeverityLevel.WARNING,
      fields: ['address'],
      validate: (data) => {
        if (!data.address) return false;
        
        // Simple regex for basic address validation
        // Should have number, street, and some additional info
        const addressRegex = /^\d+\s+[A-Za-z0-9\s\.,'-]+$/;
        return addressRegex.test(data.address);
      },
      getMessage: (data) => {
        return 'Address format is invalid or incomplete';
      },
      getSuggestion: (data) => {
        return 'Format address as: Number Street, City, State ZIP';
      }
    },
    
    // Condition Rating Range
    {
      id: 'prop_condition_range',
      name: 'Condition Rating Range',
      description: 'Validates that condition rating is within standard range',
      category: DataCategory.PROPERTY,
      ruleType: RuleType.RANGE,
      severity: SeverityLevel.WARNING,
      fields: ['condition'],
      validate: (data) => {
        // Check if condition is in standard range (1-5 or text equivalents)
        if (!data.condition) return true; // Optional field
        
        if (typeof data.condition === 'number') {
          return data.condition >= 1 && data.condition <= 5;
        }
        
        const validConditions = [
          'poor', 'fair', 'average', 'good', 'excellent',
          '1', '2', '3', '4', '5'
        ];
        
        return validConditions.includes(data.condition.toLowerCase());
      },
      getMessage: (data) => {
        return `Invalid condition rating: ${data.condition}`;
      },
      getSuggestion: (data) => {
        return 'Use standard condition scale (1-5 or Poor/Fair/Average/Good/Excellent)';
      }
    },
    
    // Check for Geocoding
    {
      id: 'prop_geocoding',
      name: 'Property Geocoding',
      description: 'Validates that the property has latitude and longitude',
      category: DataCategory.PROPERTY,
      ruleType: RuleType.GEOSPATIAL,
      severity: SeverityLevel.WARNING,
      fields: ['latitude', 'longitude'],
      validate: (data) => {
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        
        return (
          !isNaN(lat) && !isNaN(lng) &&
          lat >= -90 && lat <= 90 &&
          lng >= -180 && lng <= 180
        );
      },
      getMessage: (data) => {
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
          return 'Missing or invalid geocoding coordinates';
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return 'Coordinates outside valid range';
        }
        
        return 'Invalid geocoding data';
      },
      getSuggestion: (data) => {
        return 'Geocode the property using the address';
      }
    }
  ];
}

/**
 * Sales Data Validation Rules
 */
function getSalesDataRules(): ValidationRule[] {
  return [
    // Required Sale Fields
    {
      id: 'sale_req_fields',
      name: 'Required Sale Fields',
      description: 'Validates that all required sale fields are present',
      category: DataCategory.SALE,
      ruleType: RuleType.REQUIRED,
      severity: SeverityLevel.ERROR,
      fields: ['salePrice', 'saleDate', 'propertyId', 'deedType'],
      validate: (data) => {
        return (
          data.salePrice !== undefined &&
          data.salePrice !== null &&
          !!data.saleDate &&
          !!data.propertyId &&
          !!data.deedType
        );
      },
      getMessage: (data) => {
        const missingFields = ['salePrice', 'saleDate', 'propertyId', 'deedType']
          .filter(field => data[field] === undefined || data[field] === null);
        return `Missing required sale fields: ${missingFields.join(', ')}`;
      }
    },
    
    // Sale Price Range
    {
      id: 'sale_price_range',
      name: 'Sale Price Range',
      description: 'Validates that sale price is within reasonable range',
      category: DataCategory.SALE,
      ruleType: RuleType.RANGE,
      severity: SeverityLevel.WARNING,
      fields: ['salePrice'],
      validate: (data) => {
        const price = parseFloat(data.salePrice);
        return !isNaN(price) && price > 100 && price < 100000000;
      },
      getMessage: (data) => {
        const price = parseFloat(data.salePrice);
        
        if (isNaN(price)) {
          return 'Sale price is not a valid number';
        } else if (price <= 100) {
          return 'Sale price is too low (< $100)';
        } else if (price >= 100000000) {
          return 'Sale price is too high (> $100M)';
        }
        
        return 'Sale price outside reasonable range';
      },
      getSuggestion: (data) => {
        return 'Verify sale price from deed records';
      }
    },
    
    // Sale Date Range
    {
      id: 'sale_date_range',
      name: 'Sale Date Range',
      description: 'Validates that sale date is within reasonable range',
      category: DataCategory.SALE,
      ruleType: RuleType.RANGE,
      severity: SeverityLevel.WARNING,
      fields: ['saleDate'],
      validate: (data) => {
        if (!data.saleDate) return false;
        
        const saleDate = new Date(data.saleDate);
        const now = new Date();
        const minDate = new Date();
        minDate.setFullYear(now.getFullYear() - 50); // 50 years ago
        
        return (
          saleDate instanceof Date && !isNaN(saleDate.getTime()) &&
          saleDate >= minDate && saleDate <= now
        );
      },
      getMessage: (data) => {
        if (!data.saleDate) {
          return 'Sale date is missing';
        }
        
        const saleDate = new Date(data.saleDate);
        
        if (!(saleDate instanceof Date) || isNaN(saleDate.getTime())) {
          return 'Sale date is not a valid date';
        }
        
        const now = new Date();
        const minDate = new Date();
        minDate.setFullYear(now.getFullYear() - 50); // 50 years ago
        
        if (saleDate < minDate) {
          return `Sale date is too old (before ${minDate.getFullYear()})`;
        } else if (saleDate > now) {
          return 'Sale date is in the future';
        }
        
        return 'Sale date outside reasonable range';
      },
      getSuggestion: (data) => {
        return 'Verify sale date from deed records';
      }
    },
    
    // Valid Deed Type
    {
      id: 'sale_deed_type',
      name: 'Valid Deed Type',
      description: 'Validates that deed type is standard',
      category: DataCategory.SALE,
      ruleType: RuleType.TYPE,
      severity: SeverityLevel.WARNING,
      fields: ['deedType'],
      validate: (data) => {
        if (!data.deedType) return false;
        
        const validDeedTypes = [
          'warranty', 'quitclaim', 'trustee', 'special warranty',
          'deed of trust', 'executors deed', 'administrators deed',
          'sheriff deed', 'tax deed', 'master deed'
        ];
        
        return validDeedTypes.includes(data.deedType.toLowerCase());
      },
      getMessage: (data) => {
        return `Non-standard deed type: ${data.deedType}`;
      },
      getSuggestion: (data) => {
        return 'Use standard deed type classification';
      }
    },
    
    // Sale Price to Assessed Value Ratio
    {
      id: 'sale_price_assessed_ratio',
      name: 'Sale Price to Assessed Value Ratio',
      description: 'Validates that sale price to assessed value ratio is reasonable',
      category: DataCategory.SALE,
      ruleType: RuleType.RELATIONSHIP,
      severity: SeverityLevel.WARNING,
      fields: ['salePrice', 'assessedValue'],
      validate: (data, context) => {
        const salePrice = parseFloat(data.salePrice);
        const assessedValue = parseFloat(data.assessedValue);
        
        if (isNaN(salePrice) || isNaN(assessedValue) || assessedValue === 0) {
          return false;
        }
        
        const ratio = salePrice / assessedValue;
        return ratio >= 0.5 && ratio <= 2.0;
      },
      getMessage: (data) => {
        const salePrice = parseFloat(data.salePrice);
        const assessedValue = parseFloat(data.assessedValue);
        
        if (isNaN(salePrice) || isNaN(assessedValue)) {
          return 'Sale price or assessed value is not a valid number';
        }
        
        if (assessedValue === 0) {
          return 'Assessed value cannot be zero';
        }
        
        const ratio = salePrice / assessedValue;
        
        if (ratio < 0.5) {
          return 'Sale price is less than 50% of assessed value';
        } else if (ratio > 2.0) {
          return 'Sale price is more than 200% of assessed value';
        }
        
        return 'Sale price to assessed value ratio outside reasonable range';
      },
      getSuggestion: (data) => {
        return 'Verify both sale price and assessed value';
      }
    }
  ];
}

/**
 * Neighborhood Data Validation Rules
 */
function getNeighborhoodRules(): ValidationRule[] {
  return [
    // Required Neighborhood Fields
    {
      id: 'nbhd_req_fields',
      name: 'Required Neighborhood Fields',
      description: 'Validates that all required neighborhood fields are present',
      category: DataCategory.NEIGHBORHOOD,
      ruleType: RuleType.REQUIRED,
      severity: SeverityLevel.ERROR,
      fields: ['neighborhoodId', 'name', 'medianValue'],
      validate: (data) => {
        return (
          !!data.neighborhoodId &&
          !!data.name &&
          data.medianValue !== undefined && data.medianValue !== null
        );
      },
      getMessage: (data) => {
        const missingFields = ['neighborhoodId', 'name', 'medianValue']
          .filter(field => !data[field]);
        return `Missing required neighborhood fields: ${missingFields.join(', ')}`;
      }
    },
    
    // Neighborhood Boundary
    {
      id: 'nbhd_boundary',
      name: 'Neighborhood Boundary',
      description: 'Validates that neighborhood has boundary data',
      category: DataCategory.NEIGHBORHOOD,
      ruleType: RuleType.GEOSPATIAL,
      severity: SeverityLevel.WARNING,
      fields: ['boundary'],
      validate: (data) => {
        // Check if boundary exists and has valid GeoJSON format
        return (
          !!data.boundary &&
          typeof data.boundary === 'object' &&
          data.boundary.type &&
          data.boundary.coordinates &&
          Array.isArray(data.boundary.coordinates)
        );
      },
      getMessage: (data) => {
        if (!data.boundary) {
          return 'Neighborhood boundary is missing';
        } else if (!data.boundary.type || !data.boundary.coordinates) {
          return 'Neighborhood boundary is incomplete';
        } else if (!Array.isArray(data.boundary.coordinates)) {
          return 'Neighborhood boundary coordinates must be an array';
        }
        
        return 'Invalid neighborhood boundary data';
      },
      getSuggestion: (data) => {
        return 'Define neighborhood boundary using GeoJSON format';
      }
    },
    
    // Median Value Range
    {
      id: 'nbhd_median_value_range',
      name: 'Median Value Range',
      description: 'Validates that neighborhood median value is within reasonable range',
      category: DataCategory.NEIGHBORHOOD,
      ruleType: RuleType.RANGE,
      severity: SeverityLevel.WARNING,
      fields: ['medianValue'],
      validate: (data) => {
        const value = parseFloat(data.medianValue);
        return !isNaN(value) && value >= 1000 && value <= 10000000;
      },
      getMessage: (data) => {
        const value = parseFloat(data.medianValue);
        
        if (isNaN(value)) {
          return 'Median value is not a valid number';
        } else if (value < 1000) {
          return 'Median value is too low (< $1,000)';
        } else if (value > 10000000) {
          return 'Median value is too high (> $10M)';
        }
        
        return 'Median value outside reasonable range';
      },
      getSuggestion: (data) => {
        return 'Recalculate median value based on recent sales';
      }
    },
    
    // School District Association
    {
      id: 'nbhd_school_district',
      name: 'School District Association',
      description: 'Validates that neighborhood has school district association',
      category: DataCategory.NEIGHBORHOOD,
      ruleType: RuleType.REQUIRED,
      severity: SeverityLevel.WARNING,
      fields: ['schoolDistrict'],
      validate: (data) => {
        return !!data.schoolDistrict;
      },
      getMessage: (data) => {
        return 'Missing school district association';
      },
      getSuggestion: (data) => {
        return 'Assign school district based on geographic location';
      }
    }
  ];
}

/**
 * Statistical Analysis Rules
 */
function getStatisticalRules(): ValidationRule[] {
  return [
    // Sales Ratio COD (Coefficient of Dispersion)
    {
      id: 'stat_sales_ratio_cod',
      name: 'Sales Ratio COD',
      description: 'Validates that sales ratio COD is within IAAO standards',
      category: DataCategory.MARKET,
      ruleType: RuleType.STATISTICAL,
      severity: SeverityLevel.WARNING,
      fields: ['cod', 'propertyType'],
      validate: (data) => {
        if (data.cod === undefined || data.cod === null) return false;
        
        const cod = parseFloat(data.cod);
        if (isNaN(cod)) return false;
        
        // IAAO standards for COD by property type
        const limits: Record<string, number> = {
          'residential': 15.0,
          'newer_residential': 10.0,
          'income': 20.0,
          'commercial': 20.0,
          'vacant': 25.0,
          'rural': 25.0,
          'other': 20.0
        };
        
        const propertyType = (data.propertyType || 'other').toLowerCase();
        const maxCOD = limits[propertyType] || limits.other;
        
        return cod <= maxCOD;
      },
      getMessage: (data) => {
        if (data.cod === undefined || data.cod === null) {
          return 'COD value is missing';
        }
        
        const cod = parseFloat(data.cod);
        if (isNaN(cod)) {
          return 'COD is not a valid number';
        }
        
        const limits: Record<string, number> = {
          'residential': 15.0,
          'newer_residential': 10.0,
          'income': 20.0,
          'commercial': 20.0,
          'vacant': 25.0,
          'rural': 25.0,
          'other': 20.0
        };
        
        const propertyType = (data.propertyType || 'other').toLowerCase();
        const maxCOD = limits[propertyType] || limits.other;
        
        return `COD of ${cod.toFixed(1)} exceeds IAAO standard of ${maxCOD.toFixed(1)} for ${propertyType} properties`;
      },
      getSuggestion: (data) => {
        return 'Review assessment uniformity and recalibrate valuation models';
      }
    },
    
    // Sales Ratio PRD (Price-Related Differential)
    {
      id: 'stat_sales_ratio_prd',
      name: 'Sales Ratio PRD',
      description: 'Validates that sales ratio PRD is within IAAO standards',
      category: DataCategory.MARKET,
      ruleType: RuleType.STATISTICAL,
      severity: SeverityLevel.WARNING,
      fields: ['prd'],
      validate: (data) => {
        if (data.prd === undefined || data.prd === null) return false;
        
        const prd = parseFloat(data.prd);
        if (isNaN(prd)) return false;
        
        // IAAO standards: PRD should be between 0.98 and 1.03
        return prd >= 0.98 && prd <= 1.03;
      },
      getMessage: (data) => {
        if (data.prd === undefined || data.prd === null) {
          return 'PRD value is missing';
        }
        
        const prd = parseFloat(data.prd);
        if (isNaN(prd)) {
          return 'PRD is not a valid number';
        }
        
        if (prd < 0.98) {
          return `PRD of ${prd.toFixed(2)} is below IAAO standard of 0.98, indicating assessment regression`;
        } else if (prd > 1.03) {
          return `PRD of ${prd.toFixed(2)} exceeds IAAO standard of 1.03, indicating assessment progression`;
        }
        
        return 'PRD outside IAAO standard range';
      },
      getSuggestion: (data) => {
        const prd = parseFloat(data.prd);
        
        if (prd < 0.98) {
          return 'Review assessment methodology for high-value properties';
        } else if (prd > 1.03) {
          return 'Review assessment methodology for low-value properties';
        }
        
        return 'Review overall vertical equity in assessments';
      }
    },
    
    // Minimum Sample Size
    {
      id: 'stat_sample_size',
      name: 'Minimum Sample Size',
      description: 'Validates that statistical analysis has sufficient sample size',
      category: DataCategory.MARKET,
      ruleType: RuleType.STATISTICAL,
      severity: SeverityLevel.WARNING,
      fields: ['sampleSize'],
      validate: (data) => {
        if (data.sampleSize === undefined || data.sampleSize === null) return false;
        
        const sampleSize = parseInt(data.sampleSize);
        if (isNaN(sampleSize)) return false;
        
        // IAAO generally recommends at least 30 samples for statistical reliability
        return sampleSize >= 30;
      },
      getMessage: (data) => {
        if (data.sampleSize === undefined || data.sampleSize === null) {
          return 'Sample size is missing';
        }
        
        const sampleSize = parseInt(data.sampleSize);
        if (isNaN(sampleSize)) {
          return 'Sample size is not a valid number';
        }
        
        return `Sample size of ${sampleSize} is below IAAO recommended minimum of 30`;
      },
      getSuggestion: (data) => {
        return 'Expand analysis timeframe or geographic area to increase sample size';
      }
    },
    
    // Time Adjustment Validation
    {
      id: 'stat_time_adjustment',
      name: 'Time Adjustment Validation',
      description: 'Validates that time adjustments are applied to sales',
      category: DataCategory.MARKET,
      ruleType: RuleType.REQUIRED,
      severity: SeverityLevel.WARNING,
      fields: ['timeAdjustmentApplied'],
      validate: (data) => {
        return data.timeAdjustmentApplied === true;
      },
      getMessage: (data) => {
        return 'Sales have not been adjusted for time/market conditions';
      },
      getSuggestion: (data) => {
        return 'Apply time adjustments based on market trends analysis';
      }
    }
  ];
}