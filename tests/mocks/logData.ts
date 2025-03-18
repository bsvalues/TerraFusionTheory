import { LogLevel, LogCategory, LogEntry } from '@shared/schema';

// Mock log entries for testing
export const mockLogs: LogEntry[] = [
  {
    id: 1,
    timestamp: new Date('2025-03-18T10:30:00').toISOString(),
    level: LogLevel.INFO,
    category: LogCategory.SYSTEM,
    message: 'Application started successfully',
    source: 'system/startup',
    color: '#0d6efd',
  },
  {
    id: 2,
    timestamp: new Date('2025-03-18T10:35:20').toISOString(),
    level: LogLevel.WARNING,
    category: LogCategory.API,
    message: 'API rate limit approaching threshold',
    source: 'api/rate-limiter',
    details: 'Current usage: 89%, Threshold: 90%',
    color: '#ffc107',
  },
  {
    id: 3,
    timestamp: new Date('2025-03-18T10:40:15').toISOString(),
    level: LogLevel.ERROR,
    category: LogCategory.DATABASE,
    message: 'Database connection failed',
    source: 'database/connector',
    details: 'Connection timeout after 30s. Retrying in 5s.',
    color: '#dc3545',
  },
  {
    id: 4,
    timestamp: new Date('2025-03-18T10:42:30').toISOString(),
    level: LogLevel.DEBUG,
    category: LogCategory.AI,
    message: 'Model prediction completed',
    source: 'ai/predictor',
    duration: 230,
    details: '{"input": "sample input", "output": "sample output", "confidence": 0.87}',
    color: '#6c757d',
  },
  {
    id: 5,
    timestamp: new Date('2025-03-18T10:45:00').toISOString(),
    level: LogLevel.CRITICAL,
    category: LogCategory.SECURITY,
    message: 'Potential security breach detected',
    source: 'security/monitor',
    details: 'Multiple failed login attempts from IP: 192.168.1.100',
    color: '#dc3545',
  }
];

// Mock log stats for testing
export const mockLogStats = {
  totalCount: 120,
  countByLevel: {
    [LogLevel.DEBUG]: 35,
    [LogLevel.INFO]: 60,
    [LogLevel.WARNING]: 15,
    [LogLevel.ERROR]: 8,
    [LogLevel.CRITICAL]: 2
  },
  countByCategory: {
    [LogCategory.SYSTEM]: 25,
    [LogCategory.USER]: 30,
    [LogCategory.API]: 20,
    [LogCategory.DATABASE]: 15,
    [LogCategory.SECURITY]: 10,
    [LogCategory.PERFORMANCE]: 10,
    [LogCategory.AI]: 10
  },
  recentErrors: [mockLogs[2], mockLogs[4]],
  performanceAverage: 156.8
};