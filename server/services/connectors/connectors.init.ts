import { connectorFactory } from './connector.factory';
import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../../storage';

/**
 * Default CAMA connector configurations
 */
const defaultCAMAConnectors = [
  // These would typically come from environment variables or configuration files
  {
    name: 'demo-cama',
    baseUrl: process.env.DEMO_CAMA_URL || 'https://api.example.com/cama',
    apiKey: process.env.DEMO_CAMA_KEY || 'demo-key',
    county: 'Demo County',
    state: 'DS',
    timeout: 30000
  }
];

/**
 * Default GIS connector configurations
 */
const defaultGISConnectors = [
  // These would typically come from environment variables or configuration files
  {
    name: 'demo-gis',
    baseUrl: process.env.DEMO_GIS_URL || 'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services',
    serviceType: 'arcgis' as const,
    apiKey: process.env.DEMO_GIS_KEY || '',
    featureUrl: 'Addresses/FeatureServer/0/query', // Using Addresses feature service with layer ID 0
    timeout: 30000
  }
];

/**
 * Initialize connectors with default configurations
 */
export async function initializeConnectors(): Promise<void> {
  try {
    // Create and register CAMA connectors
    for (const config of defaultCAMAConnectors) {
      try {
        // For demo purposes, we'll register the connector even with demo key
        // But in production, you would want to skip registration if the API key is not valid
        if (config.apiKey === 'demo-key') {
          console.log(`Registering demo CAMA connector: ${config.name}`);
        }
        
        const connector = connectorFactory.createCAMAConnector(config.name, config);
        console.log(`Registered CAMA connector: ${connector.getName()}`);
      } catch (error) {
        console.error(`Failed to register CAMA connector ${config.name}:`, error);
        await storage.createLog({
          level: LogLevel.ERROR,
          category: LogCategory.SYSTEM,
          message: `Failed to register CAMA connector ${config.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: JSON.stringify({
            connectorName: config.name,
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error
          }),
          source: 'connector-init',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['connector', 'initialization', 'error', 'cama']
        });
      }
    }
    
    // Create and register GIS connectors
    for (const config of defaultGISConnectors) {
      try {
        // For demo purposes, we'll register the connector even with demo key
        // But in production, you would want to skip registration if the API key is not valid
        if (config.apiKey === 'demo-key') {
          console.log(`Registering demo GIS connector: ${config.name}`);
        }
        
        const connector = connectorFactory.createGISConnector(config.name, config);
        console.log(`Registered GIS connector: ${connector.getName()}`);
      } catch (error) {
        console.error(`Failed to register GIS connector ${config.name}:`, error);
        await storage.createLog({
          level: LogLevel.ERROR,
          category: LogCategory.SYSTEM,
          message: `Failed to register GIS connector ${config.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: JSON.stringify({
            connectorName: config.name,
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error
          }),
          source: 'connector-init',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['connector', 'initialization', 'error', 'gis']
        });
      }
    }
    
    // Log successful initialization
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: `Initialized default connectors`,
      details: JSON.stringify({
        camaCount: defaultCAMAConnectors.length,
        gisCount: defaultGISConnectors.length,
      }),
      source: 'connector-init',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['connector', 'initialization']
    });
    
    console.log(`Connectors initialization completed`);
  } catch (error) {
    console.error('Failed to initialize connectors:', error);
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message: `Failed to initialize connectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }),
      source: 'connector-init',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['connector', 'initialization', 'error']
    });
  }
}