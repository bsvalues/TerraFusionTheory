/**
 * Neighborhood Sentiment Widget
 * 
 * This component displays sentiment analysis data for a specific neighborhood
 * in a compact, reusable widget format.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, MessageSquare, Users, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { NeighborhoodSentiment, SentimentLevel } from '@/services/neighborhood-sentiment.service';

interface NeighborhoodSentimentWidgetProps {
  sentiment: NeighborhoodSentiment;
  compact?: boolean;
  showDetails?: boolean;
}

const NeighborhoodSentimentWidget: React.FC<NeighborhoodSentimentWidgetProps> = ({
  sentiment,
  compact = false,
  showDetails = true
}) => {
  // Helper function to get sentiment color
  const getSentimentColor = (level: SentimentLevel): string => {
    switch (level) {
      case SentimentLevel.VERY_POSITIVE:
        return 'bg-green-600';
      case SentimentLevel.POSITIVE:
        return 'bg-green-500';
      case SentimentLevel.NEUTRAL:
        return 'bg-gray-500';
      case SentimentLevel.NEGATIVE:
        return 'bg-red-500';
      case SentimentLevel.VERY_NEGATIVE:
        return 'bg-red-600';
      default:
        return 'bg-gray-400';
    }
  };

  // Helper function to get sentiment badge variant
  const getSentimentBadgeVariant = (level: SentimentLevel): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case SentimentLevel.VERY_POSITIVE:
      case SentimentLevel.POSITIVE:
        return 'default';
      case SentimentLevel.NEUTRAL:
        return 'secondary';
      case SentimentLevel.NEGATIVE:
      case SentimentLevel.VERY_NEGATIVE:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Helper function to get trend icon
  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  // Calculate overall sentiment score (0-100) - convert from -1 to 1 scale
  const overallScore = Math.round(((sentiment.overallScore + 1) / 2) * 100);

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">{sentiment.name}</h4>
            <Badge variant={getSentimentBadgeVariant(sentiment.overallSentiment)}>
              {sentiment.overallSentiment.replace('-', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={overallScore} className="flex-1" />
            <span className="text-sm font-medium">{overallScore}%</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine trend based on score
  const trend = sentiment.overallScore > 0.2 ? 'improving' : 
                sentiment.overallScore < -0.2 ? 'declining' : 'stable';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{sentiment.name}</CardTitle>
          <Badge variant={getSentimentBadgeVariant(sentiment.overallSentiment)}>
            {sentiment.overallSentiment.replace('-', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Overall Score: {overallScore}%</span>
          {getTrendIcon(trend)}
          <span className="capitalize">{trend}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm font-medium">{sentiment.sources.reviews}</div>
              <div className="text-xs text-muted-foreground">Reviews</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            <div>
              <div className="text-sm font-medium">{sentiment.sources.socialMedia}</div>
              <div className="text-xs text-muted-foreground">Social Posts</div>
            </div>
          </div>
        </div>

        {showDetails && (
          <>
            <Separator />

            {/* Topic Sentiments */}
            <div className="space-y-3">
              <h5 className="font-medium text-sm">Topic Breakdown</h5>
              
              <div className="space-y-2">
                {sentiment.topicSentiments.slice(0, 4).map((topic, index) => {
                  const topicScore = Math.round(((topic.score + 1) / 2) * 100);
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{topic.topic}</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={topicScore} 
                          className="w-16" 
                        />
                        <span className="text-xs w-8">{topicScore}%</span>
                        {topic.trending && (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Top Topics */}
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Common Topics</h5>
              <div className="flex flex-wrap gap-1">
                {sentiment.topicSentiments.slice(0, 6).map((topic, index) => (
                  <Badge 
                    key={index} 
                    variant={topic.sentiment === SentimentLevel.POSITIVE || topic.sentiment === SentimentLevel.VERY_POSITIVE ? "default" : "outline"} 
                    className="text-xs"
                  >
                    {topic.topic}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Source Breakdown */}
            <Separator />
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Data Sources</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>News: {sentiment.sources.news}</div>
                <div>Blogs: {sentiment.sources.blogs}</div>
                <div>Forums: {sentiment.sources.forums}</div>
                <div>Social: {sentiment.sources.socialMedia}</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NeighborhoodSentimentWidget;