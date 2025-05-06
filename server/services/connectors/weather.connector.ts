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
    // Check if we're using RapidAPI
    const isRapidApi = config.baseUrl.includes('rapidapi.com');
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(isRapidApi ? {
          'x-rapidapi-key': config.apiKey,
          'x-rapidapi-host': 'weatherapi-com.p.rapidapi.com'
        } : {}),
        ...(config.headers || {})
      },
      params: {
        // Only add key as a param for non-RapidAPI services
        ...(isRapidApi ? {} : { key: config.apiKey }),
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
      
      // Check if we're using RapidAPI
      const isRapidApi = (this.config as WeatherConnectorConfig).baseUrl.includes('rapidapi.com');
      
      // Current weather
      if (!query.startDate && !query.endDate) {
        endpoints.push(isRapidApi ? 'current.json' : 'current');
      }
      
      // Forecast (future dates)
      if (!query.startDate || new Date(query.startDate) >= new Date()) {
        endpoints.push(isRapidApi ? 'forecast.json' : 'forecast');
      }
      
      // Historical (past dates)
      if (query.startDate && new Date(query.startDate) < new Date()) {
        endpoints.push(isRapidApi ? 'history.json' : 'historical');
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
              ? { q: `${query.latitude},${query.longitude}` } 
              : {}),
            // For RapidAPI, use 'q' instead of 'location'
            ...(isRapidApi && query.location ? { q: query.location } : {})
          }
        };
        
        // Remove latitude/longitude from params as we converted them to location/q
        if (config.params.latitude) delete config.params.latitude;
        if (config.params.longitude) delete config.params.longitude;
        if (isRapidApi && config.params.location) delete config.params.location;
        
        // For RapidAPI forecast, add days parameter
        if (endpoint.includes('forecast') && isRapidApi) {
          config.params.days = 7; // Default to 7 days forecast
        }
        
        // For RapidAPI history, add date parameter
        if (endpoint.includes('history') && isRapidApi && query.startDate) {
          config.params.dt = query.startDate;
        }
        
        // Make the request
        const response = await this.withTimeout(
          this.client.get(`/${endpoint}`, config),
          this.config.timeout as number
        );
        
        const duration = Date.now() - startTime;
        
        // Log the response
        await this.logResponse('GET', `/${endpoint}`, query, response.data, duration);
        
        // Process and format the response based on endpoint
        if (isRapidApi) {
          // Handle RapidAPI responses
          if (endpoint.includes('current')) {
            result.current = this.formatRapidApiCurrentWeather(response.data);
          } else if (endpoint.includes('forecast')) {
            result.forecast = this.formatRapidApiForecastWeather(response.data);
          } else if (endpoint.includes('history')) {
            result.historical = this.formatRapidApiHistoricalWeather(response.data);
          }
        } else {
          // Handle standard API responses
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
  
  /**
   * Format current weather data from RapidAPI WeatherAPI response
   */
  private formatRapidApiCurrentWeather(data: any): any {
    if (!data || !data.current) {
      return {};
    }
    
    // Map the RapidAPI WeatherAPI response to our standard format
    return {
      temperature: data.current.temp_f, // Use Fahrenheit for imperial
      feelsLike: data.current.feelslike_f,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_mph,
      windDirection: data.current.wind_degree,
      pressure: data.current.pressure_mb,
      precipitation: data.current.precip_in,
      visibility: data.current.vis_miles,
      weatherCode: data.current.condition.code,
      weatherDescription: data.current.condition.text,
      weatherIcon: data.current.condition.icon,
      isDay: data.current.is_day === 1,
      lastUpdated: data.current.last_updated,
      location: data.location ? {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
        lat: data.location.lat,
        lon: data.location.lon,
        localtime: data.location.localtime
      } : undefined
    };
  }
  
  /**
   * Format forecast weather data from RapidAPI WeatherAPI response
   */
  private formatRapidApiForecastWeather(data: any): WeatherForecast[] {
    if (!data || !data.forecast || !data.forecast.forecastday) {
      return [];
    }
    
    // Map the RapidAPI WeatherAPI forecast to our standard format
    return data.forecast.forecastday.map((day: any) => {
      const forecast: WeatherForecast = {
        date: day.date,
        timestamp: new Date(day.date).getTime(),
        temperature: day.day.avgtemp_f,
        feelsLike: day.day.avgtemp_f, // Not directly available, using avg temp
        humidity: day.day.avghumidity,
        windSpeed: day.day.maxwind_mph,
        windDirection: 0, // Not directly available in the daily summary
        precipitation: day.day.totalprecip_in,
        precipitationProbability: day.day.daily_chance_of_rain,
        weatherCode: day.day.condition.code,
        weatherDescription: day.day.condition.text,
        temperatureMin: day.day.mintemp_f,
        temperatureMax: day.day.maxtemp_f,
        sunrise: day.astro.sunrise,
        sunset: day.astro.sunset,
        hourlyForecasts: day.hour ? day.hour.map((hour: any) => ({
          time: hour.time,
          timestamp: new Date(hour.time).getTime(),
          temperature: hour.temp_f,
          feelsLike: hour.feelslike_f,
          humidity: hour.humidity,
          windSpeed: hour.wind_mph,
          windDirection: hour.wind_degree,
          precipitation: hour.precip_in,
          precipitationProbability: hour.chance_of_rain,
          weatherCode: hour.condition.code,
          weatherDescription: hour.condition.text,
          weatherIcon: hour.condition.icon
        })) : []
      };
      
      return forecast;
    });
  }
  
  /**
   * Format historical weather data from RapidAPI WeatherAPI response
   */
  private formatRapidApiHistoricalWeather(data: any): HistoricalWeather[] {
    if (!data || !data.forecast || !data.forecast.forecastday) {
      return [];
    }
    
    // Map the RapidAPI WeatherAPI history (uses the same structure as forecast) to our standard format
    return data.forecast.forecastday.map((day: any) => {
      const historical: HistoricalWeather = {
        date: day.date,
        timestamp: new Date(day.date).getTime(),
        temperature: {
          avg: day.day.avgtemp_f,
          min: day.day.mintemp_f,
          max: day.day.maxtemp_f
        },
        precipitation: day.day.totalprecip_in,
        humidity: day.day.avghumidity,
        windSpeed: day.day.maxwind_mph,
        weatherCode: day.day.condition.code,
        weatherDescription: day.day.condition.text,
        hourlyData: day.hour ? day.hour.map((hour: any) => ({
          time: hour.time,
          timestamp: new Date(hour.time).getTime(),
          temperature: hour.temp_f,
          feelsLike: hour.feelslike_f,
          humidity: hour.humidity,
          windSpeed: hour.wind_mph,
          windDirection: hour.wind_degree,
          precipitation: hour.precip_in,
          weatherCode: hour.condition.code,
          weatherDescription: hour.condition.text
        })) : []
      };
      
      return historical;
    });
  }
}