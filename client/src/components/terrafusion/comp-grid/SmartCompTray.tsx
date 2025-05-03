/**
 * SmartCompTray Component
 * 
 * Draggable comparable property cards that carry intelligence payload as JSON.
 * Part of the TerraFusion drag-and-drop comp selection system.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, DollarSign, Calendar, Maximize, MapPin, ArrowRightLeft } from 'lucide-react';

// Define the comp property type
export interface CompProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  saleDate: string;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: string;
  distance: number; // distance in miles from subject property
  adjustedPrice?: number;
  confidence?: number; // confidence score (0-100)
  similarities?: {
    location: number;
    size: number;
    features: number;
    condition: number;
    overall: number;
  };
  image?: string;
}

interface SmartCompTrayProps {
  properties: CompProperty[];
  subjectProperty?: CompProperty;
  onCompSelected?: (comp: CompProperty) => void;
}

const SmartCompTray: React.FC<SmartCompTrayProps> = ({ 
  properties, 
  subjectProperty,
  onCompSelected 
}) => {
  const [draggedComp, setDraggedComp] = useState<CompProperty | null>(null);

  // Start dragging
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, comp: CompProperty) => {
    // Set data for the drag operation - stringify the whole comp object
    e.dataTransfer.setData('application/json', JSON.stringify(comp));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Store which comp is being dragged for UI effects
    setDraggedComp(comp);
    
    // If available, set a drag image
    if (comp.image) {
      const img = new Image();
      img.src = comp.image;
      e.dataTransfer.setDragImage(img, 0, 0);
    }
  };

  // End dragging
  const handleDragEnd = () => {
    setDraggedComp(null);
  };

  // Format price for display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate the confidence color based on confidence score
  const getConfidenceColor = (confidence: number = 0): string => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-green-400';
    if (confidence >= 40) return 'bg-yellow-400';
    if (confidence >= 20) return 'bg-orange-400';
    return 'bg-red-500';
  };

  return (
    <div className="tf-smart-comp-tray">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((comp) => (
          <div
            key={comp.id}
            draggable
            onDragStart={(e) => handleDragStart(e, comp)}
            onDragEnd={handleDragEnd}
            className={`transition-all duration-200 cursor-grab ${
              draggedComp?.id === comp.id ? 'opacity-50 scale-95' : 'opacity-100'
            }`}
          >
            <Card className="tf-card h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold">{comp.address}</CardTitle>
                  {comp.confidence !== undefined && (
                    <Badge className={`${getConfidenceColor(comp.confidence)} text-white`}>
                      {comp.confidence}% Match
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {comp.city}, {comp.state} {comp.zipCode}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 pb-2">
                <div className="flex flex-col space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="font-semibold">{formatPrice(comp.price)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(comp.saleDate)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Maximize className="h-4 w-4 mr-1" />
                      <span>{comp.squareFeet.toLocaleString()} sqft</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Home className="h-4 w-4 mr-1" />
                      <span>{comp.bedrooms} bed / {comp.bathrooms} bath</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-muted-foreground">{comp.distance.toFixed(1)} miles away</span>
                  </div>
                  
                  {comp.adjustedPrice && comp.price !== comp.adjustedPrice && (
                    <div className="flex items-center text-sm mt-1">
                      <ArrowRightLeft className="h-4 w-4 mr-1 text-blue-500" />
                      <span>Adjusted: {formatPrice(comp.adjustedPrice)}</span>
                    </div>
                  )}
                  
                  {comp.similarities && (
                    <div className="grid grid-cols-4 gap-1 mt-2">
                      {Object.entries(comp.similarities).map(([key, value]) => 
                        key !== 'overall' && (
                          <div key={key} className="flex flex-col items-center">
                            <div className="text-xs text-muted-foreground mb-1 capitalize">{key}</div>
                            <div className="w-full bg-muted rounded-full h-1">
                              <div 
                                className="bg-primary h-1 rounded-full" 
                                style={{ width: `${value * 100}%` }} 
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  className="w-full justify-center text-sm h-8 mt-1"
                  onClick={() => onCompSelected && onCompSelected(comp)}
                >
                  Select Comp
                </Button>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
      
      {properties.length === 0 && (
        <div className="flex items-center justify-center p-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No comparable properties available</p>
        </div>
      )}
    </div>
  );
};

export default SmartCompTray;