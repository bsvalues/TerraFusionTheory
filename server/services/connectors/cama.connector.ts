import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BaseDataConnector, ConnectorConfig } from './baseConnector';

/**
 * Specific configuration for CAMA system connectors
 */
export interface CAMAConnectorConfig extends ConnectorConfig {
  baseUrl: string;
  apiKey: string;
  county?: string;
  state?: string;
  version?: string;
  useAdvancedFiltering?: boolean;
}

/**
 * Property Assessment Data structure
 */
export interface PropertyData {
  id: string;
  parcelId: string;
  address: string;
  owner: string;
  assessedValue: number;
  marketValue: number;
  landValue: number;
  improvementValue: number;
  assessmentYear: number;
  propertyClass: string;
  acres: number;
  squareFeet: number;
  zoning?: string;
  neighborhood?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

/**
 * CAMA System API Query parameters
 */
export interface CAMAQueryParams {
  parcelId?: string;
  address?: string;
  owner?: string;
  minValue?: number;
  maxValue?: number;
  propertyClass?: string;
  neighborhood?: string;
  saleStartDate?: string;
  saleEndDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

/**
 * Implementation of connector for Computer Assisted Mass Appraisal (CAMA) systems
 */
export class CAMAConnector extends BaseDataConnector {
  private client: AxiosInstance;

  constructor(name: string, config: CAMAConnectorConfig) {
    super(name, 'cama', config);
    
    // Validate required config
    if (!config.baseUrl) {
      throw new Error('CAMA connector requires baseUrl in configuration');
    }
    
    if (!config.apiKey) {
      throw new Error('CAMA connector requires apiKey in configuration');
    }
    
    // Create Axios client with base configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        ...(config.headers || {})
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
          throw new Error(`CAMA API Error (${error.response.status}): ${message}`);
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response received from CAMA API');
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error(`Error in CAMA request: ${error.message}`);
        }
      }
    );
  }
  
  /**
   * Test connection to the CAMA system
   */
  async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Log the request
      await this.logRequest('GET', '/health', {});
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get('/health'),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', '/health', {}, response.data, duration);
      
      return response.status === 200 && response.data?.status === 'ok';
    } catch (error) {
      await this.logError('GET', '/health', {}, error);
      return false;
    }
  }
  
  /**
   * Fetch property data from the CAMA system
   */
  async fetchData(query: CAMAQueryParams): Promise<{
    properties: PropertyData[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const startTime = Date.now();
      const endpoint = '/properties';
      
      // Log the request
      await this.logRequest('GET', endpoint, query);
      
      // Prepare request configuration
      const config: AxiosRequestConfig = {
        params: query
      };
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint, config),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, query, response.data, duration);
      
      // Return the formatted data
      return {
        properties: response.data.properties || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        limit: response.data.limit || 10
      };
    } catch (error) {
      await this.logError('GET', '/properties', query, error);
      throw error;
    }
  }
  
  /**
   * Get property details by parcel ID
   */
  async getPropertyByParcel(parcelId: string): Promise<PropertyData> {
    try {
      const startTime = Date.now();
      const endpoint = `/properties/${parcelId}`;
      
      // Log the request
      await this.logRequest('GET', endpoint, { parcelId });
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, { parcelId }, response.data, duration);
      
      // Return the property data
      return response.data;
    } catch (error) {
      await this.logError('GET', `/properties/${parcelId}`, { parcelId }, error);
      throw error;
    }
  }
  
  /**
   * Get available data models/tables in the CAMA system
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const startTime = Date.now();
      const endpoint = '/metadata/models';
      
      // Log the request
      await this.logRequest('GET', endpoint, {});
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, {}, response.data, duration);
      
      // Return the list of models
      return response.data.models || [];
    } catch (error) {
      await this.logError('GET', '/metadata/models', {}, error);
      return [];
    }
  }
  
  /**
   * Get schema for a specific model/table in the CAMA system
   */
  async getModelSchema(modelName: string): Promise<any> {
    try {
      const startTime = Date.now();
      const endpoint = `/metadata/models/${modelName}`;
      
      // Log the request
      await this.logRequest('GET', endpoint, { modelName });
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, { modelName }, response.data, duration);
      
      // Return the schema
      return response.data.schema || null;
    } catch (error) {
      await this.logError('GET', `/metadata/models/${modelName}`, { modelName }, error);
      return null;
    }
  }
  
  /**
   * Get property sales data
   */
  async getPropertySales(params: {
    startDate?: string;
    endDate?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyClass?: string;
    neighborhood?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    sales: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const startTime = Date.now();
      const endpoint = '/sales';
      
      // Log the request
      await this.logRequest('GET', endpoint, params);
      
      // Prepare request configuration
      const config: AxiosRequestConfig = {
        params: params
      };
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint, config),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, params, response.data, duration);
      
      // Return the sales data
      return {
        sales: response.data.sales || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        limit: response.data.limit || 10
      };
    } catch (error) {
      await this.logError('GET', '/sales', params, error);
      throw error;
    }
  }
  
  /**
   * Get property valuation history
   */
  async getPropertyValuationHistory(parcelId: string): Promise<any[]> {
    try {
      const startTime = Date.now();
      const endpoint = `/properties/${parcelId}/valuations`;
      
      // Log the request
      await this.logRequest('GET', endpoint, { parcelId });
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, { parcelId }, response.data, duration);
      
      // Return the valuation history
      return response.data.valuations || [];
    } catch (error) {
      await this.logError('GET', `/properties/${parcelId}/valuations`, { parcelId }, error);
      throw error;
    }
  }
}