/**
 * CSV Data Import Utility for TerraFusion
 * 
 * This utility imports real estate data from CSV files into the TerraFusion database.
 * It can process the CMA_Spreadsheet and Titan_Analytics CSV files to populate:
 * - Properties table
 * - PropertySales table
 * - Neighborhoods table (derived from property data)
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { 
  properties, propertySales, neighborhoods,
  PropertyType, PropertyStatus, TransactionType
} from '../shared/schema';
import { testDatabaseConnection } from '../server/db';

// Configuration
const ASSETS_DIR = path.join(process.cwd(), 'attached_assets');
const DEFAULT_CSV_ENCODING = 'utf8';

// Logging utility
function log(message: string, isError = false): void {
  const timestamp = new Date().toISOString();
  const prefix = isError ? '[ERROR]' : '[INFO]';
  console.log(`${prefix} ${timestamp} - ${message}`);
}

// Parse a CSV file
async function parseCSVFile(filepath: string): Promise<any[]> {
  try {
    log(`Parsing CSV file: ${path.basename(filepath)}`);
    const content = fs.readFileSync(filepath, DEFAULT_CSV_ENCODING);
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      skip_records_with_error: true
    });
    log(`Successfully parsed ${records.length} records from ${path.basename(filepath)}`);
    return records;
  } catch (error) {
    log(`Failed to parse CSV file ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    throw error;
  }
}

// Clean a price value (handle '$', commas, etc.)
function cleanPrice(price: string | number | undefined): number | null {
  if (price === undefined || price === '') return null;
  if (typeof price === 'number') return price;
  return parseFloat(price.replace(/[^0-9.-]+/g, '')) || null;
}

// Parse a date string to a Date object
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  
  try {
    // Check if it's a valid date string
    const date = new Date(dateStr);
    
    // If invalid date or year is far in the future (like 2024), adjust:
    if (isNaN(date.getTime()) || date.getFullYear() > new Date().getFullYear() + 1) {
      return null;
    }
    
    return date;
  } catch (e) {
    return null;
  }
}

// Get a field value with multiple possible field names
function getField(possibleFields: string[], record: any): any {
  for (const field of possibleFields) {
    if (record[field] !== undefined && record[field] !== '') {
      return record[field];
    }
  }
  return undefined;
}

// Parse a string to number, handling commas and other formatting
function parseNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  
  // Remove commas, dollar signs, etc., and parse
  const cleanValue = value.toString().replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? null : parsed;
}

// Map a property type to our enum
function mapPropertyType(type: string | undefined): PropertyType {
  if (!type) return PropertyType.RESIDENTIAL;
  
  const typeStr = type.toLowerCase();
  
  if (typeStr.includes('commercial')) return PropertyType.COMMERCIAL;
  if (typeStr.includes('industrial')) return PropertyType.INDUSTRIAL;
  if (typeStr.includes('agricultural')) return PropertyType.AGRICULTURAL;
  if (typeStr.includes('vacant') || typeStr.includes('land')) return PropertyType.VACANT_LAND;
  if (typeStr.includes('mixed')) return PropertyType.MIXED_USE;
  if (typeStr.includes('special')) return PropertyType.SPECIAL_PURPOSE;
  
  return PropertyType.RESIDENTIAL;
}

// Map a property status to our enum
function mapPropertyStatus(status: string | undefined): PropertyStatus {
  if (!status) return PropertyStatus.OFF_MARKET;
  
  const statusStr = status.toLowerCase();
  
  if (statusStr.includes('sold')) return PropertyStatus.SOLD;
  if (statusStr.includes('pending')) return PropertyStatus.PENDING;
  if (statusStr.includes('active')) return PropertyStatus.ACTIVE;
  if (statusStr.includes('foreclosure')) return PropertyStatus.FORECLOSURE;
  if (statusStr.includes('short sale')) return PropertyStatus.SHORT_SALE;
  
  return PropertyStatus.OFF_MARKET;
}

// Map a transaction type to our enum
function mapTransactionType(type: string | undefined): TransactionType {
  if (!type) return TransactionType.SALE;
  
  const typeStr = type.toLowerCase();
  
  if (typeStr.includes('refinance')) return TransactionType.REFINANCE;
  if (typeStr.includes('foreclosure')) return TransactionType.FORECLOSURE;
  if (typeStr.includes('auction')) return TransactionType.AUCTION;
  if (typeStr.includes('short sale')) return TransactionType.SHORT_SALE;
  
  return TransactionType.SALE;
}

// Create a unique parcel ID if one is not provided
function createParcelId(record: any): string {
  const mlsNumber = getField(['MLS #', 'MLS#'], record);
  const taxId = getField(['Tax ID', 'Tax Parcel #'], record);
  const address = getField(['Address'], record);
  const city = getField(['City'], record);
  const state = getField(['State'], record);
  
  if (taxId) return taxId;
  if (mlsNumber) return `MLS-${mlsNumber}`;
  
  if (address && city && state) {
    return `${address.replace(/[^a-zA-Z0-9]/g, '')}-${city}-${state}`.toUpperCase();
  }
  
  // Last resort: generate a random ID
  return `GEN-${Math.floor(Math.random() * 1000000)}`;
}

// Convert a CSV record to a property object for database insertion
function mapRecordToProperty(record: any) {
  // Handle various field names for the same data
  const mlsNumber = getField(['MLS #', 'MLS#'], record);
  const address = getField(['Address'], record);
  const city = getField(['City'], record);
  const state = getField(['State'], record);
  const zipCode = getField(['Zip', 'Zip Code'], record);
  const county = getField(['County'], record);
  const propertyTypeStr = getField(['Property Type', 'PropType'], record);
  const yearBuilt = parseNumber(getField(['Year Built'], record));
  const buildingArea = parseNumber(getField(['Total SQFT', 'Finished SQFT', 'Living Area (sq ft)'], record));
  const lotSize = parseNumber(getField(['Lot Sq Ft', 'Lot Size', 'Number of Acres'], record));
  const bedrooms = parseNumber(getField(['Bedrooms', 'Beds'], record));
  const bathrooms = parseNumber(getField(['Total Baths', '# of Full Baths'], record));
  const stories = parseNumber(getField(['Levels', 'Stories'], record));
  const condition = getField(['Condition'], record);
  const quality = getField(['Quality'], record);
  const heatingType = getField(['Hvac', 'Heating Type'], record);
  const coolingType = getField(['Cooling Type'], record);
  const garageType = getField(['Garage/Parking', 'Garage Type'], record);
  const garageCapacity = parseNumber(getField(['Garage Capacity'], record));
  const basement = getField(['Basement'], record) === 'Yes';
  const assessedValue = parseNumber(getField(['Assessed Value', 'Tax'], record));
  const marketValue = parseNumber(getField(['Price', 'Asking Price'], record));
  const lastSalePrice = parseNumber(getField(['Sold Price'], record));
  const lastSaleDate = parseDate(getField(['Closing Date'], record));
  const latitude = parseNumber(getField(['Latitude'], record));
  const longitude = parseNumber(getField(['Longitude'], record));
  const neighborhood = getField(['Neighborhood', 'Subdivision'], record);
  
  // Generate a unique parcel ID if not provided
  const parcelId = getField(['Tax Parcel #', 'Parcel ID', 'APN'], record) || createParcelId(record);
  
  // Map property type and status to enums
  const propertyType = mapPropertyType(propertyTypeStr);
  const statusStr = getField(['Status'], record);
  const status = mapPropertyStatus(statusStr);
  
  // Create the property object
  return {
    parcelId,
    address: address || 'Unknown',
    city: city || 'Unknown',
    state: state || 'Unknown',
    zipCode: zipCode || 'Unknown',
    county: county || 'Unknown',
    propertyType,
    landUse: propertyTypeStr || null,
    yearBuilt: yearBuilt || null,
    buildingArea: buildingArea || null,
    lotSize: lotSize || null,
    bedrooms: bedrooms || null,
    bathrooms: bathrooms || null,
    stories: stories || null,
    condition: condition || null,
    quality: quality || null,
    heatingType: heatingType || null,
    coolingType: coolingType || null,
    garageType: garageType || null,
    garageCapacity: garageCapacity || null,
    basement,
    assessedValue: assessedValue || null,
    marketValue: marketValue || null,
    lastSalePrice: lastSalePrice || null,
    lastSaleDate: lastSaleDate || null,
    latitude: latitude || null,
    longitude: longitude || null,
    neighborhood: neighborhood || null,
    metadata: {
      mlsNumber,
      originalRecord: JSON.stringify({
        mlsNumber,
        address,
        status: statusStr
      })
    }
  };
}

// Convert a CSV record to a property sale object for database insertion
function mapRecordToPropertySale(record: any, propertyId: number) {
  const mlsNumber = getField(['MLS #', 'MLS#'], record);
  const parcelId = getField(['Tax Parcel #', 'Parcel ID', 'APN'], record) || createParcelId(record);
  const salePrice = parseNumber(getField(['Sold Price'], record));
  const saleDate = parseDate(getField(['Closing Date'], record));
  const transactionTypeStr = getField(['How Sold'], record);
  const deedType = getField(['Deed Type'], record);
  const buyerName = getField(['Buyer Name'], record);
  const sellerName = getField(['Seller Name', 'Owner'], record);
  const financingType = getField(['Financing'], record);
  const assessedValueAtSale = parseNumber(getField(['Assessed Value at Sale'], record));
  const pricePerSqFt = parseNumber(getField(['Sold Price Per SQFT', 'Price Per Sqft'], record));
  
  // Skip if no sale price or date
  if (!salePrice || !saleDate) {
    return null;
  }
  
  // Create the property sale object
  return {
    propertyId,
    parcelId,
    salePrice,
    saleDate,
    transactionType: mapTransactionType(transactionTypeStr),
    deedType: deedType || null,
    buyerName: buyerName || null,
    sellerName: sellerName || null,
    verified: true,
    validForAnalysis: true,
    financingType: financingType || null,
    assessedValueAtSale: assessedValueAtSale || null,
    salePricePerSqFt: pricePerSqFt || null,
    metadata: {
      mlsNumber,
      originalRecord: JSON.stringify({
        mlsNumber,
        salePrice,
        saleDate: saleDate.toISOString()
      })
    }
  };
}

// Extract neighborhoods from property records and compute aggregate statistics
async function extractAndSaveNeighborhoods(propertyRecords: any[]): Promise<void> {
  log('Extracting neighborhood data from property records');
  
  // Group properties by neighborhood
  const neighborhoodMap = new Map<string, any[]>();
  
  for (const record of propertyRecords) {
    const neighborhood = record.neighborhood || 'Unknown';
    if (!neighborhoodMap.has(neighborhood)) {
      neighborhoodMap.set(neighborhood, []);
    }
    neighborhoodMap.get(neighborhood)?.push(record);
  }
  
  // Process each neighborhood
  const neighborhoodData = [];
  
  for (const [name, properties] of neighborhoodMap.entries()) {
    if (name === 'Unknown' || properties.length < 2) continue;
    
    // Compute statistics
    const homeValues = properties
      .map(p => p.marketValue)
      .filter(v => v !== null && v > 0);
    
    const salesPrices = properties
      .map(p => p.lastSalePrice)
      .filter(v => v !== null && v > 0);
    
    const yearBuiltValues = properties
      .map(p => p.yearBuilt)
      .filter(v => v !== null && v > 1800 && v < 2100);
    
    // Only proceed if we have enough data
    if (homeValues.length < 2) continue;
    
    const avgHomeValue = homeValues.reduce((sum, val) => sum + val, 0) / homeValues.length;
    const medianHomeValue = homeValues.sort((a, b) => a - b)[Math.floor(homeValues.length / 2)];
    
    let avgSalePrice = null;
    let medianSalePrice = null;
    
    if (salesPrices.length > 0) {
      avgSalePrice = salesPrices.reduce((sum, val) => sum + val, 0) / salesPrices.length;
      medianSalePrice = salesPrices.sort((a, b) => a - b)[Math.floor(salesPrices.length / 2)];
    }
    
    let avgYearBuilt = null;
    if (yearBuiltValues.length > 0) {
      avgYearBuilt = Math.round(yearBuiltValues.reduce((sum, val) => sum + val, 0) / yearBuiltValues.length);
    }
    
    // Get a representative property for location data
    const city = properties[0]?.city || 'Unknown';
    const state = properties[0]?.state || 'Unknown';
    const county = properties[0]?.county || 'Unknown';
    
    // Create a unique code for the neighborhood
    const code = `${name.replace(/[^a-zA-Z0-9]/g, '')}-${city}`.toUpperCase();
    
    // Create the neighborhood object
    neighborhoodData.push({
      name,
      code,
      city,
      county,
      state,
      description: `${name} neighborhood in ${city}, ${state}`,
      characteristics: { propertyCount: properties.length },
      medianHomeValue,
      avgHomeValue,
      avgYearBuilt,
      totalProperties: properties.length,
      totalSales: salesPrices.length,
      avgSalePrice,
      medianSalePrice
    });
  }
  
  // Save neighborhoods to database
  if (neighborhoodData.length > 0) {
    log(`Saving ${neighborhoodData.length} neighborhoods to database`);
    
    try {
      // Insert each neighborhood, one at a time
      let savedCount = 0;
      for (const neighborhood of neighborhoodData) {
        try {
          // Check if neighborhood already exists
          const existingNeighborhood = await db
            .select({ id: neighborhoods.id })
            .from(neighborhoods)
            .where(sql`code = ${neighborhood.code}`)
            .limit(1);
            
          if (existingNeighborhood && existingNeighborhood.length > 0) {
            // Update existing neighborhood
            await db
              .update(neighborhoods)
              .set({
                name: neighborhood.name,
                city: neighborhood.city,
                county: neighborhood.county,
                state: neighborhood.state,
                description: neighborhood.description,
                characteristics: neighborhood.characteristics,
                medianHomeValue: neighborhood.medianHomeValue || 0,
                avgHomeValue: neighborhood.avgHomeValue || 0,
                avgYearBuilt: neighborhood.avgYearBuilt || null,
                totalProperties: neighborhood.totalProperties || 0,
                totalSales: neighborhood.totalSales || 0,
                avgSalePrice: neighborhood.avgSalePrice || null,
                medianSalePrice: neighborhood.medianSalePrice || null,
                updatedAt: new Date()
              })
              .where(sql`id = ${existingNeighborhood[0].id}`);
              
            savedCount++;
          } else {
            // Insert new neighborhood
            await db
              .insert(neighborhoods)
              .values({
                name: neighborhood.name,
                code: neighborhood.code,
                city: neighborhood.city,
                county: neighborhood.county,
                state: neighborhood.state,
                description: neighborhood.description,
                characteristics: neighborhood.characteristics,
                medianHomeValue: neighborhood.medianHomeValue || 0,
                avgHomeValue: neighborhood.avgHomeValue || 0,
                avgYearBuilt: neighborhood.avgYearBuilt || null,
                totalProperties: neighborhood.totalProperties || 0,
                totalSales: neighborhood.totalSales || 0,
                avgSalePrice: neighborhood.avgSalePrice || null,
                medianSalePrice: neighborhood.medianSalePrice || null
              });
              
            savedCount++;
          }
        } catch (error) {
          log(`Error saving neighborhood ${neighborhood.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
      }
      
      log(`Successfully saved ${savedCount} neighborhoods`);
    } catch (error) {
      log(`Error saving neighborhoods: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
  } else {
    log('No valid neighborhoods found in the data');
  }
}

// Main import function
async function importCSVData(filePath: string): Promise<void> {
  try {
    // Test database connection first
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      log('Database connection failed, aborting import', true);
      return;
    }
    
    // Parse the CSV file
    const records = await parseCSVFile(filePath);
    if (!records || records.length === 0) {
      log('No records found in CSV file, aborting import', true);
      return;
    }
    
    log(`Starting import of ${records.length} records from ${path.basename(filePath)}`);
    
    // Track results
    const results = {
      propertiesAdded: 0,
      propertiesSkipped: 0,
      salesAdded: 0,
      salesSkipped: 0,
      errors: 0
    };
    
    // Process each record
    for (const record of records) {
      try {
        // Skip if missing critical data
        const address = getField(['Address'], record);
        if (!address) {
          results.propertiesSkipped++;
          continue;
        }
        
        // Map record to property and property sale objects
        const propertyData = mapRecordToProperty(record);
        
        // Check if property already exists using a simpler approach
        const existingProperty = await db
          .select({ id: properties.id })
          .from(properties)
          .where(sql`parcel_id = ${propertyData.parcelId}`)
          .limit(1);
        
        let propertyId: number;
        
        if (existingProperty && existingProperty.length > 0) {
          // Property exists, update it
          propertyId = existingProperty[0].id;
          await db
            .update(properties)
            .set({
              ...propertyData,
              updatedAt: new Date()
            })
            .where(sql`id = ${propertyId}`);
            
          log(`Updated existing property: ${propertyData.address}`);
        } else {
          // Try to find by address if parcel ID match failed
          const existingByAddress = await db
            .select({ id: properties.id })
            .from(properties)
            .where(sql`address = ${propertyData.address}`)
            .limit(1);
            
          if (existingByAddress && existingByAddress.length > 0) {
            // Property exists by address, update it
            propertyId = existingByAddress[0].id;
            await db
              .update(properties)
              .set({
                ...propertyData,
                updatedAt: new Date()
              })
              .where(sql`id = ${propertyId}`);
              
            log(`Updated existing property by address: ${propertyData.address}`);
          } else {
            // Property doesn't exist, insert it
            const newProperty = await db
              .insert(properties)
              .values(propertyData)
              .returning({ id: properties.id });
              
            propertyId = newProperty[0].id;
            results.propertiesAdded++;
            log(`Added new property: ${propertyData.address}`);
          }
        }
        
        // Only process sales if property has sale data
        const saleData = mapRecordToPropertySale(record, propertyId);
        if (saleData) {
          // Check if this sale already exists using SQL expressions
          const existingSale = await db
            .select({ id: propertySales.id })
            .from(propertySales)
            .where(sql`property_id = ${propertyId} AND sale_date = ${saleData.saleDate}`)
            .limit(1);
            
          if (existingSale && existingSale.length > 0) {
            // Sale exists, skip it
            results.salesSkipped++;
          } else {
            // Sale doesn't exist, insert it
            await db
              .insert(propertySales)
              .values(saleData);
              
            results.salesAdded++;
            log(`Added new sale for property ${propertyId}: $${saleData.salePrice}`);
          }
        }
      } catch (error) {
        log(`Error processing record: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        results.errors++;
      }
    }
    
    // Generate neighborhoods from property data
    const allProperties = await db.select().from(properties);
    await extractAndSaveNeighborhoods(allProperties);
    
    // Log final results
    log('Import completed with the following results:');
    log(`Properties added: ${results.propertiesAdded}`);
    log(`Properties skipped: ${results.propertiesSkipped}`);
    log(`Sales added: ${results.salesAdded}`);
    log(`Sales skipped: ${results.salesSkipped}`);
    log(`Errors: ${results.errors}`);
    
  } catch (error) {
    log(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  log('Usage: npm run import-csv <csv_file_path>', true);
  log('Example: npm run import-csv ./attached_assets/CMA_Spreadsheet.csv', true);
  process.exit(1);
}

const filePath = args[0];
const resolvedPath = path.resolve(filePath);

// Check if file exists
if (!fs.existsSync(resolvedPath)) {
  log(`File not found: ${resolvedPath}`, true);
  process.exit(1);
}

// Run the import
importCSVData(resolvedPath)
  .then(() => {
    log('Import script completed');
    process.exit(0);
  })
  .catch((error) => {
    log(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    process.exit(1);
  });