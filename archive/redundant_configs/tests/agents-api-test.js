/**
 * Agent System API Tests
 * 
 * This script helps test the agent system endpoints we've implemented.
 * Run with: node tests/agents-api-test.js
 */

import axios from 'axios';

// Configure axios defaults
axios.defaults.timeout = 5000; // 5 second timeout

// Base URL for the API
const API_BASE = 'http://localhost:5000/api';
const AGENT_DEMO_BASE = `${API_BASE}/agent-demo`;

// Test results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// Helper function to run a test
async function runTest(name, testFn) {
  console.log(`\n🧪 Running test: ${name}`);
  results.total++;
  
  try {
    await testFn();
    console.log(`✅ PASSED: ${name}`);
    results.passed++;
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    results.failed++;
  }
}

// Helper function to print test summary
function printSummary() {
  console.log("\n==========================");
  console.log("📊 TEST SUMMARY");
  console.log("==========================");
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log("==========================");
  
  if (results.failed === 0) {
    console.log("🎉 All tests passed!");
  } else {
    console.log(`⚠️ ${results.failed} test(s) failed!`);
  }
}

// Test 1: List all agents
async function testListAgents() {
  const response = await axios.get(`${AGENT_DEMO_BASE}/agents`);
  
  if (!response.data.success) {
    throw new Error('API call was not successful');
  }
  
  if (!response.data.agents || !Array.isArray(response.data.agents)) {
    throw new Error('No agents array returned');
  }
  
  console.log(`   Found ${response.data.agents.length} agents`);
  
  // Log the details of found agents
  response.data.agents.forEach(agent => {
    console.log(`   - ${agent.name} (${agent.id}): ${agent.description}`);
    console.log(`     Type: ${agent.type}`);
    console.log(`     Capabilities: ${agent.capabilities.join(', ')}`);
  });
}

// Test 2: Get developer agent details
async function testGetDeveloperAgent() {
  const response = await axios.get(`${AGENT_DEMO_BASE}/developer-agent`);
  
  if (!response.data.success) {
    throw new Error('API call was not successful');
  }
  
  if (!response.data.agent) {
    throw new Error('No agent data returned');
  }
  
  console.log(`   Developer agent: ${response.data.agent.name} (${response.data.agent.id})`);
  console.log(`   Description: ${response.data.agent.description}`);
  console.log(`   Capabilities: ${response.data.agent.capabilities.join(', ')}`);
}

// Test 3: Get real estate agent details
async function testGetRealEstateAgent() {
  const response = await axios.get(`${AGENT_DEMO_BASE}/real-estate-agent`);
  
  if (!response.data.success) {
    throw new Error('API call was not successful');
  }
  
  if (!response.data.agent) {
    throw new Error('No agent data returned');
  }
  
  console.log(`   Real estate agent: ${response.data.agent.name} (${response.data.agent.id})`);
  console.log(`   Description: ${response.data.agent.description}`);
  console.log(`   Capabilities: ${response.data.agent.capabilities.join(', ')}`);
}

// Test 4: Ask a technical question to the developer agent
async function testAskTechnicalQuestion() {
  const requestData = {
    question: "What are the key differences between JavaScript and TypeScript?"
  };
  
  const response = await axios.post(`${AGENT_DEMO_BASE}/answer-technical-question`, requestData);
  
  if (!response.data.success) {
    throw new Error('API call was not successful');
  }
  
  console.log(`   Question: ${requestData.question}`);
  console.log(`   Answer preview: ${response.data.result.answer.substring(0, 100)}...`);
}

// Test 5: Generate code with the developer agent
async function testGenerateCode() {
  const requestData = {
    language: "javascript",
    requirements: "Create a function that calculates the Fibonacci sequence up to n terms",
    style: "clean"
  };
  
  const response = await axios.post(`${AGENT_DEMO_BASE}/generate-code`, requestData);
  
  if (!response.data.success) {
    throw new Error('API call was not successful');
  }
  
  console.log(`   Requirements: ${requestData.requirements}`);
  console.log(`   Language: ${requestData.language}`);
  
  // Handle different response formats
  if (response.data.result && response.data.result.code) {
    console.log(`   Generated code preview: ${response.data.result.code.substring(0, 100)}...`);
    
    if (response.data.result.explanation) {
      console.log(`   Explanation preview: ${response.data.result.explanation.substring(0, 100)}...`);
    } else {
      console.log(`   No explanation provided`);
    }
  } else {
    console.log(`   Code generation response: ${JSON.stringify(response.data.result).substring(0, 100)}...`);
  }
}

// Test 6: Test agent collaboration
async function testAgentCollaboration() {
  // Get developer agent ID first
  const devResponse = await axios.get(`${AGENT_DEMO_BASE}/developer-agent`);
  const developerAgentId = devResponse.data.agent.id;
  
  // Get real estate agent ID
  const reResponse = await axios.get(`${AGENT_DEMO_BASE}/real-estate-agent`);
  const realEstateAgentId = reResponse.data.agent.id;
  
  // Now test collaboration with shorter message for faster processing
  const requestData = {
    source_agent_id: developerAgentId,
    target_agent_id: realEstateAgentId,
    message: "What affects home values?", // Shorter question for faster response
    task: "answer_question"
  };
  
  console.log(`   Starting collaboration test with timeout override...`);
  // Use a custom timeout for this request
  const response = await axios.post(`${AGENT_DEMO_BASE}/agent-collaboration`, requestData, {
    timeout: 15000 // 15 seconds timeout for collaboration which is more intensive
  });
  
  if (!response.data.success) {
    throw new Error('API call was not successful');
  }
  
  console.log(`   Collaboration: Developer agent asking Real Estate agent a question`);
  console.log(`   Question: ${requestData.message}`);
  
  if (response.data.result) {
    console.log(`   Result preview: ${JSON.stringify(response.data.result).substring(0, 150)}...`);
  } else {
    console.log(`   Task was accepted but no immediate result (async processing)`);
  }
}

// Test 7: Search vector memory
async function testSearchVectorMemory() {
  const requestData = {
    query: "property values in urban areas",
    limit: 3,
    threshold: 0.2,
    diversityFactor: 0.4
  };
  
  const response = await axios.post(`${AGENT_DEMO_BASE}/search-memory`, requestData);
  
  if (!response.data.success) {
    throw new Error('API call was not successful');
  }
  
  console.log(`   Query: ${requestData.query}`);
  console.log(`   Found ${response.data.results ? response.data.results.length : 0} results`);
  
  if (response.data.results && response.data.results.length > 0) {
    // Log the first result
    const firstResult = response.data.results[0];
    console.log(`   Top result: ${firstResult.entry.text.substring(0, 100)}...`);
    console.log(`   Score: ${firstResult.score}`);
  } else {
    console.log('   No results found');
  }
}

// Test 8: Ask real estate questions and verify different responses
async function testRealEstateQuestions() {
  // Set of different but related questions about property values
  const questions = [
    "What is the average price per square foot in Grandview?",
    "How much do homes typically cost per square foot in Grandview?",
    "What's the typical property value per square foot in this area?"
  ];
  
  const responses = [];
  
  // Process each question and store responses
  for (const question of questions) {
    console.log(`   Asking: "${question}"`);
    
    try {
      const response = await axios.post(
        `${AGENT_DEMO_BASE}/run-real-estate-agent`,
        { task: question },
        { timeout: 20000 } // 20 second timeout for each question
      );
      
      if (!response.data.success) {
        console.log(`   Question failed: ${question}`);
        console.log(`   Error: ${JSON.stringify(response.data)}`);
        continue;
      }
      
      // Extract and trim the answer
      const answer = response.data.result?.answer || "No answer provided";
      const trimmedAnswer = answer.substring(0, 100) + (answer.length > 100 ? "..." : "");
      
      console.log(`   Answer: ${trimmedAnswer}`);
      responses.push({ question, answer: trimmedAnswer });
      
    } catch (error) {
      console.log(`   Request failed for question: "${question}"`);
      console.log(`   Error: ${error.message}`);
      
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
  
  // Compare responses to check if they're different
  if (responses.length >= 2) {
    let allSame = true;
    const firstResponse = responses[0].answer;
    
    for (let i = 1; i < responses.length; i++) {
      if (responses[i].answer !== firstResponse) {
        allSame = false;
        break;
      }
    }
    
    if (allSame) {
      throw new Error('All responses are identical, suggesting pattern matching is still occurring');
    } else {
      console.log('   ✅ Responses vary, indicating successful fix of pattern matching issue');
    }
  } else {
    console.log('   ⚠️ Not enough successful responses to compare');
  }
}

// Main test function
async function runTests() {
  console.log("==========================");
  console.log("🤖 AGENT SYSTEM API TESTS");
  console.log("==========================");
  
  try {
    // Test connection to server
    await axios.get(API_BASE);
    console.log("✅ Connected to API server successfully");
    
    // Run the basic tests
    await runTest("List all agents", testListAgents);
    await runTest("Get developer agent details", testGetDeveloperAgent);
    await runTest("Get real estate agent details", testGetRealEstateAgent);
    
    // Run the more intensive tests if basic tests pass
    if (results.failed === 0) {
      console.log("\n✅ Basic tests passed, running advanced tests...");
      
      // These tests take longer because they involve AI processing
      await runTest("Search vector memory", testSearchVectorMemory);
      await runTest("Test real estate questions for vector memory", testRealEstateQuestions);
      await runTest("Ask technical question", testAskTechnicalQuestion);
      await runTest("Generate code", testGenerateCode);
      await runTest("Test agent collaboration", testAgentCollaboration);
    } else {
      console.log("\n⚠️ Skipping advanced tests due to failures in basic tests");
      results.skipped = 5; // 5 tests skipped
    }
    
  } catch (error) {
    console.error("❌ Failed to connect to API server", error.message);
  }
  
  printSummary();
}

// Run the tests
runTests();

// Export functions for potential reuse
export {
  testListAgents,
  testGetDeveloperAgent,
  testGetRealEstateAgent,
  testAskTechnicalQuestion,
  testGenerateCode,
  testAgentCollaboration,
  testSearchVectorMemory,
  testRealEstateQuestions
};