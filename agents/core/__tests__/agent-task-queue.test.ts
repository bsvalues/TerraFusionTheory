import { AgentTaskQueue } from '../agent-task-queue';

describe('AgentTaskQueue', () => {
  it('should enqueue and dequeue tasks', () => {
    const queue = new AgentTaskQueue();
    queue.enqueue('task1');
    queue.enqueue('task2');
    expect(queue.dequeue()).toBe('task1');
    expect(queue.dequeue()).toBe('task2');
    expect(queue.dequeue()).toBeUndefined();
  });

  it('should track running tasks', () => {
    const queue = new AgentTaskQueue();
    queue.markRunning('task1');
    expect(queue.getRunningTasks().has('task1')).toBe(true);
    queue.markComplete('task1');
    expect(queue.getRunningTasks().has('task1')).toBe(false);
  });

  it('should set and get processing state', () => {
    const queue = new AgentTaskQueue();
    queue.setProcessing(true);
    expect(queue.isProcessing()).toBe(true);
    queue.setProcessing(false);
    expect(queue.isProcessing()).toBe(false);
  });
});
