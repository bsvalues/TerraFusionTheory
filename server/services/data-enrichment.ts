/**
 * Data Enrichment Service
 * 
 * Provides enhancements to property data using external APIs and data sources.
 * Follows IAAO standards for data quality and completeness.
 */

import axios from 'axios';
import { properties, neighborhoods } from '@shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { ValidationSeverity } from '@shared/validation/validation.types';

// Data quality score thresholds
const QUALITY_THRESHOLDS = {
  excellent: 90,
  good: 80,
  average: 70,
  belowAverage: 60,
  poor: 50
};

// Data enrichment providers
export enum EnrichmentProvider {
  RAPID_API = 'rapid_api',
  CENSUS = 'census',
  WEATHER = 'weather',
  ZILLOW = 'zillow',
  ARCGIS = 'arcgis',
  ATTOM = 'attom'
}

// Enrichment types that can be applied to properties
export enum EnrichmentType {
  GEOCODING = 'geocoding',
  SCHOOL_DATA = 'school_data',
  FLOOD_ZONE = 'flood_zone',
  CRIME_DATA = 'crime_data',
  WALKABILITY = 'walkability',
  PROPERTY_FEATURES = 'property_features',
  MARKET_TRENDS = 'market_trends',
  DEMOGRAPHICS = 'demographics',
  SPATIAL_FEATURES = 'spatial_features',
  ENVIRONMENTAL = 'environmental'
}

// Property data enrichment result
export interface EnrichmentResult {
  propertyId: number;
  parcelId: string;
  enrichmentType: EnrichmentType;
  provider: EnrichmentProvider;
  successful: boolean;
  qualityScore: number;
  confidenceScore: number;
  dataPoints: Record<string, any>;
  enrichedFields: string[];
  errorMessage?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

/**
 * Data Enrichment Service for enhancing property data
 */
export class DataEnrichmentService {
  
  private apiKeys: Record<string, string> = {};
  
  constructor() {
    // Initialize API keys from environment variables
    if (process.env.WEATHER_API_KEY) {
      this.apiKeys['weather'] = process.env.WEATHER_API_KEY;
    }
    
    if (process.env.CENSUS_API_KEY) {
      this.apiKeys['census'] = process.env.CENSUS_API_KEY;
    }
    
    if (process.env.ZILLOW_API_KEY) {
      this.apiKeys['zillow'] = process.env.ZILLOW_API_KEY;
    }
    
    if (process.env.RAPID_API_KEY) {
      this.apiKeys['rapid_api'] = process.env.RAPID_API_KEY;
    }
  }
  
  /**
   * Check if geocoding data is missing and needs to be enriched
   */
  async identifyPropertiesNeedingGeocoding() {
    try {
      // Find properties missing lat/long coordinates
      const propertiesNeedingGeocoding = await db.select({
        id: properties.id,
        parcelId: properties.parcelId,
        address: properties.address,
        city: properties.city,
        state: properties.state,
        zipCode: properties.zipCode
      })
      .from(properties)
      .where(eq(properties.latitude, null) || eq(properties.longitude, null));
      
      return propertiesNeedingGeocoding;
    } catch (error) {
      console.error('Error identifying properties needing geocoding:', error);
      return [];
    }
  }
  
  /**
   * Geocode a property address to get latitude and longitude
   */
  async geocodeProperty(propertyId: number, address: string, city: string, state: string, zipCode: string): Promise<EnrichmentResult> {
    // Initialize result structure
    const result: EnrichmentResult = {
      propertyId,
      parcelId: '',
      enrichmentType: EnrichmentType.GEOCODING,
      provider: EnrichmentProvider.RAPID_API,
      successful: false,
      qualityScore: 0,
      confidenceScore: 0,
      dataPoints: {},
      enrichedFields: [],
      metadata: {},
      timestamp: new Date()
    };
    
    try {
      // Ensure we have a Rapid API key
      if (!this.apiKeys['rapid_api']) {
        throw new Error('Missing Rapid API key for geocoding');
      }
      
      // Get the property's parcel ID
      const propertyRecord = await db.select({
        parcelId: properties.parcelId
      })
      .from(properties)
      .where(eq(properties.id, propertyId));
      
      if (propertyRecord.length === 0) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }
      
      result.parcelId = propertyRecord[0].parcelId;
      
      // Format the address for geocoding
      const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
      
      // Call the geocoding API (using Rapid API's US Street Address API)
      const response = await axios({
        method: 'GET',
        url: 'https://us-street-address.p.rapidapi.com/geocode',
        params: {
          address: fullAddress
        },
        headers: {
          'X-RapidAPI-Key': this.apiKeys['rapid_api'],
          'X-RapidAPI-Host': 'us-street-address.p.rapidapi.com'
        }
      });
      
      // Check if we got a valid response
      if (response.data && response.data.results && response.data.results.length > 0) {
        const geocodeData = response.data.results[0];
        
        // Extract latitude and longitude
        const latitude = geocodeData.latitude || geocodeData.lat;
        const longitude = geocodeData.longitude || geocodeData.lng;
        
        if (latitude && longitude) {
          // Update the property record with the geocoding data
          await db.update(properties)
            .set({
              latitude,
              longitude,
              metadata: {
                ...propertyRecord[0],
                geocoding: {
                  provider: EnrichmentProvider.RAPID_API,
                  timestamp: new Date().toISOString(),
                  confidence: geocodeData.confidence || 0.8,
                  source: 'us-street-address.p.rapidapi.com'
                }
              }
            })
            .where(eq(properties.id, propertyId));
          
          // Set result data
          result.successful = true;
          result.qualityScore = this.calculateQualityScore(geocodeData);
          result.confidenceScore = geocodeData.confidence || 0.8;
          result.dataPoints = {
            latitude,
            longitude,
            formattedAddress: geocodeData.formattedAddress || fullAddress,
            accuracy: geocodeData.accuracy || 'rooftop'
          };
          result.enrichedFields = ['latitude', 'longitude', 'metadata'];
        } else {
          throw new Error('Geocoding API returned no coordinates');
        }
      } else {
        throw new Error('Geocoding API returned no results');
      }
    } catch (error) {
      console.error(`Error geocoding property ${propertyId}:`, error);
      result.successful = false;
      result.errorMessage = error.message || 'Unknown geocoding error';
      result.metadata = {
        error: true,
        errorType: error.name,
        errorDetails: error.response?.data || error.message
      };
    }
    
    return result;
  }
  
  /**
   * Calculate quality score for geocoded data
   */
  private calculateQualityScore(geocodeData: any): number {
    // Start with base score
    let score = 70;
    
    // Add points for high confidence
    if (geocodeData.confidence) {
      score += geocodeData.confidence * 20;
    }
    
    // Add points for high accuracy
    if (geocodeData.accuracy) {
      const accuracy = typeof geocodeData.accuracy === 'string' 
        ? geocodeData.accuracy.toLowerCase() 
        : '';
      
      if (accuracy === 'rooftop') {
        score += 15;
      } else if (accuracy === 'parcel') {
        score += 12;
      } else if (accuracy === 'street') {
        score += 8;
      }
    }
    
    // Cap the score at 100
    return Math.min(Math.round(score), 100);
  }
  
  /**
   * Enrich a property with flood zone data
   */
  async enrichFloodZoneData(propertyId: number): Promise<EnrichmentResult> {
    // Initialize result structure
    const result: EnrichmentResult = {
      propertyId,
      parcelId: '',
      enrichmentType: EnrichmentType.FLOOD_ZONE,
      provider: EnrichmentProvider.RAPID_API,
      successful: false,
      qualityScore: 0,
      confidenceScore: 0,
      dataPoints: {},
      enrichedFields: [],
      metadata: {},
      timestamp: new Date()
    };
    
    try {
      // Get the property data including coordinates
      const propertyRecord = await db.select({
        parcelId: properties.parcelId,
        latitude: properties.latitude,
        longitude: properties.longitude
      })
      .from(properties)
      .where(eq(properties.id, propertyId));
      
      if (propertyRecord.length === 0) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }
      
      const property = propertyRecord[0];
      result.parcelId = property.parcelId;
      
      // Check if we have coordinates
      if (!property.latitude || !property.longitude) {
        throw new Error('Property missing coordinates, geocoding required first');
      }
      
      // Call the flood zone API (example - this would be replaced with actual API)
      const response = await axios({
        method: 'GET',
        url: 'https://flood-zone-data.p.rapidapi.com/v1/floodzone',
        params: {
          latitude: property.latitude,
          longitude: property.longitude
        },
        headers: {
          'X-RapidAPI-Key': this.apiKeys['rapid_api'],
          'X-RapidAPI-Host': 'flood-zone-data.p.rapidapi.com'
        }
      });
      
      // Process the response
      if (response.data && response.data.floodZone) {
        const floodData = response.data;
        
        // Update the property with flood zone data
        await db.update(properties)
          .set({
            floodZone: floodData.floodZone,
            metadata: {
              ...property,
              floodZone: {
                provider: EnrichmentProvider.RAPID_API,
                timestamp: new Date().toISOString(),
                femaFloodZone: floodData.floodZone,
                baseFloodElevation: floodData.baseFloodElevation,
                floodRisk: floodData.riskLevel,
                lastFemaUpdate: floodData.lastUpdated
              }
            }
          })
          .where(eq(properties.id, propertyId));
        
        // Set result data
        result.successful = true;
        result.qualityScore = 85; // High quality from FEMA data
        result.confidenceScore = 0.9;
        result.dataPoints = {
          floodZone: floodData.floodZone,
          riskLevel: floodData.riskLevel,
          baseFloodElevation: floodData.baseFloodElevation
        };
        result.enrichedFields = ['floodZone', 'metadata'];
      } else {
        throw new Error('Flood zone API returned no results');
      }
    } catch (error) {
      console.error(`Error enriching flood zone data for property ${propertyId}:`, error);
      result.successful = false;
      result.errorMessage = error.message || 'Unknown flood zone enrichment error';
      result.metadata = {
        error: true,
        errorType: error.name,
        errorDetails: error.response?.data || error.message
      };
    }
    
    return result;
  }
  
  /**
   * Update neighborhood statistics based on property data
   */
  async updateNeighborhoodStatistics(neighborhoodCode: string): Promise<void> {
    try {
      // Get all properties in this neighborhood
      const neighborhoodProperties = await db.select()
        .from(properties)
        .where(eq(properties.neighborhoodCode, neighborhoodCode));
        
      if (neighborhoodProperties.length === 0) {
        console.warn(`No properties found for neighborhood ${neighborhoodCode}`);
        return;
      }
      
      // Calculate neighborhood statistics
      const totalProperties = neighborhoodProperties.length;
      
      // Calculate average year built (excluding null/undefined values)
      const validYearBuiltProps = neighborhoodProperties.filter(p => p.yearBuilt);
      const avgYearBuilt = validYearBuiltProps.length > 0
        ? validYearBuiltProps.reduce((sum, p) => sum + p.yearBuilt, 0) / validYearBuiltProps.length
        : null;
      
      // Calculate average home value (excluding null/undefined values)
      const validValueProps = neighborhoodProperties.filter(p => p.marketValue);
      const avgHomeValue = validValueProps.length > 0
        ? validValueProps.reduce((sum, p) => sum + Number(p.marketValue), 0) / validValueProps.length
        : null;
      
      // Get median home value (excluding null/undefined values)
      const sortedValues = validValueProps
        .map(p => Number(p.marketValue))
        .sort((a, b) => a - b);
      
      const medianHomeValue = sortedValues.length > 0
        ? sortedValues.length % 2 === 0
          ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
          : sortedValues[Math.floor(sortedValues.length / 2)]
        : null;
      
      // Update the neighborhood record
      await db.update(neighborhoods)
        .set({
          totalProperties,
          avgYearBuilt,
          avgHomeValue,
          medianHomeValue,
          updatedAt: new Date()
        })
        .where(eq(neighborhoods.code, neighborhoodCode));
        
      console.log(`Updated statistics for neighborhood ${neighborhoodCode}`);
    } catch (error) {
      console.error(`Error updating neighborhood statistics for ${neighborhoodCode}:`, error);
    }
  }
  
  /**
   * Batch geocode properties missing coordinates
   */
  async batchGeocodeProperties(limit: number = 10): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];
    
    try {
      // Find properties missing coordinates
      const propertiesNeedingGeocoding = await this.identifyPropertiesNeedingGeocoding();
      
      // Limit the number of properties to process
      const propertiesToProcess = propertiesNeedingGeocoding.slice(0, limit);
      
      console.log(`Geocoding ${propertiesToProcess.length} properties`);
      
      // Process each property
      for (const property of propertiesToProcess) {
        const result = await this.geocodeProperty(
          property.id,
          property.address,
          property.city,
          property.state,
          property.zipCode
        );
        
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error in batch geocoding:', error);
      return results;
    }
  }
  
  /**
   * Generate a data quality report for a property
   */
  async generatePropertyQualityReport(propertyId: number): Promise<{
    propertyId: number;
    overallScore: number;
    qualityLevel: string;
    missingFields: string[];
    criticalIssues: string[];
    recommendations: string[];
    lastUpdated: Date;
    fieldScores: Record<string, number>;
  }> {
    try {
      // Get the property data
      const propertyRecord = await db.select()
        .from(properties)
        .where(eq(properties.id, propertyId));
      
      if (propertyRecord.length === 0) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }
      
      const property = propertyRecord[0];
      
      // Initialize the report
      const report = {
        propertyId,
        overallScore: 0,
        qualityLevel: '',
        missingFields: [],
        criticalIssues: [],
        recommendations: [],
        lastUpdated: new Date(),
        fieldScores: {}
      };
      
      // Check for missing fields
      const requiredFields = [
        'parcelId', 'address', 'city', 'state', 'zipCode', 'county',
        'propertyType', 'yearBuilt', 'buildingArea', 'lotSize'
      ];
      
      // Evaluate each required field
      requiredFields.forEach(field => {
        if (!property[field]) {
          report.missingFields.push(field);
          
          if (['parcelId', 'address', 'city', 'state', 'zipCode', 'county'].includes(field)) {
            report.criticalIssues.push(`Missing ${field} is critical for property identification`);
          }
        }
      });
      
      // Check for geospatial data
      if (!property.latitude || !property.longitude) {
        report.missingFields.push('coordinates');
        report.recommendations.push('Geocode property to obtain coordinates');
      }
      
      // Calculate field scores
      const scoreFieldGroups = {
        identification: ['parcelId', 'address', 'city', 'state', 'zipCode', 'county'],
        physical: ['yearBuilt', 'buildingArea', 'lotSize', 'bedrooms', 'bathrooms', 'stories'],
        valuation: ['assessedValue', 'marketValue', 'taxableValue', 'lastSalePrice', 'lastSaleDate'],
        geospatial: ['latitude', 'longitude', 'parcelGeometry', 'neighborhood', 'neighborhoodCode'],
        features: ['condition', 'quality', 'heatingType', 'coolingType', 'basement', 'garageType']
      };
      
      // Calculate scores for each field group
      let totalScore = 0;
      let fieldsEvaluated = 0;
      
      for (const [group, fields] of Object.entries(scoreFieldGroups)) {
        let groupScore = 0;
        let fieldsPresent = 0;
        
        fields.forEach(field => {
          const value = property[field];
          let fieldScore = 0;
          
          if (value !== undefined && value !== null && value !== '') {
            fieldScore = 100;
            fieldsPresent++;
          }
          
          report.fieldScores[field] = fieldScore;
        });
        
        // Calculate group score
        groupScore = fieldsPresent / fields.length * 100;
        report.fieldScores[`${group}Group`] = Math.round(groupScore);
        
        totalScore += groupScore;
        fieldsEvaluated++;
      }
      
      // Calculate overall score
      report.overallScore = Math.round(totalScore / fieldsEvaluated);
      
      // Determine quality level
      if (report.overallScore >= QUALITY_THRESHOLDS.excellent) {
        report.qualityLevel = 'Excellent';
      } else if (report.overallScore >= QUALITY_THRESHOLDS.good) {
        report.qualityLevel = 'Good';
      } else if (report.overallScore >= QUALITY_THRESHOLDS.average) {
        report.qualityLevel = 'Average';
      } else if (report.overallScore >= QUALITY_THRESHOLDS.belowAverage) {
        report.qualityLevel = 'Below Average';
      } else {
        report.qualityLevel = 'Poor';
      }
      
      // Add recommendations based on missing data
      if (report.missingFields.includes('coordinates')) {
        report.recommendations.push('Geocode property to add latitude/longitude coordinates');
      }
      
      if (report.fieldScores.valuationGroup < 60) {
        report.recommendations.push('Enhance valuation data with recent assessments or sales');
      }
      
      if (report.fieldScores.physicalGroup < 60) {
        report.recommendations.push('Add missing physical characteristics data');
      }
      
      return report;
    } catch (error) {
      console.error(`Error generating quality report for property ${propertyId}:`, error);
      throw error;
    }
  }
}

export const dataEnrichmentService = new DataEnrichmentService();