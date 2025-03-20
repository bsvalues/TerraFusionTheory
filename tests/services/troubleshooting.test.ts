
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
});
