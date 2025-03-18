import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { LogCategory, LogLevel } from '@shared/schema';
import { AuthenticationError, AuthorizationError } from '../errors';

/**
 * Role definitions for RBAC
 */
export enum UserRole {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

/**
 * Interface for user session with auth data
 */
interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

/**
 * Extend Express Request to include the authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware to verify user is logged in
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // In a real implementation, this would verify JWT tokens, session cookies, etc.
  // For now, we'll use a simple API key check for demonstration purposes
  
  const apiKey = req.headers['x-api-key'] as string;
  
  // Skip authentication for public routes
  if (isPublicRoute(req.path)) {
    return next();
  }
  
  if (!apiKey) {
    // Log authentication failure
    storage.createLog({
      level: LogLevel.WARNING,
      category: LogCategory.SECURITY,
      message: 'Authentication failed: API key missing',
      details: JSON.stringify({
        path: req.path,
        method: req.method,
        ip: req.ip
      }),
      source: 'auth-middleware',
      projectId: null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 401,
      endpoint: req.path,
      tags: ['security', 'auth-failed', 'api-key-missing']
    }).catch(console.error);
    
    throw new AuthenticationError('Authentication required. API key is missing.');
  }
  
  // In a real implementation, validate API key against database
  // For this demonstration, we use a simple check
  if (apiKey !== process.env.API_KEY) {
    // Log invalid API key
    storage.createLog({
      level: LogLevel.WARNING,
      category: LogCategory.SECURITY,
      message: 'Authentication failed: Invalid API key',
      details: JSON.stringify({
        path: req.path,
        method: req.method,
        ip: req.ip
      }),
      source: 'auth-middleware',
      projectId: null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 401,
      endpoint: req.path,
      tags: ['security', 'auth-failed', 'invalid-api-key']
    }).catch(console.error);
    
    throw new AuthenticationError('Authentication failed. Invalid API key.');
  }
  
  // Set user on request object (in real implementation, this would come from JWT/session)
  req.user = {
    id: 1,
    username: 'admin',
    role: UserRole.ADMIN
  };
  
  // Log successful authentication
  storage.createLog({
    level: LogLevel.INFO,
    category: LogCategory.SECURITY,
    message: 'Authentication successful',
    details: JSON.stringify({
      userId: req.user.id,
      username: req.user.username,
      role: req.user.role,
      path: req.path,
      method: req.method
    }),
    source: 'auth-middleware',
    projectId: null,
    userId: req.user.id,
    sessionId: req.sessionID || null,
    duration: null,
    statusCode: null,
    endpoint: req.path,
    tags: ['security', 'auth-success']
  }).catch(console.error);
  
  next();
}

/**
 * Authorization middleware to restrict access based on roles
 * @param allowedRoles Roles that are allowed to access the route
 */
export function authorize(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip authorization check for public routes
    if (isPublicRoute(req.path)) {
      return next();
    }
    
    if (!req.user) {
      throw new AuthenticationError('User is not authenticated');
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      // Log authorization failure
      storage.createLog({
        level: LogLevel.WARNING,
        category: LogCategory.SECURITY,
        message: 'Authorization failed: Insufficient permissions',
        details: JSON.stringify({
          userId: req.user.id,
          username: req.user.username,
          role: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path,
          method: req.method
        }),
        source: 'auth-middleware',
        projectId: null,
        userId: req.user.id,
        sessionId: req.sessionID || null,
        duration: null,
        statusCode: 403,
        endpoint: req.path,
        tags: ['security', 'auth-failed', 'insufficient-permissions']
      }).catch(console.error);
      
      throw new AuthorizationError('You do not have permission to access this resource');
    }
    
    next();
  };
}

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    '/api/health',
    '/api/login',
    '/api/register',
    '/api/reset-password',
  ];
  
  return publicRoutes.includes(path) || path.startsWith('/api/public/');
}

/**
 * Rate limiting middleware to prevent abuse
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, number[]>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this IP and filter out expired ones
    const existingRequests = (requests.get(key) || []).filter(time => time > windowStart);
    
    // Check if the number of requests exceeds the limit
    if (existingRequests.length >= maxRequests) {
      // Log rate limit exceeded
      storage.createLog({
        level: LogLevel.WARNING,
        category: LogCategory.SECURITY,
        message: 'Rate limit exceeded',
        details: JSON.stringify({
          ip: key,
          path: req.path,
          method: req.method,
          requestCount: existingRequests.length,
          maxRequests,
          windowMs
        }),
        source: 'rate-limit-middleware',
        projectId: null,
        userId: req.user?.id || null,
        sessionId: req.sessionID || null,
        duration: null,
        statusCode: 429,
        endpoint: req.path,
        tags: ['security', 'rate-limit', 'exceeded']
      }).catch(console.error);
      
      // Add retry-after header (in seconds)
      const oldestRequest = Math.min(...existingRequests);
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      
      res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter
      });
      return;
    }
    
    // Add current request to the list
    existingRequests.push(now);
    requests.set(key, existingRequests);
    
    // Add rate limit headers
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(maxRequests - existingRequests.length));
    res.set('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
    
    next();
  };
}