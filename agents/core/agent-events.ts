import { EventEmitter } from 'events';
import { Agent } from '../interfaces/agent-interface';

export class AgentEventHandler extends EventEmitter {
  constructor(private agent: Agent) {
    super();
  }
  registerEventHandlers() {
    this.on('taskAdded', (task) => this.agent.handleTaskAdded(task));
    this.on('taskCanceled', (taskId) => this.agent.handleTaskCanceled(taskId));
  }
}
