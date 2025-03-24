/**
 * Microservices Routes
 * 
 * This file defines the API routes that interact with the microservices layer,
 * providing a unified API gateway from the Express server to the FastAPI microservices.
 */

import { Express } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { toAppError } from '../errors';
import {
  microservicesClient,
  PropertyService,
  MarketService,
  SpatialService,
  AnalyticsService
} from '../services/microservices-client';

/**
 * Register all microservices-related routes
 * @param app Express application
 */
export function registerMicroservicesRoutes(app: Express): void {
  // Health check endpoint for all microservices
  app.get('/api/microservices/health', asyncHandler(async (req, res) => {
    try {
      const healthStatus = {
        property: await microservicesClient.property.checkHealth(),
        market: await microservicesClient.market.checkHealth(),
        spatial: await microservicesClient.spatial.checkHealth(),
        analytics: await microservicesClient.analytics.checkHealth()
      };
      
      const isAllHealthy = Object.values(healthStatus).every(status => status);
      
      if (isAllHealthy) {
        res.json({
          status: 'healthy',
          services: healthStatus
        });
      } else {
        res.status(503).json({
          status: 'degraded',
          services: healthStatus
        });
      }
    } catch (error) {
      console.error('Error checking microservices health:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check microservices health',
        error: toAppError(error).message
      });
    }
  }));

  // Property Microservice Routes
  app.get('/api/microservices/properties', asyncHandler(async (req, res) => {
    try {
      const properties = await microservicesClient.property.getProperties(req.query);
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({
        error: 'Failed to fetch properties from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/properties/:id', asyncHandler(async (req, res) => {
    try {
      const property = await microservicesClient.property.getProperty(parseInt(req.params.id));
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      console.error(`Error fetching property ${req.params.id}:`, error);
      res.status(500).json({
        error: 'Failed to fetch property from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/properties', asyncHandler(async (req, res) => {
    try {
      const newProperty = await microservicesClient.property.createProperty(req.body);
      res.status(201).json(newProperty);
    } catch (error) {
      console.error('Error creating property:', error);
      res.status(500).json({
        error: 'Failed to create property in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/properties/:id/valuations', asyncHandler(async (req, res) => {
    try {
      const valuations = await microservicesClient.property.getPropertyValuations(parseInt(req.params.id));
      res.json(valuations);
    } catch (error) {
      console.error(`Error fetching valuations for property ${req.params.id}:`, error);
      res.status(500).json({
        error: 'Failed to fetch property valuations from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/valuations', asyncHandler(async (req, res) => {
    try {
      const newValuation = await microservicesClient.property.createValuation(req.body);
      res.status(201).json(newValuation);
    } catch (error) {
      console.error('Error creating valuation:', error);
      res.status(500).json({
        error: 'Failed to create valuation in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/market-summary', asyncHandler(async (req, res) => {
    try {
      const marketSummary = await microservicesClient.property.getMarketSummary(req.query);
      res.json(marketSummary);
    } catch (error) {
      console.error('Error fetching market summary:', error);
      res.status(500).json({
        error: 'Failed to fetch market summary from microservice',
        details: toAppError(error).message
      });
    }
  }));

  // Market Microservice Routes
  app.get('/api/microservices/metrics', asyncHandler(async (req, res) => {
    try {
      const metrics = await microservicesClient.market.getMetrics(req.query);
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching market metrics:', error);
      res.status(500).json({
        error: 'Failed to fetch market metrics from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/metrics/:id', asyncHandler(async (req, res) => {
    try {
      const metric = await microservicesClient.market.getMetricById(parseInt(req.params.id));
      if (!metric) {
        return res.status(404).json({ error: 'Metric not found' });
      }
      res.json(metric);
    } catch (error) {
      console.error(`Error fetching metric ${req.params.id}:`, error);
      res.status(500).json({
        error: 'Failed to fetch market metric from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/metrics', asyncHandler(async (req, res) => {
    try {
      const newMetric = await microservicesClient.market.createMetric(req.body);
      res.status(201).json(newMetric);
    } catch (error) {
      console.error('Error creating market metric:', error);
      res.status(500).json({
        error: 'Failed to create market metric in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/predictions', asyncHandler(async (req, res) => {
    try {
      const predictions = await microservicesClient.market.getPredictions(req.query);
      res.json(predictions);
    } catch (error) {
      console.error('Error fetching market predictions:', error);
      res.status(500).json({
        error: 'Failed to fetch market predictions from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/predictions', asyncHandler(async (req, res) => {
    try {
      const newPrediction = await microservicesClient.market.createPrediction(req.body);
      res.status(201).json(newPrediction);
    } catch (error) {
      console.error('Error creating market prediction:', error);
      res.status(500).json({
        error: 'Failed to create market prediction in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/trends/:metric', asyncHandler(async (req, res) => {
    try {
      const trend = await microservicesClient.market.getTrend(req.params.metric, req.query);
      res.json(trend);
    } catch (error) {
      console.error(`Error fetching trend for ${req.params.metric}:`, error);
      res.status(500).json({
        error: 'Failed to fetch market trend from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/market-overview/:areaType/:areaValue', asyncHandler(async (req, res) => {
    try {
      const overview = await microservicesClient.market.getMarketOverview(req.params.areaType, req.params.areaValue);
      res.json(overview);
    } catch (error) {
      console.error(`Error fetching market overview for ${req.params.areaType}/${req.params.areaValue}:`, error);
      res.status(500).json({
        error: 'Failed to fetch market overview from microservice',
        details: toAppError(error).message
      });
    }
  }));

  // Spatial Microservice Routes
  app.get('/api/microservices/spatial-data', asyncHandler(async (req, res) => {
    try {
      const spatialData = await microservicesClient.spatial.getSpatialData(req.query);
      res.json(spatialData);
    } catch (error) {
      console.error('Error fetching spatial data:', error);
      res.status(500).json({
        error: 'Failed to fetch spatial data from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/spatial-data/:id', asyncHandler(async (req, res) => {
    try {
      const spatialItem = await microservicesClient.spatial.getSpatialDataById(parseInt(req.params.id));
      if (!spatialItem) {
        return res.status(404).json({ error: 'Spatial data item not found' });
      }
      res.json(spatialItem);
    } catch (error) {
      console.error(`Error fetching spatial data item ${req.params.id}:`, error);
      res.status(500).json({
        error: 'Failed to fetch spatial data item from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/spatial-data', asyncHandler(async (req, res) => {
    try {
      const newSpatialData = await microservicesClient.spatial.createSpatialData(req.body);
      res.status(201).json(newSpatialData);
    } catch (error) {
      console.error('Error creating spatial data:', error);
      res.status(500).json({
        error: 'Failed to create spatial data in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/properties-geojson', asyncHandler(async (req, res) => {
    try {
      const geojson = await microservicesClient.spatial.getPropertiesGeoJSON(req.query);
      res.json(geojson);
    } catch (error) {
      console.error('Error fetching properties GeoJSON:', error);
      res.status(500).json({
        error: 'Failed to fetch properties GeoJSON from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/proximity-search', asyncHandler(async (req, res) => {
    try {
      const searchResults = await microservicesClient.spatial.proximitySearch(req.body);
      res.json(searchResults);
    } catch (error) {
      console.error('Error performing proximity search:', error);
      res.status(500).json({
        error: 'Failed to perform proximity search in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/geocode', asyncHandler(async (req, res) => {
    try {
      const geocodeResult = await microservicesClient.spatial.geocodeAddress(req.body);
      res.json(geocodeResult);
    } catch (error) {
      console.error('Error geocoding address:', error);
      res.status(500).json({
        error: 'Failed to geocode address in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/neighborhoods', asyncHandler(async (req, res) => {
    try {
      const neighborhoods = await microservicesClient.spatial.getNeighborhoods(req.query);
      res.json(neighborhoods);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      res.status(500).json({
        error: 'Failed to fetch neighborhoods from microservice',
        details: toAppError(error).message
      });
    }
  }));

  // Analytics Microservice Routes
  app.post('/api/microservices/predict-value', asyncHandler(async (req, res) => {
    try {
      const valueResult = await microservicesClient.analytics.predictPropertyValue(req.body);
      res.json(valueResult);
    } catch (error) {
      console.error('Error predicting property value:', error);
      res.status(500).json({
        error: 'Failed to predict property value in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/predict-trend', asyncHandler(async (req, res) => {
    try {
      const trendResult = await microservicesClient.analytics.predictMarketTrend(req.body);
      res.json(trendResult);
    } catch (error) {
      console.error('Error predicting market trend:', error);
      res.status(500).json({
        error: 'Failed to predict market trend in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/train-model', asyncHandler(async (req, res) => {
    try {
      const trainingResult = await microservicesClient.analytics.trainModel(req.body);
      res.json(trainingResult);
    } catch (error) {
      console.error('Error training model:', error);
      res.status(500).json({
        error: 'Failed to train model in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.get('/api/microservices/training-status/:jobId', asyncHandler(async (req, res) => {
    try {
      const status = await microservicesClient.analytics.getTrainingStatus(req.params.jobId);
      res.json(status);
    } catch (error) {
      console.error(`Error fetching training status for job ${req.params.jobId}:`, error);
      res.status(500).json({
        error: 'Failed to fetch training status from microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/find-hotspots', asyncHandler(async (req, res) => {
    try {
      const hotspots = await microservicesClient.analytics.findHotspots(req.body);
      res.json(hotspots);
    } catch (error) {
      console.error('Error finding hotspots:', error);
      res.status(500).json({
        error: 'Failed to find hotspots in microservice',
        details: toAppError(error).message
      });
    }
  }));

  app.post('/api/microservices/analyze-investment', asyncHandler(async (req, res) => {
    try {
      const analysis = await microservicesClient.analytics.analyzeInvestment(req.body);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing investment:', error);
      res.status(500).json({
        error: 'Failed to analyze investment in microservice',
        details: toAppError(error).message
      });
    }
  }));
}