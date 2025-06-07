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
import { asyncHandler } from "./middleware/errorHandler";
import { performanceLogger, startMemoryMonitoring, stopMemoryMonitoring } from "./middleware/performanceLogger";
import { realEstateAnalyticsService } from "./services/real-estate-analytics.service";
import registerDevAuthRoutes from "./routes/dev-auth.routes";
import registerUserRoutes from "./routes/users.routes";
import registerRecommendationsRoutes from "./routes/recommendations.routes";
import { registerValuationAgentRoutes } from "./routes/valuation-agent.routes";
import { registerTerraFusionRoutes } from "./routes/terrafusion-routes";
import { registerAnalysisRoutes } from "./routes/analysis-routes";
import { registerTestRoutes } from "./utils/terrafusion-test";
import { dataQualityRoutes } from "./routes/data-quality.routes";
import spatialAnalyticsRoutes from "./routes/spatial-analytics.routes";
import { registerBadgesRoutes } from "./routes/badges.routes";
import bentonCountyRoutes from "./routes/bentonCounty.routes";
import terraGamaFilterRoutes from "./routes/terraGamaFilter.routes";
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './openapi';

let memoryMonitorTimer: NodeJS.Timeout | null = null;

async function scheduledLogCleanup() {
  try {
    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - 7);
    
    const deletedCount = await storage.deleteLogs(olderThan);
    console.log(`[Scheduled cleanup] Deleted ${deletedCount} logs older than ${olderThan.toISOString()}`);
  } catch (error) {
    console.error('[Scheduled cleanup] Error:', error);
  }
}

let wss: WebSocketServer | null = null;

export function registerRoutes(app: Express): Promise<Server> {
  return new Promise((resolve) => {
    const server = createServer(app);
    
    wss = new WebSocketServer({ server, path: '/ws' });
    
    wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Agent activity client connected');
      
      ws.on('close', () => {
        console.log('[WebSocket] Agent activity client disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('[WebSocket] Agent activity error:', error);
      });
    });
    
    console.log('[WebSocket] Agent activity WebSocket server initialized at path: /ws');
    
    registerDevAuthRoutes(app);
    registerUserRoutes(app);
    registerRecommendationsRoutes(app);
    registerValuationAgentRoutes(app);
    registerTerraFusionRoutes(app);
    registerTestRoutes(app);
    registerAnalysisRoutes(app);
    registerBadgesRoutes(app);
    
    app.use('/api/data-quality', dataQualityRoutes);
    app.use('/api/spatial-analytics', spatialAnalyticsRoutes);
    app.use('/api/benton-county', bentonCountyRoutes);
    app.use('/api/terragama', terraGamaFilterRoutes);
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
    
    app.get("/api/logs", asyncHandler(async (req, res) => {
      const logs = await storage.getLogs();
      res.json(logs);
    }));
    
    app.post("/api/logs", asyncHandler(async (req, res) => {
      const newLog = await storage.createLog(req.body);
      res.status(201).json(newLog);
    }));
    
    scheduledLogCleanup();
    setInterval(scheduledLogCleanup, 24 * 60 * 60 * 1000);
    
    app.use(performanceLogger);
    
    app.get("/api/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
    
    app.get("/api/analytics", asyncHandler(analyticsController.getAnalytics));
    app.post("/api/analytics", asyncHandler(analyticsController.createAnalytics));
    
    app.get("/api/market/analytics", asyncHandler(marketController.getMarketAnalytics));
    app.get("/api/market/trends", asyncHandler(marketController.getMarketTrends));
    app.get("/api/market/heatmap", asyncHandler(marketController.getMarketHeatmap));
    app.get("/api/market/natural-hazards", asyncHandler(marketController.getNaturalHazards));
    app.post("/api/market/trends", asyncHandler(marketController.createMarketTrend));
    
    app.get("/api/openai/models", asyncHandler(openaiController.getModels));
    app.post("/api/openai/chat", asyncHandler(openaiController.chat));
    app.post("/api/openai/embeddings", asyncHandler(openaiController.embeddings));
    
    app.get("/api/agents", asyncHandler(agentController.getAgents));
    app.post("/api/agents", asyncHandler(agentController.createAgent));
    app.get("/api/agents/:id", asyncHandler(agentController.getAgent));
    app.put("/api/agents/:id", asyncHandler(agentController.updateAgent));
    app.delete("/api/agents/:id", asyncHandler(agentController.deleteAgent));
    app.post("/api/agents/:id/execute", asyncHandler(agentController.executeAgent));
    
    app.get("/api/property-valuation", asyncHandler(propertyValuationController.getValuations));
    app.post("/api/property-valuation", asyncHandler(propertyValuationController.createValuation));
    app.get("/api/property-valuation/:id", asyncHandler(propertyValuationController.getValuation));
    
    app.get("/api/mass-appraisal", asyncHandler(massAppraisalController.getMassAppraisals));
    app.post("/api/mass-appraisal", asyncHandler(massAppraisalController.createMassAppraisal));
    app.get("/api/mass-appraisal/:id", asyncHandler(massAppraisalController.getMassAppraisal));
    
    app.get("/api/mcp/tools", asyncHandler(mcpController.getTools));
    app.post("/api/mcp/tools/call", asyncHandler(mcpController.callTool));
    
    app.get("/api/connectors", asyncHandler(connectorsController.getAllConnectors));
    app.get("/api/connectors/available", asyncHandler(connectorsController.getAvailableConnectors));
    app.get("/api/connectors/weather/current", asyncHandler(connectorsController.getCurrentWeather));
    app.get("/api/connectors/census/data", asyncHandler(connectorsController.getCensusData));
    
    app.post("/api/ai/message", asyncHandler(aiController.handleMessage));
    app.post("/api/ai/context", asyncHandler(aiController.getContext));
    
    startMemoryMonitoring();
    
    resolve(server);
  });
}

export function cleanupRoutes() {
  if (memoryMonitorTimer) {
    clearInterval(memoryMonitorTimer);
    memoryMonitorTimer = null;
  }
  
  stopMemoryMonitoring();
  
  if (wss) {
    wss.close();
    wss = null;
  }
}

export function broadcastAgentActivity(data: any) {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}