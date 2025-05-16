/**
 * Neighborhood Trend Card Component
 * 
 * This component displays neighborhood trends including price changes,
 * inventory levels, and market activity, using animated tooltips.
 */

import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedTrendTooltip, TrendData } from './AnimatedTrendTooltip';
import { 
  Home, 
  DollarSign, 
  Clock, 
  Calendar, 
  BarChart, 
  PieChart,
  ExternalLink
} from 'lucide-react';

interface NeighborhoodMetrics {
  name: string;
  code: string;
  priceChange: number | null;
  pricePerSqFt: number | null;
  daysOnMarket: number | null;
  inventoryChange: number | null;
  salesVolume: number | null;
  salesVolumeChange: number | null;
  medianHomeValue: number | null;
  timeframe?: string;
  updatedAt?: string;
}

interface NeighborhoodTrendCardProps {
  data: NeighborhoodMetrics;
  className?: string;
  onViewDetails?: (neighborhoodCode: string) => void;
}

const NeighborhoodTrendCard: React.FC<NeighborhoodTrendCardProps> = ({
  data,
  className = '',
  onViewDetails
}) => {
  // Prepare trend data objects for each metric
  const priceTrend: TrendData = {
    value: data.medianHomeValue,
    percentChange: data.priceChange,
    label: 'Median Home Price',
    timeframe: data.timeframe || 'Last 12 months',
    isPrice: true
  };
  
  const priceSqFtTrend: TrendData = {
    value: data.pricePerSqFt,
    percentChange: data.priceChange ? data.priceChange * 0.9 : null, // Slightly different trend for variety
    label: 'Price per Square Foot',
    timeframe: data.timeframe || 'Last 12 months',
    unit: '/sqft',
    isPrice: true
  };
  
  const domTrend: TrendData = {
    value: data.daysOnMarket,
    // For DOM, down is good (faster sales)
    percentChange: data.daysOnMarket && data.daysOnMarket > 0 ? -5 : 10,
    label: 'Days on Market',
    timeframe: data.timeframe || 'Last 12 months',
    unit: ' days',
    trendDirection: data.daysOnMarket && data.daysOnMarket < 30 ? 'up' : 'down'
  };
  
  const inventoryTrend: TrendData = {
    value: data.inventoryChange,
    percentChange: data.inventoryChange,
    label: 'Inventory Change',
    timeframe: data.timeframe || 'Last 12 months',
    unit: '%'
  };
  
  const salesVolumeTrend: TrendData = {
    value: data.salesVolume,
    percentChange: data.salesVolumeChange,
    label: 'Sales Volume',
    timeframe: data.timeframe || 'Last 12 months'
  };
  
  // Determine market heat level
  const getMarketHeat = () => {
    // Hot market: prices rising, inventory falling, days on market short
    if (
      (data.priceChange && data.priceChange > 5) && 
      (data.inventoryChange && data.inventoryChange < 0) && 
      (data.daysOnMarket && data.daysOnMarket < 30)
    ) {
      return { label: 'Hot Market', color: 'bg-red-100 text-red-800 border-red-200' };
    }
    
    // Cold market: prices falling or flat, inventory rising, days on market long
    if (
      (data.priceChange && data.priceChange < 0) && 
      (data.inventoryChange && data.inventoryChange > 10) && 
      (data.daysOnMarket && data.daysOnMarket > 60)
    ) {
      return { label: 'Cold Market', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    
    // Balanced market: moderate or stable metrics
    if (
      (data.priceChange && Math.abs(data.priceChange) < 3) && 
      (data.daysOnMarket && data.daysOnMarket >= 30 && data.daysOnMarket <= 60)
    ) {
      return { label: 'Balanced Market', color: 'bg-green-100 text-green-800 border-green-200' };
    }
    
    // Default: mixed signals
    return { label: 'Mixed Market', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  };
  
  const marketHeat = getMarketHeat();
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Home className="h-5 w-5 mr-2 text-primary/70" />
              {data.name}
            </CardTitle>
            <CardDescription>
              Market trends {data.timeframe ? `for ${data.timeframe}` : ''}
            </CardDescription>
          </div>
          <Badge variant="outline" className={marketHeat.color}>
            {marketHeat.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-3">
        {/* Price metrics */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Price Trends</h3>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-primary/70" />
                <span className="text-sm">Median Price</span>
              </div>
              <AnimatedTrendTooltip data={priceTrend} pulseEffect={true} />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <PieChart className="h-4 w-4 mr-1 text-primary/70" />
                <span className="text-sm">Price/SqFt</span>
              </div>
              <AnimatedTrendTooltip
                data={priceSqFtTrend}
                showValue={true}
                showChange={true}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Market activity metrics */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Market Activity</h3>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-primary/70" />
                <span className="text-sm">Days on Market</span>
              </div>
              <AnimatedTrendTooltip
                data={domTrend}
                showValue={true}
                showChange={false}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Home className="h-4 w-4 mr-1 text-primary/70" />
                <span className="text-sm">Inventory</span>
              </div>
              <AnimatedTrendTooltip
                data={inventoryTrend}
                showValue={false}
                showChange={true}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-1 text-primary/70" />
                <span className="text-sm">Sales Volume</span>
              </div>
              <AnimatedTrendTooltip
                data={salesVolumeTrend}
                showValue={false}
                showChange={true}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-primary/70" />
                <span className="text-sm">Updated</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {data.updatedAt 
                  ? new Date(data.updatedAt).toLocaleDateString() 
                  : 'Recently'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => onViewDetails && onViewDetails(data.code)}
        >
          View Detailed Analysis
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NeighborhoodTrendCard;