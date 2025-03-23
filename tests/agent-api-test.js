/**
 * Agent API Test
 * 
 * This script tests the newly implemented agent endpoints to ensure they're functioning correctly.
 * It makes requests to the agent endpoints and validates the responses.
 * 
 * Run with: node tests/agent-api-test.js
 */

async function runTest(name, testFn) {
  console.log(`\n🧪 Running test: ${name}`);
  try {
    await testFn();
    console.log(`✅ Test passed: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

function printSummary(results) {
  const total = results.length;
  const passed = results.filter(r => r).length;
  const failed = total - passed;
  
  console.log('\n======================================');
  console.log(`🧪 AGENT API TEST SUMMARY`);
  console.log('======================================');
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('======================================\n');
}

/**
 * Test listing all available agents 
 */
async function testListAgents() {
  const response = await fetch('http://localhost:5000/api/agents');
  
  if (!response.ok) {
    throw new Error(`Failed to get agents list: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Response indicated failure');
  }
  
  if (!Array.isArray(data.agents) || data.agents.length === 0) {
    throw new Error('No agents returned in response');
  }
  
  console.log(`   Found ${data.agents.length} agents`);
  
  // Verify we have the expected agent types
  const hasRealEstateAgent = data.agents.some(agent => agent.id === 'real-estate');
  const hasDeveloperAgent = data.agents.some(agent => agent.id === 'developer');
  
  if (!hasRealEstateAgent) {
    throw new Error('Real estate agent not found in response');
  }
  
  if (!hasDeveloperAgent) {
    throw new Error('Developer agent not found in response');
  }
}

/**
 * Test getting real estate agent details
 */
async function testGetRealEstateAgent() {
  const response = await fetch('http://localhost:5000/api/agents/real-estate');
  
  if (!response.ok) {
    throw new Error(`Failed to get real estate agent: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Response indicated failure');
  }
  
  if (!data.agent || data.agent.id !== 'real-estate') {
    throw new Error('Real estate agent not returned or incorrect ID');
  }
  
  console.log(`   Retrieved real estate agent: ${data.agent.name}`);
  console.log(`   Capabilities: ${data.agent.capabilities.length}`);
}

/**
 * Test getting developer agent details
 */
async function testGetDeveloperAgent() {
  const response = await fetch('http://localhost:5000/api/agents/developer');
  
  if (!response.ok) {
    throw new Error(`Failed to get developer agent: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Response indicated failure');
  }
  
  if (!data.agent || data.agent.id !== 'developer') {
    throw new Error('Developer agent not returned or incorrect ID');
  }
  
  console.log(`   Retrieved developer agent: ${data.agent.name}`);
  console.log(`   Capabilities: ${data.agent.capabilities.length}`);
}

/**
 * Test asking real estate agent a question
 */
async function testAskRealEstateAgent() {
  const response = await fetch('http://localhost:5000/api/agents/real-estate/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: 'What factors affect property values?',
      context: { source: 'test' }
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to ask real estate agent: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Response indicated failure');
  }
  
  if (!data.response) {
    throw new Error('No response returned from agent');
  }
  
  console.log(`   Real estate agent response received (${data.response.length} chars)`);
}

/**
 * Test asking developer agent a question
 */
async function testAskDeveloperAgent() {
  const response = await fetch('http://localhost:5000/api/agents/developer/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: 'How do I integrate the MCP tool with my frontend?',
      context: { source: 'test' }
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to ask developer agent: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Response indicated failure');
  }
  
  if (!data.response) {
    throw new Error('No response returned from agent');
  }
  
  console.log(`   Developer agent response received (${data.response.length} chars)`);
}

/**
 * Test agent collaboration for a complex question
 */
async function testAgentCollaboration() {
  const response = await fetch('http://localhost:5000/api/agents/collaborate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: 'What technical approach should I use to analyze property values in Grandview?',
      context: { source: 'test' }
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to use agent collaboration: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Response indicated failure');
  }
  
  if (!data.response) {
    throw new Error('No response returned from agent collaboration');
  }
  
  console.log(`   Collaboration response received (${data.response.length} chars)`);
}

/**
 * Test searching agent memory
 */
async function testSearchAgentMemory() {
  const response = await fetch('http://localhost:5000/api/agents/memory/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'property valuation',
      limit: 3
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to search agent memory: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Response indicated failure');
  }
  
  if (!Array.isArray(data.results)) {
    throw new Error('Results not returned as an array');
  }
  
  console.log(`   Memory search returned ${data.results.length} results`);
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Agent API Tests');
  
  const results = [];
  
  // Test basic agent endpoints
  results.push(await runTest('List all agents', testListAgents));
  results.push(await runTest('Get real estate agent', testGetRealEstateAgent));
  results.push(await runTest('Get developer agent', testGetDeveloperAgent));
  
  // Test agent interaction
  results.push(await runTest('Ask real estate agent', testAskRealEstateAgent));
  results.push(await runTest('Ask developer agent', testAskDeveloperAgent));
  results.push(await runTest('Test agent collaboration', testAgentCollaboration));
  
  // Test memory search
  results.push(await runTest('Search agent memory', testSearchAgentMemory));
  
  // Print test summary
  printSummary(results);
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});