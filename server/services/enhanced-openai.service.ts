import 'openai/shims/node';
import OpenAI from 'openai';
import { storage } from '../storage';
import { LogCategory, LogLevel } from '@shared/schema';
import { ServiceError, ValidationError, TimeoutError } from '../errors';

// Create a specific service error for OpenAI
class OpenAIServiceError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.code = 'OPENAI_ERROR';
  }
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 10, // Maximum requests per minute
  windowMs: 60 * 1000, // 1 minute window
  requests: new Map<string, number[]>() // Map to track requests by user
};

// Configure timeouts
const TIMEOUT_MS = 30000; // 30 seconds

/**
 * Helper function to log OpenAI API requests and responses
 */
async function logOpenAIRequest(
  endpoint: string,
  params: any,
  response: any,
  startTime: number,
  projectId: number | null = null,
  userId: number | null = null,
  sessionId: string | null = null
): Promise<void> {
  const duration = Date.now() - startTime;
  
  // Mask sensitive data
  const maskedParams = { ...params };
  if (maskedParams.messages) {
    maskedParams.messages = maskedParams.messages.map((msg: any) => ({
      ...msg,
      content: typeof msg.content === 'string' 
        ? (msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content)
        : '[CONTENT]'
    }));
  }
  
  // Build response summary (don't log full responses)
  const responseSummary = {
    status: 'success',
    model: response.model,
    usage: response.usage,
    choicesCount: response.choices?.length || 0,
    responseLength: response.choices?.[0]?.message?.content?.length || 0
  };
  
  await storage.createLog({
    level: LogLevel.INFO,
    category: LogCategory.AI,
    message: `OpenAI API call to ${endpoint}`,
    details: JSON.stringify({
      endpoint,
      params: maskedParams,
      response: responseSummary,
      duration
    }),
    source: 'openai-service',
    projectId,
    userId,
    sessionId,
    duration,
    statusCode: 200,
    endpoint: `/openai/${endpoint}`,
    tags: ['openai', 'api-call', 'success']
  });
}

/**
 * Helper function to log OpenAI API errors
 */
async function logOpenAIError(
  endpoint: string,
  params: any,
  error: any,
  startTime: number,
  projectId: number | null = null,
  userId: number | null = null,
  sessionId: string | null = null
): Promise<void> {
  const duration = Date.now() - startTime;
  
  // Mask sensitive data
  const maskedParams = { ...params };
  if (maskedParams.messages) {
    maskedParams.messages = maskedParams.messages.map((msg: any) => ({
      ...msg,
      content: typeof msg.content === 'string' 
        ? (msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content)
        : '[CONTENT]'
    }));
  }
  
  const errorDetails = {
    message: error.message,
    status: error.status,
    code: error.code,
    type: error.type,
    param: error.param
  };
  
  await storage.createLog({
    level: LogLevel.ERROR,
    category: LogCategory.AI,
    message: `OpenAI API error in ${endpoint}: ${error.message}`,
    details: JSON.stringify({
      endpoint,
      params: maskedParams,
      error: errorDetails,
      duration
    }),
    source: 'openai-service',
    projectId,
    userId,
    sessionId,
    duration,
    statusCode: error.status || 500,
    endpoint: `/openai/${endpoint}`,
    tags: ['openai', 'api-call', 'error', error.code || 'unknown-error']
  });
}

/**
 * Helper function to enforce rate limits for OpenAI API calls
 */
function checkRateLimit(userId: number | null): boolean {
  const key = userId?.toString() || 'anonymous';
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.windowMs;
  
  // Get existing requests for this user and filter out expired ones
  const existingRequests = (RATE_LIMIT.requests.get(key) || [])
    .filter(time => time > windowStart);
  
  // Check if the number of requests exceeds the limit
  if (existingRequests.length >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  // Add current request to the list
  existingRequests.push(now);
  RATE_LIMIT.requests.set(key, existingRequests);
  
  return true;
}

/**
 * Analyzes a user message and returns AI-generated response
 * @param message The user message to analyze
 * @param projectId The ID of the project for context
 * @returns AI-generated response
 */
export async function analyzeMessage(message: string, projectId: number, userId: number | null = null, sessionId: string | null = null): Promise<string> {
  // Input validation
  if (!message || !message.trim()) {
    throw new ValidationError('Message cannot be empty');
  }
  
  // Rate limiting
  if (!checkRateLimit(userId)) {
    throw new OpenAIServiceError('Rate limit exceeded. Please try again later.', {
      rateLimit: RATE_LIMIT.maxRequests,
      windowMs: RATE_LIMIT.windowMs
    });
  }
  
  const startTime = Date.now();
  
  try {
    // Get project data for context if projectId is provided
    let projectContext = '';
    if (projectId) {
      const project = await storage.getProject(projectId);
      if (project) {
        projectContext = `
Project Name: ${project.name}
Project Description: ${project.description || 'N/A'}
Project Type: ${project.type || 'N/A'}
Target Platform: ${project.targetPlatform || 'N/A'}
Technology Stack: ${project.technologyStack || 'N/A'}
        `;
      }
    }
    
    // Set up timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError('OpenAI API request timed out', {
          requestTime: Date.now() - startTime,
          timeout: TIMEOUT_MS
        }));
      }, TIMEOUT_MS);
    });
    
    // Set up the OpenAI API call promise
    const openaiPromise = openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert AI Developer Assistant for BS Software Solutions. You specialize in help with software development tasks including requirements analysis, architectural design, coding, debugging, and documentation.
          
${projectContext ? `Here is context about the current project:\n${projectContext}` : ''}

Respond in a professional, concise manner, focusing on providing technically accurate and helpful information.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // Race the API call against the timeout
    const response = await Promise.race([openaiPromise, timeoutPromise]) as OpenAI.Chat.Completions.ChatCompletion;
    
    // Log successful request
    await logOpenAIRequest('analyzeMessage', {
      model: "gpt-4o",
      userMessage: message,
      projectId
    }, response, startTime, projectId, userId, sessionId);
    
    return response.choices[0].message.content || 'No response generated.';
    
  } catch (error: any) {
    // Log the error
    await logOpenAIError('analyzeMessage', {
      model: "gpt-4o",
      userMessage: message,
      projectId
    }, error, startTime, projectId, userId, sessionId);
    
    // Transform OpenAI errors into application errors
    if (error.status === 429) {
      throw new OpenAIServiceError('OpenAI rate limit exceeded. Please try again later.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error.status === 401 || error.status === 403) {
      throw new OpenAIServiceError('Authentication error with OpenAI. Please check your API key.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error instanceof TimeoutError) {
      throw error;
    } else {
      throw new OpenAIServiceError('Failed to process message with OpenAI', {
        originalError: error.message,
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    }
  }
}

/**
 * Analyzes project requirements and generates structured recommendations
 * @param projectDetails Project description and requirements
 * @returns Structured analysis of requirements, tech stack, missing info, etc.
 */
export async function analyzeRequirements(projectDetails: string, userId: number | null = null, sessionId: string | null = null) {
  // Input validation
  if (!projectDetails || !projectDetails.trim()) {
    throw new ValidationError('Project details cannot be empty');
  }
  
  // Rate limiting
  if (!checkRateLimit(userId)) {
    throw new OpenAIServiceError('Rate limit exceeded. Please try again later.', {
      rateLimit: RATE_LIMIT.maxRequests,
      windowMs: RATE_LIMIT.windowMs
    });
  }
  
  const startTime = Date.now();
  
  try {
    // Set up timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError('OpenAI API request timed out', {
          requestTime: Date.now() - startTime,
          timeout: TIMEOUT_MS
        }));
      }, TIMEOUT_MS);
    });
    
    // Set up the OpenAI API call promise
    const openaiPromise = openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a requirements analysis expert for BS Software Solutions. 
Analyze the provided project details and requirements to generate a structured analysis.
Your response must be in JSON format with the following structure:
{
  "identifiedRequirements": [
    { "name": "requirement 1", "status": "success" },
    { "name": "requirement 2", "status": "warning" },
    { "name": "requirement 3", "status": "error" }
  ],
  "suggestedTechStack": {
    "frontend": { "name": "technology name", "description": "brief explanation" },
    "backend": { "name": "technology name", "description": "brief explanation" },
    "database": { "name": "technology name", "description": "brief explanation" },
    "hosting": { "name": "technology name", "description": "brief explanation" }
  },
  "missingInformation": {
    "items": ["missing info 1", "missing info 2"]
  },
  "nextSteps": [
    { "order": 1, "description": "first step" },
    { "order": 2, "description": "second step" }
  ]
}`
        },
        {
          role: "user",
          content: projectDetails
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });
    
    // Race the API call against the timeout
    const response = await Promise.race([openaiPromise, timeoutPromise]) as OpenAI.Chat.Completions.ChatCompletion;
    
    // Log successful request
    await logOpenAIRequest('analyzeRequirements', {
      model: "gpt-4o",
      projectDetails: projectDetails.substring(0, 100) + '...'
    }, response, startTime, null, userId, sessionId);
    
    // Parse JSON response
    const analysisContent = response.choices[0].message.content || '{}';
    try {
      const analysis = JSON.parse(analysisContent);
      return analysis;
    } catch (parseError) {
      throw new ValidationError('Failed to parse OpenAI response as JSON', {
        response: analysisContent
      });
    }
    
  } catch (error: any) {
    // Log the error
    await logOpenAIError('analyzeRequirements', {
      model: "gpt-4o",
      projectDetails: projectDetails.substring(0, 100) + '...'
    }, error, startTime, null, userId, sessionId);
    
    // Transform OpenAI errors into application errors
    if (error.status === 429) {
      throw new OpenAIServiceError('OpenAI rate limit exceeded. Please try again later.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error.status === 401 || error.status === 403) {
      throw new OpenAIServiceError('Authentication error with OpenAI. Please check your API key.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error instanceof TimeoutError || error instanceof ValidationError) {
      throw error;
    } else {
      throw new OpenAIServiceError('Failed to analyze requirements with OpenAI', {
        originalError: error.message,
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    }
  }
}

/**
 * Generates a software architecture based on requirements
 * @param requirements The requirements to base architecture on
 * @returns Structured architecture design
 */
export async function generateArchitecture(requirements: string, userId: number | null = null, sessionId: string | null = null) {
  // Input validation
  if (!requirements || !requirements.trim()) {
    throw new ValidationError('Requirements cannot be empty');
  }
  
  // Rate limiting
  if (!checkRateLimit(userId)) {
    throw new OpenAIServiceError('Rate limit exceeded. Please try again later.', {
      rateLimit: RATE_LIMIT.maxRequests,
      windowMs: RATE_LIMIT.windowMs
    });
  }
  
  const startTime = Date.now();
  
  try {
    // Set up timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError('OpenAI API request timed out', {
          requestTime: Date.now() - startTime,
          timeout: TIMEOUT_MS
        }));
      }, TIMEOUT_MS);
    });
    
    // Set up the OpenAI API call promise
    const openaiPromise = openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a software architecture expert for BS Software Solutions. 
Generate a structured architecture design based on the provided requirements.
Your response must be in JSON format with the following structure:
{
  "layers": [
    {
      "name": "UI Layer",
      "components": [
        { "name": "Component 1", "type": "ui" },
        { "name": "Component 2", "type": "ui" }
      ]
    },
    {
      "name": "API Layer",
      "components": [
        { "name": "Component 3", "type": "api" },
        { "name": "Component 4", "type": "api" }
      ]
    },
    {
      "name": "Business Layer",
      "components": [
        { "name": "Component 5", "type": "business" },
        { "name": "Component 6", "type": "business" }
      ]
    },
    {
      "name": "Data Layer",
      "components": [
        { "name": "Component 7", "type": "data" },
        { "name": "Component 8", "type": "data" }
      ]
    },
    {
      "name": "External Services",
      "components": [
        { "name": "Service 1", "type": "external" },
        { "name": "Service 2", "type": "external" }
      ]
    }
  ]
}`
        },
        {
          role: "user",
          content: requirements
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });
    
    // Race the API call against the timeout
    const response = await Promise.race([openaiPromise, timeoutPromise]) as OpenAI.Chat.Completions.ChatCompletion;
    
    // Log successful request
    await logOpenAIRequest('generateArchitecture', {
      model: "gpt-4o",
      requirements: requirements.substring(0, 100) + '...'
    }, response, startTime, null, userId, sessionId);
    
    // Parse JSON response
    const architectureContent = response.choices[0].message.content || '{}';
    try {
      const architecture = JSON.parse(architectureContent);
      return architecture;
    } catch (parseError) {
      throw new ValidationError('Failed to parse OpenAI response as JSON', {
        response: architectureContent
      });
    }
    
  } catch (error: any) {
    // Log the error
    await logOpenAIError('generateArchitecture', {
      model: "gpt-4o",
      requirements: requirements.substring(0, 100) + '...'
    }, error, startTime, null, userId, sessionId);
    
    // Transform OpenAI errors into application errors
    if (error.status === 429) {
      throw new OpenAIServiceError('OpenAI rate limit exceeded. Please try again later.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error.status === 401 || error.status === 403) {
      throw new OpenAIServiceError('Authentication error with OpenAI. Please check your API key.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error instanceof TimeoutError || error instanceof ValidationError) {
      throw error;
    } else {
      throw new OpenAIServiceError('Failed to generate architecture with OpenAI', {
        originalError: error.message,
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    }
  }
}

/**
 * Generates code based on requirements and specified language
 * @param requirements The requirements to base the code on
 * @param language The programming language to use
 * @returns Generated code with explanation
 */
export async function generateCode(requirements: string, language: string, userId: number | null = null, sessionId: string | null = null) {
  // Input validation
  if (!requirements || !requirements.trim()) {
    throw new ValidationError('Requirements cannot be empty');
  }
  
  if (!language || !language.trim()) {
    throw new ValidationError('Programming language must be specified');
  }
  
  // Rate limiting
  if (!checkRateLimit(userId)) {
    throw new OpenAIServiceError('Rate limit exceeded. Please try again later.', {
      rateLimit: RATE_LIMIT.maxRequests,
      windowMs: RATE_LIMIT.windowMs
    });
  }
  
  const startTime = Date.now();
  
  try {
    // Set up timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError('OpenAI API request timed out', {
          requestTime: Date.now() - startTime,
          timeout: TIMEOUT_MS
        }));
      }, TIMEOUT_MS);
    });
    
    // Set up the OpenAI API call promise
    const openaiPromise = openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a code generation expert for BS Software Solutions. 
Generate code based on the provided requirements using ${language}.
Include comments, error handling, and follow best practices.
Provide a brief explanation of how the code works and any important considerations.`
        },
        {
          role: "user",
          content: requirements
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });
    
    // Race the API call against the timeout
    const response = await Promise.race([openaiPromise, timeoutPromise]) as OpenAI.Chat.Completions.ChatCompletion;
    
    // Log successful request
    await logOpenAIRequest('generateCode', {
      model: "gpt-4o",
      requirements: requirements.substring(0, 100) + '...',
      language
    }, response, startTime, null, userId, sessionId);
    
    return {
      code: response.choices[0].message.content || 'No code generated.',
      language
    };
    
  } catch (error: any) {
    // Log the error
    await logOpenAIError('generateCode', {
      model: "gpt-4o",
      requirements: requirements.substring(0, 100) + '...',
      language
    }, error, startTime, null, userId, sessionId);
    
    // Transform OpenAI errors into application errors
    if (error.status === 429) {
      throw new OpenAIServiceError('OpenAI rate limit exceeded. Please try again later.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error.status === 401 || error.status === 403) {
      throw new OpenAIServiceError('Authentication error with OpenAI. Please check your API key.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error instanceof TimeoutError || error instanceof ValidationError) {
      throw error;
    } else {
      throw new OpenAIServiceError('Failed to generate code with OpenAI', {
        originalError: error.message,
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    }
  }
}

/**
 * Debugs code by analyzing the error message and suggesting fixes
 * @param code The code containing errors
 * @param error The error message to analyze
 * @returns Debugging analysis with suggested fixes
 */
export async function debugCode(code: string, error: string, userId: number | null = null, sessionId: string | null = null) {
  // Input validation
  if (!code || !code.trim()) {
    throw new ValidationError('Code cannot be empty');
  }
  
  if (!error || !error.trim()) {
    throw new ValidationError('Error message cannot be empty');
  }
  
  // Rate limiting
  if (!checkRateLimit(userId)) {
    throw new OpenAIServiceError('Rate limit exceeded. Please try again later.', {
      rateLimit: RATE_LIMIT.maxRequests,
      windowMs: RATE_LIMIT.windowMs
    });
  }
  
  const startTime = Date.now();
  
  try {
    // Set up timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError('OpenAI API request timed out', {
          requestTime: Date.now() - startTime,
          timeout: TIMEOUT_MS
        }));
      }, TIMEOUT_MS);
    });
    
    // Set up the OpenAI API call promise
    const openaiPromise = openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a debugging expert for BS Software Solutions. 
Analyze the provided code and error message to identify issues and suggest fixes.
Provide a detailed explanation of the problem, the root cause, and the recommended solution.
Include fixed code snippets where appropriate.`
        },
        {
          role: "user",
          content: `Code:\n\`\`\`\n${code}\n\`\`\`\n\nError:\n${error}`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });
    
    // Race the API call against the timeout
    const response = await Promise.race([openaiPromise, timeoutPromise]) as OpenAI.Chat.Completions.ChatCompletion;
    
    // Log successful request
    await logOpenAIRequest('debugCode', {
      model: "gpt-4o",
      codeLength: code.length,
      errorMessage: error.substring(0, 100) + (error.length > 100 ? '...' : '')
    }, response, startTime, null, userId, sessionId);
    
    return {
      analysis: response.choices[0].message.content || 'No debugging analysis generated.'
    };
    
  } catch (error: any) {
    // Log the error
    await logOpenAIError('debugCode', {
      model: "gpt-4o",
      codeLength: code.length,
      errorMessage: error.substring(0, 100) + (error.length > 100 ? '...' : '')
    }, error, startTime, null, userId, sessionId);
    
    // Transform OpenAI errors into application errors
    if (error.status === 429) {
      throw new OpenAIServiceError('OpenAI rate limit exceeded. Please try again later.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error.status === 401 || error.status === 403) {
      throw new OpenAIServiceError('Authentication error with OpenAI. Please check your API key.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error instanceof TimeoutError || error instanceof ValidationError) {
      throw error;
    } else {
      throw new OpenAIServiceError('Failed to debug code with OpenAI', {
        originalError: error.message,
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    }
  }
}

/**
 * Generates documentation for code based on the specified type
 * @param code The code to document
 * @param docType The type of documentation (e.g., jsdoc, readme, api)
 * @returns Generated documentation
 */
export async function generateDocumentation(code: string, docType: string, userId: number | null = null, sessionId: string | null = null) {
  // Input validation
  if (!code || !code.trim()) {
    throw new ValidationError('Code cannot be empty');
  }
  
  if (!docType || !docType.trim()) {
    throw new ValidationError('Documentation type must be specified');
  }
  
  // Rate limiting
  if (!checkRateLimit(userId)) {
    throw new OpenAIServiceError('Rate limit exceeded. Please try again later.', {
      rateLimit: RATE_LIMIT.maxRequests,
      windowMs: RATE_LIMIT.windowMs
    });
  }
  
  const startTime = Date.now();
  
  try {
    // Set up timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError('OpenAI API request timed out', {
          requestTime: Date.now() - startTime,
          timeout: TIMEOUT_MS
        }));
      }, TIMEOUT_MS);
    });
    
    // Set up the OpenAI API call promise
    const openaiPromise = openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a documentation expert for BS Software Solutions. 
Generate ${docType} documentation for the provided code.
Follow best practices for documentation format, style, and content.
Be comprehensive but concise, focusing on the most important aspects.`
        },
        {
          role: "user",
          content: `Code:\n\`\`\`\n${code}\n\`\`\`\n\nPlease generate ${docType} documentation for this code.`
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });
    
    // Race the API call against the timeout
    const response = await Promise.race([openaiPromise, timeoutPromise]) as OpenAI.Chat.Completions.ChatCompletion;
    
    // Log successful request
    await logOpenAIRequest('generateDocumentation', {
      model: "gpt-4o",
      codeLength: code.length,
      docType
    }, response, startTime, null, userId, sessionId);
    
    return {
      documentation: response.choices[0].message.content || 'No documentation generated.',
      docType
    };
    
  } catch (error: any) {
    // Log the error
    await logOpenAIError('generateDocumentation', {
      model: "gpt-4o",
      codeLength: code.length,
      docType
    }, error, startTime, null, userId, sessionId);
    
    // Transform OpenAI errors into application errors
    if (error.status === 429) {
      throw new OpenAIServiceError('OpenAI rate limit exceeded. Please try again later.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error.status === 401 || error.status === 403) {
      throw new OpenAIServiceError('Authentication error with OpenAI. Please check your API key.', {
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    } else if (error instanceof TimeoutError || error instanceof ValidationError) {
      throw error;
    } else {
      throw new OpenAIServiceError('Failed to generate documentation with OpenAI', {
        originalError: error.message,
        openaiError: {
          message: error.message,
          type: error.type,
          code: error.code
        }
      });
    }
  }
}