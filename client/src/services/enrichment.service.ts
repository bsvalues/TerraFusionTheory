/**
 * Enrichment Service
 * 
 * This service handles external data enrichment services for property data
 * including weather data, climate data, and demographic information.
 */

import { apiRequest } from '@/lib/queryClient';

/**
 * Weather data interface
 */
export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherDescription: string;
  weatherCode: number;
}

/**
 * Monthly climate data interface
 */
export interface ClimateData {
  month: number;
  temperatureMin: number;
  temperatureAvg: number;
  temperatureMax: number;
  precipitationAvg: number;
}

/**
 * Demographic data interface
 */
export interface DemographicData {
  geographyId: string;
  geographyName: string;
  geographyType: string;
  year: string;
  totalPopulation: number;
  medianAge: number;
  medianHouseholdIncome: number;
  perCapitaIncome: number;
  povertyRate: number;
  educationHighSchool: number;
  educationBachelor: number;
  householdUnits: number;
  householdSize: number;
  ownerOccupiedUnits: number;
  renterOccupiedUnits: number;
  homeownershipRate: number; // Calculated field
  medianHomeValue: number;
  medianGrossRent: number;
}

/**
 * Enrichment service class for handling external data sources
 */
class EnrichmentService {
  /**
   * Get current weather data for a location
   * @param location - City, state or address
   * @returns Weather data
   */
  async getCurrentWeather(location: string): Promise<WeatherData> {
    return apiRequest(`/api/connectors/weather/current?location=${encodeURIComponent(location)}`);
  }
  
  /**
   * Get climate normals (monthly averages) for a location
   * @param location - City, state or address
   * @returns Array of monthly climate data
   */
  async getClimateNormals(location: string): Promise<ClimateData[]> {
    return apiRequest(`/api/connectors/weather/climate?location=${encodeURIComponent(location)}`);
  }
  
  /**
   * Get demographic data for a location by FIPS codes
   * @param state - State FIPS code (e.g., "53" for Washington)
   * @param county - County FIPS code (optional)
   * @param tract - Census tract code (optional)
   * @returns Demographic data for the requested geography
   */
  async getDemographicData(
    state: string, 
    county?: string, 
    tract?: string
  ): Promise<DemographicData[]> {
    let url = `/api/connectors/census/demographics?state=${encodeURIComponent(state)}`;
    
    if (county) {
      url += `&county=${encodeURIComponent(county)}`;
    }
    
    if (tract) {
      url += `&tract=${encodeURIComponent(tract)}`;
    }
    
    return apiRequest(url);
  }
  
  /**
   * Get property flood risk data
   * @param latitude - Property latitude
   * @param longitude - Property longitude
   * @returns Flood risk assessment data
   */
  async getFloodRiskData(latitude: number, longitude: number): Promise<any> {
    return apiRequest(`/api/connectors/weather/flood-risk?lat=${latitude}&lon=${longitude}`);
  }
}

export default new EnrichmentService();