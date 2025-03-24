/**
 * Neighborhood Sentiment Widget
 * 
 * This component displays sentiment analysis for a specific neighborhood,
 * including overall sentiment, topic breakdowns, and trend visualization.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  MessageSquare, 
  Twitter, 
  Newspaper, 
  Globe, 
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Info,
  BarChart
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer 
} from 'recharts';
import neighborhoodSentimentService, { 
  NeighborhoodSentiment, 
  SentimentLevel, 
  SentimentTrend, 
  TopicSentiment 
} from '@/services/neighborhood-sentiment.service';

interface NeighborhoodSentimentWidgetProps {
  neighborhoodId: string;
  showTrends?: boolean;
  className?: string;
}

const NeighborhoodSentimentWidget: React.FC<NeighborhoodSentimentWidgetProps> = ({
  neighborhoodId,
  showTrends = true,
  className = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<NeighborhoodSentiment | null>(null);
  const [trendData, setTrendData] = useState<SentimentTrend[]>([]);
  const [topTopics, setTopTopics] = useState<{
    positive: TopicSentiment[];
    negative: TopicSentiment[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sentimentData, trendsData, topicsData] = await Promise.all([
          neighborhoodSentimentService.getNeighborhoodSentiment(neighborhoodId),
          showTrends ? neighborhoodSentimentService.getSentimentTrends(neighborhoodId) : Promise.resolve([]),
          neighborhoodSentimentService.getTopTopics(neighborhoodId)
        ]);
        
        setSentiment(sentimentData);
        setTrendData(trendsData);
        setTopTopics(topicsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching neighborhood sentiment:', err);
        setError('Failed to load neighborhood sentiment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [neighborhoodId, showTrends]);

  // Helper function to get color for sentiment level
  const getSentimentColor = (level: SentimentLevel): string => {
    switch(level) {
      case SentimentLevel.VERY_POSITIVE:
        return 'bg-green-500 text-white';
      case SentimentLevel.POSITIVE:
        return 'bg-green-300 text-green-900';
      case SentimentLevel.NEUTRAL:
        return 'bg-gray-300 text-gray-900';
      case SentimentLevel.NEGATIVE:
        return 'bg-red-300 text-red-900';
      case SentimentLevel.VERY_NEGATIVE:
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-300 text-gray-900';
    }
  };

  // Helper function to get sentiment label text
  const getSentimentLabel = (level: SentimentLevel): string => {
    switch(level) {
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

  // Helper function to format score as percentage
  const formatScoreAsPercentage = (score: number): string => {
    // Convert -1 to 1 range to 0 to 100
    const percentage = ((score + 1) / 2) * 100;
    return `${Math.round(percentage)}%`;
  };

  // Helper to format the trends chart data with sentiment colors
  const formatTrendData = (data: SentimentTrend[]) => {
    return data.map(item => ({
      ...item,
      // Convert -1 to 1 score to 0 to 100 for better visualization
      displayScore: ((item.score + 1) / 2) * 100,
      // Add sentiment level for color coding
      sentimentLevel: 
        item.score >= 0.7 ? SentimentLevel.VERY_POSITIVE :
        item.score >= 0.3 ? SentimentLevel.POSITIVE :
        item.score >= -0.3 ? SentimentLevel.NEUTRAL :
        item.score >= -0.7 ? SentimentLevel.NEGATIVE :
        SentimentLevel.VERY_NEGATIVE
    }));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !sentiment) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Neighborhood Sentiment</CardTitle>
          <CardDescription>Analysis of public sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-red-500 flex flex-col items-center">
            <AlertTriangle className="h-10 w-10 mb-2" />
            <p>{error || 'Unable to load sentiment data'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedTrendData = formatTrendData(trendData);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl flex items-center">
              {sentiment.name} Sentiment
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Analysis based on {Object.values(sentiment.sources).reduce((a, b) => a + b, 0)} sources including social media, news, blogs, and reviews.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Public sentiment analysis as of {new Date(sentiment.lastUpdated).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={`${getSentimentColor(sentiment.overallSentiment)} ml-2`}>
            {getSentimentLabel(sentiment.overallSentiment)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall sentiment meter */}
          <div>
            <h3 className="text-sm font-medium mb-2">Overall Sentiment Score</h3>
            <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
              <div 
                className={`h-4 rounded-full ${getSentimentColor(sentiment.overallSentiment)}`} 
                style={{ width: formatScoreAsPercentage(sentiment.overallScore) }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Very Negative</span>
              <span>Neutral</span>
              <span>Very Positive</span>
            </div>
          </div>

          {/* Sources breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Sources</h3>
              <span className="text-xs text-muted-foreground">
                {Object.values(sentiment.sources).reduce((a, b) => a + b, 0)} total mentions
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="flex flex-col items-center space-y-1">
                <div className="rounded-full bg-blue-100 p-2">
                  <Twitter className="h-3 w-3 text-blue-500" />
                </div>
                <span className="text-xs font-medium">{sentiment.sources.socialMedia}</span>
                <span className="text-[10px] text-muted-foreground">Social</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="rounded-full bg-amber-100 p-2">
                  <Newspaper className="h-3 w-3 text-amber-600" />
                </div>
                <span className="text-xs font-medium">{sentiment.sources.news}</span>
                <span className="text-[10px] text-muted-foreground">News</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="rounded-full bg-purple-100 p-2">
                  <Globe className="h-3 w-3 text-purple-600" />
                </div>
                <span className="text-xs font-medium">{sentiment.sources.blogs}</span>
                <span className="text-[10px] text-muted-foreground">Blogs</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="rounded-full bg-indigo-100 p-2">
                  <MessageSquare className="h-3 w-3 text-indigo-600" />
                </div>
                <span className="text-xs font-medium">{sentiment.sources.forums}</span>
                <span className="text-[10px] text-muted-foreground">Forums</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="rounded-full bg-green-100 p-2">
                  <BarChart className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-xs font-medium">{sentiment.sources.reviews}</span>
                <span className="text-[10px] text-muted-foreground">Reviews</span>
              </div>
            </div>
          </div>

          {/* Sentiment by Topics */}
          {topTopics && (
            <div>
              <Tabs defaultValue="positive">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium">Sentiment by Topic</h3>
                  <TabsList className="h-8">
                    <TabsTrigger value="positive" className="text-xs h-7">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Positive
                    </TabsTrigger>
                    <TabsTrigger value="negative" className="text-xs h-7">
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      Negative
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="positive">
                  <div className="space-y-2">
                    {topTopics.positive.length > 0 ? (
                      topTopics.positive.map((topic, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm">{topic.topic}</span>
                            {topic.trending && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <TrendingUp className="h-3 w-3 ml-1 text-green-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Trending topic with increasing mentions</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="w-24 bg-muted rounded-full h-2 overflow-hidden mr-2">
                              <div 
                                className={`h-2 rounded-full ${getSentimentColor(topic.sentiment)}`} 
                                style={{ width: formatScoreAsPercentage(topic.score) }}
                              />
                            </div>
                            <span className="text-xs">{Math.round(((topic.score + 1) / 2) * 100)}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        No positive topics found
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="negative">
                  <div className="space-y-2">
                    {topTopics.negative.length > 0 ? (
                      topTopics.negative.map((topic, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm">{topic.topic}</span>
                            {topic.trending && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <TrendingUp className="h-3 w-3 ml-1 text-red-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Trending concern with increasing mentions</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="w-24 bg-muted rounded-full h-2 overflow-hidden mr-2">
                              <div 
                                className={`h-2 rounded-full ${getSentimentColor(topic.sentiment)}`} 
                                style={{ width: formatScoreAsPercentage(topic.score) }}
                              />
                            </div>
                            <span className="text-xs">{Math.round(((topic.score + 1) / 2) * 100)}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        No negative topics found
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Trend Chart */}
          {showTrends && formattedTrendData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Sentiment Trend (12 months)</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Sentiment score trend over time, showing how public perception has changed.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 10 }}
                      interval={Math.ceil(formattedTrendData.length / 6) - 1} // Show ~6 labels
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tickFormatter={(value) => `${value}%`} 
                      tick={{ fontSize: 10 }}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <RechartsTooltip 
                      formatter={(value: any) => [`${Math.round(value)}%`, 'Sentiment Score']}
                      labelFormatter={(label) => `Period: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="displayScore" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      dot={{ strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      name="Sentiment"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NeighborhoodSentimentWidget;