/**
 * MCP Connector Tool
 * 
 * This tool provides integration with the MCP (Model Control Protocol) for enhanced
 * AI model interactions. It enables agents to leverage MCP's advanced features like
 * context fusion, semantic search, and specialized reasoning.
 */

import { v4 as uuidv4 } from 'uuid';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';
import * as enhancedAIService from '../../server/services/enhanced-ai.service';
import { ToolResult, ToolContext } from '../interfaces/tool-interface';
import { AgentCapability } from '../interfaces/agent-interface';

// MCP Tool Configuration
export interface MCPConfig {
  endpoint?: string;
  apiKey?: string;
  defaultModel?: string;
  maxContextTokens?: number;
  temperature?: number;
  topP?: number;
  useCache?: boolean;
  cacheTTL?: number; // Cache time-to-live in seconds
  timeout?: number; // Request timeout in milliseconds
}

// MCP Request parameters
export interface MCPRequestParams {
  prompt: string;
  context?: Record<string, any>;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  functions?: any[];
  functionCall?: string | { name: string };
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  logitBias?: Record<string, number>;
  // Add other parameters as needed
}

// MCP Response format
export interface MCPResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      function_call?: {
        name: string;
        arguments: string;
      };
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cached?: boolean;
}

/**
 * MCP Connector Tool for agent integration with MCP
 */
export class MCPConnector {
  private static instance: MCPConnector;
  private config: MCPConfig;
  private cache: Map<string, { timestamp: number; response: MCPResponse }>;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor(config: MCPConfig = {}) {
    this.config = {
      endpoint: process.env.MCP_ENDPOINT || 'https://api.mcp-service.io/v1',
      apiKey: process.env.MCP_API_KEY,
      defaultModel: 'gpt-4-turbo',
      maxContextTokens: 16000,
      temperature: 0.7,
      topP: 1.0,
      useCache: true,
      cacheTTL: 3600, // 1 hour cache by default
      timeout: 30000, // 30 seconds timeout by default
      ...config
    };
    
    this.cache = new Map();
    
    // Log initialization
    this.logActivity('Initialized MCP Connector', LogLevel.INFO);
  }
  
  /**
   * Get singleton instance of MCP Connector
   */
  public static getInstance(config?: MCPConfig): MCPConnector {
    if (!MCPConnector.instance) {
      MCPConnector.instance = new MCPConnector(config);
    }
    return MCPConnector.instance;
  }
  
  /**
   * Update MCP configuration
   */
  public updateConfig(config: Partial<MCPConfig>): void {
    this.config = { ...this.config, ...config };
    this.logActivity(`Updated MCP configuration`, LogLevel.INFO, { config });
  }
  
  /**
   * Get current configuration
   */
  public getConfig(): MCPConfig {
    return { ...this.config };
  }
  
  /**
   * Clear the response cache
   */
  public clearCache(): void {
    const cacheSize = this.cache.size;
    this.cache.clear();
    this.logActivity(`Cleared MCP response cache (${cacheSize} items)`, LogLevel.INFO);
  }
  
  /**
   * Send a request to the MCP endpoint
   */
  public async sendRequest(params: MCPRequestParams): Promise<MCPResponse> {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    try {
      // Check cache if enabled
      if (this.config.useCache) {
        const cacheKey = this.generateCacheKey(params);
        const cachedItem = this.cache.get(cacheKey);
        
        if (cachedItem && (Date.now() - cachedItem.timestamp) < (this.config.cacheTTL || 3600) * 1000) {
          this.logActivity('Using cached MCP response', LogLevel.INFO, { 
            requestId,
            cacheKey,
            cachedAt: new Date(cachedItem.timestamp).toISOString() 
          });
          return { ...cachedItem.response, cached: true };
        }
      }
      
      // Prepare request
      const requestParams = this.prepareRequestParams(params);
      
      // Log request (sanitized)
      this.logActivity('Sending MCP request', LogLevel.INFO, {
        requestId,
        model: requestParams.model,
        maxTokens: requestParams.maxTokens,
        temperature: requestParams.temperature
      });
      
      // Send request to MCP
      const response = await this.makeRequest(requestParams);
      
      // Cache the response if caching is enabled
      if (this.config.useCache) {
        const cacheKey = this.generateCacheKey(params);
        this.cache.set(cacheKey, {
          timestamp: Date.now(),
          response
        });
      }
      
      // Log success
      const duration = Date.now() - startTime;
      this.logActivity('Received MCP response', LogLevel.INFO, {
        requestId,
        duration,
        model: response.model,
        usage: response.usage
      });
      
      return response;
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      this.logActivity('MCP request failed', LogLevel.ERROR, {
        requestId,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Execute the MCP tool with a context
   */
  public async execute(context: ToolContext): Promise<ToolResult> {
    try {
      const { prompt, options = {} } = context.inputs;
      
      if (!prompt || typeof prompt !== 'string') {
        return {
          success: false,
          error: 'No prompt provided or prompt is not a string'
        };
      }
      
      // Prepare system prompt based on agent context if available
      let systemPrompt = options.systemPrompt;
      if (!systemPrompt && context.agent) {
        systemPrompt = `You are an AI assistant specialized in ${context.agent.getDescription()}. Your name is ${context.agent.getName()}.`;
      }
      
      // Prepare MCP request
      const requestParams: MCPRequestParams = {
        prompt: prompt,
        systemPrompt: systemPrompt,
        model: options.model || this.config.defaultModel,
        temperature: options.temperature || this.config.temperature,
        maxTokens: options.maxTokens,
        topP: options.topP || this.config.topP,
        stopSequences: options.stopSequences,
        functions: options.functions,
        functionCall: options.functionCall,
        context: context.agentContext || {}
      };
      
      // Send request to MCP
      const response = await this.sendRequest(requestParams);
      
      // Extract and return relevant parts of the response
      return {
        success: true,
        result: {
          content: response.choices[0]?.message.content || '',
          function_call: response.choices[0]?.message.function_call,
          model: response.model,
          usage: response.usage,
          cached: response.cached || false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Get required capabilities for using this tool
   */
  public getRequiredCapabilities(): AgentCapability[] {
    return [AgentCapability.TEXT_GENERATION];
  }
  
  /**
   * Make the actual HTTP request to MCP
   * This method can be implemented to actually make the API call
   * For now, we'll use the enhancedAIService as a proxy
   */
  private async makeRequest(params: any): Promise<MCPResponse> {
    // In a real implementation, this would make an actual request to the MCP endpoint
    // For now, we'll use the enhancedAIService as a proxy
    const result = await enhancedAIService.enhancedAIService.analyzeMessage(
      params.prompt,
      0, // projectId - not relevant here
      null, // userId - not relevant here
      uuidv4(), // sessionId
      'openai' // provider
    );
    
    // Format the response to match the expected MCP response format
    return {
      id: uuidv4(),
      object: 'chat.completion',
      created: Date.now(),
      model: params.model || this.config.defaultModel,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: this.estimateTokens(params.prompt),
        completion_tokens: this.estimateTokens(result),
        total_tokens: this.estimateTokens(params.prompt) + this.estimateTokens(result)
      }
    };
  }
  
  /**
   * Prepare request parameters for MCP
   */
  private prepareRequestParams(params: MCPRequestParams): any {
    return {
      model: params.model || this.config.defaultModel,
      messages: [
        ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
        { role: 'user', content: params.prompt }
      ],
      temperature: params.temperature || this.config.temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP || this.config.topP,
      stop: params.stopSequences,
      functions: params.functions,
      function_call: params.functionCall,
      logit_bias: params.logitBias
    };
  }
  
  /**
   * Generate a cache key for a set of request parameters
   */
  private generateCacheKey(params: MCPRequestParams): string {
    // Create a deterministic string representation of the params for caching
    const keyParts = [
      params.prompt,
      params.systemPrompt || '',
      params.model || this.config.defaultModel,
      params.temperature || this.config.temperature,
      params.maxTokens || 'default',
      params.topP || this.config.topP
    ];
    
    return keyParts.join('::');
  }
  
  /**
   * Very simple token estimator (not accurate, just for usage estimation)
   */
  private estimateTokens(text: string = ''): number {
    // Rough estimation: ~4 chars per token on average
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Log activity to the storage system
   */
  private async logActivity(message: string, level: LogLevel, details?: any): Promise<void> {
    try {
      await storage.createLog({
        level,
        category: LogCategory.AI,
        message: `[MCP] ${message}`,
        details: details ? JSON.stringify(details) : null,
        source: 'mcp-connector',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['mcp', 'ai', 'tool']
      });
    } catch (error) {
      console.error('Failed to log MCP activity:', error);
    }
  }
}

// Export a singleton instance
export const mcpConnector = MCPConnector.getInstance();

// Tool registration function
export function registerMCPTool() {
  return {
    name: 'mcp',
    description: 'Interact with MCP (Model Control Protocol) for enhanced AI capabilities',
    execute: mcpConnector.execute.bind(mcpConnector),
    requiredCapabilities: mcpConnector.getRequiredCapabilities()
  };
}