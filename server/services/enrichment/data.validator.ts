import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../../storage';
import { PropertyListing } from '../connectors/market.connector';
import { PropertyData } from '../connectors/cama.connector';
import { AppError } from '../../errors';

/**
 * Configuration for data validation rules
 */
export interface DataValidationConfig {
  // Range validation
  priceRangeMin?: number;
  priceRangeMax?: number;
  squareFeetRangeMin?: number;
  squareFeetRangeMax?: number;
  yearBuiltRangeMin?: number;
  yearBuiltRangeMax?: number;
  
  // Outlier detection thresholds (standard deviations)
  pricePerSqFtThreshold?: number;
  daysOnMarketThreshold?: number;
  
  // Required fields
  requiredFields?: string[];
  
  // Custom validation rules
  customRules?: Array<{
    name: string;
    description: string;
    validate: (data: any) => boolean;
  }>;
}

/**
 * Validation results for a property listing or data
 */
export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 confidence score
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  anomalies: Array<{
    field: string;
    value: any;
    expectedRange: [number, number] | string;
    confidence: number;
  }>;
  enrichmentSuggestions: Array<{
    field: string;
    currentValue: any;
    suggestedValue: any;
    confidence: number;
    source: string;
  }>;
}

/**
 * Service for validating and detecting anomalies in real estate data
 */
export class DataValidator {
  private config: DataValidationConfig;
  private marketStats: {
    priceStats?: { mean: number; stdDev: number };
    squareFeetStats?: { mean: number; stdDev: number };
    pricePerSqFtStats?: { mean: number; stdDev: number };
    daysOnMarketStats?: { mean: number; stdDev: number };
  } = {};

  constructor(config?: DataValidationConfig) {
    this.config = {
      priceRangeMin: 10000,
      priceRangeMax: 10000000,
      squareFeetRangeMin: 200,
      squareFeetRangeMax: 20000,
      yearBuiltRangeMin: 1800,
      yearBuiltRangeMax: new Date().getFullYear() + 1,
      pricePerSqFtThreshold: 2.5, // 2.5 standard deviations for outlier detection
      daysOnMarketThreshold: 3.0,
      requiredFields: ['address', 'price', 'squareFeet'],
      ...config
    };
  }

  /**
   * Calculate market statistics from a set of property listings
   * @param listings Array of property listings to analyze
   */
  async calculateMarketStats(listings: PropertyListing[]): Promise<void> {
    if (!listings || listings.length === 0) {
      return;
    }

    try {
      // Calculate price statistics
      const prices = listings.map(l => l.price).filter(p => p > 0);
      this.marketStats.priceStats = this.calculateStats(prices);

      // Calculate square feet statistics
      const squareFeet = listings.map(l => l.squareFeet).filter(s => s > 0);
      this.marketStats.squareFeetStats = this.calculateStats(squareFeet);

      // Calculate price per square foot statistics
      const pricePerSqFt = listings
        .filter(l => l.price > 0 && l.squareFeet > 0)
        .map(l => l.price / l.squareFeet);
      this.marketStats.pricePerSqFtStats = this.calculateStats(pricePerSqFt);

      // Calculate days on market statistics
      const daysOnMarket = listings.map(l => l.daysOnMarket || 0).filter(d => d > 0);
      this.marketStats.daysOnMarketStats = this.calculateStats(daysOnMarket);

      // Log the calculated stats
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Calculated market statistics from ${listings.length} listings`,
        details: JSON.stringify({
          priceStats: this.marketStats.priceStats,
          squareFeetStats: this.marketStats.squareFeetStats,
          pricePerSqFtStats: this.marketStats.pricePerSqFtStats,
          daysOnMarketStats: this.marketStats.daysOnMarketStats,
        }),
        source: 'data-validator',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-stats', 'data-validation']
      });
    } catch (error) {
      console.error('Error calculating market stats:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to calculate market statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
        }),
        source: 'data-validator',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-stats', 'data-validation', 'error']
      });
    }
  }

  /**
   * Validate a property listing and check for anomalies
   * @param listing The property listing to validate
   * @returns Validation result with errors, anomalies, and suggestions
   */
  validateListing(listing: PropertyListing): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      score: 100,
      errors: [],
      anomalies: [],
      enrichmentSuggestions: []
    };

    // Check required fields
    this.validateRequiredFields(listing, result);

    // Validate price range
    this.validatePrice(listing, result);

    // Validate square footage
    this.validateSquareFeet(listing, result);

    // Validate year built
    this.validateYearBuilt(listing, result);

    // Check for outliers in price per square foot
    this.detectPricePerSqFtOutlier(listing, result);

    // Check for outliers in days on market
    this.detectDaysOnMarketOutlier(listing, result);

    // Calculate final validation score based on errors and anomalies
    this.calculateValidationScore(result);

    return result;
  }

  /**
   * Validate a property data record from CAMA
   * @param property The property data to validate
   * @returns Validation result with errors, anomalies, and suggestions
   */
  validatePropertyData(property: PropertyData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      score: 100,
      errors: [],
      anomalies: [],
      enrichmentSuggestions: []
    };

    // Check required fields
    if (!property.address) {
      result.errors.push({
        field: 'address',
        message: 'Address is required',
        severity: 'error'
      });
      result.isValid = false;
    }

    // Validate assessed value
    if (property.assessedValue <= 0) {
      result.errors.push({
        field: 'assessedValue',
        message: 'Assessed value must be greater than zero',
        severity: 'error'
      });
      result.isValid = false;
    }

    // Validate market value
    if (property.marketValue <= 0) {
      result.errors.push({
        field: 'marketValue', 
        message: 'Market value must be greater than zero',
        severity: 'error'
      });
      result.isValid = false;
    }

    // Check for outliers in assessed vs market value ratio
    if (property.assessedValue > 0 && property.marketValue > 0) {
      const ratio = property.assessedValue / property.marketValue;
      if (ratio < 0.5 || ratio > 1.5) {
        result.anomalies.push({
          field: 'assessedValueRatio',
          value: ratio,
          expectedRange: [0.5, 1.5],
          confidence: 0.8
        });
      }
    }

    // Calculate final validation score based on errors and anomalies
    this.calculateValidationScore(result);

    return result;
  }

  /**
   * Detect and mark potential duplicate listings based on address similarity
   * @param listings Array of property listings to check for duplicates
   * @returns Array of potential duplicate groups
   */
  detectDuplicateListings(listings: PropertyListing[]): Array<{
    duplicateGroup: PropertyListing[];
    confidence: number;
    reason: string;
  }> {
    const result: Array<{
      duplicateGroup: PropertyListing[];
      confidence: number;
      reason: string;
    }> = [];

    // Group by exact address match
    const addressMap = new Map<string, PropertyListing[]>();
    
    for (const listing of listings) {
      if (!listing.address) continue;
      
      const normalizedAddress = this.normalizeAddress(listing.address);
      if (!addressMap.has(normalizedAddress)) {
        addressMap.set(normalizedAddress, []);
      }
      
      addressMap.get(normalizedAddress)!.push(listing);
    }
    
    // Find potential duplicates (same address)
    for (const [address, dupeListings] of addressMap.entries()) {
      if (dupeListings.length > 1) {
        result.push({
          duplicateGroup: dupeListings,
          confidence: 0.9,
          reason: `${dupeListings.length} listings found with same address: "${address}"`
        });
      }
    }

    return result;
  }

  /**
   * Cross-validate listings against property data to find inconsistencies
   * @param listings Property listings from MLS data
   * @param properties Property data from CAMA system
   * @returns Validation results with cross-reference checks
   */
  crossValidateListingsWithPropertyData(
    listings: PropertyListing[],
    properties: PropertyData[]
  ): Array<{
    listing: PropertyListing;
    property: PropertyData;
    discrepancies: Array<{
      field: string;
      listingValue: any;
      propertyValue: any;
      significance: 'high' | 'medium' | 'low';
    }>;
  }> {
    const results: Array<{
      listing: PropertyListing;
      property: PropertyData;
      discrepancies: Array<{
        field: string;
        listingValue: any;
        propertyValue: any;
        significance: 'high' | 'medium' | 'low';
      }>;
    }> = [];

    // Create map of properties by normalized address for faster lookup
    const propertyMap = new Map<string, PropertyData>();
    for (const property of properties) {
      const normalizedAddress = this.normalizeAddress(property.address);
      propertyMap.set(normalizedAddress, property);
    }

    // Check each listing against property data
    for (const listing of listings) {
      const normalizedAddress = this.normalizeAddress(listing.address);
      const property = propertyMap.get(normalizedAddress);
      
      if (!property) continue; // No matching property found
      
      const discrepancies: Array<{
        field: string;
        listingValue: any;
        propertyValue: any;
        significance: 'high' | 'medium' | 'low';
      }> = [];

      // Compare square footage (with 10% tolerance)
      if (listing.squareFeet > 0 && property.squareFeet > 0) {
        const sqFtDiffPercent = Math.abs(listing.squareFeet - property.squareFeet) / property.squareFeet;
        if (sqFtDiffPercent > 0.1) { // More than 10% difference
          discrepancies.push({
            field: 'squareFeet',
            listingValue: listing.squareFeet,
            propertyValue: property.squareFeet,
            significance: sqFtDiffPercent > 0.3 ? 'high' : 'medium'
          });
        }
      }

      // Compare year built
      if (listing.yearBuilt && property.assessmentYear) {
        if (Math.abs(listing.yearBuilt - property.assessmentYear) > 2) {
          discrepancies.push({
            field: 'yearBuilt',
            listingValue: listing.yearBuilt,
            propertyValue: property.assessmentYear,
            significance: Math.abs(listing.yearBuilt - property.assessmentYear) > 10 ? 'high' : 'low'
          });
        }
      }

      // Add to results if discrepancies found
      if (discrepancies.length > 0) {
        results.push({
          listing,
          property,
          discrepancies
        });
      }
    }

    return results;
  }

  // Private helper methods

  /**
   * Calculate mean and standard deviation of a numeric array
   */
  private calculateStats(values: number[]): { mean: number; stdDev: number } {
    if (values.length === 0) {
      return { mean: 0, stdDev: 0 };
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev };
  }

  /**
   * Validate required fields in a property listing
   */
  private validateRequiredFields(listing: PropertyListing, result: ValidationResult): void {
    for (const field of this.config.requiredFields || []) {
      if (!listing[field]) {
        result.errors.push({
          field,
          message: `${field} is required`,
          severity: 'error'
        });
        result.isValid = false;
      }
    }
  }

  /**
   * Validate price in a property listing
   */
  private validatePrice(listing: PropertyListing, result: ValidationResult): void {
    if (listing.price <= 0) {
      result.errors.push({
        field: 'price',
        message: 'Price must be greater than zero',
        severity: 'error'
      });
      result.isValid = false;
    } else if (
      listing.price < (this.config.priceRangeMin || 10000) || 
      listing.price > (this.config.priceRangeMax || 10000000)
    ) {
      result.errors.push({
        field: 'price',
        message: `Price ${listing.price} is outside the expected range (${this.config.priceRangeMin}-${this.config.priceRangeMax})`,
        severity: 'warning'
      });
    }
  }

  /**
   * Validate square footage in a property listing
   */
  private validateSquareFeet(listing: PropertyListing, result: ValidationResult): void {
    if (listing.squareFeet <= 0) {
      result.errors.push({
        field: 'squareFeet',
        message: 'Square footage must be greater than zero',
        severity: 'error'
      });
      result.isValid = false;
    } else if (
      listing.squareFeet < (this.config.squareFeetRangeMin || 200) || 
      listing.squareFeet > (this.config.squareFeetRangeMax || 20000)
    ) {
      result.errors.push({
        field: 'squareFeet',
        message: `Square footage ${listing.squareFeet} is outside the expected range (${this.config.squareFeetRangeMin}-${this.config.squareFeetRangeMax})`,
        severity: 'warning'
      });
    }
  }

  /**
   * Validate year built in a property listing
   */
  private validateYearBuilt(listing: PropertyListing, result: ValidationResult): void {
    const currentYear = new Date().getFullYear();
    
    if (listing.yearBuilt) {
      if (
        listing.yearBuilt < (this.config.yearBuiltRangeMin || 1800) || 
        listing.yearBuilt > (this.config.yearBuiltRangeMax || currentYear + 1)
      ) {
        result.errors.push({
          field: 'yearBuilt',
          message: `Year built ${listing.yearBuilt} is outside the expected range (${this.config.yearBuiltRangeMin}-${this.config.yearBuiltRangeMax})`,
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Detect outliers in price per square foot
   */
  private detectPricePerSqFtOutlier(listing: PropertyListing, result: ValidationResult): void {
    // Skip if we don't have market stats or valid data
    if (
      !this.marketStats.pricePerSqFtStats || 
      !listing.price || 
      !listing.squareFeet ||
      listing.price <= 0 ||
      listing.squareFeet <= 0
    ) {
      return;
    }

    const pricePerSqFt = listing.price / listing.squareFeet;
    const { mean, stdDev } = this.marketStats.pricePerSqFtStats;
    const threshold = this.config.pricePerSqFtThreshold || 2.5;
    
    // Check if price per square foot is an outlier (beyond threshold standard deviations)
    if (Math.abs(pricePerSqFt - mean) > threshold * stdDev) {
      result.anomalies.push({
        field: 'pricePerSqFt',
        value: pricePerSqFt,
        expectedRange: [
          Math.max(0, mean - threshold * stdDev), 
          mean + threshold * stdDev
        ],
        confidence: 0.85
      });
    }
  }

  /**
   * Detect outliers in days on market
   */
  private detectDaysOnMarketOutlier(listing: PropertyListing, result: ValidationResult): void {
    // Skip if we don't have market stats or valid data
    if (
      !this.marketStats.daysOnMarketStats || 
      !listing.daysOnMarket ||
      listing.daysOnMarket <= 0
    ) {
      return;
    }

    const { mean, stdDev } = this.marketStats.daysOnMarketStats;
    const threshold = this.config.daysOnMarketThreshold || 3.0;
    
    // Check if days on market is an outlier (beyond threshold standard deviations)
    if (Math.abs(listing.daysOnMarket - mean) > threshold * stdDev) {
      result.anomalies.push({
        field: 'daysOnMarket',
        value: listing.daysOnMarket,
        expectedRange: [
          Math.max(0, mean - threshold * stdDev), 
          mean + threshold * stdDev
        ],
        confidence: 0.8
      });
    }
  }

  /**
   * Calculate overall validation score
   */
  private calculateValidationScore(result: ValidationResult): void {
    // Start with perfect score
    let score = 100;
    
    // Deduct for errors (major impact)
    score -= result.errors.filter(e => e.severity === 'error').length * 20;
    score -= result.errors.filter(e => e.severity === 'warning').length * 5;
    
    // Deduct for anomalies (moderate impact)
    score -= result.anomalies.length * 10;
    
    // Ensure score is within 0-100 range
    result.score = Math.max(0, Math.min(100, score));
  }

  /**
   * Normalize address for consistent comparison
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\bstreet\b/g, 'st')
      .replace(/\bavenue\b/g, 'ave')
      .replace(/\bdriv(e)?\b/g, 'dr')
      .replace(/\bro(ad)?\b/g, 'rd')
      .replace(/\b(apartment|apt|unit)\b/g, '#')
      .replace(/[.,#]/g, '')
      .trim();
  }
}

// Export singleton instance
export const dataValidator = new DataValidator();