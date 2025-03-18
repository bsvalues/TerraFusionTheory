/**
 * Base error class for the application
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode = 500,
    errorCode = 'INTERNAL_ERROR',
    isOperational = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // Indicates if this is an operational error that we anticipated
    this.errorCode = errorCode;
    this.context = context;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      400,
      'VALIDATION_ERROR',
      true,
      context
    );
    
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(
      message,
      401,
      'AUTHENTICATION_ERROR',
      true
    );
    
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Authorization error for forbidden access
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(
      message,
      403,
      'AUTHORIZATION_ERROR',
      true
    );
    
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not found error for resources that don't exist
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string = 'Resource',
    id?: string | number
  ) {
    const message = id 
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
      
    super(
      message,
      404,
      'NOT_FOUND_ERROR',
      true,
      { resource, id }
    );
    
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * External service error for third-party services
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    context?: Record<string, any>
  ) {
    super(
      message,
      502,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { ...context, service }
    );
    
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * OpenAI specific service error
 */
export class OpenAIServiceError extends ExternalServiceError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      'OpenAI',
      message,
      context
    );
    
    Object.setPrototypeOf(this, OpenAIServiceError.prototype);
  }
}

/**
 * Database error for data storage issues
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(
      message,
      500,
      'DATABASE_ERROR',
      true,
      context
    );
    
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Rate limit error for too many requests
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = 'Too many requests, please try again later',
    retryAfter?: number
  ) {
    super(
      message,
      429,
      'RATE_LIMIT_ERROR',
      true,
      { retryAfter }
    );
    
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error for when processing timeout occurs
 */
export class TimeoutError extends AppError {
  constructor(
    operation: string = 'Operation',
    timeout?: number
  ) {
    const message = timeout 
      ? `${operation} timed out after ${timeout}ms`
      : `${operation} timed out`;
      
    super(
      message,
      504,
      'TIMEOUT_ERROR',
      true,
      { operation, timeout }
    );
    
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Utility function to determine if an error is an instance of AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Utility function to convert unknown errors to AppError
 */
export function toAppError(error: any): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  // Handle axios errors
  if (error?.isAxiosError) {
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'External service error';
    return new ExternalServiceError(
      error.config?.url || 'Unknown',
      message,
      {
        status: statusCode,
        data: error.response?.data,
        headers: error.response?.headers
      }
    );
  }
  
  // Handle standard errors
  return new AppError(
    error?.message || 'Unknown error occurred',
    500,
    'INTERNAL_ERROR',
    false, // Non-operational since we didn't anticipate it
    { originalError: error }
  );
}