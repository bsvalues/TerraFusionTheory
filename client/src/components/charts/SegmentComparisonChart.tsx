import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Property segment types
type SegmentType = 'propertyType' | 'priceRange' | 'neighborhood';

// Segment data structure
interface SegmentData {
  name: string;
  totalListings: number;
  medianPrice: number;
  avgDaysOnMarket: number;
  [key: string]: number | string;
}

interface SegmentComparisonChartProps {
  data: {
    segments: {
      [type in SegmentType]: SegmentData[];
    };
  };
  title?: string;
  height?: number;
  className?: string;
}

// Default empty data structure
const defaultData = {
  segments: {
    propertyType: [
      { name: 'Single Family', totalListings: 0, medianPrice: 0, avgDaysOnMarket: 0 },
      { name: 'Condo', totalListings: 0, medianPrice: 0, avgDaysOnMarket: 0 }
    ],
    priceRange: [
      { name: 'Under $300k', totalListings: 0, medianPrice: 0, avgDaysOnMarket: 0 },
      { name: '$300k-$500k', totalListings: 0, medianPrice: 0, avgDaysOnMarket: 0 }
    ],
    neighborhood: [
      { name: 'Downtown', totalListings: 0, medianPrice: 0, avgDaysOnMarket: 0 },
      { name: 'Suburbs', totalListings: 0, medianPrice: 0, avgDaysOnMarket: 0 }
    ]
  }
};

// Format options for the select
const segmentOptions: { value: SegmentType; label: string; }[] = [
  { value: 'propertyType', label: 'Property Type' },
  { value: 'priceRange', label: 'Price Range' },
  { value: 'neighborhood', label: 'Neighborhood' }
];

// Format options for the metric select
const metricOptions: { value: string; label: string; }[] = [
  { value: 'medianPrice', label: 'Median Price' },
  { value: 'totalListings', label: 'Total Listings' },
  { value: 'avgDaysOnMarket', label: 'Avg. Days on Market' }
];

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

// Format number with commas
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

export function SegmentComparisonChart({
  data = defaultData,
  title = 'Market Segment Comparison',
  height = 350,
  className = ''
}: SegmentComparisonChartProps) {
  // State for segment type and metric selection
  const [segmentType, setSegmentType] = useState<SegmentType>('propertyType');
  const [selectedMetric, setSelectedMetric] = useState<string>('medianPrice');

  // Chart config for styling
  const chartConfig = {
    [selectedMetric]: {
      label: metricOptions.find(option => option.value === selectedMetric)?.label || selectedMetric,
      theme: {
        light: 'rgba(16, 185, 129, 0.8)',
        dark: 'rgba(16, 185, 129, 0.8)'
      }
    }
  };

  // Format tooltip values based on metric
  const formatTooltipValue = (value: number) => {
    if (selectedMetric === 'medianPrice') {
      return formatCurrency(value);
    } else if (selectedMetric === 'avgDaysOnMarket') {
      return `${value} days`;
    } else {
      return formatNumber(value);
    }
  };

  // Format Y-axis ticks based on metric
  const formatYAxis = (value: number) => {
    if (selectedMetric === 'medianPrice') {
      return formatCurrency(value).replace('$', ''); // Shorter for axis
    } else if (selectedMetric === 'avgDaysOnMarket') {
      return `${value}`;
    } else {
      return formatNumber(value);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-md font-medium">{title}</CardTitle>
          <div className="flex gap-2 items-center">
            <div className="flex gap-2 items-center">
              <Label htmlFor="segment-type" className="text-xs">Segment:</Label>
              <Select
                value={segmentType}
                onValueChange={(value) => setSegmentType(value as SegmentType)}
              >
                <SelectTrigger id="segment-type" className="h-8 w-[130px]">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  {segmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 items-center">
              <Label htmlFor="metric" className="text-xs">Metric:</Label>
              <Select
                value={selectedMetric}
                onValueChange={setSelectedMetric}
              >
                <SelectTrigger id="metric" className="h-8 w-[130px]">
                  <SelectValue placeholder="Median Price" />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ChartContainer config={chartConfig}>
            <BarChart data={data.segments[segmentType]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis 
                tickFormatter={formatYAxis} 
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name, props) => formatTooltipValue(Number(value))}
                  />
                } 
              />
              <Legend />
              <Bar 
                dataKey={selectedMetric} 
                fill={`var(--color-${selectedMetric})`}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}