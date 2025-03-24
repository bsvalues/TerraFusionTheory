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
            description: "RCN of $175/sqft with 15% depreciation (age-life method), plus land value of $85,000 yields a total value of $400,000. Marshall & Swift cost manual index: 1.06.",
            score: 82
          },
          {
            type: "comparable",
            title: "Comparable Sales Method",
            description: "5 similar properties (adjusted for GLA, quality, condition) with time adjustment of +0.5%/month yield $445,000 reconciled value. COV: 0.05.",
            score: 95
          },
          {
            type: "assessment",
            title: "Assessment Ratio Study",
            description: "Current assessment ratio: 0.92, PRD: 1.03, COD: 12.4, within IAAO standards (0.90-1.10, <1.10, <15.0). Vertical equity regression p-value: 0.58.",
            score: 88
          }
        ],
        matchScore: 92,
        tags: ["Equitably Assessed", "Single Family Residential", "Construction Quality 3"],
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
            title: "Multiple Regression Analysis",
            description: "MRA model (adj-R²: 0.87, p-value: <0.001) with 72 market sales predicts $388,400 value. Confidence interval: $375,000-$395,000.",
            score: 91
          },
          {
            type: "market",
            title: "Market Approach Analysis",
            description: "Time-adjusted market approach with 6 comps (time adj: +0.4%/month) yields $382,000. Comp grid variance: 5.2%. Reconciled value: $385,000.",
            score: 94
          },
          {
            type: "assessment",
            title: "Price-Related Statistics",
            description: "PRD: 1.03, PRB: -0.021, COD: 9.8. Statistical analysis indicates slight vertical regressivity in neighborhood assessments.",
            score: 85
          }
        ],
        matchScore: 88,
        tags: ["Market Value Aligned", "Single Family Residential", "Construction Quality 2"],
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
            title: "Income Capitalization Approach",
            description: "GRM: 128 derived from 8 rental comps. Monthly rent: $2,650. Cap rate: 6.2%. Direct capitalization with market rents yields $340,000 value estimate.",
            score: 87
          },
          {
            type: "mass-appraisal",
            title: "CAMA Model Specification",
            description: "Additive model with log-transformation on price, 23 neighborhood factors. R²: 0.83, RMSE: 5.4%, AIC: 892. Value prediction: $332,500.",
            score: 90
          },
          {
            type: "comparable",
            title: "Sales Comparison Grid Analysis",
            description: "Paired sales analysis with 4 comparables. Adjustments: GLA (+$60/sf), condition (-5%), bath count (+$8,000 per full). Adjusted value: $328,000.",
            score: 95
          }
        ],
        matchScore: 85,
        tags: ["Income Approach Candidate", "Market Value Aligned", "Construction Quality 3"],
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
            title: "Cost Approach Valuation",
            description: "Class 3 construction quality using Marshall & Swift with 8% entrepreneurial profit. RCN: $215/sqft × 2,800 sqft = $602,000 + land $120,000 = $722,000.",
            score: 94
          },
          {
            type: "assessment",
            title: "Assessment Equity Analysis",
            description: "Current assessed value ($420,000) is 18% below market evidence ($510,000). Assessment-to-sales ratio (0.82) outside IAAO standard range (0.90-1.10).",
            score: 65
          },
          {
            type: "mass-appraisal",
            title: "Ratio Study Statistics",
            description: "Neighborhood ratio statistics: Median ratio: 0.95, COD: 12.8, PRD: 1.02, COV: 14.3%. Meets IAAO residential standard thresholds (<15.0, 0.98-1.03, <20%).",
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
            title: "Sales Comparison Grid Analysis",
            description: "Qualitative and quantitative paired sales analysis. Key adjustments: condition (-15% = -$45,000), lot size (+5% = +$14,750), bathrooms (-$12,000). Reconciled value: $275,000.",
            score: 88
          },
          {
            type: "appraisal",
            title: "Accrued Depreciation Analysis",
            description: "Physical deterioration (curable: 4%, incurable: 6%) + functional obsolescence (8%, non-conforming layout) + external obsolescence (3%, proximity to commercial). Total: 21%.",
            score: 72
          },
          {
            type: "assessment",
            title: "Mass Appraisal Cyclical Review",
            description: "Property in assessment cycle year 3 of 3-year rotation. Assessed value: $310,000. Current coefficient of price-related bias (PRB): -0.032 suggests vertical inequity.",
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
      "Equitably Assessed",
      "Market Value Aligned",
      "Under-assessed",
      "Needs Reassessment",
      "Income Approach Candidate",
      "Single Family Residential",
      "Construction Quality 3",
      "Construction Quality 2",
      "Construction Quality 1",
      "Minimal Depreciation",
      "Substantial Depreciation",
      "Functional Obsolescence",
      "External Obsolescence",
      "Highest & Best Use Conforming",
      "Non-Conforming Use"
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
        title: "Cost Approach Valuation",
        description: "Marshall & Swift cost manual: Class 4, Good quality. RCN: $180/sqft × 1,800 sqft = $324,000. Less depreciation: 14.5% accrued (age-life method). Plus land: $95,000. Total: $430,000.",
        score: 88
      },
      {
        type: "comparable",
        title: "Sales Comparison Grid Analysis",
        description: "5 comparable sales analyzed with adjustments for time (+0.5%/month), location (±5-10%), GLA ($55/sf), quality/condition (±5-15%), and amenities. Range: $432,000-$458,000. Reconciled value: $442,500.",
        score: 92
      },
      {
        type: "mass-appraisal",
        title: "Automated Valuation Model",
        description: "Multiplicative model with location factor (1.12), time adjustment (1.085), and quality/condition index (0.97). Model diagnostics: R²: 0.86, COV: 7.2%. Indicated value: $438,000.",
        score: 90
      },
      {
        type: "appraisal",
        title: "Reconciliation & Final Value Opinion",
        description: "Weighted reconciliation: Sales comparison (60%, $442,500), Cost approach (25%, $430,000), Income approach ($435,000, 15%). Final market value opinion: $440,000.",
        score: 95
      },
      {
        type: "assessment",
        title: "Assessment Equity Study",
        description: "Current assessment: $415,000. Ratio to indicated market value: 0.94. Neighborhood statistical measures: COD: 10.2, PRD: 1.01, PRB: -0.012. All indicators within IAAO standards.",
        score: 88
      }
    ];
    
    return res.status(200).json(insights);
  } catch (error) {
    console.error('Error getting property insights:', error);
    return res.status(500).json({ error: 'Failed to get property insights' });
  }
}