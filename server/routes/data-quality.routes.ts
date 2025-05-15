/**
 * Data Quality Routes
 * 
 * This module defines the API routes for the data quality assessment
 * and reporting system.
 */

import { Router } from 'express';
import * as dataQualityController from '../controllers/data-quality.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @route GET /api/data-quality/report
 * @description Get a comprehensive data quality report
 */
router.get('/report', asyncHandler(dataQualityController.getDataQualityReport));

/**
 * @route GET /api/data-quality/metrics
 * @description Get data quality metrics only
 */
router.get('/metrics', asyncHandler(dataQualityController.getDataQualityMetrics));

/**
 * @route GET /api/data-quality/issues/:scope
 * @description Get data quality issues by scope (property, sale, neighborhood)
 */
router.get('/issues/:scope', asyncHandler(dataQualityController.getIssuesByScope));

/**
 * @route GET /api/data-quality/rules
 * @description Get all validation rules
 */
router.get('/rules', asyncHandler(dataQualityController.getValidationRules));

export const dataQualityRoutes = router;