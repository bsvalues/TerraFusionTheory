import React, { useState } from 'react';
import { TerraFusionUXLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { 
  SmartCompTray, 
  CompGridDropzone, 
  CompProperty,
  CompImpactVisualizer 
} from '@/components/terrafusion/comp-grid';
import { useToast } from '@/hooks/use-toast';

export default function ComparisonGridPage() {
  const { toast } = useToast();
  const [selectedComps, setSelectedComps] = useState<(CompProperty | null)[]>([null, null, null]);
  const [selectedCompIndex, setSelectedCompIndex] = useState<number | null>(null);
  
  // Mock subject property
  const subjectProperty: CompProperty = {
    id: 'subject-001',
    address: '2204 Hill Drive',
    city: 'Grandview',
    state: 'WA',
    zipCode: '98930',
    price: 425000,
    saleDate: '2025-04-15',
    squareFeet: 2450,
    bedrooms: 4,
    bathrooms: 2.5,
    yearBuilt: '1998',
    distance: 0,
  };
  
  // Mock comparable properties
  const comparableProperties: CompProperty[] = [
    {
      id: 'comp-001',
      address: '124 Oak Street',
      city: 'Grandview',
      state: 'WA',
      zipCode: '98930',
      price: 435000,
      saleDate: '2025-03-05',
      squareFeet: 2300,
      bedrooms: 4,
      bathrooms: 2.5,
      yearBuilt: '1995',
      distance: 0.8,
      confidence: 92,
      similarities: {
        location: 0.95,
        size: 0.90,
        features: 0.89,
        condition: 0.87,
        overall: 0.92
      }
    },
    {
      id: 'comp-002',
      address: '229 Maple Drive',
      city: 'Grandview',
      state: 'WA',
      zipCode: '98930',
      price: 429000,
      saleDate: '2024-12-18',
      squareFeet: 2250,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: '1996',
      distance: 1.2,
      confidence: 85,
      similarities: {
        location: 0.88,
        size: 0.86,
        features: 0.80,
        condition: 0.82,
        overall: 0.85
      }
    },
    {
      id: 'comp-003',
      address: '782 Elm Court',
      city: 'Grandview',
      state: 'WA',
      zipCode: '98930',
      price: 447500,
      saleDate: '2025-04-01',
      squareFeet: 2480,
      bedrooms: 4,
      bathrooms: 3,
      yearBuilt: '1999',
      distance: 0.5,
      confidence: 90,
      similarities: {
        location: 0.93,
        size: 0.96,
        features: 0.85,
        condition: 0.90,
        overall: 0.90
      }
    },
    {
      id: 'comp-004',
      address: '1506 Cedar Avenue',
      city: 'Grandview',
      state: 'WA',
      zipCode: '98930',
      price: 410000,
      saleDate: '2025-02-10',
      squareFeet: 2100,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: '1997',
      distance: 1.5,
      confidence: 78,
      similarities: {
        location: 0.80,
        size: 0.75,
        features: 0.82,
        condition: 0.78,
        overall: 0.78
      }
    },
    {
      id: 'comp-005',
      address: '478 Spruce Lane',
      city: 'Grandview',
      state: 'WA',
      zipCode: '98930',
      price: 452000,
      saleDate: '2025-03-20',
      squareFeet: 2600,
      bedrooms: 5,
      bathrooms: 3,
      yearBuilt: '2000',
      distance: 0.7,
      confidence: 82,
      similarities: {
        location: 0.88,
        size: 0.75,
        features: 0.86,
        condition: 0.84,
        overall: 0.82
      }
    },
    {
      id: 'comp-006',
      address: '901 Pine Street',
      city: 'Grandview',
      state: 'WA',
      zipCode: '98930',
      price: 415000,
      saleDate: '2025-01-05',
      squareFeet: 2200,
      bedrooms: 4,
      bathrooms: 2,
      yearBuilt: '1994',
      distance: 1.8,
      confidence: 75,
      similarities: {
        location: 0.70,
        size: 0.82,
        features: 0.79,
        condition: 0.73,
        overall: 0.75
      }
    }
  ];
  
  // Handle adding a comp to the selected list
  const handleCompAdded = (index: number, comp: CompProperty) => {
    const newComps = [...selectedComps];
    newComps[index] = comp;
    setSelectedComps(newComps);
    setSelectedCompIndex(index); // Select this comp to show its impact
  };
  
  // Handle removing a comp from the selected list
  const handleCompRemoved = (index: number) => {
    const newComps = [...selectedComps];
    newComps[index] = null;
    setSelectedComps(newComps);
    
    // If the selected comp was removed, clear the selection or select another comp
    if (selectedCompIndex === index) {
      const nextComp = selectedComps.findIndex((comp, i) => i !== index && comp !== null);
      setSelectedCompIndex(nextComp !== -1 ? nextComp : null);
    }
  };
  
  // Handle selecting a comp to view its impact
  const handleSelectCompForImpact = (index: number) => {
    setSelectedCompIndex(index);
  };
  
  // Handle recalculation
  const handleRecalculate = () => {
    // This would connect to an API in a real implementation
    console.log('Recalculating with comps:', selectedComps);
    
    // Simulate a recalculation delay
    setTimeout(() => {
      toast({
        title: 'Value Recalculated',
        description: 'Based on your selected comps, the estimated value is now $435,000.',
      });
    }, 1500);
  };

  // The form content for our layout
  const formContent = (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Select Comparable Properties</h2>
      <p className="text-muted-foreground">
        Drag properties from the tray below to the comparison grid to select your top comparable properties.
      </p>
      
      <CompGridDropzone
        subjectProperty={subjectProperty}
        selectedComps={selectedComps}
        onCompAdded={handleCompAdded}
        onCompRemoved={handleCompRemoved}
        onCompSelected={handleSelectCompForImpact}
        selectedCompIndex={selectedCompIndex}
        onRecalculate={handleRecalculate}
      />
      
      {/* Show the Impact Visualizer if a comp is selected */}
      {selectedCompIndex !== null && selectedComps[selectedCompIndex] && (
        <div className="mt-6 tf-viz-fade-in">
          <h3 className="text-lg font-medium mb-4">Value Impact Analysis</h3>
          <CompImpactVisualizer
            compProperty={selectedComps[selectedCompIndex]!}
            subjectProperty={subjectProperty}
          />
        </div>
      )}
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Available Comparable Properties</h3>
        <SmartCompTray
          properties={comparableProperties}
          subjectProperty={subjectProperty}
          onCompSelected={(comp) => {
            // Find first empty slot
            const emptyIndex = selectedComps.findIndex(comp => comp === null);
            if (emptyIndex !== -1) {
              handleCompAdded(emptyIndex, comp);
            } else {
              toast({
                title: 'All Slots Filled',
                description: 'Please remove a comparison property before adding a new one.',
              });
            }
          }}
        />
      </div>
    </div>
  );
  
  // The agent feed content for our layout
  const agentFeed = (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-md">
        <h3 className="text-lg font-medium text-green-800 mb-2">AI Assistant Recommendations</h3>
        <p className="text-sm text-green-700 mb-3">
          Based on our analysis of the subject property at 2204 Hill Drive, I recommend considering these factors:
        </p>
        <ul className="space-y-2 text-sm text-green-700">
          <li className="flex">
            <span className="mr-2">•</span>
            <span>Properties built between 1995-2000 will require fewer adjustments</span>
          </li>
          <li className="flex">
            <span className="mr-2">•</span>
            <span>Focus on homes within 1 mile for best location comparability</span>
          </li>
          <li className="flex">
            <span className="mr-2">•</span>
            <span>Properties with 4 bedrooms and 2+ bathrooms match the subject best</span>
          </li>
          <li className="flex">
            <span className="mr-2">•</span>
            <span>Recent sales (last 3 months) will provide the most accurate market conditions</span>
          </li>
        </ul>
      </div>
      
      <div className="border rounded-md p-4">
        <h3 className="text-lg font-medium mb-2">Market Insights</h3>
        <p className="text-sm text-muted-foreground mb-3">
          The Grandview, WA market has shown a 5.2% appreciation over the past 12 months. 
          Properties in this neighborhood typically sell within 3% of list price.
        </p>
      </div>
      
      <div className="border rounded-md p-4">
        <h3 className="text-lg font-medium mb-2">Activity Log</h3>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-muted/30 rounded">
            <div className="font-medium">Comp Selection</div>
            <div className="text-muted-foreground">You added 124 Oak Street as Comp 1</div>
            <div className="text-xs text-muted-foreground">Just now</div>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <div className="font-medium">Property Viewed</div>
            <div className="text-muted-foreground">You viewed details for 2204 Hill Drive</div>
            <div className="text-xs text-muted-foreground">5 minutes ago</div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Header actions
  const headerActions = (
    <div className="flex gap-2">
      <Button variant="outline" asChild className="tf-button-secondary">
        <Link href="/properties">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </Button>
    </div>
  );
  
  return (
    <TerraFusionUXLayout
      title="Comparable Property Selection"
      backLink="/parcel/123"
      backText="Subject Property"
      layout="form-dominant"
      fluid={false}
      headerActions={headerActions}
      formContent={formContent}
      agentFeed={agentFeed}
    />
  );
}