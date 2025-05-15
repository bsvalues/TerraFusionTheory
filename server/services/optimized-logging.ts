/**
 * Optimized Logging Service
 * 
 * This file implements memory-efficient logging for the IntelligentEstate platform.
 * It provides a more efficient logging mechanism that reduces memory overhead
 * through batching, truncation, and intelligent filtering.
 */

import { LogLevel, LogCategory, InsertLog } from '../../shared/schema';
import { storage } from '../storage';

/**
 * Optimized logging configuration
 */
export interface OptimizedLoggingConfig {
  // Batching settings
  batchSize: number;          // Number of logs to batch before writing
  batchTimeoutMs: number;     // Max time to hold logs in memory before writing
  
  // Memory optimization
  maxMessageLength: number;   // Max length for message field
  maxDetailsLength: number;   // Max length for details field
  minLogLevel: LogLevel;      // Minimum level to store
  
  // Category filtering
  enabledCategories: LogCategory[] | null; // Categories to enable (null = all)
  
  // Performance
  asyncLogging: boolean;      // Whether to log asynchronously
  
  // Debug mode
  debugMode: boolean;         // Whether to log debug information
}

/**
 * Default logging configuration
 */
export const DEFAULT_LOGGING_CONFIG: OptimizedLoggingConfig = {
  batchSize: 20,
  batchTimeoutMs: 5000,        // 5 seconds
  maxMessageLength: 500,
  maxDetailsLength: 2000,
  minLogLevel: LogLevel.INFO,  // Skip DEBUG logs unless debug mode
  enabledCategories: null,     // Log all categories
  asyncLogging: true,
  debugMode: false
};

/**
 * Optimized log entry
 */
interface OptimizedLogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  source?: string;
  projectId?: number | null;
  userId?: number | null;
  sessionId?: string | null;
  duration?: number | null;
  statusCode?: number | null;
  endpoint?: string | null;
  tags?: string[];
  timestamp: Date;
}

/**
 * Optimized logging service that reduces memory usage
 */
export class OptimizedLogger {
  private static instance: OptimizedLogger;
  private config: OptimizedLoggingConfig;
  private logBatch: OptimizedLogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private totalDiscarded = 0;
  private totalLogged = 0;
  private initialized = false;
  
  /**
   * Private constructor for singleton
   */
  private constructor(config?: Partial<OptimizedLoggingConfig>) {
    this.config = { ...DEFAULT_LOGGING_CONFIG, ...config };
    this.initialized = true;
    
    // Register cleanup on process exit
    process.on('beforeExit', () => {
      this.flush();
    });
    
    // Start batch timer
    this.resetBatchTimer();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<OptimizedLoggingConfig>): OptimizedLogger {
    if (!OptimizedLogger.instance) {
      OptimizedLogger.instance = new OptimizedLogger(config);
    } else if (config) {
      // Update config if provided
      OptimizedLogger.instance.updateConfig(config);
    }
    return OptimizedLogger.instance;
  }
  
  /**
   * Update logger configuration
   */
  public updateConfig(config: Partial<OptimizedLoggingConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reset timer with new timeout
    this.resetBatchTimer();
  }
  
  /**
   * Reset the batch timer
   */
  private resetBatchTimer(): void {
    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Set new timer to flush logs on timeout
    this.batchTimer = setTimeout(() => {
      if (this.logBatch.length > 0) {
        this.flush();
      }
      this.resetBatchTimer(); // Set up next timer
    }, this.config.batchTimeoutMs);
    
    // Unref to prevent keeping the process alive just for logging
    if (this.batchTimer.unref) {
      this.batchTimer.unref();
    }
  }
  
  /**
   * Truncate a string to a maximum length
   */
  private truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
      return str;
    }
    
    return str.substring(0, maxLength) + '... [truncated]';
  }
  
  /**
   * Get numerical value for a log level for comparison
   */
  private getLevelValue(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG: return 0;
      case LogLevel.INFO: return 1;
      case LogLevel.WARNING: return 2;
      case LogLevel.ERROR: return 3;
      case LogLevel.CRITICAL: return 4;
      default: return -1;
    }
  }
  
  /**
   * Write logs to storage
   */
  private async writeLogsToStorage(logs: OptimizedLogEntry[]): Promise<void> {
    try {
      // Convert to storage format
      const storableLogs: InsertLog[] = logs.map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        category: log.category,
        message: log.message,
        details: typeof log.details === 'string' ? { text: log.details } : log.details,
        source: log.source,
        userId: log.userId,
        projectId: log.projectId,
        sessionId: log.sessionId,
        duration: log.duration,
        statusCode: log.statusCode,
        endpoint: log.endpoint,
        tags: log.tags
      }));
      
      // Insert all logs
      await storage.createLogs(storableLogs);
    } catch (error) {
      console.error('Error writing logs to storage:', error);
    }
  }
  
  /**
   * Log a message with optimized memory usage
   */
  public log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: any,
    source?: string,
    context?: {
      projectId?: number | null;
      userId?: number | null;
      sessionId?: string | null;
      duration?: number | null;
      statusCode?: number | null;
      endpoint?: string | null;
      tags?: string[];
    }
  ): void {
    // Skip logging if not initialized
    if (!this.initialized) {
      console.warn('OptimizedLogger: Attempted to log before initialization');
      return;
    }
    
    // Skip DEBUG logs if debug mode is off
    if (level === LogLevel.DEBUG && !this.config.debugMode) {
      this.totalDiscarded++;
      return;
    }
    
    // Skip if level is below minimum
    if (this.getLevelValue(level) < this.getLevelValue(this.config.minLogLevel)) {
      this.totalDiscarded++;
      return;
    }
    
    // Skip if category is filtered
    if (this.config.enabledCategories && 
        !this.config.enabledCategories.includes(category)) {
      this.totalDiscarded++;
      return;
    }
    
    // Optimize message length
    const optimizedMessage = this.truncateString(
      message,
      this.config.maxMessageLength
    );
    
    // Optimize details
    let optimizedDetails: string | undefined;
    if (details !== undefined) {
      let detailsString = '';
      
      // Convert details to string if it's not already
      if (typeof details === 'string') {
        detailsString = details;
      } else {
        try {
          detailsString = JSON.stringify(details);
        } catch (error) {
          detailsString = String(details);
        }
      }
      
      // Truncate details
      optimizedDetails = this.truncateString(
        detailsString,
        this.config.maxDetailsLength
      );
    }
    
    // Create optimized log entry
    const logEntry: OptimizedLogEntry = {
      level,
      category,
      message: optimizedMessage,
      details: optimizedDetails,
      source,
      projectId: context?.projectId ?? null,
      userId: context?.userId ?? null,
      sessionId: context?.sessionId ?? null,
      duration: context?.duration ?? null,
      statusCode: context?.statusCode ?? null,
      endpoint: context?.endpoint ?? null,
      tags: context?.tags?.length ? context.tags.slice(0, 10) : undefined, // Limit to 10 tags
      timestamp: new Date()
    };
    
    // Add to batch
    this.logBatch.push(logEntry);
    this.totalLogged++;
    
    // Flush if batch size reached
    if (this.logBatch.length >= this.config.batchSize) {
      this.flush();
    }
  }
  
  /**
   * Convenience method for debug logs
   */
  public debug(
    message: string,
    category: LogCategory = LogCategory.SYSTEM,
    details?: any,
    context?: any
  ): void {
    this.log(LogLevel.DEBUG, category, message, details, 'optimized-logger', context);
  }
  
  /**
   * Convenience method for info logs
   */
  public info(
    message: string,
    category: LogCategory = LogCategory.SYSTEM,
    details?: any,
    context?: any
  ): void {
    this.log(LogLevel.INFO, category, message, details, 'optimized-logger', context);
  }
  
  /**
   * Convenience method for warning logs
   */
  public warning(
    message: string,
    category: LogCategory = LogCategory.SYSTEM,
    details?: any,
    context?: any
  ): void {
    this.log(LogLevel.WARNING, category, message, details, 'optimized-logger', context);
  }
  
  /**
   * Convenience method for error logs
   */
  public error(
    message: string,
    category: LogCategory = LogCategory.SYSTEM,
    details?: any,
    context?: any
  ): void {
    this.log(LogLevel.ERROR, category, message, details, 'optimized-logger', context);
  }
  
  /**
   * Convenience method for critical logs
   */
  public critical(
    message: string,
    category: LogCategory = LogCategory.SYSTEM,
    details?: any,
    context?: any
  ): void {
    this.log(LogLevel.CRITICAL, category, message, details, 'optimized-logger', context);
  }
  
  /**
   * Flush all pending logs to storage
   */
  public flush(): void {
    // Skip if no logs
    if (this.logBatch.length === 0) {
      return;
    }
    
    // Take a copy of the batch and clear it
    const batchToFlush = [...this.logBatch];
    this.logBatch = [];
    
    // Reset the timer
    this.resetBatchTimer();
    
    // Write logs to storage
    if (this.config.asyncLogging) {
      // Async - fire and forget
      this.writeLogsToStorage(batchToFlush).catch(error => {
        console.error('OptimizedLogger: Error writing logs:', error);
      });
    } else {
      // Sync - wait for completion
      this.writeLogsToStorage(batchToFlush)
        .catch(error => {
          console.error('OptimizedLogger: Error writing logs:', error);
        });
    }
  }
  
  /**
   * Get logging statistics
   */
  public getStats(): {
    batchSize: number;
    queuedLogs: number;
    totalLogged: number;
    totalDiscarded: number;
    config: OptimizedLoggingConfig;
  } {
    return {
      batchSize: this.config.batchSize,
      queuedLogs: this.logBatch.length,
      totalLogged: this.totalLogged,
      totalDiscarded: this.totalDiscarded,
      config: { ...this.config }
    };
  }
}

/**
 * Singleton instance
 */
export const optimizedLogger = OptimizedLogger.getInstance();

/**
 * Initialize the optimized logger
 */
export function initializeOptimizedLogger(
  config?: Partial<OptimizedLoggingConfig>
): void {
  // Get or create the logger instance with config
  OptimizedLogger.getInstance(config);
  
  // Log initialization
  optimizedLogger.info(
    'Optimized logging system initialized',
    LogCategory.SYSTEM,
    config ? { configOverrides: Object.keys(config) } : undefined
  );
}

/**
 * Create a logger for a specific component
 */
export function createComponentLogger(
  component: string,
  defaultCategory: LogCategory = LogCategory.SYSTEM
): {
  debug: (message: string, details?: any, context?: any) => void;
  info: (message: string, details?: any, context?: any) => void;
  warning: (message: string, details?: any, context?: any) => void;
  error: (message: string, details?: any, context?: any) => void;
  critical: (message: string, details?: any, context?: any) => void;
} {
  return {
    debug: (message: string, details?: any, context?: any) => {
      optimizedLogger.log(LogLevel.DEBUG, defaultCategory, message, details, component, context);
    },
    info: (message: string, details?: any, context?: any) => {
      optimizedLogger.log(LogLevel.INFO, defaultCategory, message, details, component, context);
    },
    warning: (message: string, details?: any, context?: any) => {
      optimizedLogger.log(LogLevel.WARNING, defaultCategory, message, details, component, context);
    },
    error: (message: string, details?: any, context?: any) => {
      optimizedLogger.log(LogLevel.ERROR, defaultCategory, message, details, component, context);
    },
    critical: (message: string, details?: any, context?: any) => {
      optimizedLogger.log(LogLevel.CRITICAL, defaultCategory, message, details, component, context);
    }
  };
}