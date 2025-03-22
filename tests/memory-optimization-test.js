/**
 * Memory Optimization Test
 * 
 * This script tests the memory usage of the MCP tool and agent collaboration
 * after implementing memory optimizations.
 */

// Use dynamic imports to handle TypeScript files
async function importModules() {
  const vectorMemoryModule = await import('../agents/memory/vector.ts');
  const mcpToolModule = await import('../agents/tools/mcp.ts');
  
  return {
    vectorMemory: vectorMemoryModule.vectorMemory,
    registerMCPTool: mcpToolModule.registerMCPTool
  };
}

// Set up formatters for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

/**
 * Print formatted message to console
 */
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  
  switch(type) {
    case 'success':
      console.log(`${COLORS.green}[${timestamp}] ✓ ${message}${COLORS.reset}`);
      break;
    case 'error':
      console.log(`${COLORS.red}[${timestamp}] ✗ ${message}${COLORS.reset}`);
      break;
    case 'warning':
      console.log(`${COLORS.yellow}[${timestamp}] ⚠ ${message}${COLORS.reset}`);
      break;
    case 'info':
    default:
      console.log(`${COLORS.blue}[${timestamp}] ℹ ${message}${COLORS.reset}`);
      break;
  }
}

/**
 * Get the current memory usage in MB
 */
function getMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  return {
    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
  };
}

/**
 * Log memory usage
 */
function logMemoryUsage(label = 'Current') {
  const usage = getMemoryUsage();
  console.log(`${COLORS.magenta}[Memory: ${label}]${COLORS.reset} RSS: ${usage.rss} MB | Heap: ${usage.heapUsed}/${usage.heapTotal} MB`);
}

/**
 * Test questions that combine technical and real estate knowledge
 */
const testQuestions = [
  "What's the best algorithm for finding similar properties in a dataset?",
  "How should I implement spatial indexing for property searches?",
  "What database schema would be most efficient for storing property comparables?",
  "How can I optimize a nearest-neighbor query for properties within a geographic area?",
  "What machine learning approach would work best for predicting property values?",
  "How would you implement a caching system for frequently accessed property data?",
  "What's the most efficient way to store and query historical property price data?",
  "How should I design an API for real-time property market updates?",
  "What's the best way to implement geofencing for property alerts?",
  "How would you optimize database queries for property searches with multiple criteria?"
];

/**
 * Test MCP tool with memory optimizations
 */
async function testMCPMemoryOptimization() {
  try {
    // Load modules
    log('Loading modules...');
    const { vectorMemory, registerMCPTool } = await importModules();
    log('Modules loaded successfully');
    
    // Initialize
    log('Starting memory optimization test');
    logMemoryUsage('Initial');
    
    // Get MCP tool
    const mcpTool = registerMCPTool();
    log('MCP tool loaded');
    
    // Measure initial vector memory state
    const initialEntryCount = await vectorMemory.count();
    log(`Initial vector memory entries: ${initialEntryCount}`);
    
    // Track memory usage during tests
    const memorySnapshots = [];
    
    // Run test questions
    log(`Running ${testQuestions.length} test questions through MCP tool`);
    
    for (let i = 0; i < testQuestions.length; i++) {
      const question = testQuestions[i];
      log(`Processing question ${i+1}/${testQuestions.length}`);
      
      // Track memory before question
      memorySnapshots.push(getMemoryUsage());
      
      // Create test params
      const params = {
        model: 'gpt-4',
        prompt: question,
        system_message: 'You are a combined real estate and software development expert. Provide detailed answers.',
        use_vector_memory: true,
        context_integration: 'smart',
        max_response_length: 1500,
        cache_key: `test-query-${i}`,
        memory_options: {
          limit: 5,
          threshold: 0.4
        }
      };
      
      // Process question with MCP tool directly
      const result = await mcpTool.execute(params);
      
      if (result.success) {
        const responseLength = result.result?.response?.length || 0;
        log(`Question ${i+1} processed successfully (${responseLength} chars)`, 'success');
        
        // Check context utilization
        const contextUsed = result.result?.metadata?.enhancedWithContext || false;
        const contextSources = result.result?.metadata?.contextSources?.length || 0;
        log(`Context used: ${contextUsed ? 'Yes' : 'No'}, Sources: ${contextSources}`);
      } else {
        log(`Failed to process question ${i+1}: ${result.error?.message || 'Unknown error'}`, 'error');
      }
      
      // Check cache size after each iteration
      log(`Testing cache size constraint...`);
      const cacheSize = await mcpTool.getCacheSize();
      log(`Current cache size: ${cacheSize} entries`, cacheSize <= 50 ? 'success' : 'warning');
      
      // Simulate small delay between questions
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Measure final vector memory state
    const finalEntryCount = await vectorMemory.count();
    log(`Final vector memory entries: ${finalEntryCount}`);
    
    // Log memory usage at end
    logMemoryUsage('Final');
    
    // Calculate average memory usage
    const avgHeapUsed = memorySnapshots.reduce((sum, snapshot) => sum + snapshot.heapUsed, 0) / memorySnapshots.length;
    log(`Average heap usage during test: ${Math.round(avgHeapUsed * 100) / 100} MB`);
    
    // Report success
    log('Memory optimization test completed successfully', 'success');
  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run the test
testMCPMemoryOptimization().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});