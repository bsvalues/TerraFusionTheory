import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BaseDataConnector, ConnectorConfig } from './baseConnector';

/**
 * Specific configuration for GIS connectors
 */
export interface GISConnectorConfig extends ConnectorConfig {
  baseUrl: string;
  apiKey?: string;
  serviceType: 'arcgis' | 'mapbox' | 'generic';
  county?: string;
  state?: string;
  featureUrl?: string;
  mapServiceUrl?: string;
}

/**
 * GeoJSON Feature structure
 */
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
  properties: Record<string, any>;
  id?: string | number;
}

/**
 * GeoJSON FeatureCollection structure
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  bbox?: number[];
}

/**
 * Spatial query parameters
 */
export interface SpatialQueryParams {
  // Bounding box coordinates [west, south, east, north]
  bbox?: number[];
  // Point coordinates [longitude, latitude]
  point?: number[];
  // Distance in meters from point (used with point)
  distance?: number;
  // Polygon coordinates [[[lon1, lat1], [lon2, lat2], ...]]
  polygon?: number[][];
  // Parcel ID or other identifier
  id?: string;
  // Maximum number of features to return
  limit?: number;
  // Layer or feature class name
  layer?: string;
  // Fields to include in response
  fields?: string[];
  // Additional parameters for specific GIS systems
  [key: string]: any;
}

/**
 * Implementation of connector for Geographic Information Systems (GIS)
 */
export class GISConnector extends BaseDataConnector {
  private client: AxiosInstance;
  
  constructor(name: string, config: GISConnectorConfig) {
    super(name, 'gis', config);
    
    // Validate required config
    if (!config.baseUrl) {
      throw new Error('GIS connector requires baseUrl in configuration');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers || {})
    };
    
    // Add API key to headers if provided
    if (config.apiKey) {
      if (config.serviceType === 'arcgis') {
        headers['X-Esri-Authorization'] = `Bearer ${config.apiKey}`;
      } else if (config.serviceType === 'mapbox') {
        // Mapbox typically uses query parameters for API key
      } else {
        headers['X-API-Key'] = config.apiKey;
      }
    }
    
    // Create Axios client with base configuration
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const message = this.extractErrorMessage(error.response.data) || 'API Error';
          throw new Error(`GIS API Error (${error.response.status}): ${message}`);
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response received from GIS API');
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error(`Error in GIS request: ${error.message}`);
        }
      }
    );
  }
  
  /**
   * Test connection to the GIS service
   */
  async testConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      // Endpoint varies by service type
      let endpoint = '/health';
      if ((this.config as GISConnectorConfig).serviceType === 'arcgis') {
        endpoint = '/info';
      } else if ((this.config as GISConnectorConfig).serviceType === 'mapbox') {
        endpoint = '/styles/v1';
      }
      
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
      
      return response.status === 200;
    } catch (error) {
      await this.logError('GET', '/health', {}, error);
      return false;
    }
  }
  
  /**
   * Fetch GIS data based on query parameters
   */
  async fetchData(query: SpatialQueryParams): Promise<GeoJSONFeatureCollection> {
    // Implementation depends on service type
    switch ((this.config as GISConnectorConfig).serviceType) {
      case 'arcgis':
        return this.fetchArcGISData(query);
      case 'mapbox':
        return this.fetchMapboxData(query);
      default:
        return this.fetchGenericGISData(query);
    }
  }
  
  /**
   * Fetch data from ArcGIS services
   */
  private async fetchArcGISData(query: SpatialQueryParams): Promise<GeoJSONFeatureCollection> {
    try {
      const startTime = Date.now();
      
      // Get available service layers first to find a feature service to query
      const baseUrl = (this.config as GISConnectorConfig).baseUrl;
      
      // First, query the services directory to find available feature services
      const serviceListUrl = `${baseUrl}?f=json`;
      
      // Log the request for services list
      await this.logRequest('GET', serviceListUrl, {});
      
      // Get the list of services
      const serviceListResponse = await this.withTimeout(
        this.client.get(serviceListUrl),
        this.config.timeout as number
      );
      
      // Pick the first available feature service from the list
      let serviceUrl = '';
      if (serviceListResponse.data && serviceListResponse.data.services && serviceListResponse.data.services.length > 0) {
        // Find a FeatureServer service
        const featureService = serviceListResponse.data.services.find(
          (service: any) => service.type === 'FeatureServer'
        );
        
        if (featureService) {
          serviceUrl = `${baseUrl}/${featureService.name}/FeatureServer/0/query`;
        } else {
          // If no FeatureServer is found, use the first service
          serviceUrl = `${baseUrl}/${serviceListResponse.data.services[0].name}/0/query`;
        }
      } else {
        // Use a default layer if services list is unavailable
        serviceUrl = `${baseUrl}/0/query`;
      }
      
      // Format ArcGIS specific query parameters
      const arcGISParams: Record<string, any> = {
        f: 'geojson',
        outFields: query.fields ? query.fields.join(',') : '*',
        where: query.id ? `OBJECTID=${query.id}` : '1=1',
        returnGeometry: true
      };
      
      // Handle spatial queries
      if (query.bbox) {
        arcGISParams.geometryType = 'esriGeometryEnvelope';
        arcGISParams.geometry = query.bbox.join(',');
      } else if (query.point && query.distance) {
        arcGISParams.geometryType = 'esriGeometryPoint';
        arcGISParams.geometry = `${query.point[0]},${query.point[1]}`;
        arcGISParams.distance = query.distance;
        arcGISParams.units = 'esriSRUnit_Meter';
      } else if (query.polygon) {
        arcGISParams.geometryType = 'esriGeometryPolygon';
        arcGISParams.geometry = JSON.stringify({
          rings: [query.polygon],
          spatialReference: { wkid: 4326 }
        });
      }
      
      if (query.limit) {
        arcGISParams.resultRecordCount = query.limit;
      }
      
      // Log the request
      await this.logRequest('GET', serviceUrl, arcGISParams);
      
      // Prepare request configuration
      const config: AxiosRequestConfig = {
        params: arcGISParams
      };
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(serviceUrl, config),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', serviceUrl, arcGISParams, response.data, duration);
      
      return response.data;
    } catch (error) {
      // Use serviceUrl from previous context or fallback to baseUrl
      const baseUrl = (this.config as GISConnectorConfig).baseUrl;
      await this.logError('GET', `${baseUrl}/query`, query, error);
      throw error;
    }
  }
  
  /**
   * Fetch data from Mapbox services
   */
  private async fetchMapboxData(query: SpatialQueryParams): Promise<GeoJSONFeatureCollection> {
    try {
      const startTime = Date.now();
      
      // Construct Mapbox endpoint
      const mapboxConfig = this.config as GISConnectorConfig;
      const accessToken = mapboxConfig.apiKey || '';
      const endpoint = `/v4/${query.layer || 'mapbox.mapbox-streets-v8'}/features.json`;
      
      // Format Mapbox specific query parameters
      const mapboxParams: Record<string, any> = {
        access_token: accessToken
      };
      
      if (query.bbox) {
        mapboxParams.bbox = query.bbox.join(',');
      } else if (query.point) {
        mapboxParams.lon = query.point[0];
        mapboxParams.lat = query.point[1];
        mapboxParams.radius = query.distance || 1000;
      }
      
      if (query.limit) {
        mapboxParams.limit = query.limit;
      }
      
      // Log the request
      await this.logRequest('GET', endpoint, this.sanitizeParams(mapboxParams));
      
      // Prepare request configuration
      const config: AxiosRequestConfig = {
        params: mapboxParams
      };
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint, config),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, this.sanitizeParams(mapboxParams), response.data, duration);
      
      // Convert response to GeoJSON if needed
      if (response.data.type !== 'FeatureCollection') {
        // Basic conversion for non-GeoJSON responses
        return {
          type: 'FeatureCollection',
          features: Array.isArray(response.data) 
            ? response.data.map((item: any) => ({
                type: 'Feature',
                geometry: item.geometry,
                properties: item.properties || {}
              }))
            : []
        };
      }
      
      return response.data;
    } catch (error) {
      const endpoint = `/v4/${query.layer || 'mapbox.mapbox-streets-v8'}/features.json`;
      await this.logError('GET', endpoint, query, error);
      throw error;
    }
  }
  
  /**
   * Fetch data from generic GIS services
   */
  private async fetchGenericGISData(query: SpatialQueryParams): Promise<GeoJSONFeatureCollection> {
    try {
      const startTime = Date.now();
      
      // Construct generic endpoint
      const endpoint = '/features';
      
      // Format generic query parameters
      const params: Record<string, any> = { ...query };
      
      // Log the request
      await this.logRequest('GET', endpoint, params);
      
      // Prepare request configuration
      const config: AxiosRequestConfig = {
        params
      };
      
      // Make the request
      const response = await this.withTimeout(
        this.client.get(endpoint, config),
        this.config.timeout as number
      );
      
      const duration = Date.now() - startTime;
      
      // Log the response
      await this.logResponse('GET', endpoint, params, response.data, duration);
      
      return response.data;
    } catch (error) {
      await this.logError('GET', '/features', query, error);
      throw error;
    }
  }
  
  /**
   * Get available data models/layers in the GIS system
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const startTime = Date.now();
      
      // Endpoint varies by service type
      let endpoint = '/layers';
      if ((this.config as GISConnectorConfig).serviceType === 'arcgis') {
        endpoint = '/layers';
      } else if ((this.config as GISConnectorConfig).serviceType === 'mapbox') {
        endpoint = '/tilesets';
      }
      
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
      
      // Extract layer names based on service type
      let layers: string[] = [];
      
      if ((this.config as GISConnectorConfig).serviceType === 'arcgis') {
        layers = response.data.layers?.map((layer: any) => layer.name) || [];
      } else if ((this.config as GISConnectorConfig).serviceType === 'mapbox') {
        layers = response.data.tilesets?.map((tileset: any) => tileset.id) || [];
      } else {
        layers = response.data.layers || [];
      }
      
      return layers;
    } catch (error) {
      await this.logError('GET', '/layers', {}, error);
      return [];
    }
  }
  
  /**
   * Get schema for a specific model/layer in the GIS system
   */
  async getModelSchema(modelName: string): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Endpoint varies by service type
      let endpoint = `/layers/${modelName}`;
      if ((this.config as GISConnectorConfig).serviceType === 'arcgis') {
        endpoint = `/layers/${modelName}?f=json`;
      } else if ((this.config as GISConnectorConfig).serviceType === 'mapbox') {
        endpoint = `/tilesets/${modelName}`;
      }
      
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
      
      // Extract schema based on service type
      let schema = null;
      
      if ((this.config as GISConnectorConfig).serviceType === 'arcgis') {
        schema = {
          fields: response.data.fields || [],
          geometryType: response.data.geometryType
        };
      } else if ((this.config as GISConnectorConfig).serviceType === 'mapbox') {
        schema = response.data.schema || response.data;
      } else {
        schema = response.data.schema || response.data;
      }
      
      return schema;
    } catch (error) {
      const modelNameParam = { modelName };
      await this.logError('GET', `/layers/${modelName}`, modelNameParam, error);
      return null;
    }
  }
  
  /**
   * Get geometry for a specific parcel
   */
  async getParcelGeometry(parcelId: string): Promise<GeoJSONFeature | null> {
    try {
      return (await this.fetchData({ id: parcelId, limit: 1 })).features[0] || null;
    } catch (error) {
      await this.logError('GET', '/features', { id: parcelId }, error);
      return null;
    }
  }
  
  /**
   * Get parcels within a bounding box
   */
  async getParcelsInBoundingBox(
    bbox: [number, number, number, number],
    limit: number = 100
  ): Promise<GeoJSONFeatureCollection> {
    return this.fetchData({ bbox, limit });
  }
  
  /**
   * Get parcels within a radius from a point
   */
  async getParcelsInRadius(
    point: [number, number],
    distance: number,
    limit: number = 100
  ): Promise<GeoJSONFeatureCollection> {
    return this.fetchData({ point, distance, limit });
  }
}