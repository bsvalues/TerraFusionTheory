/**
 * TerraFusion Test Utilities
 * 
 * Utilities for testing TerraFusion integration components.
 */

import { v4 as uuidv4 } from 'uuid';

// Define types for agent activities
interface AgentActivity {
  id: string;
  type: 'info' | 'warning' | 'success' | 'calculation';
  message: string;
  details?: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  propertyId?: string;
  formField?: string;
}

/**
 * Generate a test agent activity event
 * 
 * @param propertyId Optional property ID to associate with the event
 * @param type Type of activity (info, warning, success, calculation)
 * @returns Generated agent activity
 */
export function generateTestAgentActivity(
  propertyId?: string,
  type: 'info' | 'warning' | 'success' | 'calculation' = 'info'
): AgentActivity {
  const activities: Record<string, Partial<AgentActivity>[]> = {
    'info': [
      {
        message: 'Analyzing property characteristics',
        details: 'Evaluating square footage, lot size, and property condition',
        formField: 'generalDescription.type'
      },
      {
        message: 'Checking zoning regulations',
        details: 'Property is zoned for residential use (R-1)',
        formField: 'siteZoning'
      },
      {
        message: 'Reviewing tax assessment history',
        details: 'Tax assessments have increased 12% over the past 3 years',
        formField: 'taxYear'
      }
    ],
    'warning': [
      {
        message: 'Potential flood zone issue detected',
        details: 'Property may be in or near flood zone AE per FEMA maps',
        formField: 'specialAssessments'
      },
      {
        message: 'Large recent assessment increase',
        details: 'Tax assessment increased 23% in the last year, which is significantly above market trends',
        formField: 'taxYear'
      },
      {
        message: 'Limited comparable properties',
        details: 'Only 2 comparable sales found within 0.5 miles in the last 6 months',
      }
    ],
    'success': [
      {
        message: 'Comparable properties identified',
        details: 'Found 5 recent comparable sales within optimal parameters',
      },
      {
        message: 'Valuation model complete',
        details: 'Confidence score: 89% based on 12 property characteristics',
        formField: 'valueConclusion'
      },
      {
        message: 'Market trend analysis complete',
        details: 'Property in area with 8.4% annual appreciation rate',
      }
    ],
    'calculation': [
      {
        message: 'Calculating cost approach valuation',
        details: 'Analyzing replacement cost with 2.3% depreciation factor',
        formField: 'approach.cost'
      },
      {
        message: 'Applying adjustment to comparable #3',
        details: '+4.5% adjustment for superior quality finishes',
      },
      {
        message: 'Recalibrating income model',
        details: 'Updated cap rate from 4.3% to 4.1% based on recent market data',
        formField: 'approach.income'
      }
    ]
  };

  // Select a random activity from the specified type
  const activityTemplates = activities[type];
  const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
  
  // Create the activity
  const activity: AgentActivity = {
    id: uuidv4(),
    type,
    message: template.message || 'Agent activity',
    details: template.details,
    timestamp: new Date().toISOString(),
    agentId: `agent_${uuidv4().substring(0, 8)}`,
    agentName: 'TerraFusion Analysis Agent',
    propertyId,
    formField: template.formField,
  };
  
  return activity;
}

/**
 * Broadcast a test agent activity through the WebSocket
 * 
 * @param propertyId Optional property ID for the activity
 * @param count Number of activities to generate
 * @param intervalMs Interval between activities in milliseconds
 * @returns Promise that resolves when all activities have been broadcast
 */
export async function broadcastTestAgentActivities(
  propertyId?: string, 
  count = 5,
  intervalMs = 2000
): Promise<void> {
  // Get a reference to the global broadcastAgentEvent function
  const broadcast = (global as any).broadcastAgentEvent;
  
  if (!broadcast || typeof broadcast !== 'function') {
    console.error('[TerraFusion Test] broadcastAgentEvent function not found');
    return;
  }
  
  console.log(`[TerraFusion Test] Broadcasting ${count} test agent activities for property ${propertyId || 'all properties'}`);
  
  const activityTypes: Array<'info' | 'warning' | 'success' | 'calculation'> = [
    'info', 'warning', 'success', 'calculation'
  ];
  
  // Broadcast activities at the specified interval
  for (let i = 0; i < count; i++) {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const activity = generateTestAgentActivity(propertyId, type);
    
    broadcast(activity);
    
    console.log(`[TerraFusion Test] Broadcast activity: ${activity.type} - ${activity.message}`);
    
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  console.log(`[TerraFusion Test] Completed broadcasting ${count} test activities`);
}

/**
 * Register a route to trigger test agent activities
 */
export function registerTestRoutes(app: any): void {
  // Route to trigger test agent activities
  app.get('/api/terrafusion/test/agent-activity', async (req: any, res: any) => {
    try {
      const propertyId = req.query.propertyId;
      const count = parseInt(req.query.count || '5', 10);
      const interval = parseInt(req.query.interval || '2000', 10);
      
      // Start broadcasting activities (non-blocking)
      broadcastTestAgentActivities(propertyId, count, interval)
        .catch(err => console.error('[TerraFusion Test] Error broadcasting activities:', err));
      
      res.json({ 
        success: true, 
        message: `Broadcasting ${count} test agent activities for property ${propertyId || 'all properties'}`
      });
    } catch (error) {
      console.error('[TerraFusion Test] Error handling test route:', error);
      res.status(500).json({ error: 'Failed to trigger test agent activities' });
    }
  });
  
  console.log('[TerraFusion Test] Test routes registered');
}