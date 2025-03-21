import React, { useState } from 'react';
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
  ReferenceArea,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format, parseISO, addDays, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { PredictionData, MarketPrediction } from '../../types/real-estate';

// Define a local interface for chart data that maps to our application's PredictionData
interface ChartPredictionData {
  date: string;
  actual?: number;
  predicted: number;
  lowerBound?: number;
  upperBound?: number;
}

interface PredictionChartProps {
  data: MarketPrediction | {
    predictions: ChartPredictionData[];
    confidenceScore: number;
    predictionDate: string; // Date when prediction was made
    metric: string; // Default metric being displayed
    metricLabel: string; // Human-readable label for the metric
  };
  title?: string;
  height?: number;
  className?: string;
  metrics?: Array<{ value: string; label: string; }>;
}

// Available metrics to display
const defaultMetrics = [
  { value: 'medianPrice', label: 'Median Price' },
  { value: 'avgDaysOnMarket', label: 'Avg. Days on Market' },
  { value: 'totalListings', label: 'Total Listings' }
];

// Default empty data structure
const defaultData = {
  predictions: [],
  confidenceScore: 0,
  predictionDate: new Date().toISOString(),
  metric: 'medianPrice',
  metricLabel: 'Median Price'
};

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

// Format date
const formatDate = (dateStr: string) => {
  try {
    const date = parseISO(dateStr);
    return format(date, 'MMM d, yyyy');
  } catch (e) {
    return dateStr;
  }
};

// Get confidence score color
const getConfidenceColor = (score: number): string => {
  if (score >= 0.8) return 'bg-green-500 hover:bg-green-600';
  if (score >= 0.6) return 'bg-yellow-500 hover:bg-yellow-600';
  if (score >= 0.4) return 'bg-orange-500 hover:bg-orange-600';
  return 'bg-red-500 hover:bg-red-600';
};

// Get confidence score label
const getConfidenceLabel = (score: number): string => {
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Medium';
  if (score >= 0.4) return 'Low';
  return 'Very Low';
};

export function PredictionChart({
  data = defaultData,
  title = 'Market Predictions',
  height = 350,
  className = '',
  metrics = defaultMetrics
}: PredictionChartProps) {
  // State for metric selection
  const [selectedMetric, setSelectedMetric] = useState<string>(data.metric);

  // Find the label for the selected metric
  const metricLabel = metrics.find(m => m.value === selectedMetric)?.label || 'Value';

  // Chart config for styling
  const chartConfig = {
    actual: {
      label: 'Actual',
      theme: {
        light: 'rgba(59, 130, 246, 1)',
        dark: 'rgba(59, 130, 246, 1)'
      }
    },
    predicted: {
      label: 'Predicted',
      theme: {
        light: 'rgba(234, 88, 12, 1)',
        dark: 'rgba(234, 88, 12, 1)'
      }
    },
    lowerBound: {
      label: 'Lower Bound',
      theme: {
        light: 'rgba(234, 88, 12, 0.4)',
        dark: 'rgba(234, 88, 12, 0.4)'
      }
    },
    upperBound: {
      label: 'Upper Bound',
      theme: {
        light: 'rgba(234, 88, 12, 0.4)',
        dark: 'rgba(234, 88, 12, 0.4)'
      }
    }
  };

  // Format Y-axis ticks based on metric
  const formatYAxis = (value: number) => {
    if (selectedMetric === 'medianPrice' || selectedMetric === 'averagePrice' || selectedMetric === 'pricePerSqFtAvg') {
      return formatCurrency(value).replace('$', ''); // Shorter for axis
    } else if (selectedMetric === 'avgDaysOnMarket') {
      return `${value}`;
    } else {
      return `${value}`;
    }
  };

  // Format tooltip values based on metric
  const formatTooltipValue = (value: number) => {
    if (selectedMetric === 'medianPrice' || selectedMetric === 'averagePrice' || selectedMetric === 'pricePerSqFtAvg') {
      return formatCurrency(value);
    } else if (selectedMetric === 'avgDaysOnMarket') {
      return `${value} days`;
    } else {
      return `${value}`;
    }
  };

  // Find today's date to mark as reference line
  const today = new Date().toISOString().split('T')[0];

  // Count how many data points have actual values (past data) vs predictions
  const pastDataCount = data.predictions.filter(p => p.actual !== undefined).length;
  const futureDataCount = data.predictions.length - pastDataCount;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="text-md font-medium">{title}</CardTitle>
            {data.predictionDate && (
              <p className="text-xs text-muted-foreground">
                Prediction made {formatDistanceToNow(parseISO(data.predictionDate))} ago
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex gap-2 items-center">
              <Label htmlFor="metric" className="text-xs">Metric:</Label>
              <Select
                value={selectedMetric}
                onValueChange={setSelectedMetric}
              >
                <SelectTrigger id="metric" className="h-8 w-[130px]">
                  <SelectValue placeholder={metricLabel} />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge className={getConfidenceColor(data.confidenceScore)}>
              {getConfidenceLabel(data.confidenceScore)} Confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ChartContainer config={chartConfig}>
            <LineChart data={data.predictions} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatYAxis} 
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
              />
              
              {/* Reference line for today */}
              <ReferenceLine x={today} stroke="#888" strokeDasharray="3 3" label={{ value: 'Today', position: 'insideTopRight' }} />
              
              {/* Confidence interval area */}
              {data.predictions.some(d => d.lowerBound !== undefined && d.upperBound !== undefined) && (
                <ReferenceArea 
                  x1={data.predictions[pastDataCount]?.date} 
                  x2={data.predictions[data.predictions.length-1]?.date}
                  y1={0} 
                  y2={0}
                  label="Confidence Interval" 
                  stroke="none"
                  strokeOpacity={0.3}
                  fill="none"
                />
              )}
              
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name, props) => formatTooltipValue(Number(value))}
                  />
                } 
              />
              <Legend />
              
              {/* Actual data line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="var(--color-actual)"
                activeDot={{ r: 6 }}
                strokeWidth={2}
                connectNulls
              />
              
              {/* Prediction line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="var(--color-predicted)"
                strokeWidth={2}
                activeDot={{ r: 4 }}
                connectNulls
              />
              
              {/* Confidence bounds - only displayed if data is available */}
              {data.predictions.some(d => d.lowerBound !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="var(--color-lowerBound)"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  dot={false}
                  connectNulls
                />
              )}
              
              {data.predictions.some(d => d.upperBound !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="upperBound"
                  stroke="var(--color-upperBound)"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  dot={false}
                  connectNulls
                />
              )}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}