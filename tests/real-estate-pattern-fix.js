/**
 * Specific test for the real estate pattern matching fix
 * 
 * This script tests that the MCP tool correctly handles similar real estate questions
 * with different responses rather than using static pattern matching.
 * 
 * Run with: node tests/real-estate-pattern-fix.js
 */

import axios from 'axios';

// Configure axios defaults
axios.defaults.timeout = 30000; // 30 second timeout for these intensive tests

// Base URL for the API
const API_BASE = 'http://localhost:5000/api';
const AGENT_DEMO_BASE = `${API_BASE}/agent-demo`;

// Set of different but related questions about property values
const questions = [
  "What is the average price per square foot in Grandview?",
  "How much do homes typically cost per square foot in Grandview?",
  "What's the typical property value per square foot in this area?",
  "Tell me about property values in Grandview"
];

// Track test results
const responses = [];
let success = false;

async function testRealEstatePatternFix() {
  console.log("==========================");
  console.log("🏠 REAL ESTATE PATTERN FIX TEST");
  console.log("==========================");
  
  try {
    // First ensure agents are created
    console.log("Creating demo agents...");
    await axios.post(`${AGENT_DEMO_BASE}/create-agents`);
    console.log("✅ Agents created successfully");
    
    // Process each question sequentially
    for (const question of questions) {
      console.log(`\n🔍 Testing question: "${question}"`);
      
      try {
        console.log("   Sending request...");
        const response = await axios.post(
          `${AGENT_DEMO_BASE}/run-real-estate-agent`,
          { task: question }
        );
        
        if (!response.data.success) {
          console.log(`   ❌ Question failed with error: ${JSON.stringify(response.data)}`);
          continue;
        }
        
        // Extract and log the answer
        const answer = response.data.result?.answer || "No answer provided";
        console.log(`   📝 Answer preview: ${answer.substring(0, 150)}...`);
        
        // Store full response for comparison
        responses.push({ 
          question, 
          answer, 
          fromCache: response.data.result?.metadata?.fromCache || false,
          sources: response.data.result?.sourcesUsed || []
        });
        
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
      }
    }
    
    // Analyze results
    console.log("\n==========================");
    console.log("📊 RESULTS ANALYSIS");
    console.log("==========================");
    
    if (responses.length < 2) {
      console.log("❌ Not enough successful responses to properly test pattern matching");
      return;
    }
    
    // Compare response content
    let identicalCount = 0;
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        if (responses[i].answer === responses[j].answer) {
          identicalCount++;
          console.log(`\n⚠️ Identical responses found for different questions:`);
          console.log(`   Q1: "${responses[i].question}"`);
          console.log(`   Q2: "${responses[j].question}"`);
        }
      }
    }
    
    // Calculate similarity percentage
    const totalComparisons = (responses.length * (responses.length - 1)) / 2;
    const uniquePercentage = Math.round(((totalComparisons - identicalCount) / totalComparisons) * 100);
    
    console.log(`\n📊 Response uniqueness: ${uniquePercentage}% (${totalComparisons - identicalCount}/${totalComparisons} comparisons unique)`);
    
    if (identicalCount === 0) {
      console.log("✅ SUCCESS: All responses are unique, indicating pattern matching has been fixed");
      success = true;
    } else if (uniquePercentage >= 50) {
      console.log("⚠️ PARTIAL SUCCESS: Most responses are unique, but some pattern matching may still occur");
      success = true;
    } else {
      console.log("❌ FAILURE: Many identical responses detected, indicating pattern matching is still prevalent");
    }
    
    // Check for cache use
    const cacheUseCount = responses.filter(r => r.fromCache).length;
    if (cacheUseCount > 0) {
      console.log(`\n⚠️ Note: ${cacheUseCount} response(s) came from cache. This may affect results validity.`);
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
  
  return success;
}

// Run the test
testRealEstatePatternFix()
  .then(success => {
    console.log("\n==========================");
    console.log(`🏁 TEST ${success ? 'PASSED' : 'FAILED'}`);
    console.log("==========================");
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error(`❌ Unhandled error: ${error}`);
    process.exit(1);
  });