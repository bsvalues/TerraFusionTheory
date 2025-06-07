import { LogLevel, LogCategory } from '../../../shared/schema';
import { storage } from '../../storage';

/**
 * Interface for alert channel configuration
 */
export interface AlertChannelConfig {
  enabled: boolean;
  thresholds?: {
    error?: number;
    warning?: number;
    critical?: number;
  };
  recipients?: string[];
  webhookUrl?: string;
  channel?: string;
}

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Interface for alert message structure
 */
export interface AlertMessage {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  source: string;
  details?: Record<string, any>;
  acknowledged: boolean;
}

/**
 * Interface for alert channel
 */
export interface AlertChannel {
  sendAlert(title: string, message: string, severity: AlertSeverity, details?: Record<string, any>): Promise<void>;
  name(): string;
  isEnabled(): boolean;
  enable(): void;
  disable(): void;
}

/**
 * Base abstract class for alert channels
 */
abstract class BaseAlertChannel implements AlertChannel {
  protected _name: string;
  protected _enabled: boolean;
  protected _config: AlertChannelConfig;

  constructor(name: string, config: AlertChannelConfig) {
    this._name = name;
    this._enabled = config.enabled;
    this._config = config;
  }

  abstract sendAlert(title: string, message: string, severity: AlertSeverity, details?: Record<string, any>): Promise<void>;

  name(): string {
    return this._name;
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  enable(): void {
    this._enabled = true;
  }

  disable(): void {
    this._enabled = false;
  }

  /**
   * Log alert to the storage system
   */
  protected async logAlert(title: string, message: string, severity: AlertSeverity, details?: Record<string, any>): Promise<void> {
    try {
      // Map alert severity to log level
      let logLevel: LogLevel;
      switch (severity) {
        case 'critical':
          logLevel = LogLevel.CRITICAL;
          break;
        case 'warning':
          logLevel = LogLevel.WARNING;
          break;
        case 'info':
        default:
          logLevel = LogLevel.INFO;
          break;
      }

      await storage.createLog({
        level: logLevel,
        category: LogCategory.SYSTEM,
        message: `ALERT [${severity.toUpperCase()}]: ${title} - ${message}`,
        details: JSON.stringify({
          alert: {
            title,
            message,
            severity,
            timestamp: new Date().toISOString(),
            source: this.name(),
            details
          }
        }),
        source: 'alert-service',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['alert', severity, this.name()]
      });
    } catch (error) {
      console.error('Failed to log alert:', error);
    }
  }
}

/**
 * Console alert channel implementation
 */
export class ConsoleAlertChannel extends BaseAlertChannel {
  constructor(config: AlertChannelConfig = { enabled: true }) {
    super('console', config);
  }

  async sendAlert(title: string, message: string, severity: AlertSeverity, details?: Record<string, any>): Promise<void> {
    if (!this.isEnabled()) return;

    // Get console method based on severity
    let consoleMethod: 'log' | 'warn' | 'error';
    switch (severity) {
      case 'critical':
        consoleMethod = 'error';
        break;
      case 'warning':
        consoleMethod = 'warn';
        break;
      case 'info':
      default:
        consoleMethod = 'log';
        break;
    }
    
    // Format console output
    const timestamp = new Date().toISOString();
    console[consoleMethod](
      `[${timestamp}] ALERT [${severity.toUpperCase()}]: ${title}\n${message}`,
      details ? `\nDetails: ${JSON.stringify(details, null, 2)}` : ''
    );

    // Log alert
    await this.logAlert(title, message, severity, details);
  }
}

/**
 * Email alert channel implementation
 * Note: This is a stub implementation. In a real application, you would integrate
 * with an email service like SendGrid, Mailgun, or Amazon SES.
 */
export class EmailAlertChannel extends BaseAlertChannel {
  private recipients: string[];

  constructor(config: AlertChannelConfig) {
    super('email', config);
    this.recipients = config.recipients || [];
  }

  async sendAlert(title: string, message: string, severity: AlertSeverity, details?: Record<string, any>): Promise<void> {
    if (!this.isEnabled() || this.recipients.length === 0) return;

    // In a real implementation, you would send an email here
    console.log(`[EMAIL ALERT] Would send email to ${this.recipients.join(', ')} with subject: "${title}" and severity: ${severity}`);
    
    // Log alert
    await this.logAlert(title, message, severity, details);
  }
}

/**
 * Slack alert channel implementation
 * Note: This is a stub implementation. In a real application, you would integrate
 * with the Slack API using a webhook URL.
 */
export class SlackAlertChannel extends BaseAlertChannel {
  private webhookUrl: string;
  private channel: string;

  constructor(config: AlertChannelConfig) {
    super('slack', config);
    this.webhookUrl = config.webhookUrl || '';
    this.channel = config.channel || '';
  }

  async sendAlert(title: string, message: string, severity: AlertSeverity, details?: Record<string, any>): Promise<void> {
    if (!this.isEnabled() || !this.webhookUrl) return;

    // In a real implementation, you would post to the Slack webhook here
    console.log(`[SLACK ALERT] Would post to Slack channel: ${this.channel} with title: "${title}" and severity: ${severity}`);
    
    // Log alert
    await this.logAlert(title, message, severity, details);
  }
}

/**
 * Alert manager for centralized alert handling
 */
export class AlertManager {
  private static instance: AlertManager;
  private channels: AlertChannel[] = [];
  private alerts: AlertMessage[] = [];
  private alertCount: number = 0;

  private constructor() {
    // Add default console channel
    this.addChannel(new ConsoleAlertChannel());
  }

  /**
   * Get the singleton instance of the alert manager
   */
  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  /**
   * Add an alert channel
   */
  public addChannel(channel: AlertChannel): void {
    const existingChannel = this.channels.find(c => c.name() === channel.name());
    if (existingChannel) {
      console.warn(`Alert channel with name '${channel.name()}' already exists. Replacing.`);
      this.channels = this.channels.filter(c => c.name() !== channel.name());
    }
    this.channels.push(channel);
  }

  /**
   * Get all registered alert channels
   */
  public getChannels(): AlertChannel[] {
    return [...this.channels];
  }

  /**
   * Get a specific alert channel by name
   */
  public getChannel(name: string): AlertChannel | undefined {
    return this.channels.find(c => c.name() === name);
  }

  /**
   * Enable a specific alert channel
   */
  public enableChannel(name: string): void {
    const channel = this.getChannel(name);
    if (channel) {
      channel.enable();
    }
  }

  /**
   * Disable a specific alert channel
   */
  public disableChannel(name: string): void {
    const channel = this.getChannel(name);
    if (channel) {
      channel.disable();
    }
  }

  /**
   * Send an alert to all enabled channels
   */
  public async sendAlert(title: string, message: string, severity: AlertSeverity, details?: Record<string, any>): Promise<string> {
    // Create alert message
    const alertId = `alert-${Date.now()}-${this.alertCount++}`;
    const alert: AlertMessage = {
      id: alertId,
      title,
      message,
      severity,
      timestamp: new Date().toISOString(),
      source: 'alert-manager',
      details,
      acknowledged: false
    };

    // Store alert
    this.alerts.push(alert);

    // Send to all enabled channels
    const enabledChannels = this.channels.filter(c => c.isEnabled());
    await Promise.all(enabledChannels.map(channel => 
      channel.sendAlert(title, message, severity, details)
    ));

    return alertId;
  }

  /**
   * Get all alerts
   */
  public getAlerts(): AlertMessage[] {
    return [...this.alerts];
  }

  /**
   * Get alerts filtered by severity
   */
  public getAlertsBySeverity(severity: AlertSeverity): AlertMessage[] {
    return this.alerts.filter(a => a.severity === severity);
  }

  /**
   * Get unacknowledged alerts
   */
  public getUnacknowledgedAlerts(): AlertMessage[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Clear acknowledged alerts
   */
  public clearAcknowledgedAlerts(): void {
    this.alerts = this.alerts.filter(a => !a.acknowledged);
  }
}

// Export singleton instance
export const alertManager = AlertManager.getInstance();

/**
 * Utility function to send a critical alert
 */
export async function sendCriticalAlert(title: string, message: string, details?: Record<string, any>): Promise<string> {
  return alertManager.sendAlert(title, message, 'critical', details);
}

/**
 * Utility function to send a warning alert
 */
export async function sendWarningAlert(title: string, message: string, details?: Record<string, any>): Promise<string> {
  return alertManager.sendAlert(title, message, 'warning', details);
}

/**
 * Utility function to send an info alert
 */
export async function sendInfoAlert(title: string, message: string, details?: Record<string, any>): Promise<string> {
  return alertManager.sendAlert(title, message, 'info', details);
}