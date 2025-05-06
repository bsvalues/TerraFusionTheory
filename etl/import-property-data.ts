/**
 * Property Data Import Script
 * 
 * This script imports property data from CSV files into the PostgreSQL database.
 * It handles property, sales, and neighborhood data according to IAAO standards.
 */
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../server/db';
import { 
  properties, propertySales, neighborhoods,
  insertPropertySchema, insertPropertySaleSchema, insertNeighborhoodSchema
} from '../shared/schema';
import { z } from 'zod';
import { PropertyType, TransactionType } from '../shared/schema';

// Configuration for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const PROPERTIES_FILE = 'properties.csv';
const SALES_FILE = 'property_sales.csv';
const NEIGHBORHOODS_FILE = 'neighborhoods.csv';

type RawPropertyData = Record<string, string>;
type RawSaleData = Record<string, string>;
type RawNeighborhoodData = Record<string, string>;

/**
 * Transform raw CSV data into properly formatted property data
 */
function transformPropertyData(raw: RawPropertyData) {
  // Clean and transform the data according to schema requirements
  return {
    parcelId: raw.parcel_id || raw.parcelId || '',
    address: raw.address || '',
    city: raw.city || '',
    state: raw.state || '',
    zipCode: raw.zip_code || raw.zipCode || '',
    county: raw.county || '',
    propertyType: (raw.property_type || raw.propertyType || 'RESIDENTIAL') as PropertyType,
    landUse: raw.land_use || raw.landUse || null,
    yearBuilt: raw.year_built || raw.yearBuilt ? parseInt(raw.year_built || raw.yearBuilt) : null,
    buildingArea: raw.building_area || raw.buildingArea ? String(raw.building_area || raw.buildingArea) : null,
    lotSize: raw.lot_size || raw.lotSize ? String(raw.lot_size || raw.lotSize) : null,
    bedrooms: raw.bedrooms ? parseInt(raw.bedrooms) : null,
    bathrooms: raw.bathrooms ? String(raw.bathrooms) : null,
    stories: raw.stories ? parseInt(raw.stories) : null,
    condition: raw.condition || null,
    quality: raw.quality || null,
    heatingType: raw.heating_type || raw.heatingType || null,
    coolingType: raw.cooling_type || raw.coolingType || null,
    garageType: raw.garage_type || raw.garageType || null,
    garageCapacity: raw.garage_capacity || raw.garageCapacity ? parseInt(raw.garage_capacity || raw.garageCapacity) : null,
    basement: raw.basement ? raw.basement.toLowerCase() === 'true' : false,
    roofType: raw.roof_type || raw.roofType || null,
    externalWallType: raw.external_wall_type || raw.externalWallType || null,
    foundationType: raw.foundation_type || raw.foundationType || null,
    porchType: raw.porch_type || raw.porchType || null,
    deckType: raw.deck_type || raw.deckType || null,
    poolType: raw.pool_type || raw.poolType || null,
    assessedValue: raw.assessed_value || raw.assessedValue ? String(raw.assessed_value || raw.assessedValue) : null,
    marketValue: raw.market_value || raw.marketValue ? String(raw.market_value || raw.marketValue) : null,
    taxableValue: raw.taxable_value || raw.taxableValue ? String(raw.taxable_value || raw.taxableValue) : null,
    lastSalePrice: raw.last_sale_price || raw.lastSalePrice ? String(raw.last_sale_price || raw.lastSalePrice) : null,
    lastSaleDate: raw.last_sale_date || raw.lastSaleDate ? raw.last_sale_date || raw.lastSaleDate : null,
    latitude: raw.latitude ? parseFloat(raw.latitude) : null,
    longitude: raw.longitude ? parseFloat(raw.longitude) : null,
    zoning: raw.zoning || null,
    floodZone: raw.flood_zone || raw.floodZone || null,
    parcelGeometry: raw.parcel_geometry || raw.parcelGeometry ? JSON.parse(raw.parcel_geometry || raw.parcelGeometry) : null,
    taxDistrict: raw.tax_district || raw.taxDistrict || null,
    school: raw.school || null,
    neighborhood: raw.neighborhood || null,
    neighborhoodCode: raw.neighborhood_code || raw.neighborhoodCode || null,
    metadata: {},
    images: raw.images ? (typeof raw.images === 'string' ? [raw.images] : JSON.parse(raw.images)) : null,
  };
}

/**
 * Transform raw CSV data into properly formatted property sale data
 */
function transformSaleData(raw: RawSaleData) {
  return {
    propertyId: raw.property_id || raw.propertyId ? parseInt(raw.property_id || raw.propertyId) : 0, // Must be set later
    parcelId: raw.parcel_id || raw.parcelId || '',
    salePrice: raw.sale_price || raw.salePrice ? String(raw.sale_price || raw.salePrice) : '0',
    saleDate: raw.sale_date || raw.saleDate ? raw.sale_date || raw.saleDate : new Date().toISOString().split('T')[0],
    transactionType: (raw.transaction_type || raw.transactionType || 'SALE') as TransactionType,
    deedType: raw.deed_type || raw.deedType || null,
    buyerName: raw.buyer_name || raw.buyerName || null,
    sellerName: raw.seller_name || raw.sellerName || null,
    verified: raw.verified ? raw.verified.toLowerCase() === 'true' : false,
    validForAnalysis: raw.valid_for_analysis || raw.validForAnalysis ? 
                     (raw.valid_for_analysis || raw.validForAnalysis).toLowerCase() === 'true' : true,
    financingType: raw.financing_type || raw.financingType || null,
    assessedValueAtSale: raw.assessed_value_at_sale || raw.assessedValueAtSale ? 
                        String(raw.assessed_value_at_sale || raw.assessedValueAtSale) : null,
    salePricePerSqFt: raw.sale_price_per_sqft || raw.salePricePerSqFt ? 
                     String(raw.sale_price_per_sqft || raw.salePricePerSqFt) : null,
    assessmentRatio: raw.assessment_ratio || raw.assessmentRatio ? 
                    String(raw.assessment_ratio || raw.assessmentRatio) : null,
    metadata: {},
  };
}

/**
 * Transform raw CSV data into properly formatted neighborhood data
 */
function transformNeighborhoodData(raw: RawNeighborhoodData) {
  return {
    name: raw.name || '',
    code: raw.code || '',
    city: raw.city || '',
    county: raw.county || '',
    state: raw.state || '',
    description: raw.description || null,
    characteristics: raw.characteristics ? JSON.parse(raw.characteristics) : {},
    boundaries: raw.boundaries ? JSON.parse(raw.boundaries) : null,
    medianHomeValue: raw.median_home_value || raw.medianHomeValue ? 
                    String(raw.median_home_value || raw.medianHomeValue) : null,
    avgHomeValue: raw.avg_home_value || raw.avgHomeValue ? 
                String(raw.avg_home_value || raw.avgHomeValue) : null,
    avgYearBuilt: raw.avg_year_built || raw.avgYearBuilt ? 
                String(raw.avg_year_built || raw.avgYearBuilt) : null,
    totalProperties: raw.total_properties || raw.totalProperties ? 
                   parseInt(raw.total_properties || raw.totalProperties) : null,
    totalSales: raw.total_sales || raw.totalSales ? 
              parseInt(raw.total_sales || raw.totalSales) : null,
    avgSalePrice: raw.avg_sale_price || raw.avgSalePrice ? 
                String(raw.avg_sale_price || raw.avgSalePrice) : null,
    medianSalePrice: raw.median_sale_price || raw.medianSalePrice ? 
                   String(raw.median_sale_price || raw.medianSalePrice) : null,
    avgDaysOnMarket: raw.avg_days_on_market || raw.avgDaysOnMarket ? 
                   String(raw.avg_days_on_market || raw.avgDaysOnMarket) : null,
    schoolRating: raw.school_rating || raw.schoolRating ? 
                String(raw.school_rating || raw.schoolRating) : null,
    crimeRate: raw.crime_rate || raw.crimeRate ? 
             String(raw.crime_rate || raw.crimeRate) : null,
    walkScore: raw.walk_score || raw.walkScore ? 
             String(raw.walk_score || raw.walkScore) : null,
    transitScore: raw.transit_score || raw.transitScore ? 
                String(raw.transit_score || raw.transitScore) : null,
    metadata: {},
  };
}

/**
 * Parse a CSV file using a streaming approach to handle large files
 */
async function parseCSV(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const results: Record<string, string>[] = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Import property data from CSV
 */
async function importProperties() {
  try {
    const filePath = path.join(DATA_DIR, PROPERTIES_FILE);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Properties file not found at ${filePath}. Skipping property import.`);
      return [];
    }
    
    console.log(`Importing properties from ${filePath}...`);
    const rawData = await parseCSV(filePath);
    console.log(`Found ${rawData.length} property records`);
    
    const propertyData = rawData.map(transformPropertyData);
    
    // Validate data using Zod schema
    const validProperties = [];
    const invalidProperties = [];
    
    for (const property of propertyData) {
      try {
        const validatedProperty = insertPropertySchema.parse(property);
        validProperties.push(validatedProperty);
      } catch (error) {
        invalidProperties.push({ property, error });
      }
    }
    
    console.log(`${validProperties.length} valid properties, ${invalidProperties.length} invalid`);
    
    if (invalidProperties.length > 0) {
      console.log('First invalid property:', invalidProperties[0]);
    }
    
    // Insert valid properties into database
    if (validProperties.length > 0) {
      console.log(`Inserting ${validProperties.length} properties into database...`);
      const insertedProperties = await db.insert(properties).values(validProperties).returning();
      console.log(`Successfully inserted ${insertedProperties.length} properties`);
      return insertedProperties;
    }
    
    return [];
  } catch (error) {
    console.error('Error importing properties:', error);
    return [];
  }
}

/**
 * Import sales data from CSV
 */
async function importSales(propertiesMap: Map<string, number>) {
  try {
    const filePath = path.join(DATA_DIR, SALES_FILE);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Sales file not found at ${filePath}. Skipping sales import.`);
      return;
    }
    
    console.log(`Importing property sales from ${filePath}...`);
    const rawData = await parseCSV(filePath);
    console.log(`Found ${rawData.length} sale records`);
    
    const salesData = rawData.map(transformSaleData);
    
    // Match sales with property IDs
    salesData.forEach(sale => {
      if (propertiesMap.has(sale.parcelId)) {
        sale.propertyId = propertiesMap.get(sale.parcelId) || 0;
      }
    });
    
    // Validate data using Zod schema
    const validSales = [];
    const invalidSales = [];
    
    for (const sale of salesData) {
      try {
        const validatedSale = insertPropertySaleSchema.parse(sale);
        validSales.push(validatedSale);
      } catch (error) {
        invalidSales.push({ sale, error });
      }
    }
    
    console.log(`${validSales.length} valid sales, ${invalidSales.length} invalid`);
    
    if (invalidSales.length > 0) {
      console.log('First invalid sale:', invalidSales[0]);
    }
    
    // Insert valid sales into database
    if (validSales.length > 0) {
      console.log(`Inserting ${validSales.length} sales into database...`);
      const insertedSales = await db.insert(propertySales).values(validSales).returning();
      console.log(`Successfully inserted ${insertedSales.length} sales`);
    }
  } catch (error) {
    console.error('Error importing sales:', error);
  }
}

/**
 * Import neighborhood data from CSV
 */
async function importNeighborhoods() {
  try {
    const filePath = path.join(DATA_DIR, NEIGHBORHOODS_FILE);
    
    if (!fs.existsSync(filePath)) {
      console.log(`Neighborhoods file not found at ${filePath}. Skipping neighborhoods import.`);
      return;
    }
    
    console.log(`Importing neighborhoods from ${filePath}...`);
    const rawData = await parseCSV(filePath);
    console.log(`Found ${rawData.length} neighborhood records`);
    
    const neighborhoodData = rawData.map(transformNeighborhoodData);
    
    // Validate data using Zod schema
    const validNeighborhoods = [];
    const invalidNeighborhoods = [];
    
    for (const neighborhood of neighborhoodData) {
      try {
        const validatedNeighborhood = insertNeighborhoodSchema.parse(neighborhood);
        validNeighborhoods.push(validatedNeighborhood);
      } catch (error) {
        invalidNeighborhoods.push({ neighborhood, error });
      }
    }
    
    console.log(`${validNeighborhoods.length} valid neighborhoods, ${invalidNeighborhoods.length} invalid`);
    
    if (invalidNeighborhoods.length > 0) {
      console.log('First invalid neighborhood:', invalidNeighborhoods[0]);
    }
    
    // Insert valid neighborhoods into database
    if (validNeighborhoods.length > 0) {
      console.log(`Inserting ${validNeighborhoods.length} neighborhoods into database...`);
      const insertedNeighborhoods = await db.insert(neighborhoods).values(validNeighborhoods).returning();
      console.log(`Successfully inserted ${insertedNeighborhoods.length} neighborhoods`);
    }
  } catch (error) {
    console.error('Error importing neighborhoods:', error);
  }
}

/**
 * Main import function
 */
async function importAllData() {
  console.log('Starting data import process...');
  
  try {
    // First import properties
    const importedProperties = await importProperties();
    
    // Create a map of parcel IDs to property IDs for sales relationship
    const propertiesMap = new Map<string, number>();
    importedProperties.forEach(property => {
      propertiesMap.set(property.parcelId, property.id);
    });
    
    // Then import sales with property references
    await importSales(propertiesMap);
    
    // Finally import neighborhoods
    await importNeighborhoods();
    
    console.log('Data import process completed successfully!');
  } catch (error) {
    console.error('Error in data import process:', error);
  }
}

// Check if data directory exists, create if not
if (!fs.existsSync(DATA_DIR)) {
  console.log(`Creating data directory at ${DATA_DIR}...`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Run the import process
importAllData()
  .then(() => {
    console.log('Import completed. Exiting...');
    process.exit(0);
  })
  .catch(err => {
    console.error('Import failed:', err);
    process.exit(1);
  });