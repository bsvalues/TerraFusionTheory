import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { LogLevel, LogCategory } from '../../shared/schema';

const SLOW_REQUEST_THRESHOLD = 1000;
const VERY_SLOW_REQUEST_THRESHOLD = 3000;

export function performanceLogger(req: Request, res: Response, next: NextFunction): void {
  if (req.path.match(/\.(js|css|map|jpg|png|svg|ico)$/)) {
    return next();
  }
  
  const startTime = Date.now();
  const requestId = `req-${startTime}-${Math.floor(Math.random() * 1000)}`;
  
  (req as any).requestId = requestId;
  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    try {
      await storage.createLog({
        level: duration > VERY_SLOW_REQUEST_THRESHOLD ? LogLevel.WARNING : LogLevel.INFO,
        category: LogCategory.PERFORMANCE,
        message: `${req.method} ${req.path} - ${duration}ms`,
        details: JSON.stringify({
          requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date().toISOString()
        }),
        source: 'performance-middleware',
        projectId: null,
        userId: (req as any).user?.id || null,
        sessionId: req.sessionID || null,
        duration,
        statusCode: res.statusCode,
        endpoint: req.path,
        tags: ['performance', req.method.toLowerCase()]
      });
      
      if (duration > VERY_SLOW_REQUEST_THRESHOLD) {
        console.log(`[${new Date().toISOString()}] ALERT [WARNING]: Very Slow Request Detected`);
        console.log(`${req.method} ${req.path} took ${duration}ms to complete, which exceeds the threshold of ${VERY_SLOW_REQUEST_THRESHOLD}ms.`);
      } else if (duration > SLOW_REQUEST_THRESHOLD) {
        console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms to complete`);
      }
    } catch (error) {
      console.error('Failed to log performance metrics:', error);
    }
  });
  
  next();
}

let memoryMonitorInterval: NodeJS.Timeout | null = null;

export function startMemoryMonitoring(interval: number = 30000): void {
  if (memoryMonitorInterval) {
    clearInterval(memoryMonitorInterval);
  }
  
  memoryMonitorInterval = setInterval(async () => {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryPercentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
      
      if (memoryPercentage > 98) {
        try {
          if (global.gc) {
            global.gc();
          }
        } catch (gcError) {
          console.error('Failed to encourage garbage collection:', gcError);
        }
        
        console.error(`[${new Date().toISOString()}] CRITICAL: Memory usage at ${memoryPercentage}% (${usedMemoryMB}MB / ${totalMemoryMB}MB). Attempted memory recovery.`);
      } else if (memoryPercentage > 95) {
        console.warn(`[${new Date().toISOString()}] WARNING: High memory usage at ${memoryPercentage}% (${usedMemoryMB}MB / ${totalMemoryMB}MB).`);
      }
    } catch (error) {
      console.error('Failed to log memory usage:', error);
    }
  }, interval);
}

export function stopMemoryMonitoring(): void {
  if (memoryMonitorInterval) {
    clearInterval(memoryMonitorInterval);
    memoryMonitorInterval = null;
  }
}