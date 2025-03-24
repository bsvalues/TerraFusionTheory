import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ChevronRight, Lightbulb, TrendingUp, HandCoins, School, MapPin, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Types for the property recommendation
export interface PropertyInsight {
  type: 'investment' | 'market' | 'neighborhood' | 'school' | 'risk' | 'value';
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: string;
  score?: number;
}

export interface PropertyRecommendation {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  imageUrl: string;
  insights: PropertyInsight[];
  matchScore: number;
  tags: string[];
  latitude: number;
  longitude: number;
}

interface PropertyRecommendationCarouselProps {
  userId?: number;
  limit?: number;
  filterByTags?: string[];
  onViewDetails?: (property: PropertyRecommendation) => void;
  onFavorite?: (property: PropertyRecommendation) => void;
}

export function PropertyRecommendationCarousel({ 
  userId, 
  limit = 5, 
  filterByTags, 
  onViewDetails, 
  onFavorite 
}: PropertyRecommendationCarouselProps) {
  const [favoriteProperties, setFavoriteProperties] = useState<Set<string>>(new Set());
  const [activeInsights, setActiveInsights] = useState<Record<string, number>>({});
  
  // Fetch property recommendations
  const { data: recommendations, isLoading, error } = useQuery<PropertyRecommendation[]>({
    queryKey: ['/api/recommendations', userId, limit, filterByTags?.join(',')],
    enabled: true,
  });

  // Toggle favorite status
  const toggleFavorite = (propertyId: string, property: PropertyRecommendation) => {
    setFavoriteProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
    
    if (onFavorite) {
      onFavorite(property);
    }
  };

  // Handle view details click
  const handleViewDetails = (property: PropertyRecommendation) => {
    if (onViewDetails) {
      onViewDetails(property);
    }
  };

  // Cycle through insights for a property
  const cycleInsight = (propertyId: string) => {
    setActiveInsights(prev => {
      const currentIndex = prev[propertyId] || 0;
      const property = recommendations?.find(p => p.id === propertyId);
      const insightsCount = property?.insights.length || 0;
      
      return {
        ...prev,
        [propertyId]: (currentIndex + 1) % Math.max(1, insightsCount)
      };
    });
  };

  // Get icon based on insight type
  const getInsightIcon = (type: PropertyInsight['type']) => {
    switch (type) {
      case 'investment':
        return <TrendingUp className="h-4 w-4" />;
      case 'market':
        return <HandCoins className="h-4 w-4" />;
      case 'neighborhood':
        return <MapPin className="h-4 w-4" />;
      case 'school':
        return <School className="h-4 w-4" />;
      case 'risk':
        return <ShieldCheck className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        <p>Failed to load property recommendations</p>
        <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No property recommendations available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Recommended Properties</h2>
        <Button variant="ghost" size="sm">
          View All <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
      
      <Carousel className="w-full">
        <CarouselContent>
          {recommendations.map((property) => {
            const activeInsightIndex = activeInsights[property.id] || 0;
            const activeInsight = property.insights[activeInsightIndex];
            
            return (
              <CarouselItem key={property.id} className="md:basis-1/2 lg:basis-1/3">
                <Card className="h-full">
                  <div 
                    className="relative h-48 w-full bg-cover bg-center rounded-t-lg"
                    style={{ backgroundImage: `url(${property.imageUrl})` }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      onClick={() => toggleFavorite(property.id, property)}
                    >
                      <Heart 
                        className={`h-5 w-5 ${favoriteProperties.has(property.id) ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                    </Button>
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-primary/90">{formatPrice(property.price)}</Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base truncate">{property.address}</CardTitle>
                    <CardDescription>
                      {property.bedrooms} BD | {property.bathrooms} BA | {property.squareFeet.toLocaleString()} SQFT
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div 
                      className="flex items-start gap-2 p-3 rounded-md bg-muted min-h-[100px] cursor-pointer"
                      onClick={() => cycleInsight(property.id)}
                    >
                      <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                        {activeInsight ? getInsightIcon(activeInsight.type) : <Lightbulb className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {activeInsight ? activeInsight.title : 'No insights available'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {activeInsight ? activeInsight.description : 'Click to see more insights'}
                        </p>
                        {activeInsight?.score && (
                          <div className="mt-1 flex items-center">
                            <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full">
                              <div 
                                className="h-1.5 bg-primary rounded-full" 
                                style={{ width: `${activeInsight.score}%` }}
                              />
                            </div>
                            <span className="ml-2 text-xs font-medium">{activeInsight.score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {property.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {property.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{property.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleViewDetails(property)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </Carousel>
    </div>
  );
}