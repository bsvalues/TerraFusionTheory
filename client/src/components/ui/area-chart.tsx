import React from 'react';
import { BarChart, FileBarChart } from 'lucide-react';

interface AreaChartProps {
  data?: any[];
  xField?: string;
  yField?: string;
  title?: string;
  description?: string;
  className?: string;
  height?: number;
}

/**
 * A simple area chart component that uses mock data
 * This is a placeholder that can be replaced with an actual charting library
 */
export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xField,
  yField,
  title,
  description,
  className,
  height = 200
}) => {
  return (
    <div 
      className={`h-[${height}px] bg-muted rounded-md flex items-center justify-center ${className || ''}`}
      style={{ height: `${height}px` }}
    >
      <div className="text-center">
        <FileBarChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <div className="text-sm font-medium">{title || 'Chart Data'}</div>
        <div className="text-xs text-muted-foreground">{description || 'Sample visualization'}</div>
      </div>
    </div>
  );
};