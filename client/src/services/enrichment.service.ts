import axios from 'axios';

/**
 * Service for enriching property data with weather and demographic information
 */
export class EnrichmentService {
  /**
   * Get current weather for a location
   * @param location Location string (e.g., "Grandview,WA")
   */
  static async getCurrentWeather(location: string) {
    try {
      const response = await axios.post(`/api/connectors/weather-data/query/weather`, {
        location,
        includeHourly: false,
        includeDaily: false,
        includeAlerts: true
      });
      
      return response.data.data?.current;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw error;
    }
  }

  /**
   * Get weather forecast for a location
   * @param location Location string (e.g., "Grandview,WA")
   * @param days Number of days to forecast
   */
  static async getWeatherForecast(location: string, days: number = 7) {
    try {
      const response = await axios.post(`/api/connectors/weather-data/query/weather`, {
        location,
        includeHourly: false,
        includeDaily: true,
        days
      });
      
      return response.data.data?.forecast;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw error;
    }
  }

  /**
   * Get climate normals for a location
   * @param location Location string (e.g., "Grandview,WA")
   */
  static async getClimateNormals(location: string) {
    try {
      const response = await axios.get(`/api/connectors/weather-data/climate`, {
        params: { location }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching climate normals:', error);
      throw error;
    }
  }

  /**
   * Get demographic data for a location
   * @param state State FIPS code or name
   * @param county County FIPS code or name
   * @param tract Census tract code (optional)
   */
  static async getDemographicData(state: string, county?: string, tract?: string) {
    try {
      const response = await axios.get(`/api/connectors/census-data/demographics`, {
        params: { 
          state, 
          county, 
          tract,
          geographyType: tract ? 'tract' : county ? 'county' : 'state'
        }
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching demographic data:', error);
      throw error;
    }
  }

  /**
   * Get housing data for an area
   * @param state State FIPS code or name
   * @param county County FIPS code or name
   * @param tract Census tract code (optional)
   */
  static async getHousingData(state: string, county?: string, tract?: string) {
    try {
      const response = await axios.post(`/api/connectors/census-data/query/census`, {
        dataset: 'acs/acs5/profile',
        geographyType: tract ? 'tract' : county ? 'county' : 'state',
        state,
        county,
        geographyIds: tract ? [tract] : undefined,
        variables: [
          'DP04_0001E', // Total housing units
          'DP04_0002E', // Occupied housing units
          'DP04_0003E', // Vacant housing units
          'DP04_0046PE', // Homeownership rate
          'DP04_0089E', // Median home value
          'DP04_0134E' // Median gross rent
        ]
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching housing data:', error);
      throw error;
    }
  }
}

export default EnrichmentService;