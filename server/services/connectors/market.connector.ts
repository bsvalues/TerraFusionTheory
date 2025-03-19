import { BaseDataConnector, ConnectorConfig } from './baseConnector';
import { AppError } from '../../errors';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Specific configuration for Market Data connectors
 */
export interface MarketDataConnectorConfig extends ConnectorConfig {
  dataDirectory?: string;
  defaultFormat?: 'csv' | 'json' | 'xml';
  fileEncoding?: string;
  dateFormat?: string;
}

/**
 * Property Listing Data structure
 */
export interface PropertyListing {
  mlsNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  originalPrice?: number;
  status: string;
  propertyType: string;
  beds: number;
  baths: number;
  squareFeet: number;
  lotSize?: number | string;
  yearBuilt?: number;
  daysOnMarket?: number;
  closingDate?: string;
  description?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  garage?: string;
  photos?: number;
  [key: string]: any;
}

/**
 * Market Data Query parameters
 */
export interface MarketDataQueryParams {
  mlsNumber?: string;
  address?: string;
  city?: string;
  zip?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  propertyType?: string | string[];
  status?: string | string[];
  yearBuilt?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  neighborhood?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

/**
 * Implementation of connector for Real Estate Market Data
 */
export class MarketDataConnector extends BaseDataConnector {
  private dataDirectory: string;
  private fileEncoding: string;

  constructor(name: string, config: MarketDataConnectorConfig) {
    super(name, 'market', config);
    this.dataDirectory = config.dataDirectory || path.join(process.cwd(), 'attached_assets');
    this.fileEncoding = config.fileEncoding || 'utf8';
  }

  /**
   * Test connection to the data source
   */
  async testConnection(): Promise<boolean> {
    try {
      // Check if data directory exists
      const dirExists = fs.existsSync(this.dataDirectory);
      if (!dirExists) {
        throw new Error(`Data directory does not exist: ${this.dataDirectory}`);
      }
      
      // Try to list files in the directory
      const files = await this.getAvailableFiles();
      return files.length > 0;
    } catch (error) {
      const errorMessage = `Failed to connect to market data source: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await this.logError('testConnection', 'market-data', {}, errorMessage);
      throw new AppError(errorMessage, 500, 'CONNECTOR_ERROR', true);
    }
  }

  /**
   * Fetch market data based on query parameters
   */
  async fetchData(query: MarketDataQueryParams): Promise<{
    data: PropertyListing[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const startTime = Date.now();
    
    try {
      await this.logRequest('fetchData', 'market-data', query);
      
      // Get list of CSV files
      const files = await this.getAvailableFiles('csv');
      
      if (files.length === 0) {
        throw new Error('No market data files found');
      }
      
      // Process all CSV files and combine the results
      let allListings: PropertyListing[] = [];
      
      for (const file of files) {
        const filepath = path.join(this.dataDirectory, file);
        const listings = await this.parseCSVFile(filepath);
        allListings = [...allListings, ...listings];
      }
      
      // Apply filters based on query parameters
      let filteredListings = this.filterListings(allListings, query);
      
      // Apply sorting
      if (query.sortBy) {
        filteredListings = this.sortListings(filteredListings, query.sortBy, query.sortOrder);
      }
      
      // Apply pagination
      const limit = query.limit ?? 100;
      const offset = query.offset ?? 0;
      const paginatedListings = filteredListings.slice(offset, offset + limit);
      
      const result = {
        data: paginatedListings,
        total: filteredListings.length,
        limit,
        offset
      };
      
      const duration = Date.now() - startTime;
      await this.logResponse('fetchData', 'market-data', query, {
        count: result.data.length,
        total: result.total
      }, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logError('fetchData', 'market-data', query, error);
      throw new AppError(
        `Failed to fetch market data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500, 
        'CONNECTOR_ERROR', 
        true,
        { duration }
      );
    }
  }

  /**
   * Get listing by MLS number
   */
  async getListingByMLS(mlsNumber: string): Promise<PropertyListing | null> {
    try {
      const result = await this.fetchData({ mlsNumber });
      return result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      await this.logError('getListingByMLS', 'market-data', { mlsNumber }, error);
      throw new AppError(
        `Failed to get listing by MLS number: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'CONNECTOR_ERROR',
        true
      );
    }
  }

  /**
   * Get available data models/tables in the data source
   */
  async getAvailableModels(): Promise<string[]> {
    return ['listings', 'sales', 'market_trends'];
  }

  /**
   * Get schema for a specific model/table in the data source
   */
  async getModelSchema(modelName: string): Promise<any> {
    switch (modelName) {
      case 'listings':
        return {
          mlsNumber: 'string',
          address: 'string',
          city: 'string',
          state: 'string',
          zip: 'string',
          price: 'number',
          originalPrice: 'number',
          status: 'string',
          propertyType: 'string',
          beds: 'number',
          baths: 'number',
          squareFeet: 'number',
          lotSize: 'string',
          yearBuilt: 'number',
          daysOnMarket: 'number',
          closingDate: 'string',
          description: 'string',
          neighborhood: 'string'
        };
      case 'sales':
        return {
          mlsNumber: 'string',
          address: 'string',
          city: 'string',
          state: 'string',
          zip: 'string',
          soldPrice: 'number',
          listPrice: 'number',
          closingDate: 'string',
          daysOnMarket: 'number',
          propertyType: 'string',
          beds: 'number',
          baths: 'number',
          squareFeet: 'number',
          pricePerSqFt: 'number',
          yearBuilt: 'number'
        };
      case 'market_trends':
        return {
          period: 'string',
          medianPrice: 'number',
          averagePrice: 'number',
          averagePricePerSqFt: 'number',
          totalListings: 'number',
          totalSales: 'number',
          averageDaysOnMarket: 'number',
          listToSaleRatio: 'number'
        };
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }
  }

  /**
   * Get available data files
   */
  private async getAvailableFiles(extension?: string): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.dataDirectory);
      if (extension) {
        return files.filter(file => file.toLowerCase().endsWith(`.${extension.toLowerCase()}`));
      }
      return files;
    } catch (error) {
      throw new Error(`Failed to read data directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse CSV file into PropertyListing objects
   */
  private async parseCSVFile(filepath: string): Promise<PropertyListing[]> {
    try {
      // Use utf8 explicitly instead of this.fileEncoding
      const content = fs.readFileSync(filepath, 'utf8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true, // Allow varying column counts in the CSV file
        relax_quotes: true, // Be more flexible with quotes
        skip_records_with_error: true // Skip rows that can't be properly parsed
      });

      return records.map((record: any) => this.mapCSVRecordToPropertyListing(record));
    } catch (error) {
      throw new Error(`Failed to parse CSV file ${filepath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map CSV record to PropertyListing interface
   */
  private mapCSVRecordToPropertyListing(record: any): PropertyListing {
    // Clean up price values
    const cleanPrice = (price: string | number | undefined): number => {
      if (price === undefined || price === '') return 0;
      if (typeof price === 'number') return price;
      return parseFloat(price.replace(/[^0-9.-]+/g, '')) || 0;
    };

    // Handle various field names for the same data
    const getField = (possibleFields: string[], record: any): any => {
      for (const field of possibleFields) {
        if (record[field] !== undefined && record[field] !== '') {
          return record[field];
        }
      }
      return undefined;
    };

    // Calculate total baths based on available bath fields
    const calculateTotalBaths = (): number => {
      let total = 0;
      
      const fullBaths = getField(['# of Full Baths', 'Full Baths'], record);
      if (fullBaths) total += parseFloat(fullBaths) || 0;
      
      const threeFourthBaths = getField(['# of 3/4 Baths', '3/4 Baths'], record);
      if (threeFourthBaths) total += parseFloat(threeFourthBaths) * 0.75 || 0;
      
      const halfBaths = getField(['# of 1/2 Baths', 'Half Baths'], record);
      if (halfBaths) total += parseFloat(halfBaths) * 0.5 || 0;
      
      const totalBaths = getField(['Total Baths'], record);
      if (totalBaths && total === 0) return parseFloat(totalBaths) || 0;
      
      return Math.round(total * 100) / 100; // Round to 2 decimal places
    };

    // Parse square footage from various formats
    const parseSquareFeet = (): number => {
      const sqFtField = getField(['Total SQFT', 'Finished SQFT', 'Living Area (sq ft)'], record);
      if (!sqFtField) return 0;
      
      if (typeof sqFtField === 'number') return sqFtField;
      
      // Handle formats like "1,200" or "1,200 sq ft"
      const sqFtStr = sqFtField.toString().replace(/[^0-9.-]+/g, '');
      return parseInt(sqFtStr) || 0;
    };

    return {
      mlsNumber: getField(['MLS #'], record) || '',
      address: getField(['Address'], record) || '',
      city: getField(['City'], record) || '',
      state: getField(['State'], record) || '',
      zip: getField(['Zip'], record) || '',
      price: cleanPrice(getField(['Price', 'Asking Price', 'Sold Price'], record)),
      originalPrice: cleanPrice(getField(['Original Price'], record)),
      status: getField(['Status'], record) || '',
      propertyType: getField(['Property Type', 'PropType'], record) || '',
      beds: parseInt(getField(['Bedrooms', 'Beds'], record)) || 0,
      baths: calculateTotalBaths(),
      squareFeet: parseSquareFeet(),
      lotSize: getField(['Lot Sq Ft', 'Lot Size', 'Number of Acres'], record),
      yearBuilt: parseInt(getField(['Year Built'], record)) || 0,
      daysOnMarket: parseInt(getField(['Days On Market'], record)) || 0,
      closingDate: getField(['Closing Date'], record) || '',
      description: getField(['Public Remarks'], record) || '',
      neighborhood: getField(['Neighborhood', 'Subdivision'], record) || '',
      latitude: parseFloat(getField(['Latitude'], record)) || undefined,
      longitude: parseFloat(getField(['Longitude'], record)) || undefined,
      garage: getField(['Garage Capacity'], record) || '',
      photos: parseInt(getField(['Picture Count'], record)) || 0,
      
      // Store the original record for access to all fields
      originalRecord: { ...record }
    };
  }

  /**
   * Filter listings based on query parameters
   */
  private filterListings(listings: PropertyListing[], query: MarketDataQueryParams): PropertyListing[] {
    return listings.filter(listing => {
      // MLS Number exact match
      if (query.mlsNumber && listing.mlsNumber !== query.mlsNumber) {
        return false;
      }
      
      // Address contains search
      if (query.address && !listing.address.toLowerCase().includes(query.address.toLowerCase())) {
        return false;
      }
      
      // City exact match
      if (query.city && listing.city.toLowerCase() !== query.city.toLowerCase()) {
        return false;
      }
      
      // Zip code exact match
      if (query.zip && listing.zip !== query.zip) {
        return false;
      }
      
      // Price range
      if (query.minPrice && listing.price < query.minPrice) {
        return false;
      }
      if (query.maxPrice && listing.price > query.maxPrice) {
        return false;
      }
      
      // Beds range
      if (query.minBeds && listing.beds < query.minBeds) {
        return false;
      }
      if (query.maxBeds && listing.beds > query.maxBeds) {
        return false;
      }
      
      // Baths range
      if (query.minBaths && listing.baths < query.minBaths) {
        return false;
      }
      if (query.maxBaths && listing.baths > query.maxBaths) {
        return false;
      }
      
      // Square feet range
      if (query.minSquareFeet && listing.squareFeet < query.minSquareFeet) {
        return false;
      }
      if (query.maxSquareFeet && listing.squareFeet > query.maxSquareFeet) {
        return false;
      }
      
      // Property type exact match or in array
      if (query.propertyType) {
        if (Array.isArray(query.propertyType)) {
          if (!query.propertyType.some(type => 
            listing.propertyType.toLowerCase() === type.toLowerCase()
          )) {
            return false;
          }
        } else if (listing.propertyType.toLowerCase() !== query.propertyType.toLowerCase()) {
          return false;
        }
      }
      
      // Status exact match or in array
      if (query.status) {
        if (Array.isArray(query.status)) {
          if (!query.status.some(status => 
            listing.status.toLowerCase() === status.toLowerCase()
          )) {
            return false;
          }
        } else if (listing.status.toLowerCase() !== query.status.toLowerCase()) {
          return false;
        }
      }
      
      // Year built exact match
      if (query.yearBuilt && listing.yearBuilt !== query.yearBuilt) {
        return false;
      }
      
      // Year built range
      if (query.minYearBuilt && listing.yearBuilt && listing.yearBuilt < query.minYearBuilt) {
        return false;
      }
      if (query.maxYearBuilt && listing.yearBuilt && listing.yearBuilt > query.maxYearBuilt) {
        return false;
      }
      
      // Neighborhood contains search
      if (query.neighborhood && !listing.neighborhood?.toLowerCase().includes(query.neighborhood.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Sort listings based on sort parameters
   */
  private sortListings(
    listings: PropertyListing[], 
    sortBy: string = 'price',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): PropertyListing[] {
    const sortedListings = [...listings];
    
    sortedListings.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      // Handle string comparisons case-insensitive
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }
      
      // Handle undefined values
      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (valueB === undefined) return sortOrder === 'asc' ? 1 : -1;
      
      // Compare values
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortedListings;
  }
}