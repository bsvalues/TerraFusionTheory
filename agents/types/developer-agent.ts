/**
 * Developer Agent Implementation
 * 
 * This agent specializes in software development tasks, code generation,
 * code review, debugging, and documentation.
 */

import { 
  AgentCapability, 
  AgentConfig, 
  AgentState, 
  AgentTask, 
  AgentType, 
  ExecutionResult 
} from '../interfaces/agent-interface';
import { BaseAgent } from '../core/agent-base';
import { storage } from '../../server/storage';
import { LogCategory, LogLevel } from '../../shared/schema';
import * as enhancedAIService from '../../server/services/enhanced-openai.service';

/**
 * Developer Agent class
 */
export class DeveloperAgent extends BaseAgent {
  // Track the AI model being used
  private model: string;
  
  /**
   * Create a new Developer Agent
   * 
   * @param name Human-readable name for the agent
   * @param description Description of the agent's purpose
   * @param capabilities Set of capabilities this agent supports
   * @param config Configuration options for the agent
   */
  constructor(
    name: string,
    description: string,
    capabilities: AgentCapability[] = [],
    config: AgentConfig = {}
  ) {
    // Add default developer capabilities if none provided
    if (capabilities.length === 0) {
      capabilities = [
        AgentCapability.CONVERSATION,
        AgentCapability.CODE_GENERATION,
        AgentCapability.CODE_REVIEW,
        AgentCapability.DEBUGGING,
        AgentCapability.DOCUMENTATION,
      ];
    }
    
    super(AgentType.DEVELOPER, name, description, capabilities, config);
    
    // Set the AI model to use
    this.model = config.model || 'gpt-4';
  }
  
  /**
   * Initialize the agent with developer specific setup
   */
  public async initialize(): Promise<boolean> {
    try {
      this.setState(AgentState.INITIALIZING);
      
      // Log the initialization
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Initializing Developer Agent: ${this.name}`,
        details: JSON.stringify({
          agentId: this.id,
          agentType: this.type,
          agentName: this.name,
          capabilities: Array.from(this.capabilities),
          model: this.model
        }),
        source: 'DeveloperAgent',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'initialization', 'developer']
      });
      
      // Add system prompt to the history
      this.addMessage('system', this.getSystemPrompt());
      
      this.isActive = true;
      this.setState(AgentState.READY);
      this.emit('initialized', { agentId: this.id });
      
      return true;
    } catch (error) {
      this.setState(AgentState.ERROR);
      this.emit('error', { agentId: this.id, error });
      await this.logError('Failed to initialize Developer Agent', error);
      return false;
    }
  }
  
  /**
   * Execute a development related task
   * 
   * @param task The task to execute
   * @param inputs The inputs for the task
   * @param options Additional options for execution
   */
  public async execute(
    task: string,
    inputs: Record<string, any>,
    options: Record<string, any> = {}
  ): Promise<ExecutionResult> {
    try {
      this.setState(AgentState.BUSY);
      
      // Create a task record
      const agentTask: AgentTask = {
        id: `task_${Date.now()}`,
        name: task,
        description: `Executing task: ${task}`,
        status: 'in-progress',
        startTime: new Date()
      };
      
      this.setCurrentTask(agentTask);
      
      // Log the task execution
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Developer Agent executing task: ${task}`,
        details: JSON.stringify({
          agentId: this.id,
          agentName: this.name,
          taskId: agentTask.id,
          task,
          inputs: this.sanitizeInputs(inputs),
          options: this.sanitizeOptions(options)
        }),
        source: 'DeveloperAgent',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'task-execution', 'developer']
      });
      
      // Process the task based on its type
      let result: any;
      let success = false;
      
      switch (task.toLowerCase()) {
        case 'generate-code':
          result = await this.generateCode(inputs, options);
          success = true;
          break;
          
        case 'review-code':
          result = await this.reviewCode(inputs, options);
          success = true;
          break;
          
        case 'debug-code':
          result = await this.debugCode(inputs, options);
          success = true;
          break;
          
        case 'generate-documentation':
          result = await this.generateDocumentation(inputs, options);
          success = true;
          break;
          
        case 'answer-question':
          result = await this.answerQuestion(inputs, options);
          success = true;
          break;
          
        default:
          throw new Error(`Unknown task type: ${task}`);
      }
      
      // Update task status
      agentTask.status = 'completed';
      agentTask.endTime = new Date();
      agentTask.result = { success, output: result };
      
      this.setCurrentTask(agentTask);
      this.setState(AgentState.READY);
      
      // Return execution result
      return {
        success: true,
        output: result
      };
    } catch (error) {
      // Handle error and update task status
      const currentTask = this.context.currentTask;
      if (currentTask) {
        currentTask.status = 'failed';
        currentTask.endTime = new Date();
        currentTask.result = { 
          success: false,
          output: null,
          error: error instanceof Error ? error : new Error(String(error)) 
        };
        
        this.setCurrentTask(currentTask);
      }
      
      this.setState(AgentState.ERROR);
      await this.logError(`Failed to execute task: ${task}`, error);
      
      return {
        success: false,
        output: null,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Generate code based on requirements
   * 
   * @param inputs Requirements and language inputs
   * @param options Code generation options
   */
  private async generateCode(
    inputs: Record<string, any>,
    options: Record<string, any>
  ): Promise<any> {
    const { requirements, language, fileType } = inputs;
    
    try {
      // Add message to history
      this.addMessage('user', `Generate ${language} code for: ${requirements}`);
      
      // Generate code using AI service
      const result = await enhancedAIService.generateCode(
        requirements,
        language,
        options.userId || null,
        options.sessionId || null
      );
      
      // Extract the code text from the result
      const codeResult = result && typeof result === 'object' && result.code
        ? result.code
        : (typeof result === 'string' ? result : JSON.stringify(result));
      
      // Add AI response to history
      this.addMessage('agent', codeResult);
      
      // Parse and format the response
      const formattedCode = this.formatCodeResponse(codeResult, language, fileType);
      
      // Return the result
      return {
        code: formattedCode.code,
        explanation: formattedCode.explanation,
        language,
        requirements
      };
    } catch (error) {
      await this.logError('Code generation failed', error);
      throw error;
    }
  }
  
  /**
   * Review and improve code
   * 
   * @param inputs Code and context inputs
   * @param options Code review options
   */
  private async reviewCode(
    inputs: Record<string, any>,
    options: Record<string, any>
  ): Promise<any> {
    const { code, language, context } = inputs;
    
    try {
      // Prepare the prompt for code review
      const reviewPrompt = `
I need you to review the following ${language} code. 
${context ? `Context: ${context}` : ''}

CODE TO REVIEW:
\`\`\`${language}
${code}
\`\`\`

Please provide:
1. Code quality assessment
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Improved version of the code with comments
`;
      
      // Add message to history
      this.addMessage('user', reviewPrompt);
      
      // Generate review using AI service
      const review = await enhancedAIService.analyzeMessage(
        reviewPrompt, 
        options.projectId || null,
        options.userId || null,
        options.sessionId || null
      );
      
      // Extract review text
      const reviewText = typeof review === 'string' 
        ? review 
        : (typeof review === 'object' ? JSON.stringify(review) : String(review));
      
      // Add AI response to history
      this.addMessage('agent', reviewText);
      
      // Extract the improved code from the review
      const improvedCode = this.extractCodeFromReview(review, language);
      
      // Return the result
      return {
        originalCode: code,
        review: reviewText,
        improvedCode,
        language
      };
    } catch (error) {
      await this.logError('Code review failed', error);
      throw error;
    }
  }
  
  /**
   * Debug code with error messages
   * 
   * @param inputs Code and error message inputs
   * @param options Debugging options
   */
  private async debugCode(
    inputs: Record<string, any>,
    options: Record<string, any>
  ): Promise<any> {
    const { code, error, language, context } = inputs;
    
    try {
      // Add message to history
      this.addMessage('user', `Debug this ${language} code with error: ${error}`);
      
      // Debug code using AI service
      const debugResult = await enhancedAIService.debugCode(
        code,
        error,
        options.userId || null,
        options.sessionId || null
      );
      
      // Extract the analysis text from the debug result
      const analysisText = debugResult && typeof debugResult === 'object' && debugResult.analysis 
        ? debugResult.analysis 
        : JSON.stringify(debugResult);
      
      // Add AI response to history
      this.addMessage('agent', analysisText);
      
      // Extract the fixed code from the debug result
      const fixedCode = this.extractCodeFromDebug(debugResult, language);
      
      // Return the result
      return {
        originalCode: code,
        error,
        debugAnalysis: analysisText,
        fixedCode,
        language
      };
    } catch (error) {
      await this.logError('Code debugging failed', error);
      throw error;
    }
  }
  
  /**
   * Generate documentation for code
   * 
   * @param inputs Code and documentation type inputs
   * @param options Documentation generation options
   */
  private async generateDocumentation(
    inputs: Record<string, any>,
    options: Record<string, any>
  ): Promise<any> {
    const { code, docType, language } = inputs;
    
    try {
      // Add message to history
      this.addMessage('user', `Generate ${docType} documentation for this ${language} code`);
      
      // Generate documentation using AI service
      const docResult = await enhancedAIService.generateDocumentation(
        code,
        docType,
        options.userId || null,
        options.sessionId || null
      );
      
      // Extract the documentation text
      const docText = docResult && typeof docResult === 'object' && docResult.documentation
        ? docResult.documentation
        : (typeof docResult === 'string' ? docResult : JSON.stringify(docResult));
      
      // Add AI response to history
      this.addMessage('agent', docText);
      
      // Return the result
      return {
        code,
        documentation: docText,
        docType,
        language
      };
    } catch (error) {
      await this.logError('Documentation generation failed', error);
      throw error;
    }
  }
  
  /**
   * Answer a development question
   * 
   * @param inputs Question inputs
   * @param options Response options
   */
  private async answerQuestion(
    inputs: Record<string, any>,
    options: Record<string, any>
  ): Promise<any> {
    const { question, context } = inputs;
    
    try {
      // Add message to history
      this.addMessage('user', question);
      
      // Generate answer using AI service
      const result = await enhancedAIService.analyzeMessage(
        question,
        options.projectId || null,
        options.userId || null,
        options.sessionId || null
      );
      
      // Extract the answer text
      const answerText = result && typeof result === 'string' 
        ? result 
        : (typeof result === 'object' ? JSON.stringify(result) : String(result));
      
      // Add AI response to history
      this.addMessage('agent', answerText);
      
      // Return the result
      return {
        question,
        answer: answerText
      };
    } catch (error) {
      await this.logError('Question answering failed', error);
      throw error;
    }
  }
  
  /**
   * Format code response from AI
   * 
   * @param response Raw AI response
   * @param language Programming language
   * @param fileType Type of file
   */
  private formatCodeResponse(
    response: any,
    language: string,
    fileType?: string
  ): { code: string; explanation: string } {
    // Convert response to string if it's not already
    const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
    
    // Simple regex to extract code blocks from markdown
    const codeBlockRegex = /```(?:[\w-]+)?\n([\s\S]*?)```/g;
    const matches = Array.from(responseStr.matchAll(codeBlockRegex));
    
    let code = '';
    if (matches.length > 0) {
      // Extract the first code block
      code = matches[0][1].trim();
    } else {
      // If no code block found, use the whole response
      code = responseStr;
    }
    
    // Remove code blocks from explanation
    let explanation = responseStr.replace(codeBlockRegex, '').trim();
    
    return { code, explanation };
  }
  
  /**
   * Extract code from a code review response
   * 
   * @param review Review response
   * @param language Programming language
   */
  private extractCodeFromReview(review: any, language: string): string {
    // Convert review to string if it's not already
    const reviewStr = typeof review === 'string' ? review : JSON.stringify(review);
    
    // Extract code blocks from the review
    const codeBlockRegex = new RegExp(`\`\`\`(?:${language})?\\n([\\s\\S]*?)\`\`\``, 'g');
    const matches = Array.from(reviewStr.matchAll(codeBlockRegex));
    
    // Return the last code block (improved code)
    if (matches.length > 0) {
      return matches[matches.length - 1][1].trim();
    }
    
    return '';
  }
  
  /**
   * Extract fixed code from a debug response
   * 
   * @param debugResult Debug response
   * @param language Programming language
   */
  private extractCodeFromDebug(debugResult: any, language: string): string {
    // Handle the case where debugResult is an object with an analysis property
    const analysisText = typeof debugResult === 'object' && debugResult.analysis 
      ? debugResult.analysis 
      : debugResult;
    
    // Convert debugResult to string if it's not already
    const debugStr = typeof analysisText === 'string' ? analysisText : JSON.stringify(analysisText);
    
    // Extract code blocks from the debug result
    const codeBlockRegex = new RegExp(`\`\`\`(?:${language})?\\n([\\s\\S]*?)\`\`\``, 'g');
    const matches = Array.from(debugStr.matchAll(codeBlockRegex));
    
    // Return the last code block (fixed code)
    if (matches.length > 0) {
      return matches[matches.length - 1][1].trim();
    }
    
    return '';
  }
  
  /**
   * Get the system prompt for the agent
   */
  private getSystemPrompt(): string {
    return `
You are an expert software developer agent specialized in code generation, review, debugging, and documentation.
Your goal is to provide high-quality software development assistance.

When generating code:
- Write clean, efficient, and well-structured code
- Include comments to explain complex logic
- Follow best practices for the requested language
- Consider edge cases and handle errors appropriately

When reviewing code:
- Identify potential bugs, security issues, and performance problems
- Suggest improvements while explaining the rationale
- Consider both functionality and maintainability

When debugging:
- Analyze error messages carefully
- Identify the root cause of the issue
- Provide a clear explanation of the problem
- Offer a fixed version of the code

When generating documentation:
- Create comprehensive and clear documentation
- Include examples where appropriate
- Explain both how and why the code works

Always maintain a professional and helpful tone.
`;
  }
  
  /**
   * Sanitize inputs for logging (remove sensitive data)
   * 
   * @param inputs Raw inputs
   */
  private sanitizeInputs(inputs: Record<string, any>): Record<string, any> {
    const sanitized = { ...inputs };
    
    // Remove potentially sensitive fields
    if (sanitized.apiKey) sanitized.apiKey = '[REDACTED]';
    
    return sanitized;
  }
  
  /**
   * Sanitize options for logging (remove sensitive data)
   * 
   * @param options Raw options
   */
  private sanitizeOptions(options: Record<string, any>): Record<string, any> {
    const sanitized = { ...options };
    
    // Remove potentially sensitive fields
    if (sanitized.credentials) sanitized.credentials = '[REDACTED]';
    
    return sanitized;
  }
  
  /**
   * Log an error
   * 
   * @param message Error message
   * @param error Error object
   */
  private async logError(message: string, error: any): Promise<void> {
    try {
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message,
        details: JSON.stringify({
          agentId: this.id,
          agentName: this.name,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'DeveloperAgent',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'error', 'developer']
      });
    } catch (logError) {
      console.error('Failed to log agent error:', logError);
      console.error('Original error:', error);
    }
  }
}