/**
 * ACI Property Routes
 * 
 * Provides API endpoints for retrieving property data from external sources using ACI integration.
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ACIRealEstateConnector } from '../services/connectors/aci-real-estate.connector';
import { OptimizedLogger } from '../services/optimized-logging';
import { LogCategory } from '../../shared/schema';

const router = Router();
const logger = OptimizedLogger.getInstance();
const connector = ACIRealEstateConnector.getInstance();

/**
 * @route GET /api/aci/property
 * @description Get property data by address
 */
router.get('/property', asyncHandler(async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({
      status: 'error',
      message: 'Address is required'
    });
  }
  
  try {
    // Initialize the connector if not already done
    if (!(await connector.initialize())) {
      return res.status(500).json({
        status: 'error',
        message: 'ACI Real Estate Connector is not properly initialized'
      });
    }
    
    // Get property data
    const propertyData = await connector.getPropertyData(address.toString());
    
    res.json({
      status: 'success',
      data: propertyData
    });
  } catch (error: any) {
    logger.error(`Error getting property data: ${error.message}`, LogCategory.API);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get property data',
      error: error.message
    });
  }
}));

/**
 * @route GET /api/aci/neighborhood
 * @description Get neighborhood data by coordinates
 */
router.get('/neighborhood', asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      status: 'error',
      message: 'Latitude and longitude are required'
    });
  }
  
  try {
    // Initialize the connector if not already done
    if (!(await connector.initialize())) {
      return res.status(500).json({
        status: 'error',
        message: 'ACI Real Estate Connector is not properly initialized'
      });
    }
    
    // Get neighborhood data
    const neighborhoodData = await connector.getNeighborhoodData(
      parseFloat(lat.toString()),
      parseFloat(lng.toString())
    );
    
    res.json({
      status: 'success',
      data: neighborhoodData
    });
  } catch (error: any) {
    logger.error(`Error getting neighborhood data: ${error.message}`, LogCategory.API);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get neighborhood data',
      error: error.message
    });
  }
}));

/**
 * @route GET /api/aci/climate
 * @description Get climate data by coordinates
 */
router.get('/climate', asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      status: 'error',
      message: 'Latitude and longitude are required'
    });
  }
  
  try {
    // Initialize the connector if not already done
    if (!(await connector.initialize())) {
      return res.status(500).json({
        status: 'error',
        message: 'ACI Real Estate Connector is not properly initialized'
      });
    }
    
    // Get climate data
    const climateData = await connector.getClimateData(
      parseFloat(lat.toString()),
      parseFloat(lng.toString())
    );
    
    res.json({
      status: 'success',
      data: climateData
    });
  } catch (error: any) {
    logger.error(`Error getting climate data: ${error.message}`, LogCategory.API);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get climate data',
      error: error.message
    });
  }
}));

/**
 * @route GET /api/aci/map
 * @description Get static map image by coordinates
 */
router.get('/map', asyncHandler(async (req, res) => {
  const { lat, lng, zoom = "15", width = "600", height = "400" } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      status: 'error',
      message: 'Latitude and longitude are required'
    });
  }
  
  try {
    // Initialize the connector if not already done
    if (!(await connector.initialize())) {
      return res.status(500).json({
        status: 'error',
        message: 'ACI Real Estate Connector is not properly initialized'
      });
    }
    
    // Get static map
    const imageUrl = await connector.getStaticMap(
      parseFloat(lat.toString()),
      parseFloat(lng.toString()),
      parseInt(zoom.toString()),
      parseInt(width.toString()),
      parseInt(height.toString())
    );
    
    res.json({
      status: 'success',
      image_url: imageUrl
    });
  } catch (error: any) {
    logger.error(`Error getting static map: ${error.message}`, LogCategory.API);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get map image',
      error: error.message
    });
  }
}));

/**
 * @route GET /api/aci/geocode
 * @description Geocode an address
 */
router.get('/geocode', asyncHandler(async (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({
      status: 'error',
      message: 'Address is required'
    });
  }
  
  try {
    // Initialize the connector if not already done
    if (!(await connector.initialize())) {
      return res.status(500).json({
        status: 'error',
        message: 'ACI Real Estate Connector is not properly initialized'
      });
    }
    
    // Geocode the address
    const coordinates = await connector.geocodeAddress(address.toString());
    
    res.json({
      status: 'success',
      coordinates
    });
  } catch (error: any) {
    logger.error(`Error geocoding address: ${error.message}`, LogCategory.API);
    res.status(500).json({
      status: 'error',
      message: 'Failed to geocode address',
      error: error.message
    });
  }
}));

export const aciPropertyRoutes = router;