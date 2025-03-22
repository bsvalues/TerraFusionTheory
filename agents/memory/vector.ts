/**
 * Enhanced Vector Memory System
 * 
 * This file implements an advanced vector memory system for agent memory storage
 * and retrieval with sophisticated semantic search capabilities.
 */

import { v4 as uuidv4 } from 'uuid';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Memory entry with vector embeddings
 */
export interface MemoryEntry {
  id: string;
  text: string;
  embedding?: number[];
  metadata: {
    source: string;
    agentId?: string;
    timestamp: string;
    category?: string;
    tags?: string[];
    importance?: number; // 0-1 importance score
    confidence?: number; // 0-1 confidence score
    expiresAt?: string; // Optional expiration timestamp
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Memory search result
 */
export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number;
  // Enhanced metadata about the search result
  matchInfo?: {
    matchType: 'semantic' | 'keyword' | 'hybrid';
    keywordsMatched?: string[];
    contextRelevance?: number; // 0-1 relevance to current context
  };
}

/**
 * Advanced search options
 */
export interface AdvancedSearchOptions {
  // Basic search parameters
  limit?: number;
  threshold?: number;
  
  // Advanced filtering
  filter?: {
    tags?: string[]; // OR-based tag matching
    categories?: string[]; // OR-based category matching
    agentIds?: string[]; // OR-based agent matching
    sources?: string[]; // OR-based source matching
    minImportance?: number; // Minimum importance score
    minConfidence?: number; // Minimum confidence score
    startDate?: string; // ISO date string for time-based filtering
    endDate?: string; // ISO date string for time-based filtering
    customFilter?: (entry: MemoryEntry) => boolean; // Custom function filter
  };
  
  // Hybrid search options
  hybridSearch?: {
    enabled: boolean; // Whether to use hybrid (semantic + keyword) search
    keywordWeight?: number; // 0-1 weight for keyword matching (default: 0.3)
    semanticWeight?: number; // 0-1 weight for semantic matching (default: 0.7)
  };
  
  // Context-aware search
  contextualSearch?: {
    enabled: boolean; // Whether to use context-aware search
    contextText?: string; // Additional context to consider
    contextWeight?: number; // 0-1 weight for context relevance (default: 0.5)
  };
  
  // Time weighting options
  timeWeighting?: {
    enabled: boolean; // Whether to apply time decay to results
    halfLifeDays?: number; // Half-life in days for time decay (default: 30)
    maxBoost?: number; // Maximum recency boost (default: 1.5)
  };
  
  // Diversity options
  diversityOptions?: {
    enabled: boolean; // Whether to ensure diverse results
    minDistance?: number; // Minimum cosine distance between results (default: 0.15)
    maxSimilarResults?: number; // Maximum number of similar results (default: 2)
  };
}

/**
 * Options for memory storage
 */
export interface MemoryStoreOptions {
  namespace?: string;
  persistToFile?: boolean;
  persistPath?: string;
  dimensions?: number;
  maxEntries?: number;
  autoSaveInterval?: number; // In milliseconds
  indexStrategy?: 'hierarchical' | 'flat' | 'hnsw'; // Indexing algorithms
  indexOptions?: {
    numTrees?: number; // For hierarchical indexing
    desiredRecall?: number; // Target recall rate (0-1)
    maxConnections?: number; // For HNSW algorithm
  };
  // TTL settings
  ttlOptions?: {
    enabled: boolean;
    defaultTTL?: number; // Default time-to-live in milliseconds
    checkInterval?: number; // Interval to check for expired entries
  };
}

/**
 * Enhanced in-memory vector store with sophisticated retrieval techniques
 */
class EnhancedVectorStore {
  private entries: Map<string, MemoryEntry> = new Map();
  private namespace: string;
  private persistToFile: boolean;
  private persistPath: string;
  private dimensions: number;
  private maxEntries: number;
  private dirty: boolean = false;
  private autoSaveInterval: number;
  private saveTimer: NodeJS.Timeout | null = null;
  private indexStrategy: 'hierarchical' | 'flat' | 'hnsw';
  private ttlOptions: {
    enabled: boolean;
    defaultTTL: number;
    checkInterval: number;
  };
  private ttlTimer: NodeJS.Timeout | null = null;
  
  // Index structures for faster search
  private indexStructure: any = null; // Would be a specialized data structure in production
  private tagIndex: Map<string, Set<string>> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private agentIdIndex: Map<string, Set<string>> = new Map();
  private sourceIndex: Map<string, Set<string>> = new Map();
  
  constructor(options?: MemoryStoreOptions) {
    this.namespace = options?.namespace || 'default';
    this.persistToFile = options?.persistToFile || false;
    this.persistPath = options?.persistPath || `./data/vector_memory_${this.namespace}.json`;
    this.dimensions = options?.dimensions || 1536; // Default for OpenAI embeddings
    this.maxEntries = options?.maxEntries || 10000;
    this.autoSaveInterval = options?.autoSaveInterval || 5 * 60 * 1000; // Default: 5 minutes
    this.indexStrategy = options?.indexStrategy || 'flat';
    
    // TTL settings
    this.ttlOptions = {
      enabled: options?.ttlOptions?.enabled || false,
      defaultTTL: options?.ttlOptions?.defaultTTL || 30 * 24 * 60 * 60 * 1000, // Default: 30 days
      checkInterval: options?.ttlOptions?.checkInterval || 60 * 60 * 1000, // Default: 1 hour
    };
    
    // Initialize indices
    this.initializeIndexes();
    
    // Set up auto-save if enabled
    if (this.persistToFile && this.autoSaveInterval > 0) {
      this.saveTimer = setInterval(() => {
        if (this.dirty) {
          this.save().catch(error => {
            console.error('Error during auto-save:', error);
          });
        }
      }, this.autoSaveInterval);
    }
    
    // Set up TTL expiration check if enabled
    if (this.ttlOptions.enabled) {
      this.ttlTimer = setInterval(() => {
        this.cleanExpiredEntries().catch(error => {
          console.error('Error during TTL check:', error);
        });
      }, this.ttlOptions.checkInterval);
    }
    
    // Log initialization
    this.logActivity('Initialized enhanced vector memory store', LogLevel.INFO, {
      namespace: this.namespace,
      persistToFile: this.persistToFile,
      persistPath: this.persistPath,
      dimensions: this.dimensions,
      maxEntries: this.maxEntries,
      indexStrategy: this.indexStrategy,
      ttlEnabled: this.ttlOptions.enabled
    });
  }
  
  /**
   * Initialize the indexing structures
   * In a real implementation, this would set up the appropriate index structure
   * based on the indexStrategy
   */
  private initializeIndexes(): void {
    // Clear any existing indexes
    this.tagIndex = new Map();
    this.categoryIndex = new Map();
    this.agentIdIndex = new Map();
    this.sourceIndex = new Map();
    
    // In a production implementation, we would initialize the appropriate
    // index structure here based on this.indexStrategy
  }
  
  /**
   * Add an entry to the vector store with enhanced capabilities
   */
  async addEntry(
    text: string,
    metadata: MemoryEntry['metadata'],
    embedding?: number[]
  ): Promise<string> {
    // Generate ID if not provided in metadata
    const id = metadata.id || `mem_${uuidv4()}`;
    
    // Calculate embedding if not provided
    const actualEmbedding = embedding || await this.generateEmbedding(text);
    
    // Set default values for enhanced metadata fields
    const enhancedMetadata = {
      ...metadata,
      timestamp: metadata.timestamp || new Date().toISOString(),
      importance: metadata.importance !== undefined ? metadata.importance : 0.5,
      confidence: metadata.confidence !== undefined ? metadata.confidence : 1.0
    };
    
    // If TTL is enabled and no explicit expiration is set, add default expiry
    if (this.ttlOptions.enabled && !enhancedMetadata.expiresAt) {
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + this.ttlOptions.defaultTTL);
      enhancedMetadata.expiresAt = expiryDate.toISOString();
    }
    
    const entry: MemoryEntry = {
      id,
      text,
      embedding: actualEmbedding,
      metadata: enhancedMetadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store the entry
    this.entries.set(id, entry);
    this.dirty = true;
    
    // Update indexes
    this.updateIndexesForEntry(id, entry);
    
    // Handle max entries limit (improved LRU-like eviction policy)
    if (this.entries.size > this.maxEntries) {
      this.evictEntries();
    }
    
    // Log the addition
    this.logActivity('Added memory entry', LogLevel.DEBUG, {
      id,
      textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      metadata: {
        source: metadata.source,
        category: metadata.category,
        tags: metadata.tags,
        importance: enhancedMetadata.importance
      }
    });
    
    return id;
  }
  
  /**
   * Update indexes for a newly added or updated entry
   */
  private updateIndexesForEntry(id: string, entry: MemoryEntry): void {
    // Add to tag index
    if (entry.metadata.tags && entry.metadata.tags.length > 0) {
      for (const tag of entry.metadata.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(id);
      }
    }
    
    // Add to category index
    if (entry.metadata.category) {
      if (!this.categoryIndex.has(entry.metadata.category)) {
        this.categoryIndex.set(entry.metadata.category, new Set());
      }
      this.categoryIndex.get(entry.metadata.category)!.add(id);
    }
    
    // Add to agent ID index
    if (entry.metadata.agentId) {
      if (!this.agentIdIndex.has(entry.metadata.agentId)) {
        this.agentIdIndex.set(entry.metadata.agentId, new Set());
      }
      this.agentIdIndex.get(entry.metadata.agentId)!.add(id);
    }
    
    // Add to source index
    if (entry.metadata.source) {
      if (!this.sourceIndex.has(entry.metadata.source)) {
        this.sourceIndex.set(entry.metadata.source, new Set());
      }
      this.sourceIndex.get(entry.metadata.source)!.add(id);
    }
  }
  
  /**
   * Remove an entry from all indexes
   */
  private removeEntryFromIndexes(id: string, entry: MemoryEntry): void {
    // Remove from tag index
    if (entry.metadata.tags && entry.metadata.tags.length > 0) {
      for (const tag of entry.metadata.tags) {
        this.tagIndex.get(tag)?.delete(id);
        // Clean up empty sets
        if (this.tagIndex.get(tag)?.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
    
    // Remove from category index
    if (entry.metadata.category) {
      this.categoryIndex.get(entry.metadata.category)?.delete(id);
      if (this.categoryIndex.get(entry.metadata.category)?.size === 0) {
        this.categoryIndex.delete(entry.metadata.category);
      }
    }
    
    // Remove from agent ID index
    if (entry.metadata.agentId) {
      this.agentIdIndex.get(entry.metadata.agentId)?.delete(id);
      if (this.agentIdIndex.get(entry.metadata.agentId)?.size === 0) {
        this.agentIdIndex.delete(entry.metadata.agentId);
      }
    }
    
    // Remove from source index
    if (entry.metadata.source) {
      this.sourceIndex.get(entry.metadata.source)?.delete(id);
      if (this.sourceIndex.get(entry.metadata.source)?.size === 0) {
        this.sourceIndex.delete(entry.metadata.source);
      }
    }
  }
  
  /**
   * Evict entries when capacity is reached
   * Uses a more sophisticated approach than simple FIFO
   */
  private evictEntries(): void {
    // Number of entries to evict (5% of max capacity)
    const evictionCount = Math.max(1, Math.floor(this.maxEntries * 0.05));
    
    // Score entries based on recency, importance, and access patterns
    const scoredEntries = Array.from(this.entries.entries()).map(([id, entry]) => {
      // Base score on age (older = lower score)
      const ageInDays = (Date.now() - new Date(entry.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      
      // Score formula: importance * confidence / (1 + ageInDays/30)
      // This favors keeping important and high-confidence entries, with a time decay
      const score = 
        (entry.metadata.importance || 0.5) * 
        (entry.metadata.confidence || 1.0) / 
        (1 + ageInDays / 30);
      
      return { id, score };
    });
    
    // Sort by score (ascending) and pick the lowest-scoring entries to evict
    scoredEntries.sort((a, b) => a.score - b.score);
    
    // Evict the lowest-scoring entries
    for (let i = 0; i < evictionCount && i < scoredEntries.length; i++) {
      const { id } = scoredEntries[i];
      const entry = this.entries.get(id);
      
      if (entry) {
        // Remove from indexes
        this.removeEntryFromIndexes(id, entry);
        
        // Remove the entry
        this.entries.delete(id);
        
        this.logActivity('Evicted memory entry based on score', LogLevel.INFO, {
          evictedId: id,
          score: scoredEntries[i].score,
          currentSize: this.entries.size,
          maxSize: this.maxEntries
        });
      }
    }
  }
  
  /**
   * Clean expired entries based on TTL
   */
  private async cleanExpiredEntries(): Promise<void> {
    if (!this.ttlOptions.enabled) return;
    
    const now = new Date().toISOString();
    let expiredCount = 0;
    
    for (const [id, entry] of this.entries.entries()) {
      if (entry.metadata.expiresAt && entry.metadata.expiresAt < now) {
        // Remove from indexes
        this.removeEntryFromIndexes(id, entry);
        
        // Delete the entry
        this.entries.delete(id);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.dirty = true;
      this.logActivity('Removed expired memory entries', LogLevel.INFO, {
        count: expiredCount,
        currentSize: this.entries.size
      });
    }
  }
  
  /**
   * Generate embedding for text
   * In a production implementation, this would call an embedding API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // For development, we'll use a deterministic mock embedding
    // based on text hash to ensure consistent results
    // In production, this would call OpenAI API or similar
    return this.deterministicMockEmbedding(text);
  }
  
  /**
   * Create a deterministic mock embedding based on text hash
   * This ensures consistent behavior in development
   */
  private deterministicMockEmbedding(text: string): number[] {
    // Create a simple hash of the text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use the hash as a seed for a pseudo-random number generator
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    
    // Generate deterministic embedding vector
    const embedding = [];
    for (let i = 0; i < this.dimensions; i++) {
      const value = seededRandom(hash + i) * 2 - 1; // Range -1 to 1
      embedding.push(value);
    }
    
    // Normalize the vector (unit length)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
  
  /**
   * Get an entry by ID
   */
  async getEntry(id: string): Promise<MemoryEntry | null> {
    const entry = this.entries.get(id);
    
    // Update entry's updatedAt to track access patterns
    if (entry) {
      entry.updatedAt = new Date().toISOString();
      this.entries.set(id, entry);
      this.dirty = true;
    }
    
    return entry || null;
  }
  
  /**
   * Delete an entry by ID
   */
  async deleteEntry(id: string): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) return false;
    
    // Remove from indexes
    this.removeEntryFromIndexes(id, entry);
    
    // Delete the entry
    const deleted = this.entries.delete(id);
    if (deleted) {
      this.dirty = true;
      this.logActivity('Deleted memory entry', LogLevel.DEBUG, { id });
    }
    return deleted;
  }
  
  /**
   * Update an entry
   */
  async updateEntry(
    id: string,
    updates: Partial<Omit<MemoryEntry, 'id' | 'createdAt'>>
  ): Promise<MemoryEntry | null> {
    const entry = this.entries.get(id);
    if (!entry) {
      return null;
    }
    
    // Remove from old indexes if relevant fields are being updated
    const shouldReindex = 
      updates.metadata?.tags !== undefined || 
      updates.metadata?.category !== undefined || 
      updates.metadata?.agentId !== undefined || 
      updates.metadata?.source !== undefined;
    
    if (shouldReindex) {
      this.removeEntryFromIndexes(id, entry);
    }
    
    // Update the entry
    const updatedEntry: MemoryEntry = {
      ...entry,
      ...updates,
      id, // Ensure ID doesn't change
      createdAt: entry.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
      metadata: {
        ...entry.metadata,
        ...(updates.metadata || {})
      }
    };
    
    // If text changes, update embedding (if not explicitly provided)
    if (updates.text && !updates.embedding) {
      updatedEntry.embedding = await this.generateEmbedding(updates.text);
    }
    
    // Store the updated entry
    this.entries.set(id, updatedEntry);
    this.dirty = true;
    
    // Update indexes if needed
    if (shouldReindex) {
      this.updateIndexesForEntry(id, updatedEntry);
    }
    
    this.logActivity('Updated memory entry', LogLevel.DEBUG, { id });
    
    return updatedEntry;
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
  
  /**
   * Keyword-based text search
   */
  private keywordSearch(query: string, text: string): number {
    // Simple keyword matching logic
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const textWords = text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    // Count matching words
    const matches = queryWords.filter(word => textWords.includes(word));
    
    // Calculate score (0-1)
    return queryWords.length > 0 
      ? matches.length / queryWords.length
      : 0;
  }
  
  /**
   * Enhanced search with advanced retrieval techniques
   */
  async search(
    query: string,
    options?: AdvancedSearchOptions
  ): Promise<MemorySearchResult[]> {
    // Default options
    const limit = options?.limit || 5;
    const threshold = options?.threshold || 0.7;
    
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Extract entries with improved pre-filtering using indexes
    let candidateEntries = this.getFilteredEntries(options?.filter);
    
    // Calculate similarity scores based on search strategy
    const results: MemorySearchResult[] = await Promise.all(
      candidateEntries.map(async entry => {
        // Calculate semantic similarity (cosine)
        const semanticScore = entry.embedding 
          ? this.cosineSimilarity(queryEmbedding, entry.embedding)
          : 0;
        
        let finalScore = semanticScore;
        let matchType: 'semantic' | 'keyword' | 'hybrid' = 'semantic';
        let contextRelevance = undefined;
        
        // Apply hybrid search if enabled
        if (options?.hybridSearch?.enabled) {
          const keywordWeight = options.hybridSearch.keywordWeight || 0.3;
          const semanticWeight = options.hybridSearch.semanticWeight || 0.7;
          
          // Calculate keyword-based score
          const keywordScore = this.keywordSearch(query, entry.text);
          
          // Combine scores
          finalScore = (semanticScore * semanticWeight) + (keywordScore * keywordWeight);
          matchType = 'hybrid';
        }
        
        // Apply contextual search if enabled
        if (options?.contextualSearch?.enabled && options.contextualSearch.contextText) {
          const contextWeight = options.contextualSearch.contextWeight || 0.5;
          
          // Get context embedding
          const contextEmbedding = await this.generateEmbedding(options.contextualSearch.contextText);
          
          // Calculate context relevance
          contextRelevance = entry.embedding 
            ? this.cosineSimilarity(contextEmbedding, entry.embedding)
            : 0;
          
          // Adjust score with context relevance
          finalScore = (finalScore * (1 - contextWeight)) + (contextRelevance * contextWeight);
        }
        
        // Apply time-based weighting if enabled
        if (options?.timeWeighting?.enabled) {
          const halfLifeDays = options.timeWeighting.halfLifeDays || 30;
          const maxBoost = options.timeWeighting.maxBoost || 1.5;
          
          // Calculate age in days
          const entryDate = new Date(entry.metadata.timestamp || entry.createdAt);
          const ageInDays = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
          
          // Apply time decay formula: decay = 2^(-age/halfLife)
          const timeDecay = Math.pow(2, -ageInDays / halfLifeDays);
          
          // Adjust score with time weighting (newer entries get a boost)
          const timeBoost = 1 + (maxBoost - 1) * timeDecay;
          finalScore *= timeBoost;
        }
        
        // Cap score at 1.0
        finalScore = Math.min(1.0, finalScore);
        
        return {
          entry,
          score: finalScore,
          matchInfo: {
            matchType,
            contextRelevance
          }
        };
      })
    );
    
    // Apply threshold
    let finalResults = results
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score);
    
    // Apply diversity filter if enabled
    if (options?.diversityOptions?.enabled) {
      finalResults = this.applyDiversityFilter(
        finalResults, 
        options.diversityOptions.minDistance || 0.15,
        options.diversityOptions.maxSimilarResults || 2
      );
    }
    
    // Get final limited results
    const limitedResults = finalResults.slice(0, limit);
    
    this.logActivity('Performed enhanced vector search', LogLevel.DEBUG, {
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      resultCount: limitedResults.length,
      totalCandidates: candidateEntries.length,
      matchType: options?.hybridSearch?.enabled ? 'hybrid' : 'semantic',
      contextualSearch: options?.contextualSearch?.enabled
    });
    
    return limitedResults;
  }
  
  /**
   * Apply diversity filter to ensure varied results
   */
  private applyDiversityFilter(
    results: MemorySearchResult[],
    minDistance: number,
    maxSimilarResults: number
  ): MemorySearchResult[] {
    if (results.length <= 1) return results;
    
    const selected: MemorySearchResult[] = [results[0]]; // Always include top result
    const clusters: MemorySearchResult[][] = [[results[0]]];
    
    // Process remaining results
    for (let i = 1; i < results.length; i++) {
      const current = results[i];
      let foundCluster = false;
      
      // Check if this result is similar to any existing cluster
      for (let j = 0; j < clusters.length; j++) {
        const clusterRepresentative = clusters[j][0];
        
        // Calculate similarity to cluster representative
        const similarity = current.entry.embedding && clusterRepresentative.entry.embedding
          ? this.cosineSimilarity(current.entry.embedding, clusterRepresentative.entry.embedding)
          : 0;
        
        // If similar to existing cluster, add to that cluster
        if (similarity > (1 - minDistance)) {
          clusters[j].push(current);
          foundCluster = true;
          
          // If this cluster isn't full yet, select this result
          if (clusters[j].length <= maxSimilarResults) {
            selected.push(current);
          }
          
          break;
        }
      }
      
      // If not similar to any existing cluster, create a new cluster
      if (!foundCluster) {
        clusters.push([current]);
        selected.push(current);
      }
    }
    
    // Sort again by original score
    return selected.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Get filtered entries based on advanced filter options
   */
  private getFilteredEntries(filter?: AdvancedSearchOptions['filter']): MemoryEntry[] {
    if (!filter) {
      return Array.from(this.entries.values());
    }
    
    // Start with candidate IDs based on categorical filters
    const candidateIds = new Set<string>();
    let hasAppliedCategoricalFilter = false;
    
    // Filter by tags (OR operation)
    if (filter.tags && filter.tags.length > 0) {
      hasAppliedCategoricalFilter = true;
      for (const tag of filter.tags) {
        const tagEntries = this.tagIndex.get(tag);
        if (tagEntries) {
          for (const id of tagEntries) {
            candidateIds.add(id);
          }
        }
      }
    }
    
    // Filter by categories (OR operation)
    if (filter.categories && filter.categories.length > 0) {
      const categoryIds = new Set<string>();
      for (const category of filter.categories) {
        const categoryEntries = this.categoryIndex.get(category);
        if (categoryEntries) {
          for (const id of categoryEntries) {
            categoryIds.add(id);
          }
        }
      }
      
      // If this is the first categorical filter, use as is
      if (!hasAppliedCategoricalFilter) {
        for (const id of categoryIds) {
          candidateIds.add(id);
        }
        hasAppliedCategoricalFilter = true;
      } 
      // Otherwise, intersect with existing candidates
      else if (candidateIds.size > 0) {
        for (const id of candidateIds) {
          if (!categoryIds.has(id)) {
            candidateIds.delete(id);
          }
        }
      }
    }
    
    // Filter by agent IDs (OR operation)
    if (filter.agentIds && filter.agentIds.length > 0) {
      const agentIds = new Set<string>();
      for (const agentId of filter.agentIds) {
        const agentEntries = this.agentIdIndex.get(agentId);
        if (agentEntries) {
          for (const id of agentEntries) {
            agentIds.add(id);
          }
        }
      }
      
      // If this is the first categorical filter, use as is
      if (!hasAppliedCategoricalFilter) {
        for (const id of agentIds) {
          candidateIds.add(id);
        }
        hasAppliedCategoricalFilter = true;
      } 
      // Otherwise, intersect with existing candidates
      else if (candidateIds.size > 0) {
        for (const id of candidateIds) {
          if (!agentIds.has(id)) {
            candidateIds.delete(id);
          }
        }
      }
    }
    
    // Filter by sources (OR operation)
    if (filter.sources && filter.sources.length > 0) {
      const sourceIds = new Set<string>();
      for (const source of filter.sources) {
        const sourceEntries = this.sourceIndex.get(source);
        if (sourceEntries) {
          for (const id of sourceEntries) {
            sourceIds.add(id);
          }
        }
      }
      
      // If this is the first categorical filter, use as is
      if (!hasAppliedCategoricalFilter) {
        for (const id of sourceIds) {
          candidateIds.add(id);
        }
        hasAppliedCategoricalFilter = true;
      } 
      // Otherwise, intersect with existing candidates
      else if (candidateIds.size > 0) {
        for (const id of candidateIds) {
          if (!sourceIds.has(id)) {
            candidateIds.delete(id);
          }
        }
      }
    }
    
    // If no categorical filters applied, use all entries
    if (!hasAppliedCategoricalFilter) {
      return Array.from(this.entries.values()).filter(entry => {
        // Apply numeric and date filters
        if (filter.minImportance !== undefined && 
            (entry.metadata.importance === undefined || entry.metadata.importance < filter.minImportance)) {
          return false;
        }
        
        if (filter.minConfidence !== undefined && 
            (entry.metadata.confidence === undefined || entry.metadata.confidence < filter.minConfidence)) {
          return false;
        }
        
        if (filter.startDate !== undefined) {
          const entryDate = new Date(entry.metadata.timestamp || entry.createdAt).toISOString();
          if (entryDate < filter.startDate) {
            return false;
          }
        }
        
        if (filter.endDate !== undefined) {
          const entryDate = new Date(entry.metadata.timestamp || entry.createdAt).toISOString();
          if (entryDate > filter.endDate) {
            return false;
          }
        }
        
        // Apply custom filter if provided
        if (filter.customFilter && !filter.customFilter(entry)) {
          return false;
        }
        
        return true;
      });
    } 
    // Otherwise, get entries from candidate IDs and apply remaining filters
    else {
      return Array.from(candidateIds)
        .map(id => this.entries.get(id))
        .filter((entry): entry is MemoryEntry => {
          if (!entry) return false;
          
          // Apply numeric and date filters
          if (filter.minImportance !== undefined && 
              (entry.metadata.importance === undefined || entry.metadata.importance < filter.minImportance)) {
            return false;
          }
          
          if (filter.minConfidence !== undefined && 
              (entry.metadata.confidence === undefined || entry.metadata.confidence < filter.minConfidence)) {
            return false;
          }
          
          if (filter.startDate !== undefined) {
            const entryDate = new Date(entry.metadata.timestamp || entry.createdAt).toISOString();
            if (entryDate < filter.startDate) {
              return false;
            }
          }
          
          if (filter.endDate !== undefined) {
            const entryDate = new Date(entry.metadata.timestamp || entry.createdAt).toISOString();
            if (entryDate > filter.endDate) {
              return false;
            }
          }
          
          // Apply custom filter if provided
          if (filter.customFilter && !filter.customFilter(entry)) {
            return false;
          }
          
          return true;
        });
    }
  }
  
  /**
   * Get entries by tag with improved index-based retrieval
   */
  async getEntriesByTag(tag: string): Promise<MemoryEntry[]> {
    const tagEntries = this.tagIndex.get(tag);
    if (!tagEntries) return [];
    
    return Array.from(tagEntries)
      .map(id => this.entries.get(id))
      .filter((entry): entry is MemoryEntry => !!entry);
  }
  
  /**
   * Get entries by category with improved index-based retrieval
   */
  async getEntriesByCategory(category: string): Promise<MemoryEntry[]> {
    const categoryEntries = this.categoryIndex.get(category);
    if (!categoryEntries) return [];
    
    return Array.from(categoryEntries)
      .map(id => this.entries.get(id))
      .filter((entry): entry is MemoryEntry => !!entry);
  }
  
  /**
   * Get entries by agent ID with improved index-based retrieval
   */
  async getEntriesByAgentId(agentId: string): Promise<MemoryEntry[]> {
    const agentEntries = this.agentIdIndex.get(agentId);
    if (!agentEntries) return [];
    
    return Array.from(agentEntries)
      .map(id => this.entries.get(id))
      .filter((entry): entry is MemoryEntry => !!entry);
  }
  
  /**
   * Find similar entries to a given entry
   */
  async findSimilarEntries(
    entryId: string,
    options?: {
      limit?: number;
      threshold?: number;
      excludeSelf?: boolean;
    }
  ): Promise<MemorySearchResult[]> {
    const entry = this.entries.get(entryId);
    if (!entry || !entry.embedding) return [];
    
    const limit = options?.limit || 5;
    const threshold = options?.threshold || 0.7;
    const excludeSelf = options?.excludeSelf !== false; // Default true
    
    // Get all entries
    const candidates = Array.from(this.entries.values());
    
    // Calculate similarity scores
    const results: MemorySearchResult[] = candidates
      .filter(candidate => !excludeSelf || candidate.id !== entryId)
      .filter(candidate => candidate.embedding !== undefined)
      .map(candidate => {
        const score = this.cosineSimilarity(
          entry.embedding!, 
          candidate.embedding!
        );
        
        return {
          entry: candidate,
          score,
          matchInfo: {
            matchType: 'semantic'
          }
        };
      });
    
    // Apply threshold, sort, and limit
    return results
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  /**
   * Search entries by time range
   */
  async searchByTimeRange(
    startDate: string,
    endDate: string,
    filter?: (entry: MemoryEntry) => boolean
  ): Promise<MemoryEntry[]> {
    return Array.from(this.entries.values())
      .filter(entry => {
        const timestamp = entry.metadata.timestamp || entry.createdAt;
        return timestamp >= startDate && timestamp <= endDate;
      })
      .filter(entry => !filter || filter(entry));
  }
  
  /**
   * Cluster entries by similarity
   */
  async clusterEntries(
    options?: {
      minimumClusterSize?: number;
      similarityThreshold?: number;
      maxClusters?: number;
    }
  ): Promise<{
    clusters: MemoryEntry[][];
    clusterScores: number[];
  }> {
    const minClusterSize = options?.minimumClusterSize || 2;
    const threshold = options?.similarityThreshold || 0.8;
    const maxClusters = options?.maxClusters || 10;
    
    const entries = Array.from(this.entries.values())
      .filter(entry => entry.embedding !== undefined);
    
    if (entries.length < minClusterSize) {
      return { clusters: [], clusterScores: [] };
    }
    
    // Simple clustering algorithm (can be replaced with k-means or DBSCAN in production)
    const clusters: MemoryEntry[][] = [];
    const assigned = new Set<string>();
    
    // For each entry, try to form a cluster
    for (const entry of entries) {
      if (assigned.has(entry.id)) continue;
      
      // Find similar entries
      const similarities = entries
        .filter(e => e.id !== entry.id && !assigned.has(e.id))
        .map(e => ({
          entry: e,
          similarity: this.cosineSimilarity(entry.embedding!, e.embedding!)
        }))
        .filter(s => s.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity);
      
      // If enough similar entries, form a cluster
      if (similarities.length >= minClusterSize - 1) {
        const cluster = [entry, ...similarities.map(s => s.entry)];
        clusters.push(cluster);
        
        // Mark all as assigned
        assigned.add(entry.id);
        for (const { entry: e } of similarities) {
          assigned.add(e.id);
        }
      }
      
      // Stop if we've reached the maximum number of clusters
      if (clusters.length >= maxClusters) break;
    }
    
    // Calculate cluster scores (average similarity within cluster)
    const clusterScores = clusters.map(cluster => {
      let totalSimilarity = 0;
      let pairCount = 0;
      
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          totalSimilarity += this.cosineSimilarity(
            cluster[i].embedding!,
            cluster[j].embedding!
          );
          pairCount++;
        }
      }
      
      return pairCount > 0 ? totalSimilarity / pairCount : 0;
    });
    
    return { clusters, clusterScores };
  }
  
  /**
   * Get all entries
   */
  async getAllEntries(filter?: (entry: MemoryEntry) => boolean): Promise<MemoryEntry[]> {
    const entries = Array.from(this.entries.values());
    return filter ? entries.filter(filter) : entries;
  }
  
  /**
   * Count entries with optional filtering
   */
  async count(filter?: (entry: MemoryEntry) => boolean): Promise<number> {
    if (!filter) return this.entries.size;
    
    return Array.from(this.entries.values())
      .filter(filter)
      .length;
  }
  
  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    const count = this.entries.size;
    this.entries.clear();
    this.dirty = true;
    
    // Reset indexes
    this.initializeIndexes();
    
    this.logActivity('Cleared all memory entries', LogLevel.INFO, { count });
  }
  
  /**
   * Load entries from file
   */
  async load(): Promise<boolean> {
    if (!this.persistToFile) {
      return false;
    }
    
    try {
      const dir = path.dirname(this.persistPath);
      
      // Check if directory exists, create if not
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Check if file exists
      if (!fs.existsSync(this.persistPath)) {
        this.logActivity('No existing vector memory file found', LogLevel.INFO, {
          path: this.persistPath
        });
        return false;
      }
      
      // Read file
      const data = fs.readFileSync(this.persistPath, 'utf-8');
      const parsed = JSON.parse(data);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Invalid memory file format');
      }
      
      // Clear current entries and load from file
      this.entries.clear();
      this.initializeIndexes();
      
      for (const entry of parsed) {
        this.entries.set(entry.id, entry);
        this.updateIndexesForEntry(entry.id, entry);
      }
      
      this.logActivity('Loaded vector memory from file', LogLevel.INFO, {
        path: this.persistPath,
        entryCount: this.entries.size
      });
      
      return true;
    } catch (error) {
      this.logActivity('Failed to load vector memory', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error),
        path: this.persistPath
      });
      
      return false;
    }
  }
  
  /**
   * Save entries to file
   */
  async save(): Promise<boolean> {
    if (!this.persistToFile || !this.dirty) {
      return false;
    }
    
    try {
      const dir = path.dirname(this.persistPath);
      
      // Check if directory exists, create if not
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Convert entries to array and save
      const data = Array.from(this.entries.values());
      fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
      
      this.dirty = false;
      
      this.logActivity('Saved vector memory to file', LogLevel.INFO, {
        path: this.persistPath,
        entryCount: this.entries.size
      });
      
      return true;
    } catch (error) {
      this.logActivity('Failed to save vector memory', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error),
        path: this.persistPath
      });
      
      return false;
    }
  }
  
  /**
   * Clean up and shutdown
   */
  async shutdown(): Promise<void> {
    // Cancel timers
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    
    if (this.ttlTimer) {
      clearInterval(this.ttlTimer);
      this.ttlTimer = null;
    }
    
    // Persist to storage if needed
    if (this.persistToFile && this.dirty) {
      await this.save();
    }
    
    this.logActivity('Vector memory store shutdown', LogLevel.INFO, {
      namespace: this.namespace,
      entryCount: this.entries.size
    });
  }
  
  /**
   * Log an activity to the storage system
   */
  private async logActivity(message: string, level: LogLevel, details?: any): Promise<void> {
    try {
      await storage.createLog({
        level,
        category: LogCategory.SYSTEM,
        message: `[VectorMemory] ${message}`,
        details: details ? JSON.stringify(details) : null,
        source: 'vector-memory',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['memory', 'vector', this.namespace]
      });
    } catch (error) {
      console.error('Failed to log vector memory activity:', error);
    }
  }
}

/**
 * Singleton enhanced vector memory instance
 */
export const vectorMemory = new EnhancedVectorStore({
  namespace: 'intelligent-estate',
  persistToFile: true,
  persistPath: './data/vector_memory.json',
  dimensions: 1536,
  maxEntries: 10000,
  autoSaveInterval: 5 * 60 * 1000, // 5 minutes
  indexStrategy: 'flat',
  ttlOptions: {
    enabled: true,
    defaultTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
    checkInterval: 60 * 60 * 1000 // 1 hour
  }
});