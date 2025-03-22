/**
 * Agent Demo Routes
 * 
 * This file contains routes for demonstrating agent system functionality.
 */

import { Router } from 'express';
import { runAgentDemo } from '../../agents/demo';
import { createDemoAgents, getDeveloperAgent, getRealEstateAgent } from '../../agents';
import { asyncHandler } from '../middleware/errorHandler';
import { testVectorMemory } from '../../agents/memory/vector-test';

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
 * Run developer agent task
 */
router.post('/run-developer-agent', asyncHandler(async (req, res) => {
  const { task, inputs } = req.body;
  
  if (!task) {
    return res.status(400).json({
      success: false,
      error: 'Task is required in request body'
    });
  }
  
  try {
    const agent = await getDeveloperAgent();
    
    // Default inputs if not provided
    const taskInputs = inputs || {};
    
    // For answer_question type, we need to extract the question
    if (task === 'answer_question' && !taskInputs.question && req.body.question) {
      taskInputs.question = req.body.question;
    }
    
    // Execute the task
    const result = await agent.execute(task, taskInputs, { priority: 'normal' });
    
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
 * Test enhanced vector memory system
 */
router.get('/test-vector-memory', asyncHandler(async (req, res) => {
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
  
  // Run the vector memory tests
  await testVectorMemory();
  
  // Restore console.log
  console.log = originalConsoleLog;
  
  // Return the captured logs
  res.json({
    success: true,
    message: 'Vector memory tests completed',
    logs: logCapture
  });
}));

/**
 * Answer technical question with developer agent
 */
router.post('/answer-technical-question', asyncHandler(async (req, res) => {
  const { question } = req.body;
  
  if (!question) {
    return res.status(400).json({ 
      success: false, 
      error: 'Question is required in request body' 
    });
  }
  
  try {
    const agent = await getDeveloperAgent();
    
    // Execute the task directly for answering questions
    const result = await agent.execute('answer_question', {
      question,
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
 * Generate code with developer agent
 */
router.post('/generate-code', asyncHandler(async (req, res) => {
  const { language, requirements, style, context } = req.body;
  
  if (!language || !requirements) {
    return res.status(400).json({ 
      success: false, 
      error: 'Language and requirements are required in request body' 
    });
  }
  
  try {
    const agent = await getDeveloperAgent();
    
    // Execute the code generation task
    const result = await agent.execute('generate_code', {
      language,
      requirements,
      style: style || 'detailed', // default to detailed if not specified
      context
    }, { priority: 'normal' });
    
    res.json({
      success: true,
      result: result.success ? result.data : { error: result.error?.message || 'Code generation failed' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}));

/**
 * Debug code with developer agent
 */
router.post('/debug-code', asyncHandler(async (req, res) => {
  const { code, language, error_message } = req.body;
  
  if (!code || !language || !error_message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Code, language, and error_message are required in request body' 
    });
  }
  
  try {
    const agent = await getDeveloperAgent();
    
    // Execute the debugging task
    const result = await agent.execute('debug_code', {
      code,
      language,
      error_message
    }, { priority: 'high' }); // Use high priority for debugging issues
    
    res.json({
      success: true,
      result: result.success ? result.data : { error: result.error?.message || 'Debugging failed' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}));

/**
 * Review code with developer agent
 */
router.post('/review-code', asyncHandler(async (req, res) => {
  const { code, language, focus_areas } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ 
      success: false, 
      error: 'Code and language are required in request body' 
    });
  }
  
  try {
    const agent = await getDeveloperAgent();
    
    // Execute the code review task
    const result = await agent.execute('review_code', {
      code,
      language,
      focus_areas: focus_areas || [] // Optional focus areas
    }, { priority: 'normal' });
    
    res.json({
      success: true,
      result: result.success ? result.data : { error: result.error?.message || 'Code review failed' }
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

/**
 * Test MCP tool implementation
 */
router.post('/test-mcp', asyncHandler(async (req, res) => {
  const { prompt, model, temperature } = req.body;
  
  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required in request body'
    });
  }
  
  try {
    const agent = await getRealEstateAgent();
    
    // Use the MCP tool directly
    const result = await agent.useTool('mcp', {
      model: model || 'gpt-4',
      prompt,
      temperature: temperature || 0.5,
      system_message: 'You are an AI assistant with expertise in real estate.'
    });
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}));

export default router;