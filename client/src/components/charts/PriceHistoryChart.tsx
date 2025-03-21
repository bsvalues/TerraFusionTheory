import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface PriceHistoryChartProps {
  data: {
    date: string;
    medianPrice: number;
    averagePrice: number;
    pricePerSqFt?: number;
  }[];
  title?: string;
  showPricePerSqFt?: boolean;
  height?: number;
  className?: string;
}

const defaultData = (daysBack: number = 180) => {
  // This is just a placeholder for the component structure
  // Actual data will come from API calls to the real estate analytics service
  const today = new Date();
  return Array.from({ length: daysBack / 30 }, (_, i) => {
    const date = subDays(today, i * 30);
    return {
      date: format(date, 'yyyy-MM-dd'),
      medianPrice: 0,
      averagePrice: 0,
      pricePerSqFt: 0
    };
  }).reverse();
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch (e) {
    return dateStr;
  }
};

export function PriceHistoryChart({
  data = defaultData(),
  title = 'Price History',
  showPricePerSqFt = true,
  height = 300,
  className = ''
}: PriceHistoryChartProps) {
  const chartConfig = {
    medianPrice: {
      label: 'Median Price',
      color: 'hsl(var(--primary))'
    },
    averagePrice: {
      label: 'Average Price',
      theme: {
        light: 'rgba(234, 179, 8, 0.9)',
        dark: 'rgba(234, 179, 8, 0.9)'
      }
    },
    pricePerSqFt: {
      label: 'Price/SqFt',
      theme: {
        light: 'rgba(16, 185, 129, 0.9)',
        dark: 'rgba(16, 185, 129, 0.9)'
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ChartContainer config={chartConfig}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              {showPricePerSqFt && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `$${value}/sqft`}
                  tick={{ fontSize: 12 }}
                />
              )}
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="medianPrice"
                stroke="var(--color-medianPrice)"
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="averagePrice"
                stroke="var(--color-averagePrice)"
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
              {showPricePerSqFt && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="pricePerSqFt"
                  stroke="var(--color-pricePerSqFt)"
                  strokeWidth={2}
                  activeDot={{ r: 4 }}
                />
              )}
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}