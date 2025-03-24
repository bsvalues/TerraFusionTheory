/**
 * Neighborhood Sentiment Dashboard
 * 
 * This component displays a comprehensive view of sentiment analysis for multiple neighborhoods,
 * allowing users to compare and contrast public perception across different areas.
 */

import React, { useState, useEffect } from 'react';
import { Loader2, Search, MapPin, TrendingUp, Filter } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import NeighborhoodSentimentWidget from '@/components/sentiment/NeighborhoodSentimentWidget';
import neighborhoodSentimentService, { 
  SentimentLevel, 
  NeighborhoodSentiment 
} from '@/services/neighborhood-sentiment.service';

// Predefined neighborhood IDs for demo purposes
const NEIGHBORHOODS = [
  { id: 'grandview-downtown', name: 'Grandview Downtown', region: 'Grandview' },
  { id: 'grandview-north', name: 'Grandview North', region: 'Grandview' },
  { id: 'grandview-south', name: 'Grandview South', region: 'Grandview' },
  { id: 'yakima-west', name: 'Yakima West', region: 'Yakima County' },
  { id: 'sunnyside-central', name: 'Sunnyside Central', region: 'Sunnyside' }
];

// Simplified neighborhood summary type for list display
interface NeighborhoodSummary {
  id: string;
  name: string;
  region: string;
  sentiment: SentimentLevel;
  score: number;
  trendDirection: 'up' | 'down' | 'stable';
  topPositive: string[];
  topNegative: string[];
}

const NeighborhoodSentimentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodSummary[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<NeighborhoodSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');

  // Fetch neighborhood summaries on component mount
  useEffect(() => {
    const fetchNeighborhoodSummaries = async () => {
      setLoading(true);
      try {
        // This would be a dedicated API endpoint in a real application
        // For demo, we'll fetch each neighborhood's sentiment separately
        const summaries = await Promise.all(
          NEIGHBORHOODS.map(async (hood) => {
            const sentiment = await neighborhoodSentimentService.getNeighborhoodSentiment(hood.id);
            const topics = await neighborhoodSentimentService.getTopTopics(hood.id, 3);
            const trends = await neighborhoodSentimentService.getSentimentTrends(hood.id, 6);
            
            // Determine trend direction by comparing first and last month
            let trendDirection: 'up' | 'down' | 'stable' = 'stable';
            if (trends.length >= 2) {
              const firstScore = trends[0].score;
              const lastScore = trends[trends.length - 1].score;
              if (lastScore - firstScore > 0.05) trendDirection = 'up';
              else if (firstScore - lastScore > 0.05) trendDirection = 'down';
            }
            
            return {
              id: hood.id,
              name: hood.name,
              region: hood.region,
              sentiment: sentiment.overallSentiment,
              score: sentiment.overallScore,
              trendDirection,
              topPositive: topics.positive.slice(0, 2).map(t => t.topic),
              topNegative: topics.negative.slice(0, 2).map(t => t.topic)
            };
          })
        );
        
        setNeighborhoods(summaries);
        setFilteredNeighborhoods(summaries);
        
        // Set default selected neighborhood
        if (summaries.length > 0 && !selectedNeighborhood) {
          setSelectedNeighborhood(summaries[0].id);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching neighborhood summaries:', err);
        setError('Failed to load neighborhood sentiment data');
      } finally {
        setLoading(false);
      }
    };

    fetchNeighborhoodSummaries();
  }, []);

  // Apply filters whenever filter state changes
  useEffect(() => {
    let filtered = [...neighborhoods];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        hood => hood.name.toLowerCase().includes(query) || 
                hood.region.toLowerCase().includes(query)
      );
    }
    
    // Apply region filter
    if (regionFilter !== 'all') {
      filtered = filtered.filter(hood => hood.region === regionFilter);
    }
    
    // Apply sentiment filter
    if (sentimentFilter !== 'all') {
      switch (sentimentFilter) {
        case 'positive':
          filtered = filtered.filter(
            hood => hood.sentiment === SentimentLevel.POSITIVE || 
                   hood.sentiment === SentimentLevel.VERY_POSITIVE
          );
          break;
        case 'neutral':
          filtered = filtered.filter(hood => hood.sentiment === SentimentLevel.NEUTRAL);
          break;
        case 'negative':
          filtered = filtered.filter(
            hood => hood.sentiment === SentimentLevel.NEGATIVE || 
                   hood.sentiment === SentimentLevel.VERY_NEGATIVE
          );
          break;
      }
    }
    
    setFilteredNeighborhoods(filtered);
  }, [neighborhoods, searchQuery, regionFilter, sentimentFilter]);

  // Get unique regions for filter dropdown
  const uniqueRegions = Array.from(new Set(neighborhoods.map(hood => hood.region)));

  // Helper function to get sentiment badge color
  const getSentimentBadgeClass = (sentiment: SentimentLevel): string => {
    switch(sentiment) {
      case SentimentLevel.VERY_POSITIVE:
        return 'bg-green-500 text-white hover:bg-green-600';
      case SentimentLevel.POSITIVE:
        return 'bg-green-300 text-green-900 hover:bg-green-400';
      case SentimentLevel.NEUTRAL:
        return 'bg-gray-300 text-gray-900 hover:bg-gray-400';
      case SentimentLevel.NEGATIVE:
        return 'bg-red-300 text-red-900 hover:bg-red-400';
      case SentimentLevel.VERY_NEGATIVE:
        return 'bg-red-500 text-white hover:bg-red-600';
      default:
        return 'bg-gray-300 text-gray-900 hover:bg-gray-400';
    }
  };

  // Helper function to get sentiment text
  const getSentimentText = (sentiment: SentimentLevel): string => {
    switch(sentiment) {
      case SentimentLevel.VERY_POSITIVE:
        return 'Very Positive';
      case SentimentLevel.POSITIVE:
        return 'Positive';
      case SentimentLevel.NEUTRAL:
        return 'Neutral';
      case SentimentLevel.NEGATIVE:
        return 'Negative';
      case SentimentLevel.VERY_NEGATIVE:
        return 'Very Negative';
      default:
        return 'Neutral';
    }
  };

  // Helper function to get trend direction icon
  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    if (direction === 'up') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (direction === 'down') {
      return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />;
    }
    return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Neighborhood Sentiment Analysis</h2>
          <p className="text-muted-foreground">
            Analyze public perception of neighborhoods based on social media, news, and reviews.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select 
            value={regionFilter} 
            onValueChange={setRegionFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {uniqueRegions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={sentimentFilter} 
            onValueChange={setSentimentFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search neighborhoods..."
              className="pl-8 w-full sm:w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs 
        defaultValue="list" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list">Neighborhood List</TabsTrigger>
          <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading neighborhoods...</span>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-red-500">
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredNeighborhoods.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <p>No neighborhoods match your filters. Try adjusting your search criteria.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNeighborhoods.map((hood) => (
                <Card 
                  key={hood.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedNeighborhood === hood.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedNeighborhood(hood.id);
                    setActiveTab('details');
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{hood.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {hood.region}
                        </CardDescription>
                      </div>
                      <Badge className={getSentimentBadgeClass(hood.sentiment)}>
                        {getSentimentText(hood.sentiment)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <span className="mr-1">Trend:</span>
                          {getTrendIcon(hood.trendDirection)}
                        </span>
                        <span className="text-muted-foreground">
                          Score: {Math.round(((hood.score + 1) / 2) * 100)}%
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-green-600">TOP POSITIVE</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {hood.topPositive.map((topic, idx) => (
                              <Badge key={idx} variant="outline" className="bg-green-50">
                                {topic}
                              </Badge>
                            ))}
                            {hood.topPositive.length === 0 && (
                              <span className="text-xs text-muted-foreground">None found</span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-xs font-medium text-red-600">TOP CONCERNS</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {hood.topNegative.map((topic, idx) => (
                              <Badge key={idx} variant="outline" className="bg-red-50">
                                {topic}
                              </Badge>
                            ))}
                            {hood.topNegative.length === 0 && (
                              <span className="text-xs text-muted-foreground">None found</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="details" className="mt-4">
          {selectedNeighborhood ? (
            <NeighborhoodSentimentWidget 
              neighborhoodId={selectedNeighborhood} 
              showTrends={true}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <p>Select a neighborhood to view detailed sentiment analysis.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NeighborhoodSentimentDashboard;