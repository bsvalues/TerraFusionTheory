import { LogCategory, LogLevel } from '@shared/schema';
import { storage } from '../storage';
import { AIModelResponse, AIModelRequestOptions, AIProvider, getAIService } from './ai';
import { RateLimitError, TimeoutError } from '../errors';

// User ID to last request time map (for rate limiting)
const userRequestTimes: Map<number, number[]> = new Map();

// Maximum requests per minute per user
const MAX_REQUESTS_PER_MINUTE = 20;

/**
 * Helper function to log AI service requests
 */
async function logAIRequest(
  operation: string,
  provider: AIProvider,
  request: any,
  userId: number | null = null,
  projectId: number | null = null,
  sessionId: string | null = null
): Promise<void> {
  try {
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.AI,
      message: `AI ${operation} request (${provider})`,
      details: JSON.stringify({
        provider,
        request: typeof request === 'object' ? { ...request } : request,
      }),
      source: 'enhanced-ai-service',
      projectId,
      userId,
      sessionId,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['ai-request', operation, provider]
    });
  } catch (error) {
    console.error(`Failed to log AI request: ${error}`);
  }
}

/**
 * Helper function to log AI service errors
 */
async function logAIError(
  operation: string,
  provider: AIProvider,
  error: any,
  userId: number | null = null,
  projectId: number | null = null,
  sessionId: string | null = null
): Promise<void> {
  try {
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      message: `AI ${operation} error (${provider}): ${error.message || 'Unknown error'}`,
      details: JSON.stringify({
        provider,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }),
      source: 'enhanced-ai-service',
      projectId,
      userId,
      sessionId,
      duration: null,
      statusCode: error.statusCode || 500,
      endpoint: null,
      tags: ['ai-error', operation, provider]
    });
  } catch (logError) {
    console.error(`Failed to log AI error: ${logError}`);
  }
}

/**
 * Helper function to enforce rate limits for AI service calls
 */
function checkRateLimit(userId: number | null): boolean {
  if (!userId) return true; // Skip rate limiting for system or anonymous requests
  
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  
  // Get or create the request times array for this user
  if (!userRequestTimes.has(userId)) {
    userRequestTimes.set(userId, []);
  }
  
  // Get the request times and filter out those older than one minute
  const requestTimes = userRequestTimes.get(userId)!;
  const recentRequests = requestTimes.filter(time => time > oneMinuteAgo);
  
  // Update the request times
  userRequestTimes.set(userId, recentRequests);
  
  // Check if the user has exceeded the rate limit
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  // Add the current request time
  recentRequests.push(now);
  userRequestTimes.set(userId, recentRequests);
  
  return true;
}

/**
 * Enhanced AI service with rate limiting, error handling, and logging
 */
export class EnhancedAIService {
  private static instance: EnhancedAIService;
  
  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of the service
   */
  public static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    
    return EnhancedAIService.instance;
  }

  /**
   * Analyzes a user message and returns AI-generated response
   * @param message The user message to analyze
   * @param projectId The ID of the project for context
   * @param userId The ID of the user making the request (for rate limiting)
   * @param sessionId The session ID for tracking
   * @param provider (Optional) The AI provider to use
   * @returns AI-generated response
   */
  async analyzeMessage(
    message: string,
    projectId: number,
    userId: number | null = null,
    sessionId: string | null = null,
    provider: AIProvider = 'openai'
  ): Promise<string> {
    // Check rate limit
    if (userId && !checkRateLimit(userId)) {
      throw new RateLimitError();
    }
    
    try {
      // Log the request
      await logAIRequest('message-analysis', provider, message, userId, projectId, sessionId);
      
      // Get project information for context
      const project = await storage.getProject(projectId);
      
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      // Get conversation history for context
      const conversation = await storage.getConversationByProjectId(projectId);
      
      // Create system message with context about the project
      const systemMessage = `You are an AI development assistant working on a software project. 
Project information:
- Name: ${project.name}
- Type: ${project.type || 'Not specified'}
- Description: ${project.description || 'Not specified'}
- Technology stack: ${project.technologyStack || 'Not specified'}
- Status: ${project.status || 'Not specified'}
- Progress: ${project.progress || 0}%

Respond to the user's message with helpful, accurate information about software development. 
If the user asks about the project details, use the information provided above.`;

      // Build messages array
      const messages = [
        { role: 'system', content: systemMessage }
      ];
      
      // Add conversation history if available
      if (conversation && conversation.messages) {
        const historyMessages = Array.isArray(conversation.messages) 
          ? conversation.messages
          : (typeof conversation.messages === 'string' 
              ? JSON.parse(conversation.messages) 
              : []);
        
        // Add up to 10 most recent messages (to stay within context limits)
        const recentMessages = historyMessages.slice(-10);
        
        for (const msg of recentMessages) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
      
      // Add the current user message
      messages.push({ role: 'user', content: message });
      
      // Set request options
      const options: AIModelRequestOptions = {
        temperature: 0.7,
        maxTokens: 1000,
        userId,
        projectId,
        sessionId,
        tags: ['message-analysis']
      };
      
      // Get the AI service and generate the completion
      const aiService = getAIService(provider);
      const response = await aiService.generateChatCompletion(messages, options);
      
      return response.text;
    } catch (error) {
      // Log the error
      await logAIError('message-analysis', provider, error, userId, projectId, sessionId);
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Analyzes project requirements and generates structured recommendations
   */
  async analyzeRequirements(
    projectDetails: string,
    userId: number | null = null,
    sessionId: string | null = null,
    provider: AIProvider = 'openai'
  ) {
    // Check rate limit
    if (userId && !checkRateLimit(userId)) {
      throw new RateLimitError();
    }
    
    try {
      // Log the request
      await logAIRequest('requirements-analysis', provider, projectDetails, userId, null, sessionId);
      
      const prompt = `
You are an expert software development assistant. Analyze the following project requirements and provide structured recommendations.

Project details:
${projectDetails}

Provide your analysis in a well-structured JSON format with the following sections:
1. identifiedRequirements - List of key requirements extracted from the project details, with a status field ("success", "warning", or "error") based on clarity and feasibility
2. suggestedTechStack - Recommendations for frontend, backend, database, and hosting technologies based on the requirements
3. missingInformation - List of important details that are missing or unclear in the requirements
4. nextSteps - Ordered list of recommended next steps for the project

Respond ONLY with valid JSON that matches this structure:
{
  "identifiedRequirements": [
    {"name": "string", "status": "success|warning|error"}
  ],
  "suggestedTechStack": {
    "frontend": {"name": "string", "description": "string"},
    "backend": {"name": "string", "description": "string"},
    "database": {"name": "string", "description": "string"},
    "hosting": {"name": "string", "description": "string"}
  },
  "missingInformation": {
    "items": ["string"]
  },
  "nextSteps": [
    {"order": number, "description": "string"}
  ]
}
`;

      // Set request options with JSON response format
      const options: AIModelRequestOptions = {
        temperature: 0.2, // Lower temperature for more consistent structure
        maxTokens: 2000,
        userId,
        projectId: null,
        sessionId,
        tags: ['requirements-analysis']
      };
      
      // Get the AI service and generate the text
      const aiService = getAIService(provider);
      const messages = [
        { 
          role: 'system', 
          content: 'You are an expert software architect specializing in providing structured analysis in JSON format. Be thorough but concise.' 
        },
        { role: 'user', content: prompt }
      ];
      
      const response = await aiService.generateChatCompletion(messages, options);
      
      // Parse the response as JSON
      try {
        // Extract the JSON from the response text (in case the AI included markdown formatting)
        const jsonStart = response.text.indexOf('{');
        const jsonEnd = response.text.lastIndexOf('}') + 1;
        const jsonText = response.text.substring(jsonStart, jsonEnd);
        
        const result = JSON.parse(jsonText);
        
        return result;
      } catch (parseError) {
        await logAIError('requirements-analysis-parse', provider, parseError, userId, null, sessionId);
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error) {
      // Log the error
      await logAIError('requirements-analysis', provider, error, userId, null, sessionId);
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Generates a software architecture based on requirements
   */
  async generateArchitecture(
    requirements: string,
    userId: number | null = null,
    sessionId: string | null = null,
    provider: AIProvider = 'openai'
  ) {
    // Check rate limit
    if (userId && !checkRateLimit(userId)) {
      throw new RateLimitError();
    }
    
    try {
      // Log the request
      await logAIRequest('architecture-generation', provider, requirements, userId, null, sessionId);
      
      const prompt = `
Generate a layered software architecture based on the following requirements:

${requirements}

Provide a JSON response with the following structure:
{
  "layers": [
    {
      "name": "string",
      "components": [
        {
          "name": "string",
          "type": "ui|api|business|data|external"
        }
      ]
    }
  ]
}

The architecture should include at least UI, API, Business Logic, and Data layers, with appropriate components in each layer.
`;

      // Set request options
      const options: AIModelRequestOptions = {
        temperature: 0.3, // Low temperature for more consistent structure
        maxTokens: 1500,
        userId,
        projectId: null,
        sessionId,
        tags: ['architecture-generation']
      };
      
      // Get the AI service and generate the text
      const aiService = getAIService(provider);
      const messages = [
        { 
          role: 'system', 
          content: 'You are an expert software architect specializing in designing layered architectures. Respond with valid JSON format.' 
        },
        { role: 'user', content: prompt }
      ];
      
      const response = await aiService.generateChatCompletion(messages, options);
      
      // Parse the response as JSON
      try {
        // Extract the JSON from the response text (in case the AI included markdown formatting)
        const jsonStart = response.text.indexOf('{');
        const jsonEnd = response.text.lastIndexOf('}') + 1;
        const jsonText = response.text.substring(jsonStart, jsonEnd);
        
        const result = JSON.parse(jsonText);
        
        return result;
      } catch (parseError) {
        await logAIError('architecture-generation-parse', provider, parseError, userId, null, sessionId);
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error) {
      // Log the error
      await logAIError('architecture-generation', provider, error, userId, null, sessionId);
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Generates code based on requirements and specified language
   */
  async generateCode(
    requirements: string,
    language: string,
    userId: number | null = null,
    sessionId: string | null = null,
    provider: AIProvider = 'openai'
  ) {
    // Check rate limit
    if (userId && !checkRateLimit(userId)) {
      throw new RateLimitError();
    }
    
    try {
      // Log the request
      await logAIRequest('code-generation', provider, { requirements, language }, userId, null, sessionId);
      
      const prompt = `
Generate code in ${language} based on the following requirements:

${requirements}

The code should be:
1. Well-structured and organized
2. Properly commented
3. Following best practices for ${language}
4. Include error handling
5. Be production-ready

Provide the code along with an explanation of how it works and any assumptions made.
`;

      // Set request options
      const options: AIModelRequestOptions = {
        temperature: 0.2, // Low temperature for more consistent code
        maxTokens: 2500, // Higher token limit for code generation
        userId,
        projectId: null,
        sessionId,
        tags: ['code-generation', language]
      };
      
      // Get the AI service and generate the text
      const aiService = getAIService(provider);
      const messages = [
        { 
          role: 'system', 
          content: `You are an expert ${language} developer with a focus on writing clean, maintainable code.`
        },
        { role: 'user', content: prompt }
      ];
      
      const response = await aiService.generateChatCompletion(messages, options);
      
      return {
        code: response.text,
        language
      };
    } catch (error) {
      // Log the error
      await logAIError('code-generation', provider, error, userId, null, sessionId);
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Debugs code by analyzing the error message and suggesting fixes
   */
  async debugCode(
    code: string,
    error: string,
    userId: number | null = null,
    sessionId: string | null = null,
    provider: AIProvider = 'openai'
  ) {
    // Check rate limit
    if (userId && !checkRateLimit(userId)) {
      throw new RateLimitError();
    }
    
    try {
      // Log the request
      await logAIRequest('code-debugging', provider, { codeLength: code.length, error }, userId, null, sessionId);
      
      const prompt = `
I need help debugging the following code that produced an error:

\`\`\`
${code}
\`\`\`

The error message is:

\`\`\`
${error}
\`\`\`

Please:
1. Identify the root cause of the error
2. Explain why the error occurred
3. Provide a corrected version of the code
4. Explain the changes made and why they fix the issue
`;

      // Set request options
      const options: AIModelRequestOptions = {
        temperature: 0.3,
        maxTokens: 2000,
        userId,
        projectId: null,
        sessionId,
        tags: ['code-debugging']
      };
      
      // Get the AI service and generate the text
      const aiService = getAIService(provider);
      const messages = [
        { 
          role: 'system', 
          content: 'You are an expert programmer and debugger. Help identify and fix issues in code.'
        },
        { role: 'user', content: prompt }
      ];
      
      const response = await aiService.generateChatCompletion(messages, options);
      
      return {
        analysis: response.text
      };
    } catch (error) {
      // Log the error
      await logAIError('code-debugging', provider, error, userId, null, sessionId);
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Generates documentation for code based on the specified type
   */
  async generateDocumentation(
    code: string,
    docType: string,
    userId: number | null = null,
    sessionId: string | null = null,
    provider: AIProvider = 'openai'
  ) {
    // Check rate limit
    if (userId && !checkRateLimit(userId)) {
      throw new RateLimitError();
    }
    
    try {
      // Log the request
      await logAIRequest('documentation-generation', provider, { codeLength: code.length, docType }, userId, null, sessionId);
      
      const prompt = `
Generate ${docType} documentation for the following code:

\`\`\`
${code}
\`\`\`

The documentation should:
1. Be clear and comprehensive
2. Follow best practices for ${docType.toLowerCase()} documentation
3. Include all relevant information for the code provided
4. Be properly formatted
`;

      // Set request options
      const options: AIModelRequestOptions = {
        temperature: 0.4,
        maxTokens: 2000,
        userId,
        projectId: null,
        sessionId,
        tags: ['documentation-generation', docType.toLowerCase()]
      };
      
      // Get the AI service and generate the text
      const aiService = getAIService(provider);
      const messages = [
        { 
          role: 'system', 
          content: 'You are an expert technical documentation writer. Create clear and comprehensive documentation following best practices.'
        },
        { role: 'user', content: prompt }
      ];
      
      const response = await aiService.generateChatCompletion(messages, options);
      
      return {
        documentation: response.text,
        docType
      };
    } catch (error) {
      // Log the error
      await logAIError('documentation-generation', provider, error, userId, null, sessionId);
      
      // Re-throw the error
      throw error;
    }
  }
}

// Create and export an instance of the service
export const enhancedAIService = EnhancedAIService.getInstance();