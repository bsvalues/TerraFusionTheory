/**
 * Neighborhood Sentiment Analysis Service
 * 
 * This service provides functions to analyze and retrieve sentiment data
 * for neighborhoods based on various data sources including property listings,
 * social media, news articles, and user reviews.
 */

import { apiRequest } from '@/lib/queryClient';

// Sentiment score types
export type SentimentLevel = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

// Sentiment topics that can be analyzed
export type SentimentTopic = 
  | 'safety' 
  | 'schools' 
  | 'amenities' 
  | 'affordability' 
  | 'community' 
  | 'transportation'
  | 'development'
  | 'market_trend'
  | 'lifestyle'
  | 'environment'
  | string; // Allow for custom topics

// Sentiment score (0-100)
export interface SentimentScore {
  score: number; // 0-100
  level: SentimentLevel;
  confidence: number; // 0-1
}

// Source of sentiment data
export type SentimentSource = 
  | 'property_listings'
  | 'social_media'
  | 'news'
  | 'reviews'
  | 'market_data'
  | 'agent_insights'
  | 'resident_surveys';

// Individual sentiment mention
export interface SentimentMention {
  id: string;
  text: string;
  score: number; // -1 to 1 where -1 is very negative, 1 is very positive
  source: SentimentSource;
  date: string;
  url?: string;
  author?: string;
  topics: SentimentTopic[];
}

// Neighborhood sentiment data
export interface NeighborhoodSentiment {
  neighborhoodId: string;
  neighborhoodName: string;
  city: string;
  state: string;
  overallScore: SentimentScore;
  topicScores: Record<SentimentTopic, SentimentScore>;
  trend: {
    direction: 'improving' | 'stable' | 'declining';
    changeRate: number; // percent change in the last period
  };
  mentions: SentimentMention[];
  lastUpdated: string;
  summaryText: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    boundaryPoints?: Array<[number, number]>; // Polygon boundary points
  };
}

// Query parameters for sentiment analysis
export interface SentimentQueryParams {
  neighborhoodName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  topics?: SentimentTopic[];
  sources?: SentimentSource[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// Mock neighborhoods for testing
const RICHLAND_NEIGHBORHOODS = [
  'Columbia Point',
  'Meadow Springs',
  'Horn Rapids', 
  'Badger Mountain South', 
  'Central Richland', 
  'North Richland',
  'South Richland'
];

const GRANDVIEW_NEIGHBORHOODS = [
  'Downtown Grandview',
  'Grandview Heights',
  'East Grandview',
  'West Valley',
  'Mountainview'
];

// Sentiment analysis service
class NeighborhoodSentimentService {

  /**
   * Get sentiment data for a specific neighborhood
   */
  async getNeighborhoodSentiment(params: SentimentQueryParams): Promise<NeighborhoodSentiment> {
    try {
      // In a real application, this would make an API call to get sentiment data
      // For demo purposes, we'll generate realistic mock data
      
      // Use the neighborhood name from params or choose a random one
      const neighborhoodName = params.neighborhoodName || this.getRandomNeighborhood(params.city);
      const city = params.city || (neighborhoodName.includes('Richland') ? 'Richland' : 'Grandview');
      const state = params.state || 'WA';
      
      // For demo purposes, use hard-coded data for specific neighborhoods in Richland
      if (neighborhoodName === 'Columbia Point' && city === 'Richland') {
        return this.getColumbiaPointSentiment();
      } else if (neighborhoodName === 'Meadow Springs' && city === 'Richland') {
        return this.getMeadowSpringsSentiment();
      }
      
      // For others, generate data
      return this.generateSentimentData(neighborhoodName, city, state);
    } catch (error) {
      console.error('Error fetching neighborhood sentiment data:', error);
      throw error;
    }
  }
  
  /**
   * Get sentiments for multiple neighborhoods in a city
   */
  async getCitySentiments(city: string, state: string = 'WA'): Promise<NeighborhoodSentiment[]> {
    try {
      const neighborhoods = this.getNeighborhoodsForCity(city);
      
      // Get sentiment data for each neighborhood
      const sentiments = await Promise.all(
        neighborhoods.map(neighborhood => this.getNeighborhoodSentiment({
          neighborhoodName: neighborhood,
          city,
          state
        }))
      );
      
      return sentiments;
    } catch (error) {
      console.error('Error fetching city sentiment data:', error);
      throw error;
    }
  }

  /**
   * Compare sentiment between two neighborhoods
   */
  async compareSentiment(
    neighborhood1: string, 
    neighborhood2: string, 
    city: string,
    topics?: SentimentTopic[]
  ): Promise<{
    neighborhood1: NeighborhoodSentiment,
    neighborhood2: NeighborhoodSentiment,
    comparison: Record<SentimentTopic, {
      difference: number,
      winner: string
    }>
  }> {
    try {
      const sentiment1 = await this.getNeighborhoodSentiment({
        neighborhoodName: neighborhood1,
        city,
        topics
      });
      
      const sentiment2 = await this.getNeighborhoodSentiment({
        neighborhoodName: neighborhood2,
        city,
        topics
      });
      
      // Compare scores for each topic
      const comparison: Record<SentimentTopic, {
        difference: number,
        winner: string
      }> = {} as any;
      
      const allTopics = topics || Object.keys(sentiment1.topicScores) as SentimentTopic[];
      
      allTopics.forEach(topic => {
        const score1 = sentiment1.topicScores[topic]?.score || 0;
        const score2 = sentiment2.topicScores[topic]?.score || 0;
        const difference = score1 - score2;
        const winner = difference > 0 ? neighborhood1 : difference < 0 ? neighborhood2 : 'tie';
        
        comparison[topic] = {
          difference: Math.abs(difference),
          winner
        };
      });
      
      return {
        neighborhood1: sentiment1,
        neighborhood2: sentiment2,
        comparison
      };
    } catch (error) {
      console.error('Error comparing neighborhood sentiment:', error);
      throw error;
    }
  }
  
  /**
   * Get neighborhoods for a given city
   */
  getNeighborhoodsForCity(city: string): string[] {
    if (city.toLowerCase().includes('richland')) {
      return RICHLAND_NEIGHBORHOODS;
    } else if (city.toLowerCase().includes('grandview')) {
      return GRANDVIEW_NEIGHBORHOODS;
    } else {
      // Default to richland
      return RICHLAND_NEIGHBORHOODS;
    }
  }
  
  /**
   * Get a random neighborhood for a city
   */
  private getRandomNeighborhood(city?: string): string {
    const neighborhoods = this.getNeighborhoodsForCity(city || 'Richland');
    const index = Math.floor(Math.random() * neighborhoods.length);
    return neighborhoods[index];
  }
  
  /**
   * Generate sentiment level based on score
   */
  private getSentimentLevel(score: number): SentimentLevel {
    if (score >= 80) return 'very_positive';
    if (score >= 60) return 'positive';
    if (score >= 40) return 'neutral';
    if (score >= 20) return 'negative';
    return 'very_negative';
  }
  
  /**
   * Generate realistic mock sentiment data for a neighborhood
   */
  /**
   * Get geolocation for a neighborhood based on city
   */
  private getNeighborhoodGeolocation(neighborhood: string, city: string): { latitude: number; longitude: number } {
    // Base coordinates for Richland and Grandview
    const cityCoordinates: Record<string, { base: { lat: number; lng: number }; radius: number }> = {
      'Richland': { base: { lat: 46.2804, lng: -119.2752 }, radius: 0.05 },
      'Grandview': { base: { lat: 46.2562, lng: -119.9010 }, radius: 0.04 }
    };
    
    // Specific coordinates for known neighborhoods
    const knownLocations: Record<string, { lat: number; lng: number }> = {
      'Columbia Point': { lat: 46.2603, lng: -119.2583 },
      'Meadow Springs': { lat: 46.2713, lng: -119.3037 },
      'Horn Rapids': { lat: 46.3398, lng: -119.3184 },
      'Badger Mountain South': { lat: 46.2276, lng: -119.2913 },
      'Central Richland': { lat: 46.2832, lng: -119.2852 },
      'North Richland': { lat: 46.3403, lng: -119.2796 },
      'South Richland': { lat: 46.2505, lng: -119.2970 },
      'Downtown Grandview': { lat: 46.2513, lng: -119.9012 },
      'Grandview Heights': { lat: 46.2603, lng: -119.9089 },
      'East Grandview': { lat: 46.2532, lng: -119.8872 },
      'West Valley': { lat: 46.2495, lng: -119.9183 },
      'Mountainview': { lat: 46.2674, lng: -119.9057 }
    };
    
    // If we have specific coordinates for this neighborhood, use them
    if (knownLocations[neighborhood]) {
      return {
        latitude: knownLocations[neighborhood].lat,
        longitude: knownLocations[neighborhood].lng
      };
    }
    
    // Otherwise, generate pseudo-random coordinates based on the city
    const defaultCity = 'Richland';
    const cityKey = Object.keys(cityCoordinates).includes(city) ? city : defaultCity;
    const cityInfo = cityCoordinates[cityKey];
    
    const angle = this.getHashedAngle(neighborhood);
    const distance = cityInfo.radius * Math.random() * 0.8;
    
    const lat = cityInfo.base.lat + distance * Math.cos(angle);
    const lng = cityInfo.base.lng + distance * Math.sin(angle);
    
    return {
      latitude: lat,
      longitude: lng
    };
  }
  
  /**
   * Generate a consistent angle based on neighborhood name (for reproducible coordinates)
   */
  private getHashedAngle(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return (Math.abs(hash) % 360) * Math.PI / 180;
  }
  
  /**
   * Generate realistic mock sentiment data for a neighborhood
   */
  private generateSentimentData(
    neighborhood: string, 
    city: string, 
    state: string
  ): NeighborhoodSentiment {
    // Generate a base score that is somewhat random but tends to be positive
    const baseScore = Math.floor(Math.random() * 30) + 50; // 50-80 range
    
    // Pre-defined topic scores for realistic distributions
    const topicScores: Record<SentimentTopic, SentimentScore> = {
      safety: this.generateTopicScore(baseScore + (Math.random() * 10 - 5)),
      schools: this.generateTopicScore(baseScore + (Math.random() * 15 - 5)),
      amenities: this.generateTopicScore(baseScore + (Math.random() * 10)),
      affordability: this.generateTopicScore(baseScore - (Math.random() * 20)), // Affordability tends to be lower
      community: this.generateTopicScore(baseScore + (Math.random() * 15 - 5)),
      transportation: this.generateTopicScore(baseScore - (Math.random() * 10)),
      development: this.generateTopicScore(baseScore + (Math.random() * 20 - 10)),
      market_trend: this.generateTopicScore(baseScore + (Math.random() * 15)),
      lifestyle: this.generateTopicScore(baseScore + (Math.random() * 10)),
      environment: this.generateTopicScore(baseScore + (Math.random() * 10 - 5))
    };
    
    // Calculate overall score as weighted average of topic scores
    const overallScore = Object.values(topicScores).reduce(
      (sum, score) => sum + score.score, 
      0
    ) / Object.keys(topicScores).length;
    
    // Generate mock mentions
    const mentions = this.generateSentimentMentions(
      neighborhood, 
      city, 
      Object.keys(topicScores) as SentimentTopic[]
    );
    
    // Get geolocation for this neighborhood
    const geolocation = this.getNeighborhoodGeolocation(neighborhood, city);
    
    return {
      neighborhoodId: this.generateId(neighborhood),
      neighborhoodName: neighborhood,
      city,
      state,
      overallScore: {
        score: Math.round(overallScore),
        level: this.getSentimentLevel(overallScore),
        confidence: 0.85 + (Math.random() * 0.1) // High confidence for demo
      },
      topicScores,
      trend: {
        direction: Math.random() > 0.3 ? 'improving' : Math.random() > 0.5 ? 'stable' : 'declining',
        changeRate: Math.round(Math.random() * 10) // 0-10% change
      },
      mentions,
      lastUpdated: new Date().toISOString(),
      summaryText: this.generateSummaryText(neighborhood, city, topicScores, overallScore),
      // Add geolocation data
      geolocation
    };
  }
  
  /**
   * Generate a topic score based on a base value
   */
  private generateTopicScore(baseValue: number): SentimentScore {
    // Ensure score is within 0-100 range
    const score = Math.max(0, Math.min(100, Math.round(baseValue)));
    
    return {
      score,
      level: this.getSentimentLevel(score),
      confidence: 0.7 + (Math.random() * 0.2) // 0.7-0.9 confidence
    };
  }
  
  /**
   * Generate mock sentiment mentions
   */
  private generateSentimentMentions(
    neighborhood: string, 
    city: string,
    topics: SentimentTopic[]
  ): SentimentMention[] {
    const mentions: SentimentMention[] = [];
    const count = Math.floor(Math.random() * 8) + 3; // 3-10 mentions
    
    const sources: SentimentSource[] = [
      'property_listings', 'social_media', 'news', 'reviews', 
      'market_data', 'agent_insights', 'resident_surveys'
    ];
    
    const positiveTexts = [
      `${neighborhood} is a fantastic place to live with great community feel.`,
      `Love the parks and walking trails in ${neighborhood}.`,
      `Schools in ${neighborhood} are highly rated and family-friendly.`,
      `${neighborhood} has seen significant property value increases in the last year.`,
      `The new shopping center in ${neighborhood} has been a great addition to the area.`,
      `${neighborhood} has a very low crime rate compared to other areas.`,
      `There's a great sense of community in ${neighborhood}.`
    ];
    
    const neutralTexts = [
      `${neighborhood} is a typical suburban area with the usual amenities.`,
      `Traffic can be busy during rush hour in ${neighborhood}.`,
      `Property taxes in ${neighborhood} are comparable to other areas in ${city}.`,
      `The housing market in ${neighborhood} has remained stable.`,
      `${neighborhood} has a mix of older and newer homes.`
    ];
    
    const negativeTexts = [
      `Housing prices in ${neighborhood} may be too high for first-time homebuyers.`,
      `Public transportation options in ${neighborhood} are limited.`,
      `Some residents have concerns about the pace of development in ${neighborhood}.`,
      `${neighborhood} could use more restaurant and entertainment options.`,
      `Traffic congestion during peak hours can be an issue in ${neighborhood}.`
    ];
    
    for (let i = 0; i < count; i++) {
      // Determine sentiment direction with a bias toward positive
      const sentiment = Math.random() > 0.6 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative';
      
      // Select text based on sentiment
      let text = '';
      if (sentiment === 'positive') {
        text = positiveTexts[Math.floor(Math.random() * positiveTexts.length)];
      } else if (sentiment === 'neutral') {
        text = neutralTexts[Math.floor(Math.random() * neutralTexts.length)];
      } else {
        text = negativeTexts[Math.floor(Math.random() * negativeTexts.length)];
      }
      
      // Generate score based on sentiment
      let score = 0;
      if (sentiment === 'positive') {
        score = 0.5 + (Math.random() * 0.5); // 0.5 to 1.0
      } else if (sentiment === 'neutral') {
        score = -0.2 + (Math.random() * 0.4); // -0.2 to 0.2
      } else {
        score = -1.0 + (Math.random() * 0.5); // -1.0 to -0.5
      }
      
      // Select 1-3 topics for this mention
      const mentionTopics: SentimentTopic[] = [];
      const topicCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < topicCount; j++) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        if (!mentionTopics.includes(topic)) {
          mentionTopics.push(topic);
        }
      }
      
      // Select a source
      const source = sources[Math.floor(Math.random() * sources.length)];
      
      // Generate date within last 6 months
      const date = new Date();
      date.setMonth(date.getMonth() - Math.floor(Math.random() * 6));
      
      mentions.push({
        id: `mention-${this.generateId(neighborhood)}-${i}`,
        text,
        score,
        source,
        date: date.toISOString(),
        topics: mentionTopics,
        author: source === 'resident_surveys' || source === 'reviews' ? this.generateAuthorName() : undefined
      });
    }
    
    return mentions;
  }
  
  /**
   * Generate a summary text based on sentiment data
   */
  private generateSummaryText(
    neighborhood: string, 
    city: string,
    topicScores: Record<SentimentTopic, SentimentScore>,
    overallScore: number
  ): string {
    // Get top 3 highest scoring topics
    const sortedTopics = Object.entries(topicScores)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([topic]) => topic);
    
    const topTopics = sortedTopics.slice(0, 3);
    
    // Get lowest scoring topic
    const lowestTopic = Object.entries(topicScores)
      .sort((a, b) => a[1].score - b[1].score)[0][0];
    
    let summary = `${neighborhood} in ${city}, WA `;
    
    if (overallScore >= 75) {
      summary += `is a highly regarded area with exceptionally positive sentiment. `;
    } else if (overallScore >= 60) {
      summary += `is generally well-regarded by residents and prospective homebuyers. `;
    } else if (overallScore >= 45) {
      summary += `receives mixed reviews with some positive aspects. `;
    } else {
      summary += `faces some challenges according to sentiment analysis. `;
    }
    
    summary += `The neighborhood scores particularly well for ${this.formatTopicName(topTopics[0] as SentimentTopic)}, ${this.formatTopicName(topTopics[1] as SentimentTopic)}, and ${this.formatTopicName(topTopics[2] as SentimentTopic)}. `;
    
    summary += `However, ${this.formatTopicName(lowestTopic as SentimentTopic)} appears to be an area with room for improvement. `;
    
    return summary;
  }
  
  /**
   * Format a topic name for display
   */
  private formatTopicName(topic: SentimentTopic): string {
    switch (topic) {
      case 'safety': return 'safety';
      case 'schools': return 'schools';
      case 'amenities': return 'local amenities';
      case 'affordability': return 'affordability';
      case 'community': return 'community feel';
      case 'transportation': return 'transportation';
      case 'development': return 'development';
      case 'market_trend': return 'market trends';
      case 'lifestyle': return 'lifestyle options';
      case 'environment': return 'environmental quality';
      default: {
        // For any other topics, convert underscores to spaces
        const topicStr = String(topic);
        return topicStr.includes('_') ? topicStr.split('_').join(' ') : topicStr;
      }
    }
  }
  
  /**
   * Generate a random author name for mentions
   */
  private generateAuthorName(): string {
    const firstNames = ['John', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'Robert', 'Jennifer'];
    const lastInitials = ['S.', 'T.', 'M.', 'R.', 'L.', 'C.', 'W.', 'B.'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastInitial = lastInitials[Math.floor(Math.random() * lastInitials.length)];
    
    return `${firstName} ${lastInitial}`;
  }
  
  /**
   * Generate a deterministic ID from a string
   */
  private generateId(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Get pre-defined sentiment data for Columbia Point neighborhood
   */
  private getColumbiaPointSentiment(): NeighborhoodSentiment {
    return {
      neighborhoodId: "columbiapoint",
      neighborhoodName: "Columbia Point",
      city: "Richland",
      state: "WA",
      overallScore: {
        score: 85,
        level: "very_positive",
        confidence: 0.9
      },
      topicScores: {
        safety: { score: 88, level: "very_positive", confidence: 0.92 },
        schools: { score: 82, level: "very_positive", confidence: 0.89 },
        amenities: { score: 90, level: "very_positive", confidence: 0.94 },
        affordability: { score: 68, level: "positive", confidence: 0.87 },
        community: { score: 85, level: "very_positive", confidence: 0.9 },
        transportation: { score: 75, level: "positive", confidence: 0.85 },
        development: { score: 87, level: "very_positive", confidence: 0.88 },
        market_trend: { score: 92, level: "very_positive", confidence: 0.93 },
        lifestyle: { score: 89, level: "very_positive", confidence: 0.91 },
        environment: { score: 92, level: "very_positive", confidence: 0.94 }
      },
      trend: {
        direction: "improving",
        changeRate: 5
      },
      mentions: [
        {
          id: "cp-1",
          text: "Columbia Point is one of the premier neighborhoods in Richland with excellent access to the Columbia River and golf course.",
          score: 0.92,
          source: "agent_insights",
          date: "2025-02-18T00:00:00.000Z",
          topics: ["amenities", "lifestyle", "environment"]
        },
        {
          id: "cp-2",
          text: "The Columbia Point area has seen consistent property value increases over the past year, significantly outperforming other Richland neighborhoods.",
          score: 0.85,
          source: "market_data",
          date: "2025-03-10T00:00:00.000Z",
          topics: ["market_trend", "development"]
        },
        {
          id: "cp-3",
          text: "While Columbia Point offers luxury living and amazing river views, the higher price point can be a barrier for many buyers.",
          score: -0.2,
          source: "reviews",
          date: "2025-01-25T00:00:00.000Z",
          topics: ["affordability"],
          author: "Sarah T."
        },
        {
          id: "cp-4",
          text: "The walking trails along the river at Columbia Point provide residents with exceptional outdoor recreation opportunities right from their doorstep.",
          score: 0.9,
          source: "resident_surveys",
          date: "2025-02-28T00:00:00.000Z",
          topics: ["lifestyle", "environment", "amenities"],
          author: "David M."
        },
        {
          id: "cp-5",
          text: "Columbia Point is an extremely safe neighborhood with well-lit streets and an active community watch program.",
          score: 0.88,
          source: "resident_surveys",
          date: "2025-03-15T00:00:00.000Z",
          topics: ["safety", "community"],
          author: "Jennifer W."
        }
      ],
      lastUpdated: "2025-03-24T00:00:00.000Z",
      summaryText: "Columbia Point in Richland, WA is a highly sought-after neighborhood known for its upscale properties, exceptional river views, and access to premium amenities including a golf course and marina. The area receives very positive sentiment across most metrics, particularly for its natural environment, lifestyle options, and strong market trends. While affordability remains a challenge due to premium pricing, the neighborhood continues to see property value appreciation and development interest.",
      geolocation: {
        latitude: 46.2603,
        longitude: -119.2583
      }
    };
  }
  
  /**
   * Get pre-defined sentiment data for Meadow Springs neighborhood
   */
  private getMeadowSpringsSentiment(): NeighborhoodSentiment {
    return {
      neighborhoodId: "meadowsprings",
      neighborhoodName: "Meadow Springs",
      city: "Richland",
      state: "WA",
      overallScore: {
        score: 82,
        level: "very_positive",
        confidence: 0.88
      },
      topicScores: {
        safety: { score: 86, level: "very_positive", confidence: 0.9 },
        schools: { score: 84, level: "very_positive", confidence: 0.89 },
        amenities: { score: 88, level: "very_positive", confidence: 0.91 },
        affordability: { score: 72, level: "positive", confidence: 0.85 },
        community: { score: 83, level: "very_positive", confidence: 0.88 },
        transportation: { score: 77, level: "positive", confidence: 0.84 },
        development: { score: 81, level: "very_positive", confidence: 0.87 },
        market_trend: { score: 85, level: "very_positive", confidence: 0.89 },
        lifestyle: { score: 86, level: "very_positive", confidence: 0.9 },
        environment: { score: 84, level: "very_positive", confidence: 0.88 }
      },
      trend: {
        direction: "improving",
        changeRate: 4
      },
      mentions: [
        {
          id: "ms-1",
          text: "Meadow Springs is known for its beautiful golf course community and well-maintained properties.",
          score: 0.88,
          source: "agent_insights",
          date: "2025-02-20T00:00:00.000Z",
          topics: ["environment", "lifestyle"]
        },
        {
          id: "ms-2",
          text: "The Country Club and golf course in Meadow Springs provide excellent recreational opportunities for residents.",
          score: 0.85,
          source: "reviews",
          date: "2025-03-05T00:00:00.000Z",
          topics: ["amenities", "lifestyle"],
          author: "Robert C."
        },
        {
          id: "ms-3",
          text: "Home prices in Meadow Springs are higher than some other Richland neighborhoods, but still offer good value considering the amenities.",
          score: 0.1,
          source: "market_data",
          date: "2025-02-10T00:00:00.000Z",
          topics: ["affordability", "market_trend"]
        },
        {
          id: "ms-4",
          text: "Families love Meadow Springs for its excellent schools and safe, family-friendly environment.",
          score: 0.9,
          source: "resident_surveys",
          date: "2025-03-12T00:00:00.000Z",
          topics: ["schools", "safety", "community"],
          author: "Emma L."
        },
        {
          id: "ms-5",
          text: "New development in Meadow Springs has been tastefully integrated with the existing community character.",
          score: 0.82,
          source: "news",
          date: "2025-01-15T00:00:00.000Z",
          topics: ["development", "community"]
        }
      ],
      lastUpdated: "2025-03-24T00:00:00.000Z",
      summaryText: "Meadow Springs in Richland, WA is a well-established neighborhood centered around a beautiful country club and golf course. It receives very positive sentiment for its excellent amenities, strong sense of community, and family-friendly environment. The neighborhood's schools are highly rated, and safety is considered excellent. While prices are somewhat higher than the city average, residents find good value in the lifestyle offerings and consistent property appreciation.",
      geolocation: {
        latitude: 46.2713,
        longitude: -119.3037
      }
    };
  }
}

export default new NeighborhoodSentimentService();