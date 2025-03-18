import { storage } from '../storage';
import { LogCategory, LogLevel } from '@shared/schema';
import { monitorOpenAIUsage, monitorApiResponseTimes, monitorErrorRates } from './monitoring.service';

/**
 * Interface for a scheduled job
 */
interface ScheduledJob {
  name: string;
  intervalMinutes: number;
  task: () => Promise<void>;
  lastRun?: Date;
  isRunning: boolean;
}

/**
 * Class to handle scheduling and running of background tasks
 */
export class Scheduler {
  private jobs: ScheduledJob[] = [];
  private timers: NodeJS.Timeout[] = [];
  private isStarted = false;
  
  constructor() {
    // Initialize with default monitoring jobs
    this.addJob('OpenAI Usage Monitor', 60, monitorOpenAIUsage);
    this.addJob('API Response Time Monitor', 5, monitorApiResponseTimes);
    this.addJob('Error Rate Monitor', 15, monitorErrorRates);
    
    // Add cleanup job that runs daily to remove old logs
    this.addJob('Log Cleanup', 1440, async () => {
      // Keep logs for 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      try {
        // Delete logs older than 30 days
        const deletedCount = await storage.clearLogs({ olderThan: thirtyDaysAgo });
        
        // Log the cleanup
        await storage.createLog({
          level: LogLevel.INFO,
          category: LogCategory.SYSTEM,
          message: `Scheduled log cleanup completed`,
          details: JSON.stringify({
            deletedCount,
            olderThan: thirtyDaysAgo.toISOString()
          }),
          source: 'scheduler',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['scheduler', 'cleanup', 'logs']
        });
      } catch (error) {
        // Log failure
        await storage.createLog({
          level: LogLevel.ERROR,
          category: LogCategory.SYSTEM,
          message: `Scheduled log cleanup failed`,
          details: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          }),
          source: 'scheduler',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['scheduler', 'cleanup', 'logs', 'error']
        });
      }
    });
    
    // Register process exit handler to clean up timers
    process.on('exit', () => this.stop());
  }
  
  /**
   * Add a new job to the scheduler
   */
  addJob(name: string, intervalMinutes: number, task: () => Promise<void>): void {
    this.jobs.push({
      name,
      intervalMinutes,
      task,
      isRunning: false
    });
    
    // Start the job if scheduler is already running
    if (this.isStarted) {
      this.startJob(this.jobs[this.jobs.length - 1]);
    }
  }
  
  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isStarted) {
      return;
    }
    
    this.isStarted = true;
    
    // Log scheduler start
    storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'Task scheduler started',
      details: JSON.stringify({
        jobs: this.jobs.map(job => ({
          name: job.name,
          intervalMinutes: job.intervalMinutes
        }))
      }),
      source: 'scheduler',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['scheduler', 'startup']
    }).catch(console.error);
    
    // Start all jobs
    this.jobs.forEach(job => this.startJob(job));
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isStarted) {
      return;
    }
    
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
    
    this.isStarted = false;
    
    // Log scheduler stop
    storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'Task scheduler stopped',
      details: '',
      source: 'scheduler',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['scheduler', 'shutdown']
    }).catch(console.error);
  }
  
  /**
   * Start a specific job
   */
  private startJob(job: ScheduledJob): void {
    // Convert minutes to milliseconds
    const intervalMs = job.intervalMinutes * 60 * 1000;
    
    const scheduleNextRun = () => {
      const timer = setTimeout(async () => {
        await this.runJob(job);
        
        // Schedule the next run if the scheduler is still running
        if (this.isStarted) {
          scheduleNextRun();
        }
      }, intervalMs);
      
      // Store the timer so we can clear it if needed
      this.timers.push(timer);
    };
    
    // Run the job immediately and then schedule next runs
    this.runJob(job).finally(scheduleNextRun);
  }
  
  /**
   * Run a specific job
   */
  private async runJob(job: ScheduledJob): Promise<void> {
    // Skip if the job is already running
    if (job.isRunning) {
      return;
    }
    
    // Set running flag and update last run time
    job.isRunning = true;
    job.lastRun = new Date();
    
    try {
      // Log job start
      await storage.createLog({
        level: LogLevel.DEBUG,
        category: LogCategory.SYSTEM,
        message: `Scheduled job "${job.name}" started`,
        details: '',
        source: 'scheduler',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['scheduler', 'job-start', job.name.toLowerCase().replace(/[^a-z0-9]/g, '-')]
      });
      
      const startTime = Date.now();
      
      // Run the job
      await job.task();
      
      const duration = Date.now() - startTime;
      
      // Log job completion
      await storage.createLog({
        level: LogLevel.DEBUG,
        category: LogCategory.SYSTEM,
        message: `Scheduled job "${job.name}" completed`,
        details: JSON.stringify({ duration }),
        source: 'scheduler',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['scheduler', 'job-complete', job.name.toLowerCase().replace(/[^a-z0-9]/g, '-')]
      });
    } catch (error) {
      // Log job error
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Scheduled job "${job.name}" failed`,
        details: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        }),
        source: 'scheduler',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['scheduler', 'job-error', job.name.toLowerCase().replace(/[^a-z0-9]/g, '-')]
      });
    } finally {
      // Reset running flag
      job.isRunning = false;
    }
  }
  
  /**
   * Get the status of all jobs
   */
  getStatus(): Array<{
    name: string;
    intervalMinutes: number;
    lastRun?: Date;
    isRunning: boolean;
    nextRun?: Date;
  }> {
    return this.jobs.map(job => {
      let nextRun: Date | undefined;
      
      if (job.lastRun) {
        nextRun = new Date(job.lastRun.getTime());
        nextRun.setMinutes(nextRun.getMinutes() + job.intervalMinutes);
      }
      
      return {
        name: job.name,
        intervalMinutes: job.intervalMinutes,
        lastRun: job.lastRun,
        isRunning: job.isRunning,
        nextRun
      };
    });
  }
}

// Create a singleton instance
export const scheduler = new Scheduler();