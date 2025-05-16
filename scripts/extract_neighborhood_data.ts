/**
 * Neighborhood Data Extraction and Enhancement
 * 
 * This script extracts enriched neighborhood data from property records
 * and updates the neighborhoods table with more detailed information.
 */

import { db } from '../server/db';
import { properties, propertySales, neighborhoods } from '../shared/schema';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Output directory for saved data
const OUTPUT_DIR = './output';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Logging utility
function log(message: string, isError = false): void {
  const timestamp = new Date().toISOString();
  const prefix = isError ? '[ERROR]' : '[INFO]';
  const formattedMessage = `${prefix} ${timestamp} - ${message}`;
  
  console[isError ? 'error' : 'log'](formattedMessage);
  
  // Also write to log file
  const logFile = path.join(OUTPUT_DIR, 'neighborhood_extraction.log');
  fs.appendFileSync(logFile, formattedMessage + '\n');
}

// Standardize neighborhood names
function standardizeNeighborhoodName(name: string): string {
  if (!name) return 'Unknown';
  
  // Convert to title case and trim
  const standardized = name.trim()
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
  
  // Handle special cases
  if (standardized === 'None/Na' || standardized === 'None' || standardized === 'N/A') {
    return 'Unassigned';
  }
  
  if (standardized === 'Other') {
    return 'Miscellaneous';
  }
  
  return standardized;
}

// Generate a neighborhood code
function generateNeighborhoodCode(name: string): string {
  // Create a code from the first 2-3 letters of each word
  return name
    .split(/\s+/)
    .map(word => word.substring(0, 2).toUpperCase())
    .join('')
    .padEnd(2, 'X') + Math.floor(Math.random() * 900 + 100).toString();
}

// Calculate property metrics by neighborhood
async function calculateNeighborhoodMetrics() {
  log('Starting neighborhood metrics calculation...');
  
  try {
    // Get distinct neighborhoods from properties
    const neighborhoodRecords = await db.execute(sql`
      SELECT DISTINCT
        CASE 
          WHEN neighborhood IS NULL THEN 'Unassigned'
          WHEN TRIM(neighborhood) = '' THEN 'Unassigned'
          WHEN LOWER(neighborhood) IN ('none', 'n/a', 'none/na') THEN 'Unassigned'
          WHEN LOWER(neighborhood) IN ('other') THEN 'Miscellaneous'
          ELSE TRIM(neighborhood)
        END AS name,
        city,
        state,
        county
      FROM properties
      WHERE city IS NOT NULL
      ORDER BY name
    `);
    
    const neighborhoods = neighborhoodRecords.rows as any[];
    log(`Found ${neighborhoods.length} distinct neighborhoods`);
    
    // Process each neighborhood
    for (const nhd of neighborhoods) {
      const neighborhoodName = nhd.name;
      const city = nhd.city;
      const state = nhd.state;
      const county = nhd.county || 'Yakima'; // Default to Yakima if missing
      
      log(`Processing neighborhood: ${neighborhoodName}`);
      
      // Generate neighborhood code if needed
      const neighborhoodCode = generateNeighborhoodCode(neighborhoodName);
      
      // Calculate metrics for this neighborhood
      log(`Processing neighborhood: ${neighborhoodName}, city: ${city}, code: ${neighborhoodCode}`);
      
      const metrics = await db.execute(sql`
        WITH neighborhood_properties AS (
          SELECT 
            p.id,
            p.address,
            p.year_built,
            p.building_area,
            p.lot_size,
            p.bedrooms,
            p.bathrooms,
            p.assessed_value,
            p.market_value
          FROM properties p
          WHERE 
            CASE 
              WHEN p.neighborhood IS NULL THEN 'Unassigned'
              WHEN TRIM(p.neighborhood) = '' THEN 'Unassigned'
              WHEN LOWER(p.neighborhood) IN ('none', 'n/a', 'none/na') THEN 'Unassigned'
              WHEN LOWER(p.neighborhood) IN ('other') THEN 'Miscellaneous'
              ELSE TRIM(p.neighborhood)
            END = ${neighborhoodName}
        ),
        neighborhood_sales AS (
          SELECT 
            ps.property_id,
            ps.sale_price,
            ps.sale_date,
            ps.transaction_type
          FROM property_sales ps
          JOIN neighborhood_properties np ON ps.property_id = np.id
        )
        SELECT
          COUNT(DISTINCT np.id) AS total_properties,
          COUNT(DISTINCT ns.property_id) AS properties_with_sales,
          COUNT(ns.property_id) AS total_sales,
          AVG(np.year_built) AS avg_year_built,
          AVG(np.building_area) AS avg_building_area,
          AVG(np.lot_size) AS avg_lot_size,
          AVG(np.bedrooms) AS avg_bedrooms,
          AVG(np.bathrooms) AS avg_bathrooms,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY np.market_value) AS median_home_value,
          AVG(np.market_value) AS avg_home_value,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ns.sale_price) AS median_sale_price,
          AVG(ns.sale_price) AS avg_sale_price,
          MIN(ns.sale_price) AS min_sale_price,
          MAX(ns.sale_price) AS max_sale_price,
          MAX(ns.sale_date) - MIN(ns.sale_date) AS sales_date_range_days
        FROM neighborhood_properties np
        LEFT JOIN neighborhood_sales ns ON np.id = ns.property_id
      `);
      
      const nhMetrics = metrics?.rows && metrics.rows.length > 0 ? metrics.rows[0] as any : {
        total_properties: 0,
        total_sales: 0,
        avg_building_area: null,
        avg_lot_size: null,
        avg_bedrooms: null,
        avg_bathrooms: null,
        avg_year_built: null,
        median_home_value: null,
        avg_home_value: null,
        median_sale_price: null,
        avg_sale_price: null,
        min_sale_price: null,
        max_sale_price: null,
        sales_date_range_days: null
      };
      
      // Get property samples for this neighborhood
      const propertySamples = await db.execute(sql`
        SELECT 
          p.id, 
          p.address, 
          p.property_type,
          p.year_built, 
          p.building_area, 
          p.lot_size,
          p.bedrooms, 
          p.bathrooms, 
          p.market_value
        FROM properties p
        WHERE 
          CASE 
            WHEN p.neighborhood IS NULL THEN 'Unassigned'
            WHEN TRIM(p.neighborhood) = '' THEN 'Unassigned'
            WHEN LOWER(p.neighborhood) IN ('none', 'n/a', 'none/na') THEN 'Unassigned'
            WHEN LOWER(p.neighborhood) IN ('other') THEN 'Miscellaneous'
            ELSE TRIM(p.neighborhood)
          END = ${neighborhoodName}
        LIMIT 5
      `);
      
      const samples = propertySamples?.rows && propertySamples.rows.length > 0 ? propertySamples.rows as any[] : [];
      
      // Get recent sales for this neighborhood
      const recentSales = await db.execute(sql`
        SELECT 
          ps.property_id,
          p.address,
          ps.sale_price,
          ps.sale_date,
          ps.transaction_type
        FROM property_sales ps
        JOIN properties p ON ps.property_id = p.id
        WHERE 
          CASE 
            WHEN p.neighborhood IS NULL THEN 'Unassigned'
            WHEN TRIM(p.neighborhood) = '' THEN 'Unassigned'
            WHEN LOWER(p.neighborhood) IN ('none', 'n/a', 'none/na') THEN 'Unassigned'
            WHEN LOWER(p.neighborhood) IN ('other') THEN 'Miscellaneous'
            ELSE TRIM(p.neighborhood)
          END = ${neighborhoodName}
        ORDER BY ps.sale_date DESC
        LIMIT 5
      `);
      
      const sales = recentSales?.rows && recentSales.rows.length > 0 ? recentSales.rows as any[] : [];
      
      // Build a description based on metrics
      let description = `${neighborhoodName} is a residential area in ${city || 'Unknown City'}, ${state || 'Unknown State'}`;
      if (nhMetrics?.avg_year_built) {
        description += ` with homes built around ${Math.round(Number(nhMetrics.avg_year_built))}`;
      }
      if (nhMetrics?.avg_building_area) {
        description += `. Typical homes are approximately ${Math.round(Number(nhMetrics.avg_building_area))} sq ft`;
      }
      if (nhMetrics?.avg_bedrooms && nhMetrics?.avg_bathrooms) {
        try {
          const avgBeds = typeof nhMetrics.avg_bedrooms === 'number' ? nhMetrics.avg_bedrooms.toFixed(1) : Number(nhMetrics.avg_bedrooms).toFixed(1);
          const avgBaths = typeof nhMetrics.avg_bathrooms === 'number' ? nhMetrics.avg_bathrooms.toFixed(1) : Number(nhMetrics.avg_bathrooms).toFixed(1);
          description += ` with ${avgBeds} bedrooms and ${avgBaths} bathrooms`;
        } catch (error) {
          log(`Error formatting bedroom/bathroom data: ${error}`);
        }
      }
      description += '.';
      
      // Prepare characteristics JSON object
      const characteristics = {
        propertyCount: nhMetrics?.total_properties || 0,
        salesCount: nhMetrics?.total_sales || 0,
        averageSqFt: nhMetrics?.avg_building_area ? Math.round(Number(nhMetrics.avg_building_area)) : null,
        averageLotSize: nhMetrics?.avg_lot_size ? Math.round(Number(nhMetrics.avg_lot_size)) : null,
        averageBedrooms: nhMetrics?.avg_bedrooms ? Number(Number(nhMetrics.avg_bedrooms).toFixed(1)) : null,
        averageBathrooms: nhMetrics?.avg_bathrooms ? Number(Number(nhMetrics.avg_bathrooms).toFixed(1)) : null,
        propertySamples: samples && samples.length ? samples.map(s => ({
          address: s.address || 'Unknown',
          size: s.building_area || 0,
          bedBath: `${s.bedrooms || 0}/${s.bathrooms || 0}`,
          value: s.market_value || 0
        })) : [],
        recentSales: sales && sales.length ? sales.map(s => ({
          address: s.address || 'Unknown',
          price: s.sale_price || 0,
          date: s.sale_date || new Date()
        })) : []
      };
      
      // Check if neighborhood already exists
      const existingNeighborhood = await db
        .select({ id: neighborhoods.id })
        .from(neighborhoods)
        .where(sql`code = ${neighborhoodCode}`)
        .limit(1);
      
      if (existingNeighborhood && existingNeighborhood.length > 0) {
        // Update existing neighborhood
        await db
          .update(neighborhoods)
          .set({
            name: neighborhoodName,
            city: city,
            county: county,
            state: state,
            description: description,
            characteristics: characteristics,
            median_home_value: nhMetrics.median_home_value || null,
            avg_home_value: nhMetrics.avg_home_value || null,
            avg_year_built: nhMetrics.avg_year_built || null,
            total_properties: nhMetrics.total_properties || 0,
            total_sales: nhMetrics.total_sales || 0,
            avg_sale_price: nhMetrics.avg_sale_price || null,
            median_sale_price: nhMetrics.median_sale_price || null,
            updatedAt: new Date()
          })
          .where(sql`id = ${existingNeighborhood[0].id}`);
          
        log(`Updated existing neighborhood: ${neighborhoodName}`);
        
      } else {
        // Check if the neighborhood exists with a different code
        const existingByName = await db
          .select({ id: neighborhoods.id, code: neighborhoods.code })
          .from(neighborhoods)
          .where(sql`name = ${neighborhoodName}`)
          .limit(1);
          
        if (existingByName && existingByName.length > 0) {
          // Update the existing record using the existing code
          await db
            .update(neighborhoods)
            .set({
              city: city,
              county: county,
              state: state,
              description: description,
              characteristics: characteristics,
              median_home_value: nhMetrics.median_home_value || null,
              avg_home_value: nhMetrics.avg_home_value || null,
              avg_year_built: nhMetrics.avg_year_built || null,
              total_properties: nhMetrics.total_properties || 0,
              total_sales: nhMetrics.total_sales || 0,
              avg_sale_price: nhMetrics.avg_sale_price || null,
              median_sale_price: nhMetrics.median_sale_price || null,
              updatedAt: new Date()
            })
            .where(sql`id = ${existingByName[0].id}`);
            
          log(`Updated existing neighborhood by name: ${neighborhoodName} with code ${existingByName[0].code}`);
          
        } else {
          // Insert new neighborhood
          await db
            .insert(neighborhoods)
            .values({
              name: neighborhoodName,
              code: neighborhoodCode,
              city: city,
              county: county,
              state: state,
              description: description,
              characteristics: characteristics,
              median_home_value: nhMetrics.median_home_value || null,
              avg_home_value: nhMetrics.avg_home_value || null,
              avg_year_built: nhMetrics.avg_year_built || null,
              total_properties: nhMetrics.total_properties || 0,
              total_sales: nhMetrics.total_sales || 0,
              avg_sale_price: nhMetrics.avg_sale_price || null,
              median_sale_price: nhMetrics.median_sale_price || null,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          
          log(`Added new neighborhood: ${neighborhoodName}`);
        }
      }
    }
    
    log('Neighborhood metrics calculation complete');
    
    // Update property records with standardized neighborhood assignments
    await updatePropertyNeighborhoodAssignments();
    
    return true;
  } catch (error) {
    log(`Error calculating neighborhood metrics: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    return false;
  }
}

// Update property records with standardized neighborhood names and codes
async function updatePropertyNeighborhoodAssignments() {
  log('Updating property neighborhood assignments...');
  
  try {
    // Get all neighborhoods with codes
    const allNeighborhoods = await db
      .select({ id: neighborhoods.id, name: neighborhoods.name, code: neighborhoods.code })
      .from(neighborhoods);
      
    log(`Found ${allNeighborhoods.length} neighborhoods for mapping`);
    
    // Create mapping of standardized names to codes
    const neighborhoodMap = new Map();
    for (const n of allNeighborhoods) {
      neighborhoodMap.set(n.name.toLowerCase(), { name: n.name, code: n.code });
    }
    
    // Get properties that need neighborhood code updates
    const propertiesToUpdate = await db
      .select({ 
        id: properties.id, 
        neighborhood: properties.neighborhood,
        neighborhood_code: properties.neighborhood_code 
      })
      .from(properties)
      .where(
        sql`neighborhood_code IS NULL OR neighborhood_code = ''`
      );
      
    log(`Found ${propertiesToUpdate.length} properties needing neighborhood code updates`);
    
    // Update properties with standardized neighborhoods and codes
    let updatedCount = 0;
    for (const property of propertiesToUpdate) {
      let standardizedName = 'Unassigned';
      let code = 'UNA001';
      
      if (property.neighborhood) {
        // Standardize the name
        standardizedName = standardizeNeighborhoodName(property.neighborhood);
        
        // Look up the code
        const lookup = neighborhoodMap.get(standardizedName.toLowerCase());
        if (lookup) {
          standardizedName = lookup.name; // Use the exact case from the neighborhoods table
          code = lookup.code;
        } else {
          // If no match, generate a new code
          code = generateNeighborhoodCode(standardizedName);
        }
      }
      
      // Update the property
      await db
        .update(properties)
        .set({
          neighborhood: standardizedName,
          neighborhood_code: code,
          updatedAt: new Date()
        })
        .where(sql`id = ${property.id}`);
        
      updatedCount++;
      
      // Log progress periodically
      if (updatedCount % 10 === 0) {
        log(`Updated ${updatedCount} of ${propertiesToUpdate.length} properties`);
      }
    }
    
    log(`Completed updating ${updatedCount} property neighborhood assignments`);
    return true;
  } catch (error) {
    log(`Error updating property neighborhood assignments: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    return false;
  }
}

// Analyze market trends by neighborhood
async function analyzeNeighborhoodMarketTrends() {
  log('Analyzing neighborhood market trends...');
  
  try {
    // Get all neighborhoods
    const allNeighborhoods = await db
      .select({ id: neighborhoods.id, name: neighborhoods.name, code: neighborhoods.code })
      .from(neighborhoods);
      
    log(`Analyzing market trends for ${allNeighborhoods.length} neighborhoods`);
    
    const results = [];
    
    // Process each neighborhood
    for (const nhd of allNeighborhoods) {
      // Get sales data for the last 3 years by quarter
      const salesByQuarter = await db.execute(sql`
        WITH neighborhood_sales AS (
          SELECT 
            ps.sale_date,
            ps.sale_price
          FROM property_sales ps
          JOIN properties p ON ps.property_id = p.id
          WHERE p.neighborhood_code = ${nhd.code}
            AND ps.sale_date >= CURRENT_DATE - INTERVAL '3 years'
        ),
        quarters AS (
          SELECT 
            DATE_TRUNC('quarter', sale_date) AS quarter_date,
            CONCAT(
              EXTRACT(YEAR FROM sale_date), '-Q', 
              CEILING(EXTRACT(MONTH FROM sale_date) / 3)
            ) AS quarter,
            AVG(sale_price) AS avg_price,
            COUNT(*) AS sales_count
          FROM neighborhood_sales
          GROUP BY quarter_date, quarter
          ORDER BY quarter_date
        )
        SELECT 
          quarter,
          avg_price,
          sales_count
        FROM quarters
      `);
      
      const quarterlyData = salesByQuarter.rows as any[];
      
      if (quarterlyData.length > 0) {
        // Calculate price trends
        let priceChangeYoY = null;
        let salesVolumeChange = null;
        
        if (quarterlyData.length >= 4) {
          // Calculate year-over-year changes if we have at least 4 quarters of data
          const latestQuarters = quarterlyData.slice(-4);
          const previousQuarters = quarterlyData.slice(-8, -4);
          
          if (previousQuarters.length > 0) {
            const latestAvgPrice = latestQuarters.reduce((sum, q) => sum + parseFloat(q.avg_price || 0), 0) / latestQuarters.length;
            const previousAvgPrice = previousQuarters.reduce((sum, q) => sum + parseFloat(q.avg_price || 0), 0) / previousQuarters.length;
            
            if (previousAvgPrice > 0) {
              priceChangeYoY = ((latestAvgPrice - previousAvgPrice) / previousAvgPrice) * 100;
            }
            
            const latestSalesVolume = latestQuarters.reduce((sum, q) => sum + parseInt(q.sales_count || 0), 0);
            const previousSalesVolume = previousQuarters.reduce((sum, q) => sum + parseInt(q.sales_count || 0), 0);
            
            if (previousSalesVolume > 0) {
              salesVolumeChange = ((latestSalesVolume - previousSalesVolume) / previousSalesVolume) * 100;
            }
          }
        }
        
        // Save trend data to the database
        await db
          .update(neighborhoods)
          .set({
            metadata: {
              marketTrends: {
                quarterlyData: quarterlyData,
                priceChangeYoY: priceChangeYoY,
                salesVolumeChange: salesVolumeChange,
                lastUpdated: new Date().toISOString()
              }
            },
            updatedAt: new Date()
          })
          .where(sql`id = ${nhd.id}`);
          
        results.push({
          neighborhood: nhd.name,
          quarters: quarterlyData.length,
          priceChangeYoY: priceChangeYoY,
          salesVolumeChange: salesVolumeChange
        });
        
        log(`Analyzed trends for ${nhd.name}: ${quarterlyData.length} quarters, price change: ${priceChangeYoY ? priceChangeYoY.toFixed(2) + '%' : 'N/A'}`);
      } else {
        log(`No recent sales data available for ${nhd.name}`);
        
        // Update with empty trend data
        await db
          .update(neighborhoods)
          .set({
            metadata: {
              marketTrends: {
                quarterlyData: [],
                lastUpdated: new Date().toISOString()
              }
            },
            updatedAt: new Date()
          })
          .where(sql`id = ${nhd.id}`);
          
        results.push({
          neighborhood: nhd.name,
          quarters: 0,
          priceChangeYoY: null,
          salesVolumeChange: null
        });
      }
    }
    
    // Save results to file
    const outputPath = path.join(OUTPUT_DIR, 'neighborhood_trends.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    log(`Saved neighborhood trends to ${outputPath}`);
    
    log('Neighborhood market trend analysis complete');
    return true;
  } catch (error) {
    log(`Error analyzing neighborhood market trends: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    return false;
  }
}

// Main function
export async function main() {
  try {
    log('Starting neighborhood data extraction and enhancement');
    
    // Calculate neighborhood metrics
    const metricsSuccess = await calculateNeighborhoodMetrics();
    if (!metricsSuccess) {
      throw new Error('Failed to calculate neighborhood metrics');
    }
    
    // Analyze market trends
    const trendsSuccess = await analyzeNeighborhoodMarketTrends();
    if (!trendsSuccess) {
      throw new Error('Failed to analyze neighborhood market trends');
    }
    
    // Get final neighborhood count
    const neighborhoodCount = await db
      .select({ count: sql`COUNT(*)` })
      .from(neighborhoods);
      
    log(`Completed processing with ${neighborhoodCount[0]?.count || 0} total neighborhoods`);
    
  } catch (error) {
    log(`Error in main execution: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    process.exit(1);
  }
}

// This function can be run directly or imported
// Direct execution is handled by the run_neighborhood_extraction.ts file