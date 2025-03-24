/**
 * Property Valuation Controller
 * 
 * Exposes endpoints for valuing properties with external data factors
 */

import { Request, Response } from 'express';
import { propertyValuationService } from '../services/property-valuation.service';
import { WeatherData, ClimateData, DemographicData } from '../types/external-data';

/**
 * Get a comprehensive property valuation with external data factored in
 */
export const getPropertyValuation = async (req: Request, res: Response) => {
  try {
    const { 
      property,
      weatherData,
      climateData,
      demographicData
    } = req.body;

    // Validate required property fields
    if (!property || !property.address || !property.basePrice) {
      return res.status(400).json({
        error: 'Property information is required with at least address and basePrice'
      });
    }

    // Calculate valuation with any available external data
    const valuation = propertyValuationService.getPropertyValuation(
      property,
      weatherData as WeatherData,
      climateData as ClimateData[],
      demographicData as DemographicData
    );

    res.status(200).json(valuation);
  } catch (error) {
    console.error('Error in property valuation:', error);
    res.status(500).json({
      error: 'Failed to calculate property valuation',
      details: error.message
    });
  }
};

/**
 * Get adjusted comparable properties with similarity scores
 */
export const getComparableProperties = async (req: Request, res: Response) => {
  try {
    const { 
      property,
      comparables,
      climateData,
      demographicData
    } = req.body;

    // Validate required property fields
    if (!property || !property.address || !property.basePrice) {
      return res.status(400).json({
        error: 'Subject property information is required with at least address and basePrice'
      });
    }

    // Validate comparables
    if (!comparables || !Array.isArray(comparables) || comparables.length === 0) {
      return res.status(400).json({
        error: 'At least one comparable property is required'
      });
    }

    // Get adjusted comparables with any available external data
    const adjustedComparables = propertyValuationService.getComparableProperties(
      property,
      comparables,
      climateData as ClimateData[],
      demographicData as DemographicData
    );

    res.status(200).json(adjustedComparables);
  } catch (error) {
    console.error('Error in comparable properties:', error);
    res.status(500).json({
      error: 'Failed to calculate comparable properties',
      details: error.message
    });
  }
};