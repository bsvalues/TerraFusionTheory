/**
 * Valuation Agent Routes
 * 
 * These routes provide access to the valuation agent API.
 */

import { Router } from 'express';
import { 
  getValuationAgent,
  requestComprehensiveValuation,
  requestMethodologyRecommendation,
  requestValuationExplanation,
  requestValueReconciliation,
  askValuationQuestion,
  initializeValuationAgent
} from '../controllers/valuation-agent.controller';

/**
 * Register valuation agent routes
 */
export function registerValuationAgentRoutes(app: Router): void {
  console.log('[ValuationAgentRoutes] Registering valuation agent routes');
  
  // Initialize valuation agent on startup
  initializeValuationAgent().catch(error => {
    console.error('Error initializing valuation agent:', error);
  });
  
  // Create router
  const router = Router();
  
  // Agent information
  router.get('/', getValuationAgent);
  
  // Valuation API endpoints
  router.post('/comprehensive', requestComprehensiveValuation);
  router.post('/methodology', requestMethodologyRecommendation);
  router.post('/explanation', requestValuationExplanation);
  router.post('/reconciliation', requestValueReconciliation);
  router.post('/question', askValuationQuestion);
  
  // Register routes
  app.use('/api/agents/valuation', router);
  
  console.log('[ValuationAgentRoutes] Valuation agent routes registered');
}