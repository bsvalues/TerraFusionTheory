import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { LogCategory, LogLevel } from '@shared/schema';
import { AppError, isAppError, toAppError } from '../errors';
import { troubleshootingService } from '../services/troubleshooting.service';

/**
 * Global error handler middleware
 * Handles all errors that occur in the application
 */
export async function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const appError = isAppError(error) ? error : toAppError(error);

  // Get troubleshooting diagnosis
  const diagnosis = await troubleshootingService.analyzeIssue(error, {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    headers: req.headers
  });

  // Log the error, including diagnosis
  const errorLogPromise = storage.createLog({
    level: appError.statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARNING,
    category: LogCategory.SYSTEM,
    message: appError.message,
    details: JSON.stringify({
      errorCode: appError.errorCode,
      statusCode: appError.statusCode,
      path: req.path,
      method: req.method,
      isOperational: appError.isOperational,
      context: appError.context,
      stack: appError.stack,
      diagnosis: diagnosis // Add diagnosis to log details
    }),
    source: 'error-handler',
    projectId: null,
    userId: req.user?.id || null,
    sessionId: req.sessionID || null,
    duration: null,
    statusCode: appError.statusCode,
    endpoint: req.path,
    tags: ['error', appError.errorCode, appError.isOperational ? 'operational' : 'programming']
  });

  // Construct response based on environment, including diagnosis
  const responseBody = {
    error: {
      message: appError.message,
      code: appError.errorCode,
      status: appError.statusCode,
      diagnosis: diagnosis // Add diagnosis to response
    }
  };

  // Add stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    responseBody.error['stack'] = appError.stack;
    responseBody.error['context'] = appError.context;
  }

  // Wait for the error to be logged before sending the response
  errorLogPromise
    .then(() => {
      res.status(appError.statusCode).json(responseBody);
    })
    .catch((logError) => {
      console.error('Failed to log error:', logError);
      res.status(appError.statusCode).json(responseBody);
    });

  // If this is a critical error, log additional diagnostics
  if (appError.statusCode >= 500) {
    console.error(`[CRITICAL ERROR] ${appError.message}`, {
      path: req.path,
      method: req.method,
      errorCode: appError.errorCode,
      stack: appError.stack,
      diagnosis: diagnosis //Add diagnosis to critical error log
    });
  }
}

/**
 * Middleware to handle 404 errors for routes that don't exist
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the 404 error
  storage.createLog({
    level: LogLevel.WARNING,
    category: LogCategory.API,
    message: `Route not found: ${req.method} ${req.path}`,
    details: JSON.stringify({
      path: req.path,
      method: req.method,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }),
    source: 'not-found-handler',
    projectId: null,
    userId: req.user?.id || null,
    sessionId: req.sessionID || null, 
    duration: null,
    statusCode: 404,
    endpoint: req.path,
    tags: ['error', '404', 'not-found']
  }).catch(console.error);

  // Send 404 response
  res.status(404).json({
    error: {
      message: 'Resource not found',
      code: 'RESOURCE_NOT_FOUND',
      status: 404
    }
  });
}

/**
 * Middleware to handle async route handlers
 * Automatically catches errors and passes them to the error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}