import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { storage } from '../storage';
import { LogCategory, LogLevel } from '@shared/schema';

/**
 * Middleware to set secure HTTP headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Generate a random nonce for CSP
  const nonce = randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  
  // Set Content-Security-Policy to mitigate XSS attacks
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://api.openai.com;`
  );
  
  // Prevent browsers from MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Enable the XSS filter in most browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Tell browsers to require HTTPS (in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Prevent browser from exposing application as installed
  res.setHeader('X-Download-Options', 'noopen');
  
  // Don't send referrer for all requests
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Don't expose what server tech we're using
  res.setHeader('X-Powered-By', 'BS Intelligent Agent');
  
  // Continue to next middleware
  next();
}

/**
 * CORS middleware configuration with enhanced security
 */
export function corsMiddleware(allowedOrigins: string[] = ['*']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Get the origin from the request headers
    const origin = req.headers.origin;
    
    // Set the appropriate CORS headers
    if (origin) {
      // Check if the origin is allowed
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        // Log suspicious CORS request
        storage.createLog({
          level: LogLevel.WARNING,
          category: LogCategory.SECURITY,
          message: 'Blocked CORS request from unauthorized origin',
          details: JSON.stringify({
            origin,
            path: req.path,
            method: req.method,
            ip: req.ip
          }),
          source: 'cors-middleware',
          projectId: null,
          userId: null,
          sessionId: req.sessionID || null,
          duration: null,
          statusCode: 403,
          endpoint: req.path,
          tags: ['security', 'cors', 'blocked']
        }).catch(console.error);
      }
    }
    
    // Allow specific HTTP methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    // Allow specific HTTP headers
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
    
    // Allow credentials (cookies)
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Set max age for preflight requests
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  };
}

/**
 * Middleware to validate and sanitize request data
 */
export function validateRequestData(req: Request, res: Response, next: NextFunction): void {
  // Only process POST, PUT, and PATCH requests
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }
  
  // Check for proper Content-Type header
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    if (Object.keys(req.body).length > 0) {
      return res.status(415).json({
        error: 'Unsupported Media Type. Content-Type must be application/json.'
      });
    }
  }
  
  // Check for oversized payloads (prevent DoS)
  const contentLength = parseInt(req.headers['content-length'] as string || '0', 10);
  const MAX_CONTENT_LENGTH = 1024 * 1024; // 1MB limit
  
  if (contentLength > MAX_CONTENT_LENGTH) {
    // Log oversized request
    storage.createLog({
      level: LogLevel.WARNING,
      category: LogCategory.SECURITY,
      message: 'Blocked oversized request payload',
      details: JSON.stringify({
        size: contentLength,
        maxSize: MAX_CONTENT_LENGTH,
        path: req.path,
        method: req.method,
        ip: req.ip
      }),
      source: 'validate-request-middleware',
      projectId: null,
      userId: req.user?.id || null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 413,
      endpoint: req.path,
      tags: ['security', 'request-validation', 'oversized']
    }).catch(console.error);
    
    return res.status(413).json({
      error: 'Payload Too Large. The request entity exceeds the maximum allowed size.'
    });
  }
  
  // Perform basic JSON injection check
  if (req.body && typeof req.body === 'object') {
    const jsonString = JSON.stringify(req.body);
    
    // Check for JavaScript prototype pollution patterns
    const prototypePattern = /"__proto__"|"constructor"|"prototype"/;
    if (prototypePattern.test(jsonString)) {
      // Log potential prototype pollution attempt
      storage.createLog({
        level: LogLevel.WARNING,
        category: LogCategory.SECURITY,
        message: 'Potential prototype pollution attempt',
        details: JSON.stringify({
          path: req.path,
          method: req.method,
          ip: req.ip
        }),
        source: 'validate-request-middleware',
        projectId: null,
        userId: req.user?.id || null,
        sessionId: req.sessionID || null,
        duration: null,
        statusCode: 400,
        endpoint: req.path,
        tags: ['security', 'request-validation', 'prototype-pollution']
      }).catch(console.error);
      
      return res.status(400).json({
        error: 'Invalid request payload. Potential security issue detected.'
      });
    }
  }
  
  next();
}