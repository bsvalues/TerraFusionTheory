/**
 * Data Connector Runner for TerraFusion
 * 
 * This script demonstrates and tests the various data connectors
 * by fetching real data from external sources and saving it to the database.
 */

import { connectorFactory } from '../server/services/connectors/connector.factory';
import { testDatabaseConnection } from '../server/db';
import { storage } from '../server/storage';
import * as fs from 'fs';
import * as path from 'path';
import { LogLevel, LogCategory } from '../shared/schema';

// Configure API keys - you'll need to replace these with valid keys
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '451301875bmsh347cde0b3c6bf7ep1fad23jsn9f94e7d04b55';
const CENSUS_API_KEY = process.env.CENSUS_API_KEY || '';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || RAPIDAPI_KEY;

// Output directory for saved data
const OUTPUT_DIR = path.join(process.cwd(), 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Logging utility
function log(message: string, isError = false): void {
  const timestamp = new Date().toISOString();
  const prefix = isError ? '[ERROR]' : '[INFO]';
  console.log(`${prefix} ${timestamp} - ${message}`);
  
  // Also log to database
  storage.createLog({
    level: isError ? LogLevel.ERROR : LogLevel.INFO,
    category: LogCategory.SYSTEM,
    message,
    source: 'connector-runner',
    tags: ['data-import', 'connector']
  }).catch(err => console.error('Failed to log to database:', err));
}

// Test CAMA connector
async function testCAMAConnector() {
  try {
    log('Testing CAMA connector...');
    
    // Get connector
    const connector = connectorFactory.getConnector('grandview-cama');
    if (!connector) {
      throw new Error('CAMA connector not found');
    }
    
    // Update API key with type assertion
    (connector as any).config.apiKey = RAPIDAPI_KEY;
    
    // Test connection
    const connected = await connector.testConnection();
    log(`CAMA connector connection test: ${connected ? 'SUCCESS' : 'FAILED'}`);
    
    if (connected) {
      // Fetch a sample property by address
      const result = await connector.fetchData({
        address: '1100 S Euclid',
        city: 'Grandview',
        state: 'WA'
      });
      
      log(`CAMA data fetch: Found ${result.data.length} properties`);
      
      // Save result to file
      const outputPath = path.join(OUTPUT_DIR, 'cama_data.json');
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      log(`Saved CAMA data to ${outputPath}`);
      
      return result.data;
    }
  } catch (error) {
    log(`CAMA connector test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
  
  return [];
}

// Test GIS connector
async function testGISConnector() {
  try {
    log('Testing GIS connector...');
    
    // Get connector
    const connector = connectorFactory.getConnector('grandview-gis');
    if (!connector) {
      throw new Error('GIS connector not found');
    }
    
    // Update API key with type assertion
    (connector as any).config.apiKey = RAPIDAPI_KEY;
    
    // Test connection
    const connected = await connector.testConnection();
    log(`GIS connector connection test: ${connected ? 'SUCCESS' : 'FAILED'}`);
    
    if (connected) {
      // Geocode a sample address
      const result = await connector.fetchData({
        address: '715 W 5th St, Grandview, WA 98930'
      });
      
      log(`GIS data fetch: Found ${result.data.length} results`);
      
      // Save result to file
      const outputPath = path.join(OUTPUT_DIR, 'gis_data.json');
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      log(`Saved GIS data to ${outputPath}`);
      
      return result.data;
    }
  } catch (error) {
    log(`GIS connector test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
  
  return [];
}

// Test Market Data connector
async function testMarketDataConnector() {
  try {
    log('Testing Market Data connector...');
    
    // Get connector
    const connector = connectorFactory.getConnector('grandview-market');
    if (!connector) {
      throw new Error('Market Data connector not found');
    }
    
    // Test connection
    const connected = await connector.testConnection();
    log(`Market Data connector connection test: ${connected ? 'SUCCESS' : 'FAILED'}`);
    
    if (connected) {
      // Fetch properties in Grandview
      const result = await connector.fetchData({
        city: 'Grandview',
        state: 'WA',
        limit: 50
      });
      
      log(`Market data fetch: Found ${result.data.length} properties`);
      
      // Save result to file
      const outputPath = path.join(OUTPUT_DIR, 'market_data.json');
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      log(`Saved Market data to ${outputPath}`);
      
      return result.data;
    }
  } catch (error) {
    log(`Market Data connector test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
  
  return [];
}

// Test PDF connector
async function testPDFConnector() {
  try {
    log('Testing PDF connector...');
    
    // Get connector
    const connector = connectorFactory.getConnector('grandview-property-docs');
    if (!connector) {
      throw new Error('PDF connector not found');
    }
    
    // Test connection
    const connected = await connector.testConnection();
    log(`PDF connector connection test: ${connected ? 'SUCCESS' : 'FAILED'}`);
    
    if (connected) {
      // List available PDF files - using type assertion for non-interface methods
      const files = await (connector as any).listFiles();
      log(`PDF connector: Found ${files.length} PDF files`);
      
      if (files.length > 0) {
        // Parse first PDF file - using type assertion for non-interface methods
        const result = await (connector as any).parseFile(files[0]);
        
        log(`PDF parse: Extracted ${Object.keys(result).length} fields`);
        
        // Save result to file
        const outputPath = path.join(OUTPUT_DIR, 'pdf_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        log(`Saved PDF data to ${outputPath}`);
        
        return result;
      }
    }
  } catch (error) {
    log(`PDF connector test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
  
  return {};
}

// Test Weather connector
async function testWeatherConnector() {
  try {
    log('Testing Weather connector...');
    
    // Get connector
    const connector = connectorFactory.getConnector('weather-data');
    if (!connector) {
      throw new Error('Weather connector not found');
    }
    
    // Update API key with type assertion
    (connector as any).config.apiKey = WEATHER_API_KEY;
    
    // Test connection
    const connected = await connector.testConnection();
    log(`Weather connector connection test: ${connected ? 'SUCCESS' : 'FAILED'}`);
    
    if (connected) {
      // Get weather for Grandview, WA
      const result = await connector.fetchData({
        location: 'Grandview,WA',
        days: 3
      });
      
      log(`Weather data fetch: Found forecast for ${result.location?.name}`);
      
      // Save result to file
      const outputPath = path.join(OUTPUT_DIR, 'weather_data.json');
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      log(`Saved Weather data to ${outputPath}`);
      
      return result;
    }
  } catch (error) {
    log(`Weather connector test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
  
  return {};
}

// Test Census connector
async function testCensusConnector() {
  try {
    log('Testing Census connector...');
    
    // Get connector
    const connector = connectorFactory.getConnector('census-data');
    if (!connector) {
      throw new Error('Census connector not found');
    }
    
    // Update API key if available with type assertion
    if (CENSUS_API_KEY) {
      (connector as any).config.apiKey = CENSUS_API_KEY;
    }
    
    // Test connection
    const connected = await connector.testConnection();
    log(`Census connector connection test: ${connected ? 'SUCCESS' : 'FAILED'}`);
    
    if (connected) {
      // Get demographics for Yakima County, WA
      const result = await connector.fetchData({
        geography: 'county:077',
        state: '53', // Washington
        tables: ['DP05'] // Demographic data
      });
      
      log(`Census data fetch: Found ${Object.keys(result.data).length} demographic indicators`);
      
      // Save result to file
      const outputPath = path.join(OUTPUT_DIR, 'census_data.json');
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      log(`Saved Census data to ${outputPath}`);
      
      return result.data;
    }
  } catch (error) {
    log(`Census connector test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
  
  return {};
}

// Run spatial analysis based on collected data
async function runSpatialAnalysis(properties: any[]) {
  try {
    log('Running spatial analysis on property data...');
    
    if (properties.length === 0) {
      log('No properties available for spatial analysis');
      return;
    }
    
    // Extract location data with proper type handling
    const locations = properties
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        id: p.mlsNumber || p.id,
        lat: parseFloat(p.latitude),
        lng: parseFloat(p.longitude),
        price: parseFloat(p.price || p.marketValue || '0'),
        address: p.address
      }));
    
    if (locations.length === 0) {
      log('No geocoded properties available for spatial analysis');
      return;
    }
    
    log(`Performing spatial analysis on ${locations.length} properties`);
    
    // Calculate basic spatial statistics
    const totalProperties = locations.length;
    const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / totalProperties;
    const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / totalProperties;
    
    // Simple price heatmap - divide area into grids
    const gridSize = 0.01; // Approximately 1km grid cells
    const grids: Record<string, { count: number, totalPrice: number, avgPrice: number }> = {};
    
    locations.forEach(loc => {
      const gridX = Math.floor(loc.lng / gridSize);
      const gridY = Math.floor(loc.lat / gridSize);
      const gridKey = `${gridX},${gridY}`;
      
      if (!grids[gridKey]) {
        grids[gridKey] = { count: 0, totalPrice: 0, avgPrice: 0 };
      }
      
      grids[gridKey].count++;
      grids[gridKey].totalPrice += loc.price;
    });
    
    // Calculate average price for each grid
    Object.keys(grids).forEach(key => {
      const grid = grids[key];
      grid.avgPrice = grid.totalPrice / grid.count;
    });
    
    // Export to GeoJSON
    const features = Object.keys(grids).map(key => {
      const [gridX, gridY] = key.split(',').map(Number);
      const grid = grids[key];
      
      return {
        type: 'Feature',
        properties: {
          count: grid.count,
          avgPrice: grid.avgPrice,
          totalPrice: grid.totalPrice
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [gridX * gridSize, gridY * gridSize],
            [(gridX + 1) * gridSize, gridY * gridSize],
            [(gridX + 1) * gridSize, (gridY + 1) * gridSize],
            [gridX * gridSize, (gridY + 1) * gridSize],
            [gridX * gridSize, gridY * gridSize]
          ]]
        }
      };
    });
    
    const geoJson = {
      type: 'FeatureCollection',
      features
    };
    
    // Save result to file
    const outputPath = path.join(OUTPUT_DIR, 'spatial_analysis.json');
    fs.writeFileSync(outputPath, JSON.stringify(geoJson, null, 2));
    log(`Saved spatial analysis to ${outputPath}`);
    
    // Create a summary file
    const summary = {
      totalProperties,
      center: { lat: avgLat, lng: avgLng },
      gridCells: Object.keys(grids).length,
      priceRange: {
        min: Math.min(...Object.values(grids).map(g => g.avgPrice)),
        max: Math.max(...Object.values(grids).map(g => g.avgPrice)),
        avg: Object.values(grids).reduce((sum, g) => sum + g.avgPrice, 0) / Object.keys(grids).length
      }
    };
    
    const summaryPath = path.join(OUTPUT_DIR, 'spatial_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    log(`Saved spatial summary to ${summaryPath}`);
    
  } catch (error) {
    log(`Spatial analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
}

// Main function to run all connector tests and analysis
async function main() {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      log('Database connection failed, aborting connector tests', true);
      return;
    }
    
    log('Starting connector tests');
    
    // Run all connector tests
    const camaData = await testCAMAConnector();
    const gisData = await testGISConnector();
    const marketData = await testMarketDataConnector();
    const pdfData = await testPDFConnector();
    const weatherData = await testWeatherConnector();
    const censusData = await testCensusConnector();
    
    // Combine property data from different sources for spatial analysis
    const properties = [
      ...camaData,
      ...marketData
    ];
    
    // Run spatial analysis
    await runSpatialAnalysis(properties);
    
    log('All connector tests completed');
    
  } catch (error) {
    log(`Error running connector tests: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
}

// Run the main function
main()
  .then(() => {
    log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    log(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    process.exit(1);
  });