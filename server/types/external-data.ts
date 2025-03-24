/**
 * Types for external data sources used in the application
 */

/**
 * Weather data from weather API
 */
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherDescription: string;
  weatherCode: number;
  precipitation?: number;
  uvIndex?: number;
  visibility?: number;
  pressure?: number;
}

/**
 * Climate data for monthly normals
 */
export interface ClimateData {
  month: number; // 1-12 for January-December
  temperatureMin: number;
  temperatureMax: number;
  temperatureAvg: number;
  precipitationAvg: number;
  snowfallAvg?: number;
  humidityAvg?: number;
}

/**
 * Demographic data from census
 */
export interface DemographicData {
  geographyId: string;
  geographyName: string;
  geographyType: string; // county, tract, block group, etc.
  totalPopulation: number;
  medianAge: number;
  medianHouseholdIncome: number;
  perCapitaIncome?: number;
  povertyRate?: number;
  educationHighSchool: number; // % with high school degree
  educationBachelor: number; // % with bachelor's degree
  householdUnits?: number;
  householdSize?: number;
  homeownershipRate: number; // % owner-occupied
  medianHomeValue: number;
  medianGrossRent: number;
  commuteTimeAvg?: number;
  unemploymentRate?: number;
}

/**
 * Extended property data with external enrichment
 */
export interface EnrichedPropertyData {
  propertyId: string;
  address: string;
  weather?: WeatherData;
  climate?: ClimateData[];
  demographics?: DemographicData;
  valuation?: {
    baseValue: number;
    adjustedValue: number;
    confidence: number;
    factors: Record<string, any>;
  };
  nearbyAmenities?: Array<{
    name: string;
    type: string;
    distance: number;
    rating?: number;
  }>;
  floodRisk?: 'low' | 'moderate' | 'high';
  walkabilityScore?: number;
  transitScore?: number;
}