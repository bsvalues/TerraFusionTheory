import { Request, Response, NextFunction } from 'express';
import { realEstateAnalyticsService } from '../services/real-estate-analytics.service';
import { AppError } from '../errors';
import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../storage';

/**
 * Get market snapshot for a specific area
 */
export const getMarketSnapshot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area = 'Grandview' } = req.query;
    const forceRefresh = req.query.refresh === 'true';
    
    if (!area || typeof area !== 'string') {
      throw new AppError('Area parameter is required', 400, 'VALIDATION_ERROR', true);
    }
    
    const snapshot = await realEstateAnalyticsService.getMarketSnapshot(area, forceRefresh);
    
    res.json({
      success: true,
      data: snapshot
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get property listings with validation and enrichment
 */
export const getPropertyListings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validate = req.query.validate !== 'false';
    const enrich = req.query.enrich !== 'false';
    
    // Parse filter parameters
    const filters: any = {};
    
    // String filters
    ['mlsNumber', 'address', 'city', 'zip', 'propertyType', 'status', 'neighborhood'].forEach(param => {
      if (req.query[param]) {
        filters[param] = req.query[param];
      }
    });
    
    // Numeric range filters
    ['minPrice', 'maxPrice', 'minBeds', 'maxBeds', 'minBaths', 'maxBaths', 
     'minSquareFeet', 'maxSquareFeet', 'yearBuilt', 'minYearBuilt', 'maxYearBuilt'].forEach(param => {
      if (req.query[param]) {
        filters[param] = parseFloat(req.query[param] as string);
      }
    });
    
    // Pagination
    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit as string);
    }
    if (req.query.offset) {
      filters.offset = parseInt(req.query.offset as string);
    }
    
    // Sorting
    if (req.query.sortBy) {
      filters.sortBy = req.query.sortBy;
    }
    if (req.query.sortOrder) {
      filters.sortOrder = req.query.sortOrder as 'asc' | 'desc';
    }
    
    const result = await realEstateAnalyticsService.getPropertyListings(filters, validate, enrich);
    
    res.json({
      success: true,
      data: result.listings,
      total: result.total,
      validationIssues: result.validationIssues
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get geospatial data for property listings
 */
export const getGeoJsonData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse filter parameters (similar to getPropertyListings)
    const filters: any = {};
    
    // Prepare filters based on query params
    Object.keys(req.query).forEach(key => {
      if (key === 'limit' || key === 'offset') {
        filters[key] = parseInt(req.query[key] as string);
      } else if (['minPrice', 'maxPrice', 'minBeds', 'maxBeds', 'minBaths', 'maxBaths', 
                 'minSquareFeet', 'maxSquareFeet', 'yearBuilt'].includes(key)) {
        filters[key] = parseFloat(req.query[key] as string);
      } else {
        filters[key] = req.query[key];
      }
    });
    
    const geoJson = await realEstateAnalyticsService.getGeoJsonData(filters);
    
    res.json(geoJson);
  } catch (error) {
    next(error);
  }
};

/**
 * Get neighborhood trends analysis
 */
export const getNeighborhoodTrends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area = 'Grandview' } = req.params;
    
    const trends = await realEstateAnalyticsService.analyzeNeighborhoodTrends(area);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get market alerts
 */
export const getMarketAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await realEstateAnalyticsService.getMarketAlerts();
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get market prediction
 */
export const getMarketPrediction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area = 'Grandview' } = req.params;
    const daysAhead = req.query.daysAhead ? parseInt(req.query.daysAhead as string) : 90;
    
    const prediction = await realEstateAnalyticsService.predictMarketMetrics(area, daysAhead);
    
    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get property spatial relationships
 */
export const getPropertySpatialRelationships = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area = 'Grandview' } = req.params;
    
    const relationships = await realEstateAnalyticsService.getPropertySpatialRelationships(area);
    
    res.json({
      success: true,
      data: Array.from(relationships.entries()).map(([propertyId, data]) => ({
        propertyId,
        ...data
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get property document
 */
export const getPropertyDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName } = req.params;
    
    if (!fileName) {
      throw new AppError('File name parameter is required', 400, 'VALIDATION_ERROR', true);
    }
    
    const document = await realEstateAnalyticsService.getPropertyDocument(fileName);
    
    if (!document) {
      throw new AppError(`Document not found: ${fileName}`, 404, 'NOT_FOUND', true);
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh all data
 */
export const refreshAllData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Log refresh request
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'Manual data refresh requested',
      details: JSON.stringify({}),
      source: 'analytics-api',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: '/api/analytics/refresh',
      tags: ['refresh', 'manual']
    });
    
    // Start refresh in background
    realEstateAnalyticsService.refreshAllData().catch(error => {
      console.error('Error in background refresh:', error);
    });
    
    res.json({
      success: true,
      message: 'Data refresh initiated'
    });
  } catch (error) {
    next(error);
  }
};