/**
 * Animated Trend Tooltip Component
 * 
 * This component creates animated tooltips for neighborhood trends
 * with smooth transitions and visual enhancements
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronsUp,
  ChevronsDown,
  ArrowUpDown,
  Percent,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define trend types
export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';
export type TrendStrength = 'strong' | 'moderate' | 'weak';
export type TrendData = {
  value: number | null;
  previousValue?: number | null;
  percentChange?: number | null;
  timeframe?: string;
  label?: string;
  trendDirection?: TrendDirection;
  trendStrength?: TrendStrength;
  unit?: string;
  isPrice?: boolean;
};

interface AnimatedTrendTooltipProps {
  data: TrendData;
  className?: string;
  showIcon?: boolean;
  showValue?: boolean;
  showChange?: boolean;
  iconOnly?: boolean;
  pulseEffect?: boolean;
}

export const AnimatedTrendTooltip: React.FC<AnimatedTrendTooltipProps> = ({
  data,
  className = '',
  showIcon = true,
  showValue = true,
  showChange = true,
  iconOnly = false,
  pulseEffect = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Determine trend direction and strength if not provided
  const effectiveDirection = data.trendDirection || 
    (data.percentChange 
      ? data.percentChange > 0 
        ? 'up' 
        : data.percentChange < 0 
          ? 'down' 
          : 'stable'
      : 'stable');
  
  const effectiveStrength = data.trendStrength || 
    (data.percentChange 
      ? Math.abs(data.percentChange) >= 10 
        ? 'strong' 
        : Math.abs(data.percentChange) >= 3 
          ? 'moderate' 
          : 'weak'
      : 'weak');

  // Format the percent change
  const formattedChange = data.percentChange 
    ? `${data.percentChange > 0 ? '+' : ''}${data.percentChange.toFixed(1)}%` 
    : null;

  // Format value based on type
  const formatValue = (val: number | null) => {
    if (val === null) return 'N/A';
    
    if (data.isPrice) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(val);
    }
    
    if (data.unit === '%') {
      return `${val.toFixed(1)}%`;
    }
    
    return data.unit ? `${val}${data.unit}` : val.toString();
  };

  // Get trend icon
  const getTrendIcon = () => {
    switch (effectiveDirection) {
      case 'up':
        return effectiveStrength === 'strong' ? <ChevronsUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />;
      case 'down':
        return effectiveStrength === 'strong' ? <ChevronsDown className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
      case 'volatile':
        return <ArrowUpDown className="h-4 w-4" />;
      case 'stable':
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  // Get color class based on trend
  const getColorClass = () => {
    if (effectiveDirection === 'up') {
      return effectiveStrength === 'strong' ? 'text-green-600' : 'text-green-500';
    }
    if (effectiveDirection === 'down') {
      return effectiveStrength === 'strong' ? 'text-red-600' : 'text-red-500';
    }
    if (effectiveDirection === 'volatile') {
      return 'text-amber-500';
    }
    return 'text-gray-500';
  };

  // Get background color for the tooltip
  const getBgClass = () => {
    if (effectiveDirection === 'up') {
      return 'bg-green-50 border-green-200';
    }
    if (effectiveDirection === 'down') {
      return 'bg-red-50 border-red-200';
    }
    if (effectiveDirection === 'volatile') {
      return 'bg-amber-50 border-amber-200';
    }
    return 'bg-gray-50 border-gray-200';
  };

  // Generate tooltip content
  const tooltipContent = (
    <div className={cn("p-3 rounded-lg border w-60", getBgClass())}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">
          {data.label || 'Trend Analysis'}
        </span>
        <span className={cn("flex items-center gap-1 text-xs font-semibold", getColorClass())}>
          {getTrendIcon()}
          {formattedChange && showChange && formattedChange}
        </span>
      </div>

      {data.value !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Current</span>
            <span className="text-sm font-medium">{formatValue(data.value)}</span>
          </div>
          
          {data.previousValue !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Previous</span>
              <span className="text-sm">{formatValue(data.previousValue)}</span>
            </div>
          )}
          
          {data.timeframe && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Timeframe</span>
              <span className="text-sm">{data.timeframe}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center gap-1 cursor-help",
              className,
              {
                [getColorClass()]: true,
              }
            )}
          >
            {showIcon && (
              <div className="relative">
                <motion.div
                  animate={
                    pulseEffect && effectiveStrength === 'strong' 
                      ? { scale: [1, 1.15, 1] } 
                      : {}
                  }
                  transition={{ 
                    repeat: pulseEffect && effectiveStrength === 'strong' ? Infinity : 0, 
                    duration: 1.5,
                    repeatType: "loop"
                  }}
                >
                  {getTrendIcon()}
                </motion.div>
              </div>
            )}
            
            {!iconOnly && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${data.value}-${data.percentChange}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1"
                >
                  {showValue && data.value !== null && (
                    <span className="text-sm font-medium">
                      {formatValue(data.value)}
                    </span>
                  )}
                  
                  {showChange && formattedChange && (
                    <span className="text-xs font-medium">
                      {formattedChange}
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent asChild>
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              }}
            >
              {tooltipContent}
            </motion.div>
          </AnimatePresence>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AnimatedTrendTooltip;