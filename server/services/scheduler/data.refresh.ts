import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../../storage';
import { scheduler } from '../../services/scheduler.service';
import { connectorFactory } from '../connectors/connector.factory';
import { dataValidator } from '../enrichment/data.validator';
import { geospatialEnricher } from '../enrichment/geospatial.enricher';
import { AppError } from '../../errors';

/**
 * Configuration for data refresh jobs
 */
export interface DataRefreshConfig {
  // Refresh intervals (in minutes)
  marketDataRefreshInterval: number;
  propertyDataRefreshInterval: number;
  gisDataRefreshInterval: number;
  
  // Maximum number of records to process in one batch
  batchSize: number;
  
  // Whether to validate data during refresh
  validateData: boolean;
  
  // Whether to enrich data during refresh
  enrichData: boolean;
}

/**
 * Service for scheduling and executing data refresh jobs
 */
export class DataRefreshService {
  private static instance: DataRefreshService;
  private config: DataRefreshConfig;
  
  private constructor(config?: Partial<DataRefreshConfig>) {
    this.config = {
      marketDataRefreshInterval: 60, // 1 hour
      propertyDataRefreshInterval: 1440, // 24 hours
      gisDataRefreshInterval: 10080, // 1 week
      batchSize: 100,
      validateData: true,
      enrichData: true,
      ...config
    };
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(config?: Partial<DataRefreshConfig>): DataRefreshService {
    if (!DataRefreshService.instance) {
      DataRefreshService.instance = new DataRefreshService(config);
    }
    return DataRefreshService.instance;
  }
  
  /**
   * Initialize the data refresh service and schedule jobs
   */
  initialize(): void {
    // Schedule market data refresh
    scheduler.addJob(
      'market-data-refresh',
      this.config.marketDataRefreshInterval,
      this.refreshMarketData.bind(this)
    );
    
    // Schedule property data refresh
    scheduler.addJob(
      'property-data-refresh',
      this.config.propertyDataRefreshInterval,
      this.refreshPropertyData.bind(this)
    );
    
    // Schedule GIS data refresh
    scheduler.addJob(
      'gis-data-refresh',
      this.config.gisDataRefreshInterval,
      this.refreshGISData.bind(this)
    );
    
    // Log initialization
    storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'Data refresh service initialized',
      details: JSON.stringify(this.config),
      source: 'data-refresh-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['data-refresh', 'initialization']
    });
  }
  
  /**
   * Refresh market data from all configured connectors
   */
  async refreshMarketData(): Promise<void> {
    const startTime = Date.now();
    let refreshedListingsCount = 0;
    let validationIssuesCount = 0;
    
    try {
      // Get all market data connectors
      const marketConnectors = connectorFactory.getConnectorsByType('market');
      
      if (marketConnectors.length === 0) {
        throw new Error('No market data connectors available');
      }
      
      // Process each connector
      for (const connector of marketConnectors) {
        try {
          // Log start of refresh for this connector
          await storage.createLog({
            level: LogLevel.INFO,
            category: LogCategory.SYSTEM,
            message: `Starting market data refresh for connector: ${connector.getName()}`,
            details: JSON.stringify({ connector: connector.getName() }),
            source: 'data-refresh-service',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['data-refresh', 'market-data', connector.getName()]
          });
          
          // Fetch data from the connector
          const result = await connector.fetchData({
            limit: this.config.batchSize
          });
          
          const listings = result.data;
          refreshedListingsCount += listings.length;
          
          // Validate and enrich data if configured
          if (this.config.validateData || this.config.enrichData) {
            // Calculate market statistics for validation
            if (this.config.validateData) {
              await dataValidator.calculateMarketStats(listings);
            }
            
            // Process each listing
            for (const listing of listings) {
              // Validate listing
              if (this.config.validateData) {
                const validationResult = dataValidator.validateListing(listing);
                
                if (!validationResult.isValid || validationResult.anomalies.length > 0) {
                  validationIssuesCount++;
                  
                  // Log validation issues
                  await storage.createLog({
                    level: LogLevel.WARNING,
                    category: LogCategory.DATA,
                    message: `Validation issues found for listing ${listing.mlsNumber}`,
                    details: JSON.stringify(validationResult),
                    source: 'data-refresh-service',
                    projectId: null,
                    userId: null,
                    sessionId: null,
                    duration: null,
                    statusCode: null,
                    endpoint: null,
                    tags: ['data-refresh', 'validation', 'market-data']
                  });
                }
              }
              
              // Enrich listing with geospatial data
              if (this.config.enrichData) {
                await geospatialEnricher.enrichPropertyListing(listing);
              }
            }
          }
          
          // Log successful refresh for this connector
          await storage.createLog({
            level: LogLevel.INFO,
            category: LogCategory.SYSTEM,
            message: `Completed market data refresh for connector: ${connector.getName()}`,
            details: JSON.stringify({
              connector: connector.getName(),
              listingsCount: listings.length,
              validationIssuesCount
            }),
            source: 'data-refresh-service',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['data-refresh', 'market-data', connector.getName()]
          });
        } catch (error) {
          // Log error for this connector
          console.error(`Error refreshing market data for connector ${connector.getName()}:`, error);
          await storage.createLog({
            level: LogLevel.ERROR,
            category: LogCategory.SYSTEM,
            message: `Failed to refresh market data for connector ${connector.getName()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: JSON.stringify({
              connector: connector.getName(),
              error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
              } : error
            }),
            source: 'data-refresh-service',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['data-refresh', 'market-data', 'error', connector.getName()]
          });
          
          // Continue with next connector
          continue;
        }
      }
      
      // Log overall completion
      const duration = Date.now() - startTime;
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Completed market data refresh for all connectors`,
        details: JSON.stringify({
          connectorsCount: marketConnectors.length,
          refreshedListingsCount,
          validationIssuesCount,
          duration
        }),
        source: 'data-refresh-service',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['data-refresh', 'market-data']
      });
    } catch (error) {
      // Log overall error
      const duration = Date.now() - startTime;
      console.error('Error refreshing market data:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to refresh market data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          duration
        }),
        source: 'data-refresh-service',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['data-refresh', 'market-data', 'error']
      });
    }
  }
  
  /**
   * Refresh property data from all configured CAMA connectors
   */
  async refreshPropertyData(): Promise<void> {
    const startTime = Date.now();
    let refreshedPropertiesCount = 0;
    let validationIssuesCount = 0;
    
    try {
      // Get all CAMA connectors
      const camaConnectors = connectorFactory.getConnectorsByType('cama');
      
      if (camaConnectors.length === 0) {
        throw new Error('No CAMA connectors available');
      }
      
      // Process each connector
      for (const connector of camaConnectors) {
        try {
          // Log start of refresh for this connector
          await storage.createLog({
            level: LogLevel.INFO,
            category: LogCategory.SYSTEM,
            message: `Starting property data refresh for connector: ${connector.getName()}`,
            details: JSON.stringify({ connector: connector.getName() }),
            source: 'data-refresh-service',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['data-refresh', 'property-data', connector.getName()]
          });
          
          // Fetch data from the connector
          const result = await connector.fetchData({
            limit: this.config.batchSize
          });
          
          const properties = result.data;
          refreshedPropertiesCount += properties.length;
          
          // Validate data if configured
          if (this.config.validateData) {
            for (const property of properties) {
              const validationResult = dataValidator.validatePropertyData(property);
              
              if (!validationResult.isValid || validationResult.anomalies.length > 0) {
                validationIssuesCount++;
                
                // Log validation issues
                await storage.createLog({
                  level: LogLevel.WARNING,
                  category: LogCategory.DATA,
                  message: `Validation issues found for property ${property.parcelId}`,
                  details: JSON.stringify(validationResult),
                  source: 'data-refresh-service',
                  projectId: null,
                  userId: null,
                  sessionId: null,
                  duration: null,
                  statusCode: null,
                  endpoint: null,
                  tags: ['data-refresh', 'validation', 'property-data']
                });
              }
            }
          }
          
          // Log successful refresh for this connector
          await storage.createLog({
            level: LogLevel.INFO,
            category: LogCategory.SYSTEM,
            message: `Completed property data refresh for connector: ${connector.getName()}`,
            details: JSON.stringify({
              connector: connector.getName(),
              propertiesCount: properties.length,
              validationIssuesCount
            }),
            source: 'data-refresh-service',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['data-refresh', 'property-data', connector.getName()]
          });
        } catch (error) {
          // Log error for this connector
          console.error(`Error refreshing property data for connector ${connector.getName()}:`, error);
          await storage.createLog({
            level: LogLevel.ERROR,
            category: LogCategory.SYSTEM,
            message: `Failed to refresh property data for connector ${connector.getName()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: JSON.stringify({
              connector: connector.getName(),
              error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
              } : error
            }),
            source: 'data-refresh-service',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['data-refresh', 'property-data', 'error', connector.getName()]
          });
          
          // Continue with next connector
          continue;
        }
      }
      
      // Log overall completion
      const duration = Date.now() - startTime;
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Completed property data refresh for all connectors`,
        details: JSON.stringify({
          connectorsCount: camaConnectors.length,
          refreshedPropertiesCount,
          validationIssuesCount,
          duration
        }),
        source: 'data-refresh-service',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['data-refresh', 'property-data']
      });
    } catch (error) {
      // Log overall error
      const duration = Date.now() - startTime;
      console.error('Error refreshing property data:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to refresh property data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          duration
        }),
        source: 'data-refresh-service',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['data-refresh', 'property-data', 'error']
      });
    }
  }
  
  /**
   * Refresh GIS data from all configured GIS connectors
   */
  async refreshGISData(): Promise<void> {
    const startTime = Date.now();
    let refreshedFeaturesCount = 0;
    
    try {
      // Get all GIS connectors
      const gisConnectors = connectorFactory.getConnectorsByType('gis');
      
      if (gisConnectors.length === 0) {
        throw new Error('No GIS connectors available');
      }
      
      // Process each connector
      for (const connector of gisConnectors) {
        try {
          // Log start of refresh for this connector
          await storage.createLog({
            level: LogLevel.INFO,
            category: LogCategory.SYSTEM,
            message: `Starting GIS data refresh for connector: ${connector.getName()}`,
            details: JSON.stringify({ connector: connector.getName() }),
            source: 'data-refresh-service',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['data-refresh', 'gis-data', connector.getName()]
          });
          
          // Fetch data from the connector (using a bounding box for the area)
          const result = await connector.fetchData({
            // Example bounding box for an area
            bbox: [-120.0, 46.0, -119.0, 47.0],
            limit: this.config.batchSize
          });
          
          refreshedFeaturesCount += result.features.length;
          
          // Log successful refresh for this connector
          await storage.createLog({
            level: LogLevel.INFO,
            category: LogCategory.SYSTEM,
            message: `Completed GIS data refresh for connector: ${connector.getName()}`,
            details: JSON.stringify({
              connector: connector.getName(),
              featuresCount: result.features.length
            }),
            source: 'data-refresh-service',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['data-refresh', 'gis-data', connector.getName()]
          });
        } catch (error) {
          // Log error for this connector
          console.error(`Error refreshing GIS data for connector ${connector.getName()}:`, error);
          await storage.createLog({
            level: LogLevel.ERROR,
            category: LogCategory.SYSTEM,
            message: `Failed to refresh GIS data for connector ${connector.getName()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: JSON.stringify({
              connector: connector.getName(),
              error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
              } : error
            }),
            source: 'data-refresh-service',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['data-refresh', 'gis-data', 'error', connector.getName()]
          });
          
          // Continue with next connector
          continue;
        }
      }
      
      // Log overall completion
      const duration = Date.now() - startTime;
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Completed GIS data refresh for all connectors`,
        details: JSON.stringify({
          connectorsCount: gisConnectors.length,
          refreshedFeaturesCount,
          duration
        }),
        source: 'data-refresh-service',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['data-refresh', 'gis-data']
      });
    } catch (error) {
      // Log overall error
      const duration = Date.now() - startTime;
      console.error('Error refreshing GIS data:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to refresh GIS data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          duration
        }),
        source: 'data-refresh-service',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['data-refresh', 'gis-data', 'error']
      });
    }
  }
  
  /**
   * Run all data refresh jobs immediately
   */
  async refreshAllData(): Promise<void> {
    try {
      await this.refreshMarketData();
      await this.refreshPropertyData();
      await this.refreshGISData();
      
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: 'Completed refresh of all data sources',
        details: JSON.stringify({}),
        source: 'data-refresh-service',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['data-refresh', 'all-data']
      });
    } catch (error) {
      console.error('Error refreshing all data:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to refresh all data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'data-refresh-service',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['data-refresh', 'all-data', 'error']
      });
    }
  }
}

// Export singleton instance
export const dataRefreshService = DataRefreshService.getInstance();