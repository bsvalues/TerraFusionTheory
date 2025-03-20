import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as openaiController from "./controllers/openai.controller";
import * as aiController from "./controllers/ai.controller";
import * as connectorsController from "./controllers/connectors.controller";
import * as marketController from "./controllers/market.controller";
import * as analyticsController from "./controllers/analytics.controller";
import { asyncHandler } from "./middleware/errorHandler";
import { performanceLogger, startMemoryMonitoring, stopMemoryMonitoring } from "./middleware/performanceLogger";
import { alertManager, AlertSeverity } from "./services/alert";
import { realEstateAnalyticsService } from "./services/real-estate-analytics.service";

// Track the memory monitor timer globally to allow proper cleanup

import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi';

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
      
      // Check if message is an object with content property
      if (message && typeof message === 'object' && message.content) {
        // Extract the message content
        req.body.message = message.content;
      }
      
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
  app.get("/api/connectors/type/:type", asyncHandler(connectorsController.getConnectorsByType));
  app.get("/api/connectors/:name", asyncHandler(connectorsController.getConnector));
  app.post("/api/connectors/:name/test", asyncHandler(connectorsController.testConnectorConnection));
  app.get("/api/connectors/:name/models", asyncHandler(connectorsController.getConnectorModels));
  app.get("/api/connectors/:name/models/:model", asyncHandler(connectorsController.getConnectorModelSchema));
  app.post("/api/connectors/:name/query/cama", asyncHandler(connectorsController.queryCAMAData));
  app.post("/api/connectors/:name/query/gis", asyncHandler(connectorsController.queryGISData));
  
  // Market Data routes
  app.get("/api/market/listings", asyncHandler(marketController.getMarketListings));
  app.get("/api/market/listings/:mlsNumber", asyncHandler(marketController.getMarketListingByMLS));
  app.get("/api/market/stats", asyncHandler(marketController.getMarketStats));

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

  // System health endpoint for monitoring
  app.get("/api/system/health", asyncHandler(async (req, res) => {
    try {
      // Get current memory usage
      const memoryUsage = process.memoryUsage();
      const usedMemoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const totalMemoryMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryPercentage = Math.round((usedMemoryMB / totalMemoryMB) * 100);
      
      // Get uptime information
      const uptime = process.uptime();
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);
      const formattedUptime = `${uptimeHours}h ${uptimeMinutes}m`;
      
      // Get log statistics
      const logStats = await storage.getLogStats();
      
      // Get number of active connectors
      const connectors = connectorsController.getAllConnectors;
      
      // Assemble health data
      const healthData = {
        status: 'online',
        uptime: {
          seconds: uptime,
          formatted: formattedUptime
        },
        memory: {
          used: usedMemoryMB,
          total: totalMemoryMB,
          percentage: memoryPercentage,
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        logs: {
          totalCount: logStats.totalCount,
          countByLevel: logStats.countByLevel,
          countByCategory: logStats.countByCategory,
          recentErrorCount: logStats.recentErrors.length
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(healthData);
    } catch (error) {
      console.error("Error generating system health data:", error);
      res.status(500).json({ 
        status: 'error',
        error: "Failed to generate system health data",
        timestamp: new Date().toISOString()
      });
    }
  }));
  
  // System memory cleanup endpoint
  app.post("/api/system/cleanup-memory", asyncHandler(async (req, res) => {
    try {
      const beforeCleanup = process.memoryUsage();
      
      // Perform cleanup operations similar to what we do in memory monitoring
      const tempArray = new Array(1000000);
      for (let i = 0; i < 1000000; i++) {
        tempArray[i] = i;
      }
      tempArray.length = 0;
      
      // Force several garbage collection-friendly operations
      for (let i = 0; i < 5; i++) {
        const largeObj = { data: new Array(100000).fill('x') };
        JSON.stringify(largeObj);
      }
      
      // Check if memory was freed
      const afterCleanup = process.memoryUsage();
      const freedMemoryMB = Math.max(0, Math.round((beforeCleanup.heapUsed - afterCleanup.heapUsed) / 1024 / 1024));
      
      // Trigger a log cleanup for entries older than 3 days
      const olderThan = new Date();
      olderThan.setDate(olderThan.getDate() - 3);
      const deletedLogs = await storage.clearLogs({ olderThan });
      
      res.json({
        success: true,
        message: `Memory cleanup attempted, freed approximately ${freedMemoryMB}MB and deleted ${deletedLogs} logs older than 3 days`,
        before: {
          heapUsed: Math.round(beforeCleanup.heapUsed / 1024 / 1024),
          heapTotal: Math.round(beforeCleanup.heapTotal / 1024 / 1024),
        },
        after: {
          heapUsed: Math.round(afterCleanup.heapUsed / 1024 / 1024),
          heapTotal: Math.round(afterCleanup.heapTotal / 1024 / 1024),
        },
        freedMemoryMB,
        deletedLogs,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error during memory cleanup:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to perform memory cleanup",
        timestamp: new Date().toISOString()
      });
    }
  }));
  
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

  // Badge routes
  app.get("/api/badges", asyncHandler(async (req, res) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  }));

  app.get("/api/badges/:id", asyncHandler(async (req, res) => {
    try {
      const badge = await storage.getBadgeById(parseInt(req.params.id));
      if (!badge) {
        return res.status(404).json({ error: "Badge not found" });
      }
      res.json(badge);
    } catch (error) {
      console.error("Error fetching badge:", error);
      res.status(500).json({ error: "Failed to fetch badge" });
    }
  }));

  app.get("/api/badges/type/:type", asyncHandler(async (req, res) => {
    try {
      const badges = await storage.getBadgesByType(req.params.type as any);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges by type:", error);
      res.status(500).json({ error: "Failed to fetch badges by type" });
    }
  }));

  app.get("/api/badges/level/:level", asyncHandler(async (req, res) => {
    try {
      const badges = await storage.getBadgesByLevel(req.params.level as any);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges by level:", error);
      res.status(500).json({ error: "Failed to fetch badges by level" });
    }
  }));

  app.post("/api/badges", asyncHandler(async (req, res) => {
    try {
      const badge = await storage.createBadge(req.body);
      res.status(201).json(badge);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ error: "Failed to create badge" });
    }
  }));

  app.patch("/api/badges/:id", asyncHandler(async (req, res) => {
    try {
      const badge = await storage.getBadgeById(parseInt(req.params.id));
      if (!badge) {
        return res.status(404).json({ error: "Badge not found" });
      }
      
      const updatedBadge = await storage.updateBadge({
        ...badge,
        ...req.body,
        id: parseInt(req.params.id)
      });
      
      res.json(updatedBadge);
    } catch (error) {
      console.error("Error updating badge:", error);
      res.status(500).json({ error: "Failed to update badge" });
    }
  }));

  app.get("/api/users/:userId/badges", asyncHandler(async (req, res) => {
    try {
      const userBadges = await storage.getUserBadgesWithDetails(parseInt(req.params.userId));
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ error: "Failed to fetch user badges" });
    }
  }));

  app.get("/api/users/:userId/badges/project/:projectId", asyncHandler(async (req, res) => {
    try {
      const userBadges = await storage.getUserBadgesByProject(
        parseInt(req.params.userId),
        parseInt(req.params.projectId)
      );
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges for project:", error);
      res.status(500).json({ error: "Failed to fetch user badges for project" });
    }
  }));

  app.post("/api/users/:userId/badges", asyncHandler(async (req, res) => {
    try {
      const userBadge = await storage.awardBadgeToUser({
        ...req.body,
        userId: parseInt(req.params.userId)
      });
      res.status(201).json(userBadge);
    } catch (error) {
      console.error("Error awarding badge to user:", error);
      res.status(500).json({ error: "Failed to award badge to user" });
    }
  }));

  app.patch("/api/users/:userId/badges/:badgeId", asyncHandler(async (req, res) => {
    try {
      const { progress, metadata } = req.body;
      const userBadges = await storage.getUserBadges(parseInt(req.params.userId));
      const userBadge = userBadges.find(ub => ub.badgeId === parseInt(req.params.badgeId));
      
      if (!userBadge) {
        return res.status(404).json({ error: "User badge not found" });
      }
      
      const updatedUserBadge = await storage.updateUserBadgeProgress(
        userBadge.id,
        progress,
        metadata
      );
      
      res.json(updatedUserBadge);
    } catch (error) {
      console.error("Error updating user badge progress:", error);
      res.status(500).json({ error: "Failed to update user badge progress" });
    }
  }));

  const httpServer = createServer(app);

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
}
