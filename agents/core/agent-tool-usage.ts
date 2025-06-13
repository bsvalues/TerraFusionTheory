import { Tool } from '../interfaces/tool-interface';

export class AgentToolUsage {
  constructor(private tools: Tool[]) {}

  useTool(toolName: string, input: any): any {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) throw new Error('Tool not found');
    return tool.execute(input);
  }
}
