import { CAMAConnector, CAMAConnectorConfig } from './cama.connector';
import { GISConnector, GISConnectorConfig } from './gis.connector';
import { MarketDataConnector, MarketDataConnectorConfig } from './market.connector';
import { PDFConnector, PDFConnectorConfig } from './pdf.connector';
import { ConnectorRegistry, DataConnector, ConnectorConfig } from './baseConnector';
import { LogCategory, LogLevel } from '@shared/schema';
import { storage } from '../../storage';

/**
 * Connector types supported by the factory
 */
export type ConnectorType = 'cama' | 'gis' | 'market' | 'pdf' | 'document' | 'tax' | 'permit';

/**
 * Factory for creating and registering data connectors
 */
export class ConnectorFactory {
  private static instance: ConnectorFactory;
  private registry: ConnectorRegistry;
  
  private constructor() {
    this.registry = ConnectorRegistry.getInstance();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ConnectorFactory {
    if (!ConnectorFactory.instance) {
      ConnectorFactory.instance = new ConnectorFactory();
    }
    return ConnectorFactory.instance;
  }
  
  /**
   * Create a CAMA system connector
   */
  public createCAMAConnector(name: string, config: CAMAConnectorConfig): CAMAConnector {
    try {
      const connector = new CAMAConnector(name, config);
      this.registry.registerConnector(connector);
      this.logConnectorCreation(name, 'cama', true);
      return connector;
    } catch (error) {
      this.logConnectorCreation(name, 'cama', false, error);
      throw error;
    }
  }
  
  /**
   * Create a GIS connector
   */
  public createGISConnector(name: string, config: GISConnectorConfig): GISConnector {
    try {
      const connector = new GISConnector(name, config);
      this.registry.registerConnector(connector);
      this.logConnectorCreation(name, 'gis', true);
      return connector;
    } catch (error) {
      this.logConnectorCreation(name, 'gis', false, error);
      throw error;
    }
  }
  
  /**
   * Create a Market Data connector
   */
  public createMarketDataConnector(name: string, config: MarketDataConnectorConfig): MarketDataConnector {
    try {
      const connector = new MarketDataConnector(name, config);
      this.registry.registerConnector(connector);
      this.logConnectorCreation(name, 'market', true);
      return connector;
    } catch (error) {
      this.logConnectorCreation(name, 'market', false, error);
      throw error;
    }
  }
  
  /**
   * Create a PDF connector
   */
  public createPDFConnector(name: string, config: PDFConnectorConfig): PDFConnector {
    try {
      const connector = new PDFConnector(name, config);
      this.registry.registerConnector(connector);
      this.logConnectorCreation(name, 'pdf', true);
      return connector;
    } catch (error) {
      this.logConnectorCreation(name, 'pdf', false, error);
      throw error;
    }
  }
  
  /**
   * Create a connector based on type
   */
  public createConnector(
    type: ConnectorType,
    name: string,
    config: ConnectorConfig
  ): DataConnector {
    switch (type) {
      case 'cama':
        return this.createCAMAConnector(name, config as CAMAConnectorConfig);
      case 'gis':
        return this.createGISConnector(name, config as GISConnectorConfig);
      case 'market':
        return this.createMarketDataConnector(name, config as MarketDataConnectorConfig);
      case 'pdf':
        return this.createPDFConnector(name, config as PDFConnectorConfig);
      default:
        throw new Error(`Unsupported connector type: ${type}`);
    }
  }
  
  /**
   * Get a connector by name
   */
  public getConnector(name: string): DataConnector | undefined {
    return this.registry.getConnector(name);
  }
  
  /**
   * Get all registered connectors
   */
  public getAllConnectors(): DataConnector[] {
    return this.registry.getAllConnectors();
  }
  
  /**
   * Get connectors by type
   */
  public getConnectorsByType(type: string): DataConnector[] {
    return this.registry.getConnectorsByType(type);
  }
  
  /**
   * Log connector creation
   */
  private async logConnectorCreation(
    name: string,
    type: string,
    success: boolean,
    error?: any
  ): Promise<void> {
    try {
      if (success) {
        await storage.createLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          message: `Created ${type} connector: ${name}`,
          details: JSON.stringify({
            connector: name,
            type,
            success
          }),
          source: 'connector-factory',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['connector', 'creation', type, name]
        });
      } else {
        await storage.createLog({
          level: LogLevel.ERROR,
          category: LogCategory.SYSTEM,
          message: `Failed to create ${type} connector: ${name}`,
          details: JSON.stringify({
            connector: name,
            type,
            success,
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error
          }),
          source: 'connector-factory',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['connector', 'creation', 'error', type, name]
        });
      }
    } catch (logError) {
      console.error(`Failed to log connector creation:`, logError);
    }
  }
}

// Export the factory instance
export const connectorFactory = ConnectorFactory.getInstance();