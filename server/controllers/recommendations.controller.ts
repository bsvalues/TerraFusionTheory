/**
 * Property Recommendations Controller
 * 
 * This controller provides endpoints for personalized property recommendations.
 */

import { Request, Response } from 'express';
import { IStorage } from '../storage';

/**
 * Get personalized property recommendations for a user
 * 
 * @param req The request object
 * @param res The response object
 */
export async function getPropertyRecommendations(req: Request, res: Response, storage: IStorage) {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
    const filterByTags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    
    // For now, we're using mock data for the property recommendations
    // In a production app, this would come from a recommendation engine
    // that analyzes user behavior and preferences
    const recommendations = [
      {
        id: "prop-1",
        address: "123 Main St, Grandview, WA 98930",
        price: 450000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1800,
        imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=500&auto=format&fit=crop",
        insights: [
          {
            type: "valuation",
            title: "Cost Approach Analysis",
            description: "Replacement cost of $175/sqft plus land value of $85,000 suggests a total value of $400,000, indicating potential over-assessment.",
            score: 82
          },
          {
            type: "comparable",
            title: "Comparable Sales Method",
            description: "Based on 5 similar properties sold in the last 6 months within 0.5 miles, the adjusted comparable value is $445,000.",
            score: 95
          },
          {
            type: "assessment",
            title: "Assessment Ratio",
            description: "Current assessment ratio is 0.92, within the acceptable range of 0.90-1.10 for equitable property taxation.",
            score: 88
          }
        ],
        matchScore: 92,
        tags: ["Assessed", "Single Family", "Average Quality"],
        latitude: 46.2529,
        longitude: -119.9021
      },
      {
        id: "prop-2",
        address: "456 Oak Ave, Grandview, WA 98930",
        price: 385000,
        bedrooms: 4,
        bathrooms: 2.5,
        squareFeet: 2200,
        imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=500&auto=format&fit=crop",
        insights: [
          {
            type: "mass-appraisal",
            title: "Automated Valuation Model",
            description: "The AVM suggests a value range of $375,000-$395,000 based on regression analysis of 72 similar properties.",
            score: 91
          },
          {
            type: "market",
            title: "Market Approach Analysis",
            description: "Time-adjusted market approach indicates a value of $382,000, very close to current assessment.",
            score: 94
          },
          {
            type: "assessment",
            title: "PRD Value",
            description: "The Price Related Differential (PRD) of 1.03 suggests slight regressivity in assessment for this price range.",
            score: 85
          }
        ],
        matchScore: 88,
        tags: ["Accurately Assessed", "Market Aligned", "Above Average"],
        latitude: 46.2550,
        longitude: -119.9100
      },
      {
        id: "prop-3",
        address: "789 Pine Ln, Grandview, WA 98930",
        price: 325000,
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1500,
        imageUrl: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?q=80&w=500&auto=format&fit=crop",
        insights: [
          {
            type: "appraisal",
            title: "Income Approach",
            description: "Using the GRM method with comparable rental properties, the income approach yields a value of $340,000.",
            score: 87
          },
          {
            type: "mass-appraisal",
            title: "CAMA Model Results",
            description: "The Computer Assisted Mass Appraisal model suggests a value of $332,500 based on county-wide parameters.",
            score: 90
          },
          {
            type: "comparable",
            title: "Sales Comparison Approach",
            description: "Adjustments for square footage, age, and condition result in a comparable value of $328,000.",
            score: 95
          }
        ],
        matchScore: 85,
        tags: ["Income Producing", "Rental Property", "Average Quality"],
        latitude: 46.2510,
        longitude: -119.9050
      },
      {
        id: "prop-4",
        address: "101 Cedar Ct, Grandview, WA 98930",
        price: 510000,
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2800,
        imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=500&auto=format&fit=crop",
        insights: [
          {
            type: "valuation",
            title: "Replacement Cost Analysis",
            description: "High-quality construction at $215/sqft plus land value of $120,000 indicates replacement cost of $722,000.",
            score: 94
          },
          {
            type: "assessment",
            title: "Assessment Review",
            description: "Current assessment appears to be 18% below market value, suggesting potential for appeal by county assessor.",
            score: 65
          },
          {
            type: "mass-appraisal",
            title: "IAAO Standards",
            description: "The COD (Coefficient of Dispersion) for this neighborhood is 12.8, within IAAO standards for residential properties.",
            score: 85
          }
        ],
        matchScore: 80,
        tags: ["Under-assessed", "High Quality", "Recent Construction"],
        latitude: 46.2600,
        longitude: -119.9000
      },
      {
        id: "prop-5",
        address: "202 Maple Dr, Grandview, WA 98930",
        price: 295000,
        bedrooms: 3,
        bathrooms: 1.5,
        squareFeet: 1600,
        imageUrl: "https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?q=80&w=500&auto=format&fit=crop",
        insights: [
          {
            type: "comparable",
            title: "Comparable Adjustments",
            description: "After adjustments for condition (-15%), lot size (+5%), and bathroom count (-8%), the adjusted comparable value is $275,000.",
            score: 88
          },
          {
            type: "appraisal",
            title: "Functional Obsolescence",
            description: "Estimated 8% functional obsolescence due to dated floor plan and electrical system reduces value by $23,600.",
            score: 72
          },
          {
            type: "assessment",
            title: "Assessment Timeline",
            description: "Last mass appraisal was 3 years ago. Current assessment may not reflect recent local market changes.",
            score: 82
          }
        ],
        matchScore: 78,
        tags: ["Needs Assessment", "Functionally Obsolete", "Older Home"],
        latitude: 46.2520,
        longitude: -119.9120
      }
    ];
    
    // Filter by tags if provided
    let filteredRecommendations = recommendations;
    if (filterByTags && filterByTags.length > 0) {
      filteredRecommendations = recommendations.filter(property => 
        property.tags.some(tag => filterByTags.includes(tag))
      );
    }
    
    // Apply limit
    const limitedRecommendations = filteredRecommendations.slice(0, limit);
    
    return res.status(200).json(limitedRecommendations);
  } catch (error) {
    console.error('Error getting property recommendations:', error);
    return res.status(500).json({ error: 'Failed to get property recommendations' });
  }
}

/**
 * Get popular property tags for filtering
 * 
 * @param req The request object
 * @param res The response object
 */
export async function getPropertyTags(req: Request, res: Response) {
  try {
    // In a real app, this would come from analyzing property data
    const tags = [
      "Assessed",
      "Market Aligned",
      "Under-assessed",
      "Needs Assessment",
      "Income Producing",
      "Single Family",
      "Average Quality",
      "Above Average",
      "High Quality",
      "Recent Construction",
      "Older Home",
      "Functionally Obsolete"
    ];
    
    return res.status(200).json(tags);
  } catch (error) {
    console.error('Error getting property tags:', error);
    return res.status(500).json({ error: 'Failed to get property tags' });
  }
}

/**
 * Save a property as favorite for a user
 * 
 * @param req The request object
 * @param res The response object
 */
export async function savePropertyFavorite(req: Request, res: Response) {
  try {
    const { userId, propertyId } = req.body;
    
    if (!userId || !propertyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // In a real app, this would save the favorite in the database
    
    return res.status(200).json({ success: true, message: 'Property saved as favorite' });
  } catch (error) {
    console.error('Error saving property favorite:', error);
    return res.status(500).json({ error: 'Failed to save property as favorite' });
  }
}

/**
 * Remove a property from favorites for a user
 * 
 * @param req The request object
 * @param res The response object
 */
export async function removePropertyFavorite(req: Request, res: Response) {
  try {
    const { userId, propertyId } = req.body;
    
    if (!userId || !propertyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // In a real app, this would remove the favorite from the database
    
    return res.status(200).json({ success: true, message: 'Property removed from favorites' });
  } catch (error) {
    console.error('Error removing property favorite:', error);
    return res.status(500).json({ error: 'Failed to remove property from favorites' });
  }
}

/**
 * Get personalized insights for a property
 * 
 * @param req The request object
 * @param res The response object
 */
export async function getPropertyInsights(req: Request, res: Response) {
  try {
    const propertyId = req.params.propertyId;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Missing property ID' });
    }
    
    // In a real app, this would fetch insights from an AI-powered analysis engine
    const insights = [
      {
        type: "valuation",
        title: "Cost Approach Analysis",
        description: "Replacement cost new of $180/sqft with land value of $95,000 suggests a total value of $430,000 via cost approach.",
        score: 88
      },
      {
        type: "comparable",
        title: "Sales Comparison Approach",
        description: "Five comparable properties within 0.6 miles sold in the last 90 days indicate an adjusted value of $442,500.",
        score: 92
      },
      {
        type: "mass-appraisal",
        title: "CAMA Model Assessment",
        description: "Computer-assisted mass appraisal model suggests value of $438,000 based on regression analysis.",
        score: 90
      },
      {
        type: "appraisal",
        title: "Final Reconciliation",
        description: "Weighted reconciliation of all three approaches indicates a final market value of $440,000.",
        score: 95
      },
      {
        type: "assessment",
        title: "Assessment Analysis",
        description: "Current assessment ratio is 0.94, within IAAO standards for assessment uniformity.",
        score: 88
      }
    ];
    
    return res.status(200).json(insights);
  } catch (error) {
    console.error('Error getting property insights:', error);
    return res.status(500).json({ error: 'Failed to get property insights' });
  }
}