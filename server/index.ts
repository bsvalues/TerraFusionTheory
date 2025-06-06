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

declare module 'express-session' {
  interface SessionData {
    user?: { id: number };
  }
}

declare global {
  namespace Express {
    interface Request {
      sessionID: string;
    }
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

initializeOptimizedLogger({
  debugMode: process.env.NODE_ENV === 'development'
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'terrafusion-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

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

      if (path !== '/api/logs') {
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
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.warn('Database connection test failed. Proceeding with caution.');
    } else {
      console.info('Database connection verified successfully.');
    }
    
    const server = await registerRoutes(app);
    
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    app.use(notFoundHandler);
    app.use(errorHandler);

    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      
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
      
      scheduler.start();
      log('Background task scheduler started');
      
      initializeConnectors()
        .then(() => {
          log('Default connectors initialized');
          
          return initializeAgentSystem()
            .then(() => {
              log('Agent system initialized');
            })
            .catch((err: any) => console.error('Failed to initialize agent system:', err));
        })
        .catch((err: any) => console.error('Failed to initialize connectors:', err));
    });
    
    const shutdown = async () => {
      log('Shutting down server...');
      scheduler.stop();
      cleanupRoutes();
      server.close();
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown();
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown();
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();