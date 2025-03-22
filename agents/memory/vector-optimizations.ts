/**
 * Vector Memory Optimizations
 * 
 * This file contains utility functions for optimizing vector memory
 * to reduce memory usage and improve performance.
 */

import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';
import { MemoryEntry } from './vector';

/**
 * Configuration for memory optimization
 */
export interface MemoryOptimizationConfig {
  // Text and content optimization
  maxTextLength: number;
  minTextLength: number;
  
  // Embedding optimization
  embeddingPrecision: number; // Decimal places to keep
  compressEmbeddings: boolean;
  
  // Metadata optimization
  maxMetadataSize: number; // in bytes
  
  // Memory management
  maxEntries: number;
  maxMemoryUsage: number; // in MB
  
  // Cleanup
  enableTTL: boolean;
  defaultTTL: number; // in ms
  
  // Cache optimization
  cacheResultLimit: number;
  cacheEntryTimeoutMs: number;
}

/**
 * Default optimization configuration
 */
export const DEFAULT_OPTIMIZATION_CONFIG: MemoryOptimizationConfig = {
  maxTextLength: 1500,
  minTextLength: 20,
  embeddingPrecision: 5,
  compressEmbeddings: true,
  maxMetadataSize: 1024, // 1KB
  maxEntries: 10000,
  maxMemoryUsage: 100, // 100MB
  enableTTL: true,
  defaultTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
  cacheResultLimit: 50,
  cacheEntryTimeoutMs: 10 * 60 * 1000 // 10 minutes
};

/**
 * Optimize text length while preserving semantic content
 */
export function optimizeText(text: string, maxLength: number): string {
  // Return as is if under limit
  if (text.length <= maxLength) {
    return text;
  }
  
  // Smart truncation that preserves semantic meaning
  // 1. Try to find a sentence break near target length
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length > 1) {
    let accumLength = 0;
    let truncatedText = '';
    
    for (const sentence of sentences) {
      // If adding this sentence would exceed max length, stop
      if (accumLength + sentence.length > maxLength - 3) { // -3 for '...'
        break;
      }
      
      truncatedText += sentence;
      accumLength += sentence.length;
    }
    
    return truncatedText + '...';
  }
  
  // 2. If no sentence breaks, try to find word breaks
  const halfLength = Math.floor((maxLength - 3) / 2);
  return text.substring(0, halfLength) + '...' + text.substring(text.length - halfLength);
}

/**
 * Compress embedding vectors to reduced precision
 */
export function compressEmbedding(
  embedding: number[],
  precision: number = 5
): number[] | Float32Array {
  // Convert to specified precision
  const compressed = embedding.map(val => 
    Number(val.toFixed(precision))
  );
  
  // For further optimization, use Float32Array
  return new Float32Array(compressed);
}

/**
 * Compress metadata to reduce size
 */
export function compressMetadata(
  metadata: Record<string, any>,
  maxSize: number = 1024
): Record<string, any> {
  // Create a copy
  const result = { ...metadata };
  
  // Calculate current size
  let currentSize = JSON.stringify(result).length;
  
  // If already under limit, return as is
  if (currentSize <= maxSize) {
    return result;
  }
  
  // Identify low-priority fields that could be trimmed or removed
  const lowPriorityFields = [
    'details', 'description', 'context', 'fullText', 
    'raw', 'debug', 'extra', 'notes'
  ];
  
  // First, truncate long string properties
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && value.length > 100) {
      // Truncate more aggressively for low-priority fields
      const isLowPriority = lowPriorityFields.includes(key);
      const maxFieldLength = isLowPriority ? 50 : 100;
      
      result[key] = value.substring(0, maxFieldLength) + '...';
    }
  }
  
  // Calculate new size
  currentSize = JSON.stringify(result).length;
  
  // If still over limit, remove low-priority fields
  if (currentSize > maxSize) {
    for (const key of lowPriorityFields) {
      if (key in result) {
        delete result[key];
        
        // Recalculate size
        currentSize = JSON.stringify(result).length;
        
        // Break if under limit
        if (currentSize <= maxSize) {
          break;
        }
      }
    }
  }
  
  // If STILL over limit, aggressively truncate all string fields
  if (currentSize > maxSize) {
    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'string' && value.length > 20) {
        result[key] = value.substring(0, 20) + '...';
      }
    }
  }
  
  return result;
}

/**
 * Calculate memory importance score for pruning decisions
 */
export function calculateMemoryScore(entry: MemoryEntry & {
  accessCount?: number;
  lastAccessed?: number;
}): number {
  // Factors to consider
  const importanceFactor = entry.metadata.importance || 0.5;
  const confidenceFactor = entry.metadata.confidence || 0.5;
  const recencyFactor = getRecencyScore(entry);
  const accessFactor = getAccessScore(entry);
  
  // Calculate composite score
  const score = (
    importanceFactor * 0.4 +
    confidenceFactor * 0.2 +
    recencyFactor * 0.2 +
    accessFactor * 0.2
  );
  
  return score;
}

/**
 * Calculate recency score (0-1)
 */
function getRecencyScore(entry: MemoryEntry & {
  lastAccessed?: number;
}): number {
  // Use creation date if available
  const timestamp = entry.metadata.timestamp || entry.createdAt;
  
  if (!timestamp) {
    return 0.5; // Default if no timestamp
  }
  
  // Use last accessed time if available
  const timeToConsider = entry.lastAccessed || new Date(timestamp).getTime();
  
  // Calculate days since creation/access
  const now = Date.now();
  const diffDays = (now - timeToConsider) / (1000 * 60 * 60 * 24);
  
  // Score decreases as entry ages (1.0 for today, 0.0 for very old)
  // Use a logarithmic decay function
  const score = Math.max(0, 1 - Math.log10(diffDays + 1) / 3);
  
  return score;
}

/**
 * Calculate access frequency score (0-1)
 */
function getAccessScore(entry: MemoryEntry & {
  accessCount?: number;
}): number {
  // If no access count data, return neutral score
  if (entry.accessCount === undefined) {
    return 0.5;
  }
  
  // Score based on access count
  // 0 accesses = 0.0, 10+ accesses = 1.0
  const score = Math.min(1.0, entry.accessCount / 10);
  
  return score;
}

/**
 * Log memory optimization activity
 */
export async function logMemoryOptimization(
  action: string,
  details: Record<string, any> = {},
  level: LogLevel = LogLevel.DEBUG
): Promise<void> {
  try {
    // Skip detailed logging in production to save memory
    if (level === LogLevel.DEBUG && process.env.NODE_ENV === 'production') {
      return;
    }
    
    await storage.createLog({
      level,
      category: LogCategory.PERFORMANCE,
      message: `[VectorMemOpt] ${action}`,
      details: JSON.stringify(details),
      source: 'vector-memory-optimization',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['memory', 'vector', 'optimization']
    });
  } catch (error) {
    // Fail silently - this is optimization logging
    console.error('Failed to log memory optimization:', error);
  }
}