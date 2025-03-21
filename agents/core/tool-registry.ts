/**
 * Tool Registry
 * 
 * This module provides a registry for all agent tools, allowing agents to
 * discover, validate, and use tools based on their capabilities.
 */

import { Tool, ToolRegistry as IToolRegistry } from '../interfaces/tool-interface';
import { AgentCapability } from '../interfaces/agent-interface';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';

/**
 * Tool Registry implementation that stores and manages all available tools
 */
export class ToolRegistry implements IToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, Tool> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.logActivity('Initialized tool registry', LogLevel.INFO);
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }
  
  /**
   * Register a new tool in the registry
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      this.logActivity(`Tool with name '${tool.name}' already registered, replacing`, LogLevel.WARNING);
    }
    
    this.tools.set(tool.name, tool);
    this.logActivity(`Registered tool: ${tool.name}`, LogLevel.INFO, {
      description: tool.description,
      requiredCapabilities: tool.requiredCapabilities
    });
  }
  
  /**
   * Get a tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Get tools that require specific capabilities
   */
  getToolsForCapabilities(capabilities: AgentCapability[]): Tool[] {
    return this.getAllTools().filter(tool => {
      // Check if all required capabilities for this tool are present
      return tool.requiredCapabilities.every(required => 
        capabilities.includes(required)
      );
    });
  }
  
  /**
   * Remove a tool from the registry
   */
  unregisterTool(name: string): boolean {
    const removed = this.tools.delete(name);
    if (removed) {
      this.logActivity(`Unregistered tool: ${name}`, LogLevel.INFO);
    }
    return removed;
  }
  
  /**
   * Log activity to the storage system
   */
  private async logActivity(message: string, level: LogLevel, details?: any): Promise<void> {
    try {
      await storage.createLog({
        level,
        category: LogCategory.SYSTEM,
        message: `[ToolRegistry] ${message}`,
        details: details ? JSON.stringify(details) : null,
        source: 'tool-registry',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['tool', 'registry', 'agent']
      });
    } catch (error) {
      console.error('Failed to log tool registry activity:', error);
    }
  }
}

// Export singleton instance
export const toolRegistry = ToolRegistry.getInstance();