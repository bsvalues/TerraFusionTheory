import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PropertyEnrichmentWidget from "../components/property/PropertyEnrichmentWidget";

const PropertyEnrichmentDemo: React.FC = () => {
  const [address, setAddress] = useState("2204 Hill Dr, Grandview, WA 98930");
  const [state, setState] = useState("53"); // WA state FIPS code
  const [county, setCounty] = useState("077"); // Yakima county FIPS code
  
  // Sample properties from Grandview, WA area
  const sampleProperties = [
    { 
      address: "2204 Hill Dr, Grandview, WA 98930",
      state: "53", // WA state FIPS code
      county: "077" // Yakima county FIPS code
    },
    { 
      address: "412 Avenue F, Grandview, WA 98930",
      state: "53", 
      county: "077"
    },
    {
      address: "601 E Wine Country Rd, Grandview, WA 98930",
      state: "53", 
      county: "077"
    }
  ];

  const handleSamplePropertySelect = (property: typeof sampleProperties[0]) => {
    setAddress(property.address);
    setState(property.state);
    setCounty(property.county);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">External Data Integration Demo</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select a Property</CardTitle>
              <CardDescription>
                Choose a sample property or enter details manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Enter property address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State FIPS Code</Label>
                  <Input 
                    id="state" 
                    value={state} 
                    onChange={(e) => setState(e.target.value)} 
                    placeholder="State FIPS code (e.g., 53 for WA)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="county">County FIPS Code</Label>
                  <Input 
                    id="county" 
                    value={county} 
                    onChange={(e) => setCounty(e.target.value)} 
                    placeholder="County FIPS code (e.g., 077 for Yakima)"
                  />
                </div>
                
                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-2">Sample Properties</h3>
                  <div className="space-y-2">
                    {sampleProperties.map((property, index) => (
                      <Button 
                        key={index} 
                        variant="outline" 
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleSamplePropertySelect(property)}
                      >
                        {property.address}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>About External Data Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This demo showcases our integration with external data sources:
                </p>
                <ul className="list-disc pl-4 mt-2 text-sm text-muted-foreground space-y-1">
                  <li>Weather data for current conditions</li>
                  <li>Climate patterns for seasonal trends</li>
                  <li>Demographic information from census data</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  These enrichment data points provide valuable context for real estate 
                  analysis and can significantly enhance property valuation models.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <PropertyEnrichmentWidget 
            address={address}
            state={state}
            county={county}
          />
          
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Impact on Property Valuation</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  External data sources provide critical context for property valuation:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>
                    <strong>Weather and Climate:</strong> Properties in areas with mild 
                    climates and lower extreme weather risks typically command higher values.
                  </li>
                  <li>
                    <strong>Demographics:</strong> Neighborhood factors like median income, 
                    education levels, and population growth correlate strongly with property 
                    appreciation rates.
                  </li>
                  <li>
                    <strong>Housing Metrics:</strong> Area-specific data on homeownership 
                    rates, median home values, and rent prices provide direct market comparables.
                  </li>
                </ul>
                <p className="mt-4">
                  Our advanced analytics engine incorporates these external data points into 
                  valuation models, producing more accurate and context-aware property assessments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyEnrichmentDemo;