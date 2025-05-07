/**
 * Data Quality Controller
 * 
 * Provides API endpoints for data quality assessment and data enrichment.
 */

import { Request, Response } from 'express';
import { dataQualityService } from '../services/data-quality';
import { dataEnrichmentService } from '../services/data-enrichment';
import { db } from '../db';
import { properties } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a property data quality report
 */
export async function getPropertyDataQualityReport(req: Request, res: Response) {
  try {
    const report = await dataQualityService.generatePropertyDataQualityReport();
    return res.json(report);
  } catch (error) {
    console.error('Error generating property data quality report:', error);
    return res.status(500).json({ error: 'Failed to generate property data quality report' });
  }
}

/**
 * Generate a property sales data quality report
 */
export async function getPropertySalesDataQualityReport(req: Request, res: Response) {
  try {
    const report = await dataQualityService.generatePropertySalesDataQualityReport();
    return res.json(report);
  } catch (error) {
    console.error('Error generating property sales data quality report:', error);
    return res.status(500).json({ error: 'Failed to generate property sales data quality report' });
  }
}

/**
 * Generate a neighborhood data quality report
 */
export async function getNeighborhoodDataQualityReport(req: Request, res: Response) {
  try {
    const report = await dataQualityService.generateNeighborhoodDataQualityReport();
    return res.json(report);
  } catch (error) {
    console.error('Error generating neighborhood data quality report:', error);
    return res.status(500).json({ error: 'Failed to generate neighborhood data quality report' });
  }
}

/**
 * Generate a consolidated data quality dashboard
 */
export async function getDataQualityDashboard(req: Request, res: Response) {
  try {
    const dashboard = await dataQualityService.generateDataQualityDashboard();
    return res.json(dashboard);
  } catch (error) {
    console.error('Error generating data quality dashboard:', error);
    return res.status(500).json({ error: 'Failed to generate data quality dashboard' });
  }
}

/**
 * Geocode properties missing coordinates
 */
export async function geocodeProperties(req: Request, res: Response) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const results = await dataEnrichmentService.batchGeocodeProperties(limit);
    return res.json({
      success: true,
      processed: results.length,
      successful: results.filter(r => r.successful).length,
      failed: results.filter(r => !r.successful).length,
      results
    });
  } catch (error) {
    console.error('Error geocoding properties:', error);
    return res.status(500).json({ error: 'Failed to geocode properties' });
  }
}

/**
 * Get a list of properties needing geocoding
 */
export async function getPropertiesNeedingGeocoding(req: Request, res: Response) {
  try {
    const properties = await dataEnrichmentService.identifyPropertiesNeedingGeocoding();
    return res.json({
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('Error identifying properties needing geocoding:', error);
    return res.status(500).json({ error: 'Failed to identify properties needing geocoding' });
  }
}

/**
 * Generate a quality report for a specific property
 */
export async function getPropertyQualityReport(req: Request, res: Response) {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    // Check if property exists
    const propertyExists = await db.select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, propertyId));
    
    if (propertyExists.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const report = await dataEnrichmentService.generatePropertyQualityReport(propertyId);
    return res.json(report);
  } catch (error) {
    console.error(`Error generating quality report for property ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to generate property quality report' });
  }
}

/**
 * Enrich a property with flood zone data
 */
export async function enrichPropertyFloodZone(req: Request, res: Response) {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    // Check if property exists
    const propertyExists = await db.select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, propertyId));
    
    if (propertyExists.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    const result = await dataEnrichmentService.enrichFloodZoneData(propertyId);
    return res.json(result);
  } catch (error) {
    console.error(`Error enriching flood zone data for property ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to enrich property with flood zone data' });
  }
}

/**
 * Update statistics for a neighborhood
 */
export async function updateNeighborhoodStats(req: Request, res: Response) {
  try {
    const neighborhoodCode = req.params.code;
    if (!neighborhoodCode) {
      return res.status(400).json({ error: 'Invalid neighborhood code' });
    }
    
    await dataEnrichmentService.updateNeighborhoodStatistics(neighborhoodCode);
    return res.json({ success: true, message: `Updated statistics for neighborhood ${neighborhoodCode}` });
  } catch (error) {
    console.error(`Error updating statistics for neighborhood ${req.params.code}:`, error);
    return res.status(500).json({ error: 'Failed to update neighborhood statistics' });
  }
}