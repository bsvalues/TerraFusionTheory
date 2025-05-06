import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import * as openaiController from "./controllers/openai.controller";
import * as aiController from "./controllers/ai.controller";
import * as connectorsController from "./controllers/connectors.controller";
import { marketController } from "./controllers/market.controller";
import * as analyticsController from "./controllers/analytics.controller";
import * as agentController from "./controllers/agent.controller";
import * as propertyValuationController from "./controllers/property-valuation.controller";
import * as massAppraisalController from "./controllers/mass-appraisal.controller";
import * as mcpController from "./controllers/mcp.controller";
import * as enhancedMcpController from "./controllers/enhanced-mcp.controller";
import * as memoryManagerController from "./controllers/memory-manager.controller";
import { asyncHandler } from "./middleware/errorHandler";
import { performanceLogger, startMemoryMonitoring, stopMemoryMonitoring } from "./middleware/performanceLogger";
import { alertManager, AlertSeverity } from "./services/alert";
import { realEstateAnalyticsService } from "./services/real-estate-analytics.service";
import registerDevAuthRoutes from "./routes/dev-auth.routes";
import registerUserRoutes from "./routes/users.routes";
import registerRecommendationsRoutes from "./routes/recommendations.routes";
import { registerValuationAgentRoutes } from "./routes/valuation-agent.routes";
import { registerMicroservicesRoutes } from "./routes/microservices-routes";
import { registerTerraFusionRoutes } from "./routes/terrafusion-routes";
import { registerDiagnosticsRoutes } from "./routes/diagnostics.routes";
import { registerAnalysisRoutes } from "./routes/analysis-routes";
import microservicesClient from "./services/microservices-client";
import { registerTestRoutes } from "./utils/terrafusion-test";

// Swagger documentation imports
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi';

// Track the memory monitor timer globally to allow proper cleanup

let memoryMonitorTimer: NodeJS.Timeout | null = null;

// Schedule log cleanup to run every day
async function scheduledLogCleanup() {
  try {
    // Get date 7 days ago
    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - 7);
    
    // Delete logs older than 7 days
    const count = await storage.clearLogs({ olderThan });
    
    console.log(`[Scheduled cleanup] Deleted ${count} logs older than ${olderThan.toISOString()}`);
  } catch (error) {
    console.error('Failed to perform scheduled log cleanup:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply performance logging middleware to all routes
  app.use(performanceLogger);
  
  // API Documentation setup
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  
  // Start memory monitoring - check every 5 minutes to reduce overhead
  memoryMonitorTimer = startMemoryMonitoring(300000);
  
  // Schedule log cleanup to run once a day (24 hours = 86400000 ms)
  setInterval(scheduledLogCleanup, 86400000);
  
  // Run initial log cleanup
  await scheduledLogCleanup();
  
  // Register development auth routes
  registerDevAuthRoutes(app, storage);
  
  // Register user routes
  registerUserRoutes(app, storage);
  
  // Register recommendation routes
  registerRecommendationsRoutes(app, storage);
  
  // Register valuation agent routes
  registerValuationAgentRoutes(app);
  
  // Register microservices integration routes
  registerMicroservicesRoutes(app);
  
  // Register TerraFusion routes
  registerTerraFusionRoutes(app);
  
  // Register TerraFusion test routes
  registerTestRoutes(app);
  
  // Register diagnostics routes
  registerDiagnosticsRoutes(app);
  
  // Register analysis routes
  registerAnalysisRoutes(app);
  
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
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update feedback status" });
    }
  });
  
  // Logging routes
  app.get("/api/logs", async (req, res) => {
    try {
      const { 
        level, category, startDate, endDate, limit, offset, 
        projectId, userId, search, sortBy, sortOrder 
      } = req.query;
      
      // Convert query parameters to appropriate types
      const options: any = {};
      
      if (level) options.level = level;
      if (category) options.category = category;
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      if (projectId) options.projectId = parseInt(projectId as string);
      if (userId) options.userId = parseInt(userId as string);
      if (search) options.search = search;
      if (sortBy) options.sortBy = sortBy;
      if (sortOrder) options.sortOrder = sortOrder;
      
      const logs = await storage.getLogs(options);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });
  
  app.post("/api/logs", async (req, res) => {
    try {
      const log = await storage.createLog(req.body);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating log:", error);
      res.status(500).json({ error: "Failed to create log" });
    }
  });
  
  app.get("/api/logs/stats", async (req, res) => {
    try {
      const stats = await storage.getLogStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching log stats:", error);
      res.status(500).json({ error: "Failed to fetch log statistics" });
    }
  });
  
  app.get("/api/logs/:id", async (req, res) => {
    try {
      const log = await storage.getLogById(parseInt(req.params.id));
      if (!log) {
        return res.status(404).json({ error: "Log not found" });
      }
      res.json(log);
    } catch (error) {
      console.error("Error fetching log:", error);
      res.status(500).json({ error: "Failed to fetch log" });
    }
  });
  
  app.delete("/api/logs/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLogById(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ error: "Log not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting log:", error);
      res.status(500).json({ error: "Failed to delete log" });
    }
  });
  
  app.delete("/api/logs", async (req, res) => {
    try {
      const { olderThan, level, category } = req.query;
      
      const options: any = {};
      if (olderThan) options.olderThan = new Date(olderThan as string);
      if (level) options.level = level;
      if (category) options.category = category;
      
      const count = await storage.clearLogs(options);
      res.json({ deleted: count });
    } catch (error) {
      console.error("Error clearing logs:", error);
      res.status(500).json({ error: "Failed to clear logs" });
    }
  });
  
  // Legacy OpenAI routes (kept for backward compatibility)
  app.post("/api/ai/message", asyncHandler(async (req, res) => openaiController.handleMessage(req, res)));
  app.post("/api/ai/analyze", asyncHandler(async (req, res) => openaiController.analyzeRequirements(req, res)));
  app.post("/api/ai/generate-code", asyncHandler(async (req, res) => openaiController.generateCode(req, res)));
  app.post("/api/ai/debug", asyncHandler(async (req, res) => openaiController.debugCode(req, res)));
  app.post("/api/ai/documentation", asyncHandler(async (req, res) => openaiController.generateDocumentation(req, res)));
  
  // Enhanced multi-provider AI routes
  app.post("/api/v2/ai/message", aiController.handleMessage);
  app.post("/api/v2/ai/analyze", aiController.analyzeRequirements);
  app.post("/api/v2/ai/architecture", aiController.generateArchitecture);
  app.post("/api/v2/ai/code", aiController.generateCode);
  app.post("/api/v2/ai/debug", aiController.debugCode);
  app.post("/api/v2/ai/documentation", aiController.generateDocumentation);
  app.get("/api/v2/ai/providers", aiController.getProviders);
  
  // MCP (Model Control Protocol) routes
  app.post("/api/mcp/execute", asyncHandler(mcpController.executeMCP));
  
  // Enhanced MCP routes with improved context handling and hybrid generation
  app.post("/api/mcp/enhanced", asyncHandler(enhancedMcpController.executeEnhancedMCP));
  app.post("/api/mcp/context", asyncHandler(enhancedMcpController.getContextForPrompt));
  app.get("/api/mcp/stats", asyncHandler(enhancedMcpController.getMCPStats));
  
  // Memory Manager routes
  app.get("/api/memory/stats", asyncHandler(memoryManagerController.getMemoryStatsHandler));
  app.post("/api/memory/optimize", asyncHandler(memoryManagerController.optimizeMemoryHandler)); 
  app.get("/api/system/health", asyncHandler(memoryManagerController.getSystemHealthHandler));
  app.get("/api/system/memory-stats", asyncHandler(memoryManagerController.getSystemMemoryStatsHandler)); // Added new endpoint
  
  // Update the project messages route to use the new AI controller
  app.post("/api/v2/projects/:id/messages", async (req, res, next) => {
    const projectId = parseInt(req.params.id);
    const { message, provider } = req.body;
    
    // Forward to the message handler in the new AI controller
    req.body.projectId = projectId;
    return aiController.handleMessage(req, res, next);
  });
  
  // External data connectors API routes
  app.get("/api/connectors", asyncHandler(connectorsController.getAllConnectors));
  app.get("/api/connectors/available", asyncHandler(connectorsController.getAvailableConnectors));
  
  // Weather connector API routes
  app.get("/api/connectors/weather/current", asyncHandler(connectorsController.getCurrentWeather));
  app.get("/api/connectors/weather/climate", asyncHandler(connectorsController.getClimateData));
  app.get("/api/connectors/weather/flood-risk", asyncHandler(connectorsController.getFloodRiskData));
  
  // Census connector API routes
  app.get("/api/connectors/census/demographics", asyncHandler(connectorsController.getDemographicData));
  
  // Market Data routes
  app.get("/api/market/snapshot", asyncHandler(marketController.getMarketSnapshot));
  app.get("/api/market/predict", asyncHandler(marketController.predictMarketMetrics));
  app.get("/api/market/alerts", asyncHandler(marketController.getMarketAlerts));
  app.get("/api/market/neighborhood-trends", asyncHandler(marketController.analyzeNeighborhoodTrends));
  app.get("/api/market/spatial", asyncHandler(marketController.getPropertySpatialRelationships));
  app.get("/api/market/analysis", asyncHandler(marketController.getDetailedMarketAnalysis));
  app.get("/api/market/comparison", asyncHandler(marketController.getMarketComparison));
  app.get("/api/market/investment/:propertyId", asyncHandler(marketController.getInvestmentScore));

  // Enhanced Analytics API routes
  app.get("/api/analytics/market/:area?", asyncHandler(analyticsController.getMarketSnapshot));
  app.get("/api/analytics/properties", asyncHandler(analyticsController.getPropertyListings));
  app.get("/api/analytics/geojson", asyncHandler(analyticsController.getGeoJsonData));
  app.get("/api/analytics/neighborhoods/:area?", asyncHandler(analyticsController.getNeighborhoodTrends));
  app.get("/api/analytics/alerts", asyncHandler(analyticsController.getMarketAlerts));
  app.get("/api/analytics/predict/:area?", asyncHandler(analyticsController.getMarketPrediction));
  app.get("/api/analytics/spatial/:area?", asyncHandler(analyticsController.getPropertySpatialRelationships));
  app.get("/api/analytics/documents/:fileName", asyncHandler(analyticsController.getPropertyDocument));
  app.post("/api/analytics/refresh", asyncHandler(analyticsController.refreshAllData));
  
  // Mass Appraisal API routes - Advanced CAMA functionality
  app.get("/api/mass-appraisal/models", asyncHandler(massAppraisalController.getAllModels));
  app.get("/api/mass-appraisal/models/:id", asyncHandler(massAppraisalController.getModelById));
  app.post("/api/mass-appraisal/models", asyncHandler(massAppraisalController.createModel));
  app.delete("/api/mass-appraisal/models/:id", asyncHandler(massAppraisalController.deleteModel));
  app.post("/api/mass-appraisal/models/:id/calibrate", asyncHandler(massAppraisalController.calibrateModel));
  app.post("/api/mass-appraisal/models/:id/value", asyncHandler(massAppraisalController.valueProperty));
  app.post("/api/mass-appraisal/depreciation", asyncHandler(massAppraisalController.calculateDepreciation));
  app.post("/api/mass-appraisal/reconcile", asyncHandler(massAppraisalController.reconcileValues));
  app.post("/api/mass-appraisal/quality-control", asyncHandler(massAppraisalController.performQualityControl));
  app.post("/api/mass-appraisal/ratio-study", asyncHandler(massAppraisalController.performRatioStudy));
  app.get("/api/mass-appraisal/samples", asyncHandler(massAppraisalController.getSampleModels));
  
  // AI Agent API routes
  app.get("/api/agents", asyncHandler(agentController.listAllAgents));
  app.get("/api/agents/real-estate", asyncHandler(agentController.getRealEstateAgent));
  app.get("/api/agents/developer", asyncHandler(agentController.getDeveloperAgent));
  app.post("/api/agents/real-estate/ask", asyncHandler(agentController.askRealEstateAgent));
  app.post("/api/agents/developer/ask", asyncHandler(agentController.askDeveloperAgent));
  app.post("/api/agents/collaborate", asyncHandler(agentController.collaborateAgents));
  app.post("/api/agents/memory/search", asyncHandler(agentController.searchAgentMemory));
  
  // Property Valuation API routes
  app.post("/api/valuation/property", asyncHandler(propertyValuationController.getPropertyValuation));
  app.post("/api/valuation/comparables", asyncHandler(propertyValuationController.getComparableProperties));
  
  // MCP Tool API endpoint (needed for agent functionality)
  app.post("/api/tools/mcp", asyncHandler(async (req, res) => {
    try {
      const { action, question, query, context, limit } = req.body;
      
      // For now, return mock responses for testing
      // In a real implementation, this would connect to the MCP tool service
      let response = {};
      
      if (action === 'process_real_estate_query') {
        response = {
          result: "Based on current market trends, property values are most affected by location, square footage, age of the property, recent renovations, local school ratings, proximity to amenities, and economic factors in the region.",
          source: "agent"
        };
      } else if (action === 'process_technical_query') {
        response = {
          result: "To integrate the MCP tool with your frontend, you'll need to create an API client that communicates with the MCP endpoints. Start by setting up an agent.service.ts file that exports functions to call each endpoint, then use these in your React components through custom hooks.",
          source: "agent"
        };
      } else if (action === 'handle_collaboration') {
        response = {
          result: "For analyzing property values in Grandview, I recommend a combined approach. From a technical perspective, you should implement a data pipeline that ingests sales data from the local MLS via their API, then use PostgreSQL for storage with PostGIS extensions for geospatial analysis. For the analysis layer, implement a machine learning model that considers both property attributes and location data to generate accurate valuations.",
          source: "collaboration"
        };
      } else if (action === 'search_vector_memory') {
        response = {
          results: [
            { id: "mem1", text: "Property valuation depends on factors like location, square footage, and market trends.", score: 0.98 },
            { id: "mem2", text: "Real estate in Grandview has seen a 5% increase in median sales price over the last year.", score: 0.85 },
            { id: "mem3", text: "Technical integration with multiple data sources requires proper ETL pipeline design.", score: 0.72 }
          ]
        };
      } else {
        return res.status(400).json({ error: `Unknown action: ${action}` });
      }
      
      return res.json(response);
    } catch (error) {
      console.error("Error processing MCP tool request:", error);
      return res.status(500).json({ error: "Failed to process MCP tool request" });
    }
  }));

  // Initialize the real estate analytics service during startup
  try {
    realEstateAnalyticsService.initialize().catch(error => {
      console.error("Failed to initialize real estate analytics service:", error);
    });
  } catch (error) {
    console.error("Error during real estate analytics service initialization:", error);
  }

  // Alert system routes
  app.get("/api/alerts", asyncHandler(async (req, res) => {
    try {
      const alerts = alertManager.getAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  }));

  app.get("/api/alerts/unacknowledged", asyncHandler(async (req, res) => {
    try {
      const alerts = alertManager.getUnacknowledgedAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching unacknowledged alerts:", error);
      res.status(500).json({ error: "Failed to fetch unacknowledged alerts" });
    }
  }));

  app.get("/api/alerts/severity/:severity", asyncHandler(async (req, res) => {
    try {
      const severity = req.params.severity as AlertSeverity;
      if (!['info', 'warning', 'critical'].includes(severity)) {
        return res.status(400).json({ error: "Invalid severity level" });
      }
      const alerts = alertManager.getAlertsBySeverity(severity);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts by severity:", error);
      res.status(500).json({ error: "Failed to fetch alerts by severity" });
    }
  }));

  app.post("/api/alerts", asyncHandler(async (req, res) => {
    try {
      const { title, message, severity, details } = req.body;
      
      if (!title || !message || !severity) {
        return res.status(400).json({ error: "Title, message and severity are required" });
      }
      
      if (!['info', 'warning', 'critical'].includes(severity)) {
        return res.status(400).json({ error: "Invalid severity level" });
      }
      
      const alertId = await alertManager.sendAlert(title, message, severity as AlertSeverity, details);
      
      res.status(201).json({ alertId });
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  }));

  app.patch("/api/alerts/:id/acknowledge", asyncHandler(async (req, res) => {
    try {
      const alertId = req.params.id;
      const acknowledged = alertManager.acknowledgeAlert(alertId);
      
      if (!acknowledged) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      res.json({ acknowledged: true });
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  }));

  app.delete("/api/alerts/acknowledged", asyncHandler(async (req, res) => {
    try {
      alertManager.clearAcknowledgedAlerts();
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing acknowledged alerts:", error);
      res.status(500).json({ error: "Failed to clear acknowledged alerts" });
    }
  }));

  app.get("/api/alerts/channels", asyncHandler(async (req, res) => {
    try {
      const channels = alertManager.getChannels().map(channel => ({
        name: channel.name(),
        enabled: channel.isEnabled()
      }));
      
      res.json(channels);
    } catch (error) {
      console.error("Error fetching alert channels:", error);
      res.status(500).json({ error: "Failed to fetch alert channels" });
    }
  }));

  app.patch("/api/alerts/channels/:name", asyncHandler(async (req, res) => {
    try {
      const { enabled } = req.body;
      const channelName = req.params.name;
      
      if (enabled === undefined) {
        return res.status(400).json({ error: "Enabled status is required" });
      }
      
      if (enabled) {
        alertManager.enableChannel(channelName);
      } else {
        alertManager.disableChannel(channelName);
      }
      
      res.json({ 
        name: channelName, 
        enabled: alertManager.getChannel(channelName)?.isEnabled() || false 
      });
    } catch (error) {
      console.error("Error updating alert channel:", error);
      res.status(500).json({ error: "Failed to update alert channel" });
    }
  }));

  // System health endpoint for monitoring (main endpoint)
  app.get("/api/system/health", asyncHandler(memoryManagerController.getSystemHealthHandler));
  
  // Backup system health endpoint (simplified fallback)
  app.get("/api/system/health-backup", asyncHandler(memoryManagerController.getSystemHealthBackupHandler));
  
  // System memory cleanup endpoint
  app.post("/api/system/cleanup-memory", asyncHandler(memoryManagerController.optimizeMemoryHandler));
  
  // Enhanced system memory cleanup endpoint
  app.post("/api/system/enhanced-cleanup-memory", asyncHandler(memoryManagerController.enhancedOptimizeMemoryHandler));
  
  // System memory stats endpoint
  app.get("/api/system/memory-stats", asyncHandler(memoryManagerController.getSystemMemoryStatsHandler));
  
  // System monitoring test endpoint
  app.post("/api/system/test-alert", asyncHandler(async (req, res) => {
    try {
      const { severity = 'info' } = req.body;
      
      if (!['info', 'warning', 'critical'].includes(severity)) {
        return res.status(400).json({ error: "Invalid severity level" });
      }
      
      const alertId = await alertManager.sendAlert(
        "Test Alert",
        `This is a test ${severity} alert triggered manually.`,
        severity as AlertSeverity,
        { source: "manual-test", timestamp: new Date().toISOString() }
      );
      
      res.status(201).json({ 
        message: "Test alert sent successfully", 
        alertId 
      });
    } catch (error) {
      console.error("Error sending test alert:", error);
      res.status(500).json({ error: "Failed to send test alert" });
    }
  }));

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for agent activity streaming
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    
    // Add client to the set
    clients.add(ws);
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to IntelligentEstate agent activity stream',
      timestamp: new Date().toISOString()
    }));
    
    // Handle messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('[WebSocket] Received message:', data);
        
        // Handle client messages if needed
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      clients.delete(ws);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      clients.delete(ws);
    });
  });
  
  // Export function to broadcast agent events to all connected clients
  (global as any).broadcastAgentEvent = (event: any) => {
    const eventData = JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString()
    });
    
    console.log(`[WebSocket] Broadcasting event to ${clients.size} clients`);
    
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(eventData);
      }
    });
  };
  
  console.log('[WebSocket] Agent activity WebSocket server initialized at path: /ws');
  
  return httpServer;
}

/**
 * Cleanup function for routes resources
 * Call this when shutting down the server to properly cleanup resources
 */
export function cleanupRoutes() {
  // Stop memory monitoring if it's running
  if (memoryMonitorTimer) {
    stopMemoryMonitoring(memoryMonitorTimer);
    memoryMonitorTimer = null;
  }
  
  // Clean up WebSocket server resources if needed
  console.log('[WebSocket] Shutting down WebSocket server');
}
