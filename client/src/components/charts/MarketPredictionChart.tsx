/**
 * Market Prediction Chart
 * 
 * An interactive visualization component that displays future market predictions
 * with confidence intervals.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tooltip as ChartTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { 
  ComposedChart, 
  Line, 
  Area,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Label,
  ReferenceLine
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import marketTrendsService, { MarketPrediction } from '@/services/market-trends.service';

interface MarketPredictionChartProps {
  areaCode?: string;
  propertyType?: string;
  timeFrame?: '6m' | '1y' | '2y' | '5y';
}

const MarketPredictionChart: React.FC<MarketPredictionChartProps> = ({
  areaCode = 'grandview',
  propertyType = 'all',
  timeFrame = '1y',
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [predictionData, setPredictionData] = useState<MarketPrediction[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>(propertyType);
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>(areaCode);
  const [currentMedianPrice, setCurrentMedianPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch historical data for context
        const historicalData = await marketTrendsService.getMarketTrends({
          areaCode: selectedAreaCode,
          propertyType: selectedPropertyType,
          timeFrame: '1y',
        });
        
        // Fetch prediction data
        const predictions = await marketTrendsService.getMarketPredictions({
          areaCode: selectedAreaCode,
          propertyType: selectedPropertyType,
          timeFrame: timeFrame,
        });
        
        setPredictionData(predictions);
        
        // Get the last actual data point as our current price
        if (historicalData.length > 0) {
          setCurrentMedianPrice(historicalData[historicalData.length - 1].medianPrice);
        }
        
        // Combine the last 6 months of historical with prediction data for visualization
        const combinedData = [
          ...historicalData.slice(-6).map(item => ({
            month: item.month,
            actualPrice: item.medianPrice,
            predictedPrice: null,
            confidenceMin: null,
            confidenceMax: null,
          })),
          ...predictions.map(item => ({
            month: item.month,
            actualPrice: null,
            predictedPrice: item.predictedMedianPrice,
            confidenceMin: item.confidenceMin,
            confidenceMax: item.confidenceMax,
          }))
        ];
        
        setTrendData(combinedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching prediction data:', err);
        setError('Failed to load market prediction data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPropertyType, selectedAreaCode, timeFrame]);

  const handlePropertyTypeChange = (value: string) => {
    setSelectedPropertyType(value);
  };

  const handleAreaCodeChange = (value: string) => {
    setSelectedAreaCode(value);
  };

  // Calculate growth metrics
  const calculateGrowthMetrics = () => {
    if (predictionData.length > 0 && currentMedianPrice) {
      const sixMonthPrediction = predictionData[5]?.predictedMedianPrice;
      const twelveMonthPrediction = predictionData[11]?.predictedMedianPrice;
      
      if (sixMonthPrediction && twelveMonthPrediction) {
        const sixMonthGrowth = ((sixMonthPrediction - currentMedianPrice) / currentMedianPrice) * 100;
        const yearlyGrowth = ((twelveMonthPrediction - currentMedianPrice) / currentMedianPrice) * 100;
        
        return {
          sixMonth: sixMonthGrowth.toFixed(1),
          yearly: yearlyGrowth.toFixed(1),
          priceSixMonth: sixMonthPrediction.toLocaleString(),
          priceYearly: twelveMonthPrediction.toLocaleString(),
        };
      }
    }
    
    return null;
  };
  
  const growthMetrics = calculateGrowthMetrics();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap justify-between items-start">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              Market Forecast
              <TooltipProvider>
                <ChartTooltip>
                  <TooltipTrigger>
                    <Info className="h-5 w-5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Predictions based on historical trends, seasonal patterns, and market indicators. Confidence intervals widen for predictions further in the future.</p>
                  </TooltipContent>
                </ChartTooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              12-month price prediction with confidence intervals
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedAreaCode} onValueChange={handleAreaCodeChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Market Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grandview">Grandview</SelectItem>
                <SelectItem value="yakima">Yakima County</SelectItem>
                <SelectItem value="sunnyside">Sunnyside</SelectItem>
                <SelectItem value="prosser">Prosser</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPropertyType} onValueChange={handlePropertyTypeChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="single-family">Single Family</SelectItem>
                <SelectItem value="condo">Condos</SelectItem>
                <SelectItem value="multi-family">Multi-Family</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Growth metrics summary */}
        {!loading && !error && growthMetrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">6-Month Forecast</div>
              <div className="text-2xl font-semibold mt-1">${growthMetrics.priceSixMonth}</div>
              <Badge className={Number(growthMetrics.sixMonth) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {Number(growthMetrics.sixMonth) >= 0 ? '+' : ''}{growthMetrics.sixMonth}%
              </Badge>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">12-Month Forecast</div>
              <div className="text-2xl font-semibold mt-1">${growthMetrics.priceYearly}</div>
              <Badge className={Number(growthMetrics.yearly) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {Number(growthMetrics.yearly) >= 0 ? '+' : ''}{growthMetrics.yearly}%
              </Badge>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[350px] w-full rounded-md" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month">
                  <Label value="Month" offset={-10} position="insideBottom" />
                </XAxis>
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000)}k`}
                >
                  <Label value="Price" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <Tooltip 
                  formatter={(value: any) => {
                    if (value === null) return ['--', ''];
                    return [`$${Number(value).toLocaleString()}`, ''];
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                
                {/* Confidence interval area */}
                <Area 
                  type="monotone" 
                  dataKey="confidenceMax" 
                  stroke="none"
                  fill="#8884d8" 
                  fillOpacity={0.1}
                  name="Confidence Interval (Max)"
                  isAnimationActive={true}
                  legendType="none"
                />
                <Area 
                  type="monotone" 
                  dataKey="confidenceMin" 
                  stroke="none"
                  fill="#8884d8" 
                  fillOpacity={0.1}
                  name="Confidence Interval (Min)"
                  isAnimationActive={true}
                  legendType="none"
                  connectNulls
                />
                
                {/* Predicted price line */}
                <Line 
                  type="monotone" 
                  dataKey="predictedPrice" 
                  stroke="#8884d8" 
                  strokeDasharray="5 5"
                  name="Predicted Price"
                  connectNulls
                  dot={{ r: 4 }}
                  isAnimationActive={true}
                />
                
                {/* Actual price line */}
                <Line 
                  type="monotone" 
                  dataKey="actualPrice" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Historical Price"
                  connectNulls
                  dot={{ r: 4 }}
                  isAnimationActive={true}
                />
                
                {/* Divider line between historical and predicted */}
                <ReferenceLine x={trendData[5]?.month} 
                  stroke="#666" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Forecast Start', 
                    position: 'insideTopRight', 
                    fill: '#666',
                    fontSize: 12 
                  }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketPredictionChart;