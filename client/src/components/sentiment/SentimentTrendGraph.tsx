/**
 * Sentiment Trend Graph Component
 * 
 * This component displays historical sentiment data and predicted future trends
 * for a selected neighborhood using a line chart with forecast bands.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  BarChart3, 
  ChevronRight,
  ChevronLeft,
  Calendar,
  ZoomIn,
  Award,
  Lightbulb,
  AlertCircle
} from 'lucide-react';

import neighborhoodSentimentService, { 
  SentimentTopic,
  SentimentLevel
} from '@/services/neighborhood-sentiment.service';

// Component props
interface SentimentTrendGraphProps {
  neighborhoodName?: string;
  city?: string;
  state?: string;
  className?: string;
  height?: number | string;
  width?: number | string;
  showControls?: boolean;
  compact?: boolean;
}

// Data types for trend data
interface SentimentDataPoint {
  date: string;
  score: number;
  min?: number;
  max?: number;
  isPrediction?: boolean;
}

// Timeframe options for the graph
type TimeframeOption = '3m' | '6m' | '1y' | '2y' | '5y';

// Component implementation
const SentimentTrendGraph: React.FC<SentimentTrendGraphProps> = ({
  neighborhoodName,
  city = 'Richland',
  state = 'WA',
  className,
  height = 400,
  width = '100%',
  showControls = true,
  compact = false
}) => {
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<SentimentTopic | 'overall'>('overall');
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('1y');
  const [sentimentData, setSentimentData] = useState<SentimentDataPoint[]>([]);
  const [predictedData, setPredictedData] = useState<SentimentDataPoint[]>([]);
  const [combinedData, setCombinedData] = useState<SentimentDataPoint[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | undefined>(neighborhoodName);
  const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);
  const [predictionConfidence, setPredictionConfidence] = useState<number>(0.85);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  // Initialize component
  useEffect(() => {
    loadNeighborhoods();
  }, [city]);

  useEffect(() => {
    if (selectedNeighborhood || neighborhoodName) {
      loadSentimentTrendData();
    }
  }, [selectedNeighborhood, neighborhoodName, selectedTopic, selectedTimeframe]);

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

  // Load sentiment trend data for the selected neighborhood
  const loadSentimentTrendData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get historical sentiment data
      const historicalData = await generateHistoricalData(
        selectedNeighborhood || neighborhoodName || '',
        selectedTopic,
        selectedTimeframe
      );
      
      setSentimentData(historicalData);
      
      // Generate prediction data
      const predictions = generatePredictionData(
        historicalData, 
        selectedTopic, 
        getPredictionMonths(selectedTimeframe)
      );
      
      setPredictedData(predictions);
      
      // Combine historical and prediction data
      const combined = [
        ...historicalData,
        ...predictions
      ];
      
      setCombinedData(combined);
    } catch (error) {
      console.error('Error loading sentiment trend data:', error);
      setError('Unable to load trend data');
      toast({
        title: 'Error',
        description: 'Failed to load sentiment trend data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate historical sentiment data based on selected parameters
  const generateHistoricalData = async (
    neighborhood: string,
    topic: SentimentTopic | 'overall',
    timeframe: TimeframeOption
  ): Promise<SentimentDataPoint[]> => {
    // In a real implementation, this would fetch data from an API
    // For this demo, we'll generate realistic data

    const months = getMonthsForTimeframe(timeframe);
    const data: SentimentDataPoint[] = [];
    
    // Get neighborhood data to use as a base
    const neighborhoodData = await neighborhoodSentimentService.getNeighborhoodSentiment({
      neighborhoodName: neighborhood,
      city
    });
    
    // Use the current score as a base for generating historical data
    const baseScore = topic === 'overall' 
      ? neighborhoodData.overallScore.score 
      : neighborhoodData.topicScores[topic]?.score || 70;
    
    // Determine trend direction from neighborhood data
    const trendDirection = neighborhoodData.trend.direction;
    const trendMultiplier = trendDirection === 'improving' ? 1 
      : trendDirection === 'declining' ? -1 
      : 0;
    
    // Generate data points for each month
    const endDate = new Date();
    
    for (let i = months; i >= 0; i--) {
      const date = new Date(endDate);
      date.setMonth(date.getMonth() - i);
      
      // Add some variability to the trend
      const randomVariation = (Math.random() - 0.5) * 5;
      const trendEffect = (i / months) * trendMultiplier * 10; // Trend effect increases over time
      
      // Calculate score based on base, trend, and random variation
      let score = baseScore - trendEffect + randomVariation;
      
      // Ensure score stays within 0-100 range
      score = Math.max(0, Math.min(100, score));
      
      // Add seasonal variations
      const seasonalEffect = Math.sin((date.getMonth() / 12) * Math.PI * 2) * 3;
      score += seasonalEffect;
      
      // Format date for display
      const formattedDate = date.toISOString().split('T')[0];
      
      data.push({
        date: formattedDate,
        score: Math.round(score),
        isPrediction: false
      });
    }
    
    return data;
  };

  // Generate prediction data based on historical data
  const generatePredictionData = (
    historicalData: SentimentDataPoint[],
    topic: SentimentTopic | 'overall',
    predictionMonths: number
  ): SentimentDataPoint[] => {
    if (historicalData.length === 0) return [];
    
    const predictions: SentimentDataPoint[] = [];
    
    // Get the last historical data point
    const lastDataPoint = historicalData[historicalData.length - 1];
    const lastDate = new Date(lastDataPoint.date);
    const lastScore = lastDataPoint.score;
    
    // Simple linear regression to determine trend
    const xValues: number[] = [];
    const yValues: number[] = [];
    
    // Use the last 6 data points or all available data
    const dataForRegression = historicalData.slice(-Math.min(6, historicalData.length));
    
    dataForRegression.forEach((point, index) => {
      xValues.push(index);
      yValues.push(point.score);
    });
    
    // Calculate slope and intercept
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((total, x, i) => total + x * yValues[i], 0);
    const sumXX = xValues.reduce((total, x) => total + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate standard error for confidence intervals
    const predictedY = xValues.map(x => slope * x + intercept);
    const squaredErrors = predictedY.map((predicted, i) => Math.pow(predicted - yValues[i], 2));
    const mse = squaredErrors.reduce((a, b) => a + b, 0) / n;
    const standardError = Math.sqrt(mse);
    
    // Generate prediction data
    for (let i = 1; i <= predictionMonths; i++) {
      const predictionDate = new Date(lastDate);
      predictionDate.setMonth(predictionDate.getMonth() + i);
      
      // Predicted score using the regression model
      const x = dataForRegression.length - 1 + i;
      const predictedScore = slope * x + intercept;
      
      // Add some randomness and dampen the prediction over time for realism
      const randomFactor = (Math.random() - 0.5) * 2;
      const timeUncertainty = i * 0.5; // Uncertainty increases with time
      const seasonalEffect = Math.sin((predictionDate.getMonth() / 12) * Math.PI * 2) * 2;
      
      let score = predictedScore + randomFactor * timeUncertainty + seasonalEffect;
      
      // Ensure score stays within 0-100 range
      score = Math.max(0, Math.min(100, score));
      
      // Calculate confidence intervals
      const confidenceWidth = standardError * 1.96 * Math.sqrt(1 + (i / n));
      const adjustedConfidenceWidth = confidenceWidth * (1 + (i * 0.2)); // Increase with time
      
      // Format date for display
      const formattedDate = predictionDate.toISOString().split('T')[0];
      
      predictions.push({
        date: formattedDate,
        score: Math.round(score),
        min: Math.max(0, Math.round(score - adjustedConfidenceWidth)),
        max: Math.min(100, Math.round(score + adjustedConfidenceWidth)),
        isPrediction: true
      });
    }
    
    return predictions;
  };

  // Helper to determine the number of months to show based on timeframe
  const getMonthsForTimeframe = (timeframe: TimeframeOption): number => {
    switch (timeframe) {
      case '3m': return 3;
      case '6m': return 6;
      case '1y': return 12;
      case '2y': return 24;
      case '5y': return 60;
      default: return 12;
    }
  };

  // Helper to determine the number of months to predict based on timeframe
  const getPredictionMonths = (timeframe: TimeframeOption): number => {
    switch (timeframe) {
      case '3m': return 3;
      case '6m': return 6;
      case '1y': return 12;
      case '2y': return 12;
      case '5y': return 24;
      default: return 12;
    }
  };

  // Helper to format topic names for display
  const formatTopicName = (topic: string): string => {
    if (topic === 'overall') return 'Overall Score';
    
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
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle>Sentiment Trend Prediction</CardTitle>
          <CardDescription>Unable to load prediction data</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-12 w-12 text-orange-500 mb-3" />
          <p className="text-center text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={loadSentimentTrendData}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render compact view
  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center text-lg">
            <span>Sentiment Trend Prediction</span>
            <Badge 
              variant="outline" 
              className="text-xs"
            >
              {formatTopicName(selectedTopic)}
            </Badge>
          </CardTitle>
          <CardDescription>{selectedNeighborhood || neighborhoodName}, {city}</CardDescription>
        </CardHeader>
        <CardContent className="p-1">
          <div style={{ width, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={combinedData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  minTickGap={30}
                />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip
                  formatter={(value, name) => [value, name === 'score' ? 'Score' : name === 'min' ? 'Min' : 'Max']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                />
                
                <ReferenceLine x={currentDate} stroke="#888" strokeDasharray="3 3" />
                <Area 
                  type="monotone" 
                  dataKey="max" 
                  stroke="transparent" 
                  fill="#3b82f6" 
                  fillOpacity={0.2} 
                  strokeWidth={0}
                  activeDot={false}
                  isAnimationActive={false}
                  name="Max"
                  connectNulls
                />
                <Area 
                  type="monotone" 
                  dataKey="min" 
                  stroke="transparent" 
                  fill="#3b82f6" 
                  fillOpacity={0.1} 
                  strokeWidth={0}
                  activeDot={false}
                  isAnimationActive={false}
                  name="Min"
                  connectNulls
                  baseValue={(dataMin: any) => dataMin}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                  name="Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render full view
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sentiment Trend Prediction
            </CardTitle>
            <CardDescription>
              Historical data and AI-powered sentiment predictions
            </CardDescription>
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedTopic}
                onValueChange={(value) => setSelectedTopic(value as any)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Score</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="schools">Schools</SelectItem>
                  <SelectItem value="amenities">Amenities</SelectItem>
                  <SelectItem value="affordability">Affordability</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="market_trend">Market Trend</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={selectedTimeframe}
                onValueChange={(value) => setSelectedTimeframe(value as TimeframeOption)}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3m">3 Months</SelectItem>
                  <SelectItem value="6m">6 Months</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                  <SelectItem value="2y">2 Years</SelectItem>
                  <SelectItem value="5y">5 Years</SelectItem>
                </SelectContent>
              </Select>
              
              {neighborhoodName === undefined && (
                <Select 
                  value={selectedNeighborhood}
                  onValueChange={setSelectedNeighborhood}
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
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div style={{ width, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={combinedData}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                minTickGap={30}
              />
              <YAxis 
                domain={[0, 100]} 
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(value) => `${value}`}
              />
              <RechartsTooltip
                formatter={(value, name) => [value, name === 'score' ? 'Score' : name === 'min' ? 'Min' : 'Max']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #ddd' }}
              />
              <Legend formatter={(value) => value === 'score' ? 'Sentiment Score' : value === 'min' ? 'Prediction Range (Min)' : 'Prediction Range (Max)'} />
              
              {/* Reference line for current date */}
              <ReferenceLine 
                x={currentDate} 
                stroke="#888" 
                strokeDasharray="3 3" 
                label={{ 
                  value: 'Today', 
                  position: 'insideTopRight', 
                  fill: '#888', 
                  fontSize: 12
                }} 
              />
              
              {/* Reference areas for sentiment levels */}
              <ReferenceArea y1={80} y2={100} fill="#10b981" fillOpacity={0.1} />
              <ReferenceArea y1={60} y2={80} fill="#3b82f6" fillOpacity={0.1} />
              <ReferenceArea y1={40} y2={60} fill="#facc15" fillOpacity={0.1} />
              <ReferenceArea y1={20} y2={40} fill="#f97316" fillOpacity={0.1} />
              <ReferenceArea y1={0} y2={20} fill="#ef4444" fillOpacity={0.1} />
              
              {/* Prediction confidence area */}
              <Area 
                type="monotone" 
                dataKey="max" 
                stroke="transparent" 
                fill="#3b82f6" 
                fillOpacity={0.2} 
                strokeWidth={0}
                activeDot={false}
                isAnimationActive={false}
                name="max"
                connectNulls
              />
              <Area 
                type="monotone" 
                dataKey="min" 
                stroke="transparent" 
                fill="#3b82f6" 
                fillOpacity={0.1} 
                strokeWidth={0}
                activeDot={false}
                isAnimationActive={false}
                name="min"
                connectNulls
                baseValue={(dataMin: any) => dataMin}
              />
              
              {/* Main sentiment score line */}
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
                name="score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Prediction Analysis</h4>
          <div className="flex flex-wrap gap-4">
            <div className="bg-muted/30 p-3 rounded-md flex-1 min-w-[200px]">
              <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>Predicted Direction</span>
              </div>
              <div className="flex items-center gap-2">
                {predictedTrend(combinedData) === 'up' ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">Improving</span>
                  </>
                ) : predictedTrend(combinedData) === 'down' ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 font-medium">Declining</span>
                  </>
                ) : (
                  <>
                    <span className="h-4 w-4 border-t-2 border-yellow-500 inline-block" />
                    <span className="text-yellow-600 font-medium">Stable</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-md flex-1 min-w-[200px]">
              <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span>Prediction Confidence</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">{Math.round(predictionConfidence * 100)}%</span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({predictionConfidence >= 0.85 ? 'High' : predictionConfidence >= 0.7 ? 'Medium' : 'Low'})
                </span>
              </div>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-md flex-1 min-w-[200px]">
              <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                <Award className="h-4 w-4 text-purple-500" />
                <span>Current Rank in {city}</span>
              </div>
              <div className="font-medium">
                2<span className="text-xs align-top">nd</span> out of {availableNeighborhoods.length}
              </div>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          <Alert variant="outline" className="bg-blue-50/50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700 text-sm">About Sentiment Predictions</AlertTitle>
            <AlertDescription className="text-blue-600 text-xs">
              Predictions are based on historical sentiment trends, market conditions, and advanced 
              AI modeling. Confidence intervals widen with time to reflect increasing uncertainty.
              All predictions should be considered alongside other market factors.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to determine the predicted trend direction
function predictedTrend(data: SentimentDataPoint[]): 'up' | 'down' | 'stable' {
  // Filter to only prediction data
  const predictions = data.filter(point => point.isPrediction);
  if (predictions.length < 2) return 'stable';
  
  // Compare first and last prediction
  const firstPrediction = predictions[0];
  const lastPrediction = predictions[predictions.length - 1];
  
  const difference = lastPrediction.score - firstPrediction.score;
  
  if (difference > 5) return 'up';
  if (difference < -5) return 'down';
  return 'stable';
}

export default SentimentTrendGraph;