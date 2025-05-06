import { connectorFactory } from './connector.factory';
import { CAMAConnectorConfig } from './cama.connector';
import { GISConnectorConfig } from './gis.connector';
import { MarketDataConnectorConfig } from './market.connector';
import { PDFConnectorConfig } from './pdf.connector';
import { WeatherConnectorConfig } from './weather.connector';
import { CensusConnectorConfig } from './census.connector';
import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../../storage';

/**
 * Default CAMA connector configurations
 */
const defaultCAMAConnectors: { name: string; config: CAMAConnectorConfig }[] = [
  {
    name: 'grandview-cama',
    config: {
      baseUrl: 'https://data.yakimacounty.us/api/v2/assessor',
      apiKey: process.env.YAKIMA_COUNTY_API_KEY || '',
      county: 'Yakima',
      state: 'WA',
      useAdvancedFiltering: true
    }
  }
];

/**
 * Default GIS connector configurations
 */
const defaultGISConnectors: { name: string; config: GISConnectorConfig }[] = [
  {
    name: 'grandview-gis',
    config: {
      baseUrl: 'https://mapbox-reverse-geocoding-api-latitude-and-longitude.p.rapidapi.com',
      apiKey: '451301875bmsh347cde0b3c6bf7ep1fad23jsn9f94e7d04b55',
      serviceType: 'mapbox',
      county: 'Yakima',
      state: 'WA'
    }
  }
];

/**
 * Default Market Data connector configurations
 */
const defaultMarketDataConnectors: { name: string; config: MarketDataConnectorConfig }[] = [
  {
    name: 'grandview-market',
    config: {
      dataDirectory: './attached_assets',
      defaultFormat: 'csv'
    }
  }
];

/**
 * Default PDF connector configurations
 */
const defaultPDFConnectors: { name: string; config: PDFConnectorConfig }[] = [
  {
    name: 'grandview-property-docs',
    config: {
      dataDirectory: './attached_assets'
    }
  }
];

/**
 * Default Weather connector configurations
 */
const defaultWeatherConnectors: { name: string; config: WeatherConnectorConfig }[] = [
  {
    name: 'weather-data',
    config: {
      baseUrl: 'https://weatherapi-com.p.rapidapi.com',
      apiKey: '451301875bmsh347cde0b3c6bf7ep1fad23jsn9f94e7d04b55',
      defaultLocation: 'Grandview,WA',
      units: 'imperial'
    }
  }
];

/**
 * Default Census connector configurations
 */
const defaultCensusConnectors: { name: string; config: CensusConnectorConfig }[] = [
  {
    name: 'census-data',
    config: {
      baseUrl: 'https://api.census.gov/data',
      apiKey: 'CENSUS_API_KEY',
      defaultYear: '2021',
      defaultState: '53' // Washington state FIPS code
    }
  }
];

/**
 * Initialize connectors with default configurations
 */
export async function initializeConnectors(): Promise<void> {
  try {
    // Register CAMA connectors
    for (const { name, config } of defaultCAMAConnectors) {
      console.log(`Registering demo CAMA connector: ${name}`);
      connectorFactory.createCAMAConnector(name, config);
      console.log(`Registered CAMA connector: ${name}`);
    }
    
    // Register GIS connectors
    for (const { name, config } of defaultGISConnectors) {
      connectorFactory.createGISConnector(name, config);
      console.log(`Registered GIS connector: ${name}`);
    }
    
    // Register Market Data connectors
    for (const { name, config } of defaultMarketDataConnectors) {
      connectorFactory.createMarketDataConnector(name, config);
      console.log(`Registered Market Data connector: ${name}`);
    }
    
    // Register PDF connectors
    for (const { name, config } of defaultPDFConnectors) {
      connectorFactory.createPDFConnector(name, config);
      console.log(`Registered PDF connector: ${name}`);
    }
    
    // Register Weather connectors
    for (const { name, config } of defaultWeatherConnectors) {
      // Replace the placeholder API key with the environment variable if available
      const apiKey = process.env.WEATHER_API_KEY || config.apiKey;
      const weatherConfig = { ...config, apiKey };
      connectorFactory.createWeatherConnector(name, weatherConfig);
      console.log(`Registered Weather connector: ${name}`);
    }
    
    // Register Census connectors
    for (const { name, config } of defaultCensusConnectors) {
      // Replace the placeholder API key with the environment variable if available
      const apiKey = process.env.CENSUS_API_KEY || config.apiKey;
      const censusConfig = { ...config, apiKey };
      connectorFactory.createCensusConnector(name, censusConfig);
      console.log(`Registered Census connector: ${name}`);
    }
    
    console.log('Connectors initialization completed');

    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'Connectors initialized successfully',
      details: JSON.stringify({
        camaConnectors: defaultCAMAConnectors.map(c => c.name),
        gisConnectors: defaultGISConnectors.map(c => c.name),
        marketConnectors: defaultMarketDataConnectors.map(c => c.name),
        pdfConnectors: defaultPDFConnectors.map(c => c.name),
        weatherConnectors: defaultWeatherConnectors.map(c => c.name),
        censusConnectors: defaultCensusConnectors.map(c => c.name)
      }),
      source: 'connectors-init',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['initialization', 'connectors']
    });
  } catch (error) {
    console.error('Error initializing connectors:', error);
    
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
      source: 'connectors-init',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['initialization', 'connectors', 'error']
    });
    
    throw error;
  }
}