import { TroubleshootingService } from '../../server/services/troubleshooting.service';
import { LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';
import { AppError, ValidationError, DatabaseError } from '../../server/errors';

// Mock dependencies
jest.mock('../../server/storage', () => ({
  storage: {
    createLog: jest.fn().mockResolvedValue({ id: 1 })
  }
}));

describe('TroubleshootingService', () => {
  let troubleshootingService: TroubleshootingService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    troubleshootingService = new TroubleshootingService();
  });
  
  describe('analyzeIssue', () => {
    it('should correctly analyze validation errors', async () => {
      const error = new ValidationError('Invalid input parameter');
      const context = { 
        endpoint: '/api/properties',
        method: 'POST',
        input: { propertyId: '' }
      };
      
      await troubleshootingService.analyzeIssue(error, context);
      
      expect(storage.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARNING,
          message: expect.stringContaining('Invalid input parameter'),
          details: expect.any(String)
        })
      );
    });
    
    it('should correctly analyze database errors', async () => {
      const error = new DatabaseError('Failed to connect to database');
      const context = { 
        operation: 'query',
        table: 'properties' 
      };
      
      await troubleshootingService.analyzeIssue(error, context);
      
      expect(storage.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          message: expect.stringContaining('Failed to connect to database'),
          details: expect.any(String)
        })
      );
    });
    
    it('should handle generic errors', async () => {
      const error = new Error('Generic error');
      const context = { source: 'test' };
      
      await troubleshootingService.analyzeIssue(error, context);
      
      expect(storage.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          level: expect.any(String),
          message: expect.stringContaining('Generic error'),
          details: expect.any(String)
        })
      );
    });
    
    it('should handle AppErrors with details', async () => {
      const details = { 
        failedOperation: 'data fetch',
        resource: 'property listings'
      };
      const error = new AppError('Operation failed', 500, 'OPERATION_FAILED', true, details);
      const context = { endpoint: '/api/properties' };
      
      await troubleshootingService.analyzeIssue(error, context);
      
      expect(storage.createLog).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.stringContaining('failedOperation')
        })
      );
    });
  });
  
  describe('categorizeError', () => {
    it('should categorize validation errors', () => {
      const error = new ValidationError('Invalid input');
      const result = (troubleshootingService as any).categorizeError(error);
      expect(result).toBe('validation');
    });
    
    it('should categorize database errors', () => {
      const error = new DatabaseError('Database connection failed');
      const result = (troubleshootingService as any).categorizeError(error);
      expect(result).toBe('database');
    });
    
    it('should categorize timeout errors', () => {
      const error = new Error('Request timed out');
      const result = (troubleshootingService as any).categorizeError(error);
      expect(result).toBe('timeout');
    });
    
    it('should provide default category for unknown errors', () => {
      const error = new Error('Unknown error type');
      const result = (troubleshootingService as any).categorizeError(error);
      expect(result).toBe('unknown');
    });
  });
  
  describe('assessSeverity', () => {
    it('should assess validation errors as warnings', () => {
      const error = new ValidationError('Invalid input');
      const result = (troubleshootingService as any).assessSeverity(error);
      expect(result).toBe(LogLevel.WARNING);
    });
    
    it('should assess database errors as errors', () => {
      const error = new DatabaseError('Database failure');
      const result = (troubleshootingService as any).assessSeverity(error);
      expect(result).toBe(LogLevel.ERROR);
    });
    
    it('should assess unknown errors with default severity', () => {
      const error = new Error('Some error');
      const result = (troubleshootingService as any).assessSeverity(error);
      expect(result).toBe(LogLevel.ERROR);
    });
  });
  
  describe('generateRecommendations', () => {
    it('should generate recommendations for validation errors', async () => {
      const error = new ValidationError('Invalid input: missing required field');
      const context = { input: { name: '' } };
      
      const recommendations = await (troubleshootingService as any).generateRecommendations(error, context);
      
      expect(recommendations).toContain('Provide all required fields');
    });
    
    it('should generate recommendations for database errors', async () => {
      const error = new DatabaseError('Connection refused');
      const context = { operation: 'query' };
      
      const recommendations = await (troubleshootingService as any).generateRecommendations(error, context);
      
      expect(recommendations).toContain('Check database connection');
    });
    
    it('should generate general recommendations for unknown errors', async () => {
      const error = new Error('Unknown error');
      const context = {};
      
      const recommendations = await (troubleshootingService as any).generateRecommendations(error, context);
      
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });
});