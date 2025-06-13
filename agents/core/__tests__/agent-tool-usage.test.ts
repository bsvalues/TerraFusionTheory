import { AgentToolUsage } from '../agent-tool-usage';

describe('AgentToolUsage', () => {
  it('should use a tool by name', () => {
    const tool = {
      name: 'testTool',
      execute: jest.fn().mockReturnValue('result')
    };
    const usage = new AgentToolUsage([tool as any]);
    expect(usage.useTool('testTool', {})).toBe('result');
    expect(() => usage.useTool('nonexistent', {})).toThrow('Tool not found');
  });
});
