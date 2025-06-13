export class AgentTaskQueue {
  private queue: string[] = [];
  private runningTasks: Set<string> = new Set();
  private processing = false;

  enqueue(taskId: string) {
    this.queue.push(taskId);
  }

  dequeue(): string | undefined {
    return this.queue.shift();
  }

  markRunning(taskId: string) {
    this.runningTasks.add(taskId);
  }

  markComplete(taskId: string) {
    this.runningTasks.delete(taskId);
  }

  isProcessing() {
    return this.processing;
  }

  setProcessing(value: boolean) {
    this.processing = value;
  }

  getQueue() {
    return [...this.queue];
  }
  getRunningTasks() {
    return new Set(this.runningTasks);
  }
}
