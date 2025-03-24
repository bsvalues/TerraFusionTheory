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
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    
    // Step 1: Clean up old logs (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const logStats = await storage.getLogStats();
    const deletedLogs = await storage.clearLogs({ olderThan: sevenDaysAgo });
    
    // Step 2: Run vector memory optimization if available
    let vectorMemoryResult = null;
    if (memoryOptimizationUtils?.optimizeVectorMemory) {
      try {
        vectorMemoryResult = await memoryOptimizationUtils.optimizeVectorMemory();
      } catch (err) {
        console.error('[MemoryManager] Vector memory optimization failed:', err);
      }
    }
    
    // Step 3: Try to run garbage collection if available
    let gcResult;
    if (global.gc) {
      try {
        global.gc();
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
        vectorMemory: vectorMemoryResult,
        logsCleaned: {
          countBefore: logStats.totalCount,
          deleted: deletedLogs
        },
        gcRun: gcResult
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