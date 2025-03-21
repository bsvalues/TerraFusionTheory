/**
 * Developer Agent Implementation
 * 
 * This file implements a specialized agent for development tasks like
 * code generation, debugging, and technical advice.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentCapability, AgentConfig, AgentStatus, AgentTask, BaseAgent, ExecutionResult } from '../interfaces/agent-interface';
import { Tool } from '../interfaces/tool-interface';
import { toolRegistry } from '../core/tool-registry';
import { vectorMemory, MemoryEntry } from '../memory/vector';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';

/**
 * Configuration specific to developer agents
 */
export interface DeveloperAgentConfig extends AgentConfig {
  specializations?: string[]; // e.g. 'frontend', 'backend', 'database', etc.
  preferredLanguages?: string[]; // e.g. 'javascript', 'typescript', 'python', etc.
  defaultStyle?: 'concise' | 'detailed' | 'explanatory';
  customPromptTemplate?: string;
}

/**
 * Implementation of a specialized agent for development tasks
 */
export class DeveloperAgent extends BaseAgent implements Agent {
  protected specializations: string[];
  protected preferredLanguages: string[];
  protected defaultStyle: 'concise' | 'detailed' | 'explanatory';
  protected customPromptTemplate?: string;
  protected codeKnowledgeBase: Map<string, string> = new Map();
  
  constructor(id: string, config: DeveloperAgentConfig) {
    // Create a local copy of capabilities array for modification
    const capabilities = [
      ...(config.capabilities || []),
      AgentCapability.CODE_GENERATION,
      AgentCapability.CODE_UNDERSTANDING,
      AgentCapability.TEXT_GENERATION,
      AgentCapability.TEXT_UNDERSTANDING,
      AgentCapability.TOOL_USE
    ];
    
    // Store the specializations first so we can use them for capability determination
    this.specializations = config.specializations || [];
    this.preferredLanguages = config.preferredLanguages || [];
    this.defaultStyle = config.defaultStyle || 'detailed';
    this.customPromptTemplate = config.customPromptTemplate;
    
    // Add specialization-specific capabilities
    if (this.specializations.includes('frontend')) {
      capabilities.push(AgentCapability.DATA_VISUALIZATION);
    }
    
    if (this.specializations.includes('devops')) {
      capabilities.push(AgentCapability.PLANNING);
    }
    
    // Initialize the base agent with the enhanced capabilities
    super(id, {
      ...config,
      capabilities
    });
  }
  
  /**
   * Get the type of the agent
   */
  public getType(): string {
    return 'developer';
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    console.log(`Initializing DeveloperAgent: ${this.getId()}`);
    
    // Load relevant tools
    // Ensure MCP tool is available
    const mcpTool = toolRegistry.getTool('mcp');
    if (mcpTool) {
      this.toolRegistry.add('mcp');
    }
    
    // Store initial knowledge in vector memory
    await this.storeInitialKnowledge();
    
    // Log initialization
    await this.logActivity('Developer agent initialized', LogLevel.INFO, {
      agentId: this.getId(),
      specializations: this.specializations,
      preferredLanguages: this.preferredLanguages,
      capabilities: this.getCapabilities()
    });
    
    this.status = AgentStatus.IDLE;
  }
  
  /**
   * Use a tool with the given inputs
   */
  public async useTool(toolName: string, inputs: Record<string, any>): Promise<any> {
    // Check if we have access to the tool
    if (!this.canUseTool(toolName)) {
      throw new Error(`Agent ${this.getId()} does not have access to tool: ${toolName}`);
    }
    
    // Get the tool from the registry
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    try {
      // Log tool usage
      await this.logActivity(`Using tool: ${toolName}`, LogLevel.INFO, {
        tool: toolName,
        inputs: JSON.stringify(inputs)
      });
      
      // Execute the tool
      const result = await tool.execute(inputs);
      
      // Remember the result in memory if successful
      if (result.success && toolName === 'mcp') {
        await this.storeToolResultInMemory(toolName, inputs, result.result);
      }
      
      return result;
    } catch (error) {
      // Log error
      await this.logActivity(`Error using tool: ${toolName}`, LogLevel.ERROR, {
        tool: toolName,
        inputs: JSON.stringify(inputs),
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Process a task assigned to the agent
   */
  protected async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    // Update task status
    task.status = 'running';
    task.startTime = Date.now();
    
    try {
      // Process based on task type
      switch (task.type) {
        case 'generate_code':
          await this.handleCodeGenerationTask(task);
          break;
        
        case 'review_code':
          await this.handleCodeReviewTask(task);
          break;
        
        case 'debug_code':
          await this.handleDebugTask(task);
          break;
        
        case 'answer_question':
          await this.handleQuestionTask(task);
          break;
        
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
      
      // Mark task as completed
      task.status = 'completed';
      task.endTime = Date.now();
      this.emit('taskCompleted', { agentId: this.getId(), taskId, task });
    } catch (error) {
      // Mark task as failed
      task.status = 'failed';
      task.endTime = Date.now();
      task.error = error instanceof Error ? error.message : String(error);
      
      this.emit('taskFailed', { agentId: this.getId(), taskId, task, error });
    }
  }
  
  /**
   * Handle code generation task
   */
  private async handleCodeGenerationTask(task: AgentTask): Promise<void> {
    const { language, requirements, context, style } = task.inputs;
    
    // Prepare the prompt for code generation
    const prompt = this.buildCodeGenerationPrompt(language, requirements, context, style || this.defaultStyle);
    
    // Use MCP tool to generate code
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.2, // Lower temperature for more precise code generation
      system_message: `You are a senior ${language} developer with expertise in writing clean, maintainable, and efficient code. Generate code that follows best practices and industry standards.`
    });
    
    if (!result.success) {
      throw new Error(`Code generation failed: ${result.error}`);
    }
    
    // Store the generated code
    const generatedCode = result.result.response;
    this.codeKnowledgeBase.set(`generated_${Date.now()}`, generatedCode);
    
    // Set the task result
    task.result = {
      code: generatedCode,
      language,
      generationProcess: "Used MCP with language model to generate code based on requirements."
    };
  }
  
  /**
   * Handle code review task
   */
  private async handleCodeReviewTask(task: AgentTask): Promise<void> {
    const { code, language, focus_areas } = task.inputs;
    
    // Prepare the prompt for code review
    const prompt = this.buildCodeReviewPrompt(code, language, focus_areas);
    
    // Use MCP tool to review code
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.3,
      system_message: `You are a senior code reviewer with expertise in ${language}. Provide a detailed and constructive review focusing on code quality, performance, maintainability, and security.`
    });
    
    if (!result.success) {
      throw new Error(`Code review failed: ${result.error}`);
    }
    
    // Set the task result
    task.result = {
      review: result.result.response,
      language,
      focusAreas: focus_areas
    };
  }
  
  /**
   * Handle debugging task
   */
  private async handleDebugTask(task: AgentTask): Promise<void> {
    const { code, language, error_message } = task.inputs;
    
    // Prepare the prompt for debugging
    const prompt = this.buildDebugPrompt(code, language, error_message);
    
    // Use MCP tool to debug code
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.3,
      system_message: `You are an expert debugger with deep knowledge of ${language}. Analyze the provided code and error message to identify the root cause and provide a clear solution.`
    });
    
    if (!result.success) {
      throw new Error(`Debugging failed: ${result.error}`);
    }
    
    // Set the task result
    task.result = {
      analysis: result.result.response,
      language,
      errorMessage: error_message
    };
  }
  
  /**
   * Handle general question task
   */
  private async handleQuestionTask(task: AgentTask): Promise<void> {
    const { question, context } = task.inputs;
    
    // Search relevant information in vector memory
    const memoryResults = await vectorMemory.search(question, { limit: 3, threshold: 0.7 });
    
    // Build context from relevant memories
    let contextFromMemory = '';
    if (memoryResults.length > 0) {
      contextFromMemory = "Relevant information from my knowledge base:\n" + 
        memoryResults.map(result => `- ${result.entry.text}`).join('\n');
    }
    
    // Prepare the prompt
    const prompt = `Question: ${question}\n\n${contextFromMemory}\n\n${context ? `Additional context: ${context}\n` : ''}Please provide a clear and helpful answer.`;
    
    // Use MCP tool to answer the question
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.7,
      system_message: 'You are a helpful and knowledgeable developer assistant. Provide clear, concise, and accurate answers to technical questions.'
    });
    
    if (!result.success) {
      throw new Error(`Failed to answer question: ${result.error}`);
    }
    
    // Set the task result
    task.result = {
      answer: result.result.response,
      sourcesUsed: memoryResults.map(result => ({
        text: result.entry.text.substring(0, 100) + (result.entry.text.length > 100 ? '...' : ''),
        relevanceScore: result.score
      }))
    };
    
    // Store the question and answer in memory for future reference
    await vectorMemory.addEntry(
      `Q: ${question}\nA: ${result.result.response}`,
      {
        source: 'question-answering',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'qa',
        tags: ['question', 'answer']
      }
    );
  }
  
  /**
   * Build prompt for code generation
   */
  private buildCodeGenerationPrompt(
    language: string,
    requirements: string,
    context?: string,
    style: 'concise' | 'detailed' | 'explanatory' = 'detailed'
  ): string {
    let prompt = `Generate ${language} code based on the following requirements:\n\n${requirements}\n\n`;
    
    if (context) {
      prompt += `Additional context:\n${context}\n\n`;
    }
    
    // Adjust based on style preference
    switch (style) {
      case 'concise':
        prompt += 'Provide only the code without explanations. Focus on brevity and clarity.';
        break;
      
      case 'detailed':
        prompt += 'Provide the code with helpful comments explaining key parts and decisions.';
        break;
      
      case 'explanatory':
        prompt += 'Provide the code with detailed comments and additional explanations about the approach, alternatives considered, and any important implementation details.';
        break;
    }
    
    return prompt;
  }
  
  /**
   * Build prompt for code review
   */
  private buildCodeReviewPrompt(
    code: string,
    language: string,
    focusAreas?: string[]
  ): string {
    let prompt = `Please review the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    
    if (focusAreas && focusAreas.length > 0) {
      prompt += `Focus especially on these areas: ${focusAreas.join(', ')}\n\n`;
    }
    
    prompt += 'Provide a detailed review covering:\n1. Code quality and style\n2. Potential bugs or issues\n3. Performance considerations\n4. Security concerns\n5. Suggested improvements';
    
    return prompt;
  }
  
  /**
   * Build prompt for debugging
   */
  private buildDebugPrompt(
    code: string,
    language: string,
    errorMessage: string
  ): string {
    return `I'm trying to debug the following ${language} code:
    
\`\`\`${language}
${code}
\`\`\`

I'm getting this error:
\`\`\`
${errorMessage}
\`\`\`

Please help me understand:
1. What's causing this error
2. How to fix it
3. Any other improvements you'd recommend for this code`;
  }
  
  /**
   * Store initial knowledge in vector memory
   */
  private async storeInitialKnowledge(): Promise<void> {
    // Store information about languages the agent specializes in
    for (const language of this.preferredLanguages) {
      await vectorMemory.addEntry(
        `I have expertise in ${language} programming.`,
        {
          source: 'agent-initialization',
          agentId: this.getId(),
          timestamp: new Date().toISOString(),
          category: 'expertise',
          tags: ['language', language]
        }
      );
    }
    
    // Store information about agent specializations
    for (const specialization of this.specializations) {
      await vectorMemory.addEntry(
        `I specialize in ${specialization} development.`,
        {
          source: 'agent-initialization',
          agentId: this.getId(),
          timestamp: new Date().toISOString(),
          category: 'expertise',
          tags: ['specialization', specialization]
        }
      );
    }
    
    // Store information about agent's approach to code
    const styleDescription = this.defaultStyle === 'concise' ? 'clean and minimal' :
      this.defaultStyle === 'detailed' ? 'well-documented with helpful comments' :
      'thoroughly explained with comments and rationale';
    
    await vectorMemory.addEntry(
      `I write ${styleDescription} code by default.`,
      {
        source: 'agent-initialization',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'style',
        tags: ['code-style', this.defaultStyle]
      }
    );
  }
  
  /**
   * Store tool results in memory for future reference
   */
  private async storeToolResultInMemory(
    toolName: string,
    inputs: Record<string, any>,
    result: any
  ): Promise<void> {
    if (toolName === 'mcp') {
      // Store the prompt and response in vector memory
      await vectorMemory.addEntry(
        `Prompt: ${inputs.prompt}\nResponse: ${result.response}`,
        {
          source: 'mcp-tool',
          agentId: this.getId(),
          timestamp: new Date().toISOString(),
          category: 'tool-interaction',
          tags: ['mcp', 'prompt', 'response']
        }
      );
    }
  }
  
  /**
   * Log an activity to the storage system
   */
  private async logActivity(message: string, level: LogLevel, details?: any): Promise<void> {
    try {
      await storage.createLog({
        level,
        category: LogCategory.AI,
        message: `[DeveloperAgent:${this.getId()}] ${message}`,
        details: details ? JSON.stringify(details) : null,
        source: 'developer-agent',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'developer', ...this.specializations, ...this.preferredLanguages]
      });
    } catch (error) {
      console.error('Failed to log developer agent activity:', error);
    }
  }
}

/**
 * Create a new developer agent
 */
export async function createDeveloperAgent(config: DeveloperAgentConfig): Promise<DeveloperAgent> {
  const id = config.id || `dev_agent_${uuidv4()}`;
  const agent = new DeveloperAgent(id, config);
  await agent.initialize();
  return agent;
}