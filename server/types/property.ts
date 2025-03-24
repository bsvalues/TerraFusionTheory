/**
 * Property Data Types
 * 
 * This file defines common property data interfaces used throughout the application.
 */

/**
 * Basic property listing data
 */
export interface PropertyListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt?: number;
  lotSize?: number;
  propertyType?: string;
  description?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  listingDate?: string;
  daysOnMarket?: number;
  status?: 'active' | 'pending' | 'sold' | 'off-market';
  photos?: string[];
  listingAgent?: string;
  mlsNumber?: string;
  features?: string[];
  schools?: {
    elementary?: string;
    middle?: string;
    high?: string;
    elementaryRating?: number;
    middleRating?: number;
    highRating?: number;
  };
  walkScore?: number;
  taxAssessedValue?: number;
  taxYear?: number;
  lastSoldPrice?: number;
  lastSoldDate?: string;
  zoning?: string;
}

/**
 * Enhanced property data with additional details
 */
export interface PropertyData extends PropertyListing {
  // Construction details
  constructionQuality?: 'Excellent' | 'Good' | 'Average' | 'Fair' | 'Poor';
  foundation?: string;
  roofType?: string;
  exteriorMaterial?: string;
  heatingType?: string;
  coolingType?: string;
  utilities?: string[];
  
  // Property characteristics
  stories?: number;
  garageSize?: number;
  basement?: boolean;
  basementFinished?: boolean;
  attic?: boolean;
  atticFinished?: boolean;
  pool?: boolean;
  spa?: boolean;
  fireplace?: number;
  waterfront?: boolean;
  view?: string;
  
  // Assessment/appraisal data
  assessedLandValue?: number;
  assessedImprovementValue?: number;
  effectiveAge?: number;
  economicLife?: number;
  physicalDepreciation?: number;
  functionalObsolescence?: number;
  externalObsolescence?: number;
  replacementCost?: number;
  incomeApproachValue?: number;
  salesComparisonValue?: number;
  costApproachValue?: number;
  finalValueEstimate?: number;
  
  // Land data
  lotDimensions?: string;
  lotShape?: string;
  topography?: string;
  siteUtilities?: string[];
  
  // Market data
  marketArea?: string;
  comparableSales?: string[];
  pricePerSqFt?: number;
  appreciationRate?: number;
  marketTrends?: string;
  
  // Additional flags and indicators
  isUnderAssessed?: boolean;
  isOverAssessed?: boolean;
  isUnique?: boolean;
  hasZoningIssues?: boolean;
  isInDecliningNeighborhood?: boolean;
  proximityToNegativeExternality?: boolean;
  hasIrregularFloorPlan?: boolean;
  hasOutdatedFeatures?: boolean;
  systemsAge?: number;
}

/**
 * Property model configuration for mass appraisal
 */
export interface PropertyModel {
  modelId: string;
  modelName: string;
  propertyType: string;
  neighborhood?: string;
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  sampleSize: number;
  created: Date;
  updated?: Date;
}

/**
 * Property valuation result
 */
export interface PropertyValuation {
  propertyId: string;
  address: string;
  estimatedValue: number;
  confidenceScore: number;
  valueRange: [number, number];
  comparableProperties?: string[];
  adjustmentsApplied?: Record<string, number>;
  modelId?: string;
  valuationDate: Date;
  approaches: {
    salesComparison?: {
      value: number;
      adjustedComps: Array<{
        address: string;
        salePrice: number;
        adjustedPrice: number;
        netAdjustment: number;
        dateOfSale: string;
      }>;
      weight?: number;
    };
    costApproach?: {
      value: number;
      replacementCost: number;
      depreciation: number;
      landValue: number;
      weight?: number;
    };
    incomeApproach?: {
      value: number;
      monthlyRent: number;
      grossRentMultiplier: number;
      capRate: number;
      noi: number;
      weight?: number;
    };
  };
}