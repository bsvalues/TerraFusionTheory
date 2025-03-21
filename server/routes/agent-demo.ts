/**
 * Agent Demo Routes
 * 
 * This file contains routes for demonstrating agent system functionality.
 */

import { Router } from 'express';
import { runAgentDemo } from '../../agents/demo';
import { createDemoAgents, getDeveloperAgent, getRealEstateAgent } from '../../agents';

const router = Router();

/**
 * Endpoint to run the agent demo
 */
router.get('/run-demo', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error running agent demo:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Create sample agents
 */
router.post('/create-agents', async (req, res) => {
  try {
    await createDemoAgents();
    res.json({ success: true, message: 'Demo agents created successfully' });
  } catch (error) {
    console.error('Error creating demo agents:', error);
    res.status(500).json({
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get developer agent details
 */
router.get('/developer-agent', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error getting developer agent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get real estate agent details
 */
router.get('/real-estate-agent', async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error getting real estate agent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;