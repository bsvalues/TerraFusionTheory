import { apiRequest } from "./queryClient";
import { ErrorLog, ErrorSource } from "@/hooks/useErrors";
import { Analysis } from "@shared/schema";

/**
 * Sends a user message to the OpenAI-powered backend for processing
 * @param message The user's message to process
 * @param projectId The ID of the current project
 * @returns The AI assistant's response
 */
export async function sendMessageToAI(message: string, projectId: number) {
  try {
    const response = await apiRequest<{ response: string }>(`/api/ai/message`, {
      method: "POST",
      body: JSON.stringify({ message, projectId })
    });
    
    return response.response;
  } catch (error) {
    console.error("Error sending message to AI:", error);
    throw error;
  }
}

/**
 * Analyzes project requirements based on project details
 * @param projectDetails The project details to analyze
 * @param projectId The ID of the current project
 * @returns Analysis results including requirements, tech stack, missing info and next steps
 */
export async function analyzeRequirements(projectDetails: string, projectId: number): Promise<Analysis> {
  try {
    const response = await apiRequest<Analysis>(`/api/ai/analyze`, {
      method: "POST",
      body: JSON.stringify({ projectDetails, projectId })
    });
    
    return response;
  } catch (error) {
    console.error("Error analyzing requirements:", error);
    throw error;
  }
}

/**
 * Generates code based on requirements and specified language
 * @param requirements The requirements to generate code for
 * @param language The programming language to use
 * @param projectId The ID of the current project
 * @returns Generated code with explanation
 */
export async function generateCode(requirements: string, language: string, projectId: number) {
  try {
    const response = await apiRequest<{ code: string }>(`/api/ai/generate-code`, {
      method: "POST",
      body: JSON.stringify({ requirements, language, projectId })
    });
    
    return response.code;
  } catch (error) {
    console.error("Error generating code:", error);
    throw error;
  }
}

/**
 * Debugs code by analyzing errors and suggesting fixes
 * @param code The code that contains errors
 * @param errorMsg The error message to analyze
 * @param projectId The ID of the current project
 * @returns Debugging analysis with suggested fixes
 */
export async function debugCode(code: string, errorMsg: string, projectId: number) {
  try {
    const response = await apiRequest<{ analysis: string }>(`/api/ai/debug`, {
      method: "POST",
      body: JSON.stringify({ code, error: errorMsg, projectId })
    });
    
    return response.analysis;
  } catch (error) {
    console.error("Error debugging code:", error);
    throw error;
  }
}

/**
 * Generates documentation for code
 * @param code The code to document
 * @param docType The type of documentation to generate (e.g., "jsdoc", "readme", "api")
 * @param projectId The ID of the current project
 * @returns Generated documentation
 */
export async function generateDocumentation(code: string, docType: string, projectId: number) {
  try {
    const response = await apiRequest<{ documentation: string }>(`/api/ai/documentation`, {
      method: "POST",
      body: JSON.stringify({ code, docType, projectId })
    });
    
    return response.documentation;
  } catch (error) {
    console.error("Error generating documentation:", error);
    throw error;
  }
}

/**
 * Formats error log data for the logging system
 * @param error The error to log
 * @param source The source of the error as a valid ErrorSource value
 * @returns Formatted error log object
 */
export function formatErrorLog(error: any, source: ErrorSource): ErrorLog {
  return {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    message: error.message || "Unknown error",
    source: source,
    details: typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error),
    stack: error.stack
  };
}