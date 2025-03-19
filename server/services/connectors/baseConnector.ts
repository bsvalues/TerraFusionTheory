import { LogCategory, LogLevel } from '@shared/schema';
import { storage } from '../../storage';
import { AppError, ExternalServiceError } from '../../errors';

/**
 * Interface for connector configuration
 */
export interface ConnectorConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
  [key: string]: any;
}

/**
 * Base connector interface for external data sources
 */
export interface DataConnector {
  /**
   * Get the connector name
   */
  getName(): string;
  
  /**
   * Get the connector type
   */
  getType(): string;
  
  /**
   * Test the connection to the external data source
   */
  testConnection(): Promise<boolean>;
  
  /**
   * Fetch data from the external source
   */
  fetchData(query: any): Promise<any>;
  
  /**
   * Get available data models/tables/entities
   */
  getAvailableModels(): Promise<string[]>;
  
  /**
   * Get schema for a specific model/table/entity
   */
  getModelSchema(modelName: string): Promise<any>;
}

/**
 * Abstract base connector class implementing common functionality
 */
export abstract class BaseDataConnector implements DataConnector {
  protected config: ConnectorConfig;
  private _name: string;
  private _type: string;
  
  constructor(name: string, type: string, config: ConnectorConfig) {
    this._name = name;
    this._type = type;
    this.config = {
      timeout: 30000, // 30 seconds default timeout
      ...config
    };
  }
  
  /**
   * Get the connector name
   */
  getName(): string {
    return this._name;
  }
  
  /**
   * Get the connector type
   */
  getType(): string {
    return this._type;
  }
  
  /**
   * Log a connector request
   */
  protected async logRequest(
    method: string,
    endpoint: string,
    params: any
  ): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.DEBUG,
        category: LogCategory.API,
        message: `${this.getName()} connector ${method} request to ${endpoint}`,
        details: JSON.stringify({
          connector: this.getName(),
          type: this.getType(),
          method,
          endpoint,
          params: this.sanitizeParams(params)
        }),
        source: `${this.getType()}-connector`,
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint,
        tags: ['connector', 'request', this.getType(), this.getName()]
      });
    } catch (error) {
      console.error(`Failed to log connector request:`, error);
    }
  }
  
  /**
   * Log a connector response
   */
  protected async logResponse(
    method: string,
    endpoint: string,
    params: any,
    response: any,
    duration: number
  ): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.API,
        message: `${this.getName()} connector ${method} response from ${endpoint}`,
        details: JSON.stringify({
          connector: this.getName(),
          type: this.getType(),
          method,
          endpoint,
          params: this.sanitizeParams(params),
          response: this.sanitizeResponse(response),
          duration
        }),
        source: `${this.getType()}-connector`,
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: 200,
        endpoint,
        tags: ['connector', 'response', this.getType(), this.getName()]
      });
    } catch (error) {
      console.error(`Failed to log connector response:`, error);
    }
  }
  
  /**
   * Log a connector error
   */
  protected async logError(
    method: string,
    endpoint: string,
    params: any,
    error: any
  ): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.API,
        message: `${this.getName()} connector ${method} error for ${endpoint}: ${error.message || 'Unknown error'}`,
        details: JSON.stringify({
          connector: this.getName(),
          type: this.getType(),
          method,
          endpoint,
          params: this.sanitizeParams(params),
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error instanceof ExternalServiceError ? { context: error.context } : {})
          } : error
        }),
        source: `${this.getType()}-connector`,
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: error.statusCode || 500,
        endpoint,
        tags: ['connector', 'error', this.getType(), this.getName()]
      });
    } catch (logError) {
      console.error(`Failed to log connector error:`, logError);
    }
  }
  
  /**
   * Create a timeout wrapper for connector requests
   */
  protected withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = this.config.timeout || 30000,
    errorMessage: string = 'Request timed out'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new AppError(errorMessage, 408, 'CONNECTOR_TIMEOUT', true, { timeout: timeoutMs }));
      }, timeoutMs);
      
      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }
  
  /**
   * Sanitize request parameters to remove sensitive data before logging
   */
  protected sanitizeParams(params: any): any {
    if (!params) return params;
    
    // Clone the params to avoid modifying the original
    const sanitized = { ...params };
    
    // Remove any sensitive information
    if (sanitized.apiKey) sanitized.apiKey = '[REDACTED]';
    if (sanitized.api_key) sanitized.api_key = '[REDACTED]';
    if (sanitized.key) sanitized.key = '[REDACTED]';
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.secret) sanitized.secret = '[REDACTED]';
    if (sanitized.token) sanitized.token = '[REDACTED]';
    if (sanitized.headers) {
      sanitized.headers = { ...sanitized.headers };
      if (sanitized.headers.Authorization) sanitized.headers.Authorization = '[REDACTED]';
      if (sanitized.headers.authorization) sanitized.headers.authorization = '[REDACTED]';
      if (sanitized.headers['X-API-Key']) sanitized.headers['X-API-Key'] = '[REDACTED]';
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize response data to truncate large responses before logging
   */
  protected sanitizeResponse(response: any): any {
    // For large responses, truncate the data
    const maxResponseSize = 2000; // Characters
    
    if (typeof response === 'string' && response.length > maxResponseSize) {
      return response.substring(0, maxResponseSize) + '... [truncated]';
    }
    
    if (typeof response === 'object' && response !== null) {
      // Clone the response to avoid modifying the original
      const sanitized = Array.isArray(response) ? [...response] : { ...response };
      
      // If response contains data array, truncate if too large
      if (Array.isArray(sanitized.data) && sanitized.data.length > 10) {
        sanitized.data = sanitized.data.slice(0, 10);
        sanitized.data.push({ _note: `${response.data.length - 10} more items truncated for logging` });
      }
      
      // Truncate large text fields
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'string' && sanitized[key].length > maxResponseSize) {
          sanitized[key] = sanitized[key].substring(0, maxResponseSize) + '... [truncated]';
        }
      }
      
      return sanitized;
    }
    
    return response;
  }
  
  /**
   * Extract error message from various error response formats
   */
  protected extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (error && typeof error === 'object') {
      // Try common error message fields
      if (error.message) return error.message;
      if (error.error && error.error.message) return error.error.message;
      if (error.error && typeof error.error === 'string') return error.error;
      if (error.description) return error.description;
      if (error.errorMessage) return error.errorMessage;
      if (error.reason) return error.reason;
    }
    
    return 'Unknown error';
  }
  
  /**
   * Abstract methods to be implemented by specific connectors
   */
  abstract testConnection(): Promise<boolean>;
  abstract fetchData(query: any): Promise<any>;
  abstract getAvailableModels(): Promise<string[]>;
  abstract getModelSchema(modelName: string): Promise<any>;
}

/**
 * Registry for all available connectors
 */
export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, DataConnector> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }
  
  /**
   * Register a connector
   */
  public registerConnector(connector: DataConnector): void {
    this.connectors.set(connector.getName(), connector);
  }
  
  /**
   * Get a connector by name
   */
  public getConnector(name: string): DataConnector | undefined {
    return this.connectors.get(name);
  }
  
  /**
   * Get all connectors
   */
  public getAllConnectors(): DataConnector[] {
    return Array.from(this.connectors.values());
  }
  
  /**
   * Get connectors by type
   */
  public getConnectorsByType(type: string): DataConnector[] {
    return Array.from(this.connectors.values())
      .filter(connector => connector.getType() === type);
  }
}

// Export the connector registry instance
export const connectorRegistry = ConnectorRegistry.getInstance();