/**
 * PropertyCard Component
 * 
 * A card for displaying property information with adaptive styling based on property type.
 */

import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PropertyTypeBadge from './PropertyTypeBadge';
import PropertyIcon from './PropertyIcon';
import { getPropertyColorScheme, getPropertyTypeLabel } from '@/utils/propertyColorSchemes';

interface PropertyCardProps {
  property: {
    id: string;
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    propertyType?: string;
    yearBuilt?: number;
    photos?: string[];
    listingDate?: string;
  };
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

/**
 * PropertyCard displays property information with styling based on property type
 */
export default function PropertyCard({
  property,
  variant = 'default',
  className = ''
}: PropertyCardProps) {
  const { 
    id, 
    address, 
    price, 
    bedrooms, 
    bathrooms, 
    squareFeet, 
    propertyType = 'not_specified',
    yearBuilt,
    photos,
    listingDate
  } = property;
  
  const colorScheme = getPropertyColorScheme(propertyType);
  
  // Format price with commas
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(price);
  
  // Format square feet with commas
  const formattedSqFt = new Intl.NumberFormat('en-US').format(squareFeet);
  
  return (
    <Card 
      className={`group overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}
      style={{
        borderColor: variant === 'featured' ? colorScheme.primary : undefined,
        borderWidth: variant === 'featured' ? '2px' : undefined
      }}
    >
      {/* Card Header with Property Image */}
      <CardHeader className="p-0 relative">
        <div 
          className="w-full aspect-video bg-gray-200 relative overflow-hidden"
          style={{
            background: photos && photos.length > 0 
              ? `url(${photos[0]}) center/cover no-repeat` 
              : colorScheme.gradient
          }}
        >
          {/* If no photo, show property icon */}
          {(!photos || photos.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <PropertyIcon propertyType={propertyType} size="xl" variant="solid" className="text-white" />
            </div>
          )}
          
          {/* Overlay with property type badge */}
          <div className="absolute top-2 left-2">
            <PropertyTypeBadge propertyType={propertyType} />
          </div>
          
          {/* Price badge */}
          <div 
            className="absolute bottom-0 right-0 py-1 px-3 text-white font-bold"
            style={{ backgroundColor: colorScheme.primary }}
          >
            {formattedPrice}
          </div>
        </div>
      </CardHeader>
      
      {/* Card Content */}
      <CardContent className={variant === 'compact' ? 'p-3' : 'p-4'}>
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{address}</h3>
        
        {/* Property details grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <div className="text-sm text-gray-500">Beds</div>
            <div className="font-medium">{bedrooms}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Baths</div>
            <div className="font-medium">{bathrooms}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Sq Ft</div>
            <div className="font-medium">{formattedSqFt}</div>
          </div>
        </div>
        
        {/* Additional details for non-compact variant */}
        {variant !== 'compact' && yearBuilt && (
          <div className="mt-2 flex justify-between text-sm text-gray-500">
            <span>Built {yearBuilt}</span>
            {listingDate && (
              <span>Listed {new Date(listingDate).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Card Footer */}
      <CardFooter className={`flex justify-between ${variant === 'compact' ? 'p-3 pt-0' : 'p-4 pt-0'}`}>
        <Button
          variant="outline"
          size="sm"
          className="w-1/2"
        >
          Compare
        </Button>
        <Link href={`/property/${id}`}>
          <Button
            size="sm"
            className="w-full"
            style={{
              backgroundColor: colorScheme.primary,
              color: colorScheme.text
            }}
          >
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}