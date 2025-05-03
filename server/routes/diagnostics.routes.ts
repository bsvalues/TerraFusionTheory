import { Express } from 'express';
import * as diagnosticsController from '../controllers/diagnostics.controller';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Register diagnostics routes
 */
export function registerDiagnosticsRoutes(app: Express): void {
  // Get status of all connectors
  app.get('/api/diagnostics/connectors', asyncHandler(diagnosticsController.getConnectorStatuses));
  
  // Test a specific connector
  app.get('/api/diagnostics/connectors/:name/test', asyncHandler(diagnosticsController.testConnector));
  
  // Refresh all data
  app.post('/api/diagnostics/refresh', asyncHandler(diagnosticsController.refreshAllData));
  
  console.log('[DiagnosticsRoutes] Diagnostics routes registered');
}