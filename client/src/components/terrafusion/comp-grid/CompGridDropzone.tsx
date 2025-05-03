/**
 * CompGridDropzone Component
 * 
 * Provides dropzones for comparable properties that can accept dragged properties
 * from SmartCompTray. Includes visual confirmation and detailed data logging.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Home, DollarSign, Calendar, Maximize, MapPin, ArrowRightLeft, AlertCircle, Check, X } from 'lucide-react';
import { CompProperty } from './SmartCompTray';
import { useToast } from '@/hooks/use-toast';

interface CompGridDropzoneProps {
  subjectProperty?: CompProperty;
  selectedComps: (CompProperty | null)[];
  onCompAdded: (index: number, comp: CompProperty) => void;
  onCompRemoved: (index: number) => void;
  onRecalculate?: () => void;
  showRecalculateButton?: boolean;
}

const CompGridDropzone: React.FC<CompGridDropzoneProps> = ({
  subjectProperty,
  selectedComps,
  onCompAdded,
  onCompRemoved,
  onRecalculate,
  showRecalculateButton = true
}) => {
  const [activeDropzone, setActiveDropzone] = useState<number | null>(null);
  const { toast } = useToast();

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
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle drag over dropzone
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setActiveDropzone(index);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setActiveDropzone(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setActiveDropzone(null);

    try {
      // Extract the comp property data
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) {
        console.error('No data provided in drag operation');
        return;
      }

      const compData: CompProperty = JSON.parse(jsonData);
      
      // Add the comp to the selected list
      onCompAdded(index, compData);
      
      // Log the comp data for debugging
      console.log(`Comp ${index + 1} added:`, compData);
      
      // Show success toast
      toast({
        title: `Comp ${index + 1} Added`,
        description: `${compData.address} has been added as Comp ${index + 1}`,
      });
      
      // Trigger any ledger logging or other side effects
      // This would connect to a logging service in a real implementation
      logCompSelection(index, compData);
    } catch (error) {
      console.error('Error processing dropped data:', error);
      toast({
        title: 'Error Adding Comp',
        description: 'There was a problem processing the selected property',
        variant: 'destructive',
      });
    }
  };

  // Log comp selection to hypothetical ledger system
  const logCompSelection = (index: number, comp: CompProperty) => {
    // This is a placeholder for actual ledger logging functionality
    console.log('LEDGER LOG: Comp Selection Event', {
      timestamp: new Date().toISOString(),
      user: 'current-user', // Would come from auth context in real app
      action: 'comp_selected',
      compIndex: index,
      compId: comp.id,
      compAddress: comp.address,
      compPrice: comp.price,
      subjectPropertyId: subjectProperty?.id,
      subjectPropertyAddress: subjectProperty?.address
    });
  };

  // Remove a comp
  const handleRemoveComp = (index: number) => {
    onCompRemoved(index);
    toast({
      title: `Comp ${index + 1} Removed`,
      description: `The property has been removed from Comp ${index + 1} position`,
    });
  };

  // Handle recalculation
  const handleRecalculate = () => {
    if (onRecalculate) {
      onRecalculate();
      toast({
        title: 'Recalculating Value',
        description: 'The estimated value is being recalculated based on the selected comps',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Subject Property Card - if provided */}
      {subjectProperty && (
        <div className="mb-6">
          <Card className="bg-primary/5 border-primary">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <div>
                  <CardTitle>Subject Property</CardTitle>
                  <CardDescription>{subjectProperty.address}</CardDescription>
                </div>
                {(selectedComps.filter(Boolean).length > 0) && showRecalculateButton && (
                  <Button 
                    onClick={handleRecalculate}
                    className="tf-button bg-primary hover:bg-primary-hover"
                  >
                    Recalculate Value
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium">Estimated Value</div>
                  <div className="text-xl font-bold">
                    {formatPrice(subjectProperty.price)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Square Feet</div>
                  <div>{subjectProperty.squareFeet.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Bed/Bath</div>
                  <div>{subjectProperty.bedrooms}/{subjectProperty.bathrooms}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Year Built</div>
                  <div>{subjectProperty.yearBuilt}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dropzone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 tf-comp-grid">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              transition-all duration-200 rounded-lg
              ${activeDropzone === index ? 'ring-2 ring-primary ring-opacity-70 tf-pulse' : ''}
            `}
          >
            <Card className="tf-card h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>Comp {index + 1}</span>
                  {selectedComps[index] && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-full"
                      onClick={() => handleRemoveComp(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedComps[index] 
                    ? selectedComps[index]!.address
                    : 'Drag a property here'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 pb-2">
                {selectedComps[index] ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="font-semibold">{formatPrice(selectedComps[index]!.price)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(selectedComps[index]!.saleDate)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Maximize className="h-4 w-4 mr-1" />
                        <span>{selectedComps[index]!.squareFeet.toLocaleString()} sqft</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Home className="h-4 w-4 mr-1" />
                        <span>{selectedComps[index]!.bedrooms} bed / {selectedComps[index]!.bathrooms} bath</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm mt-1">
                      <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedComps[index]!.distance.toFixed(1)} miles away</span>
                    </div>
                    
                    {selectedComps[index]!.adjustedPrice && selectedComps[index]!.price !== selectedComps[index]!.adjustedPrice && (
                      <div className="flex items-center text-sm mt-1">
                        <ArrowRightLeft className="h-4 w-4 mr-1 text-blue-500" />
                        <span>Adjusted: {formatPrice(selectedComps[index]!.adjustedPrice)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 mb-2 opacity-40" />
                    <p className="text-sm text-center">Drag a comparable property here from the list below</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      
      {/* Notification when all comps are filled */}
      {selectedComps.filter(Boolean).length === 3 && (
        <Alert className="mt-4 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All comparable properties have been selected. Click "Recalculate Value" to update the estimated value.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CompGridDropzone;