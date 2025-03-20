import { Scheduler } from '../../server/services/scheduler.service';
import { storage } from '../../server/storage';
import { LogLevel, LogCategory } from '../../shared/schema';

// Mock dependencies
jest.mock('../../server/storage', () => ({
  storage: {
    createLog: jest.fn()
  }
}));

// Mock timers for testing schedules
jest.useFakeTimers();

describe('Scheduler Service', () => {
  let scheduler: Scheduler;
  
  // Test job mocks
  const mockTask1 = jest.fn().mockResolvedValue(undefined);
  const mockTask2 = jest.fn().mockResolvedValue(undefined);
  const mockFailingTask = jest.fn().mockRejectedValue(new Error('Task failed'));
  
  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new Scheduler();
  });
  
  afterEach(() => {
    // Stop the scheduler to prevent memory leaks
    scheduler.stop();
  });
  
  describe('addJob', () => {
    it('should add a job to the scheduler', () => {
      scheduler.addJob('test-job', 5, mockTask1);
      
      // Get job status to verify it was added
      const status = scheduler.getStatus();
      
      expect(status).toHaveLength(1);
      expect(status[0].name).toBe('test-job');
      expect(status[0].intervalMinutes).toBe(5);
      expect(status[0].isRunning).toBe(false);
    });
    
    it('should add multiple jobs to the scheduler', () => {
      scheduler.addJob('job-1', 5, mockTask1);
      scheduler.addJob('job-2', 10, mockTask2);
      
      const status = scheduler.getStatus();
      
      expect(status).toHaveLength(2);
      expect(status[0].name).toBe('job-1');
      expect(status[1].name).toBe('job-2');
    });
  });
  
  describe('start', () => {
    it('should start all added jobs', () => {
      // Add jobs
      scheduler.addJob('job-1', 5, mockTask1);
      scheduler.addJob('job-2', 10, mockTask2);
      
      // Start the scheduler
      scheduler.start();
      
      // Get status to verify jobs are running
      const status = scheduler.getStatus();
      
      expect(status[0].isRunning).toBe(true);
      expect(status[1].isRunning).toBe(true);
      
      // First job should run immediately
      expect(mockTask1).toHaveBeenCalled();
      // Second job should also run immediately
      expect(mockTask2).toHaveBeenCalled();
    });
    
    it('should not restart already running jobs', () => {
      // Add and start job
      scheduler.addJob('job-1', 5, mockTask1);
      scheduler.start();
      
      // Clear mock to test if it's called again
      mockTask1.mockClear();
      
      // Start again
      scheduler.start();
      
      // Should not call the task again immediately
      expect(mockTask1).not.toHaveBeenCalled();
    });
  });
  
  describe('stop', () => {
    it('should stop all running jobs', () => {
      // Add and start jobs
      scheduler.addJob('job-1', 5, mockTask1);
      scheduler.addJob('job-2', 10, mockTask2);
      scheduler.start();
      
      // Stop the scheduler
      scheduler.stop();
      
      // Get status to verify jobs are stopped
      const status = scheduler.getStatus();
      
      expect(status[0].isRunning).toBe(false);
      expect(status[1].isRunning).toBe(false);
    });
  });
  
  describe('running jobs', () => {
    it('should execute jobs at scheduled intervals', () => {
      // Add a job that runs every 5 minutes
      scheduler.addJob('interval-job', 5, mockTask1);
      scheduler.start();
      
      // Clear initial call
      mockTask1.mockClear();
      
      // Advance time by 5 minutes
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // Job should have been called again
      expect(mockTask1).toHaveBeenCalledTimes(1);
      
      // Advance by another 5 minutes
      mockTask1.mockClear();
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      expect(mockTask1).toHaveBeenCalledTimes(1);
    });
    
    it('should handle job failures gracefully', async () => {
      // Add a job that will fail
      scheduler.addJob('failing-job', 5, mockFailingTask);
      scheduler.start();
      
      // Allow the promise to resolve/reject
      await Promise.resolve();
      
      // Should log the error
      expect(storage.createLog).toHaveBeenCalledWith(expect.objectContaining({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: expect.stringContaining('Job failing-job failed'),
      }));
      
      // Job should still be marked as running
      const status = scheduler.getStatus();
      expect(status[0].isRunning).toBe(true);
      
      // Should run again after interval even if it failed
      mockFailingTask.mockClear();
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      expect(mockFailingTask).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getStatus', () => {
    it('should return correct status information for jobs', () => {
      // Add a job
      scheduler.addJob('status-job', 15, mockTask1);
      
      // Mock the current time
      const now = new Date();
      jest.setSystemTime(now);
      
      // Start the job to set lastRun
      scheduler.start();
      
      // Get status
      const status = scheduler.getStatus();
      
      expect(status).toHaveLength(1);
      expect(status[0]).toEqual(expect.objectContaining({
        name: 'status-job',
        intervalMinutes: 15,
        isRunning: true,
        lastRun: now,
        nextRun: new Date(now.getTime() + 15 * 60 * 1000)
      }));
    });
    
    it('should return empty array when no jobs are added', () => {
      const status = scheduler.getStatus();
      expect(status).toEqual([]);
    });
  });
});