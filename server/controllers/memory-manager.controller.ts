/**
 * Memory Manager Controller
 * 
 * This controller provides endpoints to monitor and optimize memory usage
 * throughout the application, including both standard Node.js memory and
 * specialized memory like vector embeddings for AI agents.
 */

import { Request, Response, NextFunction } from 'express';
import { LogCategory, LogLevel } from '@shared/schema';
import { createErrorFromUnknown } from '../errors';
import { storage } from '../storage';
import { scheduler } from '../services/scheduler.service';
import path from 'path';
import os from 'os';

// Try to dynamically import vector memory utilities if they exist
let vectorMemoryUtils: any = null;
let memoryOptimizationUtils: any = null;

// Format bytes to human readable form
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  // Handle negative values
  const isNegative = bytes < 0;
  const absBytes = Math.abs(bytes);
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  
  const formatted = parseFloat((absBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  return isNegative ? '-' + formatted : formatted;
}

// Get detailed memory stats
function getMemoryStats() {
  const memStats = process.memoryUsage();
  
  return {
    memoryUsage: {
      heapUsed: memStats.heapUsed,
      heapTotal: memStats.heapTotal,
      rss: memStats.rss,
      external: memStats.external,
      arrayBuffers: memStats.arrayBuffers,
      formatted: {
        heapUsed: formatBytes(memStats.heapUsed),
        heapTotal: formatBytes(memStats.heapTotal),
        rss: formatBytes(memStats.rss),
        external: formatBytes(memStats.external)
      }
    },
    timestamp: new Date().toISOString()
  };
}

// Helper to get vector memory stats if module is available
async function getVectorMemoryStats() {
  if (!vectorMemoryUtils) {
    return null;
  }
  
  try {
    const vectorMemory = vectorMemoryUtils.getVectorMemory?.();
    if (!vectorMemory) return null;
    
    const count = await vectorMemory.getCount();
    const approximateSize = formatBytes(count * 1536 * 4); // Estimate based on typical vector size
    
    return {
      count,
      approximate_size: approximateSize
    };
  } catch (error) {
    console.error('Error getting vector memory stats:', error);
    return null;
  }
}

// Load memory optimization utilities dynamically
async function loadMemoryUtils() {
  try {
    // Try to import the vector memory module
    try {
      // Use direct import path instead of __dirname which isn't available in ESM
      vectorMemoryUtils = await import('../../agents/memory/vector.ts');
      console.log('[MemoryManager] Successfully loaded vector memory module');
    } catch (err) {
      console.warn('[MemoryManager] Vector memory module not available:', err.message);
    }

    // Try to import memory optimization utilities
    try {
      // Use direct import path for optimization utils
      memoryOptimizationUtils = await import('../../agents/memory/optimizations.ts');
      console.log('[MemoryManager] Successfully loaded memory optimization tools');
    } catch (err) {
      console.warn('[MemoryManager] Memory optimization tools not available:', err.message);
    }

    // Schedule periodic memory optimization 
    scheduler.addJob('memory-optimization', 5, runMemoryOptimization);
    
    return true;
  } catch (error) {
    console.error('[MemoryManager] Failed to load memory utilities:', error);
    return false;
  }
}

// Function to run memory optimization
async function runMemoryOptimization() {
  try {
    const initialMemory = process.memoryUsage();
    console.log('[MemoryManager] Running scheduled memory optimization');
    
    // Check if memory usage is high (above 90%)
    const memoryUsagePercent = Math.round((initialMemory.heapUsed / initialMemory.heapTotal) * 100);
    const isHighMemoryUsage = memoryUsagePercent > 90;
    
    // Use optimizeAllMemory from optimizations.ts if available - this provides better optimization
    // with database log cleanup and other enhancements
    let optimizationResult;
    if (memoryOptimizationUtils?.optimizeAllMemory) {
      try {
        console.log('[MemoryManager] Running comprehensive memory optimization with enhanced tools');
        optimizationResult = await memoryOptimizationUtils.optimizeAllMemory();
      } catch (err) {
        console.error('[MemoryManager] Enhanced memory optimization failed:', err);
        // Fall back to basic optimization
        optimizationResult = null;
      }
    }
    
    // If the enhanced optimization failed or isn't available, fall back to basic optimization
    if (!optimizationResult) {
      // Step 1: Clean up old logs - use more aggressive time threshold when memory is high
      const logCleanupDays = isHighMemoryUsage ? 3 : 7; // 3 days when memory is high, 7 days normally
      const oldLogsDate = new Date();
      oldLogsDate.setDate(oldLogsDate.getDate() - logCleanupDays);
      
      const logStats = await storage.getLogStats();
      const deletedLogs = await storage.clearLogs({ olderThan: oldLogsDate });
      
      // Step 2: Run vector memory optimization with more aggressive settings if memory usage is high
      let vectorMemoryResult = null;
      if (memoryOptimizationUtils?.optimizeVectorMemory) {
        try {
          vectorMemoryResult = await memoryOptimizationUtils.optimizeVectorMemory();
        } catch (err) {
          console.error('[MemoryManager] Vector memory optimization failed:', err);
        }
      }
      
      // Step 3: Try to run garbage collection if available (multiple times if memory usage is high)
      let gcResult;
      if (global.gc) {
        try {
          // Run GC multiple times when memory usage is high
          if (isHighMemoryUsage) {
            for (let i = 0; i < 3; i++) {
              global.gc();
              // Small delay between GC runs
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } else {
            global.gc();
          }
          gcResult = true;
        } catch (err) {
          gcResult = { error: err.message };
        }
      } else {
        gcResult = { available: false };
      }
      
      // Measure final memory state
      const finalMemory = process.memoryUsage();
      
      // Calculate improvements
      const heapReduction = initialMemory.heapUsed - finalMemory.heapUsed;
      const rssReduction = initialMemory.rss - finalMemory.rss;
      const percentReduction = initialMemory.heapUsed > 0 
        ? Math.round((heapReduction / initialMemory.heapUsed) * 100) 
        : 0;
      
      // Create standard result object
      optimizationResult = {
        vectorMemory: vectorMemoryResult,
        logsCleaned: {
          initialCount: logStats.totalCount,
          removed: deletedLogs
        },
        gcPerformed: gcResult !== null,
        gcResult,
        currentMemoryUsage: {
          heapUsed: formatBytes(finalMemory.heapUsed),
          rss: formatBytes(finalMemory.rss),
          raw: finalMemory
        }
      };
      
      // Add a log entry for the optimization
      await storage.createLog({
        timestamp: new Date(),
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Memory optimization completed: ${formatBytes(heapReduction)} freed (${percentReduction}%)`,
        details: { 
          initialMemory: { 
            heapUsed: formatBytes(initialMemory.heapUsed),
            rss: formatBytes(initialMemory.rss)
          },
          finalMemory: {
            heapUsed: formatBytes(finalMemory.heapUsed),
            rss: formatBytes(finalMemory.rss)
          },
          logsCleaned: deletedLogs,
          vectorMemoryOptimized: vectorMemoryResult !== null
        },
        source: 'MemoryManager',
        userId: null,
        projectId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ["memory-optimization"]
      });
    } else {
      // Log successful enhanced optimization
      await storage.createLog({
        timestamp: new Date(),
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Enhanced memory optimization completed`,
        details: { 
          logsCleanupCount: optimizationResult.logsCleaned?.removedCount || 0,
          vectorMemoryOptimized: true,
          vectorMemoryResults: optimizationResult.vectorMemory,
          gcPerformed: optimizationResult.gcPerformed
        },
        source: 'MemoryManager',
        userId: null,
        projectId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ["memory-optimization", "enhanced"]
      });
    }
    
    // Measure final memory state for comparison
    const finalMemory = process.memoryUsage();
    
    // Calculate improvements
    const heapReduction = initialMemory.heapUsed - finalMemory.heapUsed;
    const rssReduction = initialMemory.rss - finalMemory.rss;
    const percentReduction = initialMemory.heapUsed > 0 
      ? Math.round((heapReduction / initialMemory.heapUsed) * 100) 
      : 0;
    
    return {
      status: 'success',
      optimizations: {
        initialMemory,
        finalMemory,
        improvements: {
          heapReduction: formatBytes(heapReduction),
          rssReduction: formatBytes(rssReduction),
          percentReduction: `${percentReduction}%`
        },
        ...optimizationResult
      }
    };
  } catch (error) {
    console.error('[MemoryManager] Optimization error:', error);
    return {
      status: 'error',
      message: error.message || 'Unknown error during memory optimization',
      error: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    };
  }
}

// Initialize memory manager
loadMemoryUtils().then(success => {
  if (success) {
    console.log('[MemoryManager] Initialization complete');
  } else {
    console.error('[MemoryManager] Initialization failed');
  }
});

/**
 * Get memory statistics
 */
export async function getMemoryStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Get basic memory stats
    const memStats = getMemoryStats();
    
    // Get vector memory stats if available
    const vectorMemory = await getVectorMemoryStats();
    
    // Get log statistics
    const logStats = await storage.getLogStats();
    
    // Return combined stats
    res.json({
      ...memStats,
      vectorMemory,
      logs: logStats,
    });
  } catch (error) {
    next(createErrorFromUnknown(error, 'Failed to get memory statistics'));
  }
}

/**
 * Get system memory statistics - alternative endpoint used by the system monitor
 */
export async function getSystemMemoryStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // This is the same as getMemoryStatsHandler, just exposed at a different URL
    // Get basic memory stats
    const memStats = getMemoryStats();
    
    // Get vector memory stats if available
    const vectorMemory = await getVectorMemoryStats();
    
    // Get log statistics
    const logStats = await storage.getLogStats();
    
    // Return combined stats
    res.json({
      ...memStats,
      vectorMemory,
      logs: logStats,
    });
  } catch (error) {
    next(createErrorFromUnknown(error, 'Failed to get system memory statistics'));
  }
}

/**
 * Run memory optimization
 */
export async function optimizeMemoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await runMemoryOptimization();
    res.json(result);
  } catch (error) {
    next(createErrorFromUnknown(error, 'Memory optimization failed'));
  }
}

/**
 * Run enhanced memory optimization with database cleanup
 */
export async function enhancedOptimizeMemoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!memoryOptimizationUtils?.optimizeAllMemory) {
      return res.status(404).json({
        status: 'error',
        message: 'Enhanced memory optimization is not available'
      });
    }
    
    console.log('[MemoryManager] Running enhanced memory optimization via API');
    
    // Get initial memory stats for comparison
    const initialMemory = process.memoryUsage();
    
    // Run enhanced optimization
    const optimizationResult = await memoryOptimizationUtils.optimizeAllMemory();
    
    // Get final memory stats
    const finalMemory = process.memoryUsage();
    
    // Calculate improvements
    const heapReduction = initialMemory.heapUsed - finalMemory.heapUsed;
    const rssReduction = initialMemory.rss - finalMemory.rss;
    const percentReduction = initialMemory.heapUsed > 0 
      ? Math.round((heapReduction / initialMemory.heapUsed) * 100) 
      : 0;
    
    // Create success response
    res.json({
      status: 'success',
      message: `Enhanced memory optimization completed: ${formatBytes(heapReduction)} freed (${percentReduction}%)`,
      optimization: {
        initialMemory: {
          heapUsed: formatBytes(initialMemory.heapUsed),
          rss: formatBytes(initialMemory.rss),
          raw: initialMemory
        },
        finalMemory: {
          heapUsed: formatBytes(finalMemory.heapUsed),
          rss: formatBytes(finalMemory.rss),
          raw: finalMemory
        },
        improvements: {
          heapReduction: formatBytes(heapReduction),
          rssReduction: formatBytes(rssReduction),
          percentReduction: `${percentReduction}%`,
          actualReduction: heapReduction
        },
        details: optimizationResult
      }
    });
  } catch (error) {
    next(createErrorFromUnknown(error, 'Enhanced memory optimization failed'));
  }
}

/**
 * Get system health status
 */
export async function getSystemHealthHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Get CPU load averages (1, 5, 15 minutes)
    const loadAvg = os.loadavg();
    
    // Get system uptime (in seconds)
    const uptime = os.uptime();
    
    // Format uptime into days, hours, minutes
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const uptimeFormatted = `${days}d ${hours}h ${minutes}m`;
    
    // Get CPU info
    const cpus = os.cpus();
    const cpuCount = cpus.length;
    const cpuModel = cpus[0]?.model || 'Unknown';
    
    // Get memory info
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
    
    // Get scheduler info
    const schedulerStats = scheduler.getStatus();
    
    res.json({
      status: 'ok',
      cpu: {
        model: cpuModel,
        count: cpuCount,
        loadAverage: {
          '1m': loadAvg[0].toFixed(2),
          '5m': loadAvg[1].toFixed(2),
          '15m': loadAvg[2].toFixed(2)
        }
      },
      memory: {
        total: formatBytes(totalMem),
        free: formatBytes(freeMem),
        usage: `${memoryUsage.toFixed(1)}%`
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        uptime: uptimeFormatted,
        hostname: os.hostname()
      },
      scheduler: {
        jobs: schedulerStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(createErrorFromUnknown(error, 'Failed to get system health'));
  }
}

/**
 * Backup system health endpoint that provides simplified system health data
 * This serves as a fallback when the primary endpoint fails
 */
export async function getSystemHealthBackupHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // Get current memory usage
    const memoryUsage = process.memoryUsage();
    const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoryPercentage = Math.round((usedMemoryMB / totalMemoryMB) * 100);
    
    // Get uptime information
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const formattedUptime = `${uptimeHours}h ${uptimeMinutes}m`;
    
    // Try to get log statistics
    let logStats;
    try {
      logStats = await storage.getLogStats();
    } catch (err) {
      console.error('Could not fetch log stats for backup health endpoint', err);
      logStats = {
        totalCount: 0,
        countByLevel: {},
        countByCategory: {},
        recentErrors: []
      };
    }
    
    // Assemble health data
    const healthData = {
      status: 'online (backup)',
      uptime: {
        seconds: uptime,
        formatted: formattedUptime
      },
      memory: {
        used: usedMemoryMB,
        total: totalMemoryMB,
        percentage: memoryPercentage,
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      logs: {
        totalCount: logStats.totalCount,
        countByLevel: logStats.countByLevel,
        countByCategory: logStats.countByCategory,
        recentErrorCount: logStats.recentErrors?.length || 0
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(healthData);
  } catch (error) {
    console.error("Error generating backup system health data:", error);
    // Provide minimalist response if everything fails
    res.json({ 
      status: 'degraded',
      error: "Limited health data available",
      timestamp: new Date().toISOString()
    });
  }
}