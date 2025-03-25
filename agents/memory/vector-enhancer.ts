/**
 * Vector Memory Enhancer
 * 
 * This file enhances the existing vector memory system with 
 * additional memory optimization features.
 */

import { 
  compressEmbedding, 
  compressMetadata, 
  optimizeText, 
  calculateMemoryScore,
  logMemoryOptimization,
  DEFAULT_OPTIMIZATION_CONFIG,
  MemoryOptimizationConfig
} from './vector-optimizations';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';
import { vectorMemory, MemoryEntry } from './vector';

/**
 * Applies memory optimizations to the vector memory system
 */
export class VectorMemoryEnhancer {
  private static instance: VectorMemoryEnhancer;
  private config: MemoryOptimizationConfig;
  private accessCounts: Map<string, number> = new Map();
  private lastAccessed: Map<string, number> = new Map();
  private optimizationTimer?: NodeJS.Timeout;
  
  /**
   * Private constructor for singleton
   */
  private constructor(config?: Partial<MemoryOptimizationConfig>) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    this.setupOptimizationCycle();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(config?: Partial<MemoryOptimizationConfig>): VectorMemoryEnhancer {
    if (!VectorMemoryEnhancer.instance) {
      VectorMemoryEnhancer.instance = new VectorMemoryEnhancer(config);
    }
    return VectorMemoryEnhancer.instance;
  }
  
  /**
   * Apply optimizations to a memory entry before it's stored
   */
  public optimizeEntry(entry: MemoryEntry): MemoryEntry {
    try {
      // Create a copy of the entry to avoid modifying original
      const optimized = { ...entry };
      
      // Optimize text field
      optimized.text = optimizeText(entry.text, this.config.maxTextLength);
      
      // Optimize embedding if present
      if (entry.embedding && Array.isArray(entry.embedding)) {
        // Keep original embedding array structure to ensure compatibility
        optimized.embedding = entry.embedding.map(val => 
          Number(val.toFixed(this.config.embeddingPrecision))
        );
      }
      
      // For type safety, we use our own utility for creating proper metadata
      optimized.metadata = this.createProperMetadata(entry.metadata);
      
      // Record optimization
      logMemoryOptimization('optimized_entry', {
        id: entry.id,
        originalTextLength: entry.text.length,
        optimizedTextLength: optimized.text.length,
        originalMetadataSize: JSON.stringify(entry.metadata).length,
        optimizedMetadataSize: JSON.stringify(optimized.metadata).length
      });
      
      return optimized;
    } catch (error) {
      // If optimization fails, return original
      console.error('Error optimizing memory entry:', error);
      return entry;
    }
  }
  
  /**
   * Create properly structured metadata with all required fields
   */
  private createProperMetadata(inputMetadata: Record<string, any>): {
    source: string;
    timestamp: string;
    category?: string;
    tags?: string[];
    importance?: number;
    confidence?: number;
    agentId?: string;
    expiresAt?: string;
    [key: string]: any;
  } {
    return {
      // Required fields with defaults
      source: inputMetadata.source || 'unknown',
      timestamp: inputMetadata.timestamp || new Date().toISOString(),
      
      // Optional fields
      category: inputMetadata.category,
      tags: inputMetadata.tags,
      importance: inputMetadata.importance,
      confidence: inputMetadata.confidence,
      agentId: inputMetadata.agentId,
      expiresAt: inputMetadata.expiresAt
    };
  }

  /**
   * Track access to entries for LRU/LFU strategies
   */
  public trackAccess(entryId: string): void {
    // Update access count
    const currentCount = this.accessCounts.get(entryId) || 0;
    this.accessCounts.set(entryId, currentCount + 1);
    
    // Update last accessed timestamp
    this.lastAccessed.set(entryId, Date.now());
  }
  
  /**
   * Run memory optimization to free up space
   */
  public async optimizeMemory(): Promise<{
    entriesBefore: number;
    entriesAfter: number;
    memoryReduction: number;
    redundantEntriesRemoved?: number;
  }> {
    try {
      // Get all entries
      const entries = await vectorMemory.getAllEntries();
      const entriesBefore = entries.length;
      
      // Step 1: First try to remove redundant entries
      console.log('[VectorMemoryEnhancer] Checking for redundant entries...');
      const redundantEntries = await this.identifyRedundantEntries();
      
      // Remove redundant entries first as a priority
      let redundantRemoved = 0;
      if (redundantEntries.length > 0) {
        console.log(`[VectorMemoryEnhancer] Found ${redundantEntries.length} redundant entries to remove`);
        
        for (const id of redundantEntries) {
          try {
            // Delete the entry
            const deleted = await vectorMemory.deleteEntry(id);
            if (deleted) {
              redundantRemoved++;
              
              // Also remove from tracking maps
              this.accessCounts.delete(id);
              this.lastAccessed.delete(id);
            }
          } catch (error) {
            console.error(`[VectorMemoryEnhancer] Failed to delete redundant entry ${id}:`, error);
          }
        }
        
        console.log(`[VectorMemoryEnhancer] Successfully removed ${redundantRemoved} redundant entries`);
      }
      
      // Get updated entry count after removing redundant entries
      const entriesAfterRedundantRemoval = await vectorMemory.count();
      
      // Skip if under limit after removing redundant entries
      if (entriesAfterRedundantRemoval <= this.config.maxEntries) {
        return { 
          entriesBefore,
          entriesAfter: entriesAfterRedundantRemoval,
          memoryReduction: entriesBefore - entriesAfterRedundantRemoval,
          redundantEntriesRemoved: redundantRemoved
        };
      }
      
      // Step 2: If still over limit, continue with regular scoring-based pruning
      // Calculate pruning amount (accounting for already removed redundant entries)
      const entriesToRemove = entriesAfterRedundantRemoval - this.config.maxEntries;
      
      // Skip if nothing more to remove
      if (entriesToRemove <= 0) {
        return { 
          entriesBefore,
          entriesAfter: entriesAfterRedundantRemoval,
          memoryReduction: entriesBefore - entriesAfterRedundantRemoval,
          redundantEntriesRemoved: redundantRemoved
        };
      }
      
      // Get updated entries after redundant removal
      const remainingEntries = await vectorMemory.getAllEntries();
      
      // Calculate scores for each entry
      const scoredEntries = remainingEntries.map(entry => {
        const accessCount = this.accessCounts.get(entry.id) || 0;
        const lastAccessed = this.lastAccessed.get(entry.id) || 0;
        
        // Add these to entry for score calculation
        const enrichedEntry = {
          ...entry,
          accessCount,
          lastAccessed
        };
        
        return {
          id: entry.id,
          score: calculateMemoryScore(enrichedEntry)
        };
      });
      
      // Sort by score (ascending = remove lowest scores first)
      scoredEntries.sort((a, b) => a.score - b.score);
      
      // Get IDs to remove
      const idsToRemove = scoredEntries
        .slice(0, entriesToRemove)
        .map(item => item.id);
      
      // Remove entries based on score
      let scoreBasedRemoved = 0;
      for (const id of idsToRemove) {
        try {
          console.log(`[VectorMemoryEnhancer] Removing low-scoring entry ${id}`);
          
          // Actually remove the entry from vector memory
          const deleted = await vectorMemory.deleteEntry(id);
          if (deleted) {
            scoreBasedRemoved++;
            
            // Clean up tracking maps
            this.accessCounts.delete(id);
            this.lastAccessed.delete(id);
          }
        } catch (error) {
          console.error(`[VectorMemoryEnhancer] Failed to remove entry ${id}:`, error);
        }
      }
      
      // Calculate final memory stats
      const entriesAfter = await vectorMemory.count();
      const memoryReduction = entriesBefore - entriesAfter;
      
      // Log the optimization
      await logMemoryOptimization('memory_pruned', {
        entriesBefore,
        entriesAfter,
        redundantRemoved,
        scoreBasedRemoved,
        totalRemoved: memoryReduction
      }, LogLevel.INFO);
      
      return {
        entriesBefore,
        entriesAfter,
        memoryReduction,
        redundantEntriesRemoved: redundantRemoved
      };
    } catch (error) {
      console.error('Error optimizing memory:', error);
      
      // Return no change
      const count = await vectorMemory.count();
      return {
        entriesBefore: count,
        entriesAfter: count,
        memoryReduction: 0,
        redundantEntriesRemoved: 0
      };
    }
  }
  
  /**
   * Apply optimizations to the entire memory store
   */
  public async optimizeAllEntries(): Promise<{
    entriesProcessed: number;
    bytesReduced: number;
  }> {
    try {
      // Get all entries
      const entries = await vectorMemory.getAllEntries();
      let bytesReduced = 0;
      
      // Process each entry
      for (const entry of entries) {
        // Calculate original size
        const originalSize = 
          entry.text.length + 
          (entry.embedding?.length || 0) * 8 + // 64-bit numbers
          JSON.stringify(entry.metadata).length;
        
        // Optimize entry
        const optimized = this.optimizeEntry(entry);
        
        // Calculate optimized size
        const optimizedSize = 
          optimized.text.length + 
          (optimized.embedding instanceof Float32Array 
            ? optimized.embedding.length * 4  // 32-bit floats
            : (optimized.embedding?.length || 0) * 8) + 
          JSON.stringify(optimized.metadata).length;
        
        // Calculate bytes saved
        const byteSaving = Math.max(0, originalSize - optimizedSize);
        bytesReduced += byteSaving;
        
        // Update entry if optimized
        if (byteSaving > 0) {
          try {
            // Actually update the entry with optimized data
            console.log(`[VectorMemoryEnhancer] Updating entry ${entry.id} (savings: ${byteSaving} bytes)`);
            
            // Update the entry with optimized version
            await vectorMemory.updateEntry(entry.id, {
              text: optimized.text,
              embedding: optimized.embedding,
              metadata: optimized.metadata
            });
          } catch (error) {
            console.warn(`Could not update entry ${entry.id}: ${error.message}`);
          }
        }
      }
      
      // Log the optimization
      await logMemoryOptimization('entries_optimized', {
        entriesProcessed: entries.length,
        bytesReduced,
        kbReduced: Math.round(bytesReduced / 1024)
      }, LogLevel.INFO);
      
      return {
        entriesProcessed: entries.length,
        bytesReduced
      };
    } catch (error) {
      console.error('Error optimizing all entries:', error);
      return {
        entriesProcessed: 0,
        bytesReduced: 0
      };
    }
  }
  
  /**
   * Set up regular optimization cycle
   */
  private setupOptimizationCycle(): void {
    // Clear any existing timer
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }
    
    // Set up interval for regular optimization
    // Run every 15 minutes
    this.optimizationTimer = setInterval(async () => {
      try {
        console.log('[VectorMemoryEnhancer] Running scheduled optimization');
        
        // Run memory optimization
        await this.optimizeMemory();
        
        // Periodically run full optimization (once per day)
        const hour = new Date().getHours();
        if (hour === 3) { // 3 AM, typically low usage
          await this.optimizeAllEntries();
        }
      } catch (error) {
        console.error('[VectorMemoryEnhancer] Error in optimization cycle:', error);
      }
    }, 15 * 60 * 1000); // 15 minutes
  }
  
  /**
   * Identify and remove redundant or duplicate entries
   * Returns a list of entry IDs that were identified as redundant
   */
  public async identifyRedundantEntries(): Promise<string[]> {
    try {
      // Get all entries
      const entries = await vectorMemory.getAllEntries();
      
      // Skip if too few entries
      if (entries.length < 5) {  // Need at least a few entries to find duplicates
        return [];
      }
      
      // Map to track highly similar entries by textual content
      const similarityGroups: Record<string, string[]> = {};
      const redundantIds: string[] = [];
      
      // Group entries by content similarity
      for (const entry of entries) {
        // Skip entries with importance > 0.8 (preserve important entries)
        if ((entry.metadata?.importance || 0) > 0.8) {
          continue;
        }
        
        // Create a simple hash of the entry content for grouping
        const contentHash = this.simpleHash(entry.text);
        
        if (!similarityGroups[contentHash]) {
          similarityGroups[contentHash] = [];
        }
        
        // Add to appropriate group
        similarityGroups[contentHash].push(entry.id);
      }
      
      // For each group with multiple entries, mark all but the newest for removal
      for (const hash in similarityGroups) {
        const group = similarityGroups[hash];
        
        // If we have more than one entry with similar content
        if (group.length > 1) {
          // Get full entries to determine which to keep
          const fullEntries = await Promise.all(
            group.map(id => vectorMemory.findById(id))
          );
          
          // Remove nulls (entries that might have been deleted)
          const validEntries = fullEntries.filter(entry => entry !== null) as MemoryEntry[];
          
          // Sort by created date (descending = newest first)
          validEntries.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          // Keep the newest entry, mark others as redundant
          // Skip the first one (newest, which we'll keep)
          for (let i = 1; i < validEntries.length; i++) {
            redundantIds.push(validEntries[i].id);
          }
        }
      }
      
      // Log the identified redundant entries
      await logMemoryOptimization('redundant_entries_identified', {
        totalEntries: entries.length,
        redundantEntries: redundantIds.length,
        redundantIds
      }, LogLevel.INFO);
      
      return redundantIds;
    } catch (error) {
      console.error('Error identifying redundant entries:', error);
      return [];
    }
  }
  
  /**
   * Create a simple hash for content similarity grouping
   */
  private simpleHash(text: string): string {
    // Normalize text
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove punctuation
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
    
    // Take the first 100 characters as a simple hash
    const shortText = normalized.substring(0, 100);
    
    // Generate a more unique hash from the shortened text
    let hash = 0;
    for (let i = 0; i < shortText.length; i++) {
      hash = ((hash << 5) - hash) + shortText.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16);
  }
    
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }
  }
}

/**
 * Singleton instance
 */
export const vectorMemoryEnhancer = VectorMemoryEnhancer.getInstance();

/**
 * Initialize the vector memory enhancer
 */
export async function initializeVectorMemoryEnhancer(
  config?: Partial<MemoryOptimizationConfig>
): Promise<void> {
  try {
    // Initialize with config if provided
    if (config) {
      VectorMemoryEnhancer.getInstance(config);
    }
    
    // Run initial optimization
    await vectorMemoryEnhancer.optimizeAllEntries();
    
    // Log initialization
    await logMemoryOptimization('enhancer_initialized', {
      config: vectorMemoryEnhancer['config']
    }, LogLevel.INFO);
    
    console.log('[VectorMemoryEnhancer] Initialized and optimized');
  } catch (error) {
    console.error('[VectorMemoryEnhancer] Error during initialization:', error);
  }
}