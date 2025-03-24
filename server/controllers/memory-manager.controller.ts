/**
 * Memory Manager Controller
 * 
 * This controller manages memory optimization and cleanup tasks to keep
 * application memory usage under control.
 */

import { Request, Response } from 'express';
import { storage } from '../storage';
import { LogCategory, LogLevel } from '../../shared/schema';
import { ValidationError, ServiceError } from '../errors';

// Import vector memory optimization components if available
let vectorMemoryEnhancer: any = null;
let vectorMemory: any = null;
let optimizedLogger: any = null;

// Dynamically import memory optimization tools
async function loadMemoryTools() {
  try {
    // Try to import vector memory enhancer
    const vectorEnhancerModule = await import('../../agents/memory/vector-enhancer');
    vectorMemoryEnhancer = vectorEnhancerModule.vectorMemoryEnhancer;
    
    // Try to import vector memory
    const vectorModule = await import('../../agents/memory/vector');
    vectorMemory = vectorModule.vectorMemory;
    
    // Try to import optimized logger
    const optLoggerModule = await import('../services/optimized-logging');
    optimizedLogger = optLoggerModule.optimizedLogger;
    
    console.log('[MemoryManager] Successfully loaded memory optimization tools');
    return true;
  } catch (error) {
    console.error('[MemoryManager] Error loading memory optimization tools:', error);
    return false;
  }
}

// Initialize memory tools 
loadMemoryTools().then(success => {
  if (success) {
    // Schedule regular memory optimization
    setInterval(runMemoryOptimization, 5 * 60 * 1000); // Every 5 minutes
  }
});

/**
 * Run all memory optimization procedures
 */
export async function runMemoryOptimization(): Promise<{
  status: string;
  optimizations: Record<string, any>;
}> {
  const optimizations: Record<string, any> = {};
  
  try {
    // Log start of optimization
    console.log('[MemoryManager] Running memory optimization cycle');
    
    // Measure initial memory stats
    const initialMemory = getMemoryUsage();
    optimizations.initialMemory = initialMemory;
    
    // 1. Run vector memory optimization if available
    if (vectorMemoryEnhancer) {
      try {
        console.log('[MemoryManager] Running vector memory optimization');
        const vectorResult = await vectorMemoryEnhancer.optimizeMemory();
        optimizations.vectorMemory = vectorResult;
      } catch (error) {
        console.error('[MemoryManager] Error in vector memory optimization:', error);
        optimizations.vectorMemory = { error: String(error) };
      }
    }
    
    // 2. Clear old logs
    try {
      console.log('[MemoryManager] Clearing old logs');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // First, count logs to be deleted
      const logsToDelete = await storage.getLogs({
        endDate: thirtyDaysAgo,
        level: [LogLevel.DEBUG, LogLevel.INFO]
      });
      
      // Then clear them
      const clearedCount = await storage.clearLogs({ 
        olderThan: thirtyDaysAgo,
        level: LogLevel.DEBUG
      });
      
      optimizations.logsCleaned = {
        countBefore: logsToDelete.length,
        deleted: clearedCount
      };
    } catch (error) {
      console.error('[MemoryManager] Error in logs cleanup:', error);
      optimizations.logsCleaned = { error: String(error) };
    }
    
    // 3. Run garbage collection if possible
    if (global.gc) {
      try {
        console.log('[MemoryManager] Running manual garbage collection');
        global.gc();
        optimizations.gcRun = true;
      } catch (error) {
        console.error('[MemoryManager] Error in garbage collection:', error);
        optimizations.gcRun = { error: String(error) };
      }
    } else {
      optimizations.gcRun = { available: false };
    }
    
    // Measure final memory stats
    const finalMemory = getMemoryUsage();
    optimizations.finalMemory = finalMemory;
    
    // Calculate improvement
    const heapReduction = initialMemory.heapUsed - finalMemory.heapUsed;
    const rssReduction = initialMemory.rss - finalMemory.rss;
    
    optimizations.improvements = {
      heapReduction: formatBytes(heapReduction),
      rssReduction: formatBytes(rssReduction),
      percentReduction: heapReduction > 0 ? 
        ((heapReduction / initialMemory.heapUsed) * 100).toFixed(2) + '%' : 
        '0%'
    };
    
    // Log results
    console.log(`[MemoryManager] Memory optimization complete: ${optimizations.improvements.heapReduction} heap reduction`);
    
    if (optimizedLogger) {
      optimizedLogger.info(
        LogCategory.PERFORMANCE,
        `Memory optimization cycle completed`,
        { optimizations }
      );
    }
    
    return {
      status: 'success',
      optimizations
    };
  } catch (error) {
    console.error('[MemoryManager] Error in memory optimization:', error);
    
    if (optimizedLogger) {
      optimizedLogger.error(
        LogCategory.PERFORMANCE,
        `Memory optimization cycle failed`,
        { error }
      );
    }
    
    return {
      status: 'error',
      optimizations: {
        error: String(error)
      }
    };
  }
}

/**
 * Force run memory optimization
 */
export async function forceMemoryOptimization(req: Request, res: Response) {
  try {
    console.log('[MemoryManager] Forced memory optimization requested');
    
    // Run optimization
    const result = await runMemoryOptimization();
    
    // Return results
    return res.json({
      success: true,
      message: 'Memory optimization completed',
      ...result
    });
  } catch (error) {
    console.error('[MemoryManager] Error in forced memory optimization:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Memory optimization failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get memory stats
 */
export async function getMemoryStats(req: Request, res: Response) {
  try {
    // Get current memory usage
    const memoryUsage = getMemoryUsage();
    
    // Get vector memory stats if available
    let vectorStats = null;
    if (vectorMemory) {
      try {
        const count = await vectorMemory.count();
        vectorStats = {
          count,
          approximate_size: formatBytes(count * 1536 * 4) // Rough estimate based on embedding size
        };
      } catch (error) {
        console.error('[MemoryManager] Error getting vector memory stats:', error);
        vectorStats = { error: String(error) };
      }
    }
    
    // Get log stats
    let logStats = null;
    try {
      logStats = await storage.getLogStats();
    } catch (error) {
      console.error('[MemoryManager] Error getting log stats:', error);
      logStats = { error: String(error) };
    }
    
    // Return stats
    return res.json({
      success: true,
      memoryUsage: {
        ...memoryUsage,
        formatted: {
          heapUsed: formatBytes(memoryUsage.heapUsed),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          rss: formatBytes(memoryUsage.rss),
          external: formatBytes(memoryUsage.external)
        }
      },
      vectorMemory: vectorStats,
      logs: logStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[MemoryManager] Error getting memory stats:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to get memory stats',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get current memory usage
 */
function getMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  return {
    rss: memoryUsage.rss,
    heapTotal: memoryUsage.heapTotal,
    heapUsed: memoryUsage.heapUsed,
    external: memoryUsage.external,
    arrayBuffers: memoryUsage.arrayBuffers || 0
  };
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024));
  
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
}