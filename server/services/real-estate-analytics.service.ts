import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../storage';
import { connectorFactory } from './connectors/connector.factory';

import { PropertyListing } from './connectors/market.connector';
import { PropertyData } from './connectors/cama.connector';
import { GeoJSONFeatureCollection } from './connectors/gis.connector';
import { ExtractedDocument } from './connectors/pdf.connector';
import { AppError } from '../errors';
import { scheduler } from './scheduler.service';

/**
 * Main service class for real estate analytics platform
 * Integrates all subsystems and provides unified API
 */
export class RealEstateAnalyticsService {
  private static instance: RealEstateAnalyticsService;
  private initialized = false;

  // Cache for expensive operations
  private cache: {
    marketSnapshots: Map<string, { timestamp: number; data: any }>;
    propertyDetails: Map<string, { timestamp: number; data: PropertyListing | PropertyData }>;
    geoJsonData: Map<string, { timestamp: number; data: GeoJSONFeatureCollection }>;
    alerts: any[];
  };

  // Cache expiration time (in milliseconds)
  private cacheExpiration = {
    marketSnapshots: 3600000, // 1 hour
    propertyDetails: 86400000, // 24 hours
    geoJsonData: 86400000, // 24 hours
    alerts: 3600000 // 1 hour
  };

  private constructor() {
    this.cache = {
      marketSnapshots: new Map(),
      propertyDetails: new Map(),
      geoJsonData: new Map(),
      alerts: []
    };
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): RealEstateAnalyticsService {
    if (!RealEstateAnalyticsService.instance) {
      RealEstateAnalyticsService.instance = new RealEstateAnalyticsService();
    }
    return RealEstateAnalyticsService.instance;
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Log initialization start
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: 'Initializing real estate analytics service',
        details: JSON.stringify({}),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['initialization']
      });

      // Initialize data refresh service and schedule jobs
      dataRefreshService.initialize();

      // Schedule cache cleanup
      scheduler.addJob('cache-cleanup', 60, this.cleanupCache.bind(this));

      // Schedule alert generation
      scheduler.addJob('market-alerts', 720, this.generateMarketAlerts.bind(this));

      this.initialized = true;

      // Log successful initialization
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: 'Real estate analytics service initialized successfully',
        details: JSON.stringify({}),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['initialization', 'success']
      });
    } catch (error) {
      // Log initialization error
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to initialize real estate analytics service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['initialization', 'error']
      });

      throw error;
    }
  }

  /**
   * Refresh all data sources
   */
  public async refreshAllData(): Promise<void> {
    return dataRefreshService.refreshAllData();
  }

  /**
   * Get market snapshot for a specific area
   * @param area The area to analyze (city, zip, etc.)
   * @param forceRefresh Whether to force a refresh of the data
   */
  public async getMarketSnapshot(area: string, forceRefresh: boolean = false): Promise<MarketMetricsSnapshot> {
    const cacheKey = `snapshot-${area}`;
    const cached = this.cache.marketSnapshots.get(cacheKey);

    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheExpiration.marketSnapshots) {
      return cached.data;
    }

    // Generate new snapshot
    const snapshot = await marketMonitor.generateSnapshot(area);

    // Cache the result
    this.cache.marketSnapshots.set(cacheKey, {
      timestamp: Date.now(),
      data: snapshot
    });

    return snapshot;
  }

  /**
   * Get property listings with validation and enrichment
   * @param queryParams Query parameters for filtering listings
   * @param validate Whether to validate the data
   * @param enrich Whether to enrich the data with additional information
   */
  public async getPropertyListings(
    queryParams: any,
    validate: boolean = true,
    enrich: boolean = true
  ): Promise<{
    listings: PropertyListing[];
    total: number;
    validationIssues?: number;
  }> {
    try {
      // Get market data connectors
      const marketConnectors = connectorFactory.getConnectorsByType('market');

      if (marketConnectors.length === 0) {
        throw new Error('No market data connectors available');
      }

      // Use the first connector for now (could implement a strategy to select the best connector)
      const connector = marketConnectors[0];

      // Fetch listings
      const result = await connector.fetchData(queryParams);
      let listings = result.data;
      let validationIssues = 0;

      // Validate if requested
      if (validate) {
        // Calculate market statistics for validation
        await dataValidator.calculateMarketStats(listings);

        // Validate each listing
        listings = await Promise.all(listings.map(async (listing) => {
          const validationResult = dataValidator.validateListing(listing);

          if (!validationResult.isValid || validationResult.anomalies.length > 0) {
            validationIssues++;

            // Add validation results to the listing for UI display
            return {
              ...listing,
              validationResult
            };
          }

          return listing;
        }));
      }

      // Enrich if requested
      if (enrich) {
        listings = await Promise.all(
          listings.map(listing => geospatialEnricher.enrichPropertyListing(listing))
        );
      }

      return {
        listings,
        total: result.total,
        validationIssues: validate ? validationIssues : undefined
      };
    } catch (error) {
      console.error('Error fetching property listings:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to get property listings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          queryParams,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['property-listings', 'error']
      });

      throw error;
    }
  }

  /**
   * Get property documents
   * @param fileName The name of the document to retrieve
   */
  public async getPropertyDocument(fileName: string): Promise<ExtractedDocument | null> {
    try {
      // Get PDF connectors
      const pdfConnectors = connectorFactory.getConnectorsByType('pdf');

      if (pdfConnectors.length === 0) {
        throw new Error('No PDF connectors available');
      }

      // Use the first connector
      const connector = pdfConnectors[0];

      // Fetch document
      return await connector.getDocumentByName(fileName, true);
    } catch (error) {
      console.error(`Error fetching property document ${fileName}:`, error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to get property document ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          fileName,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['property-document', 'error']
      });

      throw error;
    }
  }

  /**
   * Get GeoJSON data for property listings
   * @param queryParams Query parameters for filtering listings
   */
  public async getGeoJsonData(queryParams: any): Promise<GeoJSONFeatureCollection> {
    try {
      // Create cache key from query parameters
      const cacheKey = `geojson-${JSON.stringify(queryParams)}`;
      const cached = this.cache.geoJsonData.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheExpiration.geoJsonData) {
        return cached.data;
      }

      // Get property listings
      const { listings } = await this.getPropertyListings(queryParams, false, true);

      // Convert to GeoJSON
      const geoJson = geospatialEnricher.convertListingsToGeoJSON(listings);

      // Cache the result
      this.cache.geoJsonData.set(cacheKey, {
        timestamp: Date.now(),
        data: geoJson
      });

      return geoJson;
    } catch (error) {
      console.error('Error generating GeoJSON data:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to generate GeoJSON data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          queryParams,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['geojson', 'error']
      });

      throw error;
    }
  }

  /**
   * Analyze neighborhood trends
   * @param area The area to analyze (city, zip, etc.)
   */
  public async analyzeNeighborhoodTrends(area: string): Promise<Record<string, {
    avgPrice: number;
    avgPricePerSqFt: number;
    avgDaysOnMarket: number;
    inventoryCount: number;
    priceChange3Month: number;
    priceChange1Year: number;
    hotness: number;
    centerLat: number;
    centerLng: number;
    bounds: [number, number, number, number];
  }>> {
    try {
      // Get property listings for the area
      const { listings } = await this.getPropertyListings({ city: area, limit: 1000 }, false, true);

      // Analyze neighborhood trends
      return geospatialEnricher.analyzeNeighborhoodTrends(listings);
    } catch (error) {
      console.error(`Error analyzing neighborhood trends for ${area}:`, error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to analyze neighborhood trends for ${area}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          area,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['neighborhood-trends', 'error']
      });

      throw error;
    }
  }

  /**
   * Get market alerts
   */
  public async getMarketAlerts(): Promise<MarketAlert[]> {
    // Check if we have cached alerts
    if (this.cache.alerts.length > 0) {
      return this.cache.alerts;
    }

    // Generate new alerts
    await this.generateMarketAlerts();

    return this.cache.alerts;
  }

  /**
   * Predict future market metrics
   * @param area The area to analyze
   * @param daysAhead Number of days ahead to forecast
   */
  public async predictMarketMetrics(area: string, daysAhead: number = 90): Promise<{
    predictedMetrics: Partial<MarketMetricsSnapshot>;
    confidenceScore: number;
    current: MarketMetricsSnapshot;
    alerts: MarketAlert[];
    lastUpdated: string;
  }> {
    try {
      const snapshot = await this.getMarketSnapshot(area, true);
      const predictions = await marketMonitor.predictMarketMetrics(area, daysAhead);

      // Generate market insight alerts
      const alerts = await marketMonitor.checkForMarketChanges();
      this.cache.alerts = alerts;

      // Combine current metrics with predictions
      return {
        current: snapshot,
        predicted: predictions,
        alerts: alerts.filter(alert => alert.affectedArea === area),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error predicting market metrics for ${area}:`, error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to predict market metrics for ${area}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          area,
          daysAhead,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-prediction', 'error']
      });
      throw error;
    }
  }

  /**
   * Get spatial relationships between properties
   * @param area The area to analyze
   */
  public async getPropertySpatialRelationships(area: string): Promise<any> {
    try {
      // Get property listings for the area
      const { listings } = await this.getPropertyListings({ city: area, limit: 500 }, false, true);

      // Analyze spatial relationships
      return geospatialEnricher.analyzeSpatialRelationships(listings);
    } catch (error) {
      console.error(`Error getting spatial relationships for ${area}:`, error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to get spatial relationships for ${area}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          area,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['spatial-relationships', 'error']
      });

      throw error;
    }
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupCache(): Promise<void> {
    try {
      const now = Date.now();
      let cleanedEntries = 0;

      // Clean market snapshots cache
      for (const [key, value] of this.cache.marketSnapshots.entries()) {
        if (now - value.timestamp > this.cacheExpiration.marketSnapshots) {
          this.cache.marketSnapshots.delete(key);
          cleanedEntries++;
        }
      }

      // Clean property details cache
      for (const [key, value] of this.cache.propertyDetails.entries()) {
        if (now - value.timestamp > this.cacheExpiration.propertyDetails) {
          this.cache.propertyDetails.delete(key);
          cleanedEntries++;
        }
      }

      // Clean GeoJSON data cache
      for (const [key, value] of this.cache.geoJsonData.entries()) {
        if (now - value.timestamp > this.cacheExpiration.geoJsonData) {
          this.cache.geoJsonData.delete(key);
          cleanedEntries++;
        }
      }

      // Log cache cleanup
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Cleaned up ${cleanedEntries} expired cache entries`,
        details: JSON.stringify({
          marketSnapshotsSize: this.cache.marketSnapshots.size,
          propertyDetailsSize: this.cache.propertyDetails.size,
          geoJsonDataSize: this.cache.geoJsonData.size
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['cache-cleanup']
      });
    } catch (error) {
      console.error('Error cleaning up cache:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to clean up cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['cache-cleanup', 'error']
      });
    }
  }

  /**
   * Generate market alerts
   */
  private async generateMarketAlerts(): Promise<void> {
    try {
      // Get market snapshot for Grandview area
      await this.getMarketSnapshot('Grandview', true);

      // Generate alerts
      const alerts = await marketMonitor.checkForMarketChanges();

      // Update cached alerts
      this.cache.alerts = alerts;

      // Log alert generation
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Generated ${alerts.length} market alerts`,
        details: JSON.stringify({
          alertCount: alerts.length
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-alerts']
      });
    } catch (error) {
      console.error('Error generating market alerts:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to generate market alerts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'real-estate-analytics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-alerts', 'error']
      });
    }
  }
}

// Export singleton instance
export const realEstateAnalyticsService = RealEstateAnalyticsService.getInstance();