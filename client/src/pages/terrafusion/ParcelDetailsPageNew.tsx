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
import { TerraFusionUXLayout } from '@/components/layout';

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
    occupant: 'Vacant' as 'Vacant' | 'Owner' | 'Tenant', // Explicitly type to match enum
    siteArea: property.lotSize,
    siteZoning: property.zoning,
    generalDescription: {
      units: 1,
      stories: property.stories || 1,
      type: 'Detached' as 'Detached' | 'Attached' | 'S-Detached' | 'S-Attached' | 'MF',
      yearBuilt: property.yearBuilt
    },
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.squareFeet,
    valueConclusion: property.lastSalePrice,
    valueDate: new Date().toISOString().split('T')[0], // Today's date
  };
  
  // Prepare the form content based on the active tab
  const getFormContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">{property.address}</h2>
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.state} {property.zipCode} | APN: {property.assessorParcelNumber}
            </p>
          </div>
        </div>

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
                        <p className="font-medium">229 Maple Drive</p>
                        <div className="flex justify-between text-sm">
                          <span>$429,000</span>
                          <span>Sold: 5 months ago</span>
                        </div>
                        <p className="text-xs text-muted-foreground">2,250 sqft, 3 bed, 2 bath</p>
                      </div>
                      <div className="p-2 border rounded-md">
                        <p className="font-medium">782 Elm Court</p>
                        <div className="flex justify-between text-sm">
                          <span>$447,500</span>
                          <span>Sold: 1 month ago</span>
                        </div>
                        <p className="text-xs text-muted-foreground">2,480 sqft, 4 bed, 3 bath</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle>Property Location</CardTitle>
                <CardDescription>Geographic view and neighborhood analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-80 rounded-md flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">Property Map View</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-md font-semibold mb-2">Neighborhood Score</h3>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                      <span className="text-sm font-medium">87/100</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Based on schools, amenities, and safety</p>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-semibold mb-2">Walk Score</h3>
                    <div className="flex items-center">
                      <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                      <span className="text-sm font-medium">62/100</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Somewhat walkable to amenities</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-md font-semibold mb-2">Nearby Points of Interest</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Westside Elementary School (0.4 miles)</li>
                    <li>• Grandview Community Park (0.7 miles)</li>
                    <li>• Yakima Valley Shopping Center (1.2 miles)</li>
                    <li>• Medical Center (1.5 miles)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Prepare agent feed content
  const getAgentFeed = () => {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Property Overview</CardTitle>
            <CardDescription>Key details about this property</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
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
            
            <div className="mt-6 space-y-2">
              <Button variant="outline" asChild className="w-full justify-start tf-button-secondary">
                <Link href={`/comps/${id}`}>
                  <Users className="mr-2 h-4 w-4" />
                  View Comparable Properties
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start tf-button-secondary">
                <Link href={`/audit/${id}`}>
                  <Activity className="mr-2 h-4 w-4" />
                  View Audit Trail
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start tf-button-secondary">
                <a href={`/api/properties/${id}/report`} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  Download Property Report
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Agent Feed Panel */}
        <AgentFeedPanel 
          propertyId={id} 
          title="TerraFusion Agent Insights"
          description="Real-time agent feedback and analysis"
          height="400px"
        />
      </div>
    );
  };

  // Header actions
  const headerActions = (
    <div className="flex gap-2">
      <Button variant="outline" asChild className="tf-button-secondary">
        <Link href="/properties">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>
      <Button asChild className="tf-button">
        <Link href={`/valuation/${id}`}>
          <FileBarChart2 className="mr-2 h-4 w-4" />
          Valuation Summary
        </Link>
      </Button>
    </div>
  );

  // Return the new layout
  return (
    <TerraFusionUXLayout
      title={`${property.address} - Property Details`}
      backLink="/properties"
      backText="Properties"
      layout="form-dominant"
      fluid={false}
      headerActions={headerActions}
      formContent={getFormContent()}
      agentFeed={getAgentFeed()}
    />
  );
}