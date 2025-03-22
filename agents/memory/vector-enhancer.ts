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
        optimized.embedding = compressEmbedding(
          entry.embedding, 
          this.config.embeddingPrecision
        );
      }
      
      // Optimize metadata
      optimized.metadata = compressMetadata(
        entry.metadata,
        this.config.maxMetadataSize
      );
      
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
  }> {
    try {
      // Get all entries
      const entries = await vectorMemory.getAllEntries();
      const entriesBefore = entries.length;
      
      // Skip if under limit
      if (entries.length <= this.config.maxEntries) {
        return { 
          entriesBefore,
          entriesAfter: entriesBefore,
          memoryReduction: 0
        };
      }
      
      // Calculate pruning amount
      const entriesToRemove = entries.length - this.config.maxEntries;
      
      // Skip if nothing to remove
      if (entriesToRemove <= 0) {
        return { 
          entriesBefore,
          entriesAfter: entriesBefore,
          memoryReduction: 0
        };
      }
      
      // Calculate scores for each entry
      const scoredEntries = entries.map(entry => {
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
      
      // Remove entries
      for (const id of idsToRemove) {
        await vectorMemory.removeEntry(id);
        
        // Also clean up tracking maps
        this.accessCounts.delete(id);
        this.lastAccessed.delete(id);
      }
      
      // Calculate memory stats
      const entriesAfter = await vectorMemory.count();
      const memoryReduction = entriesToRemove;
      
      // Log the optimization
      await logMemoryOptimization('memory_pruned', {
        entriesBefore,
        entriesAfter,
        entriesRemoved: entriesToRemove
      }, LogLevel.INFO);
      
      return {
        entriesBefore,
        entriesAfter,
        memoryReduction
      };
    } catch (error) {
      console.error('Error optimizing memory:', error);
      
      // Return no change
      const count = await vectorMemory.count();
      return {
        entriesBefore: count,
        entriesAfter: count,
        memoryReduction: 0
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
          await vectorMemory.updateEntry(optimized);
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