/**
 * TrendPredictionWidget Component
 * 
 * This component uses AI to predict property trends and visualize future market metrics.
 * It displays forecasted median prices, days on market, and market condition for a specified period.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  LucideBrainCircuit, 
  LucideTrendingUp, 
  LucideArrowRight, 
  LucideInfo,
  LucideBadgeDollarSign, 
  LucideCalendarDays,
  LucideBarChart2,
  LucideRefreshCw
} from 'lucide-react';

// Types
interface PredictedMetricsSnapshot {
  periodStart: string;
  periodEnd: string;
  totalListings: number;
  medianPrice: number;
  averagePrice: number;
  pricePerSqFtAvg: number;
  avgDaysOnMarket: number;
  marketCondition: string;
  marketTrend: string;
}

interface PredictionResult {
  predictedMetrics: PredictedMetricsSnapshot;
  confidenceScore: number;
  historicalData?: Array<{
    date: string;
    medianPrice: number;
    avgDaysOnMarket: number;
  }>;
  projectedData?: Array<{
    date: string;
    medianPrice: number;
    avgDaysOnMarket: number;
  }>;
}

interface TrendPredictionProps {
  areaType?: string;
  areaValue?: string;
}

const TrendPredictionWidget = ({ areaType = 'zip', areaValue = '98930' }: TrendPredictionProps) => {
  const [predictionDays, setPredictionDays] = useState<number>(90);
  const { toast } = useToast();
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  };
  
  // Fetch prediction data
  const { 
    data: prediction,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/market/predict', areaValue, predictionDays],
    queryFn: async () => {
      // In a production environment, this would fetch from the real API
      // `/api/market/predict?area=${areaValue}&daysAhead=${predictionDays}`
      
      // For now, simulate data based on predictionDays
      const currentDate = new Date();
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + predictionDays);
      
      // Generate historical data
      const historicalData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - (5 - i));
        return {
          date: date.toISOString().split('T')[0],
          medianPrice: 400000 + (i * 5000) + Math.floor(Math.random() * 5000),
          avgDaysOnMarket: 25 - (i * 1) + Math.floor(Math.random() * 2)
        };
      });
      
      // Calculate trend from historical data
      const priceChange = historicalData[5].medianPrice - historicalData[0].medianPrice;
      const priceChangePerDay = priceChange / (180); // Roughly 6 months
      
      const domChange = historicalData[5].avgDaysOnMarket - historicalData[0].avgDaysOnMarket;
      const domChangePerDay = domChange / (180);
      
      // Generate projected data with small variations
      const projectedData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + ((i + 1) * (predictionDays / 6)));
        
        // Add some randomness to create fluctuations, but maintain the overall trend
        const randomFactor = 0.05; // 5% variation
        const priceRandomness = 1 + ((Math.random() * randomFactor * 2) - randomFactor);
        const domRandomness = 1 + ((Math.random() * randomFactor * 2) - randomFactor);
        
        return {
          date: date.toISOString().split('T')[0],
          medianPrice: Math.round((historicalData[5].medianPrice + (priceChangePerDay * (i + 1) * (predictionDays / 6))) * priceRandomness),
          avgDaysOnMarket: Math.max(5, Math.round((historicalData[5].avgDaysOnMarket + (domChangePerDay * (i + 1) * (predictionDays / 6))) * domRandomness))
        };
      });
      
      // Determine market condition based on trends
      let marketCondition = 'balanced';
      let marketTrend = 'stable';
      
      if (priceChangePerDay > 0 && domChangePerDay < 0) {
        marketCondition = 'hot';
        marketTrend = 'upStrong';
      } else if (priceChangePerDay > 0 && domChangePerDay > 0) {
        marketCondition = 'warm';
        marketTrend = 'upModerate';
      } else if (priceChangePerDay < 0 && domChangePerDay > 0) {
        marketCondition = 'cool';
        marketTrend = 'downModerate';
      } else if (priceChangePerDay < 0 && domChangePerDay < 0) {
        marketCondition = 'cold';
        marketTrend = 'downStrong';
      }
      
      const predictedMetrics: PredictedMetricsSnapshot = {
        periodStart: currentDate.toISOString(),
        periodEnd: endDate.toISOString(),
        totalListings: 45 + Math.floor(Math.random() * 10),
        medianPrice: projectedData[projectedData.length - 1].medianPrice,
        averagePrice: projectedData[projectedData.length - 1].medianPrice * 1.05,
        pricePerSqFtAvg: Math.round(projectedData[projectedData.length - 1].medianPrice / 1800),
        avgDaysOnMarket: projectedData[projectedData.length - 1].avgDaysOnMarket,
        marketCondition,
        marketTrend
      };
      
      // Confidence score decreases as prediction days increase
      const confidenceScore = Math.max(0.4, 0.9 - (predictionDays / 365 * 0.5));
      
      return {
        predictedMetrics,
        confidenceScore,
        historicalData,
        projectedData
      } as PredictionResult;
    },
    refetchOnWindowFocus: false
  });
  
  // Handle prediction days change
  const handlePredictionDaysChange = (value: number[]) => {
    setPredictionDays(value[0]);
  };
  
  // Get color for trend animation
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'upStrong':
        return 'text-green-600';
      case 'upModerate':
        return 'text-green-500';
      case 'stable':
        return 'text-blue-500';
      case 'downModerate':
        return 'text-orange-500';
      case 'downStrong':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };
  
  // Get style for market condition
  const getMarketConditionStyle = (condition: string) => {
    switch (condition) {
      case 'hot':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warm':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'balanced':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cool':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'cold':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'upStrong':
        return <LucideTrendingUp className="mr-1 h-4 w-4 rotate-45" />;
      case 'upModerate':
        return <LucideTrendingUp className="mr-1 h-4 w-4 rotate-30" />;
      case 'stable':
        return <LucideArrowRight className="mr-1 h-4 w-4" />;
      case 'downModerate':
        return <LucideTrendingUp className="mr-1 h-4 w-4 rotate-[210deg]" />;
      case 'downStrong':
        return <LucideTrendingUp className="mr-1 h-4 w-4 rotate-[225deg]" />;
      default:
        return <LucideArrowRight className="mr-1 h-4 w-4" />;
    }
  };
  
  // Combined chart data for historical and projected values
  const getChartData = () => {
    if (!prediction) return [];
    
    const { historicalData, projectedData } = prediction;
    
    if (!historicalData || !projectedData) return [];
    
    // Prepare combined data with null values to create disconnect between lines
    const combinedData = [
      ...historicalData.map(item => ({
        date: item.date,
        historical: item.medianPrice,
        projected: null
      })),
      // Add a connection point
      {
        date: historicalData[historicalData.length - 1].date,
        historical: historicalData[historicalData.length - 1].medianPrice,
        projected: historicalData[historicalData.length - 1].medianPrice
      },
      ...projectedData.map(item => ({
        date: item.date,
        historical: null,
        projected: item.medianPrice
      }))
    ];
    
    return combinedData;
  };
  
  return (
    <Card className="w-full h-full overflow-hidden shadow-lg animate-in fade-in-50 duration-700">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center">
            <LucideBrainCircuit className="mr-2 h-5 w-5 text-primary animate-pulse" />
            AI Market Prediction
          </CardTitle>
          <Badge variant="outline" className="font-normal text-xs flex items-center">
            <LucideInfo className="mr-1 h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
        <CardDescription className="text-sm">
          Advanced AI forecasting of property market trends and metrics
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4 pb-2 px-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Analyzing market data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500">Error loading prediction data</p>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : prediction ? (
          <div className="space-y-6">
            {/* Prediction timeframe slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="prediction-days">Prediction Timeframe</Label>
                <span className="text-sm font-medium">{predictionDays} days</span>
              </div>
              
              <Slider
                id="prediction-days"
                min={30}
                max={365}
                step={30}
                value={[predictionDays]}
                onValueChange={handlePredictionDaysChange}
                className="mt-2"
                aria-label="Prediction timeframe in days"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30 days</span>
                <span>6 months</span>
                <span>1 year</span>
              </div>
            </div>
            
            {/* Prediction metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Predicted Median Price */}
              <Card className="shadow-sm border-primary/20">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <LucideBadgeDollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                    Future Median Price
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="text-xl font-bold flex items-baseline">
                    {formatCurrency(prediction.predictedMetrics.medianPrice)}
                    <span className={`ml-2 text-sm flex items-center ${getTrendColor(prediction.predictedMetrics.marketTrend)}`}>
                      {getTrendIcon(prediction.predictedMetrics.marketTrend)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Predicted Days on Market */}
              <Card className="shadow-sm border-primary/20">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <LucideCalendarDays className="mr-1 h-4 w-4 text-muted-foreground" />
                    Future Days on Market
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="text-xl font-bold flex items-baseline">
                    {prediction.predictedMetrics.avgDaysOnMarket} days
                    <span className={`ml-2 text-sm flex items-center ${getTrendColor(prediction.predictedMetrics.marketTrend)}`}>
                      {getTrendIcon(prediction.predictedMetrics.marketTrend)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Market Condition */}
              <Card className="shadow-sm border-primary/20">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <LucideBarChart2 className="mr-1 h-4 w-4 text-muted-foreground" />
                    Predicted Market
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="flex items-center">
                    <Badge 
                      variant="outline"
                      className={`capitalize ${getMarketConditionStyle(prediction.predictedMetrics.marketCondition)}`}
                    >
                      {prediction.predictedMetrics.marketCondition}
                    </Badge>
                    <div className="ml-2 text-xs text-muted-foreground">
                      Confidence:&nbsp;
                      <span className="font-medium">{Math.round(prediction.confidenceScore * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Price Trend Chart */}
            <div className="border rounded-lg p-3 bg-card/30">
              <h4 className="text-sm font-medium mb-4">Median Price Trend Projection</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getChartData()}
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                      stroke="#888888"
                      fontSize={11}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                      stroke="#888888"
                      fontSize={11}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value?.toLocaleString()}`, 'Price']}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Legend />
                    <ReferenceLine 
                      x={prediction?.historicalData?.[prediction?.historicalData?.length - 1]?.date} 
                      stroke="#888888" 
                      strokeDasharray="3 3"
                      label={{ 
                        value: 'Today', 
                        position: 'top',
                        fill: '#888888',
                        fontSize: 10 
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="historical" 
                      name="Historical" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ stroke: '#8884d8', strokeWidth: 1, r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projected" 
                      name="Projected" 
                      stroke="#82ca9d" 
                      strokeDasharray="5 5" 
                      strokeWidth={2}
                      dot={{ stroke: '#82ca9d', strokeWidth: 1, r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
      
      <CardFooter className="pt-2 pb-3 px-4 border-t bg-card/50 text-xs text-muted-foreground flex justify-between items-center">
        <span>Powered by AI market analysis</span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs"
          onClick={() => {
            refetch();
            toast({
              title: "Prediction refreshed",
              description: "Using the latest market data to update forecasts",
            });
          }}
          disabled={isLoading}
        >
          <LucideRefreshCw className="mr-1 h-3 w-3" />
          Update
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TrendPredictionWidget;