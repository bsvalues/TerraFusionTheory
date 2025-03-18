import { Request, Response } from "express";
import * as openaiService from "../services/openai.service";
import { storage } from "../storage";

export async function handleMessage(req: Request, res: Response) {
  try {
    const { message, projectId } = req.body;
    
    if (!message || !projectId) {
      return res.status(400).json({ error: "Message and project ID are required" });
    }
    
    // Get the current conversation or create a new one
    let conversation = await storage.getConversationByProjectId(projectId);
    
    // Add the user message to the conversation
    const userMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    };
    
    if (conversation) {
      conversation.messages.push(userMessage);
    } else {
      conversation = {
        id: 0, // Will be set by storage
        projectId,
        messages: [userMessage]
      };
    }
    
    // Get AI response
    const aiResponse = await openaiService.analyzeMessage(message, projectId);
    
    // Add AI response to conversation
    const assistantMessage = {
      role: "assistant",
      content: aiResponse.message,
      timestamp: aiResponse.timestamp
    };
    
    conversation.messages.push(assistantMessage);
    
    // Save the updated conversation
    if (conversation.id === 0) {
      conversation = await storage.createConversation(conversation);
    } else {
      conversation = await storage.updateConversation(conversation);
    }
    
    res.json({
      success: true,
      message: assistantMessage
    });
  } catch (error) {
    console.error("Error in handleMessage:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
}

export async function analyzeRequirements(req: Request, res: Response) {
  try {
    const { projectDetails, projectId } = req.body;
    
    if (!projectDetails || !projectId) {
      return res.status(400).json({ error: "Project details and project ID are required" });
    }
    
    const analysis = await openaiService.analyzeRequirements(projectDetails);
    
    // Save the analysis to the database
    const savedAnalysis = await storage.saveAnalysis({
      projectId,
      ...analysis
    });
    
    res.json({
      success: true,
      analysis: savedAnalysis
    });
  } catch (error) {
    console.error("Error in analyzeRequirements:", error);
    res.status(500).json({ error: "Failed to analyze requirements" });
  }
}

export async function generateCode(req: Request, res: Response) {
  try {
    const { requirements, language, projectId } = req.body;
    
    if (!requirements || !language || !projectId) {
      return res.status(400).json({ error: "Requirements, language, and project ID are required" });
    }
    
    const generatedCode = await openaiService.generateCode(requirements, language);
    
    res.json({
      success: true,
      code: generatedCode
    });
  } catch (error) {
    console.error("Error in generateCode:", error);
    res.status(500).json({ error: "Failed to generate code" });
  }
}

export async function debugCode(req: Request, res: Response) {
  try {
    const { code, error, projectId } = req.body;
    
    if (!code || !error || !projectId) {
      return res.status(400).json({ error: "Code, error message, and project ID are required" });
    }
    
    const debugResult = await openaiService.debugCode(code, error);
    
    res.json({
      success: true,
      result: debugResult
    });
  } catch (error) {
    console.error("Error in debugCode:", error);
    res.status(500).json({ error: "Failed to debug code" });
  }
}

export async function generateDocumentation(req: Request, res: Response) {
  try {
    const { code, docType, projectId } = req.body;
    
    if (!code || !docType || !projectId) {
      return res.status(400).json({ error: "Code, documentation type, and project ID are required" });
    }
    
    const documentation = await openaiService.generateDocumentation(code, docType);
    
    res.json({
      success: true,
      documentation
    });
  } catch (error) {
    console.error("Error in generateDocumentation:", error);
    res.status(500).json({ error: "Failed to generate documentation" });
  }
}
