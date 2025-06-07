import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes, cleanupRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler, asyncHandler } from "./middleware/errorHandler";
import { storage } from "./storage";
import { LogCategory, LogLevel } from "@shared/schema";
import { scheduler } from "./services/scheduler.service";
import { initializeConnectors } from "./services/connectors";
import { initializeAgentSystem } from "../agents";

import { initializeOptimizedLogger } from "./services/optimized-logging";
import { testDatabaseConnection } from "./db";

// Declare session data type
declare module 'express-session' {
  interface SessionData {
    user?: { id: number };
  }
}

// Add sessionID to Express Request
declare global {
  namespace Express {
    interface Request {
      sessionID: string;
    }
  }
}

// Initialize express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize optimized logging system
initializeOptimizedLogger({
  debugMode: process.env.NODE_ENV === 'development'
});

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'bs-intelligent-agent-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log request completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);

      // Log to storage for monitoring and analysis
      if (path !== '/api/logs') { // Prevent recursive logging
        storage.createLog({
          level: res.statusCode >= 500 ? LogLevel.ERROR : 
                (res.statusCode >= 400 ? LogLevel.WARNING : LogLevel.INFO),
          category: LogCategory.API,
          message: `${req.method} ${path} ${res.statusCode}`,
          details: capturedJsonResponse ? JSON.stringify(capturedJsonResponse) : '',
          source: 'express',
          projectId: null,
          userId: null,
          sessionId: req.sessionID || null,
          duration,
          statusCode: res.statusCode,
          endpoint: path,
          tags: ['api', req.method.toLowerCase()]
        }).catch(err => {
          console.error('Failed to log API request:', err);
        });
      }
    }
  });

  next();
});

(async () => {
  try {
    // Test database connection before proceeding
    // Already imported at the top of the file
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.warn('Database connection test failed. Proceeding with caution.');
    } else {
      console.info('Database connection verified successfully.');
    }
    
    // Register API routes
    const server = await registerRoutes(app);
    
    // Setup Vite for development or serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Register 404 handler (must be after API routes and static file handling)
    app.use(notFoundHandler);
    
    // Register global error handler
    app.use(errorHandler);

    // Start the server
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      
      // Log server start
      storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Server started on port ${port}`,
        details: '',
        source: 'server',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['server', 'startup']
      }).catch(console.error);
      
      // Start the scheduler for background tasks
      scheduler.start();
      
      log('Background task scheduler started');
      
      // Initialize default connectors
      initializeConnectors()
        .then(() => {
          log('Default connectors initialized');
          
          // Initialize agent system
          return initializeAgentSystem()
            .then(() => {
              log('Agent system initialized');
              

            })
            .catch(err => console.error('Failed to initialize agent system:', err));
        })
        .catch(err => console.error('Failed to initialize connectors:', err));
    });
    
    // Handle graceful shutdown
    const shutdown = async () => {
      log('Shutting down server...');
      scheduler.stop();
      cleanupRoutes();
      
      // Stop microservices
      try {
        await stopMicroservices();
        log('Microservices stopped successfully');
      } catch (error) {
        console.error('Error stopping microservices:', error);
      }
      
      server.close();
      process.exit(0);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    
    // Log server startup failure
    await storage.createLog({
      level: LogLevel.CRITICAL,
      category: LogCategory.SYSTEM,
      message: 'Server failed to start',
      details: error instanceof Error ? JSON.stringify({
        message: error.message,
        stack: error.stack
      }) : String(error),
      source: 'server',
      projectId: null,
      userId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['server', 'startup', 'error']
    });
    
    process.exit(1);
  }
})();
