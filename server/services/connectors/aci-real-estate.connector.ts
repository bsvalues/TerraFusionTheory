/**
 * ACI Real Estate Connector
 * 
 * This service manages the integration with real estate-specific tools via the ACI platform.
 * It provides a unified interface for accessing property data, map services, and market analysis
 * tools while handling authentication, caching, and error handling.
 */

import axios from 'axios';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { OptimizedLogger } from '../optimized-logging';

const logger = OptimizedLogger.getInstance();

// Available real estate-related ACI apps
export enum RealEstateApp {
  GOOGLE_MAPS = 'GOOGLE_MAPS',
  GOOGLE_PLACES = 'GOOGLE_PLACES',
  CENSUS = 'CENSUS',
  OPEN_WEATHER_MAP = 'OPEN_WEATHER_MAP',
  PROPERTY_SHARK = 'PROPERTY_SHARK',
  WALK_SCORE = 'WALK_SCORE'
}

// Cache for API responses to reduce redundant calls
type CacheEntry = {
  data: any;
  timestamp: number;
  expiresIn: number; // milliseconds
};

export class ACIRealEstateConnector {
  private static instance: ACIRealEstateConnector;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheExpiryDefault = 30 * 60 * 1000; // 30 minutes
  private isInitialized = false;
  private connectedApps: Set<string> = new Set();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of the connector
   */
  public static getInstance(): ACIRealEstateConnector {
    if (!ACIRealEstateConnector.instance) {
      ACIRealEstateConnector.instance = new ACIRealEstateConnector();
    }
    return ACIRealEstateConnector.instance;
  }

  /**
   * Initialize the connector by checking available services
   */
  public async initialize(): Promise<boolean> {
    try {
      // Check if ACI is available and configured
      const response = await axios.get('/api/aci/status');
      
      if (response.data.status === 'success' && response.data.initialized) {
        this.isInitialized = true;
        
        // Get linked accounts
        const linkedAccounts = await this.getLinkedAccounts();
        
        // Register available apps
        if (Array.isArray(linkedAccounts)) {
          linkedAccounts.forEach(account => {
            if (account.app_name) {
              this.connectedApps.add(account.app_name);
            }
          });
        }
        
        logger.info(`ACIRealEstateConnector initialized with ${this.connectedApps.size} connected apps`);
        return true;
      } else {
        logger.warn('ACI is not properly initialized');
        return false;
      }
    } catch (error: any) {
      logger.error(`Failed to initialize ACIRealEstateConnector: ${error.message}`);
      return false;
    }
  }

  /**
   * Get linked accounts from ACI
   */
  private async getLinkedAccounts(): Promise<any[]> {
    try {
      const response = await axios.get('/api/aci/accounts');
      
      if (response.data.status === 'success' && Array.isArray(response.data.accounts)) {
        return response.data.accounts;
      }
      
      return [];
    } catch (error) {
      logger.error('Failed to get linked accounts');
      return [];
    }
  }

  /**
   * Check if an app is connected and available
   */
  public isAppConnected(appName: string): boolean {
    return this.connectedApps.has(appName);
  }

  /**
   * Execute a function from a specific app
   */
  public async executeFunction(
    appName: string,
    functionName: string,
    parameters: Record<string, any>
  ): Promise<any> {
    const cacheKey = this.getCacheKey(appName, functionName, parameters);
    
    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      logger.debug(`Using cached result for ${appName}.${functionName}`);
      return cachedResult;
    }
    
    try {
      const response = await axios.post('/api/aci/execute', {
        app_name: appName,
        function_name: functionName,
        parameters
      });
      
      if (response.data.status === 'success') {
        // Store in cache
        this.addToCache(cacheKey, response.data.result);
        return response.data.result;
      } else {
        throw new Error(`Error executing ${appName}.${functionName}: ${response.data.message}`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      logger.error(`Failed to execute ${appName}.${functionName}: ${errorMessage}`);
      throw new Error(`Failed to execute ${appName}.${functionName}: ${errorMessage}`);
    }
  }

  /**
   * Generate a cache key from function parameters
   */
  private getCacheKey(
    appName: string,
    functionName: string,
    parameters: Record<string, any>
  ): string {
    return `${appName}_${functionName}_${JSON.stringify(parameters)}`;
  }

  /**
   * Get data from cache if valid
   */
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.expiresIn) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Add data to cache
   */
  private addToCache(key: string, data: any, expiresIn: number = this.cacheExpiryDefault): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
    
    // Clean cache if it gets too large (>1000 entries)
    if (this.cache.size > 1000) {
      this.cleanCache();
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.expiresIn) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Link an account with an API key
   */
  public async linkApiKey(appName: string, apiKey: string): Promise<boolean> {
    try {
      const response = await axios.post('/api/aci/link/api-key', {
        app_name: appName,
        api_key: apiKey
      });
      
      if (response.data.status === 'success') {
        this.connectedApps.add(appName);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to link API key for ${appName}`);
      return false;
    }
  }

  /**
   * Get property data from available services
   */
  public async getPropertyData(address: string, parameters: Record<string, any> = {}): Promise<any> {
    // First try PropertyShark if available
    if (this.isAppConnected(RealEstateApp.PROPERTY_SHARK)) {
      try {
        return await this.executeFunction(
          RealEstateApp.PROPERTY_SHARK,
          'PROPERTY_DETAILS',
          { address, ...parameters }
        );
      } catch (error) {
        logger.error(`PropertyShark lookup failed, trying alternative sources`);
        // Continue to try other sources
      }
    }
    
    // Otherwise, use Google Places to get some basic info
    if (this.isAppConnected(RealEstateApp.GOOGLE_PLACES)) {
      try {
        return await this.executeFunction(
          RealEstateApp.GOOGLE_PLACES,
          'SEARCH',
          { query: address, ...parameters }
        );
      } catch (error) {
        logger.error(`Google Places lookup failed`);
        throw new Error(`Failed to get property data for ${address}`);
      }
    }
    
    throw new Error('No compatible property data services available');
  }

  /**
   * Get geographic coordinates for an address
   */
  public async geocodeAddress(address: string): Promise<{ lat: number, lng: number }> {
    if (this.isAppConnected(RealEstateApp.GOOGLE_MAPS)) {
      try {
        const result = await this.executeFunction(
          RealEstateApp.GOOGLE_MAPS,
          'GEOCODE',
          { address }
        );
        
        if (result && result.results && result.results.length > 0) {
          const location = result.results[0].geometry.location;
          return { 
            lat: location.lat, 
            lng: location.lng 
          };
        }
      } catch (error) {
        logger.error(`Geocoding failed for address: ${address}`);
      }
    }
    
    throw new Error(`Failed to geocode address: ${address}`);
  }

  /**
   * Get neighborhood data for a location
   */
  public async getNeighborhoodData(lat: number, lng: number): Promise<any> {
    const results: Record<string, any> = {};
    
    // Get Walk Score if available
    if (this.isAppConnected(RealEstateApp.WALK_SCORE)) {
      try {
        results.walkScore = await this.executeFunction(
          RealEstateApp.WALK_SCORE,
          'GET_SCORE',
          { lat, lng }
        );
      } catch (error) {
        logger.error(`Failed to get Walk Score`);
      }
    }
    
    // Get nearby places
    if (this.isAppConnected(RealEstateApp.GOOGLE_PLACES)) {
      try {
        results.nearbyPlaces = await this.executeFunction(
          RealEstateApp.GOOGLE_PLACES,
          'NEARBY_SEARCH',
          { 
            location: `${lat},${lng}`,
            radius: 1000, // 1km radius
            type: 'restaurant|school|park|shopping_mall'
          }
        );
      } catch (error) {
        logger.error(`Failed to get nearby places`);
      }
    }
    
    // Get census data
    if (this.isAppConnected(RealEstateApp.CENSUS)) {
      try {
        results.censusData = await this.executeFunction(
          RealEstateApp.CENSUS,
          'GET_DATA',
          { lat, lng }
        );
      } catch (error) {
        logger.error(`Failed to get census data`);
      }
    }
    
    return results;
  }

  /**
   * Get climate and weather risk data
   */
  public async getClimateData(lat: number, lng: number): Promise<any> {
    if (this.isAppConnected(RealEstateApp.OPEN_WEATHER_MAP)) {
      try {
        return await this.executeFunction(
          RealEstateApp.OPEN_WEATHER_MAP,
          'ONE_CALL',
          { lat, lng, exclude: 'minutely,hourly' }
        );
      } catch (error) {
        logger.error(`Failed to get climate data`);
        throw new Error(`Failed to get climate data for location (${lat}, ${lng})`);
      }
    }
    
    throw new Error('Weather data service not available');
  }

  /**
   * Get a static map image for a location
   */
  public async getStaticMap(
    lat: number, 
    lng: number, 
    zoom: number = 15, 
    width: number = 600, 
    height: number = 400
  ): Promise<string> {
    if (this.isAppConnected(RealEstateApp.GOOGLE_MAPS)) {
      try {
        const result = await this.executeFunction(
          RealEstateApp.GOOGLE_MAPS,
          'STATIC_MAP',
          { 
            center: `${lat},${lng}`,
            zoom,
            size: `${width}x${height}`,
            maptype: 'roadmap',
            markers: `color:red|${lat},${lng}`
          }
        );
        
        if (result && result.image_url) {
          return result.image_url;
        }
      } catch (error) {
        logger.error(`Failed to get static map`);
      }
    }
    
    throw new Error('Map service not available');
  }
}