import { LogCategory, LogLevel } from '../../../shared/schema';
import { storage } from '../../storage';
import { ExternalServiceError, TimeoutError } from '../../errors';

/**
 * Response format from AI model providers
 */
export interface AIModelResponse {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  meta?: Record<string, any>;
}

/**
 * Standard options for AI model requests
 */
export interface AIModelRequestOptions {
  timeout?: number;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  userId?: number | null;
  projectId?: number | null;
  sessionId?: string | null;
  tags?: string[];
}

/**
 * Base service class for all AI model integrations
 */
export abstract class BaseAIService {
  protected serviceId: string;
  protected defaultTimeout: number = 30000; // 30 seconds default timeout

  constructor(serviceId: string) {
    this.serviceId = serviceId;
  }

  /**
   * Generate text completion based on a prompt
   */
  abstract generateText(prompt: string, options?: AIModelRequestOptions): Promise<AIModelResponse>;

  /**
   * Generate chat completion based on messages
   */
  abstract generateChatCompletion(
    messages: Array<{ role: string; content: string | Array<any> }>,
    options?: AIModelRequestOptions
  ): Promise<AIModelResponse>;

  /**
   * Process image and generate text description or answer questions about the image
   */
  abstract processImage(
    base64Image: string,
    prompt: string,
    options?: AIModelRequestOptions
  ): Promise<AIModelResponse>;

  /**
   * Log a request to an AI service
   */
  protected async logRequest(
    requestType: string,
    request: any,
    options?: AIModelRequestOptions
  ): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.DEBUG,
        category: LogCategory.AI,
        message: `${this.serviceId} ${requestType} request`,
        details: JSON.stringify({
          request: this.sanitizeRequest(request),
          options: options
        }),
        source: this.serviceId,
        projectId: options?.projectId || null,
        userId: options?.userId || null,
        sessionId: options?.sessionId || null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['ai-request', this.serviceId.toLowerCase(), ...(options?.tags || [])]
      });
    } catch (error) {
      console.error(`Failed to log ${this.serviceId} request:`, error);
    }
  }

  /**
   * Log a response from an AI service
   */
  protected async logResponse(
    requestType: string,
    request: any,
    response: any,
    duration: number,
    options?: AIModelRequestOptions
  ): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.AI,
        message: `${this.serviceId} ${requestType} response`,
        details: JSON.stringify({
          request: this.sanitizeRequest(request),
          response: this.sanitizeResponse(response),
          duration,
          options
        }),
        source: this.serviceId,
        projectId: options?.projectId || null,
        userId: options?.userId || null,
        sessionId: options?.sessionId || null,
        duration: duration,
        statusCode: 200,
        endpoint: null,
        tags: ['ai-response', this.serviceId.toLowerCase(), ...(options?.tags || [])]
      });
    } catch (error) {
      console.error(`Failed to log ${this.serviceId} response:`, error);
    }
  }

  /**
   * Log an error from an AI service
   */
  protected async logError(
    requestType: string,
    request: any,
    error: any,
    options?: AIModelRequestOptions
  ): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.AI,
        message: `${this.serviceId} ${requestType} error: ${error.message || 'Unknown error'}`,
        details: JSON.stringify({
          request: this.sanitizeRequest(request),
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...(error instanceof ExternalServiceError ? { context: error.context } : {})
          } : error,
          options
        }),
        source: this.serviceId,
        projectId: options?.projectId || null,
        userId: options?.userId || null,
        sessionId: options?.sessionId || null,
        duration: null,
        statusCode: error.statusCode || 500,
        endpoint: null,
        tags: ['ai-error', this.serviceId.toLowerCase(), ...(options?.tags || [])]
      });
    } catch (logError) {
      console.error(`Failed to log ${this.serviceId} error:`, logError);
    }
  }

  /**
   * Create a timeout wrapper for AI model requests
   */
  protected withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = this.defaultTimeout,
    errorMessage: string = 'Request timed out'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new TimeoutError(errorMessage, { timeout: timeoutMs }));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  /**
   * Remove sensitive data from request before logging
   */
  protected sanitizeRequest(request: any): any {
    // Clone the request to avoid modifying the original
    const sanitized = { ...request };
    
    // Remove any API keys or sensitive information
    if (sanitized.apiKey) sanitized.apiKey = '[REDACTED]';
    if (sanitized.api_key) sanitized.api_key = '[REDACTED]';
    if (sanitized.Authorization) sanitized.Authorization = '[REDACTED]';
    if (sanitized.authorization) sanitized.authorization = '[REDACTED]';
    if (sanitized.headers) {
      sanitized.headers = { ...sanitized.headers };
      if (sanitized.headers.Authorization) sanitized.headers.Authorization = '[REDACTED]';
      if (sanitized.headers.authorization) sanitized.headers.authorization = '[REDACTED]';
    }
    
    return sanitized;
  }

  /**
   * Remove sensitive data from response before logging
   */
  protected sanitizeResponse(response: any): any {
    // For now, just return the full response
    // In the future, we might want to trim or filter large responses
    return response;
  }
}