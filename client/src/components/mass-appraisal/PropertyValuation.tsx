import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useQuery } from '@tanstack/react-query';
import { Search, Home, MapPin, Calendar, DollarSign, FileText, Calculator } from 'lucide-react';

interface Model {
  id: string;
  name: string;
  type: string;
  propertyType: string;
}

interface PropertyValuationProps {
  models?: Model[];
}

const PropertyValuation: React.FC<PropertyValuationProps> = ({ models = [] }) => {
  const [propertyId, setPropertyId] = useState('');
  const [address, setAddress] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [isSearching, setIsSearching] = useState(false);

  // Query for property data when propertyId is set
  const { data: propertyData, isLoading } = useQuery({
    queryKey: ['/api/mass-appraisal/property', propertyId],
    enabled: !!propertyId && propertyId.length > 3,
  });

  // Query for valuation result when property data and model are selected
  const { data: valuationResult, isLoading: isValuationLoading } = useQuery({
    queryKey: ['/api/mass-appraisal/valuation', propertyId, selectedModelId],
    enabled: !!propertyData && !!selectedModelId,
  });

  const handlePropertySearch = () => {
    if (!address.trim()) return;
    
    setIsSearching(true);
    // Simulate address search with a timeout
    setTimeout(() => {
      setPropertyId('PROP12345'); // This would be set by the real search
      setIsSearching(false);
      setActiveTab('property');
    }, 1000);
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search Property</TabsTrigger>
          <TabsTrigger value="property" disabled={!propertyData}>Property Details</TabsTrigger>
          <TabsTrigger value="valuation" disabled={!valuationResult}>Valuation Result</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Find a Property</CardTitle>
              <CardDescription>
                Search by address, parcel ID, or owner name to find a property for valuation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="address-search">Property Address</Label>
                    <div className="flex mt-1">
                      <Input
                        id="address-search"
                        placeholder="Enter address or parcel ID"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="rounded-r-none"
                      />
                      <Button 
                        onClick={handlePropertySearch} 
                        className="rounded-l-none"
                        disabled={isSearching || !address.trim()}
                      >
                        {isSearching ? <Spinner className="h-4 w-4 mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                        Search
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="font-medium mb-2">Recent Properties</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['2204 Hill Dr, Grandview, WA 98930', '1234 Main St, Grandview, WA 98930', '567 Oak Ave, Grandview, WA 98930', '890 Pine Rd, Grandview, WA 98930'].map((addr, idx) => (
                      <Button 
                        key={idx} 
                        variant="outline" 
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => {
                          setAddress(addr);
                          handlePropertySearch();
                        }}
                      >
                        <Home className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{addr}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="property">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                  <CardDescription>
                    Details about the selected property for valuation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Address</Label>
                      <div className="font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {address}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Parcel ID</Label>
                      <div className="font-medium">PROP12345</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Year Built</Label>
                      <div className="font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        1985
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Last Sale Price</Label>
                      <div className="font-medium flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        $225,000
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Last Sale Date</Label>
                      <div className="font-medium">06/15/2018</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Land Value</Label>
                      <div className="font-medium">$65,000</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Building Value</Label>
                      <div className="font-medium">$162,000</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Total Value</Label>
                      <div className="font-medium">$227,000</div>
                    </div>
                    
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-muted-foreground">Property Class</Label>
                      <div className="font-medium">Single Family Residential (R1)</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Building Area</Label>
                      <div className="font-medium">1,850 sq ft</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Lot Size</Label>
                      <div className="font-medium">0.25 acres</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Bedrooms</Label>
                      <div className="font-medium">3</div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-muted-foreground">Bathrooms</Label>
                      <div className="font-medium">2.5</div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-2">
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      View Assessment Record
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Value Estimation</CardTitle>
                  <CardDescription>
                    Apply a valuation model to this property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="model-select">Select Valuation Model</Label>
                      <Select 
                        value={selectedModelId} 
                        onValueChange={handleModelSelect}
                      >
                        <SelectTrigger id="model-select">
                          <SelectValue placeholder="Choose a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      className="w-full" 
                      disabled={!selectedModelId || isValuationLoading}
                      onClick={() => setActiveTab('valuation')}
                    >
                      {isValuationLoading ? (
                        <Spinner className="h-4 w-4 mr-2" />
                      ) : (
                        <Calculator className="h-4 w-4 mr-2" />
                      )}
                      Calculate Value
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="valuation">
          <Card>
            <CardHeader>
              <CardTitle>Property Valuation Results</CardTitle>
              <CardDescription>
                Value estimated using selected model with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h3 className="text-xl font-bold mb-1">$246,800</h3>
                  <p className="text-muted-foreground mb-4">Estimated Value (95% Confidence Interval: $233,500 - $258,200)</p>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Value by Approach</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-secondary/40 p-4 rounded-lg text-center">
                          <div className="text-lg font-bold">$245,000</div>
                          <div className="text-xs text-muted-foreground">Sales Comparison</div>
                        </div>
                        <div className="bg-secondary/40 p-4 rounded-lg text-center">
                          <div className="text-lg font-bold">$250,200</div>
                          <div className="text-xs text-muted-foreground">Cost Approach</div>
                        </div>
                        <div className="bg-secondary/40 p-4 rounded-lg text-center">
                          <div className="text-lg font-bold">$242,500</div>
                          <div className="text-xs text-muted-foreground">Income Approach</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Valuation Factors</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Location Factor</div>
                          <div>1.05 (Above Average)</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Building Quality</div>
                          <div>Average (+0%)</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Depreciation</div>
                          <div>17% (Effective Age: 15 years)</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Market Condition</div>
                          <div>+3% (Rising Market)</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Comparable Properties</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded">
                          <div>2108 Valley View, Grandview</div>
                          <div className="font-medium">$240,000</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded">
                          <div>1975 Hill Rd, Grandview</div>
                          <div className="font-medium">$249,500</div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-secondary/20 rounded">
                          <div>2250 Summit Dr, Grandview</div>
                          <div className="font-medium">$251,000</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Valuation Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Previous Value:</span>
                          <span>$227,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Value:</span>
                          <span className="font-medium">$246,800</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Change:</span>
                          <span className="text-green-600">+$19,800 (+8.7%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span>High (PRD: 1.02)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Model Used:</span>
                          <span>Residential Model</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valuation Date:</span>
                          <span>03/24/2025</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-6 space-y-2">
                    <Button className="w-full">Generate Report</Button>
                    <Button variant="outline" className="w-full">Save Valuation</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyValuation;