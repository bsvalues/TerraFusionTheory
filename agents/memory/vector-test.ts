/**
 * Test script for the enhanced vector memory system
 * 
 * This script demonstrates the advanced retrieval techniques in the vector memory system.
 */

import { vectorMemory, AdvancedSearchOptions } from './vector.ts';
import { LogLevel, LogCategory } from '../../shared/schema';
import { storage } from '../../server/storage';

/**
 * Log test results to console
 */
async function logTestResult(message: string, data?: any) {
  console.log(`[TEST] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  
  // Also log to storage
  await storage.createLog({
    level: LogLevel.INFO,
    category: LogCategory.SYSTEM,
    message: `[VectorMemoryTest] ${message}`,
    details: data ? JSON.stringify(data) : null,
    source: 'vector-memory-test',
    projectId: null,
    userId: null,
    sessionId: null,
    duration: null,
    statusCode: null,
    endpoint: null,
    tags: ['memory', 'vector', 'test']
  });
}

/**
 * Test the enhanced vector memory system
 */
export async function testVectorMemory() {
  await logTestResult('Starting vector memory test');
  
  // Clear any existing entries
  await vectorMemory.clear();
  await logTestResult('Memory cleared');
  
  // 1. Add sample entries with different categories, tags, and importance
  await populateSampleEntries();
  
  // 2. Perform various types of searches to demonstrate capabilities
  await performBasicSearch();
  await performHybridSearch();
  await performContextualSearch();
  await performCategoryAndTagFiltering();
  await performTimeWeightedSearch();
  await performDiversitySearch();
  await performClusterAnalysis();
  
  await logTestResult('Vector memory test completed');
}

/**
 * Populate the vector memory with sample entries
 */
async function populateSampleEntries() {
  const entries = [
    // Real estate market analyses
    {
      text: "The Grandview, WA real estate market is showing strong growth in Q1 2025. Single-family home prices have increased by 8.2% year-over-year, with the median price now at $412,000. Inventory remains tight at 1.5 months of supply, pushing prices upward as demand outpaces available listings. New construction activity has increased by 15% but primarily focuses on higher-end homes above $500,000.",
      metadata: {
        source: "market-analysis",
        category: "market-trend",
        tags: ["grandview", "washington", "price-increase", "inventory", "q1-2025"],
        importance: 0.9,
        confidence: 0.95,
        timestamp: new Date().toISOString()
      }
    },
    {
      text: "Rental rates in Grandview have stabilized after rapid increases in 2024. The average two-bedroom apartment rents for $1,850 per month, representing only a 2.1% increase from last quarter. Vacancy rates remain low at 3.7%, but new multifamily developments are expected to add 120 units to the market by year-end, which may relieve some pressure on the rental market.",
      metadata: {
        source: "market-analysis",
        category: "rental-market",
        tags: ["grandview", "washington", "rental", "apartment", "vacancy"],
        importance: 0.8,
        confidence: 0.9,
      }
    },
    
    // Property valuations
    {
      text: "Comparative market analysis for 2204 Hill Dr, Grandview, WA 98930: This 3-bedroom, 2-bathroom single-family home with 1,850 sq ft on a 0.28-acre lot has an estimated market value of $385,000-$405,000. Recent comparable sales in the neighborhood have ranged from $370,000 to $420,000 for similar-sized properties. The property's updated kitchen and bathrooms provide additional value compared to other homes in the area.",
      metadata: {
        source: "property-valuation",
        category: "single-family",
        tags: ["grandview", "washington", "hill-drive", "3-bedroom", "valuation"],
        importance: 0.85,
        confidence: 0.92,
      }
    },
    {
      text: "Investment analysis for 415 Birch Ave, Grandview, WA: This 8-unit apartment building provides an excellent investment opportunity with a current cap rate of 7.2%. The property generates $11,500 in monthly rental income with a 95% occupancy rate. Annual expenses including property management, maintenance, taxes, and insurance are approximately $42,000. The estimated return on investment over 5 years is 11.3% annually.",
      metadata: {
        source: "investment-analysis",
        category: "multi-family",
        tags: ["grandview", "washington", "investment", "apartment-building", "cap-rate"],
        importance: 0.95,
        confidence: 0.88,
      }
    },
    
    // Neighborhood analyses
    {
      text: "Westside neighborhood in Grandview, WA offers excellent family living conditions with top-rated schools, low crime rates, and abundant recreational facilities. The area has seen property values increase by 12% over the past year, outperforming the broader Grandview market. The neighborhood features a mix of homes built in the 1990s and early 2000s, with median prices around $450,000.",
      metadata: {
        source: "neighborhood-analysis",
        category: "neighborhood-profile",
        tags: ["grandview", "washington", "westside", "family-friendly", "schools"],
        importance: 0.75,
        confidence: 0.9,
      }
    },
    {
      text: "Downtown Grandview is experiencing significant revitalization with four new mixed-use developments under construction. These projects will add 75 residential units and 25,000 sq ft of commercial space by late 2025. The city has also approved streetscape improvements and pedestrian-friendly redesigns of Main Street. Property values in this area have appreciated 15% in the past 18 months.",
      metadata: {
        source: "development-report",
        category: "urban-development",
        tags: ["grandview", "washington", "downtown", "mixed-use", "revitalization"],
        importance: 0.8,
        confidence: 0.85,
      }
    },
    
    // Coding and development related entries
    {
      text: "The React component library implements a reusable map visualization that integrates with Leaflet to display property locations. The component accepts GeoJSON data and provides customizable markers and popups. Event handlers allow for interactive filtering and selection of properties directly from the map interface.",
      metadata: {
        source: "code-documentation",
        category: "frontend-development",
        tags: ["react", "leaflet", "map", "geojson", "component"],
        importance: 0.7,
        confidence: 0.95,
      }
    },
    {
      text: "The property data API endpoint '/api/properties' accepts filtering parameters including price range, square footage, bedrooms, bathrooms, and location bounds. Results are paginated with a default limit of 20 items per page. The response includes total count and navigation links. Authentication is required via JWT token in the Authorization header.",
      metadata: {
        source: "api-documentation",
        category: "backend-development",
        tags: ["api", "endpoint", "property-data", "filtering", "pagination"],
        importance: 0.75,
        confidence: 0.9,
      }
    },
    
    // Market predictions
    {
      text: "Market forecast for Grandview, WA for Q3-Q4 2025: We predict continued moderate growth with prices increasing 4-6% annually. Inventory is expected to improve slightly as new construction projects reach completion. Interest rates may stabilize around 5.8-6.2%, supporting sustained buyer demand. The luxury segment above $750,000 may see slower growth due to affordability constraints.",
      metadata: {
        source: "market-prediction",
        category: "forecast",
        tags: ["grandview", "washington", "forecast", "2025", "interest-rates"],
        importance: 0.85,
        confidence: 0.75, // Lower confidence for predictions
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
      }
    },
    {
      text: "Updated market forecast for Grandview, WA for Q3-Q4 2025: Based on recent economic indicators, we've revised our prediction to show stronger growth of 6-8% annually. New job announcements in the area and improved transportation infrastructure are creating additional demand. Interest rates are now expected to remain between 5.5-6.0%, further supporting price growth.",
      metadata: {
        source: "market-prediction",
        category: "forecast",
        tags: ["grandview", "washington", "forecast", "2025", "revised", "economic-indicators"],
        importance: 0.9,
        confidence: 0.8,
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      }
    },
    
    // Client interactions
    {
      text: "Client meeting notes with Johnson family: Looking for a 4-bedroom home in Westside neighborhood, budget $450,000-$500,000. Need good school district, prefer at least 0.25 acre lot. Timing is flexible but would like to move by September 2025. Preapproved for conventional loan with 20% down.",
      metadata: {
        source: "client-notes",
        category: "buyer-needs",
        tags: ["client", "buyer", "family", "4-bedroom", "westside"],
        importance: 0.7,
        confidence: 0.95,
      }
    },
    {
      text: "Investment strategy discussion with Maria Rodriguez: Interested in building a portfolio of rental properties in Grandview. Initial budget of $1.2M, seeking cash-flow positive properties with minimum 6% cap rate. Prefers turnkey properties but open to light renovations. Long-term investment horizon of 10+ years.",
      metadata: {
        source: "client-notes",
        category: "investor-strategy",
        tags: ["client", "investor", "rental", "portfolio", "cap-rate"],
        importance: 0.8,
        confidence: 0.95,
      }
    }
  ];
  
  // Add all entries to vector memory
  for (const entry of entries) {
    // Ensure all entries have a timestamp
    const metadata = {
      ...entry.metadata,
      timestamp: entry.metadata.timestamp || new Date().toISOString()
    };
    
    await vectorMemory.addEntry(
      entry.text,
      metadata
    );
  }
  
  const count = await vectorMemory.count();
  await logTestResult(`Added ${count} sample entries to vector memory`);
}

/**
 * Perform basic semantic search
 */
async function performBasicSearch() {
  const query = "What's happening in the Grandview real estate market?";
  
  const results = await vectorMemory.search(query, {
    limit: 3,
    threshold: 0.7
  });
  
  await logTestResult('Basic Semantic Search Results', {
    query,
    resultCount: results.length,
    topResult: results.length > 0 ? {
      textPreview: results[0].entry.text.substring(0, 100) + '...',
      score: results[0].score,
      category: results[0].entry.metadata.category,
      tags: results[0].entry.metadata.tags
    } : null,
    allScores: results.map(r => r.score)
  });
}

/**
 * Perform hybrid search (semantic + keyword)
 */
async function performHybridSearch() {
  const query = "rental rates in Grandview";
  
  const basicResults = await vectorMemory.search(query, {
    limit: 3,
    threshold: 0.6
  });
  
  const hybridOptions: AdvancedSearchOptions = {
    limit: 3,
    threshold: 0.6,
    hybridSearch: {
      enabled: true,
      keywordWeight: 0.4,
      semanticWeight: 0.6
    }
  };
  
  const hybridResults = await vectorMemory.search(query, hybridOptions);
  
  await logTestResult('Hybrid Search Comparison', {
    query,
    basicSearch: {
      resultCount: basicResults.length,
      topResult: basicResults.length > 0 ? {
        textPreview: basicResults[0].entry.text.substring(0, 100) + '...',
        score: basicResults[0].score
      } : null,
      allScores: basicResults.map(r => r.score)
    },
    hybridSearch: {
      resultCount: hybridResults.length,
      topResult: hybridResults.length > 0 ? {
        textPreview: hybridResults[0].entry.text.substring(0, 100) + '...',
        score: hybridResults[0].score,
        matchType: hybridResults[0].matchInfo?.matchType
      } : null,
      allScores: hybridResults.map(r => r.score)
    }
  });
}

/**
 * Perform contextual search
 */
async function performContextualSearch() {
  const query = "investment opportunities";
  const contextText = "I'm interested in multifamily properties with good returns.";
  
  const basicResults = await vectorMemory.search(query, {
    limit: 3,
    threshold: 0.6
  });
  
  const contextOptions: AdvancedSearchOptions = {
    limit: 3,
    threshold: 0.6,
    contextualSearch: {
      enabled: true,
      contextText,
      contextWeight: 0.4
    }
  };
  
  const contextualResults = await vectorMemory.search(query, contextOptions);
  
  await logTestResult('Contextual Search Comparison', {
    query,
    context: contextText,
    basicSearch: {
      resultCount: basicResults.length,
      topResult: basicResults.length > 0 ? {
        textPreview: basicResults[0].entry.text.substring(0, 100) + '...',
        score: basicResults[0].score
      } : null
    },
    contextualSearch: {
      resultCount: contextualResults.length,
      topResult: contextualResults.length > 0 ? {
        textPreview: contextualResults[0].entry.text.substring(0, 100) + '...',
        score: contextualResults[0].score,
        contextRelevance: contextualResults[0].matchInfo?.contextRelevance
      } : null
    }
  });
}

/**
 * Perform category and tag filtering
 */
async function performCategoryAndTagFiltering() {
  const query = "property value trends";
  
  const filterOptions: AdvancedSearchOptions = {
    limit: 3,
    threshold: 0.6,
    filter: {
      categories: ['market-trend', 'neighborhood-profile'],
      tags: ['price-increase', 'appreciation']
    }
  };
  
  const filteredResults = await vectorMemory.search(query, filterOptions);
  
  await logTestResult('Category and Tag Filtered Search', {
    query,
    filter: filterOptions.filter,
    resultCount: filteredResults.length,
    results: filteredResults.map(r => ({
      textPreview: r.entry.text.substring(0, 100) + '...',
      score: r.score,
      category: r.entry.metadata.category,
      tags: r.entry.metadata.tags
    }))
  });
}

/**
 * Perform time-weighted search
 */
async function performTimeWeightedSearch() {
  const query = "market forecast for Grandview";
  
  const basicResults = await vectorMemory.search(query, {
    limit: 3,
    threshold: 0.6
  });
  
  const timeWeightedOptions: AdvancedSearchOptions = {
    limit: 3,
    threshold: 0.6,
    timeWeighting: {
      enabled: true,
      halfLifeDays: 30,
      maxBoost: 1.5
    }
  };
  
  const timeWeightedResults = await vectorMemory.search(query, timeWeightedOptions);
  
  await logTestResult('Time-Weighted Search Comparison', {
    query,
    basicSearch: {
      resultCount: basicResults.length,
      results: basicResults.map(r => ({
        textPreview: r.entry.text.substring(0, 100) + '...',
        score: r.score,
        timestamp: r.entry.metadata.timestamp
      }))
    },
    timeWeightedSearch: {
      resultCount: timeWeightedResults.length,
      results: timeWeightedResults.map(r => ({
        textPreview: r.entry.text.substring(0, 100) + '...',
        score: r.score,
        timestamp: r.entry.metadata.timestamp
      }))
    }
  });
}

/**
 * Perform diversity-oriented search
 */
async function performDiversitySearch() {
  const query = "Grandview property market";
  
  const basicResults = await vectorMemory.search(query, {
    limit: 5,
    threshold: 0.6
  });
  
  const diversityOptions: AdvancedSearchOptions = {
    limit: 5,
    threshold: 0.6,
    diversityOptions: {
      enabled: true,
      minDistance: 0.2,
      maxSimilarResults: 1
    }
  };
  
  const diverseResults = await vectorMemory.search(query, diversityOptions);
  
  await logTestResult('Diversity Search Comparison', {
    query,
    basicSearch: {
      resultCount: basicResults.length,
      categories: basicResults.map(r => r.entry.metadata.category)
    },
    diverseSearch: {
      resultCount: diverseResults.length,
      categories: diverseResults.map(r => r.entry.metadata.category)
    }
  });
}

/**
 * Perform cluster analysis
 */
async function performClusterAnalysis() {
  const { clusters, clusterScores } = await vectorMemory.clusterEntries({
    minimumClusterSize: 2,
    similarityThreshold: 0.7,
    maxClusters: 3
  });
  
  await logTestResult('Memory Clustering Results', {
    clusterCount: clusters.length,
    clusterSizes: clusters.map(c => c.length),
    clusterScores,
    clusterTopics: clusters.map((cluster, i) => ({
      score: clusterScores[i],
      size: cluster.length,
      categories: [...new Set(cluster.map(e => e.metadata.category))],
      commonTags: findCommonTags(cluster)
    }))
  });
}

/**
 * Helper to find common tags across entries
 */
function findCommonTags(entries: any[]): string[] {
  if (entries.length === 0) return [];
  
  // Start with all tags from the first entry
  const tagCounts = new Map<string, number>();
  
  for (const entry of entries) {
    const tags = entry.metadata.tags || [];
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  
  // Find tags that appear in at least half the entries
  const threshold = Math.ceil(entries.length / 2);
  return Array.from(tagCounts.entries())
    .filter(([_, count]) => count >= threshold)
    .map(([tag, _]) => tag);
}

// Export functions
export default {
  testVectorMemory
};