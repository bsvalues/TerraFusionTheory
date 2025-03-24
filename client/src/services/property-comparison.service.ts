/**
 * Property Comparison Service
 * 
 * This service provides functions for retrieving property data,
 * generating comparison metrics, and enhancing property data
 * with additional contextual information.
 */

import axios from 'axios';
import { PropertyForComparison } from '@/context/AdvancedComparisonContext';

/**
 * Interface for API response containing property listings
 */
interface PropertyListingResponse {
  properties: PropertyForComparison[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Interface for detailed property information
 */
interface PropertyDetailResponse extends PropertyForComparison {
  description: string;
  features: string[];
  schools: Array<{
    name: string;
    type: string;
    rating: number;
    distance: number;
  }>;
  amenities: Array<{
    name: string;
    type: string;
    distance: number;
  }>;
  taxes: {
    annual: number;
    rate: number;
  };
  marketTrends: {
    priceHistory: Array<{
      date: string;
      price: number;
    }>;
    comparableSales: number;
    medianDaysOnMarket: number;
    medianPricePerSqFt: number;
  };
}

/**
 * Interface for property comparison query parameters
 */
interface PropertyComparisonQueryParams {
  propertyIds?: string[];
  city?: string;
  zipCode?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  propertyTypes?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get property listings for comparison
 */
export const getPropertiesForComparison = async (params: PropertyComparisonQueryParams): Promise<PropertyListingResponse> => {
  try {
    const response = await axios.get('/api/properties', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching properties for comparison:', error);
    throw error;
  }
};

/**
 * Get detailed property information by ID
 */
export const getPropertyById = async (propertyId: string): Promise<PropertyDetailResponse> => {
  try {
    const response = await axios.get(`/api/properties/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching property with ID ${propertyId}:`, error);
    throw error;
  }
};

/**
 * Enhance property data with calculated metrics
 */
export const enhancePropertyData = (property: PropertyForComparison): PropertyForComparison => {
  const enhanced = { ...property };
  
  // Calculate price per square foot if not already provided
  if (property.price && property.squareFeet && !property.pricePerSqFt) {
    enhanced.pricePerSqFt = Math.round(property.price / property.squareFeet);
  }
  
  // Estimate maintenance costs if not provided (rough estimate based on property age and size)
  if (!enhanced.estimatedMaintenance && property.squareFeet && property.yearBuilt) {
    const age = new Date().getFullYear() - property.yearBuilt;
    const baseRate = 1.5; // $1.50 per square foot baseline for annual maintenance
    const ageFactor = Math.min(2, 1 + (age / 50)); // Age increases maintenance, max double for very old homes
    enhanced.estimatedMaintenance = Math.round(property.squareFeet * baseRate * ageFactor);
  }
  
  // Calculate tax rate if not provided (if we have price and taxes)
  if (property.price && !enhanced.taxRate && property.taxRate !== 0) {
    // Estimate at 1.1% if unknown (US average)
    enhanced.taxRate = 1.1;
  }
  
  // Estimate insurance cost if not provided
  if (!enhanced.insuranceCost && property.price) {
    // National average is roughly $3.50 per $1000 of home value
    enhanced.insuranceCost = Math.round((property.price / 1000) * 3.5);
  }
  
  return enhanced;
};

/**
 * Get recommended comparable properties based on a reference property
 */
export const getComparableProperties = async (
  referencePropertyId: string, 
  count: number = 3
): Promise<PropertyForComparison[]> => {
  try {
    const response = await axios.get(`/api/properties/${referencePropertyId}/comparables`, {
      params: { count }
    });
    return response.data.properties;
  } catch (error) {
    console.error('Error fetching comparable properties:', error);
    throw error;
  }
};

/**
 * Save comparison to user account
 */
export const saveComparison = async (
  comparisonName: string,
  propertyIds: string[]
): Promise<{ id: string }> => {
  try {
    const response = await axios.post('/api/comparisons', {
      name: comparisonName,
      propertyIds
    });
    return response.data;
  } catch (error) {
    console.error('Error saving comparison:', error);
    throw error;
  }
};

/**
 * Get saved comparisons for current user
 */
export const getSavedComparisons = async (): Promise<Array<{
  id: string;
  name: string;
  createdAt: string;
  propertyIds: string[];
}>> => {
  try {
    const response = await axios.get('/api/comparisons');
    return response.data.comparisons;
  } catch (error) {
    console.error('Error fetching saved comparisons:', error);
    throw error;
  }
};

/**
 * Get economic indicators relevant to real estate in the area
 */
export const getEconomicIndicators = async (
  location: { city: string; state: string } | { zipCode: string }
): Promise<{
  mortgageRates: { rate: number; type: string }[];
  employmentRate: number;
  incomeGrowth: number;
  populationGrowth: number;
  constructionPermits: number;
  housingAffordability: number;
}> => {
  try {
    const response = await axios.get('/api/economic-indicators', { params: location });
    return response.data;
  } catch (error) {
    console.error('Error fetching economic indicators:', error);
    throw error;
  }
};

/**
 * Generate investment analysis for a property
 */
export const generateInvestmentAnalysis = async (
  propertyId: string,
  parameters: {
    downPaymentPercent: number;
    interestRate: number;
    loanTermYears: number;
    annualPropertyTaxRate: number;
    monthlyRentalIncome: number;
    vacancyRate: number;
    monthlyHOA?: number;
    annualInsurance?: number;
    annualMaintenancePercent?: number;
    annualAppreciationRate?: number;
    sellingCostsPercent?: number;
    holdingPeriodYears?: number;
  }
): Promise<{
  monthlyCosts: {
    mortgage: number;
    propertyTax: number;
    insurance: number;
    hoa: number;
    maintenance: number;
    totalExpenses: number;
  };
  annualCashFlow: number;
  capRate: number;
  cashOnCash: number;
  breakEvenPoint: number;
  rentToPrice: number;
  returnOnInvestment: Array<{
    year: number;
    cashFlow: number;
    equity: number;
    propertyValue: number;
    totalReturn: number;
    returnRate: number;
  }>;
}> => {
  try {
    const response = await axios.post(`/api/properties/${propertyId}/investment-analysis`, parameters);
    return response.data;
  } catch (error) {
    console.error('Error generating investment analysis:', error);
    throw error;
  }
};

/**
 * Generate sample properties for development/testing
 */
export const getSampleProperties = (): PropertyForComparison[] => {
  return [
    {
      id: 'prop-1',
      address: '2204 Hill Dr, Grandview, WA 98930',
      price: 350000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1850,
      lotSize: 7500,
      yearBuilt: 2010,
      propertyType: 'Single Family',
      pricePerSqFt: 189,
      valueGrowthRate: 4.2,
      walkabilityScore: 8.2,
      schoolRating: 7.5,
      neighborhoodRating: 8.1,
      taxRate: 1.05,
      insuranceCost: 1200,
      estimatedMaintenance: 3700,
      energyEfficiencyScore: 7.5,
      proximityToAmenities: {
        shopping: 1.2,
        dining: 0.8,
        parks: 1.5,
        schools: 0.6,
        healthcare: 2.3,
        transportation: 1.1
      },
      naturalHazardRisk: {
        flood: 0.02,
        fire: 0.05,
        earthquake: 0.03,
        overall: 0.04
      },
      investmentMetrics: {
        capRate: 5.8,
        cashOnCash: 6.2,
        roi: 12.5,
        breakEvenPoint: 5.2,
        rentalYield: 5.4
      }
    },
    {
      id: 'prop-2',
      address: '789 Oak Ln, Yakima, WA 98901',
      price: 425000,
      bedrooms: 4,
      bathrooms: 2.5,
      squareFeet: 2200,
      lotSize: 9000,
      yearBuilt: 2005,
      propertyType: 'Single Family',
      pricePerSqFt: 193,
      valueGrowthRate: 3.8,
      walkabilityScore: 7.8,
      schoolRating: 8.3,
      neighborhoodRating: 7.9,
      taxRate: 1.12,
      insuranceCost: 1450,
      estimatedMaintenance: 4200,
      energyEfficiencyScore: 6.8,
      proximityToAmenities: {
        shopping: 0.9,
        dining: 1.2,
        parks: 1.1,
        schools: 0.4,
        healthcare: 1.8,
        transportation: 0.7
      },
      naturalHazardRisk: {
        flood: 0.03,
        fire: 0.02,
        earthquake: 0.05,
        overall: 0.03
      },
      investmentMetrics: {
        capRate: 5.2,
        cashOnCash: 5.5,
        roi: 11.3,
        breakEvenPoint: 6.1,
        rentalYield: 4.9
      }
    },
    {
      id: 'prop-3',
      address: '1024 Cedar Rd, Sunnyside, WA 98944',
      price: 295000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1650,
      lotSize: 6500,
      yearBuilt: 1995,
      propertyType: 'Single Family',
      pricePerSqFt: 179,
      valueGrowthRate: 2.9,
      walkabilityScore: 7.0,
      schoolRating: 6.8,
      neighborhoodRating: 7.2,
      taxRate: 0.95,
      insuranceCost: 1050,
      estimatedMaintenance: 3900,
      energyEfficiencyScore: 5.9,
      proximityToAmenities: {
        shopping: 1.5,
        dining: 1.7,
        parks: 0.8,
        schools: 0.9,
        healthcare: 2.5,
        transportation: 1.4
      },
      naturalHazardRisk: {
        flood: 0.06,
        fire: 0.03,
        earthquake: 0.04,
        overall: 0.05
      },
      investmentMetrics: {
        capRate: 6.4,
        cashOnCash: 6.9,
        roi: 13.8,
        breakEvenPoint: 4.7,
        rentalYield: 6.2
      }
    }
  ];
};

/**
 * Get sample investment metrics for a property
 */
export const getSampleInvestmentMetrics = (propertyId: string) => {
  const properties = getSampleProperties();
  const property = properties.find(p => p.id === propertyId);
  
  if (!property) {
    throw new Error(`Property with ID ${propertyId} not found`);
  }
  
  return property.investmentMetrics;
};