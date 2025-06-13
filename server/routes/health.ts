import express from 'express';
import { db } from '../db';
import { cache } from '../services/cache/cache';

const router = express.Router();

router.get('/health', async (req, res) => {
  // DB health
  let dbHealthy = false;
  try {
    await db.execute('SELECT 1');
    dbHealthy = true;
  } catch (e) {
    dbHealthy = false;
  }

  // Cache health
  let cacheHealthy = false;
  try {
    cache.set('healthcheck', 'ok', 5);
    cacheHealthy = cache.get('healthcheck') === 'ok';
  } catch (e) {
    cacheHealthy = false;
  }

  res.status(dbHealthy && cacheHealthy ? 200 : 500).json({
    status: dbHealthy && cacheHealthy ? 'ok' : 'error',
    db: dbHealthy,
    cache: cacheHealthy,
    timestamp: new Date().toISOString(),
  });
});

export default router;
