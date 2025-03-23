/**
 * PropertyInsightCard Component
 * 
 * Displays property insights in a card format within chat conversations.
 * This component is designed to be embedded within chat messages when
 * the AI detects a property-related query or provides property information.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Home, MapPin, Ruler, CalendarDays, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Property insight data interface
export interface PropertyInsight {
  propertyId: string;
  address: string;
  price: number;
  priceHistory?: {
    date: string;
    price: number;
  }[];
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize?: string;
  propertyType: string;
  listingStatus: 'active' | 'pending' | 'sold' | 'off-market';
  daysOnMarket?: number;
  neighborhood?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  pricePerSqFt: number;
  comparables?: {
    avgPrice: number;
    avgPricePerSqFt: number;
    avgDaysOnMarket: number;
  };
  valueChange?: {
    percent: number;
    period: '1month' | '3months' | '1year' | '5years';
  };
  tags?: string[];
  highlights?: string[];
  imageUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface PropertyInsightCardProps {
  insight: PropertyInsight;
  className?: string;
  compact?: boolean;
  onViewDetails?: (propertyId: string) => void;
  onViewOnMap?: (coordinates: { lat: number; lng: number }) => void;
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
};

const formatPricePerSqFt = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Property Insight Card Component
 */
const PropertyInsightCard: React.FC<PropertyInsightCardProps> = ({
  insight,
  className,
  compact = false,
  onViewDetails,
  onViewOnMap
}) => {
  const valueChangeColor = insight.valueChange ? 
    insight.valueChange.percent > 0 ? 'text-green-600' : 
    insight.valueChange.percent < 0 ? 'text-red-600' : 'text-slate-600' 
    : '';

  const valueChangeIcon = insight.valueChange ? 
    insight.valueChange.percent > 0 ? <TrendingUp className="h-3 w-3" /> : 
    insight.valueChange.percent < 0 ? <TrendingDown className="h-3 w-3" /> : 
    null 
    : null;

  const statusColors = {
    'active': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'sold': 'bg-blue-100 text-blue-800',
    'off-market': 'bg-slate-100 text-slate-800'
  };

  return (
    <Card className={cn("w-full overflow-hidden shadow-md transition-all border-l-4 border-l-primary", 
      compact ? "max-w-[300px]" : "max-w-md", 
      className
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Home className="h-4 w-4 text-primary" />
              {compact ? `Property at ${insight.address.split(',')[0]}` : 'Property Insight'}
            </CardTitle>
            {!compact && (
              <CardDescription className="text-xs mt-1 truncate">{insight.address}</CardDescription>
            )}
          </div>
          <Badge className={statusColors[insight.listingStatus]}>
            {insight.listingStatus.charAt(0).toUpperCase() + insight.listingStatus.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 pb-2">
        {!compact && insight.imageUrl && (
          <div className="w-full h-32 mb-3 overflow-hidden rounded-md">
            <img 
              src={insight.imageUrl} 
              alt={`Property at ${insight.address}`} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold">{formatPrice(insight.price)}</span>
            {insight.valueChange && (
              <div className={cn("flex items-center text-xs", valueChangeColor)}>
                {valueChangeIcon}
                <span className="ml-1">
                  {insight.valueChange.percent > 0 ? '+' : ''}
                  {insight.valueChange.percent}% in {insight.valueChange.period}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm">{formatPricePerSqFt(insight.pricePerSqFt)}/sqft</span>
            {insight.comparables && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-slate-500 cursor-help">
                      <Info className="h-3 w-3 mr-1" />
                      <span>Comparables</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] p-2">
                    <p className="text-xs">Avg price: {formatPrice(insight.comparables.avgPrice)}</p>
                    <p className="text-xs">Avg price/sqft: {formatPricePerSqFt(insight.comparables.avgPricePerSqFt)}</p>
                    <p className="text-xs">Avg days on market: {insight.comparables.avgDaysOnMarket}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {!compact && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center text-xs">
              <Home className="h-3 w-3 mr-1 text-slate-500" />
              <span>{insight.bedrooms} bed, {insight.bathrooms} bath</span>
            </div>
            <div className="flex items-center text-xs">
              <Ruler className="h-3 w-3 mr-1 text-slate-500" />
              <span>{insight.squareFeet} sqft</span>
            </div>
            <div className="flex items-center text-xs">
              <CalendarDays className="h-3 w-3 mr-1 text-slate-500" />
              <span>Built {insight.yearBuilt}</span>
            </div>
            <div className="flex items-center text-xs">
              {insight.daysOnMarket ? (
                <>
                  <CalendarDays className="h-3 w-3 mr-1 text-slate-500" />
                  <span>{insight.daysOnMarket} days on market</span>
                </>
              ) : insight.lastSaleDate ? (
                <>
                  <DollarSign className="h-3 w-3 mr-1 text-slate-500" />
                  <span>Last sold {new Date(insight.lastSaleDate).toLocaleDateString()}</span>
                </>
              ) : (
                <>
                  <Home className="h-3 w-3 mr-1 text-slate-500" />
                  <span>{insight.propertyType}</span>
                </>
              )}
            </div>
          </div>
        )}

        {compact && (
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="text-xs bg-slate-100 px-2 py-1 rounded-full">
              {insight.bedrooms} bed, {insight.bathrooms} bath
            </div>
            <div className="text-xs bg-slate-100 px-2 py-1 rounded-full">
              {insight.squareFeet} sqft
            </div>
            <div className="text-xs bg-slate-100 px-2 py-1 rounded-full">
              Built {insight.yearBuilt}
            </div>
          </div>
        )}

        {!compact && insight.highlights && insight.highlights.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold mb-1">Highlights</h4>
            <ul className="text-xs pl-4 list-disc">
              {insight.highlights.slice(0, 3).map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}

        {!compact && insight.tags && insight.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {insight.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs py-0 h-5">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-1 flex justify-between bg-slate-50">
        {insight.coordinates && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-8"
            onClick={() => onViewOnMap && onViewOnMap(insight.coordinates!)}
          >
            <MapPin className="h-3 w-3 mr-1" />
            View on Map
          </Button>
        )}
        
        <Button 
          variant="default" 
          size="sm" 
          className="text-xs h-8"
          onClick={() => onViewDetails && onViewDetails(insight.propertyId)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyInsightCard;