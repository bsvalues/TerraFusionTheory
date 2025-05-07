/**
 * Data Quality Routes
 * 
 * Defines API endpoints for data quality assessment and enrichment.
 */

import { Router } from 'express';
import * as dataQualityController from '../controllers/data-quality.controller';

const router = Router();

// Data quality reports
router.get('/property-report', dataQualityController.getPropertyDataQualityReport);
router.get('/property-sales-report', dataQualityController.getPropertySalesDataQualityReport);
router.get('/neighborhood-report', dataQualityController.getNeighborhoodDataQualityReport);
router.get('/dashboard', dataQualityController.getDataQualityDashboard);

// Property-specific quality
router.get('/property/:id/report', dataQualityController.getPropertyQualityReport);

// Data enrichment
router.get('/geocoding/needed', dataQualityController.getPropertiesNeedingGeocoding);
router.post('/geocoding/batch', dataQualityController.geocodeProperties);
router.post('/property/:id/enrich/flood-zone', dataQualityController.enrichPropertyFloodZone);
router.post('/neighborhood/:code/update-stats', dataQualityController.updateNeighborhoodStats);

export const dataQualityRoutes = router;