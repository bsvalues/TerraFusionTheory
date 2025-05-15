/**
 * Error handling middleware for Express
 */

import { Request, Response, NextFunction } from 'express';
import { OptimizedLogger } from '../services/optimized-logging';
import { LogCategory } from '../../shared/schema';

const logger = OptimizedLogger.getInstance();

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Async handler to wrap route handlers and catch errors
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found handler middleware for Express
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  logger.warn(`404 Not Found: ${req.method} ${req.url}`, LogCategory.API);
  
  return res.status(404).json({
    status: 'error',
    message: 'Resource not found'
  });
};

/**
 * Error handler middleware for Express
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  logger.error(`API Error: ${err.message}`, LogCategory.API, { error: err, url: req.url });
  
  // If it's a known API error, use its status code
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }
  
  // For unknown errors, return a 500
  return res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};