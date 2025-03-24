import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import {
  NameType,
  ValueType
} from 'recharts/types/component/DefaultTooltipContent';

interface AreaChartProps {
  data: Record<string, any>[];
  categories: string[];
  index: string;
  colors?: Record<string, string>;
  valueFormatter?: (value: number) => string;
  categoryNames?: Record<string, string>;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  yAxisWidth?: number;
  height?: number | string;
}

export function AreaChart({
  data,
  categories,
  index,
  colors = {
    cod: 'hsl(12, 80%, 61%)',
    prd: 'hsl(204, 80%, 50%)',
    prb: 'hsl(49, 80%, 61%)',
    medianRatio: 'hsl(142, 70%, 49%)'
  },
  valueFormatter = (value: number) => `${value}`,
  categoryNames = {},
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  yAxisWidth = 50,
  height = '100%'
}: AreaChartProps) {
  // Maps category names to display names
  const getCategoryName = (category: string) => {
    return categoryNames[category] || category;
  };

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
    label
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-xs">
          <p className="font-medium mb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={`tooltip-${index}`} className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">
                  {getCategoryName(entry.name as string)}:
                </span>
                <span>
                  {valueFormatter(entry.value as number)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
        )}
        
        {showXAxis && (
          <XAxis
            dataKey={index}
            fontSize={12}
            axisLine={{ stroke: 'hsl(var(--muted))' }}
            tickLine={{ stroke: 'hsl(var(--muted))' }}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
        )}
        
        {showYAxis && (
          <YAxis
            width={yAxisWidth}
            fontSize={12}
            axisLine={{ stroke: 'hsl(var(--muted))' }}
            tickLine={{ stroke: 'hsl(var(--muted))' }}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={valueFormatter}
          />
        )}
        
        {showTooltip && (
          <Tooltip content={<CustomTooltip />} />
        )}
        
        {showLegend && (
          <Legend
            verticalAlign="top"
            height={36}
            fontSize={12}
            formatter={(value) => getCategoryName(value)}
          />
        )}
        
        {categories.map((category, index) => (
          <Area
            key={`area-${category}`}
            type="monotone"
            dataKey={category}
            stackId={index + 1}
            stroke={colors[category] || `hsl(${(index * 50) % 360}, 80%, 50%)`}
            fill={colors[category] || `hsl(${(index * 50) % 360}, 80%, 50%)`}
            fillOpacity={0.3}
            activeDot={{ r: 5 }}
            name={category}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}