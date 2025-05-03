import { Request, Response, NextFunction } from 'express';
import { connectorFactory } from '../services/connectors/connector.factory';
import { storage } from '../storage';
import { LogCategory, LogLevel } from '@shared/schema';
import { AppError } from '../errors';

/**
 * Get all connector statuses
 */
export const getConnectorStatuses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const connectors = connectorFactory.getAllConnectors();
    
    // Test connection for each connector with timeout protection
    const statuses = await Promise.all(
      connectors.map(async (connector) => {
        const name = connector.getName();
        const type = connector.getType();
        let status = false;
        let error = null;
        
        try {
          // Add a timeout of 5 seconds for each connector test
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Connection test timed out after 5 seconds')), 5000);
          });
          
          // Race the connector test against the timeout
          status = await Promise.race([
            connector.testConnection(),
            timeoutPromise
          ]);
        } catch (err) {
          error = err instanceof Error ? err.message : 'Unknown error';
        }
        
        // Log the connector status
        await storage.createLog({
          level: status ? LogLevel.INFO : LogLevel.ERROR,
          category: LogCategory.SYSTEM,
          message: `Connector ${name} (${type}) status check: ${status ? 'Connected' : 'Failed'}`,
          details: JSON.stringify({
            connector: name,
            type: connector.getType(),
            status,
            error
          }),
          source: 'diagnostics-controller',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: '/api/diagnostics/connectors',
          tags: ['diagnostics', 'connector', connector.getType(), name]
        });
        
        return {
          name,
          type: connector.getType(),
          status,
          error,
          config: {
            // Only show safe config info, hide keys
            ...connector.getSafeConfig()
          }
        };
      })
    );
    
    res.json({
      success: true,
      connectors: statuses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test a specific connector
 */
export const testConnector = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    
    const connector = connectorFactory.getConnector(name);
    if (!connector) {
      throw new AppError(`Connector not found: ${name}`, 404, 'NOT_FOUND', true);
    }
    
    let status = false;
    let error = null;
    let data = null;
    
    try {
      // Add a timeout of 5 seconds for the connection test
      const testConnectionWithTimeout = async () => {
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Connection test timed out after 5 seconds')), 5000);
        });
        
        return Promise.race([
          connector.testConnection(),
          timeoutPromise
        ]);
      };
      
      // First test the connection with timeout
      status = await testConnectionWithTimeout();
      
      // If connection successful, try to fetch some sample data with timeout
      if (status) {
        // The query parameters will vary by connector type
        const query = getQueryForConnectorType(connector.getType());
        
        // Add a timeout for data fetching as well
        const fetchDataWithTimeout = async () => {
          const timeoutPromise = new Promise<any>((_, reject) => {
            setTimeout(() => reject(new Error('Data fetch timed out after 8 seconds')), 8000);
          });
          
          return Promise.race([
            connector.fetchData(query),
            timeoutPromise
          ]);
        };
        
        const result = await fetchDataWithTimeout();
        data = {
          count: result.data ? result.data.length : 0,
          sample: result.data ? result.data.slice(0, 1) : null,
          // Include other relevant data depending on connector type
          ...(result.total !== undefined && { total: result.total }),
          ...(result.features !== undefined && { features: result.features.length })
        };
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
    
    // Log the detailed test
    await storage.createLog({
      level: status ? LogLevel.INFO : LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message: `Connector ${name} detailed test: ${status ? 'Successful' : 'Failed'}`,
      details: JSON.stringify({
        connector: name,
        type: connector.getType(),
        status,
        error,
        data
      }),
      source: 'diagnostics-controller',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: `/api/diagnostics/connectors/${name}/test`,
      tags: ['diagnostics', 'connector', 'test', connector.getType(), name]
    });
    
    res.json({
      success: true,
      connector: {
        name,
        type: connector.getType(),
        status,
        error,
        data,
        config: {
          // Only show safe config info, hide keys
          ...connector.getSafeConfig()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appropriate query parameters based on connector type
 */
function getQueryForConnectorType(type: string): any {
  switch (type) {
    case 'market':
      return {
        limit: 5,
        // No specific filters to get a sample of the data
      };
    case 'cama':
      return {
        limit: 5,
        // Sample property tax data
      };
    case 'gis':
      return {
        limit: 5,
        // A reasonable bounding box for Grandview, WA area
        bbox: [-120.0, 46.0, -119.0, 47.0]
      };
    case 'pdf':
      return {
        limit: 5,
        // No specific filters
      };
    case 'weather':
      return {
        location: 'Grandview,WA',
        // Default weather query
      };
    case 'census':
      return {
        state: 'WA',
        county: 'Yakima',
        // Default census query
      };
    default:
      return { limit: 5 };
  }
}

/**
 * Refresh all data from connectors
 */
export const refreshAllData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Log refresh request
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'Manual data refresh requested from diagnostics',
      details: JSON.stringify({}),
      source: 'diagnostics-controller',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: '/api/diagnostics/refresh',
      tags: ['refresh', 'manual', 'diagnostics']
    });
    
    // Start refresh in background - this will trigger the data refresh service
    const refreshPromise = refreshConnectorData();
    
    res.json({
      success: true,
      message: 'Data refresh initiated'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh data from all connectors
 */
async function refreshConnectorData(): Promise<void> {
  try {
    const connectors = connectorFactory.getAllConnectors();
    
    // Process each connector
    for (const connector of connectors) {
      const name = connector.getName();
      const type = connector.getType();
      try {
        // Log start of refresh for this connector
        await storage.createLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          message: `Starting data refresh for connector: ${name} (${type})`,
          details: JSON.stringify({ connector: name, type }),
          source: 'diagnostics-controller',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['refresh', 'data', connector.getType(), name]
        });
        
        // Test the connection first with timeout
        const testConnectionWithTimeout = async () => {
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Connection test timed out after 5 seconds')), 5000);
          });
          
          return Promise.race([
            connector.testConnection(),
            timeoutPromise
          ]);
        };
        
        const connectionOk = await testConnectionWithTimeout();
        
        if (!connectionOk) {
          throw new Error(`Connection test failed for connector: ${name}`);
        }
        
        // Fetch data using appropriate query for the connector type with timeout
        const query = getQueryForConnectorType(connector.getType());
        
        const fetchDataWithTimeout = async () => {
          const timeoutPromise = new Promise<any>((_, reject) => {
            setTimeout(() => reject(new Error('Data fetch timed out after 8 seconds')), 8000);
          });
          
          return Promise.race([
            connector.fetchData(query),
            timeoutPromise
          ]);
        };
        
        const result = await fetchDataWithTimeout();
        
        // Log successful refresh
        await storage.createLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          message: `Completed data refresh for connector: ${name}`,
          details: JSON.stringify({
            connector: name,
            type: connector.getType(),
            recordCount: result.data ? result.data.length : 0,
            // Include other relevant result data
            ...(result.total !== undefined && { total: result.total })
          }),
          source: 'diagnostics-controller',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['refresh', 'data', 'success', connector.getType(), name]
        });
      } catch (error) {
        // Log error for this connector
        await storage.createLog({
          level: LogLevel.ERROR,
          category: LogCategory.SYSTEM,
          message: `Failed to refresh data for connector ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: JSON.stringify({
            connector: name,
            type: connector.getType(),
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error
          }),
          source: 'diagnostics-controller',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['refresh', 'data', 'error', connector.getType(), name]
        });
      }
    }
    
    // Log overall completion
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'Completed data refresh for all connectors',
      details: JSON.stringify({
        connectorsCount: connectors.length
      }),
      source: 'diagnostics-controller',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['refresh', 'data', 'completed']
    });
  } catch (error) {
    console.error('Error in data refresh:', error);
    
    // Log the overall error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message: `Error in data refresh: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }),
      source: 'diagnostics-controller',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['refresh', 'data', 'error']
    });
  }
}