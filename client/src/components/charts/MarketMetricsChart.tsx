import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { MarketCondition, MarketTrend } from '../../types/real-estate';
import { Badge } from '@/components/ui/badge';

interface MarketMetricsChartProps {
  data: {
    // Core metrics normalized to 0-100 scale for radar chart
    metrics: {
      name: string;
      value: number;
      fullValue: string | number;
    }[];
    // Market condition and trend
    marketCondition: MarketCondition;
    marketTrend: MarketTrend;
  };
  title?: string;
  height?: number;
  className?: string;
  showBadges?: boolean;
}

// Default empty data structure for the component
const defaultData = {
  metrics: [
    { name: 'Affordability', value: 0, fullValue: 0 },
    { name: 'Inventory', value: 0, fullValue: 0 },
    { name: 'Days on Market', value: 0, fullValue: 0 },
    { name: 'Price Growth', value: 0, fullValue: 0 },
    { name: 'Demand', value: 0, fullValue: 0 },
  ],
  marketCondition: MarketCondition.BALANCED,
  marketTrend: MarketTrend.STABLE
};

// Get badge color based on market condition
const getConditionColor = (condition: MarketCondition): string => {
  switch (condition) {
    case MarketCondition.HOT:
      return 'bg-red-500 hover:bg-red-600';
    case MarketCondition.WARM:
      return 'bg-orange-500 hover:bg-orange-600';
    case MarketCondition.BALANCED:
      return 'bg-green-500 hover:bg-green-600';
    case MarketCondition.COOL:
      return 'bg-blue-500 hover:bg-blue-600';
    case MarketCondition.COLD:
      return 'bg-blue-700 hover:bg-blue-800';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

// Get badge color based on market trend
const getTrendColor = (trend: MarketTrend): string => {
  switch (trend) {
    case MarketTrend.UP_STRONG:
      return 'bg-red-500 hover:bg-red-600';
    case MarketTrend.UP_MODERATE:
      return 'bg-orange-500 hover:bg-orange-600';
    case MarketTrend.STABLE:
      return 'bg-green-500 hover:bg-green-600';
    case MarketTrend.DOWN_MODERATE:
      return 'bg-blue-500 hover:bg-blue-600';
    case MarketTrend.DOWN_STRONG:
      return 'bg-blue-700 hover:bg-blue-800';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

// Format trend for display
const formatTrend = (trend: MarketTrend): string => {
  switch (trend) {
    case MarketTrend.UP_STRONG:
      return 'Strong Upward';
    case MarketTrend.UP_MODERATE:
      return 'Moderate Upward';
    case MarketTrend.STABLE:
      return 'Stable';
    case MarketTrend.DOWN_MODERATE:
      return 'Moderate Downward';
    case MarketTrend.DOWN_STRONG:
      return 'Strong Downward';
    default:
      return String(trend);
  }
};

// Format condition for display
const formatCondition = (condition: MarketCondition): string => {
  switch (condition) {
    case MarketCondition.HOT:
      return 'Hot';
    case MarketCondition.WARM:
      return 'Warm';
    case MarketCondition.BALANCED:
      return 'Balanced';
    case MarketCondition.COOL:
      return 'Cool';
    case MarketCondition.COLD:
      return 'Cold';
    default:
      return String(condition);
  }
};

export function MarketMetricsChart({
  data = defaultData,
  title = 'Market Health Metrics',
  height = 350,
  className = '',
  showBadges = true
}: MarketMetricsChartProps) {
  const chartConfig = {
    value: {
      label: 'Value',
      theme: {
        light: 'rgba(16, 185, 129, 0.7)',
        dark: 'rgba(16, 185, 129, 0.7)'
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-md font-medium">{title}</CardTitle>
          {showBadges && (
            <div className="flex gap-2">
              <Badge className={getConditionColor(data.marketCondition)}>
                {formatCondition(data.marketCondition)}
              </Badge>
              <Badge className={getTrendColor(data.marketTrend)}>
                {formatTrend(data.marketTrend)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ChartContainer config={chartConfig}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.metrics}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Market Metrics"
                dataKey="value"
                stroke="var(--color-value)"
                fill="var(--color-value)"
                fillOpacity={0.6}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name, props) => {
                      const dataItem = props.payload;
                      return dataItem.fullValue !== undefined 
                        ? dataItem.fullValue 
                        : value;
                    }}
                  />
                } 
              />
            </RadarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}