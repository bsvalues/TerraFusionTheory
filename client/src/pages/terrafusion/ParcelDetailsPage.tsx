import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import AgentFeedPanel from '@/components/terrafusion/AgentFeedPanel';
import URARForm from '@/components/terrafusion/URARForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Activity, Map, Home, FileText, BarChart3, Users, ArrowLeft, FileBarChart2 } from 'lucide-react';
import { Link } from 'wouter';

// Mock API function to get property details
const fetchPropertyDetails = async (id: string) => {
  try {
    // This would be a real API call in production
    const response = await fetch(`/api/properties/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch property details');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching property details:', error);
    
    // In development, return mock data since we might not have the API ready
    console.log('Using fallback data for development');
    return {
      id,
      address: '123 Main Street',
      city: 'Grandview',
      state: 'WA',
      zipCode: '98930',
      county: 'Yakima',
      assessorParcelNumber: 'APN12345678',
      propertyType: 'Single Family Residential',
      yearBuilt: '1998',
      squareFeet: 2450,
      bedrooms: 4,
      bathrooms: 2.5,
      lotSize: '0.25 acres',
      lastSaleDate: '2022-03-15',
      lastSalePrice: 425000,
      zoning: 'R-1',
      neighborhood: 'Westside',
      floodZone: 'X',
      taxAssessedValue: 395000,
      taxYear: '2024',
    };
  }
};

export default function ParcelDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);
        const data = await fetchPropertyDetails(id);
        setProperty(data);
      } catch (error) {
        console.error('Error loading property details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load property details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProperty();
  }, [id, toast]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!property) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load property details</CardDescription>
          </CardHeader>
          <CardContent>
            <p>The requested property could not be found or there was an error loading the data.</p>
            <Button asChild className="mt-4">
              <Link href="/properties">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Properties
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Initial URAR form data based on the property details
  const initialUrarData = {
    propertyAddress: property.address,
    city: property.city,
    state: property.state,
    zipCode: property.zipCode,
    county: property.county,
    assessorParcelNumber: property.assessorParcelNumber,
    taxYear: property.taxYear,
    neighborhood: property.neighborhood,
    occupant: 'Vacant', // Default
    siteArea: property.lotSize,
    siteZoning: property.zoning,
    generalDescription: {
      units: 1,
      stories: property.stories || 1,
      type: 'Detached',
      yearBuilt: property.yearBuilt
    },
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.squareFeet,
    valueConclusion: property.lastSalePrice,
    valueDate: new Date().toISOString().split('T')[0], // Today's date
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{property.address}</h1>
          <p className="text-muted-foreground">
            {property.city}, {property.state} {property.zipCode} | Parcel ID: {property.assessorParcelNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/properties">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/valuation/${id}`}>
              <FileBarChart2 className="mr-2 h-4 w-4" />
              Valuation Summary
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar - Property Info Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Overview</CardTitle>
              <CardDescription>Key details about this property</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Property Type</dt>
                  <dd className="font-semibold">{property.propertyType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Year Built</dt>
                  <dd className="font-semibold">{property.yearBuilt}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Square Feet</dt>
                  <dd className="font-semibold">{property.squareFeet.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Bedrooms / Bathrooms</dt>
                  <dd className="font-semibold">{property.bedrooms} / {property.bathrooms}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Lot Size</dt>
                  <dd className="font-semibold">{property.lotSize}</dd>
                </div>
                <Separator className="my-2" />
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Sale Date</dt>
                  <dd className="font-semibold">{new Date(property.lastSaleDate).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Last Sale Price</dt>
                  <dd className="font-semibold">${property.lastSalePrice.toLocaleString()}</dd>
                </div>
                <Separator className="my-2" />
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Tax Assessed Value</dt>
                  <dd className="font-semibold">${property.taxAssessedValue.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Tax Year</dt>
                  <dd className="font-semibold">{property.taxYear}</dd>
                </div>
              </dl>
              
              <div className="mt-6 flex flex-col space-y-2">
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href={`/comps/${id}`}>
                    <Users className="mr-2 h-4 w-4" />
                    View Comparable Properties
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href={`/audit/${id}`}>
                    <Activity className="mr-2 h-4 w-4" />
                    View Audit Trail
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full justify-start">
                  <a href={`/api/properties/${id}/report`} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    Download Property Report
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Agent Feed */}
          <AgentFeedPanel 
            propertyId={id} 
            title="TerraFusion Agent Insights"
            description="Real-time agent feedback and analysis"
            height="600px"
          />
        </div>
        
        {/* Main content area */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview" className="flex items-center">
                <Home className="mr-2 h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="urar-form" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                URAR Form
              </TabsTrigger>
              <TabsTrigger value="market" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                Market Data
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center">
                <Map className="mr-2 h-4 w-4" />
                Map
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Property Summary</CardTitle>
                  <CardDescription>Comprehensive overview of the property</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    This property is located in the {property.neighborhood} neighborhood of {property.city}, {property.state}.
                    It was built in {property.yearBuilt} and last sold on {new Date(property.lastSaleDate).toLocaleDateString()} 
                    for ${property.lastSalePrice.toLocaleString()}.
                  </p>
                  
                  {/* This would be replaced with actual property images */}
                  <div className="bg-muted h-64 rounded-md flex items-center justify-center mb-4">
                    <p className="text-muted-foreground">Property Image</p>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">Property Features</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Building Type</p>
                      <p className="text-sm">{property.propertyType}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Total Rooms</p>
                      <p className="text-sm">{(property.bedrooms + 2).toString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Foundation</p>
                      <p className="text-sm">Concrete</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Roof Type</p>
                      <p className="text-sm">Composition Shingle</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Heating</p>
                      <p className="text-sm">Forced Air</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Cooling</p>
                      <p className="text-sm">Central Air</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">Appraisal & Valuation</h3>
                  <p className="text-sm text-muted-foreground">
                    Current tax assessed value is ${property.taxAssessedValue.toLocaleString()} as of tax year {property.taxYear}.
                    Click on "Valuation Summary" to see TerraFusion's automated valuation model results and comparables analysis.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="urar-form">
              <URARForm 
                propertyId={id}
                initialData={initialUrarData}
                onSave={(data) => {
                  console.log('URAR form data:', data);
                  toast({
                    title: 'Form Saved',
                    description: 'URAR form data has been saved successfully',
                  });
                }}
              />
            </TabsContent>
            
            <TabsContent value="market">
              <Card>
                <CardHeader>
                  <CardTitle>Market Analysis</CardTitle>
                  <CardDescription>Property market value trends and comparables</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted h-64 rounded-md flex items-center justify-center mb-4">
                    <p className="text-muted-foreground">Market Trends Chart</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-md font-semibold">Estimated Market Value</h3>
                      <p className="text-2xl font-bold">${(property.lastSalePrice * 1.15).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        Based on recent comparable sales and market trends
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-semibold">Market Trends</h3>
                      <p className="text-sm">
                        The {property.neighborhood} neighborhood has seen a 7.2% increase in property values over the past 12 months.
                        This property's estimated appreciation rate is 8.1% based on its features and location.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-semibold">Comparable Sales</h3>
                      <p className="text-sm mb-2">Recent comparable property sales in the area:</p>
                      
                      <div className="space-y-2">
                        <div className="p-2 border rounded-md">
                          <p className="font-medium">124 Oak Street</p>
                          <div className="flex justify-between text-sm">
                            <span>$435,000</span>
                            <span>Sold: 3 months ago</span>
                          </div>
                          <p className="text-xs text-muted-foreground">2,300 sqft, 4 bed, 2.5 bath</p>
                        </div>
                        
                        <div className="p-2 border rounded-md">
                          <p className="font-medium">78 Maple Avenue</p>
                          <div className="flex justify-between text-sm">
                            <span>$445,000</span>
                            <span>Sold: 2 months ago</span>
                          </div>
                          <p className="text-xs text-muted-foreground">2,500 sqft, 4 bed, 3 bath</p>
                        </div>
                        
                        <div className="p-2 border rounded-md">
                          <p className="font-medium">256 Pine Road</p>
                          <div className="flex justify-between text-sm">
                            <span>$415,000</span>
                            <span>Sold: 5 months ago</span>
                          </div>
                          <p className="text-xs text-muted-foreground">2,200 sqft, 3 bed, 2 bath</p>
                        </div>
                      </div>
                      
                      <Button asChild variant="outline" className="mt-4 w-full">
                        <Link href={`/comps/${id}`}>View Detailed Comparables Analysis</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="map">
              <Card>
                <CardHeader>
                  <CardTitle>Property Location</CardTitle>
                  <CardDescription>Map view and spatial data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted h-96 rounded-md flex items-center justify-center mb-4">
                    <p className="text-muted-foreground">Interactive Property Map</p>
                    {/* This would be replaced with an actual map component */}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-md font-semibold">Neighborhood Information</h3>
                      <p className="text-sm">
                        Located in the {property.neighborhood} area of {property.city}. 
                        This neighborhood has a walk score of 75/100 and is considered very livable.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-semibold">Nearby Points of Interest</h3>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        <li>Elementary School (0.5 miles)</li>
                        <li>Community Park (0.8 miles)</li>
                        <li>Shopping Center (1.2 miles)</li>
                        <li>Medical Center (2.5 miles)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-md font-semibold">Flood & Environmental</h3>
                      <p className="text-sm">
                        Flood Zone: {property.floodZone} (Minimal flood hazard)
                      </p>
                      <p className="text-sm">
                        Environmental Risks: Low risk area for wildfires and earthquakes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}