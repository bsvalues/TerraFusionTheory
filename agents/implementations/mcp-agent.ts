/**
 * MCP-Enabled Agent Implementation
 * 
 * This file implements a specialized agent that leverages the Model Control Protocol (MCP)
 * for enhanced AI capabilities and reasoning.
 */

import { v4 as uuidv4 } from 'uuid';
import { AgentCapability, AgentConfig, AgentTask } from '../interfaces/agent-interface';
import { GenericAgent } from '../core/agent-base';
import { mcpConnector } from '../tools/mcp';
import { LogLevel } from '../../shared/schema';

/**
 * MCP Agent configuration
 */
export interface MCPAgentConfig extends AgentConfig {
  mcp: {
    defaultModel?: string;
    temperature?: number;
    systemPrompt?: string;
  };
  promptTemplates?: Record<string, string>;
}

/**
 * Task types supported by the MCP agent
 */
export enum MCPAgentTaskType {
  GENERATE_TEXT = 'generate_text',
  ANSWER_QUESTION = 'answer_question',
  ANALYZE_DATA = 'analyze_data',
  GENERATE_CODE = 'generate_code',
  CREATE_PLAN = 'create_plan',
  EVALUATE = 'evaluate',
  SUMMARIZE = 'summarize',
  EXTRACT_INFO = 'extract_info'
}

/**
 * Agent implementation that uses MCP for advanced AI capabilities
 */
export class MCPAgent extends GenericAgent {
  private mcpConfig: MCPAgentConfig['mcp'];
  private promptTemplates: Record<string, string>;
  
  constructor(id: string = uuidv4(), config: MCPAgentConfig) {
    // Ensure required capabilities
    const requiredCapabilities = [
      AgentCapability.TEXT_GENERATION,
      AgentCapability.TEXT_UNDERSTANDING,
      AgentCapability.TOOL_USE
    ];
    
    // Add required capabilities if they don't exist
    for (const capability of requiredCapabilities) {
      if (!config.capabilities.includes(capability)) {
        config.capabilities.push(capability);
      }
    }
    
    // Add MCP tool if not already in tools list
    config.tools = config.tools || [];
    if (!config.tools.includes('mcp')) {
      config.tools.push('mcp');
    }
    
    super(id, config);
    
    // Store MCP-specific config
    this.mcpConfig = {
      defaultModel: 'gpt-4-turbo',
      temperature: 0.7,
      ...config.mcp
    };
    
    // Store prompt templates
    this.promptTemplates = {
      default: `You are {{agentName}}, an AI assistant specialized in {{agentDescription}}. 
Answer the user's request based on the information provided.`,
      
      answerQuestion: `You are {{agentName}}, an AI assistant specialized in {{agentDescription}}.
Answer the following question based on your knowledge:

QUESTION: {{question}}

Provide a detailed and accurate answer.`,
      
      analyzeData: `You are {{agentName}}, an AI assistant specialized in {{agentDescription}}.
Analyze the following data:

DATA: {{data}}

INSTRUCTIONS: {{instructions}}

Provide insights, patterns, and conclusions based on this data.`,
      
      generateCode: `You are {{agentName}}, an AI assistant specialized in {{agentDescription}}.
Generate code according to the following requirements:

REQUIREMENTS: {{requirements}}
LANGUAGE: {{language}}

Provide well-structured, documented code that meets these requirements.`,
      
      createPlan: `You are {{agentName}}, an AI assistant specialized in {{agentDescription}}.
Create a detailed plan for the following objective:

OBJECTIVE: {{objective}}
CONSTRAINTS: {{constraints}}

Provide a step-by-step plan with estimated timelines and resource requirements if applicable.`,
      
      ...(config.promptTemplates || {})
    };
  }
  
  /**
   * Handle a task based on its type
   */
  protected async handleTask(task: AgentTask): Promise<any> {
    switch(task.type) {
      case MCPAgentTaskType.GENERATE_TEXT:
        return this.handleGenerateTextTask(task);
      
      case MCPAgentTaskType.ANSWER_QUESTION:
        return this.handleAnswerQuestionTask(task);
        
      case MCPAgentTaskType.ANALYZE_DATA:
        return this.handleAnalyzeDataTask(task);
        
      case MCPAgentTaskType.GENERATE_CODE:
        return this.handleGenerateCodeTask(task);
        
      case MCPAgentTaskType.CREATE_PLAN:
        return this.handleCreatePlanTask(task);
        
      case MCPAgentTaskType.EVALUATE:
        return this.handleEvaluateTask(task);
        
      case MCPAgentTaskType.SUMMARIZE:
        return this.handleSummarizeTask(task);
        
      case MCPAgentTaskType.EXTRACT_INFO:
        return this.handleExtractInfoTask(task);
        
      default:
        throw new Error(`Unsupported task type: ${task.type}`);
    }
  }
  
  /**
   * Handle a generate text task
   */
  private async handleGenerateTextTask(task: AgentTask): Promise<any> {
    const { prompt, options = {} } = task.inputs;
    
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Generate text task requires a prompt input');
    }
    
    const result = await this.useTool('mcp', {
      prompt,
      options: {
        systemPrompt: this.getSystemPrompt(options.template || 'default', options.templateData),
        model: options.model || this.mcpConfig.defaultModel,
        temperature: options.temperature || this.mcpConfig.temperature,
        maxTokens: options.maxTokens,
        ...options
      }
    });
    
    // Store in vector memory if enabled
    if (this.hasCapability(AgentCapability.VECTOR_SEARCH) && options.storeInMemory !== false) {
      await this.addToVectorMemory(prompt, {
        type: 'input',
        taskId: task.id,
        timestamp: Date.now()
      });
      
      await this.addToVectorMemory(result.content, {
        type: 'output',
        taskId: task.id,
        prompt,
        timestamp: Date.now()
      });
    }
    
    return result;
  }
  
  /**
   * Handle an answer question task
   */
  private async handleAnswerQuestionTask(task: AgentTask): Promise<any> {
    const { question, options = {} } = task.inputs;
    
    if (!question || typeof question !== 'string') {
      throw new Error('Answer question task requires a question input');
    }
    
    // Check vector memory for similar questions if capability is available
    let memoryContext = '';
    if (this.hasCapability(AgentCapability.VECTOR_SEARCH) && options.useMemory !== false) {
      const memoryResults = await this.searchVectorMemory(question, {
        limit: 3,
        threshold: 0.8
      });
      
      if (memoryResults && memoryResults.length > 0) {
        memoryContext = `\n\nRELEVANT INFORMATION FROM MEMORY:\n${memoryResults.map(r => 
          `[Memory Item ${r.id}]: ${r.content}`
        ).join('\n\n')}`;
      }
    }
    
    // Use the appropriate template
    const templateData = {
      question,
      ...options.templateData
    };
    
    const prompt = `${question}${memoryContext}`;
    
    // Call MCP to answer
    const result = await this.useTool('mcp', {
      prompt,
      options: {
        systemPrompt: this.getSystemPrompt(options.template || 'answerQuestion', templateData),
        model: options.model || this.mcpConfig.defaultModel,
        temperature: options.temperature || this.mcpConfig.temperature,
        maxTokens: options.maxTokens,
        ...options
      }
    });
    
    // Store in vector memory if enabled
    if (this.hasCapability(AgentCapability.VECTOR_SEARCH) && options.storeInMemory !== false) {
      await this.addToVectorMemory(question, {
        type: 'question',
        taskId: task.id,
        timestamp: Date.now()
      });
      
      await this.addToVectorMemory(result.content, {
        type: 'answer',
        taskId: task.id,
        question,
        timestamp: Date.now()
      });
    }
    
    return result;
  }
  
  /**
   * Handle an analyze data task
   */
  private async handleAnalyzeDataTask(task: AgentTask): Promise<any> {
    const { data, instructions, options = {} } = task.inputs;
    
    if (!data) {
      throw new Error('Analyze data task requires data input');
    }
    
    // Convert data to string if it's an object
    const dataString = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    
    // Use the appropriate template
    const templateData = {
      data: dataString,
      instructions: instructions || 'Analyze this data and provide insights.',
      ...options.templateData
    };
    
    // Call MCP to analyze
    const result = await this.useTool('mcp', {
      prompt: `DATA TO ANALYZE:\n${dataString}\n\nINSTRUCTIONS:\n${instructions || 'Analyze this data and provide insights.'}`,
      options: {
        systemPrompt: this.getSystemPrompt(options.template || 'analyzeData', templateData),
        model: options.model || this.mcpConfig.defaultModel,
        temperature: options.temperature || this.mcpConfig.temperature,
        maxTokens: options.maxTokens,
        ...options
      }
    });
    
    return result;
  }
  
  /**
   * Handle a generate code task
   */
  private async handleGenerateCodeTask(task: AgentTask): Promise<any> {
    const { requirements, language, options = {} } = task.inputs;
    
    if (!requirements || typeof requirements !== 'string') {
      throw new Error('Generate code task requires requirements input');
    }
    
    // Use the appropriate template
    const templateData = {
      requirements,
      language: language || 'javascript',
      ...options.templateData
    };
    
    // Call MCP to generate code
    const result = await this.useTool('mcp', {
      prompt: `REQUIREMENTS:\n${requirements}\n\nLANGUAGE: ${language || 'javascript'}`,
      options: {
        systemPrompt: this.getSystemPrompt(options.template || 'generateCode', templateData),
        model: options.model || this.mcpConfig.defaultModel,
        temperature: options.temperature || 0.3, // Lower temperature for code
        maxTokens: options.maxTokens,
        ...options
      }
    });
    
    return result;
  }
  
  /**
   * Handle a create plan task
   */
  private async handleCreatePlanTask(task: AgentTask): Promise<any> {
    const { objective, constraints, options = {} } = task.inputs;
    
    if (!objective || typeof objective !== 'string') {
      throw new Error('Create plan task requires an objective input');
    }
    
    // Use the appropriate template
    const templateData = {
      objective,
      constraints: constraints || 'None specified',
      ...options.templateData
    };
    
    // Call MCP to create plan
    const result = await this.useTool('mcp', {
      prompt: `OBJECTIVE:\n${objective}\n\nCONSTRAINTS:\n${constraints || 'None specified'}`,
      options: {
        systemPrompt: this.getSystemPrompt(options.template || 'createPlan', templateData),
        model: options.model || this.mcpConfig.defaultModel,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens,
        ...options
      }
    });
    
    return result;
  }
  
  /**
   * Handle an evaluate task
   */
  private async handleEvaluateTask(task: AgentTask): Promise<any> {
    const { content, criteria, options = {} } = task.inputs;
    
    if (!content) {
      throw new Error('Evaluate task requires content input');
    }
    
    const contentString = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    
    // Create a custom system prompt for evaluation
    const systemPrompt = `You are ${this.getName()}, an objective evaluator specialized in ${this.getDescription()}.
Your task is to evaluate the provided content based on the specified criteria.
Be thorough, fair, and constructive in your evaluation.
Provide both strengths and areas for improvement.`;
    
    // Call MCP to evaluate
    const result = await this.useTool('mcp', {
      prompt: `CONTENT TO EVALUATE:\n${contentString}\n\nEVALUATION CRITERIA:\n${criteria || 'General quality and correctness'}`,
      options: {
        systemPrompt,
        model: options.model || this.mcpConfig.defaultModel,
        temperature: options.temperature || 0.3, // Lower temperature for evaluation
        maxTokens: options.maxTokens,
        ...options
      }
    });
    
    return result;
  }
  
  /**
   * Handle a summarize task
   */
  private async handleSummarizeTask(task: AgentTask): Promise<any> {
    const { content, length, options = {} } = task.inputs;
    
    if (!content) {
      throw new Error('Summarize task requires content input');
    }
    
    const contentString = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    
    // Create a custom system prompt for summarization
    const systemPrompt = `You are ${this.getName()}, an expert summarizer specialized in ${this.getDescription()}.
Your task is to create a ${length || 'concise'} summary of the provided content.
Capture the key points, main arguments, and important details.
Ensure the summary is coherent, accurate, and balanced.`;
    
    // Call MCP to summarize
    const result = await this.useTool('mcp', {
      prompt: `CONTENT TO SUMMARIZE:\n${contentString}\n\nDESIRED LENGTH: ${length || 'Concise'}`,
      options: {
        systemPrompt,
        model: options.model || this.mcpConfig.defaultModel,
        temperature: options.temperature || 0.5,
        maxTokens: options.maxTokens,
        ...options
      }
    });
    
    return result;
  }
  
  /**
   * Handle an extract info task
   */
  private async handleExtractInfoTask(task: AgentTask): Promise<any> {
    const { content, schema, options = {} } = task.inputs;
    
    if (!content) {
      throw new Error('Extract info task requires content input');
    }
    
    const contentString = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    let schemaString = 'Extract the relevant information in JSON format.';
    
    if (schema) {
      schemaString = typeof schema === 'object' 
        ? `Extract the information according to this schema: ${JSON.stringify(schema, null, 2)}`
        : `Extract the information according to these instructions: ${schema}`;
    }
    
    // Create a custom system prompt for extraction
    const systemPrompt = `You are ${this.getName()}, an expert at information extraction specialized in ${this.getDescription()}.
Your task is to extract structured information from the provided content.
Be precise and thorough in your extraction.
Return the extracted information in the requested format.`;
    
    // Call MCP to extract
    const result = await this.useTool('mcp', {
      prompt: `CONTENT TO EXTRACT FROM:\n${contentString}\n\nEXTRACTION INSTRUCTIONS:\n${schemaString}`,
      options: {
        systemPrompt,
        model: options.model || this.mcpConfig.defaultModel,
        temperature: options.temperature || 0.2, // Low temperature for extraction
        maxTokens: options.maxTokens,
        ...options
      }
    });
    
    return result;
  }
  
  /**
   * Get a system prompt from the templates
   */
  private getSystemPrompt(templateName: string, data?: Record<string, any>): string {
    let template = this.promptTemplates[templateName] || this.promptTemplates.default;
    
    // Replace template variables
    const templateData = {
      agentName: this.getName(),
      agentDescription: this.getDescription(),
      ...data
    };
    
    // Replace {{variableName}} with actual values
    for (const [key, value] of Object.entries(templateData)) {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    
    return template;
  }
  
  /**
   * Log that a prompt is being sent
   */
  private logPrompt(prompt: string, systemPrompt: string, level: LogLevel = LogLevel.INFO): void {
    this.logActivity('Sending prompt to MCP', level, {
      promptLength: prompt.length,
      systemPromptLength: systemPrompt.length,
      promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
    });
  }
}