/**
 * Property Valuation Service
 * 
 * Client-side service for interacting with the property valuation API
 * Handles sending property data and getting back valuations with external data
 * factors included.
 */

import { apiRequest } from '@/lib/apiClient';

// Types from server
export interface PropertyBaseInfo {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize: number;
  propertyType: string;
  basePrice: number;
}

export interface ValuationModifiers {
  climateScore: number;
  demographicScore: number;
  seasonalityFactor: number;
  weatherRiskFactor: number;
}

export interface PropertyValuation {
  basePrice: number;
  adjustedPrice: number;
  modifiers: ValuationModifiers;
  factors: {
    climateFactors: {
      extremeTemperatures: boolean;
      highPrecipitation: boolean;
      seasonalVariability: boolean;
    };
    demographicFactors: {
      incomeLevel: 'low' | 'moderate' | 'high';
      educationLevel: 'low' | 'moderate' | 'high';
      homeownershipRate: 'low' | 'moderate' | 'high';
    };
    seasonalFactors: {
      currentSeason: 'winter' | 'spring' | 'summer' | 'fall';
      seasonalDemand: 'low' | 'moderate' | 'high';
    };
    weatherRiskFactors: {
      floodRisk: 'low' | 'moderate' | 'high';
      windRisk: 'low' | 'moderate' | 'high';
      extremeWeatherFrequency: 'low' | 'moderate' | 'high';
    };
  };
  confidence: number;
}

export interface ComparableProperty extends PropertyBaseInfo {
  similarityScore: number;
  adjustedPrice: number;
  adjustmentFactors: {
    reason: string;
    amount: number;
    direction: 'up' | 'down';
  }[];
}

/**
 * Get a property valuation with external data factors included
 * @param property Base property information
 * @param weatherData Current weather data (optional)
 * @param climateData Climate data (optional)
 * @param demographicData Demographic data (optional)
 */
export const getPropertyValuation = async (
  property: PropertyBaseInfo,
  weatherData?: any,
  climateData?: any[],
  demographicData?: any
): Promise<PropertyValuation> => {
  try {
    const response = await apiRequest('/api/valuation/property', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        property,
        weatherData,
        climateData,
        demographicData
      }),
    });

    return response;
  } catch (error) {
    console.error('Error getting property valuation:', error);
    throw error;
  }
};

/**
 * Get adjusted comparable properties with similarity scores
 * @param property Subject property
 * @param comparables Array of comparable properties
 * @param climateData Climate data (optional)
 * @param demographicData Demographic data (optional)
 */
export const getComparableProperties = async (
  property: PropertyBaseInfo,
  comparables: PropertyBaseInfo[],
  climateData?: any[],
  demographicData?: any
): Promise<ComparableProperty[]> => {
  try {
    const response = await apiRequest('/api/valuation/comparables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        property,
        comparables,
        climateData,
        demographicData
      }),
    });

    return response;
  } catch (error) {
    console.error('Error getting comparable properties:', error);
    throw error;
  }
};