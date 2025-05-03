/**
 * TerraFusion Routes
 * 
 * This file defines routes for the TerraFusion integration in the IntelligentEstate platform.
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { broadcastTestAgentActivities } from '../utils/terrafusion-test';

// Define interfaces for TerraFusion agents
interface TerraFusionAgent {
  id: string;
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  lastActive: string;
  createdAt: string;
  apiKey?: string;
}

// Create a router
const router = Router();

// Get all registered TerraFusion agents
router.get('/agents', async (req, res) => {
  try {
    // In a real implementation, this would retrieve agents from the database
    // For now, we'll just return a static list
    const agents = [
      {
        id: 'agent_valuation_forecast',
        name: 'Valuation Forecast Agent',
        type: 'forecast',
        description: 'Analyzes market trends and property characteristics to forecast future property values',
        capabilities: ['forecasting', 'trend-analysis', 'market-modeling'],
        status: 'active',
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json(agents);
  } catch (error) {
    console.error('Error fetching TerraFusion agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Register a new TerraFusion agent
router.post('/agents', async (req, res) => {
  try {
    const { name, type, description, capabilities } = req.body;
    
    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    // Create a new agent
    const agent: TerraFusionAgent = {
      id: `agent_${type}_${uuidv4().substring(0, 8)}`,
      name,
      type,
      description: description || `TerraFusion ${type} agent`,
      capabilities: capabilities || [],
      status: 'active',
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      apiKey: uuidv4()
    };
    
    // In a real implementation, this would store the agent in the database
    
    // Return the created agent (excluding the API key for security)
    const { apiKey, ...safeAgent } = agent;
    
    // Return full agent with API key only in initial response
    res.status(201).json({
      ...safeAgent,
      apiKey
    });
  } catch (error) {
    console.error('Error registering TerraFusion agent:', error);
    res.status(500).json({ error: 'Failed to register agent' });
  }
});

// Get a specific agent by ID
router.get('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, this would retrieve the agent from the database
    // For now, return a mock response for the forecast agent
    if (id === 'agent_valuation_forecast' || id.startsWith('agent_forecast_')) {
      const agent = {
        id,
        name: 'Valuation Forecast Agent',
        type: 'forecast',
        description: 'Analyzes market trends and property characteristics to forecast future property values',
        capabilities: ['forecasting', 'trend-analysis', 'market-modeling'],
        status: 'active',
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      res.json(agent);
    } else {
      res.status(404).json({ error: 'Agent not found' });
    }
  } catch (error) {
    console.error('Error fetching TerraFusion agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Update an agent's status
router.patch('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate required fields
    if (!status || !['active', 'inactive', 'error'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (active, inactive, error) is required' });
    }
    
    // In a real implementation, this would update the agent in the database
    // For now, return a success message
    
    res.json({
      id,
      status,
      lastActive: new Date().toISOString(),
      message: `Agent ${id} status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating TerraFusion agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// Agent sends an activity to be broadcast to clients
router.post('/agents/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, message, details, propertyId, formField } = req.body;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Create the activity
    const activity = {
      id: uuidv4(),
      type: type || 'info',
      message,
      details,
      timestamp: new Date().toISOString(),
      agentId: id,
      agentName: 'TerraFusion Agent', // In a real implementation, look up the agent name
      propertyId,
      formField
    };
    
    // Broadcast the activity
    const broadcast = (global as any).broadcastAgentEvent;
    if (broadcast && typeof broadcast === 'function') {
      broadcast(activity);
      console.log(`[TerraFusion] Activity broadcast from agent ${id}: ${message}`);
    } else {
      console.error('[TerraFusion] broadcastAgentEvent function not found');
    }
    
    res.status(201).json({
      success: true,
      activity,
      message: 'Activity broadcast successfully'
    });
  } catch (error) {
    console.error('Error broadcasting agent activity:', error);
    res.status(500).json({ error: 'Failed to broadcast activity' });
  }
});

// Test route to trigger agent activities
router.get('/test/broadcast', async (req, res) => {
  try {
    const { propertyId, count = '5', interval = '2000' } = req.query;
    
    // Start broadcasting activities
    broadcastTestAgentActivities(
      propertyId as string,
      parseInt(count as string, 10),
      parseInt(interval as string, 10)
    ).catch(error => {
      console.error('[TerraFusion] Error broadcasting test activities:', error);
    });
    
    res.json({
      success: true,
      message: `Broadcasting ${count} test agent activities for property ${propertyId || 'all properties'}`
    });
  } catch (error) {
    console.error('[TerraFusion] Error handling test broadcast route:', error);
    res.status(500).json({ error: 'Failed to trigger test agent activities' });
  }
});

// Export the router
export function registerTerraFusionRoutes(app: any): void {
  app.use('/api/terrafusion', router);
  console.log('[TerraFusion] Routes registered');
}