import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../storage';
import { connectorFactory } from './connectors/connector.factory';
import { PropertyListing } from './connectors/market.connector';
import { PropertyData } from './connectors/cama.connector';
import { GeoJSONFeatureCollection } from './connectors/gis.connector';
import { ExtractedDocument } from './connectors/pdf.connector';
import { AppError } from '../errors';
import { scheduler } from './scheduler.service';

export class RealEstateAnalyticsService {
  private static instance: RealEstateAnalyticsService;
  private initialized = false;

  private cache: {
    marketSnapshots: Map<string, { timestamp: number; data: any }>;
    propertyDetails: Map<string, { timestamp: number; data: PropertyListing | PropertyData }>;
    geoJsonData: Map<string, { timestamp: number; data: GeoJSONFeatureCollection }>;
    alerts: any[];
  };

  private cacheExpiration = {
    marketSnapshots: 3600000,
    propertyDetails: 86400000,
    geoJsonData: 86400000,
    alerts: 3600000
  };

  private constructor() {
    this.cache = {
      marketSnapshots: new Map(),
      propertyDetails: new Map(),
      geoJsonData: new Map(),
      alerts: []
    };
  }

  public static getInstance(): RealEstateAnalyticsService {
    if (!RealEstateAnalyticsService.instance) {
      RealEstateAnalyticsService.instance = new RealEstateAnalyticsService();
    }
    return RealEstateAnalyticsService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: 'Initializing Real Estate Analytics Service',
        details: '',
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['startup', 'analytics']
      });

      scheduler.addJob('cache-cleanup', '0 */6 * * *', () => this.cleanupCache());

      this.initialized = true;
    } catch (error) {
      throw new AppError('Failed to initialize Real Estate Analytics Service', 500, error);
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, value] of this.cache.marketSnapshots.entries()) {
      if (now - value.timestamp > this.cacheExpiration.marketSnapshots) {
        this.cache.marketSnapshots.delete(key);
      }
    }
    
    for (const [key, value] of this.cache.propertyDetails.entries()) {
      if (now - value.timestamp > this.cacheExpiration.propertyDetails) {
        this.cache.propertyDetails.delete(key);
      }
    }
    
    for (const [key, value] of this.cache.geoJsonData.entries()) {
      if (now - value.timestamp > this.cacheExpiration.geoJsonData) {
        this.cache.geoJsonData.delete(key);
      }
    }
  }

  public async getPropertyData(parcelId: string): Promise<PropertyData | null> {
    try {
      const cacheKey = `property-${parcelId}`;
      const cached = this.cache.propertyDetails.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiration.propertyDetails) {
        return cached.data as PropertyData;
      }

      const camaConnector = connectorFactory.getConnector('cama');
      if (!camaConnector) {
        throw new AppError('CAMA connector not available', 503);
      }

      const propertyData = await camaConnector.getProperty(parcelId);
      
      if (propertyData) {
        this.cache.propertyDetails.set(cacheKey, {
          timestamp: Date.now(),
          data: propertyData
        });
      }

      return propertyData;
    } catch (error) {
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.DATA,
        message: `Failed to get property data for parcel ${parcelId}`,
        details: JSON.stringify({ parcelId, error: error.message }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['error', 'property', 'cama']
      });
      throw error;
    }
  }

  public async getMarketAnalytics(region?: string): Promise<any> {
    try {
      const marketConnector = connectorFactory.getConnector('market');
      if (!marketConnector) {
        throw new AppError('Market connector not available', 503);
      }

      return await marketConnector.getAnalytics({ region });
    } catch (error) {
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.DATA,
        message: 'Failed to get market analytics',
        details: JSON.stringify({ region, error: error.message }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['error', 'market', 'analytics']
      });
      throw error;
    }
  }

  public async getGeoSpatialData(bbox?: [number, number, number, number]): Promise<GeoJSONFeatureCollection | null> {
    try {
      const cacheKey = `geojson-${bbox ? bbox.join(',') : 'all'}`;
      const cached = this.cache.geoJsonData.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiration.geoJsonData) {
        return cached.data;
      }

      const gisConnector = connectorFactory.getConnector('gis');
      if (!gisConnector) {
        throw new AppError('GIS connector not available', 503);
      }

      const geoData = await gisConnector.getFeatures(bbox);
      
      if (geoData) {
        this.cache.geoJsonData.set(cacheKey, {
          timestamp: Date.now(),
          data: geoData
        });
      }

      return geoData;
    } catch (error) {
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.DATA,
        message: 'Failed to get geospatial data',
        details: JSON.stringify({ bbox, error: error.message }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['error', 'gis', 'geospatial']
      });
      throw error;
    }
  }

  public async getDocuments(parcelId: string): Promise<ExtractedDocument[]> {
    try {
      const pdfConnector = connectorFactory.getConnector('property-documents');
      if (!pdfConnector) {
        throw new AppError('PDF connector not available', 503);
      }

      return await pdfConnector.getDocuments(parcelId);
    } catch (error) {
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.DATA,
        message: `Failed to get documents for parcel ${parcelId}`,
        details: JSON.stringify({ parcelId, error: error.message }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['error', 'documents', 'pdf']
      });
      throw error;
    }
  }
}

export const realEstateAnalyticsService = RealEstateAnalyticsService.getInstance();