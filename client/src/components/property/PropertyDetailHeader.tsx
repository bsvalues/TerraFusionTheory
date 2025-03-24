/**
 * PropertyDetailHeader Component
 * 
 * A header component for property detail pages with adaptive styling based on property type.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, Heart, Share, Printer, Map, Download 
} from 'lucide-react';
import { Link } from 'wouter';
import PropertyTypeBadge from './PropertyTypeBadge';
import PropertyIcon from './PropertyIcon';
import { getPropertyColorScheme, getPropertyTypeLabel } from '@/utils/propertyColorSchemes';

interface PropertyDetailHeaderProps {
  property: {
    id: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    price: number;
    status?: 'active' | 'pending' | 'sold' | 'off-market';
    propertyType?: string;
    listingDate?: string;
    daysOnMarket?: number;
    mlsNumber?: string;
  };
  onBack?: () => void;
  className?: string;
}

/**
 * PropertyDetailHeader displays a property header with adaptive styling
 */
export default function PropertyDetailHeader({
  property,
  onBack,
  className = ''
}: PropertyDetailHeaderProps) {
  const { 
    id, 
    address, 
    city, 
    state, 
    zipCode,
    price, 
    status = 'active', 
    propertyType = 'not_specified',
    listingDate,
    daysOnMarket,
    mlsNumber
  } = property;
  
  const colorScheme = getPropertyColorScheme(propertyType);
  
  // Format price with commas
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price);
  
  // Format full address
  const fullAddress = [
    address,
    city && state ? `${city}, ${state}` : city || state,
    zipCode
  ].filter(Boolean).join(' ');
  
  // Status colors
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-red-100 text-red-800',
    'off-market': 'bg-gray-100 text-gray-800'
  };
  
  return (
    <div className={`${className}`}>
      {/* Header with gradient background */}
      <div 
        className="relative py-6 px-4 md:px-6"
        style={{ 
          background: colorScheme.gradient,
          color: colorScheme.text
        }}
      >
        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
        
        <div className="container mx-auto relative">
          <div className="flex flex-col items-start md:items-center md:flex-row md:justify-between">
            {/* Property address and type */}
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <PropertyIcon 
                  propertyType={propertyType}
                  variant="colored"
                  className="text-white"
                />
                <h1 className="text-2xl md:text-3xl font-bold">{address}</h1>
              </div>
              
              {city && (
                <div className="text-lg opacity-90">
                  {[city, state, zipCode].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
            
            {/* Price */}
            <div className="flex flex-col items-end">
              <div className="text-2xl md:text-3xl font-bold">
                {formattedPrice}
              </div>
              
              {/* Status badge */}
              <div className="mt-1">
                <span 
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${status === 'active' ? 'bg-white/30' : 'bg-white/20'}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Property info and action buttons */}
          <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center">
            <div className="flex flex-wrap gap-2 mb-3 md:mb-0">
              <PropertyTypeBadge propertyType={propertyType} size="sm" />
              
              {mlsNumber && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20">
                  MLS# {mlsNumber}
                </span>
              )}
              
              {daysOnMarket !== undefined && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20">
                  {daysOnMarket} {daysOnMarket === 1 ? 'day' : 'days'} on market
                </span>
              )}
              
              {listingDate && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20">
                  Listed {new Date(listingDate).toLocaleDateString()}
                </span>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Heart className="w-4 h-4 mr-1" />
                Save
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation tabs with property-type color */}
      <div 
        className="border-b"
        style={{ borderColor: colorScheme.primary }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <nav className="flex overflow-x-auto">
            {['Overview', 'Details', 'Photos', 'Map', 'Schools', 'Valuation'].map((tab, i) => (
              <a
                key={tab}
                href={`#${tab.toLowerCase()}`}
                className={`
                  whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm 
                  ${i === 0 ? `border-${colorScheme.primary} text-${colorScheme.primary}` : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                style={i === 0 ? { borderColor: colorScheme.primary, color: colorScheme.primary } : {}}
              >
                {tab}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}