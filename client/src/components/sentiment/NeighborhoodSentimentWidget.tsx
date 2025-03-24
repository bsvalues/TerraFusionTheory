/**
 * NeighborhoodSentimentWidget Component
 * 
 * This component displays sentiment analysis for a neighborhood,
 * showing scores across different topics, trends, and relevant mentions.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Check, BarChart3, MessageSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import neighborhoodSentimentService, { 
  NeighborhoodSentiment, 
  SentimentTopic, 
  SentimentMention,
  SentimentLevel
} from '@/services/neighborhood-sentiment.service';

// Widget configuration
interface NeighborhoodSentimentWidgetProps {
  neighborhoodName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  className?: string;
  compact?: boolean;
}

// Component implementation
const NeighborhoodSentimentWidget: React.FC<NeighborhoodSentimentWidgetProps> = ({
  neighborhoodName,
  city = 'Richland',
  state = 'WA',
  zipCode,
  className,
  compact = false
}) => {
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [sentiment, setSentiment] = useState<NeighborhoodSentiment | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'topics' | 'mentions'>('overview');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | undefined>(neighborhoodName);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Initialize and load data
  useEffect(() => {
    loadNeighborhoods();
  }, [city]);

  useEffect(() => {
    if (selectedNeighborhood || neighborhoodName) {
      loadSentimentData();
    }
  }, [selectedNeighborhood, neighborhoodName, city, state, zipCode]);

  // Load available neighborhoods for the city
  const loadNeighborhoods = async () => {
    try {
      const neighborhoods = neighborhoodSentimentService.getNeighborhoodsForCity(city);
      setAvailableNeighborhoods(neighborhoods);
      
      // If no neighborhood is selected, use the first one
      if (!selectedNeighborhood && !neighborhoodName && neighborhoods.length > 0) {
        setSelectedNeighborhood(neighborhoods[0]);
      }
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
      setError('Unable to load neighborhoods');
    }
  };

  // Load sentiment data for selected neighborhood
  const loadSentimentData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await neighborhoodSentimentService.getNeighborhoodSentiment({
        neighborhoodName: selectedNeighborhood || neighborhoodName,
        city,
        state,
        zipCode
      });
      
      setSentiment(data);
    } catch (error) {
      console.error('Error loading sentiment data:', error);
      setError('Unable to load sentiment data');
      toast({
        title: 'Error',
        description: 'Failed to load neighborhood sentiment data.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle neighborhood change
  const handleNeighborhoodChange = (value: string) => {
    setSelectedNeighborhood(value);
  };

  // Get color for sentiment level
  const getSentimentColor = (level: SentimentLevel): string => {
    switch (level) {
      case 'very_positive': return 'bg-green-500';
      case 'positive': return 'bg-green-400';
      case 'neutral': return 'bg-yellow-400';
      case 'negative': return 'bg-orange-500';
      case 'very_negative': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  // Get color for sentiment score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  // Get trend icon and color
  const getTrendIndicator = () => {
    if (!sentiment) return null;
    
    const { direction, changeRate } = sentiment.trend;
    
    if (direction === 'improving') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
          <TrendingUp className="h-3 w-3" />
          <span>Improving {changeRate}%</span>
        </Badge>
      );
    } else if (direction === 'declining') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
          <TrendingDown className="h-3 w-3" />
          <span>Declining {changeRate}%</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
          <Minus className="h-3 w-3" />
          <span>Stable</span>
        </Badge>
      );
    }
  };

  // Format topic name for display
  const formatTopicName = (topic: SentimentTopic): string => {
    return topic
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-36 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <CardTitle>Neighborhood Sentiment</CardTitle>
          <CardDescription>Analysis not available</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <AlertTriangle className="h-12 w-12 text-orange-500 mb-3" />
          <p className="text-center text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={loadSentimentData}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render compact view (primarily for dashboard use)
  if (compact && sentiment) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{sentiment.neighborhoodName}</CardTitle>
              <CardDescription>{sentiment.city}, {sentiment.state}</CardDescription>
            </div>
            <div className="flex items-center gap-1 text-2xl font-bold">
              <span className={getScoreColor(sentiment.overallScore.score)}>
                {sentiment.overallScore.score}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Sentiment</span>
            {getTrendIndicator()}
          </div>
          
          <Progress 
            value={sentiment.overallScore.score} 
            className={cn("h-2", getSentimentColor(sentiment.overallScore.level))}
          />
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            {Object.entries(sentiment.topicScores)
              .sort(([, a], [, b]) => b.score - a.score)
              .slice(0, 4)
              .map(([topic, score]) => (
                <div key={topic} className="text-sm">
                  <div className="flex justify-between items-center">
                    <span>{formatTopicName(topic as SentimentTopic)}</span>
                    <span className={cn("font-medium", getScoreColor(score.score))}>
                      {score.score}
                    </span>
                  </div>
                  <Progress 
                    value={score.score} 
                    className={cn("h-1 mt-1", getSentimentColor(score.level))}
                  />
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render standard (full) view
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Neighborhood Sentiment Analysis</CardTitle>
            <CardDescription>
              Real-time sentiment analysis from multiple data sources
            </CardDescription>
          </div>
          
          <Select 
            value={selectedNeighborhood}
            onValueChange={handleNeighborhoodChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select neighborhood" />
            </SelectTrigger>
            <SelectContent>
              {availableNeighborhoods.map((neighborhood) => (
                <SelectItem key={neighborhood} value={neighborhood}>
                  {neighborhood}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      {sentiment && (
        <>
          <CardContent className="pt-0 pb-3">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold">{sentiment.neighborhoodName}</h3>
                <p className="text-muted-foreground">{sentiment.city}, {sentiment.state}</p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold">
                  <span className={getScoreColor(sentiment.overallScore.score)}>
                    {sentiment.overallScore.score}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <div className="flex justify-center mt-1">
                  {getTrendIndicator()}
                </div>
              </div>
            </div>
            
            <Tabs 
              value={selectedTab} 
              onValueChange={(value) => setSelectedTab(value as any)}
              className="mt-2"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger value="mentions">Mentions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4 pb-2">
                <div className="space-y-4">
                  <p className="text-sm">
                    {sentiment.summaryText}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Highest Rated</h4>
                      <div className="space-y-2">
                        {Object.entries(sentiment.topicScores)
                          .sort(([, a], [, b]) => b.score - a.score)
                          .slice(0, 3)
                          .map(([topic, score]) => (
                            <div key={topic} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{formatTopicName(topic as SentimentTopic)}</span>
                              <span className={cn("text-sm font-medium ml-auto", getScoreColor(score.score))}>
                                {score.score}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Areas for Improvement</h4>
                      <div className="space-y-2">
                        {Object.entries(sentiment.topicScores)
                          .sort(([, a], [, b]) => a.score - b.score)
                          .slice(0, 3)
                          .map(([topic, score]) => (
                            <div key={topic} className="flex items-center gap-2">
                              <AlertTriangle className={cn(
                                "h-4 w-4", 
                                score.score < 40 ? "text-red-500" : 
                                score.score < 60 ? "text-orange-500" : 
                                "text-yellow-500"
                              )} />
                              <span className="text-sm">{formatTopicName(topic as SentimentTopic)}</span>
                              <span className={cn("text-sm font-medium ml-auto", getScoreColor(score.score))}>
                                {score.score}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Recent Highlights</h4>
                    <div className="space-y-3">
                      {sentiment.mentions
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 2)
                        .map((mention) => (
                          <div key={mention.id} className="text-sm bg-muted/40 p-3 rounded-md">
                            <div className="flex gap-2 mb-1">
                              <span className={cn(
                                "w-2 h-2 mt-1 rounded-full",
                                mention.score > 0.3 ? "bg-green-500" : 
                                mention.score > -0.3 ? "bg-yellow-500" : 
                                "bg-red-500"
                              )} />
                              <p>{mention.text}</p>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                              <span>{mention.source.replace('_', ' ')}</span>
                              <span>{new Date(mention.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="topics" className="pt-4 pb-2">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(sentiment.topicScores).map(([topic, score]) => (
                      <div key={topic} className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">{formatTopicName(topic as SentimentTopic)}</h4>
                          <span className={cn("font-bold", getScoreColor(score.score))}>
                            {score.score}
                          </span>
                        </div>
                        
                        <Progress 
                          value={score.score} 
                          className={cn("h-2", getSentimentColor(score.level))}
                        />
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {score.level.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            confidence: {Math.round(score.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="mentions" className="pt-4 pb-2">
                <div className="space-y-4">
                  {sentiment.mentions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((mention) => (
                      <MentionItem key={mention.id} mention={mention} />
                    ))
                  }
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="pt-0 text-xs text-muted-foreground border-t px-6 py-3">
            Last updated: {new Date(sentiment.lastUpdated).toLocaleString()}
            <Button variant="ghost" size="sm" className="h-6 gap-1 ml-auto" onClick={loadSentimentData}>
              <span>Refresh</span>
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

// Mention item component
const MentionItem: React.FC<{ mention: SentimentMention }> = ({ mention }) => {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'property_listings': return <Search className="h-3 w-3" />;
      case 'social_media': return <MessageSquare className="h-3 w-3" />;
      case 'market_data': return <BarChart3 className="h-3 w-3" />;
      default: return null;
    }
  };
  
  const getSentimentColor = (score: number): string => {
    if (score > 0.3) return 'bg-green-100 text-green-800 border-green-300';
    if (score > -0.3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };
  
  return (
    <div className="border rounded-md p-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 border">
          <AvatarFallback className="bg-primary/10 text-xs">
            {mention.source.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-1">
          <p className="text-sm">{mention.text}</p>
          
          <div className="flex flex-wrap gap-1 mt-1">
            {mention.topics.map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs py-0">
                {topic.replace('_', ' ')}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="capitalize">{mention.source.replace('_', ' ')}</span>
              {mention.author && <span>by {mention.author}</span>}
            </div>
            <span>{new Date(mention.date).toLocaleDateString()}</span>
          </div>
        </div>
        
        <Badge className={cn("ml-2", getSentimentColor(mention.score))}>
          {mention.score > 0 ? '+' : ''}{mention.score.toFixed(1)}
        </Badge>
      </div>
    </div>
  );
};

export default NeighborhoodSentimentWidget;