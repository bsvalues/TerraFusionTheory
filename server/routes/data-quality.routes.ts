/**
 * Data Quality Routes
 * 
 * Provides API endpoints for data quality assessment, reporting,
 * and validation based on IAAO standards.
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as dataQualityController from '../controllers/data-quality.controller';

const router = Router();

/**
 * @route GET /api/data-quality/report
 * @description Get data quality report
 */
router.get('/report', asyncHandler(dataQualityController.getDataQualityReport));

/**
 * @route GET /api/data-quality/issues
 * @description Get quality issues, optionally filtered by category and severity
 */
router.get('/issues', asyncHandler(dataQualityController.getQualityIssues));

/**
 * @route GET /api/data-quality/stats
 * @description Get quality statistics
 */
router.get('/stats', asyncHandler(dataQualityController.getQualityStats));

/**
 * @route POST /api/data-quality/regenerate
 * @description Force regeneration of quality report
 */
router.post('/regenerate', asyncHandler(dataQualityController.regenerateQualityReport));

/**
 * @route GET /api/data-quality/property/:id
 * @description Validate a specific property
 */
router.get('/property/:id', asyncHandler(dataQualityController.validateProperty));

/**
 * @route GET /api/data-quality/sale/:id
 * @description Validate a specific sale
 */
router.get('/sale/:id', asyncHandler(dataQualityController.validateSale));

export const dataQualityRoutes = router;