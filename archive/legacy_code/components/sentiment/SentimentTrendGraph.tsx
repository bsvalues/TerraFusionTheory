/**
 * SentimentTrendGraph Component
 * 
 * Displays historical sentiment data and AI predictions for neighborhoods
 * with interactive visualization and confidence intervals
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { format, subMonths, addMonths, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Info, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  LineChart as LineChartIcon
} from 'lucide-react';
import neighborhoodSentimentService, { SentimentTopic } from '@/services/neighborhood-sentiment.service';

// Component props
interface SentimentTrendGraphProps {
  neighborhoodName: string;
  city: string;
  height?: number;
  topic?: SentimentTopic | 'overall';
  showTitle?: boolean;
  timeRangePast?: number;
  timeRangeFuture?: number;
  showConfidenceIntervals?: boolean;
  showEvents?: boolean;
  showAnnotations?: boolean;
  chartType?: 'line' | 'bar' | 'area';
  displayMode?: 'absolute' | 'relative';
  propertyType?: string;
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const isPrediction = dataPoint.isPrediction;
    
    return (
      <div className="bg-background border rounded-md shadow-md p-3 text-sm">
        <p className="font-semibold text-base mb-1">{format(new Date(label), 'MMM yyyy')}</p>
        <p className="text-primary font-medium mb-1">
          Score: {payload[0].value.toFixed(1)}
        </p>
        
        {isPrediction && (
          <div className="mt-1 text-xs flex items-center text-muted-foreground">
            <AlertTriangle className="h-3 w-3 mr-1" />
            <span>AI Prediction</span>
          </div>
        )}
        
        {'events' in dataPoint && dataPoint.events && dataPoint.events.length > 0 && (
          <div className="mt-2 pt-2 border-t border-muted">
            <p className="text-xs font-medium mb-1">Notable Events:</p>
            <ul className="text-xs list-disc pl-4">
              {dataPoint.events.map((event: string, i: number) => (
                <li key={i}>{event}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

// Main component
export default function SentimentTrendGraph({ 
  neighborhoodName, 
  city, 
  height = 320,
  topic = 'overall',
  showTitle = true,
  timeRangePast: propTimeRangePast,
  timeRangeFuture: propTimeRangeFuture,
  showConfidenceIntervals = true,
  showEvents = true,
  showAnnotations: propShowAnnotations,
  chartType = 'line',
  displayMode = 'absolute',
  propertyType = 'all'
}: SentimentTrendGraphProps) {
  // Time range state - use props if provided, otherwise use defaults
  const [timeRangePast, setTimeRangePast] = useState(propTimeRangePast || 12); // past months
  const [timeRangeFuture, setTimeRangeFuture] = useState(propTimeRangeFuture || 6); // future months
  const [showAnnotations, setShowAnnotations] = useState(propShowAnnotations !== undefined ? propShowAnnotations : false);
  
  // Memoized data
  const chartData = useMemo(() => {
    // Get historical data
    const historicalData = neighborhoodSentimentService.getHistoricalSentimentData(
      city, 
      neighborhoodName, 
      topic as SentimentTopic,
      timeRangePast
    );
    
    // Get prediction data
    const predictionData = neighborhoodSentimentService.getPredictedSentimentData(
      city, 
      neighborhoodName, 
      topic as SentimentTopic, 
      timeRangeFuture
    );
    
    // Combine and format data for chart
    return [...historicalData, ...predictionData].map(item => ({
      ...item,
      date: format(parseISO(item.date), 'yyyy-MM-dd'),
      formattedDate: format(parseISO(item.date), 'MMM yyyy')
    }));
  }, [city, neighborhoodName, topic, timeRangePast, timeRangeFuture]);
  
  // Separate historical and prediction data for reference
  const splitIndex = chartData.findIndex(d => d.isPrediction) > 0 ? 
    chartData.findIndex(d => d.isPrediction) : chartData.length;
  const historicalData = chartData.slice(0, splitIndex);
  const predictionData = chartData.slice(splitIndex);
  
  // Calculate trend indicators
  const recentTrend = useMemo(() => {
    if (historicalData.length < 3) return { direction: 'stable', strength: 0 };
    
    const recentMonths = historicalData.slice(-3);
    const first = recentMonths[0]?.score || 0;
    const last = recentMonths[recentMonths.length - 1]?.score || 0;
    const diff = last - first;
    
    let direction = 'stable';
    if (diff > 0.2) direction = 'up';
    else if (diff < -0.2) direction = 'down';
    
    return {
      direction,
      strength: Math.abs(diff),
      percentage: (Math.abs(diff) / Math.max(0.1, first)) * 100
    };
  }, [historicalData]);
  
  const futureTrend = useMemo(() => {
    if (predictionData.length < 2) return { direction: 'stable', strength: 0 };
    
    const first = predictionData[0]?.score || 0;
    const last = predictionData[predictionData.length - 1]?.score || 0;
    const diff = last - first;
    
    let direction = 'stable';
    if (diff > 0.2) direction = 'up';
    else if (diff < -0.2) direction = 'down';
    
    return {
      direction,
      strength: Math.abs(diff),
      percentage: (Math.abs(diff) / Math.max(0.1, first)) * 100
    };
  }, [predictionData]);
  
  // Domain boundaries for the score axis
  const yDomain = useMemo(() => {
    const allScores = chartData.map(item => item.score);
    const minScore = Math.floor(Math.min(...allScores));
    const maxScore = Math.ceil(Math.max(...allScores));
    
    return [Math.max(0, minScore - 0.5), Math.min(10, maxScore + 0.5)];
  }, [chartData]);
  
  // Calculate key insights
  const insights = useMemo(() => {
    if (!chartData.length) return [];
    
    const insights = [];
    const allScores = chartData.map(item => item.score);
    const avgScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    
    // Find peak and trough
    const peak = Math.max(...allScores);
    const trough = Math.min(...allScores);
    const peakItem = chartData.find(item => item.score === peak);
    const troughItem = chartData.find(item => item.score === trough);
    
    // Significant events
    const significantEvents = chartData
      .filter(item => 'events' in item && item.events && item.events.length > 0)
      .slice(0, 2);
    
    // Add insights
    if (peakItem) {
      insights.push({
        type: 'peak',
        text: `Highest sentiment (${peak.toFixed(1)}) was in ${format(parseISO(peakItem.date), 'MMM yyyy')}`,
        date: peakItem.date
      });
    }
    
    if (troughItem) {
      insights.push({
        type: 'trough',
        text: `Lowest sentiment (${trough.toFixed(1)}) was in ${format(parseISO(troughItem.date), 'MMM yyyy')}`,
        date: troughItem.date
      });
    }
    
    significantEvents.forEach(event => {
      // Safely check and extract the event
      const eventText = 'events' in event && event.events && event.events.length > 0 
        ? event.events[0]
        : 'Notable event';
        
      insights.push({
        type: 'event',
        text: `${format(parseISO(event.date), 'MMM yyyy')}: ${eventText}`,
        date: event.date
      });
    });
    
    if (futureTrend.direction !== 'stable') {
      insights.push({
        type: 'prediction',
        text: `Predicted to ${futureTrend.direction === 'up' ? 'increase' : 'decrease'} by ${futureTrend.percentage?.toFixed(1) || '0.0'}% in next ${timeRangeFuture} months`
      });
    }
    
    return insights;
  }, [chartData, futureTrend, timeRangeFuture]);
  
  // Render the component
  return (
    <Card className="h-full">
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <LineChartIcon className="mr-2 h-5 w-5 text-primary" />
            Sentiment Trend: {neighborhoodName}
          </CardTitle>
          <CardDescription>
            Historical data and AI predictions for {topic === 'overall' ? 'overall sentiment' : topic.replace('_', ' ')}
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent>
        {/* Trend indicators */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">Historical Trend</div>
            <div className="flex items-center">
              {recentTrend.direction === 'up' ? (
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              ) : recentTrend.direction === 'down' ? (
                <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
              ) : (
                <LineChartIcon className="h-5 w-5 mr-2 text-amber-500" />
              )}
              <span className="font-medium">
                {recentTrend.direction === 'up' 
                  ? `Up ${recentTrend.percentage?.toFixed(1) || '0.0'}%` 
                  : recentTrend.direction === 'down' 
                    ? `Down ${recentTrend.percentage?.toFixed(1) || '0.0'}%` 
                    : 'Stable'}
              </span>
            </div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">Predicted Trend</div>
            <div className="flex items-center">
              {futureTrend.direction === 'up' ? (
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              ) : futureTrend.direction === 'down' ? (
                <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
              ) : (
                <LineChartIcon className="h-5 w-5 mr-2 text-amber-500" />
              )}
              <span className="font-medium">
                {futureTrend.direction === 'up' 
                  ? `Up ${futureTrend.percentage?.toFixed(1) || '0.0'}%` 
                  : futureTrend.direction === 'down' 
                    ? `Down ${futureTrend.percentage?.toFixed(1) || '0.0'}%` 
                    : 'Stable'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Time range controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Time Range:</span>
            
            <Button 
              variant={timeRangePast === 6 ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeRangePast(6)}
            >
              6M
            </Button>
            <Button 
              variant={timeRangePast === 12 ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeRangePast(12)}
            >
              1Y
            </Button>
            <Button 
              variant={timeRangePast === 24 ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeRangePast(24)}
            >
              2Y
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant={showAnnotations ? "default" : "outline"} 
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              {showAnnotations ? "Hide Events" : "Show Events"}
            </Button>
          </div>
        </div>
        
        {/* Chart with annotations */}
        <div className="w-full mt-2" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MMM yyyy')} 
                tickMargin={10}
                minTickGap={40}
              />
              <YAxis 
                domain={yDomain} 
                tickCount={6} 
                label={{ 
                  value: 'Sentiment Score', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                  offset: -5
                }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                formatter={(value) => {
                  if (value === 'Historical') return "Historical Data";
                  if (value === 'Prediction') return "AI Prediction";
                  if (value === 'upperBound') return "Confidence (Upper)";
                  if (value === 'lowerBound') return "Confidence (Lower)";
                  return value;
                }}
              />
              
              {/* Reference line for the prediction start */}
              {splitIndex < chartData.length && (
                <ReferenceLine 
                  x={chartData[splitIndex]?.date} 
                  stroke="#888" 
                  strokeDasharray="3 3" 
                  label={{ 
                    value: 'Prediction Start', 
                    position: 'top',
                    style: { fill: '#888', fontSize: 12 }
                  }} 
                />
              )}
              
              {/* Prediction confidence range */}
              {predictionData.length > 0 && showConfidenceIntervals && (
                <Area 
                  type="monotone" 
                  dataKey="upperBound" 
                  stroke="none"
                  fillOpacity={0.1}
                  fill="hsl(var(--primary))"
                />
              )}
              
              {predictionData.length > 0 && showConfidenceIntervals && (
                <Area 
                  type="monotone" 
                  dataKey="lowerBound" 
                  stroke="none"
                  fillOpacity={0.1}
                  fill="hsl(var(--primary))"
                  baseLine={0}
                />
              )}
              
              {/* Historical data visualization based on chart type */}
              {chartType === 'line' && (
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Historical"
                  connectNulls
                  data={historicalData}
                />
              )}
              
              {chartType === 'area' && (
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={0.2}
                  fill="hsl(var(--primary))"
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  activeDot={{ r: 6 }}
                  name="Historical"
                  connectNulls
                  data={historicalData}
                />
              )}
              
              {/* Bar chart for historical data */}
              {chartType === 'bar' && historicalData.map((entry, index) => (
                <Line
                  key={`historical-${index}`}
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={0}
                  dot={{
                    r: 5,
                    fill: 'hsl(var(--primary))',
                    strokeWidth: 0
                  }}
                  activeDot={{ r: 7 }}
                  name="Historical"
                  connectNulls={false}
                  data={[entry]}
                />
              ))}
              
              {/* Prediction data visualization based on chart type */}
              {predictionData.length > 0 && chartType === 'line' && (
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Prediction" 
                  connectNulls
                  data={predictionData}
                />
              )}
              
              {predictionData.length > 0 && chartType === 'area' && (
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={0.1}
                  fill="hsl(var(--primary))"
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  activeDot={{ r: 6 }}
                  name="Prediction" 
                  connectNulls
                  data={predictionData}
                />
              )}
              
              {/* Bar chart for prediction data */}
              {chartType === 'bar' && predictionData.length > 0 && predictionData.map((entry, index) => (
                <Line
                  key={`prediction-${index}`}
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={0}
                  strokeDasharray="5 5"
                  dot={{
                    r: 5,
                    fill: 'hsl(var(--primary))',
                    strokeWidth: 0,
                    strokeDasharray: "3 3"
                  }}
                  activeDot={{ r: 7 }}
                  name="Prediction"
                  connectNulls={false}
                  data={[entry]}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Key insights */}
        {insights.length > 0 && (
          <div className="mt-6 bg-muted/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1 text-primary" />
              Key Insights
            </h4>
            
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm flex items-start">
                  {insight.type === 'peak' && <TrendingUp className="h-4 w-4 mr-2 text-green-500 mt-0.5" />}
                  {insight.type === 'trough' && <TrendingDown className="h-4 w-4 mr-2 text-red-500 mt-0.5" />}
                  {insight.type === 'event' && <Calendar className="h-4 w-4 mr-2 text-amber-500 mt-0.5" />}
                  {insight.type === 'prediction' && <LineChartIcon className="h-4 w-4 mr-2 text-blue-500 mt-0.5" />}
                  <span>{insight.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}