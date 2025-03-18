import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as openaiController from "./controllers/openai.controller";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - prefix all routes with /api
  
  // Project routes
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project" });
    }
  });
  
  app.post("/api/projects", async (req, res) => {
    try {
      const project = await storage.createProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });
  
  // Conversation routes
  app.get("/api/projects/:id/conversation", async (req, res) => {
    try {
      const conversation = await storage.getConversationByProjectId(parseInt(req.params.id));
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });
  
  app.post("/api/projects/:id/messages", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { message } = req.body;
      
      // Forward to the message handler in the OpenAI controller
      req.body.projectId = projectId;
      return openaiController.handleMessage(req, res);
    } catch (error) {
      res.status(500).json({ error: "Failed to add message" });
    }
  });
  
  // Analysis routes
  app.get("/api/projects/:id/analysis", async (req, res) => {
    try {
      const analysis = await storage.getAnalysisByProjectId(parseInt(req.params.id));
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to get analysis" });
    }
  });
  
  // AI routes
  app.post("/api/ai/message", openaiController.handleMessage);
  app.post("/api/ai/analyze", openaiController.analyzeRequirements);
  app.post("/api/ai/generate-code", openaiController.generateCode);
  app.post("/api/ai/debug", openaiController.debugCode);
  app.post("/api/ai/documentation", openaiController.generateDocumentation);

  const httpServer = createServer(app);

  return httpServer;
}
