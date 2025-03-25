/**
 * Microservices Controller
 * 
 * This controller manages the lifecycle of the FastAPI microservices
 * from within the Express application.
 */

import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../storage';

// Simple logger function since we can't import the logger module yet
function log(level: LogLevel, category: LogCategory, message: string, details?: any): void {
  console.log(`[${level.toUpperCase()}] [${category}]: ${message}`);
  if (details) {
    console.log(details);
  }
  
  // Also log to storage
  storage.createLog({
    level,
    category,
    message,
    details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : undefined,
    source: 'microservices-controller',
    timestamp: new Date(),
    projectId: null,
    userId: null,
    sessionId: null,
    duration: null,
    statusCode: null,
    endpoint: null,
    tags: ['microservices', 'system']
  }).catch(err => {
    console.error('Failed to store log:', err);
  });
}

// Track microservices processes
const microservices: Record<string, ChildProcess | null> = {
  'property': null,
  'market': null,
  'spatial': null,
  'analytics': null
};

/**
 * Start all microservices
 * @returns Promise that resolves when all microservices have started (or rejected on error)
 */
export async function startMicroservices(): Promise<void> {
  // Start microservices if not already running
  try {
    // Initialize database first
    await initMicroservicesDatabase();
    
    // Start all services
    const servicePromises = Object.keys(microservices).map(serviceName => {
      return startMicroservice(serviceName);
    });
    
    await Promise.all(servicePromises);
    log(LogLevel.INFO, LogCategory.SYSTEM, 'All microservices started successfully');
  } catch (error) {
    log(LogLevel.ERROR, LogCategory.SYSTEM, `Failed to start microservices: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Initialize the microservices database
 * @returns Promise that resolves when the database is initialized
 */
async function initMicroservicesDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const initScript = path.join(process.cwd(), 'microservices/init_and_run.py');
    const initProcess = spawn('python', [initScript, '--init-db']);
    
    let output = '';
    
    initProcess.stdout.on('data', (data) => {
      output += data.toString();
      log(LogLevel.DEBUG, LogCategory.DATABASE, `[DB Init] ${data.toString().trim()}`);
    });
    
    initProcess.stderr.on('data', (data) => {
      output += data.toString();
      log(LogLevel.WARNING, LogCategory.DATABASE, `[DB Init Error] ${data.toString().trim()}`);
    });
    
    initProcess.on('close', (code) => {
      if (code === 0) {
        log(LogLevel.INFO, LogCategory.DATABASE, 'Microservices database initialized successfully');
        resolve();
      } else {
        const errorMsg = `Database initialization failed with exit code ${code}. Output: ${output}`;
        log(LogLevel.ERROR, LogCategory.DATABASE, errorMsg);
        reject(new Error(errorMsg));
      }
    });
  });
}

/**
 * Start a specific microservice
 * @param serviceName The name of the microservice to start
 * @returns Promise that resolves when the service has started
 */
async function startMicroservice(serviceName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // If service is already running, resolve immediately
    if (microservices[serviceName] !== null && !microservices[serviceName]?.killed) {
      log(LogLevel.INFO, LogCategory.SYSTEM, `Microservice ${serviceName} is already running`);
      return resolve();
    }
    
    // Start the service
    log(LogLevel.INFO, LogCategory.SYSTEM, `Starting ${serviceName} microservice...`);
    
    // Build the command to run with init_and_run.py
    const scriptPath = path.join(process.cwd(), 'microservices/init_and_run.py');
    const args = ['--start', '--service', serviceName];
    
    // Spawn the process
    const serviceProcess = spawn('python', [scriptPath, ...args], {
      detached: true, // Run in background
      stdio: ['ignore', 'pipe', 'pipe'] // Redirect stdout and stderr
    });
    
    // Store the process
    microservices[serviceName] = serviceProcess;
    
    // Track standard output and error
    serviceProcess.stdout.on('data', (data) => {
      log(LogLevel.DEBUG, LogCategory.SYSTEM, `[${serviceName}] ${data.toString().trim()}`);
    });
    
    serviceProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString().trim();
      log(LogLevel.WARNING, LogCategory.SYSTEM, `[${serviceName} Error] ${errorMsg}`);
      // Don't reject on stderr, as some legitimate messages go to stderr
    });
    
    // Handle process exit
    serviceProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        const errorMsg = `Microservice ${serviceName} exited with code ${code}`;
        log(LogLevel.ERROR, LogCategory.SYSTEM, errorMsg);
        microservices[serviceName] = null;
        // Don't reject here, as we might be shutting down intentionally
      } else if (signal) {
        log(LogLevel.WARNING, LogCategory.SYSTEM, `Microservice ${serviceName} was terminated by signal ${signal}`);
        microservices[serviceName] = null;
      } else {
        log(LogLevel.INFO, LogCategory.SYSTEM, `Microservice ${serviceName} exited gracefully`);
        microservices[serviceName] = null;
      }
    });
    
    // Give it some time to start up, then check if it's still running
    setTimeout(() => {
      if (serviceProcess.killed) {
        const errorMsg = `Microservice ${serviceName} failed to start`;
        log(LogLevel.ERROR, LogCategory.SYSTEM, errorMsg);
        reject(new Error(errorMsg));
      } else {
        log(LogLevel.INFO, LogCategory.SYSTEM, `Microservice ${serviceName} started`);
        resolve();
      }
    }, 3000); // Wait 3 seconds before considering it successfully started
  });
}

/**
 * Stop all microservices
 * @returns Promise that resolves when all microservices have been stopped
 */
export async function stopMicroservices(): Promise<void> {
  const stopPromises = Object.entries(microservices).map(([serviceName, process]) => {
    return stopMicroservice(serviceName);
  });
  
  await Promise.all(stopPromises);
  log(LogLevel.INFO, LogCategory.SYSTEM, 'All microservices stopped');
}

/**
 * Stop a specific microservice
 * @param serviceName The name of the microservice to stop
 * @returns Promise that resolves when the service has been stopped
 */
async function stopMicroservice(serviceName: string): Promise<void> {
  return new Promise((resolve) => {
    const process = microservices[serviceName];
    
    if (!process || process.killed) {
      log(LogLevel.INFO, LogCategory.SYSTEM, `Microservice ${serviceName} is not running`);
      microservices[serviceName] = null;
      return resolve();
    }
    
    // Try to terminate gracefully
    process.kill('SIGTERM');
    
    // Give it some time to shut down
    setTimeout(() => {
      if (!process.killed) {
        // Force kill if it didn't shut down gracefully
        process.kill('SIGKILL');
        log(LogLevel.WARNING, LogCategory.SYSTEM, `Microservice ${serviceName} was force killed`);
      } else {
        log(LogLevel.INFO, LogCategory.SYSTEM, `Microservice ${serviceName} was stopped gracefully`);
      }
      
      microservices[serviceName] = null;
      resolve();
    }, 2000); // Wait 2 seconds before force killing
  });
}

/**
 * Check the status of all microservices
 * @returns Status of all microservices
 */
export function getMicroservicesStatus(): Record<string, string> {
  const status: Record<string, string> = {};
  
  Object.entries(microservices).forEach(([serviceName, process]) => {
    if (process && !process.killed) {
      status[serviceName] = 'running';
    } else {
      status[serviceName] = 'stopped';
    }
  });
  
  return status;
}

/**
 * Handle application shutdown
 * This should be called when the Express app is shutting down
 */
export async function handleAppShutdown(): Promise<void> {
  log(LogLevel.INFO, LogCategory.SYSTEM, 'Shutting down microservices...');
  await stopMicroservices();
}