/**
 * Development Authentication Routes
 * 
 * These routes provide one-time authentication functionality for development purposes.
 * They should ONLY be enabled in development environments.
 */

import express, { Request, Response } from 'express';
import { devAuthService } from '../services/dev-auth.service';
import { IStorage } from '../storage';
import { OptimizedLogger } from '../services/optimized-logging';
import { LogCategory } from '@shared/schema';

const router = express.Router();

// Basic verification that we're not in production
const isDevelopment = process.env.NODE_ENV !== 'production';

// Initialize logger
const logger = OptimizedLogger.getInstance();

/**
 * Middleware to check if dev auth is enabled
 */
const checkDevAuthEnabled = (req: Request, res: Response, next: express.NextFunction) => {
  if (!isDevelopment) {
    logger.critical(
      LogCategory.SECURITY,
      'Attempted to access dev auth routes in production',
      { source: 'DevAuthRoutes', ip: req.ip, path: req.path }
    );
    return res.status(404).json({ error: 'Not found' });
  }
  next();
};

export default function registerDevAuthRoutes(app: express.Express, storage: IStorage): void {
  // Apply dev auth check middleware to all routes in this router
  router.use(checkDevAuthEnabled);
  
  /**
   * Generate a one-time auth token for a user
   * 
   * POST /api/dev-auth/token
   * Body: { userId: number, expirationMinutes?: number }
   */
  router.post('/token', async (req: Request, res: Response) => {
    const { userId, expirationMinutes } = req.body;
    
    if (!userId || typeof userId !== 'number') {
      return res.status(400).json({ error: 'Valid userId is required' });
    }
    
    // Check if user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate token
    const token = devAuthService.generateToken(
      userId, 
      expirationMinutes && typeof expirationMinutes === 'number' ? expirationMinutes : undefined
    );
    
    if (!token) {
      return res.status(500).json({ error: 'Failed to generate token' });
    }
    
    // Create login URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const loginUrl = devAuthService.createLoginUrl(token, baseUrl);
    
    return res.status(200).json({
      success: true,
      token,
      loginUrl,
      userId,
      expiresInMinutes: expirationMinutes || 60,
      user: {
        id: user.id,
        username: user.username
      }
    });
  });
  
  /**
   * Authenticate using a one-time token
   * 
   * GET /api/dev-auth/login
   * Query: { token: string }
   */
  router.get('/login', (req: Request, res: Response) => {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Valid token is required' });
    }
    
    // Validate token
    const userId = devAuthService.validateToken(token, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Set user in session
    if (req.session) {
      req.session.user = { id: userId };
      
      logger.info(
        LogCategory.SECURITY,
        `Dev auth login successful for user ${userId}`,
        { source: 'DevAuthRoutes', userId, ip: req.ip }
      );
      
      // Redirect to the homepage after successful login
      return res.redirect('/');
    } else {
      logger.error(
        LogCategory.SECURITY,
        'Session not available for dev auth login',
        { source: 'DevAuthRoutes', userId, ip: req.ip }
      );
      
      return res.status(500).json({ error: 'Session not available' });
    }
  });
  
  /**
   * Get information about a specific token
   * 
   * GET /api/dev-auth/token/:token
   */
  router.get('/token/:token', (req: Request, res: Response) => {
    const { token } = req.params;
    
    const tokenInfo = devAuthService.getTokenInfo(token);
    
    if (!tokenInfo) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    return res.status(200).json({
      success: true,
      tokenInfo
    });
  });
  
  /**
   * Get all active tokens for a user
   * 
   * GET /api/dev-auth/user/:userId/tokens
   */
  router.get('/user/:userId/tokens', (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Valid userId is required' });
    }
    
    const tokens = devAuthService.getUserTokens(userId);
    
    return res.status(200).json({
      success: true,
      tokens,
      count: tokens.length
    });
  });
  
  /**
   * Revoke a specific token
   * 
   * DELETE /api/dev-auth/token/:token
   */
  router.delete('/token/:token', (req: Request, res: Response) => {
    const { token } = req.params;
    
    const success = devAuthService.revokeToken(token);
    
    return res.status(success ? 200 : 404).json({
      success,
      message: success ? 'Token revoked successfully' : 'Token not found'
    });
  });
  
  /**
   * Revoke all tokens for a user
   * 
   * DELETE /api/dev-auth/user/:userId/tokens
   */
  router.delete('/user/:userId/tokens', (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Valid userId is required' });
    }
    
    const count = devAuthService.revokeUserTokens(userId);
    
    return res.status(200).json({
      success: true,
      message: `Revoked ${count} tokens for user ${userId}`,
      count
    });
  });
  
  /**
   * Get stats about active tokens
   * 
   * GET /api/dev-auth/stats
   */
  router.get('/stats', (req: Request, res: Response) => {
    const activeTokenCount = devAuthService.getActiveTokenCount();
    
    return res.status(200).json({
      success: true,
      activeTokenCount,
      isEnabled: isDevelopment
    });
  });
  
  // Register router
  app.use('/api/dev-auth', router);
  
  // Client-side route for token-based login
  app.get('/dev-auth', (req: Request, res: Response) => {
    if (!isDevelopment) {
      return res.status(404).send('Not found');
    }
    
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send('Missing token parameter');
    }
    
    // Redirect to the API login endpoint
    return res.redirect(`/api/dev-auth/login?token=${token}`);
  });
  
  logger.info(
    LogCategory.SYSTEM,
    'Dev auth routes registered',
    { source: 'DevAuthRoutes', enabled: isDevelopment }
  );
}