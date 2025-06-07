import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get all available badges
router.get('/badges', asyncHandler(async (req: Request, res: Response) => {
  const badges = await storage.getBadges();
  res.json(badges);
}));

// Get user's badges with progress
router.get('/users/:userId/badges', asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  
  const badges = await storage.getUserBadgesWithDetails(userId);
  res.json(badges);
}));

// Award a badge to a user
router.post('/users/:userId/badges/:badgeId', asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const badgeId = parseInt(req.params.badgeId);
  
  if (isNaN(userId) || isNaN(badgeId)) {
    return res.status(400).json({ error: 'Invalid user ID or badge ID' });
  }
  
  const { progress = 100, metadata = {} } = req.body;
  
  const userBadge = await storage.createUserBadge({
    userId,
    badgeId,
    progress,
    metadata,
    awardedAt: new Date()
  });
  res.json(userBadge);
}));

// Update badge progress
router.patch('/users/:userId/badges/:badgeId', asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const badgeId = parseInt(req.params.badgeId);
  
  if (isNaN(userId) || isNaN(badgeId)) {
    return res.status(400).json({ error: 'Invalid user ID or badge ID' });
  }
  
  const { progress, metadata } = req.body;
  
  // Find the user badge first
  const userBadgesData = await storage.getUserBadges(userId);
  const userBadge = userBadgesData.find(ub => ub.badgeId === badgeId);
  
  if (!userBadge) {
    return res.status(404).json({ error: 'User badge not found' });
  }
  
  const updated = await storage.updateUserBadgeProgress(userBadge.id, progress, metadata);
  res.json(updated);
}));

export function registerBadgesRoutes(app: any): void {
  app.use('/api', router);
  console.log('[BadgesRoutes] Badge routes registered');
}

export default router;