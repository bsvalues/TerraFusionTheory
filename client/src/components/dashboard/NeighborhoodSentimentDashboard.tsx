/**
 * Neighborhood Sentiment Dashboard Widget
 * 
 * A dashboard component that displays sentiment analysis for neighborhoods
 * in a compact, interactive format suitable for dashboard integration.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpRight, Info, PieChart, Map, TrendingUp, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

import NeighborhoodSentimentWidget from '@/components/sentiment/NeighborhoodSentimentWidget';
import neighborhoodSentimentService, { 
  NeighborhoodSentiment,
  SentimentTopic,
  SentimentLevel 
} from '@/services/neighborhood-sentiment.service';

// Component props
interface NeighborhoodSentimentDashboardProps {
  defaultCity?: string;
  className?: string;
}

// Component implementation
const NeighborhoodSentimentDashboard: React.FC<NeighborhoodSentimentDashboardProps> = ({
  defaultCity = 'Richland',
  className
}) => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [sentimentData, setSentimentData] = useState<NeighborhoodSentiment | null>(null);
  const [view, setView] = useState<'summary' | 'top_rated' | 'trends'>('summary');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load neighborhoods and data on init
  useEffect(() => {
    loadNeighborhoods();
  }, [selectedCity]);

  useEffect(() => {
    if (selectedNeighborhood) {
      loadSentimentData();
    }
  }, [selectedNeighborhood]);

  // Load neighborhoods for selected city
  const loadNeighborhoods = async () => {
    try {
      const neighborhoods = neighborhoodSentimentService.getNeighborhoodsForCity(selectedCity);
      setNeighborhoods(neighborhoods);
      
      // Select first neighborhood by default
      if (neighborhoods.length > 0 && !selectedNeighborhood) {
        setSelectedNeighborhood(neighborhoods[0]);
      }
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
      setError('Failed to load neighborhoods');
    }
  };

  // Load sentiment data
  const loadSentimentData = async () => {
    if (!selectedNeighborhood) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await neighborhoodSentimentService.getNeighborhoodSentiment({
        neighborhoodName: selectedNeighborhood,
        city: selectedCity
      });
      
      setSentimentData(data);
    } catch (error) {
      console.error('Error loading sentiment data:', error);
      setError('Failed to load sentiment data');
      toast({
        title: 'Error',
        description: 'Could not load neighborhood sentiment data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get sentiment color based on level
  const getSentimentColor = (level: SentimentLevel): string => {
    switch (level) {
      case 'very_positive': return 'text-green-600';
      case 'positive': return 'text-green-500';
      case 'neutral': return 'text-yellow-500';
      case 'negative': return 'text-orange-500';
      case 'very_negative': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get color for progress bar
  const getProgressColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-green-400';
    if (score >= 40) return 'bg-yellow-400';
    if (score >= 20) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // Format topic name
  const formatTopicName = (topic: SentimentTopic): string => {
    return topic.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get top 3 topics by score
  const getTopTopics = () => {
    if (!sentimentData) return [];
    
    return Object.entries(sentimentData.topicScores)
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, 3)
      .map(([topic, score]) => ({ 
        topic: topic as SentimentTopic, 
        score 
      }));
  };

  // Render loading state
  if (isLoading && !sentimentData) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="flex justify-between gap-2">
              <Skeleton className="h-16 w-1/3" />
              <Skeleton className="h-16 w-1/3" />
              <Skeleton className="h-16 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Neighborhood Sentiment</CardTitle>
          <CardDescription>Analysis not available</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadSentimentData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center mb-1">
          <CardTitle className="text-lg">Neighborhood Sentiment</CardTitle>
          <Link href="/neighborhood-sentiment" className="text-xs text-primary hover:underline flex items-center">
            <span>Full Analysis</span>
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
        <CardDescription>Real-time sentiment analysis</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Select
              value={selectedCity}
              onValueChange={(value) => {
                setSelectedCity(value);
                setSelectedNeighborhood(null);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Richland">Richland</SelectItem>
                <SelectItem value="Grandview">Grandview</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={selectedNeighborhood || ''}
              onValueChange={setSelectedNeighborhood}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select neighborhood" />
              </SelectTrigger>
              <SelectContent>
                {neighborhoods.map(neighborhood => (
                  <SelectItem key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {sentimentData && (
            <>
              <Tabs 
                value={view} 
                onValueChange={(value) => setView(value as any)}
                className="mt-1"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary" className="text-xs">
                    <Info className="h-3 w-3 mr-1" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="top_rated" className="text-xs">
                    <PieChart className="h-3 w-3 mr-1" />
                    Top Rated
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trends
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="pt-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{sentimentData.neighborhoodName}</h3>
                      <p className="text-sm text-muted-foreground">{sentimentData.city}, {sentimentData.state}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        <span className={getSentimentColor(sentimentData.overallScore.level)}>
                          {sentimentData.overallScore.score}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Overall Score</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Progress 
                      value={sentimentData.overallScore.score} 
                      className={cn("h-2", getProgressColor(sentimentData.overallScore.score))}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-1">Top Ranked Categories</p>
                    <div className="grid grid-cols-3 gap-2">
                      {getTopTopics().map(({ topic, score }) => (
                        <div key={topic} className="p-2 border rounded-md text-center">
                          <div className={cn("font-medium", getSentimentColor(score.level))}>
                            {score.score}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {formatTopicName(topic)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="top_rated" className="space-y-3 pt-3">
                  {Object.entries(sentimentData.topicScores)
                    .sort(([, a], [, b]) => b.score - a.score)
                    .slice(0, 5)
                    .map(([topic, score]) => (
                      <div key={topic} className="flex items-center">
                        <div className="w-1/3 text-xs">{formatTopicName(topic as SentimentTopic)}</div>
                        <div className="w-2/3 flex items-center gap-2">
                          <Progress 
                            value={score.score} 
                            className={cn("flex-1 h-2", getProgressColor(score.score))}
                          />
                          <span className={cn("text-xs font-medium w-8 text-right", getSentimentColor(score.level))}>
                            {score.score}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </TabsContent>
                
                <TabsContent value="trends" className="pt-3">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm font-medium">Market Trend</div>
                      <div className="text-xs text-muted-foreground">Last 6 months</div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "flex items-center gap-1",
                        sentimentData.trend.direction === 'improving' 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : sentimentData.trend.direction === 'declining'
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                      )}
                    >
                      <TrendingUp className="h-3 w-3" />
                      <span className="capitalize">{sentimentData.trend.direction}</span>
                      <span>{sentimentData.trend.changeRate}%</span>
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-medium">Recent Mentions</div>
                    {sentimentData.mentions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 2)
                      .map(mention => (
                        <div key={mention.id} className="border-l-2 pl-2 py-1 text-xs" style={{
                          borderColor: mention.score > 0.3 ? '#10b981' : 
                                      mention.score > -0.3 ? '#f59e0b' : 
                                      '#ef4444'
                        }}>
                          <p className="line-clamp-2">{mention.text}</p>
                          <div className="flex justify-between text-muted-foreground text-[10px] mt-1">
                            <span className="capitalize">{mention.source.replace('_', ' ')}</span>
                            <span>{new Date(mention.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                <div>
                  Updated {new Date(sentimentData.lastUpdated).toLocaleDateString()}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2"
                  onClick={loadSentimentData}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NeighborhoodSentimentDashboard;