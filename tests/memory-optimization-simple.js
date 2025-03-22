/**
 * Simple Memory Optimization Test
 * 
 * This script provides a basic test for memory optimization techniques
 * implemented in the IntelligentEstate platform.
 */

/**
 * Get current memory usage
 */
function getMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  return {
    rss: Math.round(memoryUsage.rss / 1024 / 1024), // RSS in MB
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // Total heap in MB
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // Used heap in MB
    external: Math.round(memoryUsage.external / 1024 / 1024) // External memory in MB
  };
}

/**
 * Print formatted log message
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colorCode = type === 'info' ? '\x1b[36m' : // cyan
                   type === 'success' ? '\x1b[32m' : // green
                   type === 'warning' ? '\x1b[33m' : // yellow
                   type === 'error' ? '\x1b[31m' : // red
                   '\x1b[0m'; // default
  
  console.log(`${colorCode}[${timestamp}] [${type.toUpperCase()}] ${message}\x1b[0m`);
}

/**
 * Create a simple cache implementation to test memory constraints
 */
class TestCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 60 * 1000; // 1 minute default
    this.cache = new Map();
    this.usageOrder = []; // For LRU implementation
    
    log(`Created cache with maxSize=${this.maxSize}, defaultTTL=${this.defaultTTL}ms`);
  }
  
  /**
   * Add entry to cache with memory optimization checks
   */
  set(key, value, ttl = this.defaultTTL) {
    // Check cache size limit (LRU eviction)
    if (this.cache.size >= this.maxSize) {
      // Get the least recently used key
      const lruKey = this.usageOrder[0];
      this.cache.delete(lruKey);
      this.removeFromUsageOrder(lruKey);
      log(`Cache full: Evicted key "${lruKey}" (LRU)`, 'warning');
    }
    
    // Optimize large string values
    let optimizedValue = value;
    if (typeof value === 'string' && value.length > 1000) {
      optimizedValue = value.substring(0, 1000) + '...';
      log(`Optimized large string value for key "${key}" (${value.length} -> ${optimizedValue.length} chars)`, 'info');
    }
    
    // Store entry with expiration
    const now = Date.now();
    this.cache.set(key, {
      value: optimizedValue,
      expiresAt: now + ttl,
      createdAt: now,
      accessCount: 0
    });
    
    // Update usage order (most recently used at the end)
    this.usageOrder.push(key);
    
    return true;
  }
  
  /**
   * Get entry from cache with TTL check
   */
  get(key) {
    const entry = this.cache.get(key);
    
    // Not found
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      // Expired - remove and return null
      this.cache.delete(key);
      this.removeFromUsageOrder(key);
      log(`Expired key "${key}" removed from cache`, 'info');
      return null;
    }
    
    // Update usage info
    entry.accessCount++;
    this.removeFromUsageOrder(key);
    this.usageOrder.push(key);
    
    return entry.value;
  }
  
  /**
   * Helper to update LRU order
   */
  removeFromUsageOrder(key) {
    const index = this.usageOrder.indexOf(key);
    if (index !== -1) {
      this.usageOrder.splice(index, 1);
    }
  }
  
  /**
   * Clean expired entries
   */
  cleanup() {
    const now = Date.now();
    let removedCount = 0;
    
    // Check all entries for expiration
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.removeFromUsageOrder(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      log(`Cleanup: Removed ${removedCount} expired entries`, 'success');
    }
    
    return removedCount;
  }
  
  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

/**
 * Run cache optimization tests
 */
async function runCacheTest() {
  log('Starting cache optimization test...', 'info');
  
  // Log initial memory usage
  const initialMemory = getMemoryUsage();
  log(`Initial memory usage: RSS=${initialMemory.rss}MB, Heap=${initialMemory.heapUsed}MB`, 'info');
  
  // Create test cache with size limit
  const cache = new TestCache({ maxSize: 50, defaultTTL: 5000 });
  
  // Add test data (including some large entries)
  log('Adding test data to cache...', 'info');
  for (let i = 0; i < 100; i++) {
    // Every 10th entry will be a large one
    const isLarge = i % 10 === 0;
    const value = isLarge
      ? 'A'.repeat(10000) + i // Large value (10KB)
      : `Value ${i}`; // Small value
    
    // Add with shorter TTL for some entries
    const ttl = i % 3 === 0 ? 2000 : 10000;
    cache.set(`key${i}`, value, ttl);
  }
  
  // Log memory after adding data
  const afterAddMemory = getMemoryUsage();
  log(`Memory after adding data: RSS=${afterAddMemory.rss}MB, Heap=${afterAddMemory.heapUsed}MB`, 'info');
  log(`Cache size: ${cache.size()} entries`, 'info');
  
  // Access some items to update LRU order
  log('Accessing some cache entries...', 'info');
  for (let i = 0; i < 30; i++) {
    if (i % 3 === 0) {
      const key = `key${i * 2}`; // Access even numbered keys
      const value = cache.get(key);
      log(`Accessed ${key}: ${value ? 'hit' : 'miss'}`, 'info');
    }
  }
  
  // Wait for some entries to expire
  log('Waiting for some entries to expire...', 'success');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Run cleanup
  const removedCount = cache.cleanup();
  log(`Cleanup removed ${removedCount} expired entries`, 'success');
  log(`Cache size after cleanup: ${cache.size()} entries`, 'info');
  
  // Add more data (should trigger LRU eviction)
  log('Adding more data to trigger LRU eviction...', 'info');
  for (let i = 0; i < 30; i++) {
    cache.set(`newKey${i}`, `New value ${i}`);
  }
  
  // Get final memory usage
  const finalMemory = getMemoryUsage();
  log(`Final memory usage: RSS=${finalMemory.rss}MB, Heap=${finalMemory.heapUsed}MB`, 'info');
  log(`Cache size: ${cache.size()} entries`, 'info');
  
  // Calculate and log memory efficiency
  const memoryPerEntry = finalMemory.heapUsed / cache.size();
  log(`Memory efficiency: ~${memoryPerEntry.toFixed(2)}MB per cache entry`, 'success');
  
  return {
    initialMemory,
    finalMemory,
    cacheSize: cache.size(),
    memoryPerEntry
  };
}

/**
 * Run memory optimization tests
 */
async function runMemoryOptimizationTests() {
  log('MEMORY OPTIMIZATION TESTS', 'success');
  log('=======================', 'success');
  
  try {
    // Run cache test
    log('\nRunning cache optimization test...', 'info');
    const cacheResults = await runCacheTest();
    
    // Log overall results
    log('\nOVERALL RESULTS', 'success');
    log('==============', 'success');
    log(`Initial memory usage: ${cacheResults.initialMemory.rss}MB RSS, ${cacheResults.initialMemory.heapUsed}MB Heap`, 'success');
    log(`Final memory usage: ${cacheResults.finalMemory.rss}MB RSS, ${cacheResults.finalMemory.heapUsed}MB Heap`, 'success');
    log(`Memory per cache entry: ~${cacheResults.memoryPerEntry.toFixed(2)}MB`, 'success');
    
    return {
      success: true,
      results: {
        cacheResults
      }
    };
  } catch (error) {
    log(`Error running memory optimization tests: ${error.message}`, 'error');
    console.error(error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runMemoryOptimizationTests()
    .then(results => {
      if (results.success) {
        log('Memory optimization tests completed successfully!', 'success');
      } else {
        log('Memory optimization tests failed!', 'error');
      }
    })
    .catch(error => {
      log(`Unexpected error in memory optimization tests: ${error.message}`, 'error');
      console.error(error);
    });
}

module.exports = {
  runMemoryOptimizationTests,
  runCacheTest,
  TestCache,
  getMemoryUsage
};