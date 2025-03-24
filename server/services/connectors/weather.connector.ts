import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BaseDataConnector, ConnectorConfig } from './baseConnector';

/**
 * Weather Data Connector Configuration
 */
export interface WeatherConnectorConfig extends ConnectorConfig {
  baseUrl: string;
  apiKey: string;
  defaultLocation?: string;
  units?: 'imperial' | 'metric';
}

/**
 * Weather Forecast Data structure
 */
export interface WeatherForecast {
  date: string;
  timestamp: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  [key: string]: any;
}

/**
 * Historical Weather Data structure
 */
export interface HistoricalWeather {
  date: string;
  timestamp: number;
  temperature: {
    avg: number;
    min: number;
    max: number;
  };
  precipitation: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  [key: string]: any;
}

/**
 * Climate Data structure
 */
export interface ClimateData {
  month: number;
  temperatureAvg: number;
  temperatureMin: number;
  temperatureMax: number;
  precipitationAvg: number;
  humidityAvg: number;
  snowfallAvg: number;
  [key: string]: any;
}

/**
 * Weather API Query Parameters
 */
export interface WeatherQueryParams {
  location?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  units?: 'imperial' | 'metric';
  includeHourly?: boolean;
  includeDaily?: boolean;
  includeAlerts?: boolean;
  [key: string]: any;
}

/**
 * Implementation of connector for Weather Data APIs
 */
export class WeatherConnector extends BaseDataConnector {
  private client: AxiosInstance;

  constructor(name: string, config: WeatherConnectorConfig) {
    super(name, 'weather', config);
    
    // Validate required config
    if (!config.baseUrl) {
      throw new Error('Weather connector requires baseUrl in configuration');
    }
    
    if (!config.apiKey) {
      throw new Error('Weather connector requires apiKey in configuration');
    }
    
    // Create Axios client with base configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      },
      params: {
        key: config.apiKey,
        units: config.units || 'imperial'
      }
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const message = this.extractErrorMessage(error.response.data) || 'API Error';
          throw new Error(`Weather API Error (${error.response.status}): ${message}`);
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response received from Weather API');
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error(`Error in Weather request: ${error.message}`);
        }
      }
    );
  }
  
  /**
   * Test connection to the Weather API
   */
  async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Log the request
      await this.logRequest('GET', '/current', {});
      
      // Get current weather for a test location
      const testLocation = (this.config as WeatherConnectorConfig).defaultLocation || 'Seattle,WA';
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get('/current', {
          params: { location: testLocation }
        }),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', '/current', { location: testLocation }, response.data, duration);
      
      return response.status === 200 && response.data?.success !== false;
    } catch (error) {
      await this.logError('GET', '/current', {}, error);
      return false;
    }
  }
  
  /**
   * Fetch weather data based on query parameters
   */
  async fetchData(query: WeatherQueryParams): Promise<{
    current?: any;
    forecast?: WeatherForecast[];
    historical?: HistoricalWeather[];
  }> {
    try {
      const startTime = Date.now();
      
      // Determine which endpoints to query based on the request
      const endpoints = [];
      let result: any = {};
      
      // Validate location parameter
      if (!query.location && !(query.latitude && query.longitude)) {
        query.location = (this.config as WeatherConnectorConfig).defaultLocation;
        
        if (!query.location) {
          throw new Error('Location parameter is required');
        }
      }
      
      // Current weather
      if (!query.startDate && !query.endDate) {
        endpoints.push('current');
      }
      
      // Forecast (future dates)
      if (!query.startDate || new Date(query.startDate) >= new Date()) {
        endpoints.push('forecast');
      }
      
      // Historical (past dates)
      if (query.startDate && new Date(query.startDate) < new Date()) {
        endpoints.push('historical');
      }
      
      // Execute all required requests
      for (const endpoint of endpoints) {
        // Log the request
        await this.logRequest('GET', `/${endpoint}`, query);
        
        // Prepare request configuration
        const config: AxiosRequestConfig = {
          params: {
            ...query,
            // Convert lat/lon to required format if provided
            ...(query.latitude && query.longitude 
              ? { location: `${query.latitude},${query.longitude}` } 
              : {})
          }
        };
        
        // Remove latitude/longitude from params as we converted them to location
        if (config.params.latitude) delete config.params.latitude;
        if (config.params.longitude) delete config.params.longitude;
        
        // Make the request
        const response = await this.withTimeout(
          this.client.get(`/${endpoint}`, config),
          this.config.timeout as number
        );
        
        const duration = Date.now() - startTime;
        
        // Log the response
        await this.logResponse('GET', `/${endpoint}`, query, response.data, duration);
        
        // Process and format the response based on endpoint
        switch (endpoint) {
          case 'current':
            result.current = this.formatCurrentWeather(response.data);
            break;
          case 'forecast':
            result.forecast = this.formatForecastWeather(response.data);
            break;
          case 'historical':
            result.historical = this.formatHistoricalWeather(response.data);
            break;
        }
      }
      
      return result;
    } catch (error) {
      await this.logError('GET', '/weather', query, error);
      throw error;
    }
  }
  
  /**
   * Get climate normals for a location
   */
  async getClimateNormals(location: string): Promise<ClimateData[]> {
    try {
      const startTime = Date.now();
      const endpoint = '/climate';
      
      // Log the request
      await this.logRequest('GET', endpoint, { location });
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint, {
          params: { location }
        }),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, { location }, response.data, duration);
      
      // Format and return the climate data
      return this.formatClimateData(response.data);
    } catch (error) {
      await this.logError('GET', '/climate', { location }, error);
      throw error;
    }
  }
  
  /**
   * Get severe weather events in an area
   */
  async getSevereWeatherEvents(params: {
    location?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    startDate?: string;
    endDate?: string;
    eventTypes?: string[];
  }): Promise<any[]> {
    try {
      const startTime = Date.now();
      const endpoint = '/events';
      
      // Validate location parameter
      if (!params.location && !(params.latitude && params.longitude)) {
        params.location = (this.config as WeatherConnectorConfig).defaultLocation;
        
        if (!params.location) {
          throw new Error('Location parameter is required');
        }
      }
      
      // Log the request
      await this.logRequest('GET', endpoint, params);
      
      // Prepare request configuration
      const config: AxiosRequestConfig = {
        params: {
          ...params,
          // Convert lat/lon to required format if provided
          ...(params.latitude && params.longitude 
            ? { location: `${params.latitude},${params.longitude}` } 
            : {})
        }
      };
      
      // Remove latitude/longitude from params as we converted them to location
      if (config.params.latitude) delete config.params.latitude;
      if (config.params.longitude) delete config.params.longitude;
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint, config),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, params, response.data, duration);
      
      // Format and return the events data
      return response.data?.events || [];
    } catch (error) {
      await this.logError('GET', '/events', params, error);
      throw error;
    }
  }
  
  /**
   * Get available data models/tables
   */
  async getAvailableModels(): Promise<string[]> {
    return ['current', 'forecast', 'historical', 'climate', 'events'];
  }
  
  /**
   * Get schema for a specific model/table
   */
  async getModelSchema(modelName: string): Promise<any> {
    // Return schema based on the model name
    switch (modelName) {
      case 'current':
        return {
          type: 'object',
          properties: {
            temperature: { type: 'number' },
            feelsLike: { type: 'number' },
            humidity: { type: 'number' },
            windSpeed: { type: 'number' },
            windDirection: { type: 'number' },
            weatherCode: { type: 'number' },
            weatherDescription: { type: 'string' }
          }
        };
      case 'forecast':
        return {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date-time' },
              timestamp: { type: 'number' },
              temperature: { type: 'number' },
              feelsLike: { type: 'number' },
              humidity: { type: 'number' },
              windSpeed: { type: 'number' },
              precipitation: { type: 'number' },
              precipitationProbability: { type: 'number' },
              weatherCode: { type: 'number' },
              weatherDescription: { type: 'string' }
            }
          }
        };
      case 'historical':
        return {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date' },
              timestamp: { type: 'number' },
              temperature: { 
                type: 'object',
                properties: {
                  avg: { type: 'number' },
                  min: { type: 'number' },
                  max: { type: 'number' }
                }
              },
              precipitation: { type: 'number' },
              humidity: { type: 'number' },
              windSpeed: { type: 'number' },
              weatherCode: { type: 'number' },
              weatherDescription: { type: 'string' }
            }
          }
        };
      case 'climate':
        return {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              month: { type: 'number' },
              temperatureAvg: { type: 'number' },
              temperatureMin: { type: 'number' },
              temperatureMax: { type: 'number' },
              precipitationAvg: { type: 'number' },
              humidityAvg: { type: 'number' },
              snowfallAvg: { type: 'number' }
            }
          }
        };
      case 'events':
        return {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              severity: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              location: { type: 'string' },
              description: { type: 'string' }
            }
          }
        };
      default:
        return null;
    }
  }
  
  /**
   * Format current weather data from API response
   */
  private formatCurrentWeather(data: any): any {
    // Implement data mapping from the specific API to our standard format
    // This will be customized based on the actual API being used
    return data?.current || data;
  }
  
  /**
   * Format forecast weather data from API response
   */
  private formatForecastWeather(data: any): WeatherForecast[] {
    // Implement data mapping from the specific API to our standard format
    // This will be customized based on the actual API being used
    return data?.forecast || [];
  }
  
  /**
   * Format historical weather data from API response
   */
  private formatHistoricalWeather(data: any): HistoricalWeather[] {
    // Implement data mapping from the specific API to our standard format
    // This will be customized based on the actual API being used
    return data?.historical || [];
  }
  
  /**
   * Format climate data from API response
   */
  private formatClimateData(data: any): ClimateData[] {
    // Implement data mapping from the specific API to our standard format
    // This will be customized based on the actual API being used
    return data?.climate || [];
  }
}