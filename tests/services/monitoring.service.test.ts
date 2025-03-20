import * as monitoringService from '../../server/services/monitoring.service';
import { storage } from '../../server/storage';
import { LogLevel, LogCategory, LogEntry } from '../../shared/schema';

// Mock dependencies
jest.mock('../../server/storage', () => ({
  storage: {
    createLog: jest.fn(),
    getLogs: jest.fn(),
    getLogStats: jest.fn()
  }
}));

// Mock for the alertManager
const mockSendAlert = jest.fn().mockResolvedValue(undefined);

// Use beforeEach to set up our mocks fresh for each test
beforeEach(() => {
  // Directly modify the monitoringService instance to replace its alertManager
  (monitoringService as any).alertManager = {
    sendAlert: mockSendAlert,
    channels: [],
    addChannel: jest.fn()
  };
});

// Also mock console methods to prevent actual logging during tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('Monitoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('monitorOpenAIUsage', () => {
    it('should trigger alerts when OpenAI usage exceeds thresholds', async () => {
      // Mock high usage logs
      (storage.getLogs as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          level: LogLevel.INFO,
          category: LogCategory.AI,
          message: 'OpenAI API request',
          details: JSON.stringify({ 
            model: 'gpt-4', 
            response: { 
              usage: { 
                total_tokens: 1200 
              }
            },
            cost: 0.06
          }),
          timestamp: new Date(),
          sessionId: null,
          userId: null,
          projectId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          source: 'openai-service',
          tags: ['ai', 'openai']
        },
        {
          id: 2,
          level: LogLevel.INFO,
          category: LogCategory.AI,
          message: 'OpenAI API request',
          details: JSON.stringify({ 
            model: 'gpt-4', 
            response: { 
              usage: { 
                total_tokens: 1500 
              }
            },
            cost: 0.075
          }),
          timestamp: new Date(),
          sessionId: null,
          userId: null,
          projectId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          source: 'openai-service',
          tags: ['ai', 'openai']
        }
      ]);
      
      await monitoringService.monitorOpenAIUsage();
      
      expect(storage.getLogs).toHaveBeenCalledWith(expect.objectContaining({
        category: LogCategory.AI
      }));
      
      // Check if the mock was called with the right arguments
      expect(mockAlertManager.sendAlert).toHaveBeenCalled();
      
      // Get the actual call arguments
      const callArgs = mockAlertManager.sendAlert.mock.calls[0];
      
      // Verify first argument (message)
      expect(callArgs[0]).toContain("OpenAI API");
      
      // Verify second argument (level)
      expect(["warning", "critical"]).toContain(callArgs[1]);
      
      // Verify third argument (context) has the required properties
      expect(callArgs[2]).toHaveProperty("totalTokens");
      expect(callArgs[2]).toHaveProperty("threshold");
    });
    
    it('should not trigger alerts when usage is within thresholds', async () => {
      // Mock low usage logs
      (storage.getLogs as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          level: LogLevel.INFO,
          category: LogCategory.AI,
          message: 'OpenAI API request',
          details: JSON.stringify({ 
            model: 'gpt-3.5-turbo', 
            response: { 
              usage: { 
                total_tokens: 300 
              }
            },
            cost: 0.0006
          }),
          timestamp: new Date(),
          sessionId: null,
          userId: null,
          projectId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          source: 'openai-service',
          tags: ['ai', 'openai']
        }
      ]);
      
      // Reset mock alert manager
      mockAlertManager.sendAlert.mockClear();
      
      await monitoringService.monitorOpenAIUsage();
      
      expect(mockAlertManager.sendAlert).not.toHaveBeenCalled();
    });
  });
  
  describe('monitorApiResponseTimes', () => {
    it('should trigger alerts when API response times are slow', async () => {
      // Mock slow response logs
      (storage.getLogs as jest.Mock).mockResolvedValueOnce([
        {
          id: 3,
          level: LogLevel.INFO,
          category: LogCategory.API,
          message: 'API request completed',
          endpoint: '/api/properties',
          duration: 2500, // 2.5 seconds
          timestamp: new Date(),
          sessionId: null,
          userId: null,
          projectId: null,
          statusCode: 200,
          source: 'express',
          details: null,
          tags: ['api', 'request']
        },
        {
          id: 4,
          level: LogLevel.INFO,
          category: LogCategory.API,
          message: 'API request completed',
          endpoint: '/api/market-analysis',
          duration: 3200, // 3.2 seconds
          timestamp: new Date(),
          sessionId: null,
          userId: null,
          projectId: null,
          statusCode: 200,
          source: 'express',
          details: null,
          tags: ['api', 'request']
        }
      ]);
      
      await monitoringService.monitorApiResponseTimes();
      
      expect(storage.getLogs).toHaveBeenCalledWith(expect.objectContaining({
        category: LogCategory.API
      }));
      
      // Check if the mock was called with the right arguments
      expect(mockAlertManager.sendAlert).toHaveBeenCalled();
      
      // Get the actual call arguments
      const callArgs = mockAlertManager.sendAlert.mock.calls[0];
      
      // Verify first argument (message)
      expect(callArgs[0]).toContain("API response time");
      
      // Verify second argument (level)
      expect(["warning", "critical"]).toContain(callArgs[1]);
      
      // Verify third argument (context) has the required properties
      expect(callArgs[2]).toHaveProperty("avgResponseTime");
      expect(callArgs[2]).toHaveProperty("slowEndpoints");
      expect(callArgs[2]).toHaveProperty("threshold");
    });
    
    it('should not trigger alerts when API response times are acceptable', async () => {
      // Mock fast response logs
      (storage.getLogs as jest.Mock).mockResolvedValueOnce([
        {
          id: 3,
          level: LogLevel.INFO,
          category: LogCategory.API,
          message: 'API request completed',
          endpoint: '/api/properties',
          duration: 150, // 150ms
          timestamp: new Date(),
          sessionId: null,
          userId: null,
          projectId: null,
          statusCode: 200,
          source: 'express',
          details: null,
          tags: ['api', 'request']
        },
        {
          id: 4,
          level: LogLevel.INFO,
          category: LogCategory.API,
          message: 'API request completed',
          endpoint: '/api/market-analysis',
          duration: 320, // 320ms
          timestamp: new Date(),
          sessionId: null,
          userId: null,
          projectId: null,
          statusCode: 200,
          source: 'express',
          details: null,
          tags: ['api', 'request']
        }
      ]);
      
      // Reset mock alert manager
      mockAlertManager.sendAlert.mockClear();
      
      await monitoringService.monitorApiResponseTimes();
      
      expect(mockAlertManager.sendAlert).not.toHaveBeenCalled();
    });
  });
  
  describe('monitorErrorRates', () => {
    it('should trigger alerts when error rates are high', async () => {
      // Mock getLogs to return many error logs (simulate high error rate)
      const errorLogs: LogEntry[] = [];
      for (let i = 0; i < 100; i++) {
        errorLogs.push({
          id: i,
          level: LogLevel.ERROR,
          category: LogCategory.DATABASE,
          message: 'Database connection error',
          timestamp: new Date(),
          details: '{"errorType":"ConnectionError"}',
          source: 'test',
          tags: ['test', 'error'],
          sessionId: null,
          userId: null,
          projectId: null,
          duration: null,
          statusCode: null,
          endpoint: null
        });
      }
      
      (storage.getLogs as jest.Mock).mockResolvedValueOnce(errorLogs);
      
      await monitoringService.monitorErrorRates();
      
      expect(storage.getLogs).toHaveBeenCalledWith({
        level: [LogLevel.ERROR, LogLevel.CRITICAL],
        startDate: expect.any(Date)
      });
      // Check if the mock was called with the right arguments
      expect(mockAlertManager.sendAlert).toHaveBeenCalled();
      
      // Get the actual call arguments
      const callArgs = mockAlertManager.sendAlert.mock.calls[0];
      
      // Verify first argument (message)
      expect(callArgs[0]).toContain("Error rate is high");
      
      // Verify second argument (level)
      expect(callArgs[1]).toBe("warning");
      
      // Verify third argument (context) has the required properties
      expect(callArgs[2]).toHaveProperty("errorsPerMinute");
      expect(callArgs[2]).toHaveProperty("errorsByType");
      expect(callArgs[2]).toHaveProperty("threshold");
    });
    
    it('should not trigger alerts when error rates are acceptable', async () => {
      // Mock getLogs to return few error logs (simulate low error rate)
      const errorLogs: LogEntry[] = [];
      for (let i = 0; i < 3; i++) {
        errorLogs.push({
          id: i,
          level: LogLevel.ERROR,
          category: LogCategory.DATABASE,
          message: 'Minor database error',
          timestamp: new Date(),
          details: '{"errorType":"MinorError"}',
          source: 'test',
          tags: ['test', 'error'],
          sessionId: null,
          userId: null,
          projectId: null,
          duration: null,
          statusCode: null,
          endpoint: null
        });
      }
      
      (storage.getLogs as jest.Mock).mockResolvedValueOnce(errorLogs);
      
      // Reset mock alert manager
      mockAlertManager.sendAlert.mockClear();
      
      await monitoringService.monitorErrorRates();
      
      expect(mockAlertManager.sendAlert).not.toHaveBeenCalled();
    });
  });
  
  describe('runMonitoring', () => {
    it('should run all monitoring checks', async () => {
      // Mock individual monitoring functions
      const openAISpy = jest.spyOn(monitoringService, 'monitorOpenAIUsage').mockResolvedValueOnce();
      const apiSpy = jest.spyOn(monitoringService, 'monitorApiResponseTimes').mockResolvedValueOnce();
      const errorSpy = jest.spyOn(monitoringService, 'monitorErrorRates').mockResolvedValueOnce();
      
      await monitoringService.runMonitoring();
      
      expect(openAISpy).toHaveBeenCalled();
      expect(apiSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
    });
    
    it('should continue even if one check fails', async () => {
      // Mock individual monitoring functions with one failing
      const openAISpy = jest.spyOn(monitoringService, 'monitorOpenAIUsage').mockRejectedValueOnce(new Error('Test error'));
      const apiSpy = jest.spyOn(monitoringService, 'monitorApiResponseTimes').mockResolvedValueOnce();
      const errorSpy = jest.spyOn(monitoringService, 'monitorErrorRates').mockResolvedValueOnce();
      
      // Should not throw
      await expect(monitoringService.runMonitoring()).resolves.not.toThrow();
      
      expect(openAISpy).toHaveBeenCalled();
      expect(apiSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      
      // Log should be created for the error
      expect(storage.createLog).toHaveBeenCalledWith(expect.objectContaining({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: expect.stringContaining('Monitoring check failed')
      }));
    });
  });
});