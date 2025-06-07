import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { LogLevel, LogCategory } from '../../shared/schema';

// Threshold in milliseconds for slow requests
const SLOW_REQUEST_THRESHOLD = 1000; // 1 second
const VERY_SLOW_REQUEST_THRESHOLD = 3000; // 3 seconds

/**
 * Performance logger middleware for Express
 * Logs request duration and performance metrics
 */
export function performanceLogger(req: Request, res: Response, next: NextFunction): void {
  // Skip performance logging for static assets
  if (req.path.match(/\.(js|css|map|jpg|png|svg|ico)$/)) {
    return next();
  }
  
  // Record start time
  const startTime = Date.now();
  const requestId = `req-${startTime}-${Math.floor(Math.random() * 1000)}`;
  
  // Store the request ID on the request object for potential use in error handlers
  (req as any).requestId = requestId;
  
  // Capture response details
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    // Determine log level based on response status and duration
    let level = LogLevel.INFO;
    if (res.statusCode >= 500) {
      level = LogLevel.ERROR;
    } else if (res.statusCode >= 400) {
      level = LogLevel.WARNING;
    } else if (duration > VERY_SLOW_REQUEST_THRESHOLD) {
      level = LogLevel.WARNING;
    }
    
    // Create log entry
    try {
      await storage.createLog({
        level,
        category: LogCategory.PERFORMANCE,
        message: `${req.method} ${req.path} ${res.statusCode} completed in ${duration}ms`,
        details: JSON.stringify({
          requestId,
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode,
          duration,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          timestamp: new Date().toISOString()
        }),
        source: 'performance-middleware',
        projectId: null,
        userId: (req as any).user?.id || null,
        sessionId: req.sessionID || null,
        duration,
        statusCode: res.statusCode,
        endpoint: req.path,
        tags: ['performance', `status-${res.statusCode}`, req.method.toLowerCase()]
      });
      
      // Generate alerts for slow requests
      if (duration > VERY_SLOW_REQUEST_THRESHOLD) {
        await sendWarningAlert(
          'Very Slow Request Detected',
          `${req.method} ${req.path} took ${duration}ms to complete, which exceeds the threshold of ${VERY_SLOW_REQUEST_THRESHOLD}ms.`,
          {
            requestId,
            method: req.method,
            path: req.path,
            duration,
            threshold: VERY_SLOW_REQUEST_THRESHOLD
          }
        );
      } else if (duration > SLOW_REQUEST_THRESHOLD) {
        // Just log slow requests without sending alerts
        console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms to complete`);
      }
    } catch (error) {
      console.error('Failed to log performance metrics:', error);
    }
  });
  
  next();
}

// Store last logged memory state to avoid excessive logging
let lastLoggedMemoryPercentage = 0;
let lastLogTime = 0;
const LOG_THRESHOLD_CHANGE = 5; // Only log if memory percentage changed by this amount
const MIN_LOG_INTERVAL = 900000; // Minimum 15 minutes between routine logs

/**
 * Track memory usage periodically
 * @param interval Interval in milliseconds to check memory usage
 */
export function startMemoryMonitoring(interval = 60000): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      const memoryUsage = process.memoryUsage();
      const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryPercentage = Math.round((usedMemoryMB / totalMemoryMB) * 100);
      const now = Date.now();
      
      // Only log memory usage if it changed significantly or enough time has passed
      const memoryDelta = Math.abs(memoryPercentage - lastLoggedMemoryPercentage);
      const timeSinceLastLog = now - lastLogTime;
      const significantChange = memoryDelta >= LOG_THRESHOLD_CHANGE;
      const timeThresholdMet = timeSinceLastLog >= MIN_LOG_INTERVAL;
      
      if (significantChange || timeThresholdMet || memoryPercentage > 90) {
        // Log memory usage
        await storage.createLog({
          level: LogLevel.INFO,
          category: LogCategory.PERFORMANCE,
          message: `Memory usage: ${usedMemoryMB}MB / ${totalMemoryMB}MB (${memoryPercentage}%)${
            memoryDelta > 0 ? ` (${memoryPercentage > lastLoggedMemoryPercentage ? '+' : '-'}${memoryDelta}%)` : ''
          }`,
          details: JSON.stringify({
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external,
            rss: memoryUsage.rss,
            arrayBuffers: memoryUsage.arrayBuffers,
            usedMemoryMB,
            totalMemoryMB,
            memoryPercentage,
            change: memoryDelta,
            timeSinceLastLog,
            reason: significantChange ? 'significant_change' : timeThresholdMet ? 'time_interval' : 'high_usage',
            timestamp: new Date().toISOString()
          }),
          source: 'memory-monitor',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['memory', 'system-health']
        });
        
        // Update last logged values
        lastLoggedMemoryPercentage = memoryPercentage;
        lastLogTime = now;
      }
      
      // Check for high memory usage with higher thresholds and try to free memory
      // Only alert for genuinely critical situations (98%) or when approaching limit (95%)
      if (memoryPercentage > 98) {
        // Try to trigger garbage collection
        try {
          // Note: global.gc() would be used if running Node with --expose-gc flag
          // Since we can't control Node flags, we'll try to encourage GC indirectly
          const startMemory = process.memoryUsage().heapUsed;
          // Set large arrays to null and run operations likely to trigger GC
          const tempArray = new Array(1000000);
          for (let i = 0; i < 1000000; i++) {
            tempArray[i] = i;
          }
          // Clear the array
          tempArray.length = 0;
          
          // Force several garbage collection-friendly operations
          for (let i = 0; i < 5; i++) {
            const largeObj = { data: new Array(100000).fill('x') };
            JSON.stringify(largeObj);
          }
          
          // Check if memory was freed
          const endMemory = process.memoryUsage().heapUsed;
          const freed = Math.max(0, startMemory - endMemory);
          
          // Log the memory recovery attempt
          await storage.createLog({
            level: LogLevel.WARNING,
            category: LogCategory.SYSTEM,
            message: `Attempted memory recovery, freed approximately ${Math.round(freed / 1024 / 1024)}MB`,
            details: JSON.stringify({
              before: startMemory,
              after: endMemory,
              freed
            }),
            source: 'memory-monitor',
            projectId: null,
            userId: null,
            sessionId: null,
            duration: null,
            statusCode: null,
            endpoint: null,
            tags: ['memory', 'system-health', 'gc']
          });
        } catch (gcError) {
          console.error('Failed to encourage garbage collection:', gcError);
        }
        
        await alertManager.sendAlert(
          'Critical Memory Usage',
          `Memory usage is at ${memoryPercentage}% (${usedMemoryMB}MB / ${totalMemoryMB}MB). Attempted memory recovery.`,
          'critical',
          { memoryUsage }
        );
      } else if (memoryPercentage > 95) {
        await alertManager.sendAlert(
          'High Memory Usage',
          `Memory usage is at ${memoryPercentage}% (${usedMemoryMB}MB / ${totalMemoryMB}MB).`,
          'warning',
          { memoryUsage }
        );
      }
    } catch (error) {
      console.error('Failed to log memory usage:', error);
    }
  }, interval);
}

/**
 * Stop memory monitoring
 * @param timer Timer returned by startMemoryMonitoring
 */
export function stopMemoryMonitoring(timer: NodeJS.Timeout): void {
  clearInterval(timer);
}

/**
 * Performance metrics collection helper
 * For measuring execution time of specific functions or code blocks
 */
export class PerformanceMetrics {
  private startTimes: Map<string, number> = new Map();
  
  /**
   * Start timing a task
   * @param task Task identifier
   */
  start(task: string): void {
    this.startTimes.set(task, Date.now());
  }
  
  /**
   * End timing a task and log the results
   * @param task Task identifier
   * @param category Optional log category
   * @param additionalDetails Optional additional details to log
   */
  async end(task: string, category: LogCategory = LogCategory.PERFORMANCE, additionalDetails: Record<string, any> = {}): Promise<number> {
    const startTime = this.startTimes.get(task);
    if (!startTime) {
      console.warn(`No start time found for task: ${task}`);
      return 0;
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    try {
      await storage.createLog({
        level: LogLevel.INFO,
        category,
        message: `Task "${task}" completed in ${duration}ms`,
        details: JSON.stringify({
          task,
          duration,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          ...additionalDetails
        }),
        source: 'performance-metrics',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['task-performance', task.replace(/\s+/g, '-').toLowerCase()]
      });
    } catch (error) {
      console.error(`Failed to log performance for task: ${task}`, error);
    }
    
    // Clean up
    this.startTimes.delete(task);
    
    return duration;
  }
}

// Export singleton instance for convenience
export const performanceMetrics = new PerformanceMetrics();