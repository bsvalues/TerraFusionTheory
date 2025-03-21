/**
 * Vector Memory System
 * 
 * This file implements the vector memory system for agent memory storage
 * and retrieval with semantic search capabilities.
 */

import { v4 as uuidv4 } from 'uuid';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';

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
}

/**
 * Simplified in-memory vector store
 * 
 * Note: This is a simple implementation for development purposes.
 * In a production system, this would be replaced with a proper vector database
 * such as Pinecone, Milvus, Qdrant, etc.
 */
class InMemoryVectorStore {
  private entries: Map<string, MemoryEntry> = new Map();
  private namespace: string;
  private persistToFile: boolean;
  private persistPath: string;
  private dimensions: number;
  private maxEntries: number;
  private dirty: boolean = false;
  
  constructor(options?: MemoryStoreOptions) {
    this.namespace = options?.namespace || 'default';
    this.persistToFile = options?.persistToFile || false;
    this.persistPath = options?.persistPath || `./data/vector_memory_${this.namespace}.json`;
    this.dimensions = options?.dimensions || 1536; // Default for OpenAI embeddings
    this.maxEntries = options?.maxEntries || 10000;
    
    // Log initialization
    this.logActivity('Initialized vector memory store', LogLevel.INFO, {
      namespace: this.namespace,
      persistToFile: this.persistToFile,
      persistPath: this.persistPath,
      dimensions: this.dimensions,
      maxEntries: this.maxEntries
    });
  }
  
  /**
   * Add an entry to the vector store
   */
  async addEntry(
    text: string,
    metadata: MemoryEntry['metadata'],
    embedding?: number[]
  ): Promise<string> {
    // Generate ID if not provided in metadata
    const id = metadata.id || `mem_${uuidv4()}`;
    
    // If no embedding is provided, we would normally generate one here
    // For now, we'll use a mock embedding (random vector) in development
    const actualEmbedding = embedding || this.mockEmbedding();
    
    const entry: MemoryEntry = {
      id,
      text,
      embedding: actualEmbedding,
      metadata: {
        ...metadata,
        timestamp: metadata.timestamp || new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store the entry
    this.entries.set(id, entry);
    this.dirty = true;
    
    // Handle max entries limit (simple FIFO eviction policy)
    if (this.entries.size > this.maxEntries) {
      const oldestEntryId = Array.from(this.entries.keys())[0];
      this.entries.delete(oldestEntryId);
      
      this.logActivity('Evicted oldest memory entry due to capacity limit', LogLevel.INFO, {
        evictedId: oldestEntryId,
        currentSize: this.entries.size,
        maxSize: this.maxEntries
      });
    }
    
    // Log the addition
    this.logActivity('Added memory entry', LogLevel.DEBUG, {
      id,
      textPreview: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      metadata: {
        source: metadata.source,
        category: metadata.category,
        tags: metadata.tags
      }
    });
    
    return id;
  }
  
  /**
   * Get an entry by ID
   */
  async getEntry(id: string): Promise<MemoryEntry | null> {
    const entry = this.entries.get(id);
    return entry || null;
  }
  
  /**
   * Delete an entry by ID
   */
  async deleteEntry(id: string): Promise<boolean> {
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
    
    this.entries.set(id, updatedEntry);
    this.dirty = true;
    
    this.logActivity('Updated memory entry', LogLevel.DEBUG, { id });
    
    return updatedEntry;
  }
  
  /**
   * Search for entries using vector similarity
   */
  async search(
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      filter?: (entry: MemoryEntry) => boolean;
    }
  ): Promise<MemorySearchResult[]> {
    const limit = options?.limit || 5;
    const threshold = options?.threshold || 0.7;
    
    // In a real implementation, we would:
    // 1. Generate embedding for the query
    // 2. Compute similarity with all entries
    // 3. Return the most similar entries above threshold
    
    // For this mock implementation, we'll:
    // 1. Create a mock query embedding
    // 2. Compute mock similarity scores (normally cosine similarity)
    // 3. Return entries with mock filtering
    
    const queryEmbedding = this.mockEmbedding();
    
    // Get all entries that match the filter (if provided)
    const filteredEntries = Array.from(this.entries.values())
      .filter(entry => !options?.filter || options.filter(entry));
    
    // Calculate mock similarity scores
    const results: MemorySearchResult[] = filteredEntries.map(entry => {
      // Mock similarity calculation (in real implementation, this would be cosine similarity)
      // Random score between 0.5 and 1.0 for demo purposes
      const score = 0.5 + Math.random() * 0.5;
      
      return {
        entry,
        score
      };
    });
    
    // Sort by score (descending) and apply threshold
    const finalResults = results
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    this.logActivity('Performed vector search', LogLevel.DEBUG, {
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      resultCount: finalResults.length,
      totalSearched: filteredEntries.length
    });
    
    return finalResults;
  }
  
  /**
   * Get all entries (with optional filtering)
   */
  async getAllEntries(filter?: (entry: MemoryEntry) => boolean): Promise<MemoryEntry[]> {
    const entries = Array.from(this.entries.values());
    return filter ? entries.filter(filter) : entries;
  }
  
  /**
   * Get entries by tag
   */
  async getEntriesByTag(tag: string): Promise<MemoryEntry[]> {
    return Array.from(this.entries.values())
      .filter(entry => entry.metadata.tags?.includes(tag));
  }
  
  /**
   * Get entries by category
   */
  async getEntriesByCategory(category: string): Promise<MemoryEntry[]> {
    return Array.from(this.entries.values())
      .filter(entry => entry.metadata.category === category);
  }
  
  /**
   * Get entries by agent ID
   */
  async getEntriesByAgentId(agentId: string): Promise<MemoryEntry[]> {
    return Array.from(this.entries.values())
      .filter(entry => entry.metadata.agentId === agentId);
  }
  
  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    const count = this.entries.size;
    this.entries.clear();
    this.dirty = true;
    
    this.logActivity('Cleared all memory entries', LogLevel.INFO, { count });
  }
  
  /**
   * Get the count of entries
   */
  async count(): Promise<number> {
    return this.entries.size;
  }
  
  /**
   * Load entries from persistent storage
   */
  async load(): Promise<boolean> {
    if (!this.persistToFile) {
      return false;
    }
    
    try {
      // In a real implementation, this would read from a file or database
      // For now, we'll just log that we would load
      this.logActivity('Would load vector memory from file (not implemented)', LogLevel.INFO, {
        path: this.persistPath
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
   * Save entries to persistent storage
   */
  async save(): Promise<boolean> {
    if (!this.persistToFile || !this.dirty) {
      return false;
    }
    
    try {
      // In a real implementation, this would write to a file or database
      // For now, we'll just log that we would save
      this.logActivity('Would save vector memory to file (not implemented)', LogLevel.INFO, {
        path: this.persistPath,
        entryCount: this.entries.size
      });
      
      this.dirty = false;
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
   * Clean up and persist if needed
   */
  async shutdown(): Promise<void> {
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
   * Generate a mock embedding vector
   * 
   * Note: In a real implementation, this would call an embedding API
   * like OpenAI's text-embedding-ada-002 model
   */
  private mockEmbedding(): number[] {
    // Create a random vector with appropriate dimensions
    return Array.from({ length: this.dimensions }, () => Math.random() * 2 - 1);
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
 * Singleton vector memory instance
 */
export const vectorMemory = new InMemoryVectorStore({
  namespace: 'intelligent-estate',
  persistToFile: true,
  persistPath: './data/vector_memory.json'
});