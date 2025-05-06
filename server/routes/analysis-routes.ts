/**
 * Analysis Routes Registration
 * 
 * Registers routes for data analysis, validation, and mass appraisal functionality.
 */

import { Express } from 'express';
import analysisRoutes from './analysis.routes';

/**
 * Register analysis routes
 */
export function registerAnalysisRoutes(app: Express): void {
  console.log('Analysis routes registered');
  app.use('/api/analysis', analysisRoutes);
}