import * as monitoringService from '../../server/services/monitoring.service';
import { storage } from '../../server/storage';
import { LogLevel, LogCategory } from '../../shared/schema';

// Mock dependencies
jest.mock('../../server/storage', () => ({
  storage: {
    createLog: jest.fn(),
    getLogs: jest.fn(),
    getLogStats: jest.fn()
  }
}));

// Mock the internal alertManager
const mockAlertManager = {
  sendAlert: jest.fn().mockResolvedValue(undefined)
};

// Replace the internal alertManager with our mock
(monitoringService as any).alertManager = mockAlertManager;

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
            tokens: 1200,
            cost: 0.06
          }),
          timestamp: new Date()
        },
        {
          id: 2,
          level: LogLevel.INFO,
          category: LogCategory.AI,
          message: 'OpenAI API request',
          details: JSON.stringify({ 
            model: 'gpt-4', 
            tokens: 1500,
            cost: 0.075
          }),
          timestamp: new Date()
        }
      ]);
      
      await monitoringService.monitorOpenAIUsage();
      
      expect(storage.getLogs).toHaveBeenCalledWith(expect.objectContaining({
        category: LogCategory.AI
      }));
      
      expect(mockAlertManager.sendAlert).toHaveBeenCalled();
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
            tokens: 300,
            cost: 0.0006
          }),
          timestamp: new Date()
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
          timestamp: new Date()
        },
        {
          id: 4,
          level: LogLevel.INFO,
          category: LogCategory.API,
          message: 'API request completed',
          endpoint: '/api/market-analysis',
          duration: 3200, // 3.2 seconds
          timestamp: new Date()
        }
      ]);
      
      await monitoringService.monitorApiResponseTimes();
      
      expect(storage.getLogs).toHaveBeenCalledWith(expect.objectContaining({
        category: LogCategory.API
      }));
      
      expect(mockAlertManager.sendAlert).toHaveBeenCalled();
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
          timestamp: new Date()
        },
        {
          id: 4,
          level: LogLevel.INFO,
          category: LogCategory.API,
          message: 'API request completed',
          endpoint: '/api/market-analysis',
          duration: 320, // 320ms
          timestamp: new Date()
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
      const errorLogs = [];
      for (let i = 0; i < 100; i++) {
        errorLogs.push({
          id: i,
          level: LogLevel.ERROR,
          category: LogCategory.DATABASE,
          message: 'Database connection error',
          timestamp: new Date(),
          details: JSON.stringify({ errorType: 'ConnectionError' })
        });
      }
      
      (storage.getLogs as jest.Mock).mockResolvedValueOnce(errorLogs);
      
      await monitoringService.monitorErrorRates();
      
      expect(storage.getLogs).toHaveBeenCalled();
      expect(mockAlertManager.sendAlert).toHaveBeenCalled();
    });
    
    it('should not trigger alerts when error rates are acceptable', async () => {
      // Mock getLogs to return few error logs (simulate low error rate)
      const errorLogs = [];
      for (let i = 0; i < 3; i++) {
        errorLogs.push({
          id: i,
          level: LogLevel.ERROR,
          category: LogCategory.DATABASE,
          message: 'Minor database error',
          timestamp: new Date(),
          details: JSON.stringify({ errorType: 'MinorError' })
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