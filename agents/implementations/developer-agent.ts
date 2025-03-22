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
    
    // 1. Contextual search for past collaborations that might be relevant
    const pastCollaborations = await vectorMemory.search(question, { 
      limit: 3, 
      threshold: 0.35,
      filter: {
        tags: ['collaboration', 'real-estate'],
        categories: ['cross-domain-collaboration']
      },
      timeWeighting: {
        enabled: true,
        halfLifeDays: 60, // Favor more recent collaborations but don't exclude older ones completely
        maxBoost: 1.3
      }
    });
    
    // 2. Domain-specific knowledge search based on the question context
    const domainSpecificFilter = isRealEstateRelated 
      ? { tags: ['real-estate', 'property', 'market', 'geospatial'] }
      : { categories: ['technical-qa', 'code-generation'] };
    
    const domainKnowledge = await vectorMemory.search(question, { 
      limit: 4, 
      threshold: 0.3,
      filter: domainSpecificFilter,
      diversityOptions: {
        enabled: true,
        minDistance: 0.2
      }
    });
    
    // 3. Technical knowledge search using hybrid search for better keyword matching
    const developerKnowledge = await vectorMemory.search(question, { 
      limit: 3, 
      threshold: 0.3,
      filter: {
        tags: ['developer', 'technical', 'code'],
        customFilter: (entry) => entry.metadata?.tags?.includes('collaboration') !== true
      },
      hybridSearch: {
        enabled: true,
        keywordWeight: 0.4,
        semanticWeight: 0.6
      }
    });
    
    // Combine results ensuring unique entries
    const seenIds = new Set<string>();
    const allResults: Array<{entry: MemoryEntry, score: number}> = [];
    
    // Helper to add unique results
    const addUniqueResults = (results: Array<{entry: MemoryEntry, score: number}>, sourceName: string) => {
      for (const result of results) {
        if (!seenIds.has(result.entry.id)) {
          seenIds.add(result.entry.id);
          // Add a source tag to know where the result came from
          allResults.push({
            ...result,
            entry: {
              ...result.entry,
              metadata: {
                ...result.entry.metadata,
                sourceSearch: sourceName
              }
            }
          });
        }
      }
    };
    
    // Add results in priority order
    addUniqueResults(pastCollaborations, 'pastCollaborations');
    addUniqueResults(domainKnowledge, 'domainKnowledge');
    addUniqueResults(developerKnowledge, 'developerKnowledge');
    
    // Sort by score and limit results
    const memoryResults = allResults.sort((a, b) => b.score - a.score).slice(0, 6);
    
    // Log enhanced memory search results
    await this.logActivity(`Enhanced vector memory search for: "${question.substring(0, 30)}..."`, LogLevel.DEBUG, {
      resultCount: memoryResults.length,
      pastCollaborationsFound: pastCollaborations.length,
      domainKnowledgeFound: domainKnowledge.length,
      developerKnowledgeFound: developerKnowledge.length,
      isRealEstateRelated,
      topResults: memoryResults.slice(0, 3).map(r => ({
        preview: r.entry.text.substring(0, 50) + '...',
        score: r.score,
        source: r.entry.metadata?.sourceSearch || 'unknown'
      }))
    });
    
    // If real estate related, first check if we have a recent similar consultation
    let expertConsultation = '';
    let consultationUsed = false;
    let consultationSource = '';
    
    if (isRealEstateRelated) {
      // Check if we already have a high-quality past consultation that's relevant
      const hasRecentCollaboration = pastCollaborations.length > 0 && 
        pastCollaborations.some(r => 
          r.score > 0.75 && // Must be highly relevant 
          new Date(r.entry.metadata?.timestamp || 0).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days
        );
      
      if (hasRecentCollaboration) {
        // Reuse the best past collaboration
        const bestCollaboration = pastCollaborations.sort((a, b) => b.score - a.score)[0];
        const collaborationText = bestCollaboration.entry.text;
        
        // Extract the consultation part from the text (format: "Developer Question: X\nReal Estate Consultation: Y")
        const consultationMatch = collaborationText.match(/Real Estate Consultation: ([\s\S]+)/);
        if (consultationMatch && consultationMatch[1]) {
          expertConsultation = consultationMatch[1].trim();
          consultationUsed = true;
          consultationSource = 'memory';
          
          await this.logActivity(`Reusing past real estate consultation for: "${question.substring(0, 30)}..."`, LogLevel.INFO, {
            relevanceScore: bestCollaboration.score,
            timestamp: bestCollaboration.entry.metadata?.timestamp || 'unknown',
            consultationLength: expertConsultation.length
          });
        }
      }
      
      // If no suitable past consultation was found, get a new one
      if (!consultationUsed) {
        try {
          // Get real estate expertise through live collaboration
          const consultation = await this.consultRealEstateAgent(question);
          if (consultation) {
            expertConsultation = consultation;
            consultationUsed = true;
            consultationSource = 'live';
            
            await this.logActivity(`Received real estate consultation for: "${question.substring(0, 30)}..."`, LogLevel.INFO, {
              consultationLength: consultation.length
            });
          }
        } catch (error) {
          await this.logActivity(`Failed to consult real estate agent: ${error instanceof Error ? error.message : String(error)}`, LogLevel.WARNING);
          // Continue without consultation if it fails
        }
      }
    }
    
    // Build context from relevant memories with better organization
    let contextFromMemory = '';
    if (memoryResults.length > 0) {
      // Group entries by their search source for better organization
      const groupedEntries: Record<string, Array<{entry: MemoryEntry, score: number}>> = {};
      
      for (const result of memoryResults) {
        const source = result.entry.metadata?.sourceSearch || 'other';
        if (!groupedEntries[source]) {
          groupedEntries[source] = [];
        }
        groupedEntries[source].push(result);
      }
      
      // Format grouped entries
      const sections = [];
      
      if (groupedEntries['pastCollaborations']?.length) {
        sections.push("### Previous Collaborations\n" + 
          groupedEntries['pastCollaborations']
            .map(result => `- ${result.entry.text.substring(0, 500)}... (relevance: ${result.score.toFixed(2)})`)
            .join('\n')
        );
      }
      
      if (groupedEntries['domainKnowledge']?.length) {
        sections.push("### Domain Knowledge\n" + 
          groupedEntries['domainKnowledge']
            .map(result => `- ${result.entry.text} (relevance: ${result.score.toFixed(2)})`)
            .join('\n')
        );
      }
      
      if (groupedEntries['developerKnowledge']?.length) {
        sections.push("### Technical Knowledge\n" + 
          groupedEntries['developerKnowledge']
            .map(result => `- ${result.entry.text} (relevance: ${result.score.toFixed(2)})`)
            .join('\n')
        );
      }
      
      if (groupedEntries['other']?.length) {
        sections.push("### Other Relevant Information\n" + 
          groupedEntries['other']
            .map(result => `- ${result.entry.text} (relevance: ${result.score.toFixed(2)})`)
            .join('\n')
        );
      }
      
      contextFromMemory = sections.join('\n\n');
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
        collaborativeProcess: consultationUsed 
          ? `Consulted with real estate agent (${consultationSource === 'memory' ? 'retrieved from memory' : 'live consultation'})` 
          : undefined,
        memoryStats: {
          pastCollaborationsCount: pastCollaborations.length,
          domainKnowledgeCount: domainKnowledge.length,
          developerKnowledgeCount: developerKnowledge.length,
          totalResultsUsed: memoryResults.length
        }
      }
    };
    
    // Store the question and answer in memory for future reference with enhanced metadata
    const extractedTopics = this.extractKeyTopics(question);
    
    await vectorMemory.addEntry(
      `Q: ${question}\nA: ${result.result.response}`,
      {
        source: 'dev-question-answering',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: isRealEstateRelated ? 'real-estate-technical-qa' : 'technical-qa',
        tags: ['question', 'answer', 'technical', ...extractedTopics, ...this.specializations],
        importance: isRealEstateRelated ? 0.8 : 0.6, // Prioritize cross-domain knowledge
        confidence: result.result.confidence || 0.7,
        consultationUsed: consultationUsed,
        searchContext: {
          pastCollaborations: pastCollaborations.length,
          domainKnowledge: domainKnowledge.length,
          developerKnowledge: developerKnowledge.length
        }
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
   * Advanced intent analysis to detect if a question would benefit from real estate expertise
   * Uses multi-layered detection with contextual awareness, semantic patterns, and intent classification
   */
  private isRealEstateRelatedQuestion(question: string): boolean {
    // Core real estate terms with highest confidence (direct domain indicators)
    const coreRealEstateKeywords = [
      'real estate', 'property', 'house', 'housing market', 'home value', 
      'mortgage', 'appraisal', 'listing', 'broker', 'realtor',
      'commercial property', 'residential property', 'zoning',
      'geodata', 'gis', 'property tax', 'assessment', 'grandview'
    ];
    
    // General real estate related terms with medium confidence
    const generalRealEstateKeywords = [
      'home', 'apartment', 'condo', 'rent', 'market value', 'land',
      'residential', 'investment property', 'valuation', 'rental', 
      'buying', 'selling', 'location', 'neighborhood', 'downtown', 
      'map view', 'mapping', 'square footage', 'acre', 'lot size', 
      'bedroom', 'bathroom', 'real property', 'deed', 'title',
      'house', 'housing', 'commercial', 'tenant', 'lease'
    ];
    
    // Technical terms that could be real estate related in context
    const technicalContextTerms = [
      'geospatial', 'spatial data', 'mapping api', 'coordinates',
      'location data', 'proximity search', 'radius search', 'geocoding',
      'leaflet', 'openstreetmap', 'arcgis', 'mapbox', 'geoJSON',
      'heatmap', 'choropleth', 'boundary', 'polygon', 'marker',
      'address validation', 'parcel', 'latitude', 'longitude'
    ];
    
    // Analysis-related terms suggesting real estate analytics context
    const analysisTerms = [
      'trend', 'analysis', 'historical data', 'appreciation', 'depreciation',
      'forecast', 'predict', 'projection', 'growth rate', 'decline rate',
      'market indicator', 'leading indicator', 'comparative', 'competitive',
      'benchmark', 'metric', 'radius', 'analytics', 'search algorithm'
    ];
    
    // Patterns that strongly suggest real estate context (weighted phrases)
    const realEstatePatterns = [
      // Location-based patterns
      /\b(\w+)\s+neighborhood\b/i,
      /\bin\s+(\w+)\s+(county|city|area|region|market|zip code)\b/i,
      /\b(\w+)\s+housing\s+market\b/i,
      
      // Search and display patterns
      /\bproperty\s+(search|lookup|query|filter)\b/i,
      /\b(display|show|render|visualize)\s+properties\b/i,
      /\b(map|plot|geocode)\s+(houses|properties|listings)\b/i,
      
      // Value and metrics patterns
      /\b(price|value|cost)\s+per\s+(square\s+foot|sq\s+ft|acre)\b/i,
      /\b(compare|analyze)\s+(properties|homes|listings)\b/i,
      /\bproperty\s+(valuation|assessment|pricing)\b/i
    ];
    
    // Intent-specific questions that suggest real estate knowledge needs
    const intentPatterns = [
      /\bhow\s+(to|do\s+I|would\s+I|can\s+I)\s+(find|search|display|show|calculate|determine|locate)\s+.{0,30}\b(property|properties|house|houses|realty|home|homes)\b/i,
      /\bwhat\s+(is|are)\s+.{0,30}\b(property|home|house|real estate)\s+(values?|prices?|costs?|rates?)\b/i,
      /\bwhat\s+factors?\s+.{0,30}\b(property|home|house|real estate)\b/i
    ];
    
    // Convert to lowercase for case-insensitive comparison
    const questionLower = question.toLowerCase();
    
    // Track confidence scores with a weighted approach
    let confidenceScore = 0;
    const matchedTerms = {
      core: [] as string[],
      general: [] as string[],
      technical: [] as string[],
      analysis: [] as string[],
      patterns: [] as string[],
      intents: [] as string[]
    };
    
    // 1. Check core keywords (highest confidence)
    const coreMatches = coreRealEstateKeywords.filter(keyword => 
      questionLower.includes(keyword.toLowerCase())
    );
    matchedTerms.core = coreMatches;
    confidenceScore += coreMatches.length * 2.0; // Higher weight for core terms
    
    // Instant return for strong indicators
    if (coreMatches.length >= 1) {
      return true;
    }
    
    // 2. Check general real estate keywords
    const generalMatches = generalRealEstateKeywords.filter(keyword => 
      questionLower.includes(keyword.toLowerCase())
    );
    matchedTerms.general = generalMatches;
    confidenceScore += generalMatches.length * 1.0;
    
    // 3. Check technical terms that may indicate real estate context
    const technicalMatches = technicalContextTerms.filter(keyword => 
      questionLower.includes(keyword.toLowerCase())
    );
    matchedTerms.technical = technicalMatches;
    confidenceScore += technicalMatches.length * 0.8;
    
    // 4. Check analysis terms
    const analysisMatches = analysisTerms.filter(keyword => 
      questionLower.includes(keyword.toLowerCase())
    );
    matchedTerms.analysis = analysisMatches;
    confidenceScore += analysisMatches.length * 0.7;
    
    // 5. Check for real estate patterns (strong indicators)
    for (const pattern of realEstatePatterns) {
      if (pattern.test(question)) {
        matchedTerms.patterns.push(pattern.toString());
        confidenceScore += 1.5; // Significant boost for pattern matches
      }
    }
    
    // 6. Check for intent patterns (very strong indicators)
    for (const pattern of intentPatterns) {
      if (pattern.test(question)) {
        matchedTerms.intents.push(pattern.toString());
        confidenceScore += 2.0; // Major boost for intent matches
      }
    }
    
    // 7. Check for specific combinations that suggest real estate tech context
    if (generalMatches.length >= 1 && technicalMatches.length >= 1) {
      confidenceScore += 1.0; // Bonus for technical + general combination
    }
    
    if (generalMatches.length >= 1 && analysisMatches.length >= 1) {
      confidenceScore += 1.0; // Bonus for analysis + general combination
    }
    
    // Multiple general terms suggest real estate focus
    if (generalMatches.length >= 2) {
      confidenceScore += 0.5; // Modest boost for multiple general terms
    }
    
    // Log the detailed analysis (for high importance or debugging)
    this.logActivity(`Question intent analysis: "${question.substring(0, 50)}..."`, LogLevel.DEBUG, {
      confidenceScore,
      matchedTerms,
      isRealEstateRelated: confidenceScore >= 2.0
    });
    
    // Final decision based on confidence threshold
    return confidenceScore >= 2.0; // Threshold determined through testing
  }
  
  /**
   * Extract key topics from a question to use as tags
   * This helps improve vector memory organization and retrieval
   */
  private extractKeyTopics(question: string): string[] {
    // Common technical domains
    const domains = {
      frontend: ['ui', 'interface', 'react', 'vue', 'angular', 'component', 'css', 'html', 'dom', 'responsive', 'design', 'mobile'],
      backend: ['server', 'api', 'endpoint', 'database', 'query', 'orm', 'rest', 'graphql', 'middleware', 'authentication', 'authorization'],
      database: ['sql', 'nosql', 'postgres', 'mysql', 'mongodb', 'schema', 'model', 'query', 'index', 'transaction', 'constraint'],
      devops: ['deploy', 'ci/cd', 'pipeline', 'docker', 'kubernetes', 'container', 'infrastructure', 'aws', 'cloud', 'scaling'],
      security: ['auth', 'jwt', 'token', 'encryption', 'hash', 'vulnerability', 'exploit', 'secure', 'csrf', 'xss'],
      testing: ['test', 'unit', 'integration', 'e2e', 'mock', 'stub', 'assert', 'expect', 'coverage', 'jest', 'cypress'],
      performance: ['optimize', 'latency', 'throughput', 'bottleneck', 'profiling', 'memory', 'cpu', 'cache', 'lazy loading'],
      architecture: ['design pattern', 'architecture', 'microservice', 'monolith', 'modular', 'dependency', 'coupling', 'cohesion'],
      algorithms: ['algorithm', 'complexity', 'efficient', 'optimization', 'big o', 'time complexity', 'space complexity', 'recursive'],
      development: ['debug', 'error', 'exception', 'logging', 'monitoring', 'documentation', 'versioning', 'git', 'workflow'],
      realEstate: ['property', 'real estate', 'housing', 'market', 'geospatial', 'location', 'map', 'geodata', 'gis']
    };
    
    // Programming languages
    const languages = [
      'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'php', 'ruby', 
      'swift', 'kotlin', 'scala', 'dart', 'perl', 'shell', 'bash', 'sql'
    ];
    
    // Frameworks and libraries
    const frameworks = [
      'react', 'vue', 'angular', 'svelte', 'node', 'express', 'django', 'flask', 'spring', 
      'rails', 'laravel', 'symfony', '.net', 'tensorflow', 'pytorch', 'pandas'
    ];
    
    const questionLower = question.toLowerCase();
    const tags: string[] = [];
    
    // Check for domains
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(kw => questionLower.includes(kw.toLowerCase()))) {
        tags.push(domain);
      }
    }
    
    // Check for languages
    for (const lang of languages) {
      if (questionLower.includes(lang.toLowerCase())) {
        tags.push(lang);
      }
    }
    
    // Check for frameworks
    for (const framework of frameworks) {
      if (questionLower.includes(framework.toLowerCase())) {
        tags.push(framework);
      }
    }
    
    // If we have technical context terms, add 'geospatial' tag for better recall
    const technicalGeoTerms = [
      'coordinates', 'latitude', 'longitude', 'geocoding', 'reverse geocoding',
      'spatial', 'geojson', 'map', 'leaflet', 'openstreetmap', 'arcgis', 'mapbox'
    ];
    
    if (technicalGeoTerms.some(term => questionLower.includes(term.toLowerCase()))) {
      tags.push('geospatial');
    }
    
    // Limit to a reasonable number of tags
    return [...new Set(tags)].slice(0, 5);
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