/**
 * Spatial Analytics Routes
 * 
 * This module defines the routes for spatial analytics capabilities
 * including feature engineering, GWR modeling, and quantile regression.
 */

import { Router } from 'express';
import * as spatialAnalyticsController from '../controllers/spatial-analytics.controller';

const router = Router();

/**
 * @route   GET /api/spatial-analytics/capabilities
 * @desc    Get all available spatial analytics capabilities
 * @access  Public
 */
router.get('/capabilities', spatialAnalyticsController.getSpatialCapabilities);

/**
 * @route   POST /api/spatial-analytics/features
 * @desc    Engineer spatial features for a dataset
 * @access  Public
 */
router.post('/features', spatialAnalyticsController.engineerSpatialFeatures);

/**
 * @route   POST /api/spatial-analytics/gwr
 * @desc    Fit a GWR model to a dataset
 * @access  Public
 */
router.post('/gwr', spatialAnalyticsController.fitGWRModel);

/**
 * @route   POST /api/spatial-analytics/quantile
 * @desc    Fit a quantile regression model to a dataset
 * @access  Public
 */
router.post('/quantile', spatialAnalyticsController.fitQuantileModel);

/**
 * @route   POST /api/spatial-analytics/predict
 * @desc    Predict using a fitted model
 * @access  Public
 */
router.post('/predict', spatialAnalyticsController.predictWithModel);

/**
 * @route   POST /api/spatial-analytics/gwr/maps
 * @desc    Generate coefficient maps for GWR model
 * @access  Public
 */
router.post('/gwr/maps', spatialAnalyticsController.generateCoefficientMaps);

/**
 * @route   POST /api/spatial-analytics/quantile/uncertainty
 * @desc    Plot uncertainty for quantile regression model
 * @access  Public
 */
router.post('/quantile/uncertainty', spatialAnalyticsController.plotUncertainty);

export default router;