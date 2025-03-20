
import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../storage';
import { alertManager } from './alert';

export class TroubleshootingService {
  private static readonly ERROR_PATTERNS = {
    database: /(?:connection refused|timeout|deadlock)/i,
    auth: /(?:unauthorized|forbidden|invalid token)/i,
    api: /(?:rate limit|bad request|validation failed)/i
  };

  async analyzeIssue(error: Error, context: Record<string, any>) {
    const diagnosis = {
      category: this.categorizeError(error),
      severity: this.assessSeverity(error),
      recommendations: await this.generateRecommendations(error, context)
    };

    await this.logDiagnosis(diagnosis);
    return diagnosis;
  }

  private categorizeError(error: Error): string {
    for (const [category, pattern] of Object.entries(TroubleshootingService.ERROR_PATTERNS)) {
      if (pattern.test(error.message)) {
        return category;
      }
    }
    return 'unknown';
  }

  private assessSeverity(error: Error): LogLevel {
    if (error.message.includes('FATAL') || error.message.includes('CRITICAL')) {
      return LogLevel.CRITICAL;
    }
    return LogLevel.ERROR;
  }

  private async generateRecommendations(error: Error, context: Record<string, any>) {
    const category = this.categorizeError(error);
    const recommendations = [];

    switch (category) {
      case 'database':
        recommendations.push('Check database connection parameters');
        recommendations.push('Verify database service status');
        break;
      case 'auth':
        recommendations.push('Validate authentication tokens');
        recommendations.push('Check user permissions');
        break;
      case 'api':
        recommendations.push('Review API request format');
        recommendations.push('Check rate limit status');
        break;
    }

    return recommendations;
  }

  private async logDiagnosis(diagnosis: any) {
    await storage.createLog({
      level: diagnosis.severity,
      category: LogCategory.SYSTEM,
      message: 'Automated troubleshooting diagnosis',
      details: diagnosis,
      source: 'troubleshooting-service'
    });
  }
}

export const troubleshootingService = new TroubleshootingService();
