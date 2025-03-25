/**
 * Logger utility for server-side logging
 * 
 * This module provides a centralized logging interface that connects to our
 * storage system for persisting logs and maintaining a consistent logging format.
 */

import { storage } from '../storage';
import { LogLevel, LogCategory, InsertLog } from '../../shared/schema';

/**
 * Logger interface for application-wide logging
 */
class Logger {
  /**
   * Log a new message to the storage system
   * @param level Log level severity
   * @param category Log category
   * @param message Log message
   * @param details Optional additional details (object will be stringified)
   * @param source Optional source of the log message
   * @param metadata Optional metadata
   */
  async log(
    level: LogLevel, 
    category: LogCategory, 
    message: string, 
    details?: any, 
    source?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Create log entry
      const logEntry: InsertLog = {
        level,
        category,
        message,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : undefined,
        source: source || 'server',
        timestamp: new Date(),
        metadata: metadata,
      };
      
      // Store log entry
      await storage.createLog(logEntry);
      
      // Also log to console for development visibility
      this.consoleLog(level, category, message, details);
    } catch (error) {
      // If logging fails, at least log to console
      console.error('Failed to store log:', error);
      this.consoleLog(level, category, message, details);
    }
  }
  
  /**
   * Log directly to console
   * @param level Log level severity
   * @param category Log category
   * @param message Log message
   * @param details Optional additional details
   */
  consoleLog(level: LogLevel, category: LogCategory, message: string, details?: any): void {
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]:`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logPrefix, message, details ? details : '');
        break;
      case LogLevel.INFO:
        console.info(logPrefix, message, details ? details : '');
        break;
      case LogLevel.WARNING:
        console.warn(logPrefix, message, details ? details : '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logPrefix, message, details ? details : '');
        break;
      default:
        console.log(logPrefix, message, details ? details : '');
    }
  }
}

// Export a singleton instance
const logger = new Logger();
export default logger;