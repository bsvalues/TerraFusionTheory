/**
 * Vector Memory Implementation
 * 
 * This module provides a vector database-backed memory for agents to store and retrieve
 * information based on semantic similarity. It enables agents to have a more sophisticated
 * memory system than simple key-value stores.
 */

import { v4 as uuidv4 } from 'uuid';
import { storage } from '../../server/storage';
import { LogCategory, LogLevel } from '../../shared/schema';
import { enhancedAIService } from '../../server/services/enhanced-ai.service';

/**
 * Vector memory item with embeddings for similarity search
 */
export interface VectorMemoryItem {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding: number[];
  timestamp: number;
  ttl?: number; // Time-to-live in seconds (optional)
}

/**
 * Response from a memory search
 */
export interface MemorySearchResult {
  items: Array<{
    id: string;
    content: string;
    metadata: Record<string, any>;
    score: number; // Similarity score
    timestamp: number;
  }>;
  total: number;
}

/**
 * Vector memory configuration
 */
export interface VectorMemoryConfig {
  defaultTTL?: number; // Default time-to-live for items in seconds
  maxItems?: number; // Maximum number of items to store
  embeddingDimension?: number; // Dimensionality of embeddings
  removalStrategy?: 'lru' | 'lfu' | 'fifo' | 'ttl'; // Strategy for removing items when maxItems is reached
  persistToDisk?: boolean; // Whether to persist memory to disk
  persistenceInterval?: number; // How often to persist to disk in seconds
}

/**
 * Vector memory implementation using in-memory store with file backup
 */
export class VectorMemory {
  private static instance: VectorMemory;
  private items: Map<string, VectorMemoryItem>;
  private config: VectorMemoryConfig;
  private lastPersistTime: number;
  private isDirty: boolean;
  private persistenceTimer: NodeJS.Timeout | null;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor(config: VectorMemoryConfig = {}) {
    this.items = new Map<string, VectorMemoryItem>();
    this.config = {
      defaultTTL: 0, // 0 means no expiration
      maxItems: 10000,
      embeddingDimension: 1536, // Default for OpenAI embeddings
      removalStrategy: 'lru',
      persistToDisk: true,
      persistenceInterval: 300, // 5 minutes
      ...config
    };
    
    this.lastPersistTime = Date.now();
    this.isDirty = false;
    this.persistenceTimer = null;
    
    // Set up persistence timer if enabled
    if (this.config.persistToDisk && this.config.persistenceInterval) {
      this.persistenceTimer = setInterval(() => {
        this.persistToDisk();
      }, this.config.persistenceInterval * 1000);
    }
    
    // Load from disk if enabled
    if (this.config.persistToDisk) {
      this.loadFromDisk();
    }
    
    this.logActivity('Initialized vector memory', LogLevel.INFO);
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(config?: VectorMemoryConfig): VectorMemory {
    if (!VectorMemory.instance) {
      VectorMemory.instance = new VectorMemory(config);
    }
    return VectorMemory.instance;
  }
  
  /**
   * Clean up resources when shutting down
   */
  public shutdown(): void {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
      this.persistenceTimer = null;
    }
    
    if (this.isDirty && this.config.persistToDisk) {
      this.persistToDisk();
    }
  }
  
  /**
   * Add an item to memory with embedding
   */
  public async add(content: string, metadata: Record<string, any> = {}, ttl?: number): Promise<string> {
    const id = uuidv4();
    const timestamp = Date.now();
    
    try {
      // Generate embedding
      const embedding = await this.getEmbedding(content);
      
      // Create memory item
      const item: VectorMemoryItem = {
        id,
        content,
        metadata,
        embedding,
        timestamp,
        ttl: ttl !== undefined ? ttl : this.config.defaultTTL
      };
      
      // Add to memory
      this.items.set(id, item);
      this.isDirty = true;
      
      // Check if we need to remove items
      this.enforceMaxItems();
      
      // Log activity
      this.logActivity('Added memory item', LogLevel.INFO, {
        id,
        contentLength: content.length,
        metadataKeys: Object.keys(metadata)
      });
      
      return id;
    } catch (error) {
      this.logActivity('Failed to add memory item', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error),
        contentLength: content.length
      });
      throw error;
    }
  }
  
  /**
   * Get an item by ID
   */
  public get(id: string): VectorMemoryItem | undefined {
    const item = this.items.get(id);
    
    // Check if item exists and is not expired
    if (item) {
      if (this.isItemExpired(item)) {
        this.delete(id);
        return undefined;
      }
      return item;
    }
    
    return undefined;
  }
  
  /**
   * Delete an item by ID
   */
  public delete(id: string): boolean {
    const deleted = this.items.delete(id);
    if (deleted) {
      this.isDirty = true;
      this.logActivity('Deleted memory item', LogLevel.INFO, { id });
    }
    return deleted;
  }
  
  /**
   * Clear all items from memory
   */
  public clear(): void {
    const itemCount = this.items.size;
    this.items.clear();
    this.isDirty = true;
    this.logActivity('Cleared all memory items', LogLevel.INFO, { count: itemCount });
  }
  
  /**
   * Search for similar items in memory
   */
  public async search(
    query: string, 
    options: { 
      limit?: number; 
      threshold?: number; 
      filter?: (item: VectorMemoryItem) => boolean;
    } = {}
  ): Promise<MemorySearchResult> {
    const limit = options.limit || 10;
    const threshold = options.threshold || 0.7;
    const filter = options.filter;
    
    try {
      // Generate embedding for query
      const queryEmbedding = await this.getEmbedding(query);
      
      // Calculate similarity for all items
      const similarities: Array<{ item: VectorMemoryItem; score: number }> = [];
      
      for (const item of this.items.values()) {
        // Skip expired items
        if (this.isItemExpired(item)) {
          this.delete(item.id);
          continue;
        }
        
        // Apply filter if provided
        if (filter && !filter(item)) {
          continue;
        }
        
        // Calculate cosine similarity
        const similarity = this.calculateCosineSimilarity(queryEmbedding, item.embedding);
        
        // Add to results if above threshold
        if (similarity >= threshold) {
          similarities.push({ item, score: similarity });
        }
      }
      
      // Sort by similarity (highest first)
      similarities.sort((a, b) => b.score - a.score);
      
      // Take top N results
      const topResults = similarities.slice(0, limit);
      
      // Format results
      const result: MemorySearchResult = {
        items: topResults.map(({ item, score }) => ({
          id: item.id,
          content: item.content,
          metadata: item.metadata,
          score,
          timestamp: item.timestamp
        })),
        total: similarities.length
      };
      
      this.logActivity('Searched memory', LogLevel.INFO, {
        queryLength: query.length,
        resultsFound: result.items.length,
        totalMatches: result.total
      });
      
      return result;
    } catch (error) {
      this.logActivity('Memory search failed', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error),
        queryLength: query.length
      });
      throw error;
    }
  }
  
  /**
   * Get the number of items in memory
   */
  public size(): number {
    // Only count non-expired items
    let count = 0;
    const now = Date.now();
    
    for (const item of this.items.values()) {
      if (!this.isItemExpired(item)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Get memory usage statistics
   */
  public getStats(): Record<string, any> {
    // Count items by age buckets
    const now = Date.now();
    const stats = {
      totalItems: this.items.size,
      nonExpiredItems: 0,
      expiredItems: 0,
      byAge: {
        lastHour: 0,
        lastDay: 0,
        lastWeek: 0,
        older: 0
      },
      avgContentLength: 0,
      totalMemoryUsage: 0, // Approximate memory usage in bytes
    };
    
    let totalContentLength = 0;
    
    for (const item of this.items.values()) {
      // Check expiration
      if (this.isItemExpired(item)) {
        stats.expiredItems++;
        continue;
      }
      
      stats.nonExpiredItems++;
      totalContentLength += item.content.length;
      
      // Categorize by age
      const ageMs = now - item.timestamp;
      if (ageMs < 60 * 60 * 1000) { // Last hour
        stats.byAge.lastHour++;
      } else if (ageMs < 24 * 60 * 60 * 1000) { // Last day
        stats.byAge.lastDay++;
      } else if (ageMs < 7 * 24 * 60 * 60 * 1000) { // Last week
        stats.byAge.lastWeek++;
      } else {
        stats.byAge.older++;
      }
      
      // Approximate memory usage: strings ~2 bytes per char, plus embedding size
      stats.totalMemoryUsage += item.content.length * 2 + item.embedding.length * 4 + 
        JSON.stringify(item.metadata).length * 2;
    }
    
    if (stats.nonExpiredItems > 0) {
      stats.avgContentLength = totalContentLength / stats.nonExpiredItems;
    }
    
    return stats;
  }
  
  /**
   * Prune expired items
   */
  public pruneExpired(): number {
    let prunedCount = 0;
    
    for (const item of this.items.values()) {
      if (this.isItemExpired(item)) {
        this.items.delete(item.id);
        prunedCount++;
      }
    }
    
    if (prunedCount > 0) {
      this.isDirty = true;
      this.logActivity('Pruned expired memory items', LogLevel.INFO, { count: prunedCount });
    }
    
    return prunedCount;
  }
  
  /**
   * Check if an item is expired
   */
  private isItemExpired(item: VectorMemoryItem): boolean {
    if (!item.ttl || item.ttl <= 0) {
      return false; // No expiration
    }
    
    const now = Date.now();
    const expirationTime = item.timestamp + (item.ttl * 1000);
    
    return now > expirationTime;
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error(`Vector dimensions do not match: ${vecA.length} vs ${vecB.length}`);
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Generate embedding for text using OpenAI (or other service)
   */
  private async getEmbedding(text: string): Promise<number[]> {
    try {
      // Here we would use OpenAI or other embedding service
      // For now, we'll create a simple mock embedding
      // In a real implementation, this would call an API to get embeddings
      
      // For demonstration purposes, we're generating random embeddings
      // In a production system, you would use a proper embedding model like:
      // OpenAI's text-embedding-ada-002 or similar
      
      // This is just a mock implementation
      return this.mockEmbedding(text, this.config.embeddingDimension || 1536);
    } catch (error) {
      this.logActivity('Failed to generate embedding', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error),
        textLength: text.length
      });
      throw error;
    }
  }
  
  /**
   * Mock embedding generation for demonstration purposes
   */
  private mockEmbedding(text: string, dimension: number): number[] {
    // Creates a deterministic but very simplistic "embedding" based on the text
    // This is NOT a real embedding - just for demonstration
    const embedding: number[] = Array(dimension).fill(0);
    
    // Use text as a seed for the embedding
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Use the hash to seed a very basic PRNG
    const seed = Math.abs(hash);
    const prng = (n: number) => {
      return ((n * 9301 + 49297) % 233280) / 233280;
    };
    
    // Generate embedding values using the seeded PRNG
    let state = seed;
    for (let i = 0; i < dimension; i++) {
      state = prng(state) * 100000;
      embedding[i] = (prng(state) * 2) - 1; // Values between -1 and 1
    }
    
    // Normalize to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
  
  /**
   * Enforce maximum items policy
   */
  private enforceMaxItems(): void {
    if (!this.config.maxItems || this.items.size <= this.config.maxItems) {
      return;
    }
    
    const excess = this.items.size - this.config.maxItems;
    let removed = 0;
    
    // First remove expired items
    for (const item of this.items.values()) {
      if (removed >= excess) {
        break;
      }
      
      if (this.isItemExpired(item)) {
        this.items.delete(item.id);
        removed++;
      }
    }
    
    // If we still need to remove more, use the configured strategy
    if (removed < excess) {
      switch (this.config.removalStrategy) {
        case 'fifo':
          this.removeOldestItems(excess - removed);
          break;
        case 'lru':
          this.removeLeastRecentlyUsedItems(excess - removed);
          break;
        case 'lfu':
          this.removeLeastFrequentlyUsedItems(excess - removed);
          break;
        default:
          this.removeOldestItems(excess - removed);
      }
    }
  }
  
  /**
   * Remove oldest items
   */
  private removeOldestItems(count: number): void {
    // Sort items by timestamp
    const sorted = Array.from(this.items.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest items
    for (let i = 0; i < Math.min(count, sorted.length); i++) {
      this.items.delete(sorted[i][0]);
    }
    
    this.isDirty = true;
  }
  
  /**
   * Remove least recently used items
   * This is a simple implementation - in a real system you'd track access times
   */
  private removeLeastRecentlyUsedItems(count: number): void {
    // For now, this is the same as removing oldest
    // In a real implementation, you would track last access time
    this.removeOldestItems(count);
  }
  
  /**
   * Remove least frequently used items
   * This is a simple implementation - in a real system you'd track access counts
   */
  private removeLeastFrequentlyUsedItems(count: number): void {
    // For now, this is the same as removing oldest
    // In a real implementation, you would track access frequency
    this.removeOldestItems(count);
  }
  
  /**
   * Persist memory to disk
   */
  private async persistToDisk(): Promise<void> {
    if (!this.isDirty) {
      return;
    }
    
    try {
      // In a real implementation, this would write to a file or database
      // For this example, we'll just log that we would persist
      this.logActivity('Would persist memory to disk', LogLevel.INFO, {
        itemCount: this.items.size,
        dataSize: JSON.stringify(Array.from(this.items.entries())).length
      });
      
      this.isDirty = false;
      this.lastPersistTime = Date.now();
    } catch (error) {
      this.logActivity('Failed to persist memory', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Load memory from disk
   */
  private async loadFromDisk(): Promise<void> {
    try {
      // In a real implementation, this would read from a file or database
      // For this example, we'll just log that we would load from disk
      this.logActivity('Would load memory from disk', LogLevel.INFO);
    } catch (error) {
      this.logActivity('Failed to load memory from disk', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Log activity to the storage system
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
        tags: ['memory', 'vector', 'agent']
      });
    } catch (error) {
      console.error('Failed to log vector memory activity:', error);
    }
  }
}

// Export a singleton instance
export const vectorMemory = VectorMemory.getInstance();