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
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_SERVER_ERROR',
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.context = context;
    
    // Capture stack trace (only available in V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, context);
  }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

/**
 * Authorization error for forbidden access
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

/**
 * Not found error for resources that don't exist
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = 'Resource not found',
    context?: Record<string, any>
  ) {
    super(message, 404, 'NOT_FOUND_ERROR', true, context);
  }
}

/**
 * External service error for third-party services
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, context);
  }
}

/**
 * OpenAI specific service error
 */
export class OpenAIServiceError extends ExternalServiceError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, { service: 'OpenAI', ...context });
  }
}

/**
 * Database error for data storage issues
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', true, context);
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
      retryAfter ? { retryAfter } : undefined
    );
  }
}

/**
 * Error for when processing timeout occurs
 */
export class TimeoutError extends AppError {
  constructor(
    message: string = 'Request timed out',
    context?: Record<string, any>
  ) {
    super(message, 504, 'TIMEOUT_ERROR', true, context);
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
  
  // Handle native Error objects
  if (error instanceof Error) {
    // Check for common error types and convert accordingly
    const message = error.message || 'Unknown error occurred';
    
    if (error.name === 'SyntaxError') {
      return new ValidationError(`Syntax error: ${message}`, { originalError: error });
    }
    
    if (error.name === 'TypeError') {
      return new AppError(`Type error: ${message}`, 500, 'TYPE_ERROR', false, { originalError: error });
    }
    
    // If the error has a status code (like from libraries like axios)
    const statusCode = (error as any).statusCode || (error as any).status || 500;
    
    return new AppError(
      message,
      statusCode,
      `UNCATEGORIZED_ERROR`,
      statusCode < 500, // Assume client errors are operational
      { originalError: error }
    );
  }
  
  // For non-Error objects
  const message = typeof error === 'string' ? error : 'Unknown error occurred';
  
  return new AppError(
    message,
    500,
    'UNKNOWN_ERROR',
    false,
    typeof error === 'object' ? { originalError: error } : undefined
  );
}