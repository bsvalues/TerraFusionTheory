/**
 * PropertyCard Component
 * 
 * A card component that displays property information with the option to add to comparison.
 */
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Icons } from '@/components/ui/icons';
import { useComparison } from '../../context/ComparisonContext';
import { useLocation } from 'wouter';

interface PropertyCardProps {
  property: {
    id: string;
    address: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    propertyType?: string;
    yearBuilt?: number;
    status?: 'For Sale' | 'Pending' | 'Sold' | 'Off Market';
    image?: string;
  };
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export const PropertyCard = ({ 
  property, 
  variant = 'default', 
  className = '' 
}: PropertyCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToComparison, removeFromComparison, isSelected } = useComparison();
  const [_, navigate] = useLocation();
  
  // Format price with commas
  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Get status badge variant
  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'For Sale': return 'default';
      case 'Pending': return 'warning';
      case 'Sold': return 'destructive';
      case 'Off Market': return 'secondary';
      default: return 'default';
    }
  };
  
  // Handle property click
  const handlePropertyClick = () => {
    navigate(`/property/${property.id}`);
  };
  
  // Toggle comparison
  const handleComparisonToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (isSelected(property.id)) {
      removeFromComparison(property.id);
    } else {
      addToComparison({
        id: property.id,
        address: property.address
      });
    }
  };
  
  // Property image with fallback
  const propertyImage = property.image || '/images/property-placeholder.jpg';
  
  // Different layouts based on variant
  if (variant === 'compact') {
    return (
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
        onClick={handlePropertyClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start p-4">
          <div 
            className="w-20 h-20 rounded-md bg-cover bg-center mr-4 flex-shrink-0" 
            style={{ backgroundImage: `url(${propertyImage})` }}
          />
          <div className="flex-1">
            <CardTitle className="text-sm">{property.address}</CardTitle>
            <p className="font-bold text-primary mt-1">{formatPrice(property.price)}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {property.bedrooms && <span className="mr-2">{property.bedrooms} bd</span>}
              {property.bathrooms && <span className="mr-2">{property.bathrooms} ba</span>}
              {property.squareFeet && <span>{property.squareFeet} sqft</span>}
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant={isSelected(property.id) ? "secondary" : "ghost"} 
                  className="h-8 w-8"
                  onClick={handleComparisonToggle}
                >
                  <Icons.comparison className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isSelected(property.id) ? 'Remove from comparison' : 'Add to comparison'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Card>
    );
  }
  
  if (variant === 'featured') {
    return (
      <Card 
        className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${className}`}
        onClick={handlePropertyClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <div 
            className="h-56 w-full bg-cover bg-center" 
            style={{ backgroundImage: `url(${propertyImage})` }}
          />
          {property.status && (
            <Badge 
              variant={getStatusVariant(property.status) as any}
              className="absolute top-4 right-4"
            >
              {property.status}
            </Badge>
          )}
          <div className="absolute bottom-4 right-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant={isSelected(property.id) ? "secondary" : "default"} 
                    className="h-10 w-10 rounded-full"
                    onClick={handleComparisonToggle}
                  >
                    <Icons.comparison className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSelected(property.id) ? 'Remove from comparison' : 'Add to comparison'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <CardContent className="p-4">
          <CardTitle className="text-xl mb-2 line-clamp-1">{property.address}</CardTitle>
          <p className="font-bold text-2xl text-primary">{formatPrice(property.price)}</p>
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            {property.bedrooms && (
              <div className="flex items-center mr-4">
                <Icons.bed className="h-4 w-4 mr-1" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center mr-4">
                <Icons.bath className="h-4 w-4 mr-1" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            {property.squareFeet && (
              <div className="flex items-center">
                <Icons.ruler className="h-4 w-4 mr-1" />
                <span>{property.squareFeet} sqft</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Default variant
  return (
    <Card 
      className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={handlePropertyClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div 
          className="h-44 w-full bg-cover bg-center" 
          style={{ backgroundImage: `url(${propertyImage})` }}
        />
        {property.status && (
          <Badge 
            variant={getStatusVariant(property.status) as any}
            className="absolute top-3 right-3"
          >
            {property.status}
          </Badge>
        )}
        {isHovered && (
          <div className="absolute top-3 left-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant={isSelected(property.id) ? "secondary" : "default"} 
                    className="h-8 w-8"
                    onClick={handleComparisonToggle}
                  >
                    <Icons.comparison className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSelected(property.id) ? 'Remove from comparison' : 'Add to comparison'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <CardTitle className="text-base line-clamp-1">{property.address}</CardTitle>
        <p className="font-bold text-xl text-primary mt-1">{formatPrice(property.price)}</p>
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          {property.bedrooms && <span className="mr-3">{property.bedrooms} bd</span>}
          {property.bathrooms && <span className="mr-3">{property.bathrooms} ba</span>}
          {property.squareFeet && <span>{property.squareFeet} sqft</span>}
        </div>
        {property.propertyType && (
          <p className="text-sm text-muted-foreground mt-1">
            {property.propertyType} {property.yearBuilt ? `· Built ${property.yearBuilt}` : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyCard;