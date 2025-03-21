/**
 * Tool Registry
 * 
 * This file implements the tool registry which maintains a registry of all
 * tools and handles tool discovery and lookup.
 */

import { Tool } from '../interfaces/tool-interface';

/**
 * Interface for the Tool Registry
 */
export interface IToolRegistry {
  registerTool(tool: Tool): void;
  unregisterTool(toolName: string): boolean;
  getTool(toolName: string): Tool | undefined;
  getAllTools(): Tool[];
  getToolsByCategory(category: string): Tool[];
}

/**
 * Implementation of the Tool Registry
 */
class ToolRegistryImpl implements IToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  
  /**
   * Register a tool with the registry
   */
  public registerTool(tool: Tool): void {
    const toolName = tool.name;
    
    // Check if tool is already registered
    if (this.tools.has(toolName)) {
      console.warn(`Tool with name ${toolName} already registered`);
      return;
    }
    
    // Store the tool
    this.tools.set(toolName, tool);
    
    // Index by category if available
    if (tool.category) {
      if (!this.categoryIndex.has(tool.category)) {
        this.categoryIndex.set(tool.category, new Set());
      }
      this.categoryIndex.get(tool.category)?.add(toolName);
    }
    
    console.log(`Tool registered: ${toolName} (${tool.description})`);
  }
  
  /**
   * Unregister a tool from the registry
   */
  public unregisterTool(toolName: string): boolean {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return false;
    }
    
    // Remove from main store
    this.tools.delete(toolName);
    
    // Remove from category index if available
    if (tool.category) {
      this.categoryIndex.get(tool.category)?.delete(toolName);
      // Clean up empty sets
      if (this.categoryIndex.get(tool.category)?.size === 0) {
        this.categoryIndex.delete(tool.category);
      }
    }
    
    console.log(`Tool unregistered: ${toolName}`);
    return true;
  }
  
  /**
   * Get a tool by name
   */
  public getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }
  
  /**
   * Get all registered tools
   */
  public getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Get tools by category
   */
  public getToolsByCategory(category: string): Tool[] {
    const toolNames = this.categoryIndex.get(category);
    if (!toolNames || toolNames.size === 0) {
      return [];
    }
    
    return Array.from(toolNames)
      .map(name => this.tools.get(name))
      .filter((tool): tool is Tool => tool !== undefined);
  }
}

/**
 * Singleton instance of the Tool Registry
 */
export const toolRegistry = new ToolRegistryImpl();