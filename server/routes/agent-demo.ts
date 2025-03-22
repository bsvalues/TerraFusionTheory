/**
 * Agent Demo Routes
 * 
 * This file contains routes for demonstrating agent system functionality.
 */

import { Router } from 'express';
import { runAgentDemo } from '../../agents/demo';
import { createDemoAgents, getDeveloperAgent, getRealEstateAgent } from '../../agents';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Endpoint to run the agent demo
 */
router.get('/run-demo', asyncHandler(async (req, res) => {
  // Create a variable to capture the log output
  const logCapture: string[] = [];
  
  // Replace console.log temporarily to capture output
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    // Call the original console.log
    originalConsoleLog(...args);
    
    // Capture the output
    logCapture.push(args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' '));
  };
  
  // Run the demo
  await runAgentDemo();
  
  // Restore console.log
  console.log = originalConsoleLog;
  
  // Return the captured logs
  res.json({
    success: true,
    logs: logCapture
  });
}));

/**
 * Create sample agents
 */
router.post('/create-agents', asyncHandler(async (req, res) => {
  await createDemoAgents();
  res.json({ success: true, message: 'Demo agents created successfully' });
}));

/**
 * Get developer agent details
 */
router.get('/developer-agent', asyncHandler(async (req, res) => {
  const agent = await getDeveloperAgent();
  res.json({
    success: true,
    agent: {
      id: agent.getId(),
      name: agent.getName(),
      description: agent.getDescription(),
      capabilities: agent.getCapabilities(),
      type: agent.getType()
    }
  });
}));

/**
 * Get real estate agent details
 */
router.get('/real-estate-agent', asyncHandler(async (req, res) => {
  const agent = await getRealEstateAgent();
  res.json({
    success: true,
    agent: {
      id: agent.getId(),
      name: agent.getName(),
      description: agent.getDescription(),
      capabilities: agent.getCapabilities(),
      type: agent.getType()
    }
  });
}));

/**
 * Run developer agent task
 */
router.post('/run-developer-agent', asyncHandler(async (req, res) => {
  const { task } = req.body;
  
  if (!task) {
    return res.status(400).json({ 
      success: false, 
      error: 'Task is required in request body' 
    });
  }
  
  try {
    const agent = await getDeveloperAgent();
    
    // Execute the task directly
    const result = await agent.execute('answer_question', {
      question: task,
      context: 'The question is related to software development.'
    }, { priority: 'normal' });
    
    res.json({
      success: true,
      result: result.success ? result.data : { error: result.error?.message || 'Task execution failed' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}));

/**
 * Run real estate agent task
 */
router.post('/run-real-estate-agent', asyncHandler(async (req, res) => {
  const { task } = req.body;
  
  if (!task) {
    return res.status(400).json({
      success: false,
      error: 'Task is required in request body'
    });
  }
  
  try {
    const agent = await getRealEstateAgent();
    
    // Execute the task directly
    const result = await agent.execute('answer_question', {
      question: task,
      context: 'The question is related to real estate.'
    }, { priority: 'normal' });
    
    res.json({
      success: true,
      result: result.success ? result.data : { error: result.error?.message || 'Task execution failed' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}));

export default router;