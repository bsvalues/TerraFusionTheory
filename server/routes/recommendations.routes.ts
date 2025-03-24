/**
 * Recommendations API Routes
 * 
 * These routes provide access to property recommendations and related functionality.
 */

import express, { Request, Response } from 'express';
import { IStorage } from '../storage';
import * as recommendationsController from '../controllers/recommendations.controller';

const router = express.Router();

export default function registerRecommendationsRoutes(app: express.Express, storage: IStorage): void {
  /**
   * Get property recommendations
   * 
   * GET /api/recommendations
   * 
   * Query parameters:
   * - userId: User ID to personalize recommendations for (optional)
   * - limit: Maximum number of recommendations to return (default: 5)
   * - tags: Comma-separated list of tags to filter by (optional)
   */
  router.get('/', (req: Request, res: Response) => {
    return recommendationsController.getPropertyRecommendations(req, res, storage);
  });
  
  /**
   * Get popular property tags for filtering
   * 
   * GET /api/recommendations/tags
   */
  router.get('/tags', (req: Request, res: Response) => {
    return recommendationsController.getPropertyTags(req, res);
  });
  
  /**
   * Save a property as favorite for a user
   * 
   * POST /api/recommendations/favorite
   * 
   * Body:
   * - userId: User ID
   * - propertyId: Property ID
   */
  router.post('/favorite', (req: Request, res: Response) => {
    return recommendationsController.savePropertyFavorite(req, res);
  });
  
  /**
   * Remove a property from favorites for a user
   * 
   * DELETE /api/recommendations/favorite
   * 
   * Body:
   * - userId: User ID
   * - propertyId: Property ID
   */
  router.delete('/favorite', (req: Request, res: Response) => {
    return recommendationsController.removePropertyFavorite(req, res);
  });
  
  /**
   * Get personalized insights for a property
   * 
   * GET /api/recommendations/insights/:propertyId
   */
  router.get('/insights/:propertyId', (req: Request, res: Response) => {
    return recommendationsController.getPropertyInsights(req, res);
  });
  
  // Register routes
  app.use('/api/recommendations', router);
  console.log('[RecommendationsRoutes] Recommendations routes registered');
}