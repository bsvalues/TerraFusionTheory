/**
 * Memory Optimization Utilities
 * 
 * This module provides utilities for optimizing memory usage in the agent system,
 * with a focus on vector memory and cache management.
 */

import { vectorMemory } from './vector';

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
    
    // Step 2: Clean up duplicates (if any)
    let removeDuplicatesResult = { count: 0 };
    if (typeof vectorMemory.removeDuplicates === 'function') {
      removeDuplicatesResult = await vectorMemory.removeDuplicates();
    }
    
    // Step 3: Compact storage if supported
    let compactionResult = null;
    if (typeof vectorMemory.compact === 'function') {
      compactionResult = await vectorMemory.compact();
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
 * Optimizes all memory-related systems
 * @returns Combined stats about the optimizations
 */
export async function optimizeAllMemory() {
  const vectorMemoryResult = await optimizeVectorMemory();
  
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
  
  return {
    vectorMemory: vectorMemoryResult,
    gcPerformed: gcResult !== null,
    gcResult
  };
}