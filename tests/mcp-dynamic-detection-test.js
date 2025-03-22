/**
 * MCP Dynamic Detection Test
 * 
 * This script tests the MCP tool's ability to dynamically generate appropriate responses
 * instead of relying on static pattern matching. It specifically focuses on testing
 * how the tool handles similar questions about real estate that should receive
 * different responses.
 * 
 * Run with: node tests/mcp-dynamic-detection-test.js
 */

const axios = require('axios');
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Test cases with similar questions that should get distinct responses
 */
const TEST_CASES = [
  // Test Case 1: Property Valuation Questions
  {
    name: "Property Valuation",
    questions: [
      "What factors affect property values in Grandview, WA?",
      "How do school districts impact property values in Grandview?",
      "Does proximity to downtown affect property values in Grandview?",
      "How much do renovations typically increase property values in Grandview?"
    ]
  },
  
  // Test Case 2: Market Trend Questions
  {
    name: "Market Trends",
    questions: [
      "What are the current market trends in Grandview, WA?",
      "How has the housing market in Grandview changed in the last 5 years?",
      "Are housing prices expected to rise or fall in Grandview this year?",
      "What seasonal patterns affect the Grandview real estate market?"
    ]
  },
  
  // Test Case 3: Investment Strategy Questions
  {
    name: "Investment Strategy",
    questions: [
      "What's the best investment strategy for Grandview real estate?",
      "Should I invest in single-family homes or multi-family properties in Grandview?",
      "Is it better to flip properties or hold for rental income in Grandview?",
      "What neighborhoods in Grandview show the best investment potential?"
    ]
  },
  
  // Test Case 4: Technical Implementation Questions
  {
    name: "Technical Implementation",
    questions: [
      "How should I implement a property search feature for Grandview properties?",
      "What's the best database structure for storing Grandview property data?",
      "How can I display Grandview properties on an interactive map?",
      "What APIs would help me get Grandview real estate market data?"
    ]
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
  bgBlue: "\x1b[44m"
};

/**
 * Calculate Jaccard similarity between two strings
 * (a simple measure of how similar two sets of words are)
 */
function jaccardSimilarity(str1, str2) {
  // Convert to lowercase and remove punctuation
  const clean1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
  const clean2 = str2.toLowerCase().replace(/[^\w\s]/g, '');
  
  // Get unique words
  const words1 = new Set(clean1.split(/\s+/));
  const words2 = new Set(clean2.split(/\s+/));
  
  // Calculate intersection
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  
  // Calculate union
  const union = new Set([...words1, ...words2]);
  
  // Return Jaccard similarity
  return intersection.size / union.size;
}

/**
 * Send a question to the real estate agent
 */
async function askRealEstateQuestion(question) {
  try {
    const response = await axios.post(`${API_BASE_URL}/agents/run-real-estate-agent`, {
      task: question
    });
    
    if (response.data.success && response.data.result && response.data.result.answer) {
      return {
        success: true,
        answer: response.data.result.answer,
        metadata: response.data.result.metadata
      };
    } else {
      return {
        success: false,
        error: 'No answer provided',
        rawResponse: response.data
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

/**
 * Test a set of similar questions and verify they get different responses
 */
async function testSimilarQuestions(testCase) {
  console.log(`\n${colors.bright}${colors.bgBlue} Testing: ${testCase.name} ${colors.reset}\n`);
  
  const responses = [];
  
  // Ask each question and collect responses
  for (const question of testCase.questions) {
    console.log(`${colors.cyan}Question:${colors.reset} "${question}"`);
    
    const result = await askRealEstateQuestion(question);
    
    if (result.success) {
      const answerPreview = result.answer.substring(0, 100) + '...';
      console.log(`${colors.green}Answer:${colors.reset} ${answerPreview}`);
      
      responses.push({
        question,
        answer: result.answer,
        metadata: result.metadata
      });
    } else {
      console.log(`${colors.red}Error:${colors.reset} ${result.error}`);
      responses.push({
        question,
        error: result.error
      });
    }
    
    console.log(); // Add spacing between questions
  }
  
  // Analyze similarity between responses
  console.log(`${colors.bright}Similarity Analysis:${colors.reset}`);
  
  let totalComparisons = 0;
  let totalSimilarity = 0;
  let maxSimilarity = 0;
  let minSimilarity = 1;
  
  const similarities = [];
  
  // Compare each response with every other response
  for (let i = 0; i < responses.length; i++) {
    if (!responses[i].answer) continue;
    
    for (let j = i + 1; j < responses.length; j++) {
      if (!responses[j].answer) continue;
      
      const similarity = jaccardSimilarity(responses[i].answer, responses[j].answer);
      
      similarities.push({
        question1: responses[i].question,
        question2: responses[j].question,
        similarity
      });
      
      totalSimilarity += similarity;
      totalComparisons++;
      
      if (similarity > maxSimilarity) maxSimilarity = similarity;
      if (similarity < minSimilarity) minSimilarity = similarity;
      
      // Display the similarity
      const similarityString = similarity.toFixed(2);
      let coloredSimilarity;
      
      if (similarity < 0.5) {
        coloredSimilarity = `${colors.green}${similarityString}${colors.reset}`;
      } else if (similarity < 0.8) {
        coloredSimilarity = `${colors.yellow}${similarityString}${colors.reset}`;
      } else {
        coloredSimilarity = `${colors.red}${similarityString}${colors.reset}`;
      }
      
      console.log(`Similarity between Q${i+1} and Q${j+1}: ${coloredSimilarity}`);
    }
  }
  
  // Calculate average similarity
  const avgSimilarity = totalComparisons > 0 ? totalSimilarity / totalComparisons : 0;
  
  console.log(`\n${colors.bright}Results:${colors.reset}`);
  console.log(`Average similarity: ${avgSimilarity.toFixed(2)}`);
  console.log(`Min similarity: ${minSimilarity.toFixed(2)}`);
  console.log(`Max similarity: ${maxSimilarity.toFixed(2)}`);
  
  // Interpret the results
  let verdict;
  if (avgSimilarity < 0.5) {
    verdict = `${colors.green}Good - Responses are sufficiently different${colors.reset}`;
  } else if (avgSimilarity < 0.7) {
    verdict = `${colors.yellow}Moderate - Some overlap between responses${colors.reset}`;
  } else {
    verdict = `${colors.red}Poor - Responses are too similar${colors.reset}`;
  }
  
  console.log(`Verdict: ${verdict}`);
  
  return {
    name: testCase.name,
    questions: testCase.questions.length,
    averageSimilarity: avgSimilarity,
    minSimilarity,
    maxSimilarity,
    similarities
  };
}

/**
 * Run all tests and generate a report
 */
async function runTests() {
  console.log(`${colors.bright}${colors.bgBlue} MCP Dynamic Response Test ${colors.reset}\n`);
  console.log(`Testing ${TEST_CASES.length} categories with similar questions\n`);
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await testSimilarQuestions(testCase);
    results.push(result);
    console.log('\n' + '-'.repeat(80) + '\n');
  }
  
  // Generate summary
  console.log(`${colors.bright}${colors.bgBlue} Test Summary ${colors.reset}\n`);
  
  let overallAverage = 0;
  let totalComparisons = 0;
  
  for (const result of results) {
    overallAverage += result.averageSimilarity * result.similarities.length;
    totalComparisons += result.similarities.length;
    
    console.log(`${colors.cyan}${result.name}${colors.reset}:`);
    console.log(`  Questions: ${result.questions}`);
    console.log(`  Avg. Similarity: ${result.averageSimilarity.toFixed(2)}`);
    console.log(`  Range: ${result.minSimilarity.toFixed(2)} - ${result.maxSimilarity.toFixed(2)}`);
    console.log();
  }
  
  overallAverage = overallAverage / totalComparisons;
  
  console.log(`${colors.bright}Overall Average Similarity:${colors.reset} ${overallAverage.toFixed(2)}`);
  
  // Calculate the percentage of comparisons with similarity below 0.7 (good diversity)
  const allSimilarities = results.flatMap(r => r.similarities);
  const goodDiversityCount = allSimilarities.filter(s => s.similarity < 0.7).length;
  const diversityPercentage = (goodDiversityCount / allSimilarities.length) * 100;
  
  console.log(`${colors.bright}Response Diversity Rate:${colors.reset} ${diversityPercentage.toFixed(1)}%`);
  
  // Final assessment
  console.log(`\n${colors.bright}Final Assessment:${colors.reset}`);
  if (diversityPercentage >= 80) {
    console.log(`${colors.green}Excellent${colors.reset} - The system generates diverse responses with minimal pattern matching`);
  } else if (diversityPercentage >= 60) {
    console.log(`${colors.yellow}Good${colors.reset} - The system generally provides diverse responses`);
  } else {
    console.log(`${colors.red}Needs Improvement${colors.reset} - The system may still be using too much pattern matching`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});