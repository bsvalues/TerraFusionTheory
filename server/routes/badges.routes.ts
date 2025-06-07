import { Router } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get all available badges
router.get('/badges', asyncHandler(async (req, res) => {
  const badges = await storage.getAllBadges();
  res.json(badges);
}));

// Get user's badges with progress
router.get('/users/:userId/badges', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const badges = await storage.getUserBadgesWithDetails(userId);
  res.json(badges);
}));

// Award a badge to a user
router.post('/users/:userId/badges/:badgeId', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const badgeId = parseInt(req.params.badgeId);
  
  if (isNaN(userId) || isNaN(badgeId)) {
    return res.status(400).json({ error: 'Invalid user ID or badge ID' });
  }
  
  const { progress = 100, metadata = {} } = req.body;
  
  const userBadge = await storage.awardBadge(userId, badgeId, progress, metadata);
  res.json(userBadge);
}));

// Update badge progress
router.patch('/users/:userId/badges/:badgeId', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId);
  const badgeId = parseInt(req.params.badgeId);
  
  if (isNaN(userId) || isNaN(badgeId)) {
    return res.status(400).json({ error: 'Invalid user ID or badge ID' });
  }
  
  const { progress, metadata } = req.body;
  
  const userBadge = await storage.updateBadgeProgress(userId, badgeId, progress, metadata);
  res.json(userBadge);
}));

export function registerBadgesRoutes(app: any): void {
  app.use('/api', router);
  console.log('[BadgesRoutes] Badge routes registered');
}

export default router;