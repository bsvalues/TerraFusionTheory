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
 * Helper function to format bytes to human-readable format
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

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
  
  // Simple diversity factor (0-1 value that affects result diversity)
  diversityFactor?: number;
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
   * Remove expired entries from the vector store
   * Public method accessible by memory optimizations
   * @returns Statistics about the operation
   */
  async removeExpired(): Promise<{ count: number }> {
    const initialSize = this.entries.size;
    await this.cleanExpiredEntries();
    
    const removedCount = initialSize - this.entries.size;
    
    this.logActivity('Executed explicit removeExpired operation', LogLevel.INFO, {
      removedCount,
      currentSize: this.entries.size
    });
    
    return { count: removedCount };
  }
  
  /**
   * Remove duplicate or highly similar entries from the vector store
   * @param similarityThreshold Cosine similarity threshold for considering entries as duplicates (default: 0.95)
   * @returns Statistics about the operation
   */
  async removeDuplicates(similarityThreshold: number = 0.95): Promise<{ count: number }> {
    let removedCount = 0;
    const entriesArray = Array.from(this.entries.values());
    
    // Sort by importance and creation date to prefer keeping important and newer entries
    entriesArray.sort((a, b) => {
      // First compare by importance (higher importance first)
      const importanceDiff = (b.metadata.importance || 0.5) - (a.metadata.importance || 0.5);
      if (Math.abs(importanceDiff) > 0.1) return importanceDiff;
      
      // Then compare by creation date (newer first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Set to track IDs that have been processed
    const processedIds = new Set<string>();
    
    // Find and remove duplicates
    for (let i = 0; i < entriesArray.length; i++) {
      const entry = entriesArray[i];
      
      // Skip if this entry has been marked as processed (removed)
      if (processedIds.has(entry.id)) continue;
      
      // Mark this entry as processed
      processedIds.add(entry.id);
      
      // Check for duplicates
      for (let j = i + 1; j < entriesArray.length; j++) {
        const otherEntry = entriesArray[j];
        
        // Skip if already processed
        if (processedIds.has(otherEntry.id)) continue;
        
        // Check if content is similar
        if (this.calculateCosineSimilarity(entry.embedding || [], otherEntry.embedding || []) > similarityThreshold) {
          // Remove the duplicate entry
          this.entries.delete(otherEntry.id);
          this.removeEntryFromIndexes(otherEntry.id, otherEntry);
          processedIds.add(otherEntry.id);
          removedCount++;
        }
      }
    }
    
    if (removedCount > 0) {
      this.dirty = true;
      this.logActivity('Removed duplicate memory entries', LogLevel.INFO, {
        removedCount,
        threshold: similarityThreshold,
        currentSize: this.entries.size
      });
    }
    
    return { count: removedCount };
  }
  
  /**
   * Compact the vector store to reduce memory usage
   * This performs several optimization steps to reduce memory footprint
   * @returns Statistics about the optimization
   */
  async compact(): Promise<{ beforeSize: number; afterSize: number; reduction: number }> {
    const initialSize = this.entries.size;
    const memoryEstimate = initialSize * this.dimensions * 4; // 4 bytes per float
    
    // 1. Deep clean the entries to remove unused fields and minimize memory usage
    for (const [id, entry] of this.entries.entries()) {
      // Create a more memory-efficient copy of the entry
      const optimizedEntry: MemoryEntry = {
        id: entry.id,
        text: entry.text,
        embedding: entry.embedding,
        metadata: {
          source: entry.metadata.source,
          timestamp: entry.metadata.timestamp,
          // Only include other metadata fields if they're actually set
          ...(entry.metadata.agentId ? { agentId: entry.metadata.agentId } : {}),
          ...(entry.metadata.category ? { category: entry.metadata.category } : {}),
          ...(entry.metadata.tags && entry.metadata.tags.length > 0 ? { tags: entry.metadata.tags } : {}),
          ...(entry.metadata.importance !== undefined ? { importance: entry.metadata.importance } : {}),
          ...(entry.metadata.confidence !== undefined ? { confidence: entry.metadata.confidence } : {}),
          ...(entry.metadata.expiresAt ? { expiresAt: entry.metadata.expiresAt } : {})
        },
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };
      
      // Replace with the optimized entry
      this.entries.set(id, optimizedEntry);
    }
    
    // 2. Trigger a more aggressive eviction for entries that aren't actively used
    // Lowered threshold from 0.8 to 0.5 to allow for cleanup even with few entries
    if (this.entries.size > this.maxEntries * 0.5 || this.entries.size > 15) {
      // Evict more entries than usual (20% instead of 15%)
      const evictionCount = Math.max(2, Math.floor(this.maxEntries * 0.2));
      
      // Get lowest-scoring entries
      const scoredEntries = Array.from(this.entries.entries()).map(([id, entry]) => {
        const ageInDays = (Date.now() - new Date(entry.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        // More aggressive scoring formula with higher age penalty
        const score = (entry.metadata.importance || 0.5) * (entry.metadata.confidence || 1.0) / (1 + ageInDays / 10);
        return { id, score };
      });
      
      // Sort by score (ascending)
      scoredEntries.sort((a, b) => a.score - b.score);
      
      // Evict the lowest-scoring entries
      for (let i = 0; i < evictionCount && i < scoredEntries.length; i++) {
        const { id } = scoredEntries[i];
        const entry = this.entries.get(id);
        
        if (entry) {
          this.removeEntryFromIndexes(id, entry);
          this.entries.delete(id);
        }
      }
    }
    
    // Calculate memory reduction
    const finalSize = this.entries.size;
    const finalMemoryEstimate = finalSize * this.dimensions * 4;
    const reduction = memoryEstimate - finalMemoryEstimate;
    
    this.logActivity('Compacted vector memory store', LogLevel.INFO, {
      initialSize,
      finalSize,
      memoryReduction: `${(reduction / (1024 * 1024)).toFixed(2)} MB`
    });
    
    return {
      beforeSize: memoryEstimate,
      afterSize: finalMemoryEstimate,
      reduction
    };
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) {
      return 0;
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    return dotProduct / (mag1 * mag2);
  }
  
  /**
   * Generate embedding for text
   * In a production implementation, this would call an embedding API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // For development, we'll use a deterministic mock embedding
    // based on text hash to ensure consistent results
    // In production, this would call OpenAI API or similar
    return this.improvedMockEmbedding(text);
  }

  /**
   * Create a deterministic mock embedding based on text hash
   * This ensures consistent behavior in development
   * 
   * Improved version with better semantic analysis and similarity modeling
   */
  private improvedMockEmbedding(text: string): number[] {
    // Normalize and tokenize the text
    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/).filter(w => w.length > 0);
    
    // Extract key terms (keep words that are 3+ chars)
    const keyTerms = words.filter(w => w.length >= 3);
    
    // Calculate word frequencies for term weighting
    const wordFrequency: Record<string, number> = {};
    for (const word of keyTerms) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
    
    // Create a dense vector representation
    const embedding: number[] = new Array(this.dimensions).fill(0);
    
    // Assign regions of the embedding to key terms
    // Each term influences a consistent region of the vector
    for (const term of Object.keys(wordFrequency)) {
      // Create a deterministic hash for this term
      const termHash = this.simpleHash(term);
      
      // Determine which embedding regions this term affects
      const startDimension = termHash % (this.dimensions / 2);
      const regionSize = Math.min(30, this.dimensions / 10);
      
      // Term frequency weight
      const termWeight = wordFrequency[term] / words.length;
      
      // Apply the term's influence to its region
      for (let i = 0; i < regionSize; i++) {
        const dimension = (startDimension + i) % this.dimensions;
        
        // Use hash to generate consistent values for this term
        const value = (Math.sin(termHash * (i + 1)) + 1) / 2; // 0 to 1 range
        
        // Apply the weighted influence
        embedding[dimension] += value * (0.5 + termWeight);
      }
    }
    
    // Add a small amount of semantic context based on term order
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + " " + words[i + 1];
      const bigramHash = this.simpleHash(bigram);
      const startDim = bigramHash % (this.dimensions / 3);
      
      // Bigrams influence fewer dimensions but with higher intensity
      for (let j = 0; j < 10; j++) {
        const dimension = (startDim + j) % this.dimensions;
        embedding[dimension] += 0.5;
      }
    }
    
    // Add small amount of noise for uniqueness
    for (let i = 0; i < this.dimensions; i++) {
      embedding[i] += (Math.sin(i * 0.1) * 0.05);
    }
    
    // Normalize the vector (unit length)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    
    // Prevent division by zero if embedding is all zeros
    if (magnitude === 0) {
      // Fill with small random values if no meaningful embedding created
      return Array(this.dimensions).fill(0).map((_, i) => 
        Math.sin(i) * 0.01
      );
    }
    
    return embedding.map(val => val / magnitude);
  }
  
  /**
   * Simple string hashing function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
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
    const threshold = options?.threshold || 0.2; // Lower default threshold to improve result retrieval
    
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Extract entries with improved pre-filtering using indexes
    let candidateEntries = this.getFilteredEntries(options?.filter);
    
    // Enhanced logging for debugging empty results
    console.log(`[VectorMemory] Search query: "${query.substring(0, 50)}..." with ${candidateEntries.length} candidate entries`);
    if (candidateEntries.length === 0) {
      console.log(`[VectorMemory] WARNING: No candidate entries found for search. Check filter settings or add entries.`);
      this.logActivity('Empty candidate set for search', LogLevel.WARNING, {
        query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
        filter: options?.filter
      });
      return [];
    }
    
    // Log first few candidate entries for debugging
    if (candidateEntries.length > 0) {
      console.log(`[VectorMemory] First ${Math.min(3, candidateEntries.length)} candidate entries:`);
      candidateEntries.slice(0, 3).forEach((entry, i) => {
        console.log(`[VectorMemory] Candidate ${i+1}: ${entry.text.substring(0, 100)}... (has embedding: ${!!entry.embedding})`);
      });
    }
    
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
    
    // Log raw scores before thresholding
    console.log(`[VectorMemory] Raw similarity scores (first 5): ${
      results.slice(0, 5).map(r => r.score.toFixed(4)).join(', ')
    }`);
    
    // Apply threshold
    let finalResults = results
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score);
    
    console.log(`[VectorMemory] After threshold (${threshold}): ${finalResults.length} results remain`);
    
    // Apply diversity filter if enabled
    if (options?.diversityOptions?.enabled) {
      finalResults = this.applyDiversityFilter(
        finalResults, 
        options.diversityOptions.minDistance || 0.15,
        options.diversityOptions.maxSimilarResults || 2
      );
      console.log(`[VectorMemory] After diversity filtering: ${finalResults.length} results remain`);
    }
    
    // Get final limited results
    const limitedResults = finalResults.slice(0, limit);
    
    // Log details about final results
    if (limitedResults.length > 0) {
      console.log(`[VectorMemory] Top result score: ${limitedResults[0].score.toFixed(4)}, text: "${
        limitedResults[0].entry.text.substring(0, 100)}..."`);
    } else {
      console.log(`[VectorMemory] WARNING: No results above threshold (${threshold}). Consider lowering threshold.`);
    }
    
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
    const threshold = options?.threshold || 0.3;
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
    const threshold = options?.similarityThreshold || 0.3;
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
   * Get all entries (for debugging and testing)
   */
  getEntries(): MemoryEntry[] {
    return Array.from(this.entries.values());
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

/**
 * Initialize vector memory with seed data if empty
 */
export async function initializeVectorMemory() {
  try {
    // First try to load from persistent storage
    await vectorMemory.load();
    
    // Check if the memory is empty
    const count = await vectorMemory.count();
    console.log(`[VectorMemory] Initialization check: ${count} entries found`);
    
    if (count === 0) {
      console.log('[VectorMemory] No entries found, adding seed data...');
      
      // Add seed data about Grandview real estate market
      const seedEntries = [
        {
          text: "The real estate market in Grandview, WA has been showing strong appreciation in the past year. Average home prices have increased by 8.5% year-over-year, with the median home value now at $325,000. Days on market has decreased from 45 to 32 days.",
          metadata: {
            category: 'market-trend',
            tags: ['price-increase', 'appreciation', 'market-update'],
            importance: 0.9,
            confidence: 0.95,
            timestamp: new Date().toISOString(),
            source: 'market-report'
          }
        },
        {
          text: "Grandview neighborhoods with the highest growth include Westside (12% appreciation) and Eastridge (9.5% appreciation). These areas are particularly popular with first-time homebuyers due to good school districts and proximity to major employers.",
          metadata: {
            category: 'neighborhood-profile',
            tags: ['westside', 'eastridge', 'appreciation', 'first-time-buyers'],
            importance: 0.85,
            confidence: 0.9,
            timestamp: new Date().toISOString(),
            source: 'neighborhood-analysis'
          }
        },
        {
          text: "Rental rates in Grandview have increased by an average of 6.8% over the past year. One-bedroom apartments now average $950/month, while three-bedroom homes average $1,750/month. Vacancy rates remain low at 3.2%.",
          metadata: {
            category: 'rental-market',
            tags: ['rental-rates', 'vacancy', 'rental-increase'],
            importance: 0.8,
            confidence: 0.92,
            timestamp: new Date().toISOString(),
            source: 'rental-report'
          }
        },
        {
          text: "Investment opportunities in Grandview are concentrated in multifamily properties and single-family homes in emerging neighborhoods. Cap rates for multifamily properties average 6.5%, while single-family home investors are seeing ROI of approximately 7.2% when accounting for both appreciation and rental income.",
          metadata: {
            category: 'investment',
            tags: ['multifamily', 'cap-rates', 'roi', 'investment-strategy'],
            importance: 0.88,
            confidence: 0.9,
            timestamp: new Date().toISOString(),
            source: 'investment-analysis'
          }
        },
        {
          text: "The commercial real estate market in Grandview is showing signs of recovery post-pandemic. Retail vacancies have decreased from 12% to 7.5% in the past year, while office space demand remains subdued with vacancy rates at 15%. Industrial properties are performing strongest with only 4% vacancy.",
          metadata: {
            category: 'commercial',
            tags: ['retail', 'office', 'industrial', 'vacancy', 'post-pandemic'],
            importance: 0.75,
            confidence: 0.88,
            timestamp: new Date().toISOString(),
            source: 'commercial-report'
          }
        }
      ];
      
      // Add each seed entry to the vector memory
      for (const entry of seedEntries) {
        await vectorMemory.addEntry(entry.text, entry.metadata);
      }
      
      console.log(`[VectorMemory] Added ${seedEntries.length} seed entries. New count: ${await vectorMemory.count()}`);
      
      // Save to persistent storage
      await vectorMemory.save();
    }
  } catch (error) {
    console.error('[VectorMemory] Error during initialization:', error);
  }
}