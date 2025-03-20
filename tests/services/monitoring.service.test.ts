import * as monitoringService from '../../server/services/monitoring.service';
import { storage } from '../../server/storage';
import { LogLevel, LogCategory, LogEntry } from '../../shared/schema';

// Mock dependencies
jest.mock('../../server/storage', () => ({
  storage: {
    createLog: jest.fn().mockResolvedValue(undefined),
    getLogs: jest.fn().mockResolvedValue([]),
    getLogStats: jest.fn()
  }
}));

// Mock console methods to prevent actual logging during tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleInfo = console.info;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  console.info = originalConsoleInfo;
});

describe('Monitoring Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('monitorOpenAIUsage', () => {
    it('should trigger alerts when OpenAI usage exceeds thresholds', async () => {
      // Setup: Create high usage logs that will trigger an alert
      const highUsageLogs = [
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
          tags: ['ai', 'openai', 'api-call']
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
          tags: ['ai', 'openai', 'api-call']
        }
      ];
      
      // Mock storage.getLogs to return high usage data
      (storage.getLogs as jest.Mock).mockResolvedValueOnce(highUsageLogs);
      
      // Act: Call the monitor function
      await monitoringService.monitorOpenAIUsage();
      
      // Assert: Check that logs were queried with correct parameters
      expect(storage.getLogs).toHaveBeenCalledWith(expect.objectContaining({
        category: LogCategory.AI,
        tags: ['openai', 'api-call']
      }));
      
      // Assert: Alert should be logged through the storage.createLog
      // Find any createLog calls that have a message including "System alert"
      const createLogCalls = (storage.createLog as jest.Mock).mock.calls;
      const alertLogCalls = createLogCalls.filter(call => 
        call[0].message && call[0].message.includes('System alert')
      );
      
      // Check that we have at least one alert log
      expect(alertLogCalls.length).toBeGreaterThan(0);
      
      // Check that the alert log has the expected properties
      const alertLogCall = alertLogCalls[0][0];
      expect(alertLogCall).toMatchObject({
        category: LogCategory.SYSTEM,
        message: expect.stringContaining('System alert')
      });

      // Also expect a debug log for the monitoring check
      const debugLogCalls = createLogCalls.filter(call => 
        call[0].message && call[0].message.includes('Monitored OpenAI token usage')
      );
      expect(debugLogCalls.length).toBeGreaterThan(0);
    });
    
    it('should not trigger alerts when usage is within thresholds', async () => {
      // Setup: Create low usage logs that won't trigger an alert
      const lowUsageLogs = [
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
          tags: ['ai', 'openai', 'api-call']
        }
      ];
      
      // Mock storage.getLogs to return low usage data
      (storage.getLogs as jest.Mock).mockResolvedValueOnce(lowUsageLogs);
      
      // Clear previous calls
      (storage.createLog as jest.Mock).mockClear();
      
      // Act: Call the monitor function
      await monitoringService.monitorOpenAIUsage();
      
      // Assert: No alert should be created, only debug log
      const createLogCalls = (storage.createLog as jest.Mock).mock.calls;
      
      // Should only have one call for the debug log
      expect(createLogCalls.length).toBe(1);
      
      // That call should be the debug log, not an alert
      expect(createLogCalls[0][0]).toMatchObject({
        level: LogLevel.DEBUG,
        category: LogCategory.SYSTEM,
        message: expect.stringContaining('Monitored OpenAI token usage')
      });
      
      // Make sure no alert message was logged
      const alertCalls = createLogCalls.filter(call => 
        call[0].message.includes('System alert')
      );
      expect(alertCalls.length).toBe(0);
    });
  });
  
  describe('monitorApiResponseTimes', () => {
    it('should trigger alerts when API response times are slow', async () => {
      // Setup: Create logs with slow API response times
      const slowApiLogs = [
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
      ];
      
      // Mock storage.getLogs to return slow API logs
      (storage.getLogs as jest.Mock).mockResolvedValueOnce(slowApiLogs);
      
      // Clear previous calls
      (storage.createLog as jest.Mock).mockClear();
      
      // Act: Call the monitor function
      await monitoringService.monitorApiResponseTimes();
      
      // Assert: Check that logs were queried with correct parameters
      expect(storage.getLogs).toHaveBeenCalledWith(expect.objectContaining({
        category: LogCategory.API
      }));
      
      // Assert: Alert should be logged through storage.createLog
      const createLogCalls = (storage.createLog as jest.Mock).mock.calls;
      const alertLogCalls = createLogCalls.filter(call => 
        call[0].message && call[0].message.includes('System alert')
      );
      
      // Check that we have at least one alert log
      expect(alertLogCalls.length).toBeGreaterThan(0);
      
      // Check that the alert log has the expected properties
      const alertLogCall = alertLogCalls[0][0];
      expect(alertLogCall).toMatchObject({
        category: LogCategory.SYSTEM,
        message: expect.stringContaining('System alert')
      });
      
      // Also expect a debug log for the monitoring check
      const debugLogCalls = createLogCalls.filter(call => 
        call[0].message && call[0].message.includes('Monitored API response times')
      );
      expect(debugLogCalls.length).toBeGreaterThan(0);
    });
    
    it('should not trigger alerts when API response times are acceptable', async () => {
      // Setup: Create logs with fast API response times
      const fastApiLogs = [
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
      ];
      
      // Mock storage.getLogs to return fast API logs
      (storage.getLogs as jest.Mock).mockResolvedValueOnce(fastApiLogs);
      
      // Clear previous calls
      (storage.createLog as jest.Mock).mockClear();
      
      // Act: Call the monitor function
      await monitoringService.monitorApiResponseTimes();
      
      // Assert: No alert should be created, only debug log
      const createLogCalls = (storage.createLog as jest.Mock).mock.calls;
      
      // Should only have one call for the debug log
      expect(createLogCalls.length).toBe(1);
      
      // That call should be the debug log, not an alert
      expect(createLogCalls[0][0]).toMatchObject({
        level: LogLevel.DEBUG,
        category: LogCategory.SYSTEM,
        message: expect.stringContaining('Monitored API response times')
      });
      
      // Make sure no alert message was logged
      const alertCalls = createLogCalls.filter(call => 
        call[0].message.includes('System alert')
      );
      expect(alertCalls.length).toBe(0);
    });
  });
  
  describe('monitorErrorRates', () => {
    it('should trigger alerts when error rates are high', async () => {
      // Setup: Create many error logs to simulate a high error rate
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
      
      // Mock storage.getLogs to return many error logs
      (storage.getLogs as jest.Mock).mockResolvedValueOnce(errorLogs);
      
      // Clear previous calls
      (storage.createLog as jest.Mock).mockClear();
      
      // Act: Call the monitor function
      await monitoringService.monitorErrorRates();
      
      // Assert: Check that logs were queried with correct parameters
      expect(storage.getLogs).toHaveBeenCalledWith({
        level: [LogLevel.ERROR, LogLevel.CRITICAL],
        startDate: expect.any(Date)
      });
      
      // Assert: Alert should be logged through storage.createLog
      const createLogCalls = (storage.createLog as jest.Mock).mock.calls;
      const alertLogCalls = createLogCalls.filter(call => 
        call[0].message && call[0].message.includes('System alert')
      );
      
      // Check that we have at least one alert log
      expect(alertLogCalls.length).toBeGreaterThan(0);
      
      // Check that the alert log has the expected properties
      const alertLogCall = alertLogCalls[0][0];
      expect(alertLogCall).toMatchObject({
        category: LogCategory.SYSTEM,
        message: expect.stringContaining('System alert')
      });
      
      // Also expect a debug log for the monitoring check
      const debugLogCalls = createLogCalls.filter(call => 
        call[0].message && call[0].message.includes('Monitored error rates')
      );
      expect(debugLogCalls.length).toBeGreaterThan(0);
    });
    
    it('should not trigger alerts when error rates are acceptable', async () => {
      // Setup: Create few error logs to simulate a low error rate
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
      
      // Mock storage.getLogs to return few error logs
      (storage.getLogs as jest.Mock).mockResolvedValueOnce(errorLogs);
      
      // Clear previous calls
      (storage.createLog as jest.Mock).mockClear();
      
      // Act: Call the monitor function
      await monitoringService.monitorErrorRates();
      
      // Assert: No alert should be created, only debug log
      const createLogCalls = (storage.createLog as jest.Mock).mock.calls;
      
      // Should only have one call for the debug log
      expect(createLogCalls.length).toBe(1);
      
      // That call should be the debug log, not an alert
      expect(createLogCalls[0][0]).toMatchObject({
        level: LogLevel.DEBUG,
        category: LogCategory.SYSTEM,
        message: expect.stringContaining('Monitored error rates')
      });
      
      // Make sure no alert message was logged
      const alertCalls = createLogCalls.filter(call => 
        call[0].message.includes('System alert')
      );
      expect(alertCalls.length).toBe(0);
    });
  });
  
  describe('runMonitoring', () => {
    it('should run all monitoring checks', async () => {
      // Mock individual monitoring functions
      const openAISpy = jest.spyOn(monitoringService, 'monitorOpenAIUsage').mockResolvedValueOnce();
      const apiSpy = jest.spyOn(monitoringService, 'monitorApiResponseTimes').mockResolvedValueOnce();
      const errorSpy = jest.spyOn(monitoringService, 'monitorErrorRates').mockResolvedValueOnce();
      
      // Act: Call runMonitoring
      await monitoringService.runMonitoring();
      
      // Assert: All monitoring checks should be called
      expect(openAISpy).toHaveBeenCalled();
      expect(apiSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      
      // Clean up spies
      openAISpy.mockRestore();
      apiSpy.mockRestore();
      errorSpy.mockRestore();
    });
    
    it('should continue even if one check fails', async () => {
      // Mock individual monitoring functions with one failing
      const openAISpy = jest.spyOn(monitoringService, 'monitorOpenAIUsage')
        .mockRejectedValueOnce(new Error('Test error'));
      const apiSpy = jest.spyOn(monitoringService, 'monitorApiResponseTimes').mockResolvedValueOnce();
      const errorSpy = jest.spyOn(monitoringService, 'monitorErrorRates').mockResolvedValueOnce();
      
      // Clear previous calls
      (storage.createLog as jest.Mock).mockClear();
      
      // Act: Call runMonitoring (should not throw)
      await expect(monitoringService.runMonitoring()).resolves.not.toThrow();
      
      // Assert: All monitoring checks should be called, even the failing one
      expect(openAISpy).toHaveBeenCalled();
      expect(apiSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      
      // Assert: Log should be created for the error
      expect(storage.createLog).toHaveBeenCalledWith(expect.objectContaining({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: expect.stringContaining('Failed to run monitoring checks')
      }));
      
      // Clean up spies
      openAISpy.mockRestore();
      apiSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});