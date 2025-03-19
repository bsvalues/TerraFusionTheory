/**
 * Custom application error class for consistent error handling
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Create error types for different scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 401, 'AUTHORIZATION_ERROR', true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 403, 'FORBIDDEN_ERROR', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 404, 'NOT_FOUND_ERROR', true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', true, details);
  }
}

export class ServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'SERVICE_ERROR', true, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', true, details);
  }
}

export class TimeoutError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 504, 'TIMEOUT_ERROR', true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 503, 'DATABASE_ERROR', true, details);
  }
}

/**
 * Global error handler
 * @param error The error to handle
 */
export function handleError(error: Error): void {
  // Log the error
  console.error('Error:', error);
  
  // For non-operational errors, we might want to perform additional actions
  if (error instanceof AppError && !error.isOperational) {
    // This could be a more critical error that requires immediate attention
    // For example, sending alerts, triggering monitoring systems, etc.
    console.error('Critical error:', error);
  }
}

/**
 * Check if the error is an AppError
 * @param error The error to check
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to an AppError
 * @param error The error to convert
 * @param defaultMessage The default message to use if the error doesn't have one
 */
export function toAppError(error: unknown, defaultMessage: string = 'An unexpected error occurred'): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 500, 'INTERNAL_ERROR', false, {
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  }
  
  return new AppError(
    typeof error === 'string' ? error : defaultMessage,
    500,
    'INTERNAL_ERROR',
    false,
    { originalError: error }
  );
}

/**
 * Create an error from unknown source (alias for toAppError for backward compatibility)
 * @param error The unknown error
 * @param defaultMessage The default message to use if the error doesn't have one
 */
export function createErrorFromUnknown(error: unknown, defaultMessage: string = 'An unexpected error occurred'): AppError {
  return toAppError(error, defaultMessage);
}