/**
 * Valuation Agent Controller
 * 
 * This controller handles API endpoints for interacting with the valuation agent.
 */

import { Request, Response } from 'express';
import { AgentType, agentFactory } from '../../agents/core/agent-factory';
import { agentRegistry } from '../../agents/core/agent-registry';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../storage';
import { AppError, ValidationError } from '../errors';
import { ValuationAgentConfig } from '../../agents/types/valuation-agent';
import { z } from 'zod';

// Valuation agent ID - can be set on initialization
let valuationAgentId: string | null = null;

/**
 * Initialize valuation agent
 * This should be called during app startup
 */
export async function initializeValuationAgent(): Promise<string> {
  try {
    console.log('Initializing valuation agent...');
    
    // Create valuation agent with default configuration
    const agent = await agentFactory.createAgent(AgentType.VALUATION, {
      name: 'Property Valuation Expert',
      description: 'Specialized AI assistant for property valuation using multiple appraisal methodologies',
      tools: ['mcp']
    });
    
    valuationAgentId = agent.getId();
    console.log(`Valuation agent initialized with ID: ${valuationAgentId}`);
    
    await storage.createLog({
      message: `Valuation agent initialized with ID: ${valuationAgentId}`,
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      details: JSON.stringify({
        agentId: valuationAgentId,
        type: agent.getType(),
        capabilities: agent.getCapabilities()
      }),
      source: 'valuation-agent-controller',
      userId: null,
      projectId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['valuation', 'agent', 'initialization']
    });
    
    return valuationAgentId;
  } catch (error) {
    console.error('Error initializing valuation agent:', error);
    
    await storage.createLog({
      message: 'Error initializing valuation agent',
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error)
      }),
      source: 'valuation-agent-controller',
      userId: null,
      projectId: null,
      sessionId: null,
      duration: null,
      statusCode: null,
      endpoint: null,
      tags: ['valuation', 'agent', 'error', 'initialization']
    });
    
    throw error;
  }
}

/**
 * Get valuation agent details
 */
export async function getValuationAgent(req: Request, res: Response) {
  try {
    if (!valuationAgentId) {
      throw new AppError('Valuation agent not initialized', 500, 'agent_not_initialized');
    }
    
    const agent = agentRegistry.getAgent(valuationAgentId);
    if (!agent) {
      throw new AppError('Valuation agent not found in registry', 500, 'agent_not_found');
    }
    
    res.status(200).json({
      id: agent.getId(),
      name: agent.getName(),
      description: agent.getDescription(),
      type: agent.getType(),
      capabilities: agent.getCapabilities(),
      availableTools: agent.getAvailableTools()
    });
  } catch (error) {
    console.error('Error getting valuation agent:', error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message, code: error.code });
    } else {
      res.status(500).json({ error: 'Error getting valuation agent', details: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * Schema for comprehensive valuation request
 */
const comprehensiveValuationSchema = z.object({
  address: z.string().min(5, 'Address is required'),
  propertyType: z.string().min(1, 'Property type is required'),
  squareFeet: z.number().positive('Square feet must be a positive number'),
  bedrooms: z.number().int().min(0, 'Bedrooms must be a non-negative integer'),
  bathrooms: z.number().min(0, 'Bathrooms must be a non-negative number'),
  yearBuilt: z.number().int().positive('Year built must be a positive integer'),
  lotSize: z.number().optional(),
  additionalFeatures: z.string().optional(),
  approaches: z.array(z.string()).optional()
});

/**
 * Request comprehensive property valuation
 */
export async function requestComprehensiveValuation(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = comprehensiveValuationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid request body', validation.error.format());
    }
    
    if (!valuationAgentId) {
      throw new AppError('Valuation agent not initialized', 500, 'agent_not_initialized');
    }
    
    const agent = agentRegistry.getAgent(valuationAgentId);
    if (!agent) {
      throw new AppError('Valuation agent not found in registry', 500, 'agent_not_found');
    }
    
    // Start the valuation task
    const startTime = Date.now();
    const taskId = await agent.assignTask({
      type: 'comprehensive_valuation',
      priority: 'normal',
      inputs: validation.data
    });
    
    // Wait for task completion (with timeout)
    const maxWaitTime = 60000; // 60 seconds
    const pollInterval = 1000; // 1 second
    let elapsedTime = 0;
    
    while (elapsedTime < maxWaitTime) {
      // Check task status
      const tasks = await agent.listTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new AppError('Task not found', 500, 'task_not_found');
      }
      
      if (task.status === 'completed') {
        await storage.createLog({
          message: `Comprehensive valuation completed for ${validation.data.address}`,
          level: LogLevel.INFO,
          category: LogCategory.AI,
          details: JSON.stringify({
            address: validation.data.address,
            propertyType: validation.data.propertyType,
            processingTime: Date.now() - startTime
          }),
          source: 'valuation-agent-controller',
          userId: req.session.user?.id || null,
          projectId: null,
          sessionId: req.sessionID,
          duration: Date.now() - startTime,
          statusCode: 200,
          endpoint: '/api/agents/valuation/comprehensive',
          tags: ['valuation', 'comprehensive', 'success']
        });
        
        // Return result
        return res.status(200).json({
          taskId,
          status: 'completed',
          result: task.result,
          processingTime: Date.now() - startTime
        });
      }
      
      if (task.status === 'failed') {
        throw new AppError('Valuation task failed', 500, 'task_failed', task.error);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }
    
    // If we reach here, the task timed out
    throw new AppError('Valuation task timed out', 500, 'task_timeout');
  } catch (error) {
    console.error('Error requesting comprehensive valuation:', error);
    
    await storage.createLog({
      message: 'Error requesting comprehensive valuation',
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        requestBody: req.body
      }),
      source: 'valuation-agent-controller',
      userId: req.session.user?.id || null,
      projectId: null,
      sessionId: req.sessionID,
      duration: null,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      endpoint: '/api/agents/valuation/comprehensive',
      tags: ['valuation', 'comprehensive', 'error']
    });
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message, code: error.code, details: error.details });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.format() });
    } else {
      res.status(500).json({ error: 'Error requesting comprehensive valuation', details: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * Schema for valuation methodology recommendation request
 */
const methodologyRecommendationSchema = z.object({
  propertyType: z.string().min(1, 'Property type is required'),
  location: z.string().min(1, 'Location is required'),
  purpose: z.string().optional(),
  propertyDetails: z.string().optional()
});

/**
 * Request valuation methodology recommendation
 */
export async function requestMethodologyRecommendation(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = methodologyRecommendationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid request body', validation.error.format());
    }
    
    if (!valuationAgentId) {
      throw new AppError('Valuation agent not initialized', 500, 'agent_not_initialized');
    }
    
    const agent = agentRegistry.getAgent(valuationAgentId);
    if (!agent) {
      throw new AppError('Valuation agent not found in registry', 500, 'agent_not_found');
    }
    
    // Start the recommendation task
    const startTime = Date.now();
    const taskId = await agent.assignTask({
      type: 'valuation_recommendation',
      priority: 'normal',
      inputs: validation.data
    });
    
    // Wait for task completion (with timeout)
    const maxWaitTime = 30000; // 30 seconds
    const pollInterval = 1000; // 1 second
    let elapsedTime = 0;
    
    while (elapsedTime < maxWaitTime) {
      // Check task status
      const tasks = await agent.listTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new AppError('Task not found', 500, 'task_not_found');
      }
      
      if (task.status === 'completed') {
        await storage.createLog({
          message: `Valuation methodology recommendation completed for ${validation.data.propertyType} in ${validation.data.location}`,
          level: LogLevel.INFO,
          category: LogCategory.AI,
          details: JSON.stringify({
            propertyType: validation.data.propertyType,
            location: validation.data.location,
            purpose: validation.data.purpose,
            processingTime: Date.now() - startTime
          }),
          source: 'valuation-agent-controller',
          userId: req.session.user?.id || null,
          projectId: null,
          sessionId: req.sessionID,
          duration: Date.now() - startTime,
          statusCode: 200,
          endpoint: '/api/agents/valuation/methodology',
          tags: ['valuation', 'methodology', 'recommendation', 'success']
        });
        
        // Return result
        return res.status(200).json({
          taskId,
          status: 'completed',
          result: task.result,
          processingTime: Date.now() - startTime
        });
      }
      
      if (task.status === 'failed') {
        throw new AppError('Recommendation task failed', 500, 'task_failed', task.error);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }
    
    // If we reach here, the task timed out
    throw new AppError('Recommendation task timed out', 500, 'task_timeout');
  } catch (error) {
    console.error('Error requesting methodology recommendation:', error);
    
    await storage.createLog({
      message: 'Error requesting methodology recommendation',
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        requestBody: req.body
      }),
      source: 'valuation-agent-controller',
      userId: req.session.user?.id || null,
      projectId: null,
      sessionId: req.sessionID,
      duration: null,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      endpoint: '/api/agents/valuation/methodology',
      tags: ['valuation', 'methodology', 'recommendation', 'error']
    });
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message, code: error.code, details: error.details });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.format() });
    } else {
      res.status(500).json({ error: 'Error requesting methodology recommendation', details: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * Schema for valuation explanation request
 */
const valuationExplanationSchema = z.object({
  methodology: z.string().min(1, 'Methodology is required'),
  audienceLevel: z.enum(['general', 'beginner', 'intermediate', 'advanced', 'professional']).optional(),
  specificAspect: z.string().optional()
});

/**
 * Request valuation methodology explanation
 */
export async function requestValuationExplanation(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = valuationExplanationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid request body', validation.error.format());
    }
    
    if (!valuationAgentId) {
      throw new AppError('Valuation agent not initialized', 500, 'agent_not_initialized');
    }
    
    const agent = agentRegistry.getAgent(valuationAgentId);
    if (!agent) {
      throw new AppError('Valuation agent not found in registry', 500, 'agent_not_found');
    }
    
    // Start the explanation task
    const startTime = Date.now();
    const taskId = await agent.assignTask({
      type: 'valuation_explanation',
      priority: 'normal',
      inputs: validation.data
    });
    
    // Wait for task completion (with timeout)
    const maxWaitTime = 30000; // 30 seconds
    const pollInterval = 1000; // 1 second
    let elapsedTime = 0;
    
    while (elapsedTime < maxWaitTime) {
      // Check task status
      const tasks = await agent.listTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new AppError('Task not found', 500, 'task_not_found');
      }
      
      if (task.status === 'completed') {
        await storage.createLog({
          message: `Valuation explanation completed for ${validation.data.methodology}`,
          level: LogLevel.INFO,
          category: LogCategory.AI,
          details: JSON.stringify({
            methodology: validation.data.methodology,
            audienceLevel: validation.data.audienceLevel,
            specificAspect: validation.data.specificAspect,
            processingTime: Date.now() - startTime
          }),
          source: 'valuation-agent-controller',
          userId: req.session.user?.id || null,
          projectId: null,
          sessionId: req.sessionID,
          duration: Date.now() - startTime,
          statusCode: 200,
          endpoint: '/api/agents/valuation/explanation',
          tags: ['valuation', 'explanation', 'success']
        });
        
        // Return result
        return res.status(200).json({
          taskId,
          status: 'completed',
          result: task.result,
          processingTime: Date.now() - startTime
        });
      }
      
      if (task.status === 'failed') {
        throw new AppError('Explanation task failed', 500, 'task_failed', task.error);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }
    
    // If we reach here, the task timed out
    throw new AppError('Explanation task timed out', 500, 'task_timeout');
  } catch (error) {
    console.error('Error requesting valuation explanation:', error);
    
    await storage.createLog({
      message: 'Error requesting valuation explanation',
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        requestBody: req.body
      }),
      source: 'valuation-agent-controller',
      userId: req.session.user?.id || null,
      projectId: null,
      sessionId: req.sessionID,
      duration: null,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      endpoint: '/api/agents/valuation/explanation',
      tags: ['valuation', 'explanation', 'error']
    });
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message, code: error.code, details: error.details });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.format() });
    } else {
      res.status(500).json({ error: 'Error requesting valuation explanation', details: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * Schema for value reconciliation request
 */
const valueReconciliationSchema = z.object({
  address: z.string().min(5, 'Address is required'),
  valueIndications: z.array(z.object({
    approach: z.string().min(1, 'Approach is required'),
    value: z.number().positive('Value must be a positive number'),
    confidence: z.number().min(1).max(5).optional(),
    strengths: z.string().optional(),
    weaknesses: z.string().optional(),
    dataQuality: z.string().optional()
  })).min(2, 'At least two value indications are required'),
  propertyType: z.string().optional(),
  valuePurpose: z.string().optional()
});

/**
 * Request value reconciliation
 */
export async function requestValueReconciliation(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = valueReconciliationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid request body', validation.error.format());
    }
    
    if (!valuationAgentId) {
      throw new AppError('Valuation agent not initialized', 500, 'agent_not_initialized');
    }
    
    const agent = agentRegistry.getAgent(valuationAgentId);
    if (!agent) {
      throw new AppError('Valuation agent not found in registry', 500, 'agent_not_found');
    }
    
    // Start the reconciliation task
    const startTime = Date.now();
    const taskId = await agent.assignTask({
      type: 'value_reconciliation',
      priority: 'normal',
      inputs: validation.data
    });
    
    // Wait for task completion (with timeout)
    const maxWaitTime = 30000; // 30 seconds
    const pollInterval = 1000; // 1 second
    let elapsedTime = 0;
    
    while (elapsedTime < maxWaitTime) {
      // Check task status
      const tasks = await agent.listTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new AppError('Task not found', 500, 'task_not_found');
      }
      
      if (task.status === 'completed') {
        await storage.createLog({
          message: `Value reconciliation completed for ${validation.data.address}`,
          level: LogLevel.INFO,
          category: LogCategory.AI,
          details: JSON.stringify({
            address: validation.data.address,
            propertyType: validation.data.propertyType,
            approachesUsed: validation.data.valueIndications.map(vi => vi.approach),
            processingTime: Date.now() - startTime
          }),
          source: 'valuation-agent-controller',
          userId: req.session.user?.id || null,
          projectId: null,
          sessionId: req.sessionID,
          duration: Date.now() - startTime,
          statusCode: 200,
          endpoint: '/api/agents/valuation/reconciliation',
          tags: ['valuation', 'reconciliation', 'success']
        });
        
        // Return result
        return res.status(200).json({
          taskId,
          status: 'completed',
          result: task.result,
          processingTime: Date.now() - startTime
        });
      }
      
      if (task.status === 'failed') {
        throw new AppError('Reconciliation task failed', 500, 'task_failed', task.error);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }
    
    // If we reach here, the task timed out
    throw new AppError('Reconciliation task timed out', 500, 'task_timeout');
  } catch (error) {
    console.error('Error requesting value reconciliation:', error);
    
    await storage.createLog({
      message: 'Error requesting value reconciliation',
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        requestBody: req.body
      }),
      source: 'valuation-agent-controller',
      userId: req.session.user?.id || null,
      projectId: null,
      sessionId: req.sessionID,
      duration: null,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      endpoint: '/api/agents/valuation/reconciliation',
      tags: ['valuation', 'reconciliation', 'error']
    });
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message, code: error.code, details: error.details });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.format() });
    } else {
      res.status(500).json({ error: 'Error requesting value reconciliation', details: error instanceof Error ? error.message : String(error) });
    }
  }
}

/**
 * Schema for valuation question request
 */
const valuationQuestionSchema = z.object({
  question: z.string().min(5, 'Question is required'),
  propertyType: z.string().optional(),
  location: z.string().optional(),
  context: z.string().optional()
});

/**
 * Ask the valuation agent a question
 */
export async function askValuationQuestion(req: Request, res: Response) {
  try {
    // Validate request body
    const validation = valuationQuestionSchema.safeParse(req.body);
    if (!validation.success) {
      throw new ValidationError('Invalid request body', validation.error.format());
    }
    
    if (!valuationAgentId) {
      throw new AppError('Valuation agent not initialized', 500, 'agent_not_initialized');
    }
    
    const agent = agentRegistry.getAgent(valuationAgentId);
    if (!agent) {
      throw new AppError('Valuation agent not found in registry', 500, 'agent_not_found');
    }
    
    // Start the question task
    const startTime = Date.now();
    const taskId = await agent.assignTask({
      type: 'answer_valuation_question',
      priority: 'normal',
      inputs: validation.data
    });
    
    // Wait for task completion (with timeout)
    const maxWaitTime = 30000; // 30 seconds
    const pollInterval = 1000; // 1 second
    let elapsedTime = 0;
    
    while (elapsedTime < maxWaitTime) {
      // Check task status
      const tasks = await agent.listTasks();
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new AppError('Task not found', 500, 'task_not_found');
      }
      
      if (task.status === 'completed') {
        await storage.createLog({
          message: `Valuation question answered: ${validation.data.question.substring(0, 50)}...`,
          level: LogLevel.INFO,
          category: LogCategory.AI,
          details: JSON.stringify({
            questionLength: validation.data.question.length,
            propertyType: validation.data.propertyType,
            location: validation.data.location,
            processingTime: Date.now() - startTime
          }),
          source: 'valuation-agent-controller',
          userId: req.session.user?.id || null,
          projectId: null,
          sessionId: req.sessionID,
          duration: Date.now() - startTime,
          statusCode: 200,
          endpoint: '/api/agents/valuation/question',
          tags: ['valuation', 'question', 'success']
        });
        
        // Return result
        return res.status(200).json({
          taskId,
          status: 'completed',
          result: task.result,
          processingTime: Date.now() - startTime
        });
      }
      
      if (task.status === 'failed') {
        throw new AppError('Question task failed', 500, 'task_failed', task.error);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }
    
    // If we reach here, the task timed out
    throw new AppError('Question task timed out', 500, 'task_timeout');
  } catch (error) {
    console.error('Error asking valuation question:', error);
    
    await storage.createLog({
      message: 'Error asking valuation question',
      level: LogLevel.ERROR,
      category: LogCategory.AI,
      details: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        requestBody: req.body
      }),
      source: 'valuation-agent-controller',
      userId: req.session.user?.id || null,
      projectId: null,
      sessionId: req.sessionID,
      duration: null,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      endpoint: '/api/agents/valuation/question',
      tags: ['valuation', 'question', 'error']
    });
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message, code: error.code, details: error.details });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.format() });
    } else {
      res.status(500).json({ error: 'Error asking valuation question', details: error instanceof Error ? error.message : String(error) });
    }
  }
}