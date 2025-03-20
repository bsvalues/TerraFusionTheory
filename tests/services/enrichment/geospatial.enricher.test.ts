import { GeospatialEnricher } from '../../../server/services/enrichment/geospatial.enricher';
import { PropertyListing } from '../../../server/services/connectors/market.connector';

describe('GeospatialEnricher', () => {
  let enricher: GeospatialEnricher;
  
  // Sample property listings for testing
  const sampleListing: PropertyListing = {
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
  };
  
  const listingsWithCoordinates: PropertyListing[] = [
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
      latitude: 46.2541,
      longitude: -119.9025
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
      latitude: 46.2532,
      longitude: -119.9103
    },
    {
      mlsNumber: 'MLS12347',
      address: '789 Pine St',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      price: 380000,
      status: 'sold',
      propertyType: 'single-family',
      beds: 3,
      baths: 2,
      squareFeet: 1700,
      yearBuilt: 2008,
      latitude: 46.2489,
      longitude: -119.9078
    }
  ];
  
  beforeEach(() => {
    // Get the singleton instance
    enricher = GeospatialEnricher.getInstance();
    
    // Mock the geocodeAddress private method
    (enricher as any).geocodeAddress = jest.fn().mockResolvedValue({
      latitude: 46.2541,
      longitude: -119.9025,
      confidence: 0.9,
      formattedAddress: '123 Main St, Grandview, WA 98930',
      neighborhood: 'Downtown',
      city: 'Grandview',
      county: 'Yakima',
      state: 'WA',
      zip: '98930',
      country: 'USA'
    });
  });
  
  describe('enrichPropertyListing', () => {
    it('should add geospatial data to a property listing', async () => {
      const enrichedListing = await enricher.enrichPropertyListing({ ...sampleListing });
      
      // Check if listing has been enriched with coordinates
      expect(enrichedListing).toHaveProperty('latitude');
      expect(enrichedListing).toHaveProperty('longitude');
      expect(enrichedListing.latitude).toBe(46.2541);
      expect(enrichedListing.longitude).toBe(-119.9025);
      
      // Check if listing has been enriched with neighborhood info
      expect(enrichedListing).toHaveProperty('neighborhood', 'Downtown');
    });
    
    it('should not geocode if listing already has coordinates', async () => {
      const listingWithCoords = { 
        ...sampleListing, 
        latitude: 46.2550, 
        longitude: -119.9030 
      };
      
      const enrichedListing = await enricher.enrichPropertyListing(listingWithCoords);
      
      // Should preserve existing coordinates
      expect(enrichedListing.latitude).toBe(46.2550);
      expect(enrichedListing.longitude).toBe(-119.9030);
      
      // Geocode should not have been called
      expect((enricher as any).geocodeAddress).not.toHaveBeenCalled();
    });
  });
  
  describe('convertListingsToGeoJSON', () => {
    it('should convert property listings to GeoJSON format', () => {
      const geoJSON = enricher.convertListingsToGeoJSON(listingsWithCoordinates);
      
      // Check structure
      expect(geoJSON.type).toBe('FeatureCollection');
      expect(geoJSON.features).toHaveLength(3);
      
      // Check first feature
      const firstFeature = geoJSON.features[0];
      expect(firstFeature.type).toBe('Feature');
      expect(firstFeature.geometry.type).toBe('Point');
      expect(firstFeature.geometry.coordinates).toEqual([-119.9025, 46.2541]);
      expect(firstFeature.properties).toHaveProperty('mlsNumber', 'MLS12345');
      expect(firstFeature.properties).toHaveProperty('price', 400000);
    });
    
    it('should handle listings without coordinates', () => {
      const mixedListings = [
        ...listingsWithCoordinates,
        { ...sampleListing, latitude: undefined, longitude: undefined }
      ];
      
      const geoJSON = enricher.convertListingsToGeoJSON(mixedListings);
      
      // Should only include listings with coordinates
      expect(geoJSON.features).toHaveLength(3);
    });
  });
  
  describe('calculateDistance', () => {
    it('should calculate distance between two points using Haversine formula', () => {
      const point1 = { latitude: 46.2541, longitude: -119.9025 };
      const point2 = { latitude: 46.2532, longitude: -119.9103 };
      
      // Use the private method directly via any type assertion
      const distance = (enricher as any).calculateDistance(
        point1.latitude, point1.longitude, 
        point2.latitude, point2.longitude
      );
      
      // Distance should be approximately 665 meters (calculated using external Haversine calculator)
      expect(distance).toBeGreaterThan(600);
      expect(distance).toBeLessThan(700);
    });
  });
  
  describe('calculateBearing', () => {
    it('should calculate bearing between two points', () => {
      const point1 = { latitude: 46.2541, longitude: -119.9025 };
      const point2 = { latitude: 46.2532, longitude: -119.9103 };
      
      // Use the private method directly via any type assertion
      const bearing = (enricher as any).calculateBearing(
        point1.latitude, point1.longitude, 
        point2.latitude, point2.longitude
      );
      
      // Bearing should be approximately 260 degrees (west-southwest)
      expect(bearing).toBeGreaterThan(250);
      expect(bearing).toBeLessThan(270);
    });
  });
  
  describe('analyzeNeighborhoodTrends', () => {
    it('should analyze trends by neighborhood using geospatial clustering', () => {
      // Enhanced listings with neighborhood info
      const neighborhoodListings = listingsWithCoordinates.map((listing, index) => {
        return {
          ...listing,
          neighborhood: index < 2 ? 'Downtown' : 'Hillside'
        };
      });
      
      const trends = enricher.analyzeNeighborhoodTrends(neighborhoodListings);
      
      // Should have trends for both neighborhoods
      expect(trends).toHaveProperty('Downtown');
      expect(trends).toHaveProperty('Hillside');
      
      // Check Downtown neighborhood stats
      expect(trends.Downtown).toHaveProperty('averagePrice');
      expect(trends.Downtown).toHaveProperty('listingCount', 2);
      
      // Average price should be (400000 + 550000) / 2 = 475000
      expect(trends.Downtown.averagePrice).toBe(475000);
    });
    
    it('should handle listings without neighborhood data', () => {
      const trends = enricher.analyzeNeighborhoodTrends(listingsWithCoordinates);
      
      // Should have a "Unknown" neighborhood for listings without neighborhood data
      expect(trends).toHaveProperty('Unknown');
      expect(trends.Unknown).toHaveProperty('listingCount', 3);
    });
  });
});