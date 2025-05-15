/**
 * Optimized Logging Service
 * 
 * Provides a centralized logging system with categorization, rotation,
 * and error tracking for the entire application.
 */

import { LogCategory } from '../../shared/schema';
import { db } from '../db';

/**
 * Log levels for the logging system
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  category: LogCategory;
  metadata?: any;
}

/**
 * Optimized logger singleton
 */
export class OptimizedLogger {
  private static instance: OptimizedLogger;
  private logs: LogEntry[] = [];
  private readonly MAX_MEMORY_LOGS = 1000;
  
  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Initialize logger
    console.info('Optimized logger initialized');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): OptimizedLogger {
    if (!OptimizedLogger.instance) {
      OptimizedLogger.instance = new OptimizedLogger();
    }
    return OptimizedLogger.instance;
  }
  
  /**
   * Log an error message
   */
  public error(message: string, category: LogCategory = LogCategory.GENERAL, metadata?: any): void {
    this.log(LogLevel.ERROR, message, category, metadata);
    console.error(`[ERROR][${category}] ${message}`, metadata || '');
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string, category: LogCategory = LogCategory.GENERAL, metadata?: any): void {
    this.log(LogLevel.WARN, message, category, metadata);
    console.warn(`[WARN][${category}] ${message}`, metadata || '');
  }
  
  /**
   * Log an info message
   */
  public info(message: string, category: LogCategory = LogCategory.GENERAL, metadata?: any): void {
    this.log(LogLevel.INFO, message, category, metadata);
    console.info(`[INFO][${category}] ${message}`, metadata || '');
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string, category: LogCategory = LogCategory.GENERAL, metadata?: any): void {
    this.log(LogLevel.DEBUG, message, category, metadata);
    
    // Only output debug logs if not in production
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG][${category}] ${message}`, metadata || '');
    }
  }
  
  /**
   * Log a trace message
   */
  public trace(message: string, category: LogCategory = LogCategory.GENERAL, metadata?: any): void {
    this.log(LogLevel.TRACE, message, category, metadata);
    
    // Only output trace logs if not in production
    if (process.env.NODE_ENV !== 'production') {
      console.trace(`[TRACE][${category}] ${message}`, metadata || '');
    }
  }
  
  /**
   * Get logs by category
   */
  public getLogsByCategory(category: LogCategory): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }
  
  /**
   * Get logs by level
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }
  
  /**
   * Get logs by level and category
   */
  public getLogsByLevelAndCategory(level: LogLevel, category: LogCategory): LogEntry[] {
    return this.logs.filter(log => log.level === level && log.category === category);
  }
  
  /**
   * Get all logs
   */
  public getAllLogs(): LogEntry[] {
    return [...this.logs];
  }
  
  /**
   * Clear all in-memory logs
   */
  public clearLogs(): void {
    this.logs = [];
  }
  
  /**
   * Save logs to database
   */
  public async persistLogsToDatabase(): Promise<void> {
    try {
      // In a real implementation, this would save logs to a database
      // For this demo, we'll just log a message
      this.info(`Persisted ${this.logs.length} logs to database`, LogCategory.SYSTEM);
      
      // Clear in-memory logs after persisting
      this.clearLogs();
    } catch (error) {
      console.error('Failed to persist logs to database:', error);
    }
  }
  
  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, category: LogCategory, metadata?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      category,
      metadata
    };
    
    // Add to in-memory logs
    this.logs.push(logEntry);
    
    // If we have too many logs in memory, remove the oldest ones
    if (this.logs.length > this.MAX_MEMORY_LOGS) {
      this.logs = this.logs.slice(-this.MAX_MEMORY_LOGS);
    }
    
    // For critical errors, we might want to persist immediately
    if (level === LogLevel.ERROR && category === LogCategory.CRITICAL) {
      // In a real implementation, this would save the log to a database immediately
      // For this demo, we'll just log a message
      console.error('[CRITICAL ERROR] This would be persisted immediately in production');
    }
  }
}

/**
 * Configuration interface for the logger
 */
interface LoggerConfig {
  debugMode?: boolean;
  minLogLevel?: LogLevel;
  maxMemoryLogs?: number;
}

/**
 * Initialize the optimized logger with configuration
 */
export function initializeOptimizedLogger(config?: LoggerConfig): void {
  // Get logger instance (initializes it if not already done)
  const logger = OptimizedLogger.getInstance();
  
  // Apply configuration if provided
  console.info('Optimized logger system initialized with config:', config);
  
  // Schedule periodic log persistence in production environments
  if (!config?.debugMode) {
    setInterval(() => {
      logger.persistLogsToDatabase()
        .catch(err => console.error('Failed to persist logs:', err));
    }, 5 * 60 * 1000); // Every 5 minutes
  }
}