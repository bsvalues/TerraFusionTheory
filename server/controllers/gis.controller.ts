import { Request, Response } from 'express';
import { z } from 'zod';
import { connectorFactory } from '../services/connectors/connector.factory';
import { GISConnector } from '../services/connectors/gis.connector';
import { geospatialEnricher } from '../services/enrichment/geospatial.enricher';
import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../storage';

// Validation schema for geocoding request
const geocodeRequestSchema = z.object({
  address: z.string().min(1, "Address is required")
});

/**
 * Test the geocoding functionality
 */
export async function geocodeAddress(req: Request, res: Response) {
  try {
    // Start timing for performance tracking
    const startTime = Date.now();

    // Validate request
    const validatedData = geocodeRequestSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: validatedData.error.format()
      });
    }

    const { address } = validatedData.data;

    // Get GIS connector
    const gisConnector = connectorFactory.getConnectorsByType('gis')[0] as GISConnector;
    if (!gisConnector) {
      return res.status(500).json({
        success: false,
        error: "No GIS connector available"
      });
    }

    // Try to geocode the address
    const geocodeResult = await gisConnector.geocodeAddress(address);
    
    // Process the result
    if (!geocodeResult.features || geocodeResult.features.length === 0) {
      // Log the attempt
      await storage.createLog({
        level: LogLevel.WARNING,
        category: LogCategory.API,
        message: `Geocoding failed for address: ${address}`,
        details: JSON.stringify({ address }),
        source: 'gis-controller',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: Date.now() - startTime,
        statusCode: 404,
        endpoint: '/api/gis/geocode',
        tags: ['geocoding', 'error']
      });

      return res.status(404).json({
        success: false,
        error: "Address not found",
        address
      });
    }

    // Extract data from the feature
    const feature = geocodeResult.features[0];
    const coords = feature.geometry.coordinates;
    const props = feature.properties;

    // Calculate confidence score (default to 0.8 if none in properties)
    const confidence = typeof props.score === 'number' ? props.score / 100 : 
                     (typeof props.confidence === 'number' ? props.confidence : 0.8);

    // Format the result
    const result = {
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

    // Log the successful geocoding
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: `Successfully geocoded address: ${address}`,
      details: JSON.stringify({ address, result }),
      source: 'gis-controller',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: Date.now() - startTime,
      statusCode: 200,
      endpoint: '/api/gis/geocode',
      tags: ['geocoding', 'success']
    });

    // Return the result
    return res.status(200).json({
      success: true,
      result,
      duration: Date.now() - startTime
    });
  } catch (error) {
    console.error('Error in geocodeAddress:', error);
    
    // Log the error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: `Geocoding error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        address: req.body?.address,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error
      }),
      source: 'gis-controller',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: 500,
      endpoint: '/api/gis/geocode',
      tags: ['geocoding', 'error']
    });

    return res.status(500).json({
      success: false,
      error: "Failed to geocode address",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get GeoJSON data for a specific area
 */
export async function getGeoJSONData(req: Request, res: Response) {
  try {
    // This is a placeholder for future GeoJSON data fetching functionality
    return res.status(200).json({
      success: true,
      message: "This endpoint is under development"
    });
  } catch (error) {
    console.error('Error in getGeoJSONData:', error);
    return res.status(500).json({
      success: false,
      error: "Failed to get GeoJSON data",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}