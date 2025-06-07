/**
 * TerraGAMA Filter API Routes
 * 
 * High-performance filtering endpoints for 78,472+ Benton County parcels
 * Implements spatial-first filtering with zero tech debt
 */

import { Router } from 'express';
import { spatialFilterService, SpatialFilterContext } from '../services/spatialFilter';
import { z } from 'zod';

const router = Router();

// Validation schemas
const FilterContextSchema = z.object({
  geometry: z.object({
    type: z.literal('Polygon').or(z.literal('MultiPolygon')),
    coordinates: z.array(z.array(z.array(z.number())))
  }).optional(),
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number()
  }).optional(),
  priceRange: z.tuple([z.number(), z.number()]).optional(),
  propertyTypes: z.array(z.string()).optional(),
  zoningMismatch: z.boolean().optional(),
  assessmentRatio: z.tuple([z.number(), z.number()]).optional(),
  anomalies: z.boolean().optional(),
  marketSegment: z.string().optional(),
  livingAreaRange: z.tuple([z.number(), z.number()]).optional(),
  lotSizeRange: z.tuple([z.number(), z.number()]).optional(),
  buildYearRange: z.tuple([z.number(), z.number()]).optional()
});

const MapBoundsSchema = z.object({
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number()
  }),
  zoom: z.number().optional(),
  limit: z.number().min(1).max(10000).default(1000)
});

/**
 * POST /api/terragama/filter
 * Apply comprehensive filtering to Benton County parcels
 */
router.post('/filter', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Validate request body
    const filters = FilterContextSchema.parse(req.body);
    
    console.log('[TerraGAMA] Processing filter request:', Object.keys(filters));
    
    // Apply spatial filtering
    const result = await spatialFilterService.applyFilters(filters);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`[TerraGAMA] Filter completed in ${processingTime}ms: ${result.count} properties`);
    
    res.json({
      success: true,
      data: {
        properties: result.properties,
        statistics: result.stats,
        count: result.count,
        filters: filters,
        performance: {
          processingTimeMs: processingTime,
          propertiesPerSecond: Math.round(result.count / (processingTime / 1000))
        }
      }
    });
    
  } catch (error) {
    console.error('[TerraGAMA] Filter error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid filter parameters',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to apply filters',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/terragama/viewport
 * Get properties within map viewport bounds
 */
router.post('/viewport', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Validate request body
    const { bounds, zoom = 10, limit = 1000 } = MapBoundsSchema.parse(req.body);
    
    console.log('[TerraGAMA] Viewport request:', bounds, 'zoom:', zoom);
    
    // Create spatial filter for viewport
    const filters: SpatialFilterContext = {
      bounds: bounds
    };
    
    // Adjust limit based on zoom level
    const adjustedLimit = Math.min(limit, zoom > 12 ? 2000 : zoom > 10 ? 1000 : 500);
    
    // Apply filtering
    const result = await spatialFilterService.applyFilters(filters);
    
    // Limit results for performance
    const limitedProperties = result.properties.slice(0, adjustedLimit);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`[TerraGAMA] Viewport completed in ${processingTime}ms: ${limitedProperties.length}/${result.count} properties`);
    
    res.json({
      success: true,
      data: {
        properties: limitedProperties,
        totalCount: result.count,
        displayedCount: limitedProperties.length,
        bounds: bounds,
        zoom: zoom,
        performance: {
          processingTimeMs: processingTime,
          propertiesPerSecond: Math.round(limitedProperties.length / (processingTime / 1000))
        }
      }
    });
    
  } catch (error) {
    console.error('[TerraGAMA] Viewport error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid viewport parameters',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to load viewport data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/terragama/suggestions
 * Get AI-powered filter suggestions based on current context
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { count = '0', type = 'all' } = req.query;
    const propertyCount = parseInt(count as string, 10);
    
    console.log(`[TerraGAMA] Generating suggestions for ${propertyCount} properties`);
    
    // Generate contextual suggestions
    const suggestions = generateFilterSuggestions(propertyCount, type as string);
    
    res.json({
      success: true,
      data: {
        suggestions,
        context: {
          propertyCount,
          type
        }
      }
    });
    
  } catch (error) {
    console.error('[TerraGAMA] Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/terragama/quick-filter
 * Apply predefined quick filters
 */
router.post('/quick-filter', async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Filter type is required'
      });
    }
    
    console.log(`[TerraGAMA] Applying quick filter: ${type}`);
    
    // Convert quick filter to spatial filter context
    const filters = convertQuickFilter(type);
    
    // Apply filtering
    const result = await spatialFilterService.applyFilters(filters);
    
    res.json({
      success: true,
      data: {
        properties: result.properties,
        statistics: result.stats,
        count: result.count,
        filterType: type,
        filters: filters
      }
    });
    
  } catch (error) {
    console.error('[TerraGAMA] Quick filter error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply quick filter',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/terragama/stats
 * Get overall dataset statistics for filter context
 */
router.get('/stats', async (req, res) => {
  try {
    console.log('[TerraGAMA] Generating dataset statistics');
    
    // Get base statistics (no filters)
    const result = await spatialFilterService.applyFilters({});
    
    // Calculate additional statistics
    const enhancedStats = {
      ...result.stats,
      datasetInfo: {
        totalParcels: 78472,
        loadedParcels: result.count,
        coverage: `${((result.count / 78472) * 100).toFixed(1)}%`,
        lastUpdate: new Date().toISOString()
      },
      filterRanges: {
        priceRange: {
          min: Math.min(...result.properties.map(p => p.assessedValue).filter(v => v > 0)),
          max: Math.max(...result.properties.map(p => p.assessedValue)),
          median: result.stats.medianAssessedValue
        },
        livingAreaRange: {
          min: Math.min(...result.properties.map(p => p.livingArea).filter(v => v > 0)),
          max: Math.max(...result.properties.map(p => p.livingArea))
        },
        lotSizeRange: {
          min: Math.min(...result.properties.map(p => p.lotSize).filter(v => v > 0)),
          max: Math.max(...result.properties.map(p => p.lotSize))
        }
      }
    };
    
    res.json({
      success: true,
      data: enhancedStats
    });
    
  } catch (error) {
    console.error('[TerraGAMA] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Helper function to generate contextual filter suggestions
 */
function generateFilterSuggestions(propertyCount: number, type: string) {
  const suggestions = [];
  
  if (propertyCount > 10000) {
    suggestions.push({
      type: 'anomalies',
      label: 'Focus on Assessment Anomalies',
      reason: 'Large dataset - narrow down to properties with unusual assessments'
    });
    
    suggestions.push({
      type: 'highValue',
      label: 'High Value Properties Only',
      reason: 'Filter to properties above $500K for detailed analysis'
    });
  }
  
  if (propertyCount > 1000 && propertyCount < 5000) {
    suggestions.push({
      type: 'zoningMismatch',
      label: 'Zoning Opportunities',
      reason: 'Perfect size for zoning analysis - find development potential'
    });
  }
  
  if (propertyCount < 500) {
    suggestions.push({
      type: 'comparable',
      label: 'Find Similar Properties',
      reason: 'Small set - expand to find comparable properties nearby'
    });
  }
  
  // Always suggest spatial refinement
  suggestions.push({
    type: 'spatial',
    label: 'Refine by Area',
    reason: 'Draw on map to focus on specific neighborhoods'
  });
  
  return suggestions;
}

/**
 * Helper function to convert quick filters to spatial filter context
 */
function convertQuickFilter(type: string): SpatialFilterContext {
  switch (type) {
    case 'anomalies':
      return { anomalies: true };
      
    case 'zoningMismatch':
      return { zoningMismatch: true };
      
    case 'highValue':
      return { priceRange: [500000, 10000000] };
      
    case 'residential':
      return { propertyTypes: ['Residential'] };
      
    case 'commercial':
      return { propertyTypes: ['Commercial'] };
      
    case 'undervalued':
      return { assessmentRatio: [0.5, 0.9] };
      
    case 'overvalued':
      return { assessmentRatio: [1.1, 2.0] };
      
    case 'newConstruction':
      return { buildYearRange: [2020, new Date().getFullYear()] };
      
    case 'largeLots':
      return { lotSizeRange: [43560, 1000000] }; // 1+ acres
      
    case 'smallHomes':
      return { livingAreaRange: [0, 1500] };
      
    default:
      return {};
  }
}

export default router;