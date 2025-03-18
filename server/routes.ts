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
  
  // Architecture routes
  app.get("/api/projects/:id/architecture", async (req, res) => {
    try {
      // Placeholder for architecture data
      // In future, this would be stored and retrieved from the database
      const architecture = {
        layers: [
          {
            name: "User Interface Layer",
            components: [
              { name: "Property Assessment Dashboard", type: "ui" },
              { name: "Data Entry Forms", type: "ui" },
              { name: "Report Generator", type: "ui" },
              { name: "User Authentication", type: "ui" }
            ]
          },
          {
            name: "API Layer",
            components: [
              { name: "REST API Endpoints", type: "api" },
              { name: "Authentication Service", type: "api" },
              { name: "Data Validation", type: "api" }
            ]
          },
          {
            name: "Business Logic Layer",
            components: [
              { name: "Assessment Calculator", type: "business" },
              { name: "Report Generator", type: "business" },
              { name: "Workflow Manager", type: "business" }
            ]
          },
          {
            name: "Data Layer",
            components: [
              { name: "Property Database", type: "data" },
              { name: "User Management", type: "data" },
              { name: "Assessment History", type: "data" }
            ]
          },
          {
            name: "External Integrations",
            components: [
              { name: "County Systems Connector", type: "external" },
              { name: "GIS Integration", type: "external" },
              { name: "Document Management", type: "external" }
            ]
          }
        ]
      };
      
      res.json(architecture);
    } catch (error) {
      res.status(500).json({ error: "Failed to get architecture" });
    }
  });
  
  // Feedback routes
  app.get("/api/feedback", async (req, res) => {
    try {
      const feedback = await storage.getFeedback();
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ error: "Failed to get feedback items" });
    }
  });
  
  app.post("/api/feedback", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const feedbackItem = await storage.saveFeedback({
        message,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json(feedbackItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to save feedback" });
    }
  });
  
  app.patch("/api/feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { resolved } = req.body;
      
      if (resolved === undefined) {
        return res.status(400).json({ error: "Resolved status is required" });
      }
      
      const updatedFeedback = await storage.updateFeedbackStatus(id, resolved);
      res.json(updatedFeedback);
    } catch (error) {
      if (error.message && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update feedback status" });
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
