import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../storage';

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
    // Initialize with empty job list
  }
  
  /**
   * Add a new job to the scheduler
   */
  addJob(name: string, intervalMinutes: number, task: () => Promise<void>): void {
    // Check if job already exists
    const existingJob = this.jobs.find(job => job.name === name);
    
    if (existingJob) {
      // Update existing job
      existingJob.intervalMinutes = intervalMinutes;
      existingJob.task = task;
    } else {
      // Add new job
      this.jobs.push({
        name,
        intervalMinutes,
        task,
        isRunning: false
      });
    }
    
    // If scheduler is already running, start this job
    if (this.isStarted) {
      const job = this.jobs.find(j => j.name === name);
      if (job) {
        this.startJob(job);
      }
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
    
    // Start all jobs
    for (const job of this.jobs) {
      this.startJob(job);
    }
    
    // Log scheduler start
    storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: `Scheduler started with ${this.jobs.length} jobs`,
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
      tags: ['scheduler', 'start']
    }).catch(error => {
      console.error('Failed to log scheduler start:', error);
    });
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isStarted) {
      return;
    }
    
    // Clear all timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    
    this.timers = [];
    this.isStarted = false;
    
    // Log scheduler stop
    storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: 'Scheduler stopped',
      details: JSON.stringify({}),
      source: 'scheduler',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['scheduler', 'stop']
    }).catch(error => {
      console.error('Failed to log scheduler stop:', error);
    });
  }
  
  /**
   * Start a specific job
   */
  private startJob(job: ScheduledJob): void {
    // Convert minutes to milliseconds
    const intervalMs = job.intervalMinutes * 60 * 1000;
    
    // Schedule the job
    const timer = setTimeout(async () => {
      await this.runJob(job);
      
      // Re-schedule job after it completes
      this.startJob(job);
    }, intervalMs);
    
    // Store the timer reference for cleanup
    this.timers.push(timer);
  }
  
  /**
   * Run a specific job
   */
  private async runJob(job: ScheduledJob): Promise<void> {
    if (job.isRunning) {
      // Job is already running, skip this execution
      return;
    }
    
    job.isRunning = true;
    const startTime = Date.now();
    
    try {
      // Log job start
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Starting scheduled job: ${job.name}`,
        details: JSON.stringify({
          name: job.name,
          intervalMinutes: job.intervalMinutes,
          lastRun: job.lastRun?.toISOString()
        }),
        source: 'scheduler',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['scheduler', 'job-start', job.name]
      });
      
      // Execute the job
      await job.task();
      
      // Update last run time
      job.lastRun = new Date();
      
      // Log job completion
      const duration = Date.now() - startTime;
      
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Completed scheduled job: ${job.name}`,
        details: JSON.stringify({
          name: job.name,
          durationMs: duration,
          lastRun: job.lastRun.toISOString()
        }),
        source: 'scheduler',
        projectId: null,
        userId: null,
        sessionId: null,
        duration,
        statusCode: null,
        endpoint: null,
        tags: ['scheduler', 'job-complete', job.name]
      });
    } catch (error) {
      // Log job error
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Error in scheduled job ${job.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          name: job.name,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'scheduler',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: Date.now() - startTime,
        statusCode: null,
        endpoint: null,
        tags: ['scheduler', 'job-error', job.name]
      });
    } finally {
      // Mark job as not running
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
      // Calculate the next run time based on the interval and last run
      let nextRun: Date | undefined = undefined;
      
      if (job.lastRun) {
        nextRun = new Date(job.lastRun);
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

// Export singleton instance
export const scheduler = new Scheduler();