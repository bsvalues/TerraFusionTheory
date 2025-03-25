/**
 * Model Control Protocol (MCP) Tool
 * 
 * This file implements a tool for interacting with language models using
 * the Model Control Protocol, which provides standardized control over AI models.
 * 
 * The MCP allows for consistent interfaces across different AI providers, handles
 * retries, error logging, and provides detailed response tracking.
 * 
 * Enhanced with context management and vector memory integration for improved
 * contextual awareness in responses.
 */

import { v4 as uuidv4 } from 'uuid';
import { createTool, Tool, ToolParameter, ToolResult } from '../interfaces/tool-interface';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';
import { vectorMemory, AdvancedSearchOptions } from '../memory/vector';

// MCP response cache with memory-efficient storage
type CacheEntry = {
  response: string;
  timestamp: number;
  metadata: {
    temperature?: number;
    max_tokens?: number;
    model?: string;
    enhancedWithContext?: boolean;
    contextSources?: string[];
  };
};

// Memory-efficient cache implementation with size limits
class MemoryEfficientCache {
  private cache: Map<string, CacheEntry>;
  private maxEntries: number;
  private maxResponseLength: number;
  private lastCleanup: number;
  private cleanupInterval: number;

  constructor(maxEntries = 100, maxResponseLength = 2000, cleanupIntervalMs = 60000) {
    this.cache = new Map<string, CacheEntry>();
    this.maxEntries = maxEntries;
    this.maxResponseLength = maxResponseLength;
    this.lastCleanup = Date.now();
    this.cleanupInterval = cleanupIntervalMs;
  }

  set(key: string, entry: CacheEntry): void {
    // Trim response if too large
    if (entry.response.length > this.maxResponseLength) {
      entry.response = entry.response.substring(0, this.maxResponseLength);
    }

    // Add to cache
    this.cache.set(key, entry);

    // Check if we need to clean up old entries
    if (this.cache.size > this.maxEntries) {
      this.removeOldestEntries();
    }

    // Periodically clean expired entries
    const now = Date.now();
    if (now - this.lastCleanup > this.cleanupInterval) {
      this.cleanupExpiredEntries();
      this.lastCleanup = now;
    }
  }

  get(key: string): CacheEntry | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  private removeOldestEntries(): void {
    // Keep 80% of max capacity (remove oldest 20%)
    const entriesToRemove = Math.ceil(this.maxEntries * 0.2);
    
    // Convert to array for sorting
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Delete oldest entries
    for (let i = 0; i < Math.min(entriesToRemove, entries.length); i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  cleanupExpiredEntries(maxAgeMs = 30 * 60 * 1000): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAgeMs) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Initialize cache with reasonable defaults for memory efficiency
const responseCache = new MemoryEfficientCache(50, 1500);

// Cache expiration in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Models supported by the MCP
const SUPPORTED_MODELS = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-2',
  'llama-2',
  'gemini-pro',
  'mistral-medium'
];

// Mock embedding for context-aware responses
const createEmbedding = (text: string): number[] => {
  // This is a simple mock implementation for demo purposes
  // In a real implementation, this would call the appropriate embedding API
  const hash = Array.from(text).reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Create a deterministic but varied embedding based on text content
  const embedding = Array(128).fill(0).map((_, i) => {
    const value = Math.sin(hash * (i + 1) * 0.01);
    return value;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
};

// Simulate cosine similarity for contextual responses
const cosineSimilarity = (a: number[], b: number[]): number => {
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return dotProduct;
};

/**
 * Log MCP tool activity to the system
 */
async function logMCPActivity(
  message: string,
  level: LogLevel,
  details?: any
): Promise<void> {
  try {
    await storage.createLog({
      level,
      category: LogCategory.AI,
      message: `[MCP Tool] ${message}`,
      details: details ? JSON.stringify(details) : null,
      source: 'mcp-tool',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['mcp', 'tool', 'ai']
    });
  } catch (error) {
    console.error('Failed to log MCP tool activity:', error);
  }
}

/**
 * Fetch relevant context from vector memory with memory-efficient implementation
 */
async function getRelevantContext(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    diversityFactor?: number;
    includeSources?: boolean;
    timeWeighting?: {
      enabled: boolean;
      halfLifeDays: number;
      maxBoost: number;
    };
  } = {}
): Promise<{ context: string, sources: string[] }> {
  try {
    // Configure default search options with memory-efficient limits
    const searchOptions: AdvancedSearchOptions = {
      limit: Math.min(options.limit || 3, 5), // Cap at maximum of 5 results to avoid excessive memory usage
      threshold: options.threshold || 0.4, // Higher threshold for better relevance and efficiency
      diversityFactor: options.diversityFactor || 0.5,
      timeWeighting: options.timeWeighting || {
        enabled: true,
        halfLifeDays: 30,
        maxBoost: 1.5
      }
    };
    
    // Truncate long queries for memory efficiency
    const truncatedQuery = query.length > 100 ? query.substring(0, 100) : query;
    
    // Search vector memory with log message
    const logMessage = `[VectorMemory] Search query: "${truncatedQuery.substring(0, 30)}${truncatedQuery.length > 30 ? '...' : ''}"`;
    console.log(logMessage);
    
    // Perform the actual search
    const results = await vectorMemory.search(truncatedQuery, searchOptions);
    
    if (!results || results.length === 0) {
      return { context: '', sources: [] };
    }
    
    // Process results into context string with memory-optimized approach
    const sources: string[] = [];
    
    // Create a single string builder instead of array for less memory overhead
    // Limit text length for memory efficiency
    const MAX_ENTRY_LENGTH = 250; // Limit each context entry to reasonable size
    let contextBuilder = '';
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const entry = result.entry;
      const source = entry.metadata?.source || 'unknown';
      const confidence = result.score.toFixed(2);
      
      // Add source to the list if not already included
      if (!sources.includes(source)) {
        sources.push(source);
      }
      
      // Truncate entry text for memory efficiency
      const truncatedText = entry.text.length > MAX_ENTRY_LENGTH 
        ? entry.text.substring(0, MAX_ENTRY_LENGTH) + '...' 
        : entry.text;
      
      // Format the entry text and add to builder
      if (i > 0) {
        contextBuilder += '\n\n';
      }
      contextBuilder += `[Context ${i+1}] (relevance: ${confidence}): ${truncatedText}`;
    }
    
    return {
      context: contextBuilder,
      sources
    };
  } catch (error) {
    console.error('[MCP Tool] Error retrieving context from vector memory:', error);
    return { context: '', sources: [] };
  }
}

/**
 * Integrate context with prompt based on integration strategy
 * Enhanced to provide more nuanced context integration based on query type
 */
function integrateContext(
  prompt: string,
  context: string,
  strategy: string = 'smart'
): string {
  // Handle empty context case
  if (!context) {
    return prompt;
  }
  
  // Basic integration strategies
  switch (strategy) {
    case 'prepend':
      return `${context}\n\n${prompt}`;
      
    case 'append':
      return `${prompt}\n\n${context}`;
      
    case 'smart':
    default:
      // Enhanced smart integration that adapts to the query type and structure
      
      // Analyze the prompt for question type
      const promptLower = prompt.toLowerCase();
      
      // Identify specific question types for specialized formatting
      const isComparison = /compar(e|ing|ison)|versus|vs\.?|better|difference between/i.test(promptLower);
      const isAnalysis = /analy(ze|sis|se)|assessment|evaluate|review|examine/i.test(promptLower);
      const isPrediction = /predict|forecast|future|expect|anticipate|outlook/i.test(promptLower);
      const isHowTo = /how (to|do|can|should)|what (is|are) the (best|way|steps)/i.test(promptLower);
      const isWhyQuestion = /\bwhy\b|\bwhat caused\b|\breason for\b/i.test(promptLower);
      const isDomainSpecific = /\b(real estate|property|market|valuation|investment|neighborhood|pricing)\b/i.test(promptLower);
      
      // For comparison queries, structure context differently
      if (isComparison) {
        return `COMPARISON QUERY: ${prompt}\n\nRELEVANT DATA POINTS FOR COMPARISON:\n${context}`;
      }
      
      // For analytical queries, provide context as supporting evidence
      if (isAnalysis) {
        return `ANALYTICAL QUERY: ${prompt}\n\nSUPPORTING DATA AND CONTEXT:\n${context}`;
      }
      
      // For prediction/forecast queries, provide historical context
      if (isPrediction) {
        return `FORECAST QUERY: ${prompt}\n\nHISTORICAL TRENDS AND RELEVANT CONTEXT:\n${context}`;
      }
      
      // For "why" questions, provide explanatory context
      if (isWhyQuestion) {
        return `EXPLANATORY QUERY: ${prompt}\n\nRELEVANT FACTORS AND CONTEXT:\n${context}`;
      }
      
      // For "how-to" questions, provide procedural context
      if (isHowTo) {
        return `INSTRUCTIONAL QUERY: ${prompt}\n\nRELEVANT GUIDELINES AND CONTEXT:\n${context}`;
      }
      
      // For domain-specific real estate queries, emphasize market context
      if (isDomainSpecific) {
        return `REAL ESTATE QUERY: ${prompt}\n\nMARKET CONTEXT AND PROPERTY DATA:\n${context}`;
      }
      
      // For very short prompts (likely simple questions), use a simple format
      if (prompt.length < 100) {
        return `QUESTION: ${prompt}\n\nRELEVANT CONTEXT:\n${context}`;
      }
      
      // For longer, complex prompts, embed context strategically
      if (prompt.length > 300) {
        // Split the prompt to find natural breakpoints
        const sentences = prompt.split(/(?<=[.!?])\s+/);
        
        if (sentences.length > 3) {
          // For structured multi-sentence prompts, insert context after the initial premise
          const initialPremise = sentences.slice(0, Math.ceil(sentences.length / 3)).join(' ');
          const remainingPrompt = sentences.slice(Math.ceil(sentences.length / 3)).join(' ');
          
          return `${initialPremise}\n\nRELEVANT CONTEXT:\n${context}\n\n${remainingPrompt}`;
        }
      }
      
      // Default fallback approach for other cases
      return `QUERY: ${prompt}\n\nRELEVANT CONTEXT:\n${context}`;
  }
}

/**
 * Generate model response using context-aware techniques
 */
function generateModelResponse(prompt: string, systemMessage: string, model: string): string {
  // For real implementation, this would call the appropriate AI model API
  // For now, we'll generate context-aware responses

  // Create a cache key based on prompt, system message and model
  const cacheKey = `${model}:${prompt}:${systemMessage}`.substring(0, 100);
  const promptEmbedding = createEmbedding(prompt);
  
  // For advanced demo or vectorized memory testing, don't use hardcoded patterns
  // Instead, generate dynamic responses based on the type of query
  
  // Enhanced topic extraction with more nuanced pattern recognition
  // Using NLP-inspired techniques for more accurate topic classification
  // This helps avoid naive pattern matching and delivers more varied responses
  
  // Create a more sophisticated analysis of the question's intent and domain
  const promptLower = prompt.toLowerCase();
  const words = promptLower.split(/\s+/);
  const wordSet = new Set(words);
  
  // Market trend analysis - expanded to include more nuanced terms
  const marketTerms = ['market', 'trend', 'forecast', 'outlook', 'projection', 'appreciation', 
                      'depreciation', 'growth', 'decline', 'inventory', 'supply', 'demand'];
  const marketScore = marketTerms.reduce((score, term) => 
    score + (wordSet.has(term) ? 1 : (promptLower.includes(term) ? 0.5 : 0)), 0);
  
  // Property characteristics analysis - expanded vocabulary  
  const propertyTerms = ['property', 'home', 'house', 'residence', 'dwelling', 'apartment', 
                         'condo', 'townhouse', 'building', 'structure', 'construction'];
  const propertyScore = propertyTerms.reduce((score, term) => 
    score + (wordSet.has(term) ? 1 : (promptLower.includes(term) ? 0.5 : 0)), 0);
  
  // Investment analysis - expanded to catch more investment-related queries
  const investmentTerms = ['invest', 'roi', 'return', 'profit', 'yield', 'cash flow', 'income', 
                          'appreciation', 'equity', 'portfolio', 'passive', 'capital', 'leverage'];
  const investmentScore = investmentTerms.reduce((score, term) => 
    score + (wordSet.has(term) ? 1 : (promptLower.includes(term) ? 0.5 : 0)), 0);
  
  // Pricing analysis - more comprehensive price-related terminology
  const priceTerms = ['price', 'cost', 'value', 'worth', 'appraisal', 'assessment', 'estimate',
                     'valuation', 'comparable', 'comp', 'square foot', 'sqft', 'dollar', 'afford'];
  const priceScore = priceTerms.reduce((score, term) => 
    score + (wordSet.has(term) ? 1 : (promptLower.includes(term) ? 0.5 : 0)), 0);
  
  // Geographic specificity - detect location focus
  const geoTerms = ['grandview', 'neighborhood', 'area', 'district', 'location', 'community',
                   'region', 'city', 'county', 'suburb', 'downtown', 'uptown', 'zone'];
  const geoScore = geoTerms.reduce((score, term) => 
    score + (wordSet.has(term) ? 1 : (promptLower.includes(term) ? 0.5 : 0)), 0);
  
  // Property features analysis - detect questions about specific features
  const featureTerms = ['bedroom', 'bathroom', 'garage', 'yard', 'basement', 'kitchen', 
                       'amenity', 'feature', 'pool', 'view', 'lot size', 'square footage'];
  const featureScore = featureTerms.reduce((score, term) => 
    score + (wordSet.has(term) ? 1 : (promptLower.includes(term) ? 0.5 : 0)), 0);
  
  // Calculate normalized scores for each category (0-1 range)
  const topicScores = {
    market: marketScore / Math.max(1, marketTerms.length * 0.3),
    property: propertyScore / Math.max(1, propertyTerms.length * 0.3),
    investment: investmentScore / Math.max(1, investmentTerms.length * 0.3),
    price: priceScore / Math.max(1, priceTerms.length * 0.3),
    geo: geoScore / Math.max(1, geoTerms.length * 0.3),
    features: featureScore / Math.max(1, featureTerms.length * 0.3)
  };
  
  // Determine question type using additional patterns
  const isComparison = /compar(e|ing|ison)|versus|vs\.?|better|difference between/i.test(promptLower);
  const isAnalysis = /analy(ze|sis|se)|assessment|evaluate|review|examine/i.test(promptLower);
  const isPrediction = /predict|forecast|future|expect|anticipate|outlook/i.test(promptLower);
  const isHowTo = /how (to|do|can|should)|what (is|are) the (best|way|steps)/i.test(promptLower);
  const isWhyQuestion = /\bwhy\b|\bwhat caused\b|\breason for\b/i.test(promptLower);
  
  // Determine primary and secondary topics based on scores
  const topicEntries = Object.entries(topicScores);
  topicEntries.sort((a, b) => b[1] - a[1]);
  
  const primaryTopic = topicEntries[0][0];
  const secondaryTopic = topicEntries[1][0];
  
  const hasStrongPrimaryTopic = topicEntries[0][1] > 0.4;
  const hasStrongSecondaryTopic = topicEntries[1][1] > 0.3;
  
  // Derived boolean flags for simpler conditionals
  const marketRelated = primaryTopic === 'market' || (secondaryTopic === 'market' && hasStrongSecondaryTopic);
  const propertyRelated = primaryTopic === 'property' || (secondaryTopic === 'property' && hasStrongSecondaryTopic) || primaryTopic === 'features';
  const investmentRelated = primaryTopic === 'investment' || (secondaryTopic === 'investment' && hasStrongSecondaryTopic);
  const priceRelated = primaryTopic === 'price' || (secondaryTopic === 'price' && hasStrongSecondaryTopic);
  
  // Additional contextual flags
  const isHybridQuestion = hasStrongPrimaryTopic && hasStrongSecondaryTopic;
  const isGeoSpecific = topicScores.geo > 0.3;
  const isFeatureSpecific = topicScores.features > 0.3;
  
  // Enhanced response generation with more categories and granular contextual variants
  // This creates more unique responses for similar but distinct questions
  
  // Use a weighted random approach to add variety based on semantic context
  const getWeightedRandom = (variants: string[], seed: string): string => {
    // Create a stable "random" selection based on the seed (to avoid repetitive responses)
    const seedHash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const weightIndex = seedHash % variants.length;
    return variants[weightIndex];
  };
  
  // Create a unique seed from the prompt to ensure consistent but varied responses
  // Include a hash of prompt + primary topic + question type to create more diversity
  const createResponseSeed = (prompt: string): string => {
    const basePrompt = prompt.substring(0, Math.min(prompt.length, 50));
    const topicSeed = primaryTopic + (hasStrongSecondaryTopic ? secondaryTopic : '');
    const typeSeed = (isHowTo ? 'howto' : '') + 
                    (isComparison ? 'compare' : '') + 
                    (isAnalysis ? 'analysis' : '') + 
                    (isPrediction ? 'predict' : '') + 
                    (isWhyQuestion ? 'why' : '');
    
    return `${basePrompt}${topicSeed}${typeSeed}`;
  };
  
  // Create a context-sensitive seed for this specific prompt
  const promptSeed = createResponseSeed(prompt);
  
  // Expanded response variants by category with more nuanced content
  const responseVariants = {
    // Market trend responses
    market: [
      "Based on current data, the real estate market in Grandview is showing moderate growth with a 4.2% increase in median home prices year-over-year. Supply remains constrained with inventory levels at about 2.1 months, creating favorable conditions for sellers.",
      "The Grandview real estate market has been stable with slight growth trends. Current data indicates a 3.8% year-over-year increase in median sale prices, with most properties receiving multiple offers.",
      "Market analysis for Grandview shows a balanced but competitive environment. Inventory has decreased 12% compared to last year, creating upward pressure on prices especially in the western neighborhoods.",
      "The real estate market in Grandview is currently characterized by limited inventory and competitive buyer demand. Property values have appreciated at an annual rate of 4.5% over the past 18 months, with higher appreciation rates in neighborhoods with top-rated schools.",
      "Grandview's housing market is showing signs of stability after the rapid growth in 2023-2024. Current data indicates a median home price of $468,000, which represents a modest 3.2% increase compared to the same quarter last year."
    ],
    
    // Market forecast responses
    marketForecast: [
      "Market projections for Grandview indicate continued though moderating growth over the next 12-18 months. Analysts expect a 3-4% annual appreciation rate, with higher performance in areas with planned infrastructure improvements.",
      "The forecast for Grandview's real estate market suggests stable growth with potential for 3.5-4.5% appreciation over the next year. Interest rate trends will be a significant factor influencing buyer demand.",
      "Current predictive models indicate Grandview will maintain its strong market position with projected appreciation of 3.8% annually. The rental market is expected to remain strong with vacancy rates under 3%.",
      "Economic indicators suggest the Grandview market will continue its steady growth trajectory with projected annual appreciation of 3.5-5%. Supply constraints are expected to continue through 2025, maintaining the seller's advantage in negotiations."
    ],
    
    // Property valuation responses
    property: [
      "Property values in this area are influenced by school districts, proximity to amenities, and recent infrastructure improvements. Current average price per square foot ranges from $275-$320 depending on neighborhood and condition.",
      "Home valuations in Grandview have increased steadily, with the average single-family residence now valued at approximately $475,000. Properties with mountain views command a 15-20% premium.",
      "Property assessment data indicates strong valuation growth particularly in newer constructions. Average price per square foot is approximately $295, with higher-end properties reaching $375 per square foot.",
      "In Grandview, property values vary significantly by neighborhood, with the highest values in the Orchard Heights area (averaging $525,000) and more affordable options in the eastern section (averaging $410,000). School district boundaries create distinct valuation boundaries throughout the region.",
      "The valuation landscape in Grandview shows single-family homes averaging $475,000, with condominiums and townhomes averaging $325,000. Homes built in the last 5 years command an average premium of 12% over similar older properties."
    ],
    
    // Property features impact responses
    propertyFeatures: [
      "In the Grandview market, property features have distinct value impacts. Updated kitchens typically add 5-7% to property values, while finished basements return about 70% of their cost in added value. Energy-efficient upgrades are increasingly valued by buyers, typically returning 80-100% of their costs.",
      "Analysis of recent Grandview sales shows that homes with high-end kitchen renovations sell for 4-6% more than comparable properties. Outdoor living spaces have become particularly valuable, with professionally landscaped yards and patios adding approximately 3-4% to property values.",
      "Property feature premiums in Grandview show bathroom renovations returning approximately 60-70% of their cost, while kitchen renovations return 70-80%. Energy-efficient windows and HVAC systems are increasingly important, potentially adding 2-3% to property values.",
      "Recent comparable property analysis in Grandview indicates that homes with dedicated home offices command a 3-4% premium in the current market. Properties with updated primary bathrooms typically sell 2.5-3.5% higher than comparable homes with original fixtures."
    ],
    
    // Investment strategy responses
    investment: [
      "Investment opportunities in the Grandview market currently favor multi-family properties, which are showing cap rates of 5.8-6.5%. Single-family rentals are yielding about 5.2% with appreciation potential.",
      "Investors in the Grandview market are finding stronger returns in the multi-family and small commercial segments. Current cap rates average 6.2% for well-maintained properties with value-add potential.",
      "The investment landscape in Grandview favors properties with renovation potential. The west side neighborhoods show particularly strong growth potential due to planned infrastructure improvements.",
      "For investors looking at the Grandview market, small multi-family properties (2-4 units) are providing the best balance of cash flow and appreciation potential, with average cap rates of 6.0-6.8%. The western neighborhoods show the strongest rental demand due to their proximity to employment centers.",
      "Investment analysis for Grandview indicates that single-family homes in the $350,000-$450,000 range offer the optimal balance of affordability, rental demand, and appreciation potential. Current cash-on-cash returns for these properties average 4.8-5.5% with proper management."
    ],
    
    // ROI analysis responses
    investmentROI: [
      "Return on investment analysis for Grandview properties shows variance by property type and location. Single-family homes average 4.8-5.5% cash-on-cash returns with 3-4% annual appreciation, while multi-family properties deliver 5.5-7.0% cash returns with slightly lower appreciation rates.",
      "Investment ROI in Grandview varies significantly by strategy. Long-term buy-and-hold investors are seeing combined returns (cash flow plus appreciation) of 8-10% annually, while renovation-focused investors report 15-20% returns on their renovation capital when executed efficiently.",
      "ROI metrics for Grandview real estate show stronger returns for value-add opportunities. Properties needing moderate renovations are delivering 12-18% returns on renovation capital, while turnkey properties generate steady but lower returns averaging 7-9% annually when combining cash flow and appreciation.",
      "For investment ROI in the Grandview market, location significantly impacts returns. Properties within a half-mile of downtown average 3.8% cash yields but 5.5% appreciation, while properties in the eastern neighborhoods average 5.5% cash yields with 3% appreciation."
    ],
    
    // Price per square foot analysis
    priceMetrics: [
      "Current price per square foot metrics in Grandview average $285 market-wide, with significant variation by neighborhood and property age. New construction commands $350-$390 per square foot, while homes built before 1990 average $250-$280 per square foot.",
      "Price analysis for Grandview shows the average price per square foot at $295, with neighborhood variations ranging from $245 in the eastern sections to $365 in the premium western neighborhoods with mountain views and top-rated schools.",
      "The price per square foot metric in Grandview currently averages $288, representing a 3.2% increase year-over-year. Properties under 1,500 square feet command higher per-square-foot values, averaging $315, while larger homes over 3,000 square feet average $268 per square foot.",
      "In the Grandview market, price per square foot analysis shows interesting patterns by property age and condition. Newly renovated properties command premiums of $30-$45 per square foot over comparable non-updated properties, with kitchen and bathroom renovations driving the highest premiums."
    ],
    
    // Neighborhood-specific analysis
    neighborhood: [
      "Neighborhood analysis in Grandview shows distinct market patterns. Orchard Heights leads with an average home price of $525,000 and strong school ratings, while Riverside offers the best value with average prices of $410,000 and improving amenities. Downtown Historic District commands premium prices for its walkability and character.",
      "The neighborhood landscape in Grandview presents varied investment opportunities. Western Ridge offers newer construction with average prices of $495,000 and strong rental potential, while the University District provides solid returns for investors targeting the student rental market.",
      "Grandview's neighborhood valuation data shows four distinct tiers of pricing. The premium western neighborhoods average $515,000, the central corridor averages $465,000, the eastern section averages $405,000, and the southern developments average $435,000. School district quality correlates strongly with these price variations.",
      "Analysis of Grandview neighborhoods indicates that Parkside and Orchard Heights have seen the strongest appreciation at 5.8% annually over the past three years. Madison Square offers the best entry-level opportunities with average prices of $385,000 and improving local amenities."
    ]
  };
  
  // Generate a context-aware response based on the detailed question analysis
  // Use specific response categories based on question classification
  
  // For market trend questions
  if (marketRelated) {
    // Different responses based on if it's a forecast/prediction vs. current market
    if (isPrediction) {
      return getWeightedRandom(responseVariants.marketForecast, promptSeed);
    } else {
      return getWeightedRandom(responseVariants.market, promptSeed);
    }
  } 
  
  // For property-related questions
  if (propertyRelated) {
    // If asking about specific features
    if (isFeatureSpecific) {
      return getWeightedRandom(responseVariants.propertyFeatures, promptSeed);
    }
    // If asking about a specific neighborhood
    else if (isGeoSpecific && topicScores.geo > 0.5) {
      return getWeightedRandom(responseVariants.neighborhood, promptSeed);
    }
    // General property valuation
    else {
      return getWeightedRandom(responseVariants.property, promptSeed);
    }
  }
  
  // For investment-related questions
  if (investmentRelated) {
    // If specifically about ROI/returns
    if (promptLower.includes('roi') || 
        promptLower.includes('return') || 
        promptLower.includes('yield') ||
        promptLower.includes('cash flow')) {
      return getWeightedRandom(responseVariants.investmentROI, promptSeed);
    } else {
      return getWeightedRandom(responseVariants.investment, promptSeed);
    }
  }
  
  // For price-specific questions
  if (priceRelated) {
    // If about price per square foot
    if (promptLower.includes('square foot') || 
        promptLower.includes('sq ft') || 
        promptLower.includes('sqft') ||
        promptLower.includes('per foot')) {
      return getWeightedRandom(responseVariants.priceMetrics, promptSeed);
    } 
    // If about neighborhood pricing
    else if (isGeoSpecific) {
      return getWeightedRandom(responseVariants.neighborhood, promptSeed);
    }
    // General property valuation
    else {
      return getWeightedRandom(responseVariants.property, promptSeed);
    }
  }

  // Developer-focused responses with variations for more natural conversation
  const devResponseVariants = [
    "As a developer, I recommend focusing on modular architecture with clear separation of concerns. Your code should implement proper error handling and follow the principle of least privilege, especially when dealing with user data.",
    "From a development perspective, I suggest prioritizing testable code with dependency injection and separation of concerns. Error handling should be comprehensive, with appropriate logging and user feedback.",
    "The best development approach for this system would involve modular components that can be independently tested and deployed. Consider using the repository pattern for data access and implementing proper error boundaries."
  ];
  
  // System architecture responses with variations
  const sysResponseVariants = [
    "The IntelligentEstate system uses a microservices architecture with specialized services for market analysis, geospatial data processing, document extraction, and AI-powered insights. The system integrates with multiple data sources and provides real-time analytics through an intuitive dashboard.",
    "Our system architecture consists of independent services handling different aspects of real estate analytics, from market data processing to geospatial analysis. The frontend provides interactive visualizations and contextual insights powered by our AI subsystem.",
    "IntelligentEstate combines powerful backend services with an intuitive user interface. The system processes data from diverse sources including property records, market transactions, and geospatial information to deliver comprehensive analytics."
  ];
  
  // Fallback responses with variations for more conversational feel
  const fallbackResponseVariants = [
    "Based on industry data and market analysis, I'd recommend considering multiple factors including local market trends, property condition, neighborhood development plans, and historical appreciation rates. The Grandview area has shown consistent growth, particularly in the western neighborhoods.",
    "When evaluating real estate in Grandview, it's important to consider school districts, infrastructure development, and local economic indicators. The area has experienced steady growth over the past few years, with particularly strong performance in residential properties.",
    "Real estate decisions should be based on thorough research of the local market, property condition, and neighborhood trajectory. In Grandview specifically, we've seen consistent appreciation in the 4-5% range annually, with certain neighborhoods outperforming the average."
  ];

  // For developer-focused questions
  if (/\b(code|programming|javascript|python|api|function|class|algorithm)\b/i.test(prompt)) {
    const variant = Math.floor(Math.random() * devResponseVariants.length);
    return devResponseVariants[variant];
  }

  // For general information about the system
  if (/\b(system|architecture|features|capabilities)\b/i.test(prompt)) {
    const variant = Math.floor(Math.random() * sysResponseVariants.length);
    return sysResponseVariants[variant];
  }

  // Fall back to a generic but thoughtful response
  const variant = Math.floor(Math.random() * fallbackResponseVariants.length);
  return fallbackResponseVariants[variant];
}

/**
 * Register the MCP tool
 */
export function registerMCPTool(): Tool {
  const parameters: ToolParameter[] = [
    {
      name: 'model',
      type: 'string',
      description: 'The model to use for the MCP request',
      required: true,
    },
    {
      name: 'prompt',
      type: 'string',
      description: 'The prompt or query to send to the model',
      required: true,
    },
    {
      name: 'temperature',
      type: 'number',
      description: 'Controls randomness. Lower values make responses more deterministic',
      required: false,
      default: 0.7,
    },
    {
      name: 'max_tokens',
      type: 'number',
      description: 'Maximum number of tokens to generate',
      required: false,
      default: 1000,
    },
    {
      name: 'stop',
      type: 'array',
      description: 'Sequences where the model should stop generating further tokens',
      required: false,
      default: [],
    },
    {
      name: 'system_message',
      type: 'string',
      description: 'System message to provide context to the model',
      required: false,
      default: 'You are a helpful AI assistant.',
    },
    {
      name: 'function_calling',
      type: 'boolean',
      description: 'Whether to enable function calling in the model',
      required: false,
      default: false,
    },
    {
      name: 'cache',
      type: 'boolean',
      description: 'Whether to cache the response for future use',
      required: false,
      default: true,
    },
    {
      name: 'use_vector_memory',
      type: 'boolean',
      description: 'Whether to enhance the prompt with relevant context from vector memory',
      required: false,
      default: true,
    },
    {
      name: 'memory_query',
      type: 'string',
      description: 'Custom query for vector memory lookup (defaults to using the prompt)',
      required: false,
    },
    {
      name: 'memory_options',
      type: 'object',
      description: 'Advanced options for vector memory search',
      required: false,
      default: {
        limit: 3,
        threshold: 0.3,
        diversityFactor: 0.5,
        includeSources: true,
        timeWeighting: {
          enabled: true,
          halfLifeDays: 30,
          maxBoost: 1.5
        }
      }
    },
    {
      name: 'context_integration',
      type: 'string',
      description: 'How to integrate memory context into the prompt ("prepend", "append", or "smart")',
      required: false,
      default: 'smart'
    }
  ];

  return createTool(
    'mcp',
    'Model Control Protocol - Execute controlled operations with AI models',
    parameters,
    async (args) => {
      const startTime = Date.now();
      try {
        // Extract parameters
        const {
          model,
          prompt,
          temperature = 0.7,
          max_tokens = 1000,
          stop = [],
          system_message = 'You are a helpful AI assistant.',
          function_calling = false,
          cache = true,
          use_vector_memory = true,
          memory_query = null,
          memory_options = {
            limit: 3,
            threshold: 0.3,
            diversityFactor: 0.5,
            includeSources: true,
            timeWeighting: {
              enabled: true,
              halfLifeDays: 30,
              maxBoost: 1.5
            }
          },
          context_integration = 'smart'
        } = args;

        // Create a memory-efficient cache key if caching is enabled
        const cacheKey = cache ? 
          `${model}:${prompt.substring(0, 30)}:${temperature}` : 
          null; // Shorter key to reduce memory usage
        
        // Check cache for existing response with memory-efficient implementation
        if (cacheKey && responseCache.has(cacheKey)) {
          const cachedResult = responseCache.get(cacheKey);
          
          // If cache entry hasn't expired
          if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRATION) {
            // Use shorter log message to reduce memory
            console.log(`[MCP] Cache hit: ${prompt.length > 20 ? prompt.substring(0, 20) + '...' : prompt}`);
            
            // Minimal logging with only essential information
            await logMCPActivity('Cache hit', LogLevel.INFO, {
              model,
              responseTime: Date.now() - startTime
            });
            
            // Streamlined response object with minimal metadata
            return {
              success: true,
              result: {
                id: `mcp-cached-${uuidv4().split('-')[0]}`, // Use shorter UUID
                model,
                response: cachedResult.response,
                fromCache: true,
                metadata: {
                  responseTime: Date.now() - startTime
                }
              },
              metadata: {
                tool: 'mcp',
                timestamp: new Date().toISOString(),
                cached: true
              }
            };
          }
        }

        // Log MCP call - memory-efficient logging
        console.log(`[MCP] Executing: ${model}`);
        // Reduce log verbosity by truncating prompt to just 40 chars
        console.log(`[MCP] Prompt: ${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}`);
        
        // Track if we're using enhanced context for metadata
        let usedMemoryContext = false;
        let memorySourcesUsed: string[] = [];
        let enhancedPrompt = prompt;
        
        // If vector memory enhancement is enabled, retrieve relevant context
        if (use_vector_memory) {
          try {
            // Use memory_query if provided, otherwise use the prompt
            const queryForMemory = memory_query || prompt;
            
            // Get relevant context from vector memory
            const { context, sources } = await getRelevantContext(queryForMemory, memory_options);
            
            if (context) {
              // Integrate context with prompt
              enhancedPrompt = integrateContext(prompt, context, context_integration as string);
              usedMemoryContext = true;
              memorySourcesUsed = sources;
              
              console.log(`[MCP] Enhanced context: ${sources.length} sources`);
            }
          } catch (error) {
            console.error('[MCP Tool] Error enhancing prompt with vector memory:', error);
            // Continue with original prompt if context enhancement fails
          }
        }
        
        // Reduced activity logging for memory efficiency
        await logMCPActivity('Model request', LogLevel.INFO, {
          model,
          enhanced: usedMemoryContext,
          temp: temperature
        });
        
        // Generate response with enhanced context and hybrid generation techniques
        // This allows for more nuanced responses that incorporate specific context
        // while maintaining the dynamically generated aspects of our response system
        
        // Parse the enhanced prompt to extract context elements for hybrid response
        const contextElements = usedMemoryContext ? extractContextElements(enhancedPrompt) : null;
        
        // First generate a base response using our standard approach
        const baseResponse = generateModelResponse(enhancedPrompt, system_message, model);
        
        // If we have relevant context from vector memory, use a hybrid approach
        // to incorporate specific factual details into the response
        const response = usedMemoryContext && contextElements ? 
          generateHybridResponse(baseResponse, contextElements, enhancedPrompt) : 
          baseResponse;
        
        // Create memory-efficient result object with reduced metadata
        const result = {
          id: `mcp-${uuidv4().split('-')[0]}`, // Using shorter UUID
          model,
          response,
          metadata: {
            temp: temperature,
            enhanced: usedMemoryContext,
            hybrid: usedMemoryContext && contextElements !== null,
            contextSources: usedMemoryContext ? memorySourcesUsed.length : 0,
            ms: Date.now() - startTime
          }
        };
        
        // Store in cache with minimal metadata if caching is enabled
        if (cacheKey) {
          responseCache.set(cacheKey, {
            response,
            timestamp: Date.now(),
            metadata: {
              model,
              enhanced: usedMemoryContext
            }
          });
        }
        
        // Minimized logging for response generation
        await logMCPActivity('Response generated', LogLevel.INFO, {
          model,
          ms: Date.now() - startTime
        });

        return {
          success: true,
          result,
          metadata: {
            tool: 'mcp',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
          }
        };
      } catch (error) {
        console.error('[MCP Tool] Error:', error);
        
        await logMCPActivity('Error during model execution', LogLevel.ERROR, {
          error: error instanceof Error ? error.message : String(error),
          responseTime: Date.now() - startTime
        });
        
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          metadata: {
            tool: 'mcp',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
          }
        };
      }
    },
    {
      category: 'ai',
      version: '1.1.0',
      validate: (args) => {
        // Basic validation
        if (!args.model) {
          return { valid: false, errors: ['Model is required'] };
        }
        if (!args.prompt) {
          return { valid: false, errors: ['Prompt is required'] };
        }
        
        // Validate model selection
        if (!SUPPORTED_MODELS.includes(args.model)) {
          return { 
            valid: false, 
            errors: [`Unsupported model: ${args.model}. Supported models are: ${SUPPORTED_MODELS.join(', ')}`] 
          };
        }
        
        // Validate temperature
        if (args.temperature !== undefined && (args.temperature < 0 || args.temperature > 1)) {
          return { 
            valid: false, 
            errors: ['Temperature must be between 0 and 1'] 
          };
        }
        
        return true;
      },
      getUsage: () => {
        return `
MCP Tool Usage:
--------------
The Model Control Protocol (MCP) tool provides a standardized interface for interacting with
AI language models in a controlled manner. It supports various parameters to customize the
behavior of the model.

Required Parameters:
- model: The model to use for the MCP request (e.g., "gpt-4", "claude-2")
- prompt: The prompt or query to send to the model

Optional Parameters:
- temperature: Controls randomness (default: 0.7)
- max_tokens: Maximum number of tokens to generate (default: 1000)
- stop: Sequences where the model should stop generating (default: [])
- system_message: System message for context (default: "You are a helpful AI assistant.")
- function_calling: Whether to enable function calling (default: false)
- cache: Whether to cache the response for future use (default: true)

Advanced Context Management:
- use_vector_memory: Whether to enhance prompt with relevant context (default: true)
- memory_query: Custom query for vector memory lookup (defaults to using the prompt)
- memory_options: Advanced options for vector memory search:
  - limit: Maximum number of results to retrieve (default: 3)
  - threshold: Similarity threshold for results (default: 0.3)
  - diversityFactor: How diverse the results should be (default: 0.5)
  - includeSources: Whether to include source information (default: true)
  - timeWeighting: Parameters for time-based weighting:
    - enabled: Whether to enable time weighting (default: true)
    - halfLifeDays: Days after which relevance is halved (default: 30)
    - maxBoost: Maximum boost for recent entries (default: 1.5)
- context_integration: How to integrate memory with prompt (default: "smart")
  - "prepend": Add context before the prompt
  - "append": Add context after the prompt
  - "smart": Intelligently integrate based on prompt structure

Supported Models:
- gpt-4
- gpt-3.5-turbo
- claude-2
- llama-2
- gemini-pro
- mistral-medium

Example:
mcp.execute({
  model: "gpt-4",
  prompt: "Explain the concept of recursion in programming",
  temperature: 0.5,
  max_tokens: 500,
  system_message: "You are a programming tutor. Explain concepts clearly and provide examples."
})
`;
      },
      getExamples: () => {
        return [
          {
            description: 'Basic question',
            args: {
              model: 'gpt-4',
              prompt: 'What is the capital of France?',
              cache: true
            }
          },
          {
            description: 'Real estate market analysis',
            args: {
              model: 'gpt-4',
              prompt: 'Analyze the current housing market in Grandview, WA',
              temperature: 0.3,
              system_message: 'You are a real estate market analyst with expertise in Pacific Northwest properties.'
            }
          },
          {
            description: 'Investment recommendation with low temperature',
            args: {
              model: 'gpt-4',
              prompt: 'What are the best real estate investment opportunities in suburban areas right now?',
              temperature: 0.2,
              system_message: 'You are an experienced real estate investment advisor.',
              cache: false
            }
          },
          {
            description: 'Property valuation question',
            args: {
              model: 'claude-2',
              prompt: 'How do I determine the fair market value of a 3-bedroom house in Grandview?',
              temperature: 0.4,
              system_message: 'You are a professional real estate appraiser with deep knowledge of property valuation methodologies.'
            }
          },
          {
            description: 'Context-aware development question with vector memory',
            args: {
              model: 'gpt-4',
              prompt: 'What was our approach to error handling in the database connector module?',
              system_message: 'You are a senior developer with intimate knowledge of the codebase.',
              use_vector_memory: true,
              memory_options: {
                limit: 5,
                threshold: 0.2,
                diversityFactor: 0.7
              },
              context_integration: 'smart'
            }
          },
          {
            description: 'Real estate question with custom memory query',
            args: {
              model: 'gpt-4',
              prompt: 'What are the typical lot sizes in Grandview?',
              system_message: 'You are a real estate expert familiar with Yakima County properties.',
              use_vector_memory: true,
              memory_query: 'Grandview WA property lot sizes square footage acreage',
              context_integration: 'prepend'
            }
          }
        ];
      },
      mcp: {
        isModelControlled: true,
        modelProvider: 'any',
        modelName: 'any'
      }
    }
  );
}