
import { troubleshootingService } from '../../server/services/troubleshooting.service';
import { LogLevel } from '@shared/schema';

describe('TroubleshootingService', () => {
  it('should correctly categorize database errors', async () => {
    const error = new Error('connection refused to database');
    const diagnosis = await troubleshootingService.analyzeIssue(error, {});
    
    expect(diagnosis.category).toBe('database');
    expect(diagnosis.severity).toBe(LogLevel.ERROR);
    expect(diagnosis.recommendations).toContain('Check database connection parameters');
  });

  it('should handle unknown errors', async () => {
    const error = new Error('unexpected error');
    const diagnosis = await troubleshootingService.analyzeIssue(error, {});
    
    expect(diagnosis.category).toBe('unknown');
    expect(diagnosis.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle rate limit errors', async () => {
    const error = new Error('rate limit exceeded');
    const diagnosis = await troubleshootingService.analyzeIssue(error, {});
    
    expect(diagnosis.category).toBe('api');
    expect(diagnosis.recommendations).toContain('Check rate limit status');
  });

  it('should handle critical errors', async () => {
    const error = new Error('CRITICAL: database connection lost');
    const diagnosis = await troubleshootingService.analyzeIssue(error, {});
    
    expect(diagnosis.severity).toBe(LogLevel.CRITICAL);
  });

  it('should include context in recommendations', async () => {
    const error = new Error('unauthorized access');
    const context = { userId: '123', resource: 'projects' };
    const diagnosis = await troubleshootingService.analyzeIssue(error, context);
    
    expect(diagnosis.category).toBe('auth');
    expect(diagnosis.recommendations).toContain('Check user permissions');
  });
});
