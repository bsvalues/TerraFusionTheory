import { DataValidator } from '../../../server/services/enrichment/data.validator';
import { PropertyListing } from '../../../server/services/connectors/market.connector';
import { PropertyData } from '../../../server/services/connectors/cama.connector';

describe('DataValidator', () => {
  let validator: DataValidator;
  
  // Sample property listings for testing
  const sampleListings: PropertyListing[] = [
    {
      mlsNumber: 'MLS12345',
      address: '123 Main St',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      price: 400000,
      status: 'active',
      propertyType: 'single-family',
      beds: 3,
      baths: 2,
      squareFeet: 1800,
      yearBuilt: 2010,
      daysOnMarket: 15
    },
    {
      mlsNumber: 'MLS12346',
      address: '456 Oak Ave',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      price: 550000,
      status: 'active',
      propertyType: 'single-family',
      beds: 4,
      baths: 3,
      squareFeet: 2500,
      yearBuilt: 2015,
      daysOnMarket: 7
    },
    {
      mlsNumber: 'MLS12347',
      address: '789 Pine St',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      price: 250000,
      status: 'pending',
      propertyType: 'townhouse',
      beds: 2,
      baths: 1.5,
      squareFeet: 1200,
      yearBuilt: 2000,
      daysOnMarket: 30
    }
  ];

  const samplePropertyData: PropertyData = {
    id: 'P12345',
    parcelId: 'GV-12345-67',
    address: '123 Main St',
    owner: 'John Doe',
    assessedValue: 380000,
    marketValue: 400000,
    landValue: 100000,
    improvementValue: 300000,
    assessmentYear: 2024,
    propertyClass: 'single-family',
    acres: 0.25,
    squareFeet: 1800,
    zoning: 'R1',
    neighborhood: 'Downtown',
    lastSaleDate: '2020-05-15',
    lastSalePrice: 375000
  };
  
  beforeEach(() => {
    // Create a validator with default config
    validator = new DataValidator({
      priceRangeMin: 100000,
      priceRangeMax: 1000000,
      squareFeetRangeMin: 500,
      squareFeetRangeMax: 5000,
      yearBuiltRangeMin: 1900,
      yearBuiltRangeMax: 2025,
      requiredFields: ['mlsNumber', 'address', 'price', 'beds', 'baths', 'squareFeet']
    });
    
    // Initialize with sample data
    validator.calculateMarketStats(sampleListings);
  });
  
  describe('validateListing', () => {
    it('should validate a valid property listing', () => {
      const result = validator.validateListing(sampleListings[0]);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.errors).toHaveLength(0);
      expect(result.anomalies).toHaveLength(0);
    });
    
    it('should detect missing required fields', () => {
      const invalidListing: PropertyListing = {
        ...sampleListings[0],
        squareFeet: undefined as any
      };
      
      const result = validator.validateListing(invalidListing);
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(80);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('squareFeet');
      expect(result.errors[0].severity).toBe('error');
    });
    
    it('should detect price out of range', () => {
      const invalidListing: PropertyListing = {
        ...sampleListings[0],
        price: 50000 // Below minimum price
      };
      
      const result = validator.validateListing(invalidListing);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'price')).toBe(true);
    });
    
    it('should detect price per square foot outliers', () => {
      const outlierListing: PropertyListing = {
        ...sampleListings[0],
        price: 900000, // Much higher price for the same sqft
        squareFeet: 1800
      };
      
      const result = validator.validateListing(outlierListing);
      
      expect(result.anomalies.some(a => a.field === 'pricePerSqFt')).toBe(true);
    });
    
    it('should detect days on market outliers', () => {
      const outlierListing: PropertyListing = {
        ...sampleListings[0],
        daysOnMarket: 180 // Much longer than average
      };
      
      const result = validator.validateListing(outlierListing);
      
      expect(result.anomalies.some(a => a.field === 'daysOnMarket')).toBe(true);
    });
  });
  
  describe('validatePropertyData', () => {
    it('should validate a valid property data record', () => {
      const result = validator.validatePropertyData(samplePropertyData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should detect inconsistent property values', () => {
      const invalidPropertyData: PropertyData = {
        ...samplePropertyData,
        marketValue: 400000,
        assessedValue: 500000 // Assessed value shouldn't be higher than market value
      };
      
      const result = validator.validatePropertyData(invalidPropertyData);
      
      expect(result.anomalies.length).toBeGreaterThan(0);
    });
  });
  
  describe('detectDuplicateListings', () => {
    it('should detect duplicate listings with similar addresses', () => {
      const listings: PropertyListing[] = [
        ...sampleListings,
        {
          ...sampleListings[0],
          mlsNumber: 'MLS99999',
          address: '123 Main Street' // Very similar to '123 Main St'
        }
      ];
      
      const duplicates = validator.detectDuplicateListings(listings);
      
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].listings).toHaveLength(2);
      expect(duplicates[0].listings[0].mlsNumber).toBe('MLS12345');
      expect(duplicates[0].listings[1].mlsNumber).toBe('MLS99999');
    });
    
    it('should not detect distinct listings as duplicates', () => {
      const duplicates = validator.detectDuplicateListings(sampleListings);
      
      expect(duplicates).toHaveLength(0);
    });
  });
  
  describe('crossValidateListingsWithPropertyData', () => {
    it('should validate consistent listing and property data', () => {
      // Listing matching the property data
      const matchingListing = sampleListings[0];
      
      const result = validator.crossValidateListingsWithPropertyData(
        matchingListing,
        samplePropertyData
      );
      
      expect(result.isValid).toBe(true);
      expect(result.crossReferenceIssues).toHaveLength(0);
    });
    
    it('should detect inconsistencies between listing and property data', () => {
      // Create a listing with inconsistent square footage
      const inconsistentListing: PropertyListing = {
        ...sampleListings[0],
        squareFeet: 2200 // Different from property data (1800)
      };
      
      const result = validator.crossValidateListingsWithPropertyData(
        inconsistentListing,
        samplePropertyData
      );
      
      expect(result.isValid).toBe(false);
      expect(result.crossReferenceIssues.length).toBeGreaterThan(0);
      expect(result.crossReferenceIssues[0].field).toBe('squareFeet');
    });
    
    it('should detect large price discrepancies', () => {
      // Create a listing with a much higher price
      const inconsistentListing: PropertyListing = {
        ...sampleListings[0],
        price: 600000 // Much higher than market value in property data (400000)
      };
      
      const result = validator.crossValidateListingsWithPropertyData(
        inconsistentListing,
        samplePropertyData
      );
      
      expect(result.crossReferenceIssues.some(issue => issue.field === 'price')).toBe(true);
    });
  });
});