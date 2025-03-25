/**
 * Memory Optimization Utilities
 * 
 * This module provides utilities for optimizing memory usage in the agent system,
 * with a focus on vector memory and cache management.
 */

import { vectorMemory } from './vector';
import { storage } from '../../server/storage';
import { LogCategory, LogLevel } from '../../shared/schema';

/**
 * Helper function to format bytes to human-readable format
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Optimize vector memory by cleaning up old or unused entries
 * @returns Statistics about the optimization
 */
export async function optimizeVectorMemory() {
  try {
    // vectorMemory is already imported from './vector'
    
    // Get initial stats
    const initialCount = await vectorMemory.count();
    const initialStats = {
      totalCount: initialCount,
      estimatedSize: initialCount * 1536 * 4 // Rough estimate: entries * dimension * 4 bytes per float
    };
    
    // Step 1: Clean up expired entries
    let removeExpiredResult = { count: 0 };
    if (typeof vectorMemory.removeExpired === 'function') {
      removeExpiredResult = await vectorMemory.removeExpired();
    }
    
    // Step 2: Clean up duplicates (if any) with more aggressive threshold
    // when there are a lot of entries (> 100)
    let removeDuplicatesResult = { count: 0 };
    if (typeof vectorMemory.removeDuplicates === 'function') {
      const similarityThreshold = initialCount > 100 ? 0.92 : 0.95;
      removeDuplicatesResult = await vectorMemory.removeDuplicates(similarityThreshold);
    }
    
    // Step 3: Compact storage if supported
    let compactionResult = null;
    if (typeof vectorMemory.compact === 'function') {
      compactionResult = await vectorMemory.compact();
    }
    
    // Step 4: Perform a more aggressive pruning if we still have a lot of entries
    const midwayCount = await vectorMemory.count();
    if (midwayCount > 100 && initialCount - midwayCount < 10) {
      // If we've removed fewer than 10 entries and still have > 100, be more aggressive
      console.log('[MemoryOptimizer] Performing aggressive cleanup due to high entry count');
      
      if (typeof vectorMemory.removeDuplicates === 'function') {
        // Use a more aggressive similarity threshold
        const aggressiveResult = await vectorMemory.removeDuplicates(0.85);
        removeDuplicatesResult.count += aggressiveResult.count;
      }
    }
    
    // Get final stats
    const finalCount = await vectorMemory.count();
    const finalStats = {
      totalCount: finalCount,
      estimatedSize: finalCount * 1536 * 4
    };
    
    return {
      initialCount: initialStats.totalCount,
      finalCount: finalStats.totalCount,
      entriesRemoved: initialStats.totalCount - finalStats.totalCount,
      expiredRemoved: removeExpiredResult?.count || 0,
      duplicatesRemoved: removeDuplicatesResult?.count || 0,
      compactionPerformed: compactionResult !== null,
      memoryReduction: {
        beforeSize: initialStats.estimatedSize || 0,
        afterSize: finalStats.estimatedSize || 0,
        reduction: (initialStats.estimatedSize || 0) - (finalStats.estimatedSize || 0)
      }
    };
  } catch (error) {
    console.error('Error optimizing vector memory:', error);
    return {
      error: error.message || 'Unknown error during vector memory optimization',
      success: false
    };
  }
}

/**
 * Cleans up old or unused cache entries to free memory
 * @param cache The cache instance to optimize
 * @param options Options for cache cleanup
 * @returns Statistics about the optimization
 */
export function optimizeCache(cache: any, options: {
  maxAge?: number;
  maxItems?: number;
  priorityFn?: (key: string, value: any) => number;
}) {
  // Default options
  const opts = {
    maxAge: 1000 * 60 * 60,  // 1 hour
    maxItems: 1000,
    ...options
  };
  
  try {
    // Backup stats before cleanup
    const initialSize = cache.size ? cache.size() : 
                       (cache.store ? Object.keys(cache.store).length : 0);
    
    // Perform cleanup based on cache type
    let cleanupCount = 0;
    
    // Handle Map-like caches
    if (cache.clear && cache.delete && cache.entries) {
      // Check for TTL-based expiration
      if (opts.maxAge && cache.entries) {
        const now = Date.now();
        const entriesToDelete = [];
        
        for (const [key, entry] of cache.entries()) {
          const timestamp = entry.timestamp || entry.created || entry.time || 0;
          if (now - timestamp > opts.maxAge) {
            entriesToDelete.push(key);
          }
        }
        
        entriesToDelete.forEach(key => {
          cache.delete(key);
          cleanupCount++;
        });
      }
      
      // Check for size-based cleanup
      if (opts.maxItems && cache.size && cache.size() > opts.maxItems) {
        // Get all entries and sort by priority function or timestamp
        const entries = Array.from(cache.entries());
        const sortedEntries = opts.priorityFn 
          ? entries.sort((a, b) => opts.priorityFn!(a[0], a[1]) - opts.priorityFn!(b[0], b[1]))
          : entries.sort((a, b) => {
              const aTime = a[1].timestamp || a[1].created || a[1].time || 0;
              const bTime = b[1].timestamp || b[1].created || b[1].time || 0;
              return aTime - bTime;
            });
        
        // Remove oldest entries until we're under maxItems
        const entriesToRemove = sortedEntries.slice(0, cache.size() - opts.maxItems);
        entriesToRemove.forEach(([key]) => {
          cache.delete(key);
          cleanupCount++;
        });
      }
    }
    // Handle object-based caches
    else if (cache.store && typeof cache.store === 'object') {
      const store = cache.store;
      const keys = Object.keys(store);
      
      // Check for TTL-based expiration
      if (opts.maxAge) {
        const now = Date.now();
        keys.forEach(key => {
          const entry = store[key];
          const timestamp = entry.timestamp || entry.created || entry.time || 0;
          if (now - timestamp > opts.maxAge) {
            delete store[key];
            cleanupCount++;
          }
        });
      }
      
      // Check for size-based cleanup
      if (opts.maxItems && keys.length > opts.maxItems) {
        const entries = keys.map(key => ({ key, entry: store[key] }));
        const sortedEntries = opts.priorityFn
          ? entries.sort((a, b) => opts.priorityFn!(a.key, a.entry) - opts.priorityFn!(b.key, b.entry))
          : entries.sort((a, b) => {
              const aTime = a.entry.timestamp || a.entry.created || a.entry.time || 0;
              const bTime = b.entry.timestamp || b.entry.created || b.entry.time || 0;
              return aTime - bTime;
            });
            
        const entriesToRemove = sortedEntries.slice(0, keys.length - opts.maxItems);
        entriesToRemove.forEach(({ key }) => {
          delete store[key];
          cleanupCount++;
        });
      }
    }
    
    // Get stats after cleanup
    const finalSize = cache.size ? cache.size() : 
                      (cache.store ? Object.keys(cache.store).length : 0);
    
    return {
      initialSize,
      finalSize,
      entriesRemoved: cleanupCount,
      percentReduction: initialSize > 0 ? Math.round((cleanupCount / initialSize) * 100) : 0
    };
  } catch (error) {
    console.error('Error optimizing cache:', error);
    return {
      error: error.message || 'Unknown error during cache optimization',
      success: false
    };
  }
}

/**
 * Clean up old and unnecessary logs from the database 
 * @param options Options for log cleanup
 * @returns Statistics about the cleanup
 */
export async function cleanupDatabaseLogs(options: {
  maxAgeDays?: number;
  keepErrors?: boolean;
  maxPerCategory?: number;
} = {}) {
  try {
    // Default options
    const opts = {
      maxAgeDays: 7, // Keep logs for 7 days by default
      keepErrors: true, // Always keep error logs
      maxPerCategory: 1000, // Keep at most 1000 logs per category
      ...options
    };
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - opts.maxAgeDays);
    
    // Get log statistics before cleanup
    const initialStats = await storage.getLogStats();
    
    // Get logs older than cutoff date except errors if keepErrors is true
    const oldLogs = await storage.getLogs({
      endDate: cutoffDate,
      level: opts.keepErrors ? [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARNING] : undefined
    });
    
    let removedCount = 0;
    
    // Delete old logs
    for (const log of oldLogs) {
      await storage.deleteLogById(log.id);
      removedCount++;
      
      // Log progress for large operations
      if (removedCount % 100 === 0) {
        console.log(`[LogCleaner] Removed ${removedCount}/${oldLogs.length} old logs`);
      }
    }
    
    // For each category, keep only the most recent maxPerCategory logs
    const categories = Object.values(LogCategory);
    let categoryRemovalCount = 0;
    
    for (const category of categories) {
      const logsInCategory = await storage.getLogs({ category: category as LogCategory });
      
      if (logsInCategory.length > opts.maxPerCategory) {
        // Sort logs by timestamp (newest first)
        logsInCategory.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Skip the first maxPerCategory logs (newest ones)
        const logsToRemove = logsInCategory.slice(opts.maxPerCategory);
        
        // Remove excess logs
        for (const log of logsToRemove) {
          // Don't remove error logs if keepErrors is true
          if (opts.keepErrors && log.level === LogLevel.ERROR) {
            continue;
          }
          
          await storage.deleteLogById(log.id);
          categoryRemovalCount++;
          removedCount++;
        }
      }
    }
    
    // Get log statistics after cleanup
    const finalStats = await storage.getLogStats();
    
    return {
      initialCount: initialStats.totalCount,
      finalCount: finalStats.totalCount,
      removedCount: removedCount,
      removedOldLogs: oldLogs.length,
      removedPerCategory: categoryRemovalCount,
      percentReduction: initialStats.totalCount > 0 
        ? Math.round((removedCount / initialStats.totalCount) * 100) 
        : 0
    };
  } catch (error) {
    console.error('Error cleaning up database logs:', error);
    return {
      error: error.message || 'Unknown error during log cleanup',
      success: false
    };
  }
}

/**
 * Optimizes all memory-related systems
 * @returns Combined stats about the optimizations
 */
export async function optimizeAllMemory() {
  const vectorMemoryResult = await optimizeVectorMemory();
  
  // Clean up database logs
  const logsCleanupResult = await cleanupDatabaseLogs();
  
  // Force garbage collection if available
  let gcResult = null;
  if (global.gc) {
    try {
      global.gc();
      gcResult = true;
    } catch (err) {
      gcResult = { error: err.message };
    }
  }
  
  // Measure memory usage after optimizations
  const memoryUsage = process.memoryUsage();
  const heapUsed = formatBytes(memoryUsage.heapUsed);
  const rss = formatBytes(memoryUsage.rss);
  
  return {
    vectorMemory: vectorMemoryResult,
    logsCleaned: logsCleanupResult,
    gcPerformed: gcResult !== null,
    gcResult,
    currentMemoryUsage: {
      heapUsed,
      rss,
      raw: memoryUsage
    }
  };
}