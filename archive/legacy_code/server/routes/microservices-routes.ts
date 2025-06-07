/**
 * Microservices Routes
 * 
 * This file sets up Express routes that proxy to the FastAPI microservices,
 * providing a unified API for the frontend.
 */

import express, { Express, Request, Response, Router } from 'express';
import microserviceClients from '../services/microservices-client';
import { AppError, handleError } from '../errors';
import { LogCategory, LogLevel } from '../../shared/schema';

// Create a router for the microservices API
const router = Router();

/**
 * Property Service Routes
 */
router.get('/api/properties', async (req: Request, res: Response) => {
  try {
    const properties = await microserviceClients.propertyService.getProperties(req.query);
    res.json(properties);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch properties');
  }
});

router.get('/api/properties/:id', async (req: Request, res: Response) => {
  try {
    const property = await microserviceClients.propertyService.getProperty(Number(req.params.id));
    res.json(property);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch property');
  }
});

router.get('/api/properties/:id/valuations', async (req: Request, res: Response) => {
  try {
    const valuations = await microserviceClients.propertyService.getPropertyValuations(Number(req.params.id));
    res.json(valuations);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch property valuations');
  }
});

router.post('/api/properties', async (req: Request, res: Response) => {
  try {
    const property = await microserviceClients.propertyService.createProperty(req.body);
    res.status(201).json(property);
  } catch (error) {
    handleApiError(error, res, 'Failed to create property');
  }
});

router.post('/api/valuations', async (req: Request, res: Response) => {
  try {
    const valuation = await microserviceClients.propertyService.createValuation(req.body);
    res.status(201).json(valuation);
  } catch (error) {
    handleApiError(error, res, 'Failed to create valuation');
  }
});

router.get('/api/market-summary', async (req: Request, res: Response) => {
  try {
    const summary = await microserviceClients.propertyService.getMarketSummary(req.query);
    res.json(summary);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch market summary');
  }
});

/**
 * Market Service Routes
 */
router.get('/api/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await microserviceClients.marketService.getMetrics(req.query);
    res.json(metrics);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch metrics');
  }
});

router.get('/api/metrics/:id', async (req: Request, res: Response) => {
  try {
    const metric = await microserviceClients.marketService.getMetricById(Number(req.params.id));
    res.json(metric);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch metric');
  }
});

router.post('/api/metrics', async (req: Request, res: Response) => {
  try {
    const metric = await microserviceClients.marketService.createMetric(req.body);
    res.status(201).json(metric);
  } catch (error) {
    handleApiError(error, res, 'Failed to create metric');
  }
});

router.get('/api/predictions', async (req: Request, res: Response) => {
  try {
    const predictions = await microserviceClients.marketService.getPredictions(req.query);
    res.json(predictions);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch predictions');
  }
});

router.post('/api/predictions', async (req: Request, res: Response) => {
  try {
    const prediction = await microserviceClients.marketService.createPrediction(req.body);
    res.status(201).json(prediction);
  } catch (error) {
    handleApiError(error, res, 'Failed to create prediction');
  }
});

router.get('/api/trends/:metric', async (req: Request, res: Response) => {
  try {
    const trend = await microserviceClients.marketService.getTrend(req.params.metric, req.query);
    res.json(trend);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch trend');
  }
});

router.get('/api/market-overview/:area_type/:area_value', async (req: Request, res: Response) => {
  try {
    const overview = await microserviceClients.marketService.getMarketOverview(
      req.params.area_type, 
      req.params.area_value
    );
    res.json(overview);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch market overview');
  }
});

/**
 * Spatial Service Routes
 */
router.get('/api/spatial-data', async (req: Request, res: Response) => {
  try {
    const spatialData = await microserviceClients.spatialService.getSpatialData(req.query);
    res.json(spatialData);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch spatial data');
  }
});

router.get('/api/spatial-data/:id', async (req: Request, res: Response) => {
  try {
    const spatialData = await microserviceClients.spatialService.getSpatialDataById(Number(req.params.id));
    res.json(spatialData);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch spatial data');
  }
});

router.post('/api/spatial-data', async (req: Request, res: Response) => {
  try {
    const spatialData = await microserviceClients.spatialService.createSpatialData(req.body);
    res.status(201).json(spatialData);
  } catch (error) {
    handleApiError(error, res, 'Failed to create spatial data');
  }
});

router.get('/api/properties-geojson', async (req: Request, res: Response) => {
  try {
    const geoJSON = await microserviceClients.spatialService.getPropertiesGeoJSON(req.query);
    res.json(geoJSON);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch properties as GeoJSON');
  }
});

router.post('/api/proximity-search', async (req: Request, res: Response) => {
  try {
    const results = await microserviceClients.spatialService.proximitySearch(req.body);
    res.json(results);
  } catch (error) {
    handleApiError(error, res, 'Failed to perform proximity search');
  }
});

router.post('/api/geocode', async (req: Request, res: Response) => {
  try {
    const geocode = await microserviceClients.spatialService.geocodeAddress(req.body);
    res.json(geocode);
  } catch (error) {
    handleApiError(error, res, 'Failed to geocode address');
  }
});

router.get('/api/neighborhoods', async (req: Request, res: Response) => {
  try {
    const neighborhoods = await microserviceClients.spatialService.getNeighborhoods(req.query);
    res.json(neighborhoods);
  } catch (error) {
    handleApiError(error, res, 'Failed to fetch neighborhoods');
  }
});

/**
 * Analytics Service Routes
 */
router.post('/api/predict-property-value', async (req: Request, res: Response) => {
  try {
    const prediction = await microserviceClients.analyticsService.predictPropertyValue(req.body);
    res.json(prediction);
  } catch (error) {
    handleApiError(error, res, 'Failed to predict property value');
  }
});

router.post('/api/predict-market-trend', async (req: Request, res: Response) => {
  try {
    const prediction = await microserviceClients.analyticsService.predictMarketTrend(req.body);
    res.json(prediction);
  } catch (error) {
    handleApiError(error, res, 'Failed to predict market trend');
  }
});

router.post('/api/train-model', async (req: Request, res: Response) => {
  try {
    const job = await microserviceClients.analyticsService.trainModel(req.body);
    res.json(job);
  } catch (error) {
    handleApiError(error, res, 'Failed to start model training');
  }
});

router.get('/api/training-status/:jobId', async (req: Request, res: Response) => {
  try {
    const status = await microserviceClients.analyticsService.getTrainingStatus(req.params.jobId);
    res.json(status);
  } catch (error) {
    handleApiError(error, res, 'Failed to get training status');
  }
});

router.post('/api/find-hotspots', async (req: Request, res: Response) => {
  try {
    const hotspots = await microserviceClients.analyticsService.findHotspots(req.body);
    res.json(hotspots);
  } catch (error) {
    handleApiError(error, res, 'Failed to find hotspots');
  }
});

router.post('/api/analyze-investment', async (req: Request, res: Response) => {
  try {
    const analysis = await microserviceClients.analyticsService.analyzeInvestment(req.body);
    res.json(analysis);
  } catch (error) {
    handleApiError(error, res, 'Failed to analyze investment');
  }
});

/**
 * Health Check Routes for Microservices
 */
router.get('/api/microservices/health', async (req: Request, res: Response) => {
  try {
    const results = {
      property: await microserviceClients.propertyService.checkHealth(),
      market: await microserviceClients.marketService.checkHealth(),
      spatial: await microserviceClients.spatialService.checkHealth(),
      analytics: await microserviceClients.analyticsService.checkHealth()
    };
    
    // Count how many services are healthy
    const healthyCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    // If all services are healthy, return 200 OK
    if (healthyCount === totalCount) {
      res.json({
        status: 'healthy',
        services: results
      });
    }
    // If some services are healthy, return 207 Multi-Status
    else if (healthyCount > 0) {
      res.status(207).json({
        status: 'degraded',
        services: results,
        message: `${healthyCount}/${totalCount} services are healthy`
      });
    }
    // If no services are healthy, return 503 Service Unavailable
    else {
      res.status(503).json({
        status: 'unhealthy',
        services: results,
        message: 'All microservices are unreachable'
      });
    }
  } catch (error) {
    handleApiError(error, res, 'Failed to check microservices health');
  }
});

/**
 * Helper function to handle API errors consistently
 */
function handleApiError(error: any, res: Response, defaultMessage: string): void {
  console.error('API Error:', error);
  
  const statusCode = error.response?.status || 500;
  const errorMessage = error.response?.data?.message || defaultMessage || error.message || 'An unknown error occurred';
  
  // Log the error
  try {
    handleError(new AppError({
      message: errorMessage,
      statusCode,
      code: 'MICROSERVICE_ERROR',
      isOperational: true,
      details: {
        source: error.response?.config?.url || 'unknown',
        originalError: error.message
      }
    }));
  } catch (e) {
    console.error('Error logging failed:', e);
  }
  
  // Send response to client
  res.status(statusCode).json({
    error: errorMessage,
    status: 'error',
    statusCode
  });
}

/**
 * Function to register all microservices routes on the Express app
 * @param app Express application
 */
export function registerMicroservicesRoutes(app: Express) {
  app.use(router);
}

export default router;