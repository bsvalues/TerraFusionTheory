import { apiRequest } from "./queryClient";
import { ErrorLog } from "@/hooks/useErrors";
import { Analysis } from "@shared/schema";

/**
 * Sends a user message to the OpenAI-powered backend for processing
 * @param message The user's message to process
 * @param projectId The ID of the current project
 * @returns The AI assistant's response
 */
export async function sendMessageToAI(message: string, projectId: number) {
  try {
    const response = await apiRequest({
      url: "/api/ai/message",
      method: "POST",
      body: { message, projectId },
    });
    
    return response;
  } catch (error) {
    console.error("Error sending message to AI:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to send message to AI");
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
    const response = await apiRequest<Analysis>({
      url: "/api/ai/analyze-requirements",
      method: "POST",
      body: { projectDetails, projectId },
    });
    
    return response;
  } catch (error) {
    console.error("Error analyzing requirements:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to analyze requirements");
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
    const response = await apiRequest({
      url: "/api/ai/generate-code",
      method: "POST",
      body: { requirements, language, projectId },
    });
    
    return response;
  } catch (error) {
    console.error("Error generating code:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate code");
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
    const response = await apiRequest({
      url: "/api/ai/debug-code",
      method: "POST",
      body: { code, errorMsg, projectId },
    });
    
    return response;
  } catch (error) {
    console.error("Error debugging code:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to debug code");
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
    const response = await apiRequest({
      url: "/api/ai/generate-documentation",
      method: "POST",
      body: { code, docType, projectId },
    });
    
    return response;
  } catch (error) {
    console.error("Error generating documentation:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate documentation");
  }
}

/**
 * Formats error log data for the logging system
 * @param error The error to log
 * @param source The source of the error
 * @returns Formatted error log object
 */
export function formatErrorLog(error: any, source: string): ErrorLog {
  return {
    id: Math.random().toString(36).substring(2, 12),
    timestamp: new Date().toISOString(),
    message: error instanceof Error ? error.message : String(error),
    source: source as any,
    details: error.details || JSON.stringify(error, null, 2),
    stack: error instanceof Error ? error.stack : undefined,
  };
}