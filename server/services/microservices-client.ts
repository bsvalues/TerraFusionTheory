/**
 * Microservices Client
 * 
 * This service provides a unified API for interacting with the 
 * FastAPI microservices that power the IntelligentEstate platform.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Property Service API client interface
 */
export interface PropertyService {
  getProperties(params?: any): Promise<any[]>;
  getProperty(id: number): Promise<any>;
  getPropertyValuations(propertyId: number): Promise<any[]>;
  createProperty(propertyData: any): Promise<any>;
  createValuation(valuationData: any): Promise<any>;
  getMarketSummary(params?: any): Promise<any>;
}

/**
 * Market Service API client interface
 */
export interface MarketService {
  getMetrics(params?: any): Promise<any[]>;
  getMetricById(id: number): Promise<any>;
  createMetric(metricData: any): Promise<any>;
  getPredictions(params?: any): Promise<any[]>;
  createPrediction(predictionData: any): Promise<any>;
  getTrend(metric: string, params: any): Promise<any>;
  getMarketOverview(areaType: string, areaValue: string): Promise<any>;
}

/**
 * Spatial Service API client interface
 */
export interface SpatialService {
  getSpatialData(params?: any): Promise<any[]>;
  getSpatialDataById(id: number): Promise<any>;
  createSpatialData(spatialData: any): Promise<any>;
  getPropertiesGeoJSON(params?: any): Promise<any>;
  proximitySearch(searchParams: any): Promise<any>;
  geocodeAddress(addressData: any): Promise<any>;
  getNeighborhoods(params?: any): Promise<any>;
}

/**
 * Analytics Service API client interface
 */
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
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    this.serviceName = serviceName;
  }

  /**
   * Make a request to the microservice
   */
  protected async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    } catch (error: any) {
      console.error(`Error in ${this.serviceName} service:`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
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
      console.error(`${this.serviceName} service is not healthy:`, error);
      return false;
    }
  }
}

/**
 * Property Service Client Implementation
 */
class PropertyServiceClient extends BaseService implements PropertyService {
  constructor() {
    super(process.env.PROPERTY_SERVICE_URL || 'http://localhost:8001', 'property');
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
      url: `/properties/${propertyId}/valuations`
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
 * Market Service Client Implementation
 */
class MarketServiceClient extends BaseService implements MarketService {
  constructor() {
    super(process.env.MARKET_SERVICE_URL || 'http://localhost:8002', 'market');
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
      url: `/market-overview/${areaType}/${areaValue}`
    });
  }
}

/**
 * Spatial Service Client Implementation
 */
class SpatialServiceClient extends BaseService implements SpatialService {
  constructor() {
    super(process.env.SPATIAL_SERVICE_URL || 'http://localhost:8003', 'spatial');
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
      url: '/properties-geojson',
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
    return this.request<any[]>({
      method: 'GET',
      url: '/neighborhoods',
      params
    });
  }
}

/**
 * Analytics Service Client Implementation
 */
class AnalyticsServiceClient extends BaseService implements AnalyticsService {
  constructor() {
    super(process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8004', 'analytics');
  }

  async predictPropertyValue(requestData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/predict-property-value',
      data: requestData
    });
  }

  async predictMarketTrend(requestData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/predict-market-trend',
      data: requestData
    });
  }

  async trainModel(requestData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/train-model',
      data: requestData
    });
  }

  async getTrainingStatus(jobId: string): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: `/training-status/${jobId}`
    });
  }

  async findHotspots(requestData: any): Promise<any[]> {
    return this.request<any[]>({
      method: 'POST',
      url: '/find-hotspots',
      data: requestData
    });
  }

  async analyzeInvestment(requestData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/analyze-investment',
      data: requestData
    });
  }
}

/**
 * Factory function to create service instances
 */
export function createMicroserviceClients() {
  const propertyService = new PropertyServiceClient();
  const marketService = new MarketServiceClient();
  const spatialService = new SpatialServiceClient();
  const analyticsService = new AnalyticsServiceClient();

  return {
    propertyService,
    marketService,
    spatialService,
    analyticsService
  };
}

// Singleton instance
const microserviceClients = createMicroserviceClients();
export default microserviceClients;