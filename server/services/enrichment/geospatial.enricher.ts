import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../../storage';
import { PropertyListing } from '../connectors/market.connector';
import { PropertyData } from '../connectors/cama.connector';
import { GeoJSONFeature, GeoJSONFeatureCollection, GISConnector } from '../connectors/gis.connector';
import { AppError } from '../../errors';
import { connectorFactory } from '../connectors/connector.factory';

/**
 * Interface for geocoding result
 */
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  confidence: number;
  formattedAddress: string;
  neighborhood?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  zip?: string;
  country?: string;
}

/**
 * Interface for spatial proximity analysis results
 */
export interface ProximityAnalysisResult {
  propertyId: string;
  nearbyProperties: Array<{
    propertyId: string;
    distance: number; // in meters
    bearing: number; // compass bearing in degrees
  }>;
  nearestAmenities: Array<{
    type: string;
    name: string;
    distance: number; // in meters
    latitude: number;
    longitude: number;
  }>;
  schoolDistrict?: string;
  floodZone?: string;
  walkabilityScore?: number;
  transitScore?: number;
}

/**
 * Service for enriching property data with geospatial information
 */
export class GeospatialEnricher {
  private static instance: GeospatialEnricher;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): GeospatialEnricher {
    if (!GeospatialEnricher.instance) {
      GeospatialEnricher.instance = new GeospatialEnricher();
    }
    return GeospatialEnricher.instance;
  }

  /**
   * Enrich property listing with geospatial data
   * @param listing Property listing to enrich
   * @returns Enriched property listing
   */
  async enrichPropertyListing(listing: PropertyListing): Promise<PropertyListing> {
    try {
      const startTime = Date.now();
      
      // Clone the listing to avoid modifying the original
      const enrichedListing = { ...listing };
      
      // Skip if we already have coordinates
      if (enrichedListing.latitude && enrichedListing.longitude) {
        return enrichedListing;
      }
      
      // Attempt to geocode the address
      const geocodeResult = await this.geocodeAddress(
        `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`
      );
      
      if (geocodeResult) {
        // Add coordinates and neighborhood info
        enrichedListing.latitude = geocodeResult.latitude;
        enrichedListing.longitude = geocodeResult.longitude;
        
        if (geocodeResult.neighborhood && !enrichedListing.neighborhood) {
          enrichedListing.neighborhood = geocodeResult.neighborhood;
        }
        
        // Log the enrichment
        const duration = Date.now() - startTime;
        await storage.createLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          message: `Enriched property listing with geospatial data: ${listing.mlsNumber}`,
          details: JSON.stringify({
            mlsNumber: listing.mlsNumber,
            address: listing.address,
            geocodeResult,
            duration
          }),
          source: 'geospatial-enricher',
          projectId: null,
          userId: null,
          sessionId: null,
          duration,
          statusCode: null,
          endpoint: null,
          tags: ['geospatial', 'enrichment', 'geocoding']
        });
      }
      
      return enrichedListing;
    } catch (error) {
      console.error('Error enriching property listing with geospatial data:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to enrich property listing with geospatial data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          mlsNumber: listing.mlsNumber,
          address: listing.address,
          error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
        }),
        source: 'geospatial-enricher',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['geospatial', 'enrichment', 'error']
      });
      
      // Return the original listing if enrichment fails
      return listing;
    }
  }

  /**
   * Get spatial relationships between properties
   * @param propertyIds Array of property IDs to analyze
   * @returns Map of property ID to proximity analysis results
   */
  async analyzeSpatialRelationships(
    listings: PropertyListing[]
  ): Promise<Map<string, ProximityAnalysisResult>> {
    try {
      const startTime = Date.now();
      
      // Filter listings with valid coordinates
      const geoListings = listings.filter(
        l => l.latitude != null && l.longitude != null
      );
      
      if (geoListings.length === 0) {
        throw new Error('No listings with valid coordinates found');
      }
      
      // Create result map
      const results = new Map<string, ProximityAnalysisResult>();
      
      // For each listing, find nearby properties
      for (const listing of geoListings) {
        if (!listing.mlsNumber || !listing.latitude || !listing.longitude) continue;
        
        // Find nearby properties (within 1km)
        const nearbyProperties = this.findNearbyProperties(listing, geoListings, 1000);
        
        // Create result
        results.set(listing.mlsNumber, {
          propertyId: listing.mlsNumber,
          nearbyProperties,
          nearestAmenities: [],
          schoolDistrict: listing.neighborhood || undefined
        });
      }
      
      // Log completion
      const duration = Date.now() - startTime;
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Analyzed spatial relationships for ${geoListings.length} properties`,
        details: JSON.stringify({
          propertyCount: geoListings.length,
          duration
        }),
        source: 'geospatial-enricher',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['geospatial', 'spatial-analysis']
      });
      
      return results;
    } catch (error) {
      console.error('Error analyzing spatial relationships:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to analyze spatial relationships: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
        }),
        source: 'geospatial-enricher',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['geospatial', 'spatial-analysis', 'error']
      });
      
      return new Map();
    }
  }

  /**
   * Generate GeoJSON feature collection from property listings
   * @param listings Array of property listings to convert
   * @returns GeoJSON FeatureCollection
   */
  convertListingsToGeoJSON(listings: PropertyListing[]): GeoJSONFeatureCollection {
    // Filter listings with valid coordinates
    const geoListings = listings.filter(
      l => l.latitude != null && l.longitude != null
    );
    
    // Create GeoJSON features
    const features: GeoJSONFeature[] = geoListings.map(listing => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [listing.longitude!, listing.latitude!]
      },
      properties: {
        id: listing.mlsNumber,
        address: listing.address,
        price: listing.price,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.squareFeet,
        yearBuilt: listing.yearBuilt,
        propertyType: listing.propertyType,
        status: listing.status,
        daysOnMarket: listing.daysOnMarket,
        pricePerSqFt: listing.squareFeet > 0 ? Math.round(listing.price / listing.squareFeet) : null
      },
      id: listing.mlsNumber
    }));
    
    // Create and return feature collection
    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Analyze trends by neighborhood using geospatial clustering
   * @param listings Array of property listings to analyze
   * @returns Neighborhood trend analysis
   */
  analyzeNeighborhoodTrends(listings: PropertyListing[]): Record<string, {
    avgPrice: number;
    avgPricePerSqFt: number;
    avgDaysOnMarket: number;
    inventoryCount: number;
    priceChange3Month: number;
    priceChange1Year: number;
    hotness: number; // 0-100 score based on days on market and inventory
    centerLat: number;
    centerLng: number;
    bounds: [number, number, number, number]; // [west, south, east, north]
  }> {
    // Group listings by neighborhood
    const neighborhoodMap = new Map<string, PropertyListing[]>();
    
    // Filter listings with valid neighborhood and coordinates
    const validListings = listings.filter(
      l => l.neighborhood && l.latitude != null && l.longitude != null
    );
    
    for (const listing of validListings) {
      const neighborhood = listing.neighborhood!;
      if (!neighborhoodMap.has(neighborhood)) {
        neighborhoodMap.set(neighborhood, []);
      }
      neighborhoodMap.get(neighborhood)!.push(listing);
    }
    
    // Calculate metrics for each neighborhood
    const results: Record<string, {
      avgPrice: number;
      avgPricePerSqFt: number;
      avgDaysOnMarket: number;
      inventoryCount: number;
      priceChange3Month: number;
      priceChange1Year: number;
      hotness: number;
      centerLat: number;
      centerLng: number;
      bounds: [number, number, number, number];
    }> = {};
    
    for (const [neighborhood, neighborhoodListings] of neighborhoodMap.entries()) {
      // Skip neighborhoods with too few listings
      if (neighborhoodListings.length < 3) continue;
      
      // Calculate average price
      const avgPrice = neighborhoodListings.reduce(
        (sum, l) => sum + l.price, 0
      ) / neighborhoodListings.length;
      
      // Calculate average price per square foot
      const pricesPerSqFt = neighborhoodListings
        .filter(l => l.squareFeet > 0)
        .map(l => l.price / l.squareFeet);
      
      const avgPricePerSqFt = pricesPerSqFt.length > 0
        ? pricesPerSqFt.reduce((sum, p) => sum + p, 0) / pricesPerSqFt.length
        : 0;
      
      // Calculate average days on market
      const daysOnMarket = neighborhoodListings
        .filter(l => l.daysOnMarket != null && l.daysOnMarket > 0)
        .map(l => l.daysOnMarket!);
      
      const avgDaysOnMarket = daysOnMarket.length > 0
        ? daysOnMarket.reduce((sum, d) => sum + d, 0) / daysOnMarket.length
        : 0;
      
      // Calculate center coordinates and bounds
      const lats = neighborhoodListings.map(l => l.latitude!);
      const lngs = neighborhoodListings.map(l => l.longitude!);
      
      const centerLat = lats.reduce((sum, lat) => sum + lat, 0) / lats.length;
      const centerLng = lngs.reduce((sum, lng) => sum + lng, 0) / lngs.length;
      
      const west = Math.min(...lngs);
      const east = Math.max(...lngs);
      const south = Math.min(...lats);
      const north = Math.max(...lats);
      
      // Calculate hotness score (0-100) based on days on market and inventory
      // Lower days on market = hotter
      const daysOnMarketScore = Math.max(0, 100 - avgDaysOnMarket * 2);
      
      // Moderate inventory = hotter (too low or too high inventory is less hot)
      const idealInventory = 10;
      const inventoryDiff = Math.abs(neighborhoodListings.length - idealInventory);
      const inventoryScore = Math.max(0, 100 - inventoryDiff * 5);
      
      const hotness = Math.round((daysOnMarketScore * 0.7) + (inventoryScore * 0.3));
      
      // Add to results
      results[neighborhood] = {
        avgPrice,
        avgPricePerSqFt,
        avgDaysOnMarket,
        inventoryCount: neighborhoodListings.length,
        priceChange3Month: 0, // Would require historical data
        priceChange1Year: 0, // Would require historical data
        hotness,
        centerLat,
        centerLng,
        bounds: [west, south, east, north]
      };
    }
    
    return results;
  }

  /**
   * Geocode an address to get coordinates
   * @param address The address to geocode
   * @returns Geocoding result or null if failed
   */
  private async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      // Get the GIS connector
      const gisConnector = connectorFactory.getConnectorsByType('gis')[0] as GISConnector;
      
      if (!gisConnector) {
        throw new Error('No GIS connector available for geocoding');
      }
      
      // Use the GIS connector's dedicated geocodeAddress method
      const result = await gisConnector.geocodeAddress(address);
      
      if (!result.features || result.features.length === 0) {
        return null;
      }
      
      // Extract coordinates from the first feature
      const feature = result.features[0];
      const coords = feature.geometry.coordinates;
      
      if (!coords || coords.length < 2) {
        return null;
      }
      
      // Extract properties
      const props = feature.properties;
      
      // Calculate confidence score (default to 0.8 if none in properties)
      const confidence = typeof props.score === 'number' ? props.score / 100 : 
                        (typeof props.confidence === 'number' ? props.confidence : 0.8);
      
      return {
        latitude: coords[1],
        longitude: coords[0],
        confidence: confidence,
        formattedAddress: props.address || props.formatted_address || address,
        neighborhood: props.neighborhood || props.district_name || undefined,
        district: props.district || undefined,
        city: props.city || props.place_name || props.locality || undefined,
        county: props.county || props.county_name || undefined,
        state: props.state || props.region || props.administrative_area || undefined,
        zip: props.zip || props.postal_code || props.postalCode || undefined,
        country: props.country || props.country_code || 'USA'
      };
    } catch (error) {
      console.error(`Failed to geocode address ${address}:`, error);
      return null;
    }
  }

  /**
   * Find nearby properties within a certain distance
   * @param property The reference property
   * @param allProperties All properties to search
   * @param maxDistance Maximum distance in meters
   * @returns Array of nearby properties with distance
   */
  private findNearbyProperties(
    property: PropertyListing,
    allProperties: PropertyListing[],
    maxDistance: number
  ): Array<{
    propertyId: string;
    distance: number;
    bearing: number;
  }> {
    if (!property.latitude || !property.longitude) {
      return [];
    }
    
    const nearbyProperties: Array<{
      propertyId: string;
      distance: number;
      bearing: number;
    }> = [];
    
    for (const otherProperty of allProperties) {
      // Skip the same property or properties without coordinates
      if (
        otherProperty.mlsNumber === property.mlsNumber ||
        !otherProperty.latitude ||
        !otherProperty.longitude
      ) {
        continue;
      }
      
      // Calculate distance
      const distance = this.calculateDistance(
        property.latitude,
        property.longitude,
        otherProperty.latitude,
        otherProperty.longitude
      );
      
      // Calculate bearing
      const bearing = this.calculateBearing(
        property.latitude,
        property.longitude,
        otherProperty.latitude,
        otherProperty.longitude
      );
      
      // Add to results if within range
      if (distance <= maxDistance) {
        nearbyProperties.push({
          propertyId: otherProperty.mlsNumber,
          distance,
          bearing
        });
      }
    }
    
    // Sort by distance
    return nearbyProperties.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate distance between two points using Haversine formula
   * @returns Distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  /**
   * Calculate bearing between two points
   * @returns Bearing in degrees (0-360)
   */
  private calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δλ = this.toRadians(lon2 - lon1);
    
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    
    let brng = Math.atan2(y, x);
    brng = this.toDegrees(brng);
    
    return (brng + 360) % 360;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * Convert radians to degrees
   */
  private toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }
}

// Export singleton instance
export const geospatialEnricher = GeospatialEnricher.getInstance();