import { Request, Response } from "express";
import * as openaiService from "../services/openai.service";
import { LogCategory, LogLevel } from "@shared/schema";
import { storage } from "../storage";

/**
 * Handles user messages sent to the AI assistant
 * @param req Express request object
 * @param res Express response object
 */
export async function handleMessage(req: Request, res: Response) {
  try {
    const { message, projectId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    // Log the request
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "AI message request received",
      details: `Message length: ${message.length} characters`,
      source: "openai.controller.ts",
      projectId,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: null,
      endpoint: "/api/ai/message",
      tags: ["api", "request", "ai"]
    });

    const startTime = Date.now();
    const response = await openaiService.analyzeMessage(message, projectId);
    const duration = Date.now() - startTime;

    // Update the conversation with the new message
    const conversation = await storage.getConversationByProjectId(projectId);
    
    if (conversation) {
      const messages = Array.isArray(conversation.messages) 
        ? conversation.messages 
        : [];
      
      // Add user message
      messages.push({
        role: "user",
        content: message,
        timestamp: new Date().toISOString()
      });
      
      // Add assistant response
      messages.push({
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      });
      
      // Update conversation in storage
      await storage.updateConversation({
        ...conversation,
        messages
      });
    }

    // Log the success response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "AI message response sent",
      details: `Response generated in ${duration}ms`,
      source: "openai.controller.ts",
      projectId,
      userId: null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: 200,
      endpoint: "/api/ai/message",
      tags: ["api", "response", "ai", "success"]
    });

    return res.status(200).json({ response });
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: "AI message request failed",
      details: error instanceof Error ? error.message : String(error),
      source: "openai.controller.ts",
      projectId: req.body.projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: "/api/ai/message",
      tags: ["api", "error", "ai"]
    });

    console.error("Error handling message:", error);
    return res.status(500).json({ 
      error: "Failed to process message", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}

/**
 * Handles project requirements analysis
 * @param req Express request object
 * @param res Express response object
 */
export async function analyzeRequirements(req: Request, res: Response) {
  try {
    const { projectDetails, projectId } = req.body;

    if (!projectDetails) {
      return res.status(400).json({ error: "Project details are required" });
    }

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    // Log the request
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "Requirements analysis request received",
      details: `Project ID: ${projectId}`,
      source: "openai.controller.ts",
      projectId,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: null,
      endpoint: "/api/ai/analyze-requirements",
      tags: ["api", "request", "requirements"]
    });

    const startTime = Date.now();
    const analysis = await openaiService.analyzeRequirements(projectDetails);
    const duration = Date.now() - startTime;

    // Get existing analysis or create new one
    const existingAnalysis = await storage.getAnalysisByProjectId(projectId);

    if (existingAnalysis) {
      // Update existing analysis
      await storage.updateAnalysis({
        ...existingAnalysis,
        identifiedRequirements: analysis.identifiedRequirements,
        suggestedTechStack: analysis.suggestedTechStack,
        missingInformation: analysis.missingInformation,
        nextSteps: analysis.nextSteps
      });
    } else {
      // Create new analysis
      await storage.saveAnalysis({
        projectId,
        identifiedRequirements: analysis.identifiedRequirements,
        suggestedTechStack: analysis.suggestedTechStack,
        missingInformation: analysis.missingInformation,
        nextSteps: analysis.nextSteps
      });
    }

    // Log the success response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "Requirements analysis response sent",
      details: `Analysis generated in ${duration}ms`,
      source: "openai.controller.ts",
      projectId,
      userId: null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: 200,
      endpoint: "/api/ai/analyze-requirements",
      tags: ["api", "response", "requirements", "success"]
    });

    return res.status(200).json(analysis);
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: "Requirements analysis request failed",
      details: error instanceof Error ? error.message : String(error),
      source: "openai.controller.ts",
      projectId: req.body.projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: "/api/ai/analyze-requirements",
      tags: ["api", "error", "requirements"]
    });

    console.error("Error analyzing requirements:", error);
    return res.status(500).json({ 
      error: "Failed to analyze requirements", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}

/**
 * Handles code generation requests
 * @param req Express request object
 * @param res Express response object
 */
export async function generateCode(req: Request, res: Response) {
  try {
    const { requirements, language, projectId } = req.body;

    if (!requirements) {
      return res.status(400).json({ error: "Requirements are required" });
    }

    if (!language) {
      return res.status(400).json({ error: "Programming language is required" });
    }

    // Log the request
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "Code generation request received",
      details: `Language: ${language}`,
      source: "openai.controller.ts",
      projectId: projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: null,
      endpoint: "/api/ai/generate-code",
      tags: ["api", "request", "code-generation"]
    });

    const startTime = Date.now();
    const generatedCode = await openaiService.generateCode(requirements, language);
    const duration = Date.now() - startTime;

    // Log the success response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "Code generation response sent",
      details: `Code generated in ${duration}ms`,
      source: "openai.controller.ts",
      projectId: projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: 200,
      endpoint: "/api/ai/generate-code",
      tags: ["api", "response", "code-generation", "success"]
    });

    return res.status(200).json({ code: generatedCode });
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: "Code generation request failed",
      details: error instanceof Error ? error.message : String(error),
      source: "openai.controller.ts",
      projectId: req.body.projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: "/api/ai/generate-code",
      tags: ["api", "error", "code-generation"]
    });

    console.error("Error generating code:", error);
    return res.status(500).json({ 
      error: "Failed to generate code", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}

/**
 * Handles code debugging requests
 * @param req Express request object
 * @param res Express response object
 */
export async function debugCode(req: Request, res: Response) {
  try {
    const { code, error: errorMsg, projectId } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    if (!errorMsg) {
      return res.status(400).json({ error: "Error message is required" });
    }

    // Log the request
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "Code debugging request received",
      details: `Code length: ${code.length} characters`,
      source: "openai.controller.ts",
      projectId: projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: null,
      endpoint: "/api/ai/debug-code",
      tags: ["api", "request", "debugging"]
    });

    const startTime = Date.now();
    const debugResult = await openaiService.debugCode(code, errorMsg);
    const duration = Date.now() - startTime;

    // Log the success response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "Code debugging response sent",
      details: `Debugging completed in ${duration}ms`,
      source: "openai.controller.ts",
      projectId: projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: 200,
      endpoint: "/api/ai/debug-code",
      tags: ["api", "response", "debugging", "success"]
    });

    return res.status(200).json({ analysis: debugResult });
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: "Code debugging request failed",
      details: error instanceof Error ? error.message : String(error),
      source: "openai.controller.ts",
      projectId: req.body.projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: "/api/ai/debug-code",
      tags: ["api", "error", "debugging"]
    });

    console.error("Error debugging code:", error);
    return res.status(500).json({ 
      error: "Failed to debug code", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}

/**
 * Handles documentation generation requests
 * @param req Express request object
 * @param res Express response object
 */
export async function generateDocumentation(req: Request, res: Response) {
  try {
    const { code, docType, projectId } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    if (!docType) {
      return res.status(400).json({ error: "Documentation type is required" });
    }

    // Log the request
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "Documentation generation request received",
      details: `Documentation type: ${docType}`,
      source: "openai.controller.ts",
      projectId: projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: null,
      endpoint: "/api/ai/generate-documentation",
      tags: ["api", "request", "documentation"]
    });

    const startTime = Date.now();
    const documentation = await openaiService.generateDocumentation(code, docType);
    const duration = Date.now() - startTime;

    // Log the success response
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: "Documentation generation response sent",
      details: `Documentation generated in ${duration}ms`,
      source: "openai.controller.ts",
      projectId: projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: 200,
      endpoint: "/api/ai/generate-documentation",
      tags: ["api", "response", "documentation", "success"]
    });

    return res.status(200).json({ documentation });
  } catch (error) {
    // Log the error
    await storage.createLog({
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: "Documentation generation request failed",
      details: error instanceof Error ? error.message : String(error),
      source: "openai.controller.ts",
      projectId: req.body.projectId || null,
      userId: null,
      sessionId: req.sessionID || null,
      duration: null,
      statusCode: 500,
      endpoint: "/api/ai/generate-documentation",
      tags: ["api", "error", "documentation"]
    });

    console.error("Error generating documentation:", error);
    return res.status(500).json({ 
      error: "Failed to generate documentation", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}