import { Request, Response, NextFunction } from 'express';
import { realEstateAnalyticsService } from '../services/real-estate-analytics.service';
import { AppError } from '../errors';
import { storage } from '../storage';
import { LogCategory, LogLevel } from '../../shared/schema';

/**
 * Market controller for handling market data API requests
 */
export class MarketController {
  /**
   * Get market snapshot for a specific area
   */
  getMarketSnapshot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { area = 'Grandview' } = req.query;
      const forceRefresh = req.query.refresh === 'true';
      
      if (!area || typeof area !== 'string') {
        throw new AppError('Area parameter is required', 400, 'VALIDATION_ERROR', true);
      }
      
      // Log the request
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.API,
        message: `Market snapshot requested for ${area}`,
        details: JSON.stringify({
          area,
          forceRefresh,
          userId: req.session.user?.id || null
        }),
        source: 'market-controller',
        projectId: null,
        userId: req.session.user?.id || null,
        sessionId: req.sessionID || null,
        duration: null,
        statusCode: null,
        endpoint: req.originalUrl,
        tags: ['market-snapshot', area]
      });
      
      const snapshot = await realEstateAnalyticsService.getMarketSnapshot(area, forceRefresh);
      
      res.json({
        success: true,
        data: snapshot
      });
    } catch (error) {
      // Log the error
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.API,
        message: `Error getting market snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          params: req.query
        }),
        source: 'market-controller',
        projectId: null,
        userId: req.session.user?.id || null,
        sessionId: req.sessionID || null,
        duration: null,
        statusCode: error instanceof AppError ? error.statusCode : 500,
        endpoint: req.originalUrl,
        tags: ['market-snapshot', 'error']
      });
      
      next(error);
    }
  }

  /**
   * Predict market metrics for a specific area and time horizon
   */
  predictMarketMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { area = 'Grandview' } = req.query;
      const daysAhead = parseInt(req.query.daysAhead as string || '90');
      
      if (!area || typeof area !== 'string') {
        throw new AppError('Area parameter is required', 400, 'VALIDATION_ERROR', true);
      }
      
      if (isNaN(daysAhead) || daysAhead < 1 || daysAhead > 365) {
        throw new AppError('daysAhead must be a number between 1 and 365', 400, 'VALIDATION_ERROR', true);
      }
      
      // Log the request
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.API,
        message: `Market prediction requested for ${area} (${daysAhead} days ahead)`,
        details: JSON.stringify({
          area,
          daysAhead,
          userId: req.session.user?.id || null
        }),
        source: 'market-controller',
        projectId: null,
        userId: req.session.user?.id || null,
        sessionId: req.sessionID || null,
        duration: null,
        statusCode: null,
        endpoint: req.originalUrl,
        tags: ['market-prediction', area]
      });
      
      const prediction = await realEstateAnalyticsService.predictMarketMetrics(area, daysAhead);
      
      res.json({
        success: true,
        data: prediction
      });
    } catch (error) {
      // Log the error
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.API,
        message: `Error predicting market metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error,
          params: req.query
        }),
        source: 'market-controller',
        projectId: null,
        userId: req.session.user?.id || null,
        sessionId: req.sessionID || null,
        duration: null,
        statusCode: error instanceof AppError ? error.statusCode : 500,
        endpoint: req.originalUrl,
        tags: ['market-prediction', 'error']
      });
      
      next(error);
    }
  }

  /**
   * Get market alerts
   */
  getMarketAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alerts = await realEstateAnalyticsService.getMarketAlerts();
      
      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyze neighborhood trends for a specific area
   */
  analyzeNeighborhoodTrends = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { area = 'Grandview' } = req.query;
      
      if (!area || typeof area !== 'string') {
        throw new AppError('Area parameter is required', 400, 'VALIDATION_ERROR', true);
      }
      
      const trends = await realEstateAnalyticsService.analyzeNeighborhoodTrends(area);
      
      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get property spatial relationships
   */
  getPropertySpatialRelationships = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { area = 'Grandview' } = req.query;
      
      if (!area || typeof area !== 'string') {
        throw new AppError('Area parameter is required', 400, 'VALIDATION_ERROR', true);
      }
      
      const relationships = await realEstateAnalyticsService.getPropertySpatialRelationships(area);
      
      res.json({
        success: true,
        data: relationships
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed market analysis with ML predictions
   */
  getDetailedMarketAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { area = 'Grandview', timeframe = '90' } = req.query;
      const daysAhead = parseInt(timeframe as string);
      
      if (!area || typeof area !== 'string') {
        throw new AppError('Area parameter is required', 400, 'VALIDATION_ERROR', true);
      }

      const analysis = await realEstateAnalyticsService.getDetailedMarketAnalysis(area, daysAhead);
      
      res.json({
        success: true,
        data: analysis,
        metadata: {
          generatedAt: new Date().toISOString(),
          modelVersion: analysis.modelVersion,
          confidenceScore: analysis.confidenceScore
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get market comparison across multiple areas
   */
  getMarketComparison = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { areas } = req.query;
      
      if (!areas) {
        throw new AppError('Areas parameter is required', 400, 'VALIDATION_ERROR', true);
      }

      const areaList = (areas as string).split(',');
      const comparison = await realEstateAnalyticsService.getMarketComparison(areaList);
      
      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get investment opportunity score
   */
  getInvestmentScore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId } = req.params;
      const { analysisType = 'comprehensive' } = req.query;
      
      if (!propertyId) {
        throw new AppError('Property ID is required', 400, 'VALIDATION_ERROR', true);
      }

      const score = await realEstateAnalyticsService.calculateInvestmentScore(propertyId, analysisType as string);
      
      res.json({
        success: true,
        data: score
      });
    } catch (error) {
      next(error);
    }
  }
}

export const marketController = new MarketController();