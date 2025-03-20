import { GeospatialEnricher } from '../../../server/services/enrichment/geospatial.enricher';
import { PropertyListing } from '../../../server/services/connectors/market.connector';
import { GeoJSONFeatureCollection } from '../../../server/services/connectors/gis.connector';

// Mock external dependencies that make API calls
jest.mock('axios', () => ({
  get: jest.fn()
}));

// Get the singleton instance for testing
const geospatialEnricher = GeospatialEnricher.getInstance();

describe('GeospatialEnricher', () => {
  // Sample property listings for testing
  const sampleListings: PropertyListing[] = [
    {
      mlsNumber: 'MLS12345',
      address: '123 Main St, Grandview, WA 98930',
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
      daysOnMarket: 15,
      latitude: 46.25,
      longitude: -119.91
    },
    {
      mlsNumber: 'MLS12346',
      address: '456 Oak Ave, Grandview, WA 98930',
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
      daysOnMarket: 7,
      latitude: 46.26,
      longitude: -119.90
    },
    {
      mlsNumber: 'MLS12347',
      address: '789 Pine St, Grandview, WA 98930',
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
      daysOnMarket: 30,
      latitude: 46.24,
      longitude: -119.92
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('enrichPropertyListing', () => {
    it('should add geospatial data to a property listing', async () => {
      // Assume listing already has coordinates
      const listing = { ...sampleListings[0], latitude: undefined, longitude: undefined };
      
      // Mock geocoding result
      (geospatialEnricher as any).geocodeAddress = jest.fn().mockResolvedValue({
        latitude: 46.25,
        longitude: -119.91,
        confidence: 0.9,
        formattedAddress: '123 Main St, Grandview, WA 98930',
        neighborhood: 'Downtown',
        district: 'Central',
        city: 'Grandview',
        county: 'Yakima',
        state: 'WA',
        zip: '98930'
      });
      
      const enrichedListing = await geospatialEnricher.enrichPropertyListing(listing);
      
      // Check if geocoding was attempted
      expect((geospatialEnricher as any).geocodeAddress).toHaveBeenCalledWith(listing.address);
      
      // Check if enriched data was added
      expect(enrichedListing.latitude).toBe(46.25);
      expect(enrichedListing.longitude).toBe(-119.91);
      expect(enrichedListing.neighborhood).toBe('Downtown');
    });
    
    it('should keep existing coordinates if present', async () => {
      // Listing already has coordinates
      const listing = { ...sampleListings[0] };
      
      // Mock geocoding (should not be called)
      (geospatialEnricher as any).geocodeAddress = jest.fn();
      
      const enrichedListing = await geospatialEnricher.enrichPropertyListing(listing);
      
      // Should not attempt geocoding
      expect((geospatialEnricher as any).geocodeAddress).not.toHaveBeenCalled();
      
      // Original coordinates should be preserved
      expect(enrichedListing.latitude).toBe(46.25);
      expect(enrichedListing.longitude).toBe(-119.91);
    });
  });
  
  describe('convertListingsToGeoJSON', () => {
    it('should convert property listings to GeoJSON format', () => {
      const geoJSON = geospatialEnricher.convertListingsToGeoJSON(sampleListings);
      
      // Check GeoJSON structure
      expect(geoJSON.type).toBe('FeatureCollection');
      expect(geoJSON.features).toHaveLength(3);
      
      // Check first feature
      const feature = geoJSON.features[0];
      expect(feature.type).toBe('Feature');
      expect(feature.geometry.type).toBe('Point');
      expect(feature.geometry.coordinates).toEqual([-119.91, 46.25]); // [longitude, latitude]
      expect(feature.properties.mlsNumber).toBe('MLS12345');
      expect(feature.properties.price).toBe(400000);
    });
    
    it('should handle listings without coordinates', () => {
      const listingsWithoutCoords = [
        { ...sampleListings[0], latitude: undefined, longitude: undefined }
      ];
      
      const geoJSON = geospatialEnricher.convertListingsToGeoJSON(listingsWithoutCoords);
      
      // Should still create a valid GeoJSON but with empty features array
      expect(geoJSON.type).toBe('FeatureCollection');
      expect(geoJSON.features).toHaveLength(0);
    });
  });
  
  describe('analyzeNeighborhoodTrends', () => {
    it('should analyze trends by neighborhood', () => {
      // Add neighborhood data to listings
      const listingsWithNeighborhoods = sampleListings.map((listing, index) => ({
        ...listing,
        neighborhood: index < 2 ? 'Downtown' : 'Westside'
      }));
      
      const trends = geospatialEnricher.analyzeNeighborhoodTrends(listingsWithNeighborhoods);
      
      // Should have two neighborhoods
      expect(Object.keys(trends)).toHaveLength(2);
      expect(trends).toHaveProperty('Downtown');
      expect(trends).toHaveProperty('Westside');
      
      // Downtown should have metrics based on first two listings
      expect(trends.Downtown).toHaveProperty('priceChange');
      expect(trends.Downtown).toHaveProperty('inventoryChange');
      expect(trends.Downtown).toHaveProperty('trend');
    });
    
    it('should handle listings without neighborhood data', () => {
      const trends = geospatialEnricher.analyzeNeighborhoodTrends(sampleListings);
      
      // Should create a default neighborhood
      expect(Object.keys(trends)).toHaveLength(1);
      expect(trends).toHaveProperty('unknown');
    });
  });
  
  describe('analyzeSpatialRelationships', () => {
    it('should calculate relationships between properties', async () => {
      // Mock the findNearbyProperties method
      (geospatialEnricher as any).findNearbyProperties = jest.fn().mockReturnValue([
        {
          property: sampleListings[1],
          distance: 500, // 500 meters
          bearing: 45 // Northeast
        }
      ]);
      
      const relationships = await geospatialEnricher.analyzeSpatialRelationships([
        sampleListings[0].mlsNumber,
        sampleListings[1].mlsNumber
      ]);
      
      // Should have results for the properties
      expect(relationships.size).toBe(2);
      expect(relationships.has(sampleListings[0].mlsNumber)).toBe(true);
      
      // Check the relationship data
      const relationship = relationships.get(sampleListings[0].mlsNumber);
      expect(relationship).toBeDefined();
      if (relationship) {
        expect(relationship.nearbyProperties).toHaveLength(1);
        expect(relationship.nearbyProperties[0].propertyId).toBe(sampleListings[1].mlsNumber);
        expect(relationship.nearbyProperties[0].distance).toBe(500);
        expect(relationship.nearbyProperties[0].bearing).toBe(45);
      }
    });
  });
  
  describe('Geospatial Calculations', () => {
    describe('calculateDistance', () => {
      it('should calculate distance between two points', () => {
        const point1 = { latitude: 46.25, longitude: -119.91 };
        const point2 = { latitude: 46.26, longitude: -119.90 };
        
        const distance = (geospatialEnricher as any).calculateDistance(
          point1.latitude, point1.longitude,
          point2.latitude, point2.longitude
        );
        
        // Roughly 1.5 km between these points
        expect(distance).toBeGreaterThan(1000);
        expect(distance).toBeLessThan(2000);
      });
    });
    
    describe('calculateBearing', () => {
      it('should calculate bearing between two points', () => {
        const point1 = { latitude: 46.25, longitude: -119.91 };
        const point2 = { latitude: 46.26, longitude: -119.90 }; // North-east of point1
        
        const bearing = (geospatialEnricher as any).calculateBearing(
          point1.latitude, point1.longitude,
          point2.latitude, point2.longitude
        );
        
        // Should be roughly northeast (around 45 degrees)
        expect(bearing).toBeGreaterThan(0);
        expect(bearing).toBeLessThan(90);
      });
    });
  });
});