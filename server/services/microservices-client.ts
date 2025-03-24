/**
 * Microservices Client
 * 
 * This service provides a unified API client for the FastAPI microservices
 * that power the IntelligentEstate platform.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createErrorFromUnknown } from '../errors';

// Define the base URLs for each microservice
const MICROSERVICE_URLS = {
  property: process.env.PROPERTY_SERVICE_URL || 'http://localhost:8001',
  market: process.env.MARKET_SERVICE_URL || 'http://localhost:8002',
  spatial: process.env.SPATIAL_SERVICE_URL || 'http://localhost:8003',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8004'
};

// Define service-specific interfaces
export interface PropertyService {
  getProperties(params?: any): Promise<any[]>;
  getProperty(id: number): Promise<any>;
  getPropertyValuations(propertyId: number): Promise<any[]>;
  createProperty(propertyData: any): Promise<any>;
  createValuation(valuationData: any): Promise<any>;
  getMarketSummary(params?: any): Promise<any>;
}

export interface MarketService {
  getMetrics(params?: any): Promise<any[]>;
  getMetricById(id: number): Promise<any>;
  createMetric(metricData: any): Promise<any>;
  getPredictions(params?: any): Promise<any[]>;
  createPrediction(predictionData: any): Promise<any>;
  getTrend(metric: string, params: any): Promise<any>;
  getMarketOverview(areaType: string, areaValue: string): Promise<any>;
}

export interface SpatialService {
  getSpatialData(params?: any): Promise<any[]>;
  getSpatialDataById(id: number): Promise<any>;
  createSpatialData(spatialData: any): Promise<any>;
  getPropertiesGeoJSON(params?: any): Promise<any>;
  proximitySearch(searchParams: any): Promise<any>;
  geocodeAddress(addressData: any): Promise<any>;
  getNeighborhoods(params?: any): Promise<any>;
}

export interface AnalyticsService {
  predictPropertyValue(requestData: any): Promise<any>;
  predictMarketTrend(requestData: any): Promise<any>;
  trainModel(requestData: any): Promise<any>;
  getTrainingStatus(jobId: string): Promise<any>;
  findHotspots(requestData: any): Promise<any[]>;
  analyzeInvestment(requestData: any): Promise<any>;
}

/**
 * Base service class for all microservice clients
 */
class BaseService {
  protected client: AxiosInstance;
  protected serviceName: string;
  
  constructor(baseURL: string, serviceName: string) {
    this.serviceName = serviceName;
    this.client = axios.create({
      baseURL,
      timeout: 10000, // 10 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use((config) => {
      console.log(`[${this.serviceName}] Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[${this.serviceName}] Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error(`[${this.serviceName}] Error:`, error.message);
        throw createErrorFromUnknown(error);
      }
    );
  }
  
  protected async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    } catch (error) {
      console.error(`[${this.serviceName}] Request failed:`, error);
      throw createErrorFromUnknown(error);
    }
  }
  
  /**
   * Check if the service is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data?.status === 'healthy';
    } catch (error) {
      console.error(`[${this.serviceName}] Health check failed:`, error);
      return false;
    }
  }
}

/**
 * Property Service Client
 */
class PropertyServiceClient extends BaseService implements PropertyService {
  constructor() {
    super(MICROSERVICE_URLS.property, 'PropertyService');
  }
  
  async getProperties(params?: any): Promise<any[]> {
    return this.request<any[]>({
      method: 'GET',
      url: '/properties',
      params
    });
  }
  
  async getProperty(id: number): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: `/properties/${id}`
    });
  }
  
  async getPropertyValuations(propertyId: number): Promise<any[]> {
    return this.request<any[]>({
      method: 'GET',
      url: `/valuations/${propertyId}`
    });
  }
  
  async createProperty(propertyData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/properties',
      data: propertyData
    });
  }
  
  async createValuation(valuationData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/valuations',
      data: valuationData
    });
  }
  
  async getMarketSummary(params?: any): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: '/market-summary',
      params
    });
  }
}

/**
 * Market Service Client
 */
class MarketServiceClient extends BaseService implements MarketService {
  constructor() {
    super(MICROSERVICE_URLS.market, 'MarketService');
  }
  
  async getMetrics(params?: any): Promise<any[]> {
    return this.request<any[]>({
      method: 'GET',
      url: '/metrics',
      params
    });
  }
  
  async getMetricById(id: number): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: `/metrics/${id}`
    });
  }
  
  async createMetric(metricData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/metrics',
      data: metricData
    });
  }
  
  async getPredictions(params?: any): Promise<any[]> {
    return this.request<any[]>({
      method: 'GET',
      url: '/predictions',
      params
    });
  }
  
  async createPrediction(predictionData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/predictions',
      data: predictionData
    });
  }
  
  async getTrend(metric: string, params: any): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: `/trends/${metric}`,
      params
    });
  }
  
  async getMarketOverview(areaType: string, areaValue: string): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: '/overview',
      params: { area_type: areaType, area_value: areaValue }
    });
  }
}

/**
 * Spatial Service Client
 */
class SpatialServiceClient extends BaseService implements SpatialService {
  constructor() {
    super(MICROSERVICE_URLS.spatial, 'SpatialService');
  }
  
  async getSpatialData(params?: any): Promise<any[]> {
    return this.request<any[]>({
      method: 'GET',
      url: '/spatial-data',
      params
    });
  }
  
  async getSpatialDataById(id: number): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: `/spatial-data/${id}`
    });
  }
  
  async createSpatialData(spatialData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/spatial-data',
      data: spatialData
    });
  }
  
  async getPropertiesGeoJSON(params?: any): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: '/properties/geojson',
      params
    });
  }
  
  async proximitySearch(searchParams: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/proximity-search',
      data: searchParams
    });
  }
  
  async geocodeAddress(addressData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/geocode',
      data: addressData
    });
  }
  
  async getNeighborhoods(params?: any): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: '/neighborhoods',
      params
    });
  }
}

/**
 * Analytics Service Client
 */
class AnalyticsServiceClient extends BaseService implements AnalyticsService {
  constructor() {
    super(MICROSERVICE_URLS.analytics, 'AnalyticsService');
  }
  
  async predictPropertyValue(requestData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/predict/property-value',
      data: requestData
    });
  }
  
  async predictMarketTrend(requestData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/predict/market-trend',
      data: requestData
    });
  }
  
  async trainModel(requestData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/models/train',
      data: requestData
    });
  }
  
  async getTrainingStatus(jobId: string): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: `/models/training-status/${jobId}`
    });
  }
  
  async findHotspots(requestData: any): Promise<any[]> {
    return this.request<any[]>({
      method: 'POST',
      url: '/hotspots',
      data: requestData
    });
  }
  
  async analyzeInvestment(requestData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/investment-analysis',
      data: requestData
    });
  }
}

/**
 * Main Microservices Client that provides access to all microservices
 */
export class MicroservicesClient {
  public readonly property: PropertyService;
  public readonly market: MarketService;
  public readonly spatial: SpatialService;
  public readonly analytics: AnalyticsService;
  
  private static instance: MicroservicesClient;
  
  private constructor() {
    this.property = new PropertyServiceClient();
    this.market = new MarketServiceClient();
    this.spatial = new SpatialServiceClient();
    this.analytics = new AnalyticsServiceClient();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MicroservicesClient {
    if (!MicroservicesClient.instance) {
      MicroservicesClient.instance = new MicroservicesClient();
    }
    return MicroservicesClient.instance;
  }
  
  /**
   * Check health of all microservices
   * @returns Health status for each microservice
   */
  async checkHealth(): Promise<Record<string, boolean>> {
    const [propertyHealth, marketHealth, spatialHealth, analyticsHealth] = await Promise.all([
      (this.property as PropertyServiceClient).checkHealth().catch(() => false),
      (this.market as MarketServiceClient).checkHealth().catch(() => false),
      (this.spatial as SpatialServiceClient).checkHealth().catch(() => false),
      (this.analytics as AnalyticsServiceClient).checkHealth().catch(() => false)
    ]);
    
    return {
      property: propertyHealth,
      market: marketHealth,
      spatial: spatialHealth,
      analytics: analyticsHealth
    };
  }
}

// Export singleton instance
export const microservicesClient = MicroservicesClient.getInstance();