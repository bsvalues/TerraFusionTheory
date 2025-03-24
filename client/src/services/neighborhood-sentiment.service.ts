/**
 * Neighborhood Sentiment Analysis Service
 * 
 * This service analyzes sentiment data from social media, news articles, and other sources
 * to provide insights about different neighborhoods.
 */

export enum SentimentLevel {
  VERY_NEGATIVE = 'very-negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very-positive'
}

export interface TopicSentiment {
  topic: string;
  sentiment: SentimentLevel;
  score: number; // -1 to 1 with -1 being very negative, 1 being very positive
  sources: number; // Number of sources that mentioned this topic
  trending: boolean; // Whether this topic is trending up in mentions
}

export interface NeighborhoodSentiment {
  id: string;
  name: string;
  overallSentiment: SentimentLevel;
  overallScore: number; // -1 to 1
  topicSentiments: TopicSentiment[];
  sources: {
    socialMedia: number;
    news: number;
    blogs: number;
    forums: number;
    reviews: number;
  };
  lastUpdated: string;
}

export interface SentimentTrend {
  period: string; // Month in format MMM YYYY
  score: number;
}

class NeighborhoodSentimentService {
  private static instance: NeighborhoodSentimentService;
  private apiUrl: string = '/api/neighborhoods/sentiment';

  private constructor() {}

  public static getInstance(): NeighborhoodSentimentService {
    if (!NeighborhoodSentimentService.instance) {
      NeighborhoodSentimentService.instance = new NeighborhoodSentimentService();
    }
    return NeighborhoodSentimentService.instance;
  }

  /**
   * Get sentiment analysis for a specific neighborhood
   */
  public async getNeighborhoodSentiment(neighborhoodId: string): Promise<NeighborhoodSentiment> {
    try {
      // In a production environment, this would be a real API call
      // For now, using a timeout to simulate network request
      // const response = await fetch(`${this.apiUrl}/${neighborhoodId}`);
      // if (!response.ok) throw new Error('Failed to fetch neighborhood sentiment');
      // return await response.json();

      // Simulate API response with generated data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.generateNeighborhoodSentiment(neighborhoodId));
        }, 800);
      });
    } catch (error) {
      console.error('Error fetching neighborhood sentiment:', error);
      throw error;
    }
  }

  /**
   * Get sentiment trends for a neighborhood over time
   */
  public async getSentimentTrends(neighborhoodId: string, months: number = 12): Promise<SentimentTrend[]> {
    try {
      // Simulate API response with generated data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.generateSentimentTrends(neighborhoodId, months));
        }, 600);
      });
    } catch (error) {
      console.error('Error fetching sentiment trends:', error);
      throw error;
    }
  }

  /**
   * Get top positive and negative topics for a neighborhood
   */
  public async getTopTopics(neighborhoodId: string, limit: number = 5): Promise<{
    positive: TopicSentiment[];
    negative: TopicSentiment[];
  }> {
    try {
      // Simulate API response
      return new Promise((resolve) => {
        setTimeout(() => {
          const allSentiments = this.generateNeighborhoodSentiment(neighborhoodId).topicSentiments;
          
          // Sort by score and get top positive and negative
          const positive = [...allSentiments]
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
            
          const negative = [...allSentiments]
            .filter(s => s.score < 0)
            .sort((a, b) => a.score - b.score)
            .slice(0, limit);
            
          resolve({ positive, negative });
        }, 500);
      });
    } catch (error) {
      console.error('Error fetching top topics:', error);
      throw error;
    }
  }

  /**
   * Generate sample neighborhood sentiment data
   */
  private generateNeighborhoodSentiment(neighborhoodId: string): NeighborhoodSentiment {
    // Define different sentiment profiles based on neighborhood ID
    const profiles: Record<string, {
      baseSentiment: number,
      topics: Array<{topic: string, baseSentiment: number, trending?: boolean}>
    }> = {
      'grandview-downtown': {
        baseSentiment: 0.65,
        topics: [
          { topic: 'Restaurants', baseSentiment: 0.8 },
          { topic: 'Nightlife', baseSentiment: 0.7, trending: true },
          { topic: 'Shopping', baseSentiment: 0.6 },
          { topic: 'Parking', baseSentiment: -0.4 },
          { topic: 'Traffic', baseSentiment: -0.5 },
          { topic: 'Public Transit', baseSentiment: 0.2 },
          { topic: 'Safety', baseSentiment: 0.3 },
          { topic: 'Cleanliness', baseSentiment: 0.1 },
          { topic: 'Cost of Living', baseSentiment: -0.2 },
          { topic: 'Community Events', baseSentiment: 0.75, trending: true }
        ]
      },
      'grandview-north': {
        baseSentiment: 0.7,
        topics: [
          { topic: 'Schools', baseSentiment: 0.9, trending: true },
          { topic: 'Parks', baseSentiment: 0.85 },
          { topic: 'Family Friendly', baseSentiment: 0.8 },
          { topic: 'Safety', baseSentiment: 0.7 },
          { topic: 'Community', baseSentiment: 0.75 },
          { topic: 'Property Values', baseSentiment: 0.6, trending: true },
          { topic: 'Traffic', baseSentiment: 0.2 },
          { topic: 'Shopping', baseSentiment: 0.3 },
          { topic: 'Restaurants', baseSentiment: 0.4 },
          { topic: 'Cost of Living', baseSentiment: -0.3 }
        ]
      },
      'grandview-south': {
        baseSentiment: 0.45,
        topics: [
          { topic: 'Affordability', baseSentiment: 0.7, trending: true },
          { topic: 'Up and Coming', baseSentiment: 0.6, trending: true },
          { topic: 'Investment Potential', baseSentiment: 0.65 },
          { topic: 'New Construction', baseSentiment: 0.5 },
          { topic: 'Safety', baseSentiment: -0.2 },
          { topic: 'Schools', baseSentiment: -0.1 },
          { topic: 'Shopping', baseSentiment: -0.3 },
          { topic: 'Restaurants', baseSentiment: 0.1 },
          { topic: 'Public Transit', baseSentiment: -0.4 },
          { topic: 'Community', baseSentiment: 0.3 }
        ]
      },
      'yakima-west': {
        baseSentiment: 0.55,
        topics: [
          { topic: 'Scenic Views', baseSentiment: 0.9 },
          { topic: 'Outdoor Activities', baseSentiment: 0.85, trending: true },
          { topic: 'Property Values', baseSentiment: 0.7 },
          { topic: 'Community', baseSentiment: 0.6 },
          { topic: 'Schools', baseSentiment: 0.5 },
          { topic: 'Restaurants', baseSentiment: 0.3 },
          { topic: 'Shopping', baseSentiment: 0.2 },
          { topic: 'Traffic', baseSentiment: -0.1 },
          { topic: 'Cost of Living', baseSentiment: -0.2 },
          { topic: 'Public Transit', baseSentiment: -0.5 }
        ]
      },
      'sunnyside-central': {
        baseSentiment: 0.4,
        topics: [
          { topic: 'Affordability', baseSentiment: 0.8 },
          { topic: 'Community Events', baseSentiment: 0.6, trending: true },
          { topic: 'Family Friendly', baseSentiment: 0.5 },
          { topic: 'Local Businesses', baseSentiment: 0.4 },
          { topic: 'Schools', baseSentiment: 0.3 },
          { topic: 'Safety', baseSentiment: -0.1 },
          { topic: 'Shopping', baseSentiment: -0.2 },
          { topic: 'Restaurants', baseSentiment: 0.0 },
          { topic: 'Property Values', baseSentiment: 0.3 },
          { topic: 'Public Transit', baseSentiment: -0.4 }
        ]
      }
    };
    
    // Default to grandview-downtown if ID not found
    const profile = profiles[neighborhoodId] || profiles['grandview-downtown'];
    
    // Calculate overall sentiment
    const overallScore = profile.baseSentiment + (Math.random() * 0.2 - 0.1); // Add some randomness
    
    // Determine sentiment level based on score
    let overallSentiment: SentimentLevel;
    if (overallScore >= 0.7) overallSentiment = SentimentLevel.VERY_POSITIVE;
    else if (overallScore >= 0.3) overallSentiment = SentimentLevel.POSITIVE;
    else if (overallScore >= -0.3) overallSentiment = SentimentLevel.NEUTRAL;
    else if (overallScore >= -0.7) overallSentiment = SentimentLevel.NEGATIVE;
    else overallSentiment = SentimentLevel.VERY_NEGATIVE;
    
    // Create topic sentiments
    const topicSentiments: TopicSentiment[] = profile.topics.map(topic => {
      // Add some randomness to the sentiment
      const score = Math.max(-1, Math.min(1, topic.baseSentiment + (Math.random() * 0.2 - 0.1)));
      
      // Determine sentiment level
      let sentiment: SentimentLevel;
      if (score >= 0.7) sentiment = SentimentLevel.VERY_POSITIVE;
      else if (score >= 0.3) sentiment = SentimentLevel.POSITIVE;
      else if (score >= -0.3) sentiment = SentimentLevel.NEUTRAL;
      else if (score >= -0.7) sentiment = SentimentLevel.NEGATIVE;
      else sentiment = SentimentLevel.VERY_NEGATIVE;
      
      return {
        topic: topic.topic,
        sentiment,
        score,
        sources: Math.floor(Math.random() * 30) + 10, // 10-40 sources
        trending: !!topic.trending
      };
    });
    
    // Create sources distribution
    const totalSources = topicSentiments.reduce((sum, topic) => sum + topic.sources, 0);
    const socialMediaPercent = 0.4 + (Math.random() * 0.2 - 0.1); // 30-50%
    const newsPercent = 0.2 + (Math.random() * 0.1 - 0.05); // 15-25%
    const blogsPercent = 0.15 + (Math.random() * 0.1 - 0.05); // 10-20%
    const forumsPercent = 0.1 + (Math.random() * 0.1 - 0.05); // 5-15%
    const reviewsPercent = 1 - socialMediaPercent - newsPercent - blogsPercent - forumsPercent;
    
    return {
      id: neighborhoodId,
      name: neighborhoodId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      overallSentiment,
      overallScore,
      topicSentiments,
      sources: {
        socialMedia: Math.round(totalSources * socialMediaPercent),
        news: Math.round(totalSources * newsPercent),
        blogs: Math.round(totalSources * blogsPercent),
        forums: Math.round(totalSources * forumsPercent),
        reviews: Math.round(totalSources * reviewsPercent)
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate sample sentiment trends data
   */
  private generateSentimentTrends(neighborhoodId: string, months: number): SentimentTrend[] {
    const trends: SentimentTrend[] = [];
    
    // Base trend parameters vary by neighborhood
    let baseSentiment: number;
    let trendDirection: number;
    
    switch(neighborhoodId) {
      case 'grandview-downtown':
        baseSentiment = 0.4;
        trendDirection = 0.02; // Improving over time
        break;
      case 'grandview-north':
        baseSentiment = 0.6;
        trendDirection = 0.01; // Slight improvement
        break;
      case 'grandview-south':
        baseSentiment = 0.3;
        trendDirection = 0.025; // Faster improvement (up and coming)
        break;
      case 'yakima-west':
        baseSentiment = 0.5;
        trendDirection = 0.005; // Very slight improvement
        break;
      case 'sunnyside-central':
        baseSentiment = 0.35;
        trendDirection = 0.015; // Moderate improvement
        break;
      default:
        baseSentiment = 0.5;
        trendDirection = 0.01;
    }
    
    // Generate monthly data points going back from current month
    for (let i = 0; i < months; i++) {
      // Create date object for the month (working backwards from current month)
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i - 1));
      const periodLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Calculate sentiment with trend and seasonal factors
      const trendFactor = baseSentiment + (trendDirection * i); // General trend direction
      const seasonalFactor = Math.sin((i % 12) / 12 * Math.PI * 2) * 0.05; // Seasonal variations
      const randomFactor = (Math.random() * 0.1) - 0.05; // Random noise
      
      // Combine factors and ensure within -1 to 1 range
      const score = Math.max(-1, Math.min(1, trendFactor + seasonalFactor + randomFactor));
      
      trends.push({
        period: periodLabel,
        score
      });
    }
    
    return trends;
  }
}

export const neighborhoodSentimentService = NeighborhoodSentimentService.getInstance();
export default neighborhoodSentimentService;