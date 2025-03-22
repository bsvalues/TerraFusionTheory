/**
 * Agent Collaboration Test
 * 
 * This script tests the cross-domain collaboration between the developer agent
 * and the real estate agent. It demonstrates how the developer agent can recognize
 * real estate questions and consult with the real estate agent for domain-specific
 * expertise.
 * 
 * Run with: node tests/agent-collaboration-test.js
 */

import axios from 'axios';
const API_BASE_URL = 'http://localhost:5000/api/agent-demo';

/**
 * Test questions that combine technical and real estate knowledge
 */
const TEST_QUESTIONS = [
  // Questions that should trigger collaboration
  {
    text: "How would I implement a geospatial search for properties within a 5-mile radius of Grandview, WA?",
    expectsCollaboration: true,
    category: "geospatial"
  },
  {
    text: "What's the best way to display property valuation trends on a map using React and Leaflet?",
    expectsCollaboration: true,
    category: "visualization"
  },
  {
    text: "How can I implement a database schema for storing property tax assessment data?",
    expectsCollaboration: true,
    category: "data-modeling"
  },
  {
    text: "What API should I use to get real-time property market data for Grandview?",
    expectsCollaboration: true,
    category: "api-integration"
  },
  
  // Control questions (pure development, should not trigger collaboration)
  {
    text: "What's the best way to implement authentication in a Node.js Express application?",
    expectsCollaboration: false,
    category: "pure-dev"
  },
  {
    text: "How do I optimize a React component that re-renders too often?",
    expectsCollaboration: false,
    category: "pure-dev"
  }
];

/**
 * Color formatting for console output
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

/**
 * Test the cross-domain collaboration endpoint with a specific question
 */
async function testCollaboration(question) {
  try {
    console.log(`${colors.bright}${colors.cyan}Testing question:${colors.reset} "${question.text}"`);
    console.log(`${colors.dim}Category: ${question.category}${colors.reset}`);
    console.log(`${colors.dim}Expecting collaboration: ${question.expectsCollaboration ? 'Yes' : 'No'}${colors.reset}`);
    
    const startTime = Date.now();
    const response = await axios.post(`${API_BASE_URL}/test-cross-domain-collaboration`, {
      question: question.text
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const data = response.data;
    
    console.log(`${colors.bright}${colors.magenta}DEBUG: Full API Response: ${colors.reset}`);
    console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
    // Evaluate results
    const collaborationOccurred = data.collaborationFound;
    const correctPrediction = data.isRealEstateRelated === question.expectsCollaboration;
    
    console.log(`${colors.bright}Results:${colors.reset}`);
    console.log(`- Detection: The question was ${data.isRealEstateRelated ? 'identified' : 'not identified'} as real estate related`);
    console.log(`- Collaboration: ${collaborationOccurred ? 'Occurred' : 'Did not occur'}`);
    console.log(`- Duration: ${duration} seconds`);
    console.log(`- Execution Time: ${data.executionTime || 'unknown'}ms`);
    
    if (correctPrediction) {
      console.log(`${colors.green}✓ Agent correctly ${question.expectsCollaboration ? 'detected' : 'ignored'} real estate content${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Agent ${question.expectsCollaboration ? 'failed to detect' : 'incorrectly detected'} real estate content${colors.reset}`);
    }
    
    // Display operations logs
    console.log(`\n${colors.bright}Operation logs:${colors.reset}`);
    if (data.logs && data.logs.length > 0) {
      data.logs.forEach(log => console.log(`  ${colors.dim}•${colors.reset} ${log}`));
    } else {
      console.log(`  ${colors.dim}No operation logs available${colors.reset}`);
    }
    
    // Display collaboration memory if available
    if (data.collaborationMemoryEntries && data.collaborationMemoryEntries.length > 0) {
      console.log(`\n${colors.bright}Collaboration Memory Entries:${colors.reset}`);
      data.collaborationMemoryEntries.forEach(entry => {
        console.log(`  ${colors.yellow}Entry ID:${colors.reset} ${entry.id}`);
        console.log(`  ${colors.yellow}Content:${colors.reset} ${entry.content}`);
        console.log(`  ${colors.yellow}Score:${colors.reset} ${entry.score}`);
        console.log(`  ${colors.yellow}Tags:${colors.reset} ${entry.metadata.tags.join(', ')}`);
        console.log();
      });
    }
    
    // Show a snippet of the answer (first 200 chars)
    if (data.developerResult && data.developerResult.answer) {
      const answerPreview = data.developerResult.answer.substring(0, 200) + '...';
      console.log(`\n${colors.bright}Answer Preview:${colors.reset}`);
      console.log(`${colors.dim}${answerPreview}${colors.reset}`);
    }
    
    return {
      question: question.text,
      category: question.category,
      expectsCollaboration: question.expectsCollaboration,
      detectedAsRealEstate: data.isRealEstateRelated,
      collaborationOccurred: collaborationOccurred,
      correctPrediction: correctPrediction,
      duration: duration,
      success: response.status === 200
    };
  } catch (error) {
    console.error(`${colors.red}Error testing question:${colors.reset}`, error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return {
      question: question.text,
      category: question.category,
      expectsCollaboration: question.expectsCollaboration,
      error: error.message,
      success: false
    };
  }
}

/**
 * Run all tests and report results
 */
async function runTests() {
  console.log(`${colors.bright}${colors.bgBlue}Agent Collaboration Test${colors.reset}\n`);
  console.log(`Testing ${TEST_QUESTIONS.length} questions for cross-domain collaboration\n`);
  
  const results = [];
  
  // Run tests sequentially to avoid overloading the server
  for (const question of TEST_QUESTIONS) {
    const result = await testCollaboration(question);
    results.push(result);
    console.log('\n' + '-'.repeat(80) + '\n');
  }
  
  // Print summary
  console.log(`${colors.bright}${colors.bgBlue}Test Summary${colors.reset}\n`);
  
  const successful = results.filter(r => r.success);
  const correctPredictions = results.filter(r => r.success && r.correctPrediction);
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Successful tests: ${successful.length}`);
  console.log(`Correct predictions: ${correctPredictions.length}`);
  
  if (successful.length > 0) {
    const avgDuration = (successful.reduce((sum, r) => sum + parseFloat(r.duration), 0) / successful.length).toFixed(2);
    console.log(`Average duration: ${avgDuration} seconds`);
  }
  
  // Results by category
  console.log(`\n${colors.bright}Results by category:${colors.reset}`);
  const categories = [...new Set(results.map(r => r.category))];
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const correctCategoryPredictions = categoryResults.filter(r => r.success && r.correctPrediction);
    
    console.log(`${colors.cyan}${category}${colors.reset}: ${correctCategoryPredictions.length}/${categoryResults.length} correct`);
  }
  
  // Detailed results table
  console.log(`\n${colors.bright}Detailed Results:${colors.reset}`);
  console.log('Question'.padEnd(60) + '| Expected | Detected | Correct');
  console.log('-'.repeat(95));
  
  for (const result of results) {
    if (result.success) {
      const shortQuestion = result.question.length > 57 
        ? result.question.substring(0, 57) + '...' 
        : result.question.padEnd(60);
      
      const expected = result.expectsCollaboration ? 'Yes     ' : 'No      ';
      const detected = result.detectedAsRealEstate ? 'Yes     ' : 'No      ';
      const correct = result.correctPrediction 
        ? `${colors.green}Yes${colors.reset}     ` 
        : `${colors.red}No${colors.reset}      `;
      
      console.log(`${shortQuestion} | ${expected} | ${detected} | ${correct}`);
    } else {
      const shortQuestion = result.question.length > 57 
        ? result.question.substring(0, 57) + '...' 
        : result.question.padEnd(60);
      
      console.log(`${shortQuestion} | ${colors.red}Error: ${result.error.substring(0, 20)}${colors.reset}`);
    }
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});