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
    // Store local variable copies first
    const specializations = config.specializations || [];
    const preferredLanguages = config.preferredLanguages || [];
    const defaultStyle = config.defaultStyle || 'detailed';
    const customPromptTemplate = config.customPromptTemplate;
    
    // Create a local copy of capabilities array for modification
    const capabilities = [
      ...(config.capabilities || []),
      AgentCapability.CODE_GENERATION,
      AgentCapability.CODE_UNDERSTANDING,
      AgentCapability.TEXT_GENERATION,
      AgentCapability.TEXT_UNDERSTANDING,
      AgentCapability.TOOL_USE
    ];
    
    // Add specialization-specific capabilities
    if (specializations.includes('frontend')) {
      capabilities.push(AgentCapability.DATA_VISUALIZATION);
    }
    
    if (specializations.includes('devops')) {
      capabilities.push(AgentCapability.PLANNING);
    }
    
    // Initialize the base agent with the enhanced capabilities
    super(id, {
      ...config,
      capabilities
    });
    
    // Now we can safely initialize instance properties
    this.specializations = specializations;
    this.preferredLanguages = preferredLanguages;
    this.defaultStyle = defaultStyle;
    this.customPromptTemplate = customPromptTemplate;
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
   * Assign a task to the agent
   * This implementation extends the base addTask with type-specific handling
   */
  public async assignTask(taskRequest: {
    type: string;
    priority: 'low' | 'normal' | 'high';
    inputs: Record<string, any>;
  }): Promise<string> {
    // Convert priority string to numeric value
    let priorityValue = 5; // default to normal
    if (taskRequest.priority === 'low') priorityValue = 3;
    if (taskRequest.priority === 'high') priorityValue = 8;
    
    // Create description based on task type and inputs
    let description = '';
    
    switch (taskRequest.type) {
      case 'generate_code':
        description = `Generate ${taskRequest.inputs.language} code for: ${taskRequest.inputs.requirements?.substring(0, 30)}...`;
        break;
      
      case 'review_code':
        description = `Review ${taskRequest.inputs.language} code`;
        break;
      
      case 'debug_code':
        description = `Debug ${taskRequest.inputs.language} code issue`;
        break;
      
      case 'answer_question':
        description = `Answer question: ${taskRequest.inputs.question?.substring(0, 30)}...`;
        break;
      
      default:
        description = `Execute ${taskRequest.type} task`;
    }
    
    // Call the base class method to add the task
    return this.addTask({
      type: taskRequest.type,
      description,
      inputs: taskRequest.inputs,
      priority: priorityValue,
    });
  }
  
  /**
   * Execute a task (for agent coordinator)
   * This method overrides the one in BaseAgent to use our specialized task handling
   */
  public async execute(task: string, inputs: Record<string, any>, options?: Record<string, any>): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Create a task request
      const priority = options?.priority || 'normal';
      
      // Create a new task
      const taskId = await this.assignTask({
        type: task,
        priority,
        inputs
      });
      
      // Start the agent if it's idle
      if (this.status === AgentStatus.IDLE) {
        await this.start();
      }
      
      // Get the task result using the private method from the base class
      const taskResult = await this.executeTask(taskId);
      
      // Format result
      return {
        success: true,
        data: taskResult,
        metadata: {
          taskId,
          task,
          duration: Date.now() - startTime
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          task,
          duration: Date.now() - startTime
        },
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute a task and wait for result
   * This method handles task execution and monitoring
   */
  private async executeTask(taskId: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const checkTaskStatus = async () => {
        const task = await this.getTask(taskId);
        
        if (!task) {
          reject(new Error(`Task ${taskId} not found`));
          return;
        }
        
        if (task.status === 'completed') {
          resolve(task.result);
          return;
        } else if (task.status === 'failed') {
          reject(new Error(task.error || 'Task failed without error message'));
          return;
        } else if (task.status === 'canceled') {
          reject(new Error('Task was canceled'));
          return;
        }
        
        // Check again after a short delay
        setTimeout(checkTaskStatus, 100);
      };
      
      checkTaskStatus();
    });
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
    
    // Detect if this question might benefit from consulting a real estate agent
    const isRealEstateRelated = this.isRealEstateRelatedQuestion(question);
    
    // Search relevant information in vector memory with lower threshold
    const memoryResults = await vectorMemory.search(question, { 
      limit: 5, 
      threshold: 0.3,  // Lower threshold to match our improved vector memory
      diversityOptions: {
        enabled: true,
        minDistance: 0.2  // Add diversity to get a range of relevant content
      }
    });
    
    // Log memory search results
    await this.logActivity(`Vector memory search results for question: "${question.substring(0, 30)}..."`, LogLevel.DEBUG, {
      resultCount: memoryResults.length,
      topResults: memoryResults.slice(0, 3).map(r => ({
        preview: r.entry.text.substring(0, 50) + '...',
        score: r.score
      })),
      isRealEstateRelated
    });
    
    // If real estate related, consult with a real estate agent
    let expertConsultation = '';
    let consultationUsed = false;
    
    if (isRealEstateRelated) {
      try {
        // Get real estate expertise through collaboration
        const consultation = await this.consultRealEstateAgent(question);
        if (consultation) {
          expertConsultation = consultation;
          consultationUsed = true;
          
          await this.logActivity(`Received real estate consultation for: "${question.substring(0, 30)}..."`, LogLevel.INFO, {
            consultationLength: consultation.length
          });
        }
      } catch (error) {
        await this.logActivity(`Failed to consult real estate agent: ${error instanceof Error ? error.message : String(error)}`, LogLevel.WARNING);
        // Continue without consultation if it fails
      }
    }
    
    // Build context from relevant memories
    let contextFromMemory = '';
    if (memoryResults.length > 0) {
      contextFromMemory = "Relevant information from my knowledge base:\n" + 
        memoryResults.map(result => `- ${result.entry.text} (relevance: ${result.score.toFixed(2)})`).join('\n');
    }
    
    // Prepare the enhanced prompt with multi-agent knowledge
    const prompt = `
Technical Question: ${question}

${memoryResults.length > 0 ? '## Relevant Context\n' + contextFromMemory + '\n\n' : ''}
${context ? `## Additional Context\n${context}\n\n` : ''}
${consultationUsed ? `## Real Estate Expert Consultation\n${expertConsultation}\n\n` : ''}

## Task
Please provide a clear, accurate, and helpful answer to the technical question based on:
1. Your expertise in software development
2. The provided context information (if any)
3. Best practices and current industry standards
${consultationUsed ? '4. The real estate expertise provided by the real estate agent' : ''}

Focus on providing actionable insights and solutions that would be valuable to a developer.
`;
    
    // Use enhanced MCP tool to answer the question
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.4,  // Slightly lower temperature for more focused responses
      system_message: 'You are a knowledgeable software developer with expertise in architecture, programming best practices, and technical problem-solving. Provide clear, accurate, and helpful answers to technical questions.',
      cache: true,  // Enable caching for efficiency
      
      // Enhanced context-aware parameters
      use_vector_memory: true,
      memory_query: question,
      memory_options: {
        limit: 5,
        threshold: 0.3,
        diversityFactor: 0.5,
        includeSources: true
      },
      context_integration: 'smart'
    });
    
    if (!result.success) {
      throw new Error(`Failed to answer question: ${result.error}`);
    }
    
    // Set the task result with enhanced metadata
    task.result = {
      answer: result.result.response,
      sourcesUsed: memoryResults.map(result => ({
        text: result.entry.text.substring(0, 100) + (result.entry.text.length > 100 ? '...' : ''),
        relevanceScore: result.score,
        category: result.entry.metadata?.category || 'unknown'
      })),
      collaborationUsed: consultationUsed,
      metadata: {
        responseTime: result.metadata?.responseTime || null,
        modelUsed: 'gpt-4',
        timestamp: new Date().toISOString(),
        collaborativeProcess: consultationUsed ? 'Consulted with real estate agent' : undefined
      }
    };
    
    // Store the question and answer in memory for future reference
    await vectorMemory.addEntry(
      `Q: ${question}\nA: ${result.result.response}`,
      {
        source: 'dev-question-answering',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'technical-qa',
        tags: ['question', 'answer', 'technical', ...this.specializations]
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
   * Check if a question might benefit from real estate expertise
   */
  private isRealEstateRelatedQuestion(question: string): boolean {
    // Keywords that suggest real estate relevance
    const realEstateKeywords = [
      'property', 'real estate', 'house', 'home', 'apartment', 'condo', 
      'rent', 'mortgage', 'market value', 'housing', 'land', 'commercial', 
      'residential', 'zoning', 'realty', 'listing', 'broker', 'agent', 
      'investment property', 'appraisal', 'valuation', 'rental', 'buy', 
      'sell', 'geodata', 'gis', 'location', 'neighborhood', 'downtown', 
      'map view', 'mapping', 'property tax', 'assessment', 'square foot',
      'acre', 'lot size', 'bedroom', 'bathroom', 'grandview'
    ];
    
    // Check if any keywords are in the question (case insensitive)
    const questionLower = question.toLowerCase();
    return realEstateKeywords.some(keyword => questionLower.includes(keyword.toLowerCase()));
  }
  
  /**
   * Consult with a real estate agent for domain-specific expertise
   */
  private async consultRealEstateAgent(question: string): Promise<string | null> {
    try {
      // Use the agent registry to find real estate agents
      const { agentRegistry } = await import('../core/agent-registry');
      const realEstateAgents = agentRegistry.getAgentsByType('real_estate');
      
      if (!realEstateAgents || realEstateAgents.length === 0) {
        await this.logActivity('No real estate agents available for consultation', LogLevel.WARNING);
        return null;
      }
      
      // Select the first available real estate agent
      const realEstateAgent = realEstateAgents[0];
      
      await this.logActivity(`Consulting real estate agent ${realEstateAgent.getId()} for question`, LogLevel.INFO, {
        question: question.substring(0, 100) + (question.length > 100 ? '...' : '')
      });
      
      // Use the agent coordinator for structured communication
      const { agentCoordinator } = await import('../core/agent-coordinator');
      
      // Create a consultation task for the real estate agent
      const consultationResult = await agentCoordinator.assignTask(
        realEstateAgent.getId(),
        'answer_question',
        {
          question: `[Developer Agent Consultation] ${question}`,
          context: `This question is being asked by a developer agent who needs real estate expertise. 
                   Please focus on providing domain-specific knowledge that would be relevant 
                   for a technical implementation or understanding of real estate concepts.`
        },
        {
          priority: 'high'
        }
      );
      
      if (!consultationResult.success) {
        throw new Error(`Consultation failed: ${consultationResult.error?.message || 'Unknown error'}`);
      }
      
      // Extract the answer from the consultation result
      const consultationAnswer = consultationResult.data?.answer;
      
      if (!consultationAnswer) {
        await this.logActivity('Received empty consultation response', LogLevel.WARNING);
        return null;
      }
      
      // Log the successful consultation
      await this.logActivity('Successfully received real estate consultation', LogLevel.INFO, {
        consultationLength: consultationAnswer.length
      });
      
      // Store the collaborative interaction in vector memory
      await vectorMemory.addEntry(
        `Developer Question: ${question}\nReal Estate Consultation: ${consultationAnswer}`,
        {
          source: 'agent-collaboration',
          agentId: this.getId(),
          timestamp: new Date().toISOString(),
          category: 'cross-domain-collaboration',
          tags: ['collaboration', 'real-estate', 'consultation'],
          collaboratingAgentId: realEstateAgent.getId()
        }
      );
      
      return consultationAnswer;
    } catch (error) {
      await this.logActivity(`Error consulting real estate agent: ${error instanceof Error ? error.message : String(error)}`, LogLevel.ERROR);
      return null;
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