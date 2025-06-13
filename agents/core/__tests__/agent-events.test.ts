import { AgentEventHandler } from '../agent-events';

describe('AgentEventHandler', () => {
  it('should register event handlers and emit events', () => {
    const agentMock = {
      handleTaskAdded: jest.fn(),
      handleTaskCanceled: jest.fn()
    };
    const handler = new AgentEventHandler(agentMock as any);
    handler.registerEventHandlers();
    handler.emit('taskAdded', 'task1');
    handler.emit('taskCanceled', 'task1');
    expect(agentMock.handleTaskAdded).toHaveBeenCalledWith('task1');
    expect(agentMock.handleTaskCanceled).toHaveBeenCalledWith('task1');
  });
});
