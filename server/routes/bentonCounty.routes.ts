/**
 * Benton County API Routes
 * 
 * Provides endpoints for accessing Benton County GIS data
 * and property information for the GAMA system.
 */

import { Router } from 'express';
import { bentonCountyGIS } from '../services/bentonCountyGIS';

const router = Router();

/**
 * GET /api/benton-county/properties
 * Fetch property data from Benton County GIS
 */
router.get('/properties', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 150;
    const properties = await bentonCountyGIS.fetchParcelData(limit);
    
    res.json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('[BentonCounty API] Error fetching properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/benton-county/health
 * Check API connectivity and status
 */
router.get('/health', async (req, res) => {
  try {
    const hasApiKey = !!process.env.BENTON_COUNTY_ARCGIS_API;
    
    res.json({
      success: true,
      status: 'operational',
      apiKeyConfigured: hasApiKey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;