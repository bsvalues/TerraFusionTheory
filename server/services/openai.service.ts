import OpenAI from "openai";
import { LogCategory, LogLevel } from "@shared/schema";
import { storage } from "../storage";

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Analyzes a user message and returns AI-generated response
 * @param message The user message to analyze
 * @param projectId The ID of the project for context
 * @returns AI-generated response
 */
export async function analyzeMessage(message: string, projectId: number) {
  try {
    // Log the request
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.AI,
      message: `Processing user message for project ${projectId}`,
      details: `Message length: ${message.length} characters`,
      source: "openai.service.ts",
      projectId,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ["message", "analysis"]
    });

    const startTime = Date.now();
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: "You are an AI developer assistant. Provide helpful, accurate, and detailed responses to help the user with their software development tasks. Focus on code quality, best practices, and clarity in your explanations."
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const duration = Date.now() - startTime;
    
    // Log the successful response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.AI,
      message: "Successfully generated AI response",
      details: `Response generated in ${duration}ms, tokens: ${response.usage?.total_tokens || 'unknown'}`,
      source: "openai.service.ts",
      projectId,
      userId: null,
      sessionId: null,
      duration,
      statusCode: 200,
      endpoint: null,
      tags: ["message", "response", "success"]
    });

    return response.choices[0].message.content;
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      message: "Failed to generate AI response",
      details: error instanceof Error ? error.message : String(error),
      source: "openai.service.ts",
      projectId,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: error instanceof Error && error.message.includes("429") ? 429 : 500,
      endpoint: null,
      tags: ["message", "error"]
    });
    
    throw error;
  }
}

/**
 * Analyzes project requirements and generates structured recommendations
 * @param projectDetails Project description and requirements
 * @returns Structured analysis of requirements, tech stack, missing info, etc.
 */
export async function analyzeRequirements(projectDetails: string) {
  try {
    const startTime = Date.now();
    
    const systemPrompt = `
      You are an expert software requirements analyst. 
      Analyze the given project details and provide a structured analysis in JSON format with the following sections:
      1. identifiedRequirements: Array of requirements with name and status (success, warning, or error)
      2. suggestedTechStack: Object with recommendations for frontend, backend, database, and hosting options
      3. missingInformation: Array of items that are unclear or missing from the requirements
      4. nextSteps: Array of ordered steps to proceed with the project
      
      Be thorough in your analysis but focus on practical, actionable insights.
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: projectDetails }
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    const duration = Date.now() - startTime;
    
    // Log the successful response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.AI,
      message: "Successfully analyzed project requirements",
      details: `Analysis generated in ${duration}ms, tokens: ${response.usage?.total_tokens || 'unknown'}`,
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration,
      statusCode: 200,
      endpoint: null,
      tags: ["requirements", "analysis", "success"]
    });
    
    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : null;
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      message: "Failed to analyze project requirements",
      details: error instanceof Error ? error.message : String(error),
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: error instanceof Error && error.message.includes("429") ? 429 : 500,
      endpoint: null,
      tags: ["requirements", "analysis", "error"]
    });
    
    throw error;
  }
}

/**
 * Generates a software architecture based on requirements
 * @param requirements The requirements to base architecture on
 * @returns Structured architecture design
 */
export async function generateArchitecture(requirements: string) {
  try {
    const startTime = Date.now();
    
    const systemPrompt = `
      You are an expert software architect. 
      Design a layered architecture for the given requirements. 
      Provide the response in JSON format with the following structure:
      {
        "layers": [
          {
            "name": "Layer name",
            "components": [
              { "name": "Component name", "type": "ui|api|business|data|external" }
            ]
          }
        ]
      }
      
      Include essential layers such as UI, API, Business Logic, Data Access, and External Services.
      Be specific about the components in each layer and their responsibilities.
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: requirements }
      ],
      temperature: 0.4,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    const duration = Date.now() - startTime;
    
    // Log the successful response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.AI,
      message: "Successfully generated architecture design",
      details: `Architecture generated in ${duration}ms, tokens: ${response.usage?.total_tokens || 'unknown'}`,
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration,
      statusCode: 200,
      endpoint: null,
      tags: ["architecture", "design", "success"]
    });
    
    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : null;
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      message: "Failed to generate architecture design",
      details: error instanceof Error ? error.message : String(error),
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: error instanceof Error && error.message.includes("429") ? 429 : 500,
      endpoint: null,
      tags: ["architecture", "design", "error"]
    });
    
    throw error;
  }
}

/**
 * Generates code based on requirements and specified language
 * @param requirements The requirements to base the code on
 * @param language The programming language to use
 * @returns Generated code with explanation
 */
export async function generateCode(requirements: string, language: string) {
  try {
    const startTime = Date.now();
    
    const systemPrompt = `
      You are an expert software developer. 
      Generate production-quality ${language} code based on the given requirements.
      Provide detailed explanations for your implementation choices.
      Follow best practices for ${language} and ensure the code is:
      1. Well-structured and organized
      2. Properly commented
      3. Error-handled
      4. Testable
      5. Secure
      
      Wrap code blocks in \`\`\`${language} and \`\`\` markers.
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: requirements }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const duration = Date.now() - startTime;
    
    // Log the successful response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.AI,
      message: `Successfully generated ${language} code`,
      details: `Code generated in ${duration}ms, tokens: ${response.usage?.total_tokens || 'unknown'}`,
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration,
      statusCode: 200,
      endpoint: null,
      tags: ["code-generation", language, "success"]
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      message: `Failed to generate ${language} code`,
      details: error instanceof Error ? error.message : String(error),
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: error instanceof Error && error.message.includes("429") ? 429 : 500,
      endpoint: null,
      tags: ["code-generation", language, "error"]
    });
    
    throw error;
  }
}

/**
 * Debugs code by analyzing the error message and suggesting fixes
 * @param code The code containing errors
 * @param error The error message to analyze
 * @returns Debugging analysis with suggested fixes
 */
export async function debugCode(code: string, error: string) {
  try {
    const startTime = Date.now();
    
    const systemPrompt = `
      You are an expert software debugger.
      Analyze the provided code and error message to identify the issue.
      Provide a structured response with:
      1. A clear explanation of the problem
      2. The root cause of the error
      3. A suggested fix with code examples
      4. Preventative measures to avoid similar errors in the future
      
      Be specific and practical in your suggestions.
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Code:\n\n${code}\n\nError message:\n\n${error}\n\nPlease help me debug this issue.` 
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });
    
    const duration = Date.now() - startTime;
    
    // Log the successful response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.AI,
      message: "Successfully debugged code",
      details: `Debugging analysis generated in ${duration}ms, tokens: ${response.usage?.total_tokens || 'unknown'}`,
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration,
      statusCode: 200,
      endpoint: null,
      tags: ["debugging", "analysis", "success"]
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      message: "Failed to debug code",
      details: error instanceof Error ? error.message : String(error),
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: error instanceof Error && error.message.includes("429") ? 429 : 500,
      endpoint: null,
      tags: ["debugging", "analysis", "error"]
    });
    
    throw error;
  }
}

/**
 * Generates documentation for code based on the specified type
 * @param code The code to document
 * @param docType The type of documentation (e.g., jsdoc, readme, api)
 * @returns Generated documentation
 */
export async function generateDocumentation(code: string, docType: string) {
  try {
    const startTime = Date.now();
    
    let systemPrompt = "";
    
    switch (docType.toLowerCase()) {
      case "jsdoc":
        systemPrompt = `
          You are an expert at writing JSDoc documentation.
          Add comprehensive JSDoc comments to the provided code.
          Follow best practices for JSDoc syntax and be thorough in documenting:
          1. Functions and methods with @param, @returns, and @throws tags
          2. Classes with @class descriptions
          3. Types and interfaces with property descriptions
          4. Files with overall purpose documentation
          
          Return the fully documented code.
        `;
        break;
      case "readme":
        systemPrompt = `
          You are an expert at writing project README documentation.
          Create a comprehensive README.md file for the provided code.
          Include sections for:
          1. Project overview and purpose
          2. Installation instructions
          3. Usage examples
          4. API documentation
          5. Configuration options
          6. Troubleshooting
          7. Contributing guidelines
          
          Format the content in markdown with appropriate headings, code blocks, and formatting.
        `;
        break;
      case "api":
        systemPrompt = `
          You are an expert at writing API documentation.
          Create detailed API documentation for the provided code.
          Include:
          1. Endpoint descriptions
          2. Request parameters and types
          3. Response formats and status codes
          4. Authentication requirements
          5. Error handling
          6. Example requests and responses
          
          Format the documentation in a clean, structured way using markdown.
        `;
        break;
      default:
        systemPrompt = `
          You are an expert at technical documentation.
          Create comprehensive documentation for the provided code.
          Analyze the code and provide appropriate documentation based on the code's purpose and structure.
          Use clear explanations and examples to illustrate how the code works.
          Format the documentation in markdown with appropriate sections and code examples.
        `;
    }
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: code }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const duration = Date.now() - startTime;
    
    // Log the successful response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.AI,
      message: `Successfully generated ${docType} documentation`,
      details: `Documentation generated in ${duration}ms, tokens: ${response.usage?.total_tokens || 'unknown'}`,
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration,
      statusCode: 200,
      endpoint: null,
      tags: ["documentation", docType, "success"]
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      message: `Failed to generate ${docType} documentation`,
      details: error instanceof Error ? error.message : String(error),
      source: "openai.service.ts",
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: error instanceof Error && error.message.includes("429") ? 429 : 500,
      endpoint: null,
      tags: ["documentation", docType, "error"]
    });
    
    throw error;
  }
}