/**
 * ACI Real Estate Connector
 * 
 * This connector integrates with the ACI API to provide real estate market data.
 * It handles authentication, API calls, and data transformation.
 */

import axios from 'axios';
import { OptimizedLogger } from '../optimized-logging';
import { LogCategory } from '../../../shared/schema';

// Create logger for this connector
const logger = OptimizedLogger.getInstance();

// Constants
const ACI_BASE_URL = 'https://api.aciwebservices.com';
const API_KEY = process.env.ACI_API_KEY || '';
const SERVICE_ENDPOINT = '/aciwebservices/valuation';
const NEIGHBORHOOD_ENDPOINT = '/aciwebservices/neighborhood';
const GEOCODING_ENDPOINT = '/aciwebservices/geocode';
const CLIMATE_ENDPOINT = '/aciwebservices/climate';
const MAP_ENDPOINT = '/aciwebservices/map';

// Interface for geocoding results
interface GeocodingResult {
  latitude: number;
  longitude: number;
  confidence: string;
  formattedAddress: string;
}

// Interface for property data
interface PropertyData {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  propertyType: string;
  yearBuilt: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
  estimatedValue: number | null;
  assessedValue: number | null;
  taxAmount: number | null;
  zoning: string | null;
  latitude: number | null;
  longitude: number | null;
  parcelId: string | null;
  additionalDetails: Record<string, any>;
}

// Interface for neighborhood data
interface NeighborhoodData {
  name: string;
  medianHomeValue: number | null;
  averageHomeValue: number | null;
  averageYearBuilt: number | null;
  totalProperties: number | null;
  schoolRating: number | null;
  crimeIndex: number | null;
  walkScore: number | null;
  transitScore: number | null;
  demographics: Record<string, any>;
  trends: Record<string, any>;
  boundaries: any; // GeoJSON polygon
}

// Interface for climate data
interface ClimateData {
  annualPrecipitation: number;
  annualSnowfall: number | null;
  averageTemperature: number;
  averageHighTemperature: number;
  averageLowTemperature: number;
  floodRisk: string;
  droughtRisk: string;
  fireRisk: string;
  stormRisk: string;
  naturalDisasterHistory: Record<string, any>;
}

// Create component logger
// Logger is already defined at the top of the file

/**
 * ACI Real Estate Connector
 * Provides methods to interact with ACI API for real estate data
 */
export class ACIRealEstateConnector {
  private static instance: ACIRealEstateConnector;
  private apiKey: string;
  private initialized: boolean = false;
  
  private constructor() {
    this.apiKey = API_KEY;
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ACIRealEstateConnector {
    if (!ACIRealEstateConnector.instance) {
      ACIRealEstateConnector.instance = new ACIRealEstateConnector();
    }
    return ACIRealEstateConnector.instance;
  }
  
  /**
   * Initialize the connector with API credentials
   */
  public async initialize(): Promise<boolean> {
    // Check if API key is available
    if (!this.apiKey) {
      logger.error('ACI API key is not configured');
      return false;
    }
    
    try {
      // Validate API key with a simple request
      await this.validateApiKey();
      this.initialized = true;
      logger.info('ACI Real Estate Connector initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize ACI connector: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
  
  /**
   * Validate API key by making a test request
   */
  private async validateApiKey(): Promise<void> {
    try {
      const response = await axios.get(`${ACI_BASE_URL}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`API validation failed with status ${response.status}`);
      }
    } catch (error) {
      logger.error(`API key validation failed: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error('Failed to validate ACI API key');
    }
  }
  
  /**
   * Get property data for a given address
   */
  public async getPropertyData(address: string): Promise<PropertyData> {
    if (!this.initialized) {
      throw new Error('ACI connector is not initialized');
    }
    
    try {
      logger.info(`Fetching property data for address: ${address}`);
      
      // First geocode the address to get coordinates
      const coordinates = await this.geocodeAddress(address);
      
      // Then get the property data using the coordinates
      const response = await axios.get(`${ACI_BASE_URL}${SERVICE_ENDPOINT}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          address: address,
          lat: coordinates.latitude,
          lng: coordinates.longitude,
          includeDetails: true
        }
      });
      
      // Transform the response into our PropertyData interface
      return this.transformPropertyData(response.data);
    } catch (error) {
      logger.error(`Error fetching property data: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get property data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Transform raw API property data into our interface
   */
  private transformPropertyData(rawData: any): PropertyData {
    return {
      address: rawData.address || '',
      city: rawData.city || '',
      state: rawData.state || '',
      zip: rawData.zipCode || '',
      county: rawData.county || '',
      propertyType: rawData.propertyType || '',
      yearBuilt: rawData.yearBuilt ? parseInt(rawData.yearBuilt) : null,
      squareFeet: rawData.squareFeet ? parseFloat(rawData.squareFeet) : null,
      lotSize: rawData.lotSize ? parseFloat(rawData.lotSize) : null,
      bedrooms: rawData.bedrooms ? parseInt(rawData.bedrooms) : null,
      bathrooms: rawData.bathrooms ? parseFloat(rawData.bathrooms) : null,
      lastSaleDate: rawData.lastSaleDate || null,
      lastSalePrice: rawData.lastSalePrice ? parseFloat(rawData.lastSalePrice) : null,
      estimatedValue: rawData.estimatedValue ? parseFloat(rawData.estimatedValue) : null,
      assessedValue: rawData.assessedValue ? parseFloat(rawData.assessedValue) : null,
      taxAmount: rawData.taxAmount ? parseFloat(rawData.taxAmount) : null,
      zoning: rawData.zoning || null,
      latitude: rawData.latitude ? parseFloat(rawData.latitude) : null,
      longitude: rawData.longitude ? parseFloat(rawData.longitude) : null,
      parcelId: rawData.parcelId || null,
      additionalDetails: rawData.additionalDetails || {}
    };
  }
  
  /**
   * Get neighborhood data for given coordinates
   */
  public async getNeighborhoodData(latitude: number, longitude: number): Promise<NeighborhoodData> {
    if (!this.initialized) {
      throw new Error('ACI connector is not initialized');
    }
    
    try {
      logger.info(`Fetching neighborhood data for coordinates: ${latitude}, ${longitude}`);
      
      const response = await axios.get(`${ACI_BASE_URL}${NEIGHBORHOOD_ENDPOINT}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          lat: latitude,
          lng: longitude,
          includeDetails: true,
          includeBoundaries: true
        }
      });
      
      // Transform the response into our NeighborhoodData interface
      return this.transformNeighborhoodData(response.data);
    } catch (error) {
      logger.error(`Error fetching neighborhood data: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get neighborhood data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Transform raw API neighborhood data into our interface
   */
  private transformNeighborhoodData(rawData: any): NeighborhoodData {
    return {
      name: rawData.neighborhoodName || 'Unknown',
      medianHomeValue: rawData.medianHomeValue ? parseFloat(rawData.medianHomeValue) : null,
      averageHomeValue: rawData.averageHomeValue ? parseFloat(rawData.averageHomeValue) : null,
      averageYearBuilt: rawData.averageYearBuilt ? parseFloat(rawData.averageYearBuilt) : null,
      totalProperties: rawData.totalProperties ? parseInt(rawData.totalProperties) : null,
      schoolRating: rawData.schoolRating ? parseFloat(rawData.schoolRating) : null,
      crimeIndex: rawData.crimeIndex ? parseFloat(rawData.crimeIndex) : null,
      walkScore: rawData.walkScore ? parseFloat(rawData.walkScore) : null,
      transitScore: rawData.transitScore ? parseFloat(rawData.transitScore) : null,
      demographics: rawData.demographics || {},
      trends: rawData.trends || {},
      boundaries: rawData.boundaries || null
    };
  }
  
  /**
   * Geocode an address to get coordinates
   */
  public async geocodeAddress(address: string): Promise<GeocodingResult> {
    if (!this.initialized) {
      throw new Error('ACI connector is not initialized');
    }
    
    try {
      logger.info(`Geocoding address: ${address}`);
      
      const response = await axios.get(`${ACI_BASE_URL}${GEOCODING_ENDPOINT}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          address: address
        }
      });
      
      if (!response.data || !response.data.latitude || !response.data.longitude) {
        throw new Error('Geocoding failed, no coordinates returned');
      }
      
      return {
        latitude: parseFloat(response.data.latitude),
        longitude: parseFloat(response.data.longitude),
        confidence: response.data.confidence || 'unknown',
        formattedAddress: response.data.formattedAddress || address
      };
    } catch (error) {
      logger.error(`Error geocoding address: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to geocode address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get climate data for given coordinates
   */
  public async getClimateData(latitude: number, longitude: number): Promise<ClimateData> {
    if (!this.initialized) {
      throw new Error('ACI connector is not initialized');
    }
    
    try {
      logger.info(`Fetching climate data for coordinates: ${latitude}, ${longitude}`);
      
      const response = await axios.get(`${ACI_BASE_URL}${CLIMATE_ENDPOINT}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          lat: latitude,
          lng: longitude
        }
      });
      
      // Transform the response into our ClimateData interface
      return this.transformClimateData(response.data);
    } catch (error) {
      logger.error(`Error fetching climate data: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get climate data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Transform raw API climate data into our interface
   */
  private transformClimateData(rawData: any): ClimateData {
    return {
      annualPrecipitation: rawData.annualPrecipitation ? parseFloat(rawData.annualPrecipitation) : 0,
      annualSnowfall: rawData.annualSnowfall ? parseFloat(rawData.annualSnowfall) : null,
      averageTemperature: rawData.averageTemperature ? parseFloat(rawData.averageTemperature) : 0,
      averageHighTemperature: rawData.averageHighTemperature ? parseFloat(rawData.averageHighTemperature) : 0,
      averageLowTemperature: rawData.averageLowTemperature ? parseFloat(rawData.averageLowTemperature) : 0,
      floodRisk: rawData.floodRisk || 'Unknown',
      droughtRisk: rawData.droughtRisk || 'Unknown',
      fireRisk: rawData.fireRisk || 'Unknown',
      stormRisk: rawData.stormRisk || 'Unknown',
      naturalDisasterHistory: rawData.naturalDisasterHistory || {}
    };
  }
  
  /**
   * Get static map for given coordinates
   */
  public async getStaticMap(
    latitude: number, 
    longitude: number, 
    zoom: number = 15, 
    width: number = 600, 
    height: number = 400
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('ACI connector is not initialized');
    }
    
    try {
      logger.info(`Generating static map for coordinates: ${latitude}, ${longitude}`);
      
      const response = await axios.get(`${ACI_BASE_URL}${MAP_ENDPOINT}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          lat: latitude,
          lng: longitude,
          zoom: zoom,
          width: width,
          height: height,
          format: 'png'
        },
        responseType: 'arraybuffer'
      });
      
      // Convert the image to base64 for embedding
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      logger.error(`Error generating static map: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate static map: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}