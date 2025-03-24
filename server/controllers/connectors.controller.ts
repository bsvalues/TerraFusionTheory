/**
 * Connectors Controller
 * 
 * This controller handles requests to external data connectors
 * for weather, census, and other enrichment data.
 */

import { Request, Response } from 'express';
import { ConnectorFactory } from '../services/connectors/connector.factory';
import { AppError, NotFoundError, ValidationError, ExternalServiceError } from '../errors';

const connectorFactory = ConnectorFactory.getInstance();

/**
 * Get current weather for a location
 */
export async function getCurrentWeather(req: Request, res: Response) {
  try {
    const { location } = req.query;
    
    if (!location) {
      throw new ValidationError('Location parameter is required');
    }
    
    const weatherConnector = connectorFactory.getConnector('weather', 'weather-data');
    
    if (!weatherConnector) {
      throw new NotFoundError('Weather connector not found');
    }
    
    const weatherData = await weatherConnector.fetchData({
      endpoint: 'current',
      location: location.toString()
    });
    
    res.json(weatherData);
  } catch (error) {
    console.error('Error getting current weather:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    } else {
      const appError = new ExternalServiceError('Failed to fetch weather data');
      res.status(appError.statusCode).json({
        error: appError.message,
        code: appError.code
      });
    }
  }
}

/**
 * Get climate normals (monthly averages) for a location
 */
export async function getClimateData(req: Request, res: Response) {
  try {
    const { location } = req.query;
    
    if (!location) {
      throw new ValidationError('Location parameter is required');
    }
    
    const weatherConnector = connectorFactory.getConnector('weather', 'weather-data');
    
    if (!weatherConnector) {
      throw new NotFoundError('Weather connector not found');
    }
    
    const climateData = await weatherConnector.fetchData({
      endpoint: 'climate',
      location: location.toString()
    });
    
    res.json(climateData);
  } catch (error) {
    console.error('Error getting climate data:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    } else {
      const appError = new ExternalServiceError('Failed to fetch climate data');
      res.status(appError.statusCode).json({
        error: appError.message,
        code: appError.code
      });
    }
  }
}

/**
 * Get flood risk data for a location
 */
export async function getFloodRiskData(req: Request, res: Response) {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      throw new ValidationError('Latitude and longitude parameters are required');
    }
    
    const weatherConnector = connectorFactory.getConnector('weather', 'weather-data');
    
    if (!weatherConnector) {
      throw new NotFoundError('Weather connector not found');
    }
    
    const floodRiskData = await weatherConnector.fetchData({
      endpoint: 'flood-risk',
      latitude: parseFloat(lat.toString()),
      longitude: parseFloat(lon.toString())
    });
    
    res.json(floodRiskData);
  } catch (error) {
    console.error('Error getting flood risk data:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    } else {
      const appError = new ExternalServiceError('Failed to fetch flood risk data');
      res.status(appError.statusCode).json({
        error: appError.message,
        code: appError.code
      });
    }
  }
}

/**
 * Get census demographic data
 */
export async function getDemographicData(req: Request, res: Response) {
  try {
    const { state, county, tract } = req.query;
    
    if (!state) {
      throw new ValidationError('State parameter is required');
    }
    
    const censusConnector = connectorFactory.getConnector('census', 'census-data');
    
    if (!censusConnector) {
      throw new NotFoundError('Census connector not found');
    }
    
    const params: any = {
      state: state.toString()
    };
    
    if (county) {
      params.county = county.toString();
    }
    
    if (tract) {
      params.tract = tract.toString();
    }
    
    const demographicData = await censusConnector.fetchData(params);
    
    res.json(demographicData);
  } catch (error) {
    console.error('Error getting demographic data:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    } else {
      const appError = new ExternalServiceError('Failed to fetch demographic data');
      res.status(appError.statusCode).json({
        error: appError.message,
        code: appError.code
      });
    }
  }
}

/**
 * Get available connectors
 */
export async function getAvailableConnectors(req: Request, res: Response) {
  try {
    const connectorTypes = connectorFactory.getConnectorTypes();
    
    const result = connectorTypes.reduce((acc: any, type) => {
      acc[type] = connectorFactory.getConnectorNames(type);
      return acc;
    }, {});
    
    res.json(result);
  } catch (error) {
    console.error('Error getting available connectors:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    } else {
      const appError = new ExternalServiceError('Failed to fetch connector information');
      res.status(appError.statusCode).json({
        error: appError.message,
        code: appError.code
      });
    }
  }
}