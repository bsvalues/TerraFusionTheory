/**
 * Comprehensive Memory Optimization Test
 * 
 * This script tests memory optimization features implemented in the IntelligentEstate platform,
 * focusing on vector memory, agent coordination, and logging optimizations.
 */

// Import standard modules
const path = require('path');
const fs = require('fs');

// Set up output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Dynamic module imports to avoid initialization side effects
 */
async function importModules() {
  try {
    // Import optimized logging system
    const { optimizedLogger, initializeOptimizedLogger } = 
      await import('../server/services/optimized-logging.js');
    
    // Import vector memory enhancer
    const { vectorMemoryEnhancer, initializeVectorMemoryEnhancer } = 
      await import('../agents/memory/vector-enhancer.js');
    
    // Import agent coordinator optimizations
    const { enhancedCoordinator } = 
      await import('../agents/core/agent-coordinator-optimizations.js');
    
    // Import vector memory system
    const { vectorMemory, initializeVectorMemory } = 
      await import('../agents/memory/vector.js');
    
    // Import vector memory optimizations
    const { 
      optimizeText, 
      compressEmbedding, 
      compressMetadata 
    } = await import('../agents/memory/vector-optimizations.js');
    
    // Import GIS connector optimizations
    const { gisDataOptimizer } = 
      await import('../server/services/connectors/gis-connector-optimizations.js');
    
    return {
      optimizedLogger,
      initializeOptimizedLogger,
      vectorMemoryEnhancer,
      initializeVectorMemoryEnhancer,
      enhancedCoordinator,
      vectorMemory,
      initializeVectorMemory,
      optimizeText,
      compressEmbedding,
      compressMetadata,
      gisDataOptimizer
    };
  } catch (error) {
    console.error('Error importing modules:', error);
    throw error;
  }
}

/**
 * Print formatted message to console
 */
function log(message, type = 'info') {
  const prefix = type === 'info' ? `${colors.cyan}[INFO]` :
                 type === 'success' ? `${colors.green}[SUCCESS]` :
                 type === 'warning' ? `${colors.yellow}[WARNING]` :
                 type === 'error' ? `${colors.red}[ERROR]` :
                 type === 'header' ? `${colors.bright}${colors.blue}` :
                 `[${type.toUpperCase()}]`;
  
  console.log(`${prefix} ${message}${colors.reset}`);
}

/**
 * Get the current memory usage in MB
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
 * Log memory usage
 */
function logMemoryUsage(label = 'Current') {
  const usage = getMemoryUsage();
  log(`${label} memory usage: ${usage.rss}MB RSS, ${usage.heapUsed}MB Heap`);
  return usage;
}

/**
 * Test questions that combine technical and real estate knowledge
 */
const testQuestions = [
  "What's the best way to implement a real-time property search feature?",
  "How do I properly integrate a map view for property listings?",
  "What database schema should I use for storing property information?",
  "Explain how to calculate property appreciation over time",
  "What machine learning approach would work best for predicting house prices?",
  "How can I implement a notification system for price changes in specific neighborhoods?",
  "What's the best way to handle multiple image uploads for property listings?",
  "How should I structure an API for a real estate application?",
  "What technologies would you recommend for a virtual property tour feature?",
  "How do I implement geospatial queries for neighborhood analytics?"
];

/**
 * Test MCP tool with memory optimizations
 */
async function testMCPMemoryOptimization() {
  log('TESTING MCP MEMORY OPTIMIZATION', 'header');
  log('==============================', 'header');
  
  try {
    // Load necessary modules
    const { 
      vectorMemory, 
      initializeVectorMemory,
      vectorMemoryEnhancer,
      initializeVectorMemoryEnhancer
    } = await importModules();
    
    // Initialize vector memory
    log('Initializing vector memory system...');
    await initializeVectorMemory();
    
    // Initialize vector memory enhancer
    log('Initializing vector memory enhancer...');
    await initializeVectorMemoryEnhancer({
      maxTextLength: 1000, // Reduce from default 1500
      embeddingPrecision: 4,  // Reduce from default 5
      maxEntries: 50, // Smaller max for testing
      enableTTL: true,
      defaultTTL: 5 * 60 * 1000, // 5 minutes for testing
      cacheResultLimit: 10 // Smaller cache for testing
    });
    
    // Measure initial memory
    const initialMemory = logMemoryUsage('Initial');
    
    // Create memory-intensive test data
    log('Creating test vectors and processing with/without optimization...');
    
    // Create sample embeddings
    function createSampleEmbedding(size = 1536) {
      return Array.from({ length: size }, () => Math.random() * 2 - 1);
    }
    
    // Create a large text sample
    const createLargeText = (sentences = 50) => {
      const result = [];
      for (let i = 0; i < sentences; i++) {
        result.push(`This is test sentence ${i} for memory optimization testing with varying length to simulate real content and provide multiple optimization opportunities.`);
      }
      return result.join(' ');
    };
    
    // Create large metadata
    const createLargeMetadata = () => {
      return {
        source: 'memory-test',
        timestamp: new Date().toISOString(),
        category: 'test-category',
        tags: ['memory', 'optimization', 'test', 'large', 'metadata', 'vector', 'embedding'],
        importance: Math.random(),
        confidence: Math.random(),
        extraField1: 'A'.repeat(200), // Large extra field
        extraField2: 'B'.repeat(300), // Another large field
        extraField3: { 
          nestedField1: 'C'.repeat(100),
          nestedField2: 'D'.repeat(100),
          nestedArray: Array.from({ length: 20 }, (_, i) => `item-${i}`)
        },
        debug: {
          sessionInfo: 'E'.repeat(500),
          processingTime: 123.456,
          memoryAddress: '0x' + Math.floor(Math.random() * 1000000000).toString(16)
        }
      };
    };
    
    const largeText = createLargeText(100); // Very large text
    const { optimizeText, compressEmbedding, compressMetadata } = await importModules();
    
    // Test text optimization
    const textSizeOriginal = largeText.length;
    const optimizedText = optimizeText(largeText, 1000);
    const textSizeOptimized = optimizedText.length;
    
    log(`Text optimization: ${textSizeOriginal} -> ${textSizeOptimized} chars (${Math.round((1 - textSizeOptimized/textSizeOriginal) * 100)}% reduction)`, 'success');
    
    // Test embedding optimization
    const embedding = createSampleEmbedding();
    const embeddingSizeOriginal = embedding.length * 8; // 64-bit floats
    const compressedEmbedding = compressEmbedding(embedding, 4);
    const embeddingSizeCompressed = compressedEmbedding instanceof Float32Array ? 
      compressedEmbedding.length * 4 : // 32-bit floats
      compressedEmbedding.length * 8;  // regular array
    
    log(`Embedding optimization: ${embeddingSizeOriginal} -> ${embeddingSizeCompressed} bytes (${Math.round((1 - embeddingSizeCompressed/embeddingSizeOriginal) * 100)}% reduction)`, 'success');
    
    // Test metadata optimization
    const metadata = createLargeMetadata();
    const metadataSizeOriginal = JSON.stringify(metadata).length;
    const compressedMetadata = compressMetadata(metadata, 500);
    const metadataSizeCompressed = JSON.stringify(compressedMetadata).length;
    
    log(`Metadata optimization: ${metadataSizeOriginal} -> ${metadataSizeCompressed} bytes (${Math.round((1 - metadataSizeCompressed/metadataSizeOriginal) * 100)}% reduction)`, 'success');
    
    // Add some entries to vector memory
    log('Adding test entries to vector memory...');
    for (let i = 0; i < 10; i++) {
      await vectorMemory.addEntry(
        `Test entry ${i}: ${optimizeText(largeText, 500 + i * 100)}`,
        {
          source: 'memory-test',
          timestamp: new Date().toISOString(),
          category: 'test-category',
          tags: ['memory', 'test', `entry-${i}`],
          importance: 0.5 + (i / 20),
          confidence: 0.8
        }
      );
    }
    
    // Measure memory after additions
    const afterAddMemory = logMemoryUsage('After adding entries');
    
    // Search for entries
    log('Performing vector memory searches...');
    const searchResults = await vectorMemory.search('test optimization memory', { limit: 5 });
    log(`Found ${searchResults.length} relevant memory entries`);
    
    // Run memory optimization
    log('Running memory optimization process...');
    const optimizationResult = await vectorMemoryEnhancer.optimizeMemory();
    
    log(`Memory optimization results: ${optimizationResult.entriesBefore} -> ${optimizationResult.entriesAfter} entries (${optimizationResult.memoryReduction} reduction)`, 'success');
    
    // Measure final memory
    const finalMemory = logMemoryUsage('Final');
    
    // Calculate memory savings
    const memorySavingsOptimizedText = textSizeOriginal - textSizeOptimized;
    const memorySavingsOptimizedEmbedding = embeddingSizeOriginal - embeddingSizeCompressed;
    const memorySavingsOptimizedMetadata = metadataSizeOriginal - metadataSizeCompressed;
    const totalMemorySavingsBytes = memorySavingsOptimizedText + memorySavingsOptimizedEmbedding + memorySavingsOptimizedMetadata;
    
    log(`\nMEMORY OPTIMIZATION SUMMARY:`, 'header');
    log(`Text compression saved: ${memorySavingsOptimizedText} bytes`, 'success');
    log(`Embedding compression saved: ${memorySavingsOptimizedEmbedding} bytes`, 'success');
    log(`Metadata compression saved: ${memorySavingsOptimizedMetadata} bytes`, 'success');
    log(`Total direct savings: ${totalMemorySavingsBytes} bytes (${Math.round(totalMemorySavingsBytes / 1024)} KB)`, 'success');
    log(`Overall memory delta: ${finalMemory.heapUsed - initialMemory.heapUsed} MB`, 
      finalMemory.heapUsed <= initialMemory.heapUsed ? 'success' : 'warning');
    
    return {
      success: true,
      textOptimization: {
        original: textSizeOriginal,
        optimized: textSizeOptimized,
        savings: memorySavingsOptimizedText
      },
      embeddingOptimization: {
        original: embeddingSizeOriginal,
        optimized: embeddingSizeCompressed,
        savings: memorySavingsOptimizedEmbedding
      },
      metadataOptimization: {
        original: metadataSizeOriginal,
        optimized: metadataSizeCompressed,
        savings: memorySavingsOptimizedMetadata
      },
      memoryUsage: {
        initial: initialMemory,
        afterAdd: afterAddMemory,
        final: finalMemory
      }
    };
  } catch (error) {
    log(`Error in MCP memory optimization test: ${error.message}`, 'error');
    console.error(error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run the comprehensive tests
 */
async function runMemoryOptimizationTests() {
  log('\n==========================================', 'header');
  log('COMPREHENSIVE MEMORY OPTIMIZATION TESTS', 'header');
  log('==========================================\n', 'header');
  
  try {
    // Run the simple test first for baseline
    const simpleTest = require('./memory-optimization-simple');
    log('Running simple memory test for baseline comparison...', 'info');
    const simpleResults = await simpleTest.runCacheTest();
    
    // Run the MCP memory optimization test
    log('\nRunning MCP memory optimization test...', 'info');
    const mcpResults = await testMCPMemoryOptimization();
    
    // Overall report
    log('\n==========================================', 'header');
    log('MEMORY OPTIMIZATION TEST SUMMARY', 'header');
    log('==========================================\n', 'header');
    
    if (mcpResults.success) {
      log('All memory optimization tests passed!', 'success');
      
      // Text optimization summary
      const textSavingsPct = Math.round((1 - mcpResults.textOptimization.optimized / mcpResults.textOptimization.original) * 100);
      log(`Text optimization: ${textSavingsPct}% reduction`, 'success');
      
      // Embedding optimization summary
      const embeddingSavingsPct = Math.round((1 - mcpResults.embeddingOptimization.optimized / mcpResults.embeddingOptimization.original) * 100);
      log(`Embedding optimization: ${embeddingSavingsPct}% reduction`, 'success');
      
      // Metadata optimization summary
      const metadataSavingsPct = Math.round((1 - mcpResults.metadataOptimization.optimized / mcpResults.metadataOptimization.original) * 100);
      log(`Metadata optimization: ${metadataSavingsPct}% reduction`, 'success');
      
      const avgSavingsPct = Math.round((textSavingsPct + embeddingSavingsPct + metadataSavingsPct) / 3);
      log(`Average memory reduction: ${avgSavingsPct}%`, 'success');
    } else {
      log('Some memory optimization tests failed.', 'error');
    }
    
    // Return composite results
    return {
      success: mcpResults.success && simpleResults !== undefined,
      simpleResults,
      mcpResults
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
  testMCPMemoryOptimization,
  getMemoryUsage,
  logMemoryUsage
};