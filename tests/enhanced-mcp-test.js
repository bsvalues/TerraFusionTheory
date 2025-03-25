/**
 * Enhanced MCP Test
 * 
 * This script tests the enhanced Model Control Protocol functionality
 * with improved context handling, hybrid response generation, and memory integration.
 * 
 * Run with: node tests/enhanced-mcp-test.js
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

// Color formatting for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m'
  }
};

// Test cases with a variety of real estate queries
const testCases = [
  {
    name: "Basic Real Estate Query",
    prompt: "What are the key factors affecting home prices in Grandview, WA?",
    options: {
      model: "gpt-4",
      context_integration: "smart"
    }
  },
  {
    name: "Analytical Market Trend",
    prompt: "How has the real estate market in Grandview changed over the past 5 years?",
    options: {
      model: "gpt-4",
      context_integration: "smart",
      memory_options: {
        limit: 5,
        threshold: 0.25
      }
    }
  },
  {
    name: "Comparison Request",
    prompt: "Compare property values in Grandview vs Sunnyside neighborhoods",
    options: {
      model: "gpt-4",
      context_integration: "smart"
    }
  },
  {
    name: "Technical Implementation Question",
    prompt: "What is the best way to implement a real-time property valuation system using machine learning?",
    options: {
      model: "gpt-4",
      context_integration: "analytical"
    }
  },
  {
    name: "No-Context Generation",
    prompt: "Write a property listing description for a 3-bedroom, 2-bathroom home in Grandview with mountain views",
    options: {
      model: "gpt-4",
      use_vector_memory: false
    }
  },
  {
    name: "Context Retrieval Only",
    prompt: "What is the average price per square foot for homes in Grandview?",
    contextOnly: true
  }
];

// Test runner
async function runEnhancedMCPTest(testCase) {
  console.log(`\n${colors.bright}${colors.fg.cyan}Running test: ${testCase.name}${colors.reset}`);
  
  try {
    const startTime = performance.now();
    
    let endpoint = '/api/mcp/enhanced';
    let requestBody = {
      prompt: testCase.prompt,
      options: testCase.options || {}
    };
    
    // For context-only tests, use the context endpoint
    if (testCase.contextOnly) {
      endpoint = '/api/mcp/context';
    }
    
    console.log(`${colors.dim}Sending request to ${endpoint}...${colors.reset}`);
    console.log(`${colors.dim}Prompt: "${testCase.prompt}"${colors.reset}`);
    
    const response = await axios.post(`http://localhost:5000${endpoint}`, requestBody);
    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);
    
    console.log(`${colors.fg.green}✓ Success (${duration}ms)${colors.reset}`);
    
    if (testCase.contextOnly) {
      // For context endpoint, summarize retrieved context
      console.log(`\n${colors.fg.blue}Context Retrieval Results:${colors.reset}`);
      if (response.data.contextResults && response.data.contextResults.length > 0) {
        console.log(`${colors.fg.blue}Found ${response.data.contextResults.length} context entries:${colors.reset}`);
        response.data.contextResults.forEach((ctx, idx) => {
          console.log(`\n${colors.fg.yellow}[${idx+1}] Score: ${ctx.score.toFixed(4)} | Source: ${ctx.source}${colors.reset}`);
          console.log(`${colors.dim}${ctx.text}${colors.reset}`);
        });
      } else {
        console.log(`${colors.fg.yellow}No context found.${colors.reset}`);
      }
    } else {
      // For enhanced MCP endpoint, show the response
      console.log(`\n${colors.fg.blue}Response:${colors.reset}`);
      console.log(response.data.result);
      
      // Show metadata about the response generation
      console.log(`\n${colors.fg.blue}Generation Metadata:${colors.reset}`);
      console.log(`${colors.dim}- Hybrid generation: ${response.data.hybridGeneration ? 'Yes' : 'No'}${colors.reset}`);
      console.log(`${colors.dim}- Vector context used: ${response.data.vectorContext.used ? 'Yes' : 'No'}${colors.reset}`);
      console.log(`${colors.dim}- Context sources: ${response.data.vectorContext.sources}${colors.reset}`);
      console.log(`${colors.dim}- Execution time: ${response.data.metadata.executionTime}ms${colors.reset}`);
      console.log(`${colors.dim}- Generation time: ${response.data.metadata.generationTime}ms${colors.reset}`);
      console.log(`${colors.dim}- Model: ${response.data.metadata.model}${colors.reset}`);
    }
    
    return { success: true, duration };
  } catch (error) {
    console.log(`${colors.fg.red}✗ Failed: ${error.message}${colors.reset}`);
    if (error.response) {
      console.log(`${colors.fg.red}Status: ${error.response.status}${colors.reset}`);
      console.log(`${colors.fg.red}Error: ${JSON.stringify(error.response.data, null, 2)}${colors.reset}`);
    }
    return { success: false, error: error.message };
  }
}

// Test MCP stats endpoint
async function testMCPStats() {
  console.log(`\n${colors.bright}${colors.fg.cyan}Fetching MCP Stats${colors.reset}`);
  
  try {
    const response = await axios.get('http://localhost:5000/api/mcp/stats');
    
    console.log(`${colors.fg.green}✓ Success${colors.reset}`);
    console.log(`\n${colors.fg.blue}MCP Statistics:${colors.reset}`);
    console.log(JSON.stringify(response.data, null, 2));
    
    return { success: true };
  } catch (error) {
    console.log(`${colors.fg.red}✗ Failed: ${error.message}${colors.reset}`);
    if (error.response) {
      console.log(`${colors.fg.red}Status: ${error.response.status}${colors.reset}`);
      console.log(`${colors.fg.red}Error: ${JSON.stringify(error.response.data, null, 2)}${colors.reset}`);
    }
    return { success: false, error: error.message };
  }
}

// Run comparison between original and enhanced MCP
async function runComparisonTest() {
  console.log(`\n${colors.bright}${colors.fg.magenta}Running Comparison Test: Original vs Enhanced MCP${colors.reset}`);
  
  const testPrompt = "What are the current real estate investment trends in Grandview?";
  
  try {
    // Test original MCP
    console.log(`\n${colors.fg.cyan}Testing Original MCP:${colors.reset}`);
    const startOriginal = performance.now();
    const originalResponse = await axios.post('http://localhost:5000/api/mcp/execute', {
      prompt: testPrompt
    });
    const endOriginal = performance.now();
    const originalDuration = (endOriginal - startOriginal).toFixed(2);
    
    console.log(`${colors.fg.green}✓ Original MCP Success (${originalDuration}ms)${colors.reset}`);
    console.log(`\n${colors.fg.blue}Original Response:${colors.reset}`);
    console.log(originalResponse.data.response);
    
    // Test enhanced MCP
    console.log(`\n${colors.fg.cyan}Testing Enhanced MCP:${colors.reset}`);
    const startEnhanced = performance.now();
    const enhancedResponse = await axios.post('http://localhost:5000/api/mcp/enhanced', {
      prompt: testPrompt,
      options: {
        context_integration: "smart"
      }
    });
    const endEnhanced = performance.now();
    const enhancedDuration = (endEnhanced - startEnhanced).toFixed(2);
    
    console.log(`${colors.fg.green}✓ Enhanced MCP Success (${enhancedDuration}ms)${colors.reset}`);
    console.log(`\n${colors.fg.blue}Enhanced Response:${colors.reset}`);
    console.log(enhancedResponse.data.result);
    
    // Compare the results
    console.log(`\n${colors.fg.yellow}Comparison Results:${colors.reset}`);
    console.log(`${colors.dim}- Original MCP execution time: ${originalDuration}ms${colors.reset}`);
    console.log(`${colors.dim}- Enhanced MCP execution time: ${enhancedDuration}ms${colors.reset}`);
    console.log(`${colors.dim}- Original response length: ${originalResponse.data.response.length} characters${colors.reset}`);
    console.log(`${colors.dim}- Enhanced response length: ${enhancedResponse.data.result.length} characters${colors.reset}`);
    
    const speedDiff = ((originalDuration - enhancedDuration) / originalDuration * 100).toFixed(2);
    console.log(`${colors.fg.cyan}Speed difference: ${speedDiff}%${colors.reset}`);
    
    return { success: true };
  } catch (error) {
    console.log(`${colors.fg.red}✗ Comparison Failed: ${error.message}${colors.reset}`);
    if (error.response) {
      console.log(`${colors.fg.red}Status: ${error.response.status}${colors.reset}`);
      console.log(`${colors.fg.red}Error: ${JSON.stringify(error.response.data, null, 2)}${colors.reset}`);
    }
    return { success: false, error: error.message };
  }
}

// Run all tests
async function runTests() {
  console.log(`${colors.bright}${colors.fg.magenta}=== Enhanced MCP Test Suite ===${colors.reset}`);
  console.log(`${colors.dim}Running tests to verify enhanced MCP functionality...${colors.reset}`);
  
  const results = [];
  
  // Run individual test cases
  for (const testCase of testCases) {
    const result = await runEnhancedMCPTest(testCase);
    results.push({ name: testCase.name, ...result });
  }
  
  // Test MCP stats
  const statsResult = await testMCPStats();
  results.push({ name: "MCP Stats", ...statsResult });
  
  // Run comparison test
  const comparisonResult = await runComparisonTest();
  results.push({ name: "MCP Comparison", ...comparisonResult });
  
  // Print summary
  console.log(`\n${colors.bright}${colors.fg.magenta}=== Test Results Summary ===${colors.reset}`);
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`${colors.fg.cyan}Tests: ${totalTests}, Passed: ${successCount}, Failed: ${totalTests - successCount}${colors.reset}`);
  
  for (const result of results) {
    const indicator = result.success ? `${colors.fg.green}✓` : `${colors.fg.red}✗`;
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    const error = result.error ? `: ${result.error}` : '';
    console.log(`${indicator} ${result.name}${duration}${error}${colors.reset}`);
  }
  
  console.log(`\n${colors.fg.magenta}Test suite complete.${colors.reset}`);
}

// Run the test suite
runTests();