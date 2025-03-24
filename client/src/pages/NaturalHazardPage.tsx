/**
 * Natural Hazard Risk Assessment Page
 * 
 * This page displays natural hazard risk assessments for properties,
 * including flood, fire, and earthquake risks with detailed explanations.
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, MapPin, Map, Search, Shield } from 'lucide-react';
import NaturalHazardRiskAssessment from '@/components/hazards/NaturalHazardRiskAssessment';

const NaturalHazardPage: React.FC = () => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('prop-123');
  const [searchAddress, setSearchAddress] = useState<string>('');
  const [searchCoordinates, setSearchCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Sample property options for the demo
  const propertyOptions = [
    { id: 'prop-123', address: '2204 Hill Dr, Grandview, WA 98930' },
    { id: 'prop-456', address: '789 Oak Ln, Sunnyside, WA 98944' },
    { id: 'prop-789', address: '1024 Cedar Rd, Yakima, WA 98901' },
    { id: 'prop-101', address: '4125 Vineyard Way, Prosser, WA 99350' },
  ];

  // Function to handle address search
  const handleAddressSearch = () => {
    if (!searchAddress) return;
    
    // For demo purposes, we'll set some static coordinates near Grandview, WA
    // In a real application, this would use a geocoding service
    setSearchCoordinates({
      latitude: 46.255 + (Math.random() * 0.1),
      longitude: -119.91 + (Math.random() * 0.1)
    });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Helmet>
        <title>Natural Hazard Risk Assessment | IntelligentEstate</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Shield className="mr-2 h-8 w-8" />
            Natural Hazard Risk Assessment
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze property vulnerability to floods, fires, earthquakes and other natural hazards
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Property Selection</CardTitle>
              <CardDescription>
                Select a property or search by address to view hazard risks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Select from your properties
                </label>
                <Select
                  value={selectedPropertyId}
                  onValueChange={(value) => {
                    setSelectedPropertyId(value);
                    setSearchCoordinates(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyOptions.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or search by address
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter an address to search"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={handleAddressSearch}
                  disabled={!searchAddress}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            {searchCoordinates ? (
              <NaturalHazardRiskAssessment
                latitude={searchCoordinates.latitude}
                longitude={searchCoordinates.longitude}
                fullDetailsByDefault={true}
              />
            ) : (
              <NaturalHazardRiskAssessment
                propertyId={selectedPropertyId}
                fullDetailsByDefault={true}
              />
            )}
          </div>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Regional Hazard Information</CardTitle>
              <CardDescription>
                General hazard data for Yakima County, WA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Regional Risk Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Flood Risk</span>
                    <span className="text-sm font-medium">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
                      Moderate (45%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Fire Risk</span>
                    <span className="text-sm font-medium">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-1"></span>
                      Moderate-High (65%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Earthquake Risk</span>
                    <span className="text-sm font-medium">
                      <span className="inline-block h-2 w-2 rounded-full bg-orange-500 mr-1"></span>
                      Moderate (40%)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Historical Hazard Events</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-xs text-blue-700 font-medium">FLOODS</div>
                    <p className="text-sm mt-1">
                      March 2021: Moderate flooding affecting low-lying areas
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-2 rounded">
                    <div className="text-xs text-red-700 font-medium">FIRES</div>
                    <p className="text-sm mt-1">
                      August 2020: Significant wildfire, 500 acres burned
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="text-xs text-orange-700 font-medium">EARTHQUAKES</div>
                    <p className="text-sm mt-1">
                      October 2018: Minor earthquake, minimal structural damage
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Emergency Resources</h3>
                <ul className="space-y-2">
                  <li className="text-sm flex items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2 mt-1.5"></span>
                    <a href="#" className="text-primary hover:underline">
                      Yakima County Emergency Management
                    </a>
                  </li>
                  <li className="text-sm flex items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2 mt-1.5"></span>
                    <a href="#" className="text-primary hover:underline">
                      FEMA Flood Maps
                    </a>
                  </li>
                  <li className="text-sm flex items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2 mt-1.5"></span>
                    <a href="#" className="text-primary hover:underline">
                      Washington DNR Wildfire Resources
                    </a>
                  </li>
                  <li className="text-sm flex items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2 mt-1.5"></span>
                    <a href="#" className="text-primary hover:underline">
                      USGS Earthquake Information
                    </a>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Insurance Information</CardTitle>
              <CardDescription>Insurance options for natural hazards</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Protect your property with appropriate insurance coverage based on local hazard risks.
              </p>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Flood Insurance</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Standard homeowner's policies don't cover flood damage. Consider the National Flood Insurance Program (NFIP).
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Fire Insurance</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ensure your policy adequately covers wildfire damage, especially in high-risk areas.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Earthquake Insurance</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate earthquake policies are typically required as standard coverage often excludes earthquake damage.
                  </p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-4">
                Request Insurance Quote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NaturalHazardPage;