/**
 * Simple Memory Optimization Test
 * 
 * This script tests the basic memory optimizations in our system
 * without relying on complex agent interactions.
 */

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

// Test data
const testQueries = [
  "What is the average home price in Grandview?",
  "How should I implement spatial indexing for property searches?",
  "What database schema is best for property listings?",
  "How can I optimize query performance for location-based searches?",
  "What are the best machine learning models for property valuation?",
  "How do I implement efficient caching for property data?",
  "What's the ideal data structure for storing property relationships?",
  "How should I design an API for real estate applications?",
  "What are the best practices for implementing geofencing?",
  "How do I optimize database queries for complex property filters?"
];

/**
 * Get current memory usage
 */
function getMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    rss: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100
  };
}

/**
 * Print formatted log message
 */
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  let color = COLORS.blue;
  
  switch(type) {
    case 'success': color = COLORS.green; break;
    case 'error': color = COLORS.red; break;
    case 'warning': color = COLORS.yellow; break;
    case 'memory': color = COLORS.magenta; break;
    default: color = COLORS.blue;
  }
  
  console.log(`${color}[${timestamp}] ${message}${COLORS.reset}`);
}

/**
 * Create a simple cache implementation to test memory constraints
 */
class TestCache {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 50;
    this.maxResponseLength = options.maxResponseLength || 1500;
    this.ttlMs = options.ttlMs || 30 * 60 * 1000; // 30 minutes
    this.cache = new Map();
    this.keyTimestamps = new Map();
    this.usageOrder = [];
  }
  
  /**
   * Add entry to cache with memory optimization checks
   */
  set(key, value) {
    // Apply max length constraint to value
    if (typeof value === 'string' && value.length > this.maxResponseLength) {
      value = value.substring(0, this.maxResponseLength);
    }
    
    // Ensure key is not too long (optimization)
    const shortKey = key.length > 30 ? key.substring(0, 30) : key;
    
    // Record access time for TTL and LRU
    this.keyTimestamps.set(shortKey, Date.now());
    
    // Update usage order for LRU
    this.removeFromUsageOrder(shortKey);
    this.usageOrder.push(shortKey);
    
    // Apply cache size constraint (LRU)
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.usageOrder[0];
      this.cache.delete(oldestKey);
      this.keyTimestamps.delete(oldestKey);
      this.usageOrder.shift();
      return `Removed oldest item: ${oldestKey}`;
    }
    
    // Store in cache
    this.cache.set(shortKey, value);
    return null;
  }
  
  /**
   * Get entry from cache with TTL check
   */
  get(key) {
    // Ensure key is not too long (optimization)
    const shortKey = key.length > 30 ? key.substring(0, 30) : key;
    
    // Check if entry exists
    if (!this.cache.has(shortKey)) {
      return null;
    }
    
    // Check TTL
    const timestamp = this.keyTimestamps.get(shortKey);
    if (Date.now() - timestamp > this.ttlMs) {
      // Entry expired
      this.cache.delete(shortKey);
      this.keyTimestamps.delete(shortKey);
      this.removeFromUsageOrder(shortKey);
      return null;
    }
    
    // Update usage order for LRU
    this.removeFromUsageOrder(shortKey);
    this.usageOrder.push(shortKey);
    
    // Return value
    return this.cache.get(shortKey);
  }
  
  /**
   * Helper to update LRU order
   */
  removeFromUsageOrder(key) {
    const index = this.usageOrder.indexOf(key);
    if (index > -1) {
      this.usageOrder.splice(index, 1);
    }
  }
  
  /**
   * Clean expired entries
   */
  cleanup() {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, timestamp] of this.keyTimestamps.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.cache.delete(key);
        this.keyTimestamps.delete(key);
        this.removeFromUsageOrder(key);
        removedCount++;
      }
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
  log('Starting cache optimization test', 'info');
  
  // Log initial memory usage
  const initialMemory = getMemoryUsage();
  log(`Initial memory - RSS: ${initialMemory.rss}MB | Heap: ${initialMemory.heapUsed}/${initialMemory.heapTotal}MB`, 'memory');
  
  // Create test cache with optimization settings
  const cache = new TestCache({
    maxEntries: 5, // Small value for testing
    maxResponseLength: 100, // Small value for testing
    ttlMs: 2000 // Short TTL for testing
  });
  
  log(`Created cache with max ${cache.maxEntries} entries, max length ${cache.maxResponseLength} chars`, 'info');
  
  // Test 1: Max entries constraint
  log('\nTest 1: Max entries constraint', 'info');
  for (let i = 0; i < 10; i++) {
    const action = cache.set(`key-${i}`, `Sample response for query ${i} with some added text to make it longer than our constraint would allow in a real-world scenario`);
    log(`Added key-${i} to cache (${action ? 'LRU removal: ' + action : 'No removal needed'})`, action ? 'warning' : 'success');
  }
  
  log(`Cache size after additions: ${cache.size()}`, cache.size() <= cache.maxEntries ? 'success' : 'error');
  
  // Test 2: Response length constraint
  log('\nTest 2: Response length constraint', 'info');
  const longValue = 'A'.repeat(500); // Create a string longer than our constraint
  cache.set('long-key', longValue);
  const retrieved = cache.get('long-key');
  log(`Original length: ${longValue.length}, Stored length: ${retrieved.length}`, 
    retrieved.length <= cache.maxResponseLength ? 'success' : 'error');
  
  // Test 3: TTL expiration
  log('\nTest 3: TTL expiration', 'info');
  cache.set('expiring-key', 'This will expire soon');
  log(`Initial cache size: ${cache.size()}`, 'info');
  log(`Waiting for cache entry to expire (2 seconds)...`, 'info');
  
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const expiredValue = cache.get('expiring-key');
  log(`Retrieved expired key: ${expiredValue === null ? 'Correctly expired' : 'Still present (FAIL)'}`, 
    expiredValue === null ? 'success' : 'error');
  
  // Test 4: Cleanup method
  log('\nTest 4: Cleanup method', 'info');
  for (let i = 20; i < 25; i++) {
    cache.set(`cleanup-key-${i}`, `Value ${i}`);
  }
  
  log(`Cache size before scheduled cleanup: ${cache.size()}`, 'info');
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  const removedCount = cache.cleanup();
  log(`Cleanup removed ${removedCount} expired entries`, 'info');
  log(`Cache size after cleanup: ${cache.size()}`, 'info');
  
  // Log final memory usage
  const finalMemory = getMemoryUsage();
  log(`\nFinal memory - RSS: ${finalMemory.rss}MB | Heap: ${finalMemory.heapUsed}/${finalMemory.heapTotal}MB`, 'memory');
  
  // Report test results
  const allTestsPassed = cache.size() <= cache.maxEntries;
  log(`\nCache optimization test ${allTestsPassed ? 'PASSED' : 'FAILED'}`, allTestsPassed ? 'success' : 'error');
}

/**
 * Run memory optimization tests
 */
async function runMemoryOptimizationTests() {
  try {
    // Print test header
    console.log('=============================================');
    console.log('  MEMORY OPTIMIZATION TEST SUITE');
    console.log('=============================================');
    
    await runCacheTest();
    
    console.log('\n=============================================');
    console.log('  TEST SUITE COMPLETED');
    console.log('=============================================');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run tests
runMemoryOptimizationTests().catch(console.error);