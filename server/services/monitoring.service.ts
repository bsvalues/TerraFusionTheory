import { storage } from '../storage';
import { LogCategory, LogLevel } from '@shared/schema';
import { AppError } from '../errors';

interface AlertChannel {
  sendAlert(message: string, level: 'info' | 'warning' | 'critical', context?: Record<string, any>): Promise<void>;
}

class ConsoleAlertChannel implements AlertChannel {
  async sendAlert(message: string, level: 'info' | 'warning' | 'critical', context?: Record<string, any>): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Format message based on level
    let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (context) {
      formattedMessage += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    // Output to appropriate console method based on level
    switch (level) {
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warning':
        console.warn(formattedMessage);
        break;
      case 'critical':
        console.error(formattedMessage);
        break;
    }
  }
}

class EmailAlertChannel implements AlertChannel {
  private recipients: string[];
  
  constructor(recipients: string[]) {
    this.recipients = recipients;
  }
  
  async sendAlert(message: string, level: 'info' | 'warning' | 'critical', context?: Record<string, any>): Promise<void> {
    // In a real implementation, this would send an email
    console.log(`[EMAIL ALERT] Would send ${level} alert to ${this.recipients.join(', ')}: ${message}`);
    
    // Log the alert
    await storage.createLog({
      level: level === 'critical' ? LogLevel.CRITICAL : 
             level === 'warning' ? LogLevel.WARNING : LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: `Email alert: ${message}`,
      details: JSON.stringify({
        recipients: this.recipients,
        level,
        context
      }),
      source: 'email-alert',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'alert', 'email', level]
    });
  }
}

class SlackAlertChannel implements AlertChannel {
  private webhookUrl: string;
  private channel: string;
  
  constructor(webhookUrl: string, channel: string) {
    this.webhookUrl = webhookUrl;
    this.channel = channel;
  }
  
  async sendAlert(message: string, level: 'info' | 'warning' | 'critical', context?: Record<string, any>): Promise<void> {
    // In a real implementation, this would post to Slack
    console.log(`[SLACK ALERT] Would send ${level} alert to ${this.channel}: ${message}`);
    
    // Log the alert
    await storage.createLog({
      level: level === 'critical' ? LogLevel.CRITICAL : 
             level === 'warning' ? LogLevel.WARNING : LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: `Slack alert: ${message}`,
      details: JSON.stringify({
        channel: this.channel,
        level,
        context
      }),
      source: 'slack-alert',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'alert', 'slack', level]
    });
  }
}

class AlertManager {
  private channels: AlertChannel[] = [];
  
  constructor() {
    // Always add console alerts
    this.addChannel(new ConsoleAlertChannel());
    
    // Add email alerts if configured
    if (process.env.ALERT_EMAIL_RECIPIENTS) {
      const recipients = process.env.ALERT_EMAIL_RECIPIENTS.split(',');
      this.addChannel(new EmailAlertChannel(recipients));
    }
    
    // Add Slack alerts if configured
    if (process.env.ALERT_SLACK_WEBHOOK && process.env.ALERT_SLACK_CHANNEL) {
      this.addChannel(new SlackAlertChannel(
        process.env.ALERT_SLACK_WEBHOOK,
        process.env.ALERT_SLACK_CHANNEL
      ));
    }
  }
  
  addChannel(channel: AlertChannel): void {
    this.channels.push(channel);
  }
  
  async sendAlert(message: string, level: 'info' | 'warning' | 'critical', context?: Record<string, any>): Promise<void> {
    // Send alert to all channels
    await Promise.all(this.channels.map(channel => 
      channel.sendAlert(message, level, context)
    ));
    
    // Also log the alert
    await storage.createLog({
      level: level === 'critical' ? LogLevel.CRITICAL : 
             level === 'warning' ? LogLevel.WARNING : LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: `System alert: ${message}`,
      details: JSON.stringify({
        level,
        context,
        channels: this.channels.map(c => c.constructor.name)
      }),
      source: 'alert-manager',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'alert', level]
    });
  }
}

// Create a singleton instance
const alertManager = new AlertManager();

// Define thresholds
const THRESHOLDS = {
  openai: {
    dailyTokenUsage: {
      warning: 500000,  // 500K tokens per day
      critical: 1000000  // 1M tokens per day
    }
  },
  api: {
    responseTime: {
      warning: 1000,  // 1 second
      critical: 5000  // 5 seconds
    }
  },
  errors: {
    ratePerMinute: {
      warning: 5,
      critical: 20
    }
  }
};

/**
 * Monitor OpenAI API usage and trigger alerts if thresholds are exceeded
 */
export async function monitorOpenAIUsage(): Promise<void> {
  try {
    // Get logs from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const openaiLogs = await storage.getLogs({
      category: LogCategory.AI,
      startDate: yesterday,
      tags: ['openai', 'api-call']
    });
    
    // Calculate token usage
    let totalTokens = 0;
    
    openaiLogs.forEach(log => {
      try {
        const details = JSON.parse(log.details as string);
        if (details.response?.usage?.total_tokens) {
          totalTokens += details.response.usage.total_tokens;
        }
      } catch (error) {
        // Ignore parsing errors
      }
    });
    
    // Check against thresholds
    if (totalTokens > THRESHOLDS.openai.dailyTokenUsage.critical) {
      await alertManager.sendAlert(
        `OpenAI token usage is critically high: ${totalTokens} tokens in the last 24 hours`,
        'critical',
        { totalTokens, threshold: THRESHOLDS.openai.dailyTokenUsage.critical }
      );
    } else if (totalTokens > THRESHOLDS.openai.dailyTokenUsage.warning) {
      await alertManager.sendAlert(
        `OpenAI token usage is high: ${totalTokens} tokens in the last 24 hours`,
        'warning',
        { totalTokens, threshold: THRESHOLDS.openai.dailyTokenUsage.warning }
      );
    }
    
    // Log the check
    await storage.createLog({
      level: LogLevel.DEBUG,
      category: LogCategory.SYSTEM,
      message: `Monitored OpenAI token usage: ${totalTokens} tokens in the last 24 hours`,
      details: JSON.stringify({
        totalTokens,
        warningThreshold: THRESHOLDS.openai.dailyTokenUsage.warning,
        criticalThreshold: THRESHOLDS.openai.dailyTokenUsage.critical
      }),
      source: 'monitoring-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'openai', 'token-usage']
    });
    
  } catch (error) {
    console.error('Error monitoring OpenAI usage:', error);
    
    // Log the error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message: 'Failed to monitor OpenAI usage',
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      source: 'monitoring-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'openai', 'error']
    });
  }
}

/**
 * Monitor API response times and trigger alerts if thresholds are exceeded
 */
export async function monitorApiResponseTimes(): Promise<void> {
  try {
    // Get API logs from the last 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const apiLogs = await storage.getLogs({
      category: LogCategory.API,
      startDate: fiveMinutesAgo
    });
    
    // Calculate average response time
    let totalResponseTime = 0;
    let count = 0;
    
    apiLogs.forEach(log => {
      if (log.duration) {
        totalResponseTime += log.duration;
        count++;
      }
    });
    
    const avgResponseTime = count > 0 ? totalResponseTime / count : 0;
    
    // Find slow endpoints
    const slowEndpoints = apiLogs
      .filter(log => log.duration && log.duration > THRESHOLDS.api.responseTime.warning)
      .map(log => ({
        endpoint: log.endpoint,
        duration: log.duration,
        timestamp: log.timestamp
      }));
    
    // Check against thresholds
    if (avgResponseTime > THRESHOLDS.api.responseTime.critical) {
      await alertManager.sendAlert(
        `API response time is critically high: ${avgResponseTime.toFixed(2)}ms average in the last 5 minutes`,
        'critical',
        { avgResponseTime, slowEndpoints, threshold: THRESHOLDS.api.responseTime.critical }
      );
    } else if (avgResponseTime > THRESHOLDS.api.responseTime.warning) {
      await alertManager.sendAlert(
        `API response time is high: ${avgResponseTime.toFixed(2)}ms average in the last 5 minutes`,
        'warning',
        { avgResponseTime, slowEndpoints, threshold: THRESHOLDS.api.responseTime.warning }
      );
    }
    
    // Log the check
    await storage.createLog({
      level: LogLevel.DEBUG,
      category: LogCategory.SYSTEM,
      message: `Monitored API response times: ${avgResponseTime.toFixed(2)}ms average in the last 5 minutes`,
      details: JSON.stringify({
        avgResponseTime,
        requestCount: count,
        slowEndpoints,
        warningThreshold: THRESHOLDS.api.responseTime.warning,
        criticalThreshold: THRESHOLDS.api.responseTime.critical
      }),
      source: 'monitoring-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'api', 'response-time']
    });
    
  } catch (error) {
    console.error('Error monitoring API response times:', error);
    
    // Log the error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message: 'Failed to monitor API response times',
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      source: 'monitoring-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'api', 'error']
    });
  }
}

/**
 * Monitor error rates and trigger alerts if thresholds are exceeded
 */
export async function monitorErrorRates(): Promise<void> {
  try {
    // Get error logs from the last 15 minutes
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    
    const errorLogs = await storage.getLogs({
      level: [LogLevel.ERROR, LogLevel.CRITICAL],
      startDate: fifteenMinutesAgo
    });
    
    // Calculate error rate (errors per minute)
    const timeSpanMinutes = 15;
    const errorsPerMinute = errorLogs.length / timeSpanMinutes;
    
    // Group errors by type
    const errorsByType = errorLogs.reduce<Record<string, number>>((acc, log) => {
      // Try to extract error type from details
      let errorType = 'unknown';
      
      try {
        const details = JSON.parse(log.details as string);
        if (details.errorType) {
          errorType = details.errorType;
        } else if (details.error?.type) {
          errorType = details.error.type;
        } else if (details.error?.name) {
          errorType = details.error.name;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {});
    
    // Check against thresholds
    if (errorsPerMinute > THRESHOLDS.errors.ratePerMinute.critical) {
      await alertManager.sendAlert(
        `Error rate is critically high: ${errorsPerMinute.toFixed(2)} errors per minute in the last 15 minutes`,
        'critical',
        { errorsPerMinute, errorsByType, threshold: THRESHOLDS.errors.ratePerMinute.critical }
      );
    } else if (errorsPerMinute > THRESHOLDS.errors.ratePerMinute.warning) {
      await alertManager.sendAlert(
        `Error rate is high: ${errorsPerMinute.toFixed(2)} errors per minute in the last 15 minutes`,
        'warning',
        { errorsPerMinute, errorsByType, threshold: THRESHOLDS.errors.ratePerMinute.warning }
      );
    }
    
    // Log the check
    await storage.createLog({
      level: LogLevel.DEBUG,
      category: LogCategory.SYSTEM,
      message: `Monitored error rates: ${errorsPerMinute.toFixed(2)} errors per minute in the last 15 minutes`,
      details: JSON.stringify({
        errorsPerMinute,
        errorCount: errorLogs.length,
        timeSpanMinutes,
        errorsByType,
        warningThreshold: THRESHOLDS.errors.ratePerMinute.warning,
        criticalThreshold: THRESHOLDS.errors.ratePerMinute.critical
      }),
      source: 'monitoring-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'errors', 'error-rate']
    });
    
  } catch (error) {
    console.error('Error monitoring error rates:', error);
    
    // Log the error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message: 'Failed to monitor error rates',
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      source: 'monitoring-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'errors', 'error']
    });
  }
}

/**
 * Run all monitoring checks
 */
export async function runMonitoring(): Promise<void> {
  try {
    await Promise.all([
      monitorOpenAIUsage(),
      monitorApiResponseTimes(),
      monitorErrorRates()
    ]);
    
    // Log successful run
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'Completed system monitoring checks',
      details: '',
      source: 'monitoring-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'check', 'success']
    });
    
  } catch (error) {
    console.error('Error running monitoring checks:', error);
    
    // Log the error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message: 'Failed to run monitoring checks',
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      source: 'monitoring-service',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['monitoring', 'check', 'error']
    });
  }
}