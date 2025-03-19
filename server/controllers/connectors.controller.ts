import { Request, Response } from 'express';
import { connectorFactory, connectorRegistry } from '../services/connectors';
import { storage } from '../storage';
import { LogLevel, LogCategory } from '@shared/schema';

/**
 * Get all registered connectors
 */
export async function getAllConnectors(req: Request, res: Response) {
  try {
    const connectors = connectorFactory.getAllConnectors();
    const connectorInfo = connectors.map(connector => ({
      name: connector.getName(),
      type: connector.getType()
    }));
    
    return res.json({ connectors: connectorInfo });
  } catch (error) {
    console.error('Failed to get connectors:', error);
    await logControllerError('getAllConnectors', error, req);
    return res.status(500).json({ 
      error: 'Failed to get connectors',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get connectors by type
 */
export async function getConnectorsByType(req: Request, res: Response) {
  try {
    const { type } = req.params;
    
    if (!type) {
      return res.status(400).json({ error: 'Connector type is required' });
    }
    
    const connectors = connectorFactory.getConnectorsByType(type);
    const connectorInfo = connectors.map(connector => ({
      name: connector.getName(),
      type: connector.getType()
    }));
    
    return res.json({ connectors: connectorInfo });
  } catch (error) {
    console.error(`Failed to get connectors by type ${req.params.type}:`, error);
    await logControllerError('getConnectorsByType', error, req);
    return res.status(500).json({ 
      error: 'Failed to get connectors by type',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get a specific connector
 */
export async function getConnector(req: Request, res: Response) {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Connector name is required' });
    }
    
    const connector = connectorFactory.getConnector(name);
    
    if (!connector) {
      return res.status(404).json({ error: `Connector '${name}' not found` });
    }
    
    return res.json({
      name: connector.getName(),
      type: connector.getType()
    });
  } catch (error) {
    console.error(`Failed to get connector ${req.params.name}:`, error);
    await logControllerError('getConnector', error, req);
    return res.status(500).json({ 
      error: 'Failed to get connector',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Test a connector's connection
 */
export async function testConnectorConnection(req: Request, res: Response) {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Connector name is required' });
    }
    
    const connector = connectorFactory.getConnector(name);
    
    if (!connector) {
      return res.status(404).json({ error: `Connector '${name}' not found` });
    }
    
    const success = await connector.testConnection();
    
    return res.json({
      name: connector.getName(),
      type: connector.getType(),
      connectionTest: {
        success,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Failed to test connector ${req.params.name} connection:`, error);
    await logControllerError('testConnectorConnection', error, req);
    return res.status(500).json({ 
      error: 'Failed to test connector connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get available models from a connector
 */
export async function getConnectorModels(req: Request, res: Response) {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Connector name is required' });
    }
    
    const connector = connectorFactory.getConnector(name);
    
    if (!connector) {
      return res.status(404).json({ error: `Connector '${name}' not found` });
    }
    
    const models = await connector.getAvailableModels();
    
    return res.json({
      name: connector.getName(),
      type: connector.getType(),
      models
    });
  } catch (error) {
    console.error(`Failed to get models for connector ${req.params.name}:`, error);
    await logControllerError('getConnectorModels', error, req);
    return res.status(500).json({ 
      error: 'Failed to get connector models',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get schema for a specific model from a connector
 */
export async function getConnectorModelSchema(req: Request, res: Response) {
  try {
    const { name, model } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Connector name is required' });
    }
    
    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }
    
    const connector = connectorFactory.getConnector(name);
    
    if (!connector) {
      return res.status(404).json({ error: `Connector '${name}' not found` });
    }
    
    const schema = await connector.getModelSchema(model);
    
    return res.json({
      name: connector.getName(),
      type: connector.getType(),
      model,
      schema
    });
  } catch (error) {
    console.error(`Failed to get schema for connector ${req.params.name} model ${req.params.model}:`, error);
    await logControllerError('getConnectorModelSchema', error, req);
    return res.status(500).json({ 
      error: 'Failed to get connector model schema',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Query data from a CAMA connector
 */
export async function queryCAMAData(req: Request, res: Response) {
  try {
    const { name } = req.params;
    const query = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Connector name is required' });
    }
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameters are required' });
    }
    
    const connector = connectorFactory.getConnector(name);
    
    if (!connector) {
      return res.status(404).json({ error: `Connector '${name}' not found` });
    }
    
    if (connector.getType() !== 'cama') {
      return res.status(400).json({ error: `Connector '${name}' is not a CAMA connector` });
    }
    
    const data = await connector.fetchData(query);
    
    return res.json({
      name: connector.getName(),
      type: connector.getType(),
      query,
      data
    });
  } catch (error) {
    console.error(`Failed to query CAMA data from connector ${req.params.name}:`, error);
    await logControllerError('queryCAMAData', error, req);
    return res.status(500).json({ 
      error: 'Failed to query CAMA data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Query data from a GIS connector
 */
export async function queryGISData(req: Request, res: Response) {
  try {
    const { name } = req.params;
    const query = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Connector name is required' });
    }
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameters are required' });
    }
    
    const connector = connectorFactory.getConnector(name);
    
    if (!connector) {
      return res.status(404).json({ error: `Connector '${name}' not found` });
    }
    
    if (connector.getType() !== 'gis') {
      return res.status(400).json({ error: `Connector '${name}' is not a GIS connector` });
    }
    
    const data = await connector.fetchData(query);
    
    return res.json({
      name: connector.getName(),
      type: connector.getType(),
      query,
      data
    });
  } catch (error) {
    console.error(`Failed to query GIS data from connector ${req.params.name}:`, error);
    await logControllerError('queryGISData', error, req);
    return res.status(500).json({ 
      error: 'Failed to query GIS data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Helper to log controller errors
 */
async function logControllerError(method: string, error: any, req: Request): Promise<void> {
  try {
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: `Connector controller error in ${method}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }),
      source: 'connector-controller',
      projectId: null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: req.path,
      tags: ['connector', 'controller', 'error', method]
    });
  } catch (logError) {
    console.error('Failed to log connector controller error:', logError);
  }
}