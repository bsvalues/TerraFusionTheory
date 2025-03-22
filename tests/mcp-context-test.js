/**
 * MCP Context-Aware Testing
 * 
 * This script tests the enhanced MCP tool with vector memory integration.
 * It verifies that context-aware prompts work correctly with different integration strategies.
 * 
 * Run with: node tests/mcp-context-test.js
 */

// Import required modules using ES modules
import { vectorMemory } from '../agents/memory/vector.js';
import { registerMCPTool } from '../agents/tools/mcp.js';

async function runTest() {
  try {
    console.log('🧪 Starting MCP Context Integration Test...\n');
    
    // Testing the MCP tool with different context integration strategies
    const tests = [
      {
        name: 'Basic query without context integration',
        params: {
          model: 'gpt-4',
          prompt: 'What is the average home price in Grandview?',
          system_message: 'You are a real estate expert.',
          use_vector_memory: false
        },
        expectContext: false
      },
      {
        name: 'Query with smart context integration',
        params: {
          model: 'gpt-4',
          prompt: 'What is the average home price in Grandview?',
          system_message: 'You are a real estate expert.',
          use_vector_memory: true,
          context_integration: 'smart'
        },
        expectContext: true
      },
      {
        name: 'Query with prepend context integration',
        params: {
          model: 'gpt-4',
          prompt: 'What are the typical lot sizes in Grandview?',
          system_message: 'You are a real estate expert.',
          use_vector_memory: true,
          memory_query: 'Grandview property lot sizes',
          context_integration: 'prepend'
        },
        expectContext: true
      },
      {
        name: 'Query with append context integration',
        params: {
          model: 'gpt-4',
          prompt: 'What are recent home sales trends?',
          system_message: 'You are a real estate expert.',
          use_vector_memory: true,
          context_integration: 'append'
        },
        expectContext: true
      },
      {
        name: 'Custom memory query with advanced options',
        params: {
          model: 'gpt-4',
          prompt: 'What renovations have the best ROI?',
          system_message: 'You are a real estate expert.',
          use_vector_memory: true,
          memory_query: 'renovation ROI value improvements Grandview',
          memory_options: {
            limit: 5,
            threshold: 0.25,
            diversityFactor: 0.6,
            timeWeighting: {
              enabled: true,
              halfLifeDays: 60,
              maxBoost: 2.0
            }
          },
          context_integration: 'smart'
        },
        expectContext: true
      }
    ];
    
    // First seed the vector memory with some sample entries if it's empty
    const memCount = await checkMemoryEntries(vectorMemory);
    if (memCount < 5) {
      await seedVectorMemory(vectorMemory);
    }
    
    // Create MCP tool instance
    const mcpTool = registerMCPTool();
    
    // Run each test
    for (const test of tests) {
      console.log(`\n⏳ Running test: ${test.name}`);
      
      const result = await mcpTool.execute(test.params);
      
      if (result.success) {
        console.log(`✅ Success: ${test.name}`);
        console.log(`🤖 Model: ${result.result.model}`);
        console.log(`📝 Prompt: ${test.params.prompt}`);
        
        // Check if context was used as expected
        const contextUsed = result.result.metadata.enhancedWithContext || false;
        if (contextUsed) {
          console.log(`🧠 Context Used: Yes (from ${result.result.metadata.contextSources?.length || 0} sources)`);
          console.log(`🔄 Integration Strategy: ${result.result.metadata.contextStrategy || 'N/A'}`);
        } else {
          console.log(`🧠 Context Used: No`);
        }
        
        if (contextUsed !== test.expectContext) {
          console.log(`⚠️ WARNING: Expected context used to be ${test.expectContext} but got ${contextUsed}`);
        }
        
        console.log(`\n💬 Generated Response: "${result.result.response.substring(0, 100)}${result.result.response.length > 100 ? '...' : ''}"`);
      } else {
        console.log(`❌ Failed: ${test.name}`);
        console.log(`Error: ${result.error.message}`);
      }
    }
    
    console.log('\n🏁 All MCP Context tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

/**
 * Check if vector memory has entries
 */
async function checkMemoryEntries(vectorMemory) {
  try {
    const stats = await vectorMemory.getStats();
    console.log(`📊 Vector memory currently has ${stats.count} entries`);
    return stats.count;
  } catch (error) {
    console.error('Error checking vector memory:', error);
    return 0;
  }
}

/**
 * Seed vector memory with sample entries
 */
async function seedVectorMemory(vectorMemory) {
  console.log('🌱 Seeding vector memory with sample real estate data...');
  
  const sampleEntries = [
    {
      text: "According to the Grandview market report from February 2025, the average home price is $425,000, representing a 5.2% increase from the previous year. The median price per square foot is now $275.",
      metadata: {
        source: "market_report_feb_2025",
        timestamp: new Date(2025, 1, 15).toISOString()
      }
    },
    {
      text: "Typical lot sizes in Grandview range from 0.25 acres (approximately 10,890 sq ft) in newer subdivisions to 0.5 acres (approximately 21,780 sq ft) in older neighborhoods. Rural properties on the outskirts of town often have 1-5 acre lots.",
      metadata: {
        source: "property_characteristics_guide",
        timestamp: new Date(2024, 10, 5).toISOString()
      }
    },
    {
      text: "Recent home sales trends in Grandview show an average of 24 days on market, down 15% from the previous year. Inventory remains tight with only 2.1 months of supply, giving sellers continued advantage in negotiations.",
      metadata: {
        source: "market_trends_q1_2025",
        timestamp: new Date(2025, 2, 5).toISOString()
      }
    },
    {
      text: "Bathroom renovations in Grandview homes have shown the highest ROI at 82% cost recovery on average. Kitchen renovations follow at 75% ROI, while adding a deck or outdoor living space returns 72% of costs. Basement finishing shows 65% ROI.",
      metadata: {
        source: "renovation_value_report",
        timestamp: new Date(2024, 11, 12).toISOString()
      }
    },
    {
      text: "The most desirable neighborhoods in Grandview are Westridge (average home price $525,000), Orchard Heights ($475,000), and Downtown Historic District ($450,000). Properties in school district 3 command a 12% premium.",
      metadata: {
        source: "neighborhood_analysis",
        timestamp: new Date(2025, 0, 28).toISOString()
      }
    }
  ];
  
  // Add entries to vector memory
  for (const entry of sampleEntries) {
    await vectorMemory.addEntry(entry.text, entry.metadata);
    console.log(`Added entry: ${entry.text.substring(0, 50)}...`);
  }
  
  console.log('✅ Vector memory seeding complete');
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error in test script:', error);
  process.exit(1);
});