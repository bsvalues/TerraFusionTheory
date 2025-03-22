/**
 * GIS Connector Memory Optimizations
 * 
 * This file enhances the GIS connector with memory optimizations
 * for efficient handling of geographic data.
 */

import { GeoJSONFeature, GeoJSONFeatureCollection } from './gis.connector';
import { LogCategory, LogLevel } from '../../../shared/schema';
import { storage } from '../../storage';

/**
 * Configuration for GIS data optimization
 */
export interface GISOptimizationConfig {
  // Coordinate precision (decimal places)
  coordinatePrecision: number;
  
  // Feature simplification
  simplifyGeometries: boolean;
  simplificationTolerance: number; // in degrees
  
  // Feature filtering
  maxFeatures: number;
  filterSmallGeometries: boolean;
  minGeometrySize: number; // in square degrees
  
  // Properties optimization
  includeProperties: string[] | null; // null = include all
  excludeProperties: string[];
  maxPropertyValueLength: number;
  
  // Cache settings
  enableCache: boolean;
  cacheTimeoutMs: number;
  maxCacheEntries: number;
}

/**
 * Default optimization configuration
 */
export const DEFAULT_GIS_OPTIMIZATION_CONFIG: GISOptimizationConfig = {
  coordinatePrecision: 6, // 6 decimal places (~10cm accuracy)
  simplifyGeometries: true,
  simplificationTolerance: 0.00001, // ~1m at equator
  maxFeatures: 5000,
  filterSmallGeometries: true,
  minGeometrySize: 0.000001, // Approximately 10m²
  includeProperties: null, // Include all
  excludeProperties: ['created_by', 'timestamp', 'version', 'changeset'],
  maxPropertyValueLength: 100,
  enableCache: true,
  cacheTimeoutMs: 5 * 60 * 1000, // 5 minutes
  maxCacheEntries: 20
};

/**
 * Cache entry with timeout
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Memory-efficient GIS data cache
 */
class GISDataCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;
  private defaultTimeoutMs: number;
  
  constructor(maxEntries: number = 20, defaultTimeoutMs: number = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTimeoutMs = defaultTimeoutMs;
  }
  
  /**
   * Get an entry from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Set an entry in the cache
   */
  set(key: string, data: T, timeoutMs?: number): void {
    // Enforce size limit - LRU eviction
    if (this.cache.size >= this.maxEntries) {
      let oldestKey = '';
      let oldestTime = Infinity;
      
      for (const [entryKey, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = entryKey;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    const now = Date.now();
    const timeout = timeoutMs || this.defaultTimeoutMs;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + timeout
    });
  }
  
  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * Optimize GeoJSON data for memory efficiency
 */
export class GISDataOptimizer {
  private static instance: GISDataOptimizer;
  private config: GISOptimizationConfig;
  private featureCache: GISDataCache<GeoJSONFeature>;
  private featureCollectionCache: GISDataCache<GeoJSONFeatureCollection>;
  
  /**
   * Private constructor for singleton
   */
  private constructor(config?: Partial<GISOptimizationConfig>) {
    this.config = { ...DEFAULT_GIS_OPTIMIZATION_CONFIG, ...config };
    
    // Initialize caches
    this.featureCache = new GISDataCache<GeoJSONFeature>(
      this.config.maxCacheEntries,
      this.config.cacheTimeoutMs
    );
    
    this.featureCollectionCache = new GISDataCache<GeoJSONFeatureCollection>(
      this.config.maxCacheEntries,
      this.config.cacheTimeoutMs
    );
    
    // Set up periodic cache cleaning
    setInterval(() => {
      this.cleanupCaches();
    }, 10 * 60 * 1000); // Every 10 minutes
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<GISOptimizationConfig>): GISDataOptimizer {
    if (!GISDataOptimizer.instance) {
      GISDataOptimizer.instance = new GISDataOptimizer(config);
    } else if (config) {
      // Update config
      GISDataOptimizer.instance.updateConfig(config);
    }
    return GISDataOptimizer.instance;
  }
  
  /**
   * Update configuration
   */
  public updateConfig(config: Partial<GISOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Clean up caches
   */
  private cleanupCaches(): void {
    const featureCount = this.featureCache.clearExpired();
    const collectionCount = this.featureCollectionCache.clearExpired();
    
    if (featureCount > 0 || collectionCount > 0) {
      this.logActivity('cache_cleanup', LogLevel.DEBUG, {
        featuresCleared: featureCount,
        collectionsCleared: collectionCount
      });
    }
  }
  
  /**
   * Optimize a GeoJSON Feature Collection
   */
  public optimizeFeatureCollection(
    featureCollection: GeoJSONFeatureCollection,
    cacheKey?: string
  ): GeoJSONFeatureCollection {
    try {
      // Check cache first if key provided
      if (cacheKey && this.config.enableCache) {
        const cached = this.featureCollectionCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      // Start with a copy of the input
      const optimized: GeoJSONFeatureCollection = {
        type: 'FeatureCollection',
        features: []
      };
      
      // Copy bbox if present
      if (featureCollection.bbox) {
        optimized.bbox = this.roundCoordinates(featureCollection.bbox);
      }
      
      // Get features limited by max count
      const features = featureCollection.features.slice(0, this.config.maxFeatures);
      
      // Optimize each feature
      for (const feature of features) {
        // Filter small geometries if enabled
        if (this.config.filterSmallGeometries && 
            this.isSmallGeometry(feature.geometry)) {
          continue;
        }
        
        // Optimize the feature
        const optimizedFeature = this.optimizeFeature(feature);
        
        // Add to collection
        optimized.features.push(optimizedFeature);
      }
      
      // Add to cache if key provided
      if (cacheKey && this.config.enableCache) {
        this.featureCollectionCache.set(cacheKey, optimized);
      }
      
      // Log optimization metrics
      this.logActivity('optimized_collection', LogLevel.DEBUG, {
        originalFeatures: featureCollection.features.length,
        optimizedFeatures: optimized.features.length,
        reduction: featureCollection.features.length - optimized.features.length
      });
      
      return optimized;
    } catch (error) {
      // Log error but return original to prevent data loss
      this.logActivity('optimization_error', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error)
      });
      return featureCollection;
    }
  }
  
  /**
   * Optimize a single GeoJSON Feature
   */
  public optimizeFeature(
    feature: GeoJSONFeature,
    cacheKey?: string
  ): GeoJSONFeature {
    try {
      // Check cache first if key provided
      if (cacheKey && this.config.enableCache) {
        const cached = this.featureCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }
      
      // Create a new feature object
      const optimized: GeoJSONFeature = {
        type: 'Feature',
        geometry: this.optimizeGeometry(feature.geometry),
        properties: this.optimizeProperties(feature.properties || {})
      };
      
      // Keep id if present
      if (feature.id !== undefined) {
        optimized.id = feature.id;
      }
      
      // Add to cache if key provided
      if (cacheKey && this.config.enableCache) {
        this.featureCache.set(cacheKey, optimized);
      }
      
      return optimized;
    } catch (error) {
      // Log error but return original to prevent data loss
      this.logActivity('feature_optimization_error', LogLevel.ERROR, {
        error: error instanceof Error ? error.message : String(error),
        featureId: feature.id
      });
      return feature;
    }
  }
  
  /**
   * Optimize geometry by rounding coordinates and optional simplification
   */
  private optimizeGeometry(geometry: any): any {
    // Create a deep copy
    const optimized = JSON.parse(JSON.stringify(geometry));
    
    // Process based on geometry type
    switch (optimized.type) {
      case 'Point':
        optimized.coordinates = this.roundCoordinates(optimized.coordinates);
        break;
        
      case 'LineString':
      case 'MultiPoint':
        optimized.coordinates = this.roundCoordinatesArray(optimized.coordinates);
        if (this.config.simplifyGeometries) {
          optimized.coordinates = this.simplifyLine(optimized.coordinates);
        }
        break;
        
      case 'Polygon':
      case 'MultiLineString':
        optimized.coordinates = this.roundNestedCoordinatesArray(optimized.coordinates);
        if (this.config.simplifyGeometries) {
          optimized.coordinates = optimized.coordinates.map((ring: number[][]) => 
            this.simplifyLine(ring)
          );
        }
        break;
        
      case 'MultiPolygon':
        optimized.coordinates = this.roundMultiNestedCoordinatesArray(optimized.coordinates);
        if (this.config.simplifyGeometries) {
          optimized.coordinates = optimized.coordinates.map((polygon: number[][][]) => 
            polygon.map((ring: number[][]) => this.simplifyLine(ring))
          );
        }
        break;
        
      case 'GeometryCollection':
        if (optimized.geometries) {
          optimized.geometries = optimized.geometries.map((geom: any) => 
            this.optimizeGeometry(geom)
          );
        }
        break;
    }
    
    return optimized;
  }
  
  /**
   * Optimize feature properties by filtering and truncating
   */
  private optimizeProperties(properties: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Process each property
    for (const [key, value] of Object.entries(properties)) {
      // Skip excluded properties
      if (this.config.excludeProperties.includes(key)) {
        continue;
      }
      
      // Skip if not in include list (if specified)
      if (this.config.includeProperties !== null && 
          !this.config.includeProperties.includes(key)) {
        continue;
      }
      
      // Truncate string values if needed
      if (typeof value === 'string' && 
          value.length > this.config.maxPropertyValueLength) {
        result[key] = value.substring(0, this.config.maxPropertyValueLength);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Round coordinates to specified precision
   */
  private roundCoordinates(coords: number[]): number[] {
    return coords.map(coord => 
      this.roundToDecimalPlaces(coord, this.config.coordinatePrecision)
    );
  }
  
  /**
   * Round an array of coordinates
   */
  private roundCoordinatesArray(coords: number[][]): number[][] {
    return coords.map(coord => this.roundCoordinates(coord));
  }
  
  /**
   * Round nested arrays of coordinates (polygons)
   */
  private roundNestedCoordinatesArray(coords: number[][][]): number[][][] {
    return coords.map(coordArray => this.roundCoordinatesArray(coordArray));
  }
  
  /**
   * Round multi-nested arrays of coordinates (multi-polygons)
   */
  private roundMultiNestedCoordinatesArray(coords: number[][][][]): number[][][][] {
    return coords.map(nestedArray => this.roundNestedCoordinatesArray(nestedArray));
  }
  
  /**
   * Simplify a line by removing points
   * 
   * This uses a simple implementation of the Douglas-Peucker algorithm
   */
  private simplifyLine(points: number[][]): number[][] {
    // Skip if too few points
    if (points.length <= 2) {
      return points;
    }
    
    // Implementation of Douglas-Peucker algorithm
    const tolerance = this.config.simplificationTolerance;
    
    // Recursive function to simplify between points
    const simplifyRecursive = (start: number, end: number): number[] => {
      if (end - start <= 1) {
        return [];
      }
      
      let maxDistance = 0;
      let maxIndex = start;
      
      for (let i = start + 1; i < end; i++) {
        const distance = this.pointLineDistance(
          points[i],
          points[start],
          points[end]
        );
        
        if (distance > maxDistance) {
          maxDistance = distance;
          maxIndex = i;
        }
      }
      
      if (maxDistance > tolerance) {
        const result1 = simplifyRecursive(start, maxIndex);
        const result2 = simplifyRecursive(maxIndex, end);
        return [...result1, maxIndex, ...result2];
      }
      
      return [];
    };
    
    // Get indices to keep
    const indicesToKeep = [0, ...simplifyRecursive(0, points.length - 1), points.length - 1];
    indicesToKeep.sort((a, b) => a - b);
    
    // Build simplified line
    const simplified = indicesToKeep.map(i => points[i]);
    
    return simplified;
  }
  
  /**
   * Calculate distance from point to line
   */
  private pointLineDistance(
    point: number[],
    lineStart: number[],
    lineEnd: number[]
  ): number {
    // Simple distance calculation
    const x = point[0];
    const y = point[1];
    const x1 = lineStart[0];
    const y1 = lineStart[1];
    const x2 = lineEnd[0];
    const y2 = lineEnd[1];
    
    // Calculate the perpendicular distance
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    // Avoid division by zero
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }
    
    let param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Check if a geometry is considered "small"
   */
  private isSmallGeometry(geometry: any): boolean {
    if (!geometry || !geometry.type) {
      return true; // Invalid geometry
    }
    
    switch (geometry.type) {
      case 'Point':
      case 'MultiPoint':
        // Points are always included
        return false;
        
      case 'LineString':
        // Check if linestring is too short
        return this.calculateLineLength(geometry.coordinates) < this.config.minGeometrySize;
        
      case 'Polygon':
        // Check if polygon area is too small
        return this.calculatePolygonArea(geometry.coordinates) < this.config.minGeometrySize;
        
      case 'MultiLineString':
        // Check if any linestring is long enough
        return !geometry.coordinates.some((line: number[][]) => 
          this.calculateLineLength(line) >= this.config.minGeometrySize
        );
        
      case 'MultiPolygon':
        // Check if any polygon is large enough
        return !geometry.coordinates.some((polygon: number[][][]) => 
          this.calculatePolygonArea(polygon) >= this.config.minGeometrySize
        );
        
      default:
        return false;
    }
  }
  
  /**
   * Calculate approximate line length
   */
  private calculateLineLength(coordinates: number[][]): number {
    let length = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const dx = coordinates[i][0] - coordinates[i-1][0];
      const dy = coordinates[i][1] - coordinates[i-1][1];
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }
  
  /**
   * Calculate approximate polygon area
   */
  private calculatePolygonArea(coordinates: number[][][]): number {
    // Simple implementation - just use the outer ring
    if (!coordinates || coordinates.length === 0) {
      return 0;
    }
    
    const outerRing = coordinates[0];
    if (!outerRing || outerRing.length < 3) {
      return 0;
    }
    
    // Calculate area using shoelace formula
    let area = 0;
    for (let i = 0; i < outerRing.length - 1; i++) {
      area += 
        outerRing[i][0] * outerRing[i+1][1] - 
        outerRing[i+1][0] * outerRing[i][1];
    }
    
    // Add the last segment
    area += 
      outerRing[outerRing.length-1][0] * outerRing[0][1] - 
      outerRing[0][0] * outerRing[outerRing.length-1][1];
    
    // Finalize area calculation
    return Math.abs(area / 2);
  }
  
  /**
   * Helper function to round to specified decimal places
   */
  private roundToDecimalPlaces(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  /**
   * Log optimizer activity
   */
  private async logActivity(
    action: string,
    level: LogLevel = LogLevel.DEBUG,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      // Skip debug logs unless in debug mode
      if (level === LogLevel.DEBUG && process.env.DEBUG_GIS !== 'true') {
        return;
      }
      
      await storage.createLog({
        level,
        category: LogCategory.PERFORMANCE,
        message: `[GISOptimizer] ${action}`,
        details: JSON.stringify(details),
        source: 'gis-optimizer',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['gis', 'optimization', 'memory']
      });
    } catch (error) {
      // Silent fail for logging errors
      console.error('Failed to log GIS optimizer activity:', error);
    }
  }
}

/**
 * Singleton instance
 */
export const gisDataOptimizer = GISDataOptimizer.getInstance();

/**
 * Initialize the GIS data optimizer
 */
export function initializeGISOptimizer(
  config?: Partial<GISOptimizationConfig>
): void {
  // Initialize with config
  GISDataOptimizer.getInstance(config);
}