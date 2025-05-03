/**
 * Parcel Details Page
 * 
 * This page displays detailed information about a specific parcel/property.
 * It integrates the URAR form for property valuation.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { URARForm } from '@/components/terrafusion';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Map, 
  FileText, 
  AlertTriangle, 
  Home as HomeIcon
} from 'lucide-react';

// Define the property type
interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  parcelId: string;
  propertyType: string;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize: number;
  lastSaleDate: string;
  lastSaleAmount: number;
  assessedValue: number;
  taxAmount: number;
  latitude: number;
  longitude: number;
  photos: string[];
  [key: string]: any;
}

const ParcelDetailsPage = () => {
  // Get the parcel ID from the URL
  const [, params] = useRoute<{ id: string }>('/parcel/:id');
  const parcelId = params?.id || '';
  
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch the property data
  const { data: property, isLoading, error } = useQuery<Property>({
    queryKey: ['/api/parcels', parcelId],
    enabled: !!parcelId,
    retry: 1
  });
  
  // Handler for field highlighting from agent events
  const handleFieldHighlight = (event: any) => {
    if (event.fieldId) {
      setHighlightedField(event.fieldId);
      
      // Auto-clear the highlight after 3 seconds
      setTimeout(() => {
        setHighlightedField(null);
      }, 3000);
    }
  };
  
  // Handler for field updates
  const handleFieldUpdate = (name: string, value: any, allValues: any) => {
    console.log(`Field updated: ${name} = ${value}`);
    // Here you would typically save the updated values or emit an event
  };
  
  if (isLoading) {
    return (
      <Layout title="Loading Property Details">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[300px] md:col-span-2" />
            <Skeleton className="h-[300px]" />
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      </Layout>
    );
  }
  
  if (error || !property) {
    return (
      <Layout title="Property Details Error">
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load property details. The parcel ID may be invalid or there was a server error.
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout 
      title={property.address} 
      subtitle={`${property.city}, ${property.state} ${property.zipCode}`}
    >
      <div className="container mx-auto py-6 space-y-6">
        {/* Property Overview Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-normal text-xs">
                Parcel ID: {property.parcelId}
              </Badge>
              <Badge variant="secondary" className="font-normal text-xs">
                {property.propertyType}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Last Sale: {new Date(property.lastSaleDate).toLocaleDateString()} for ${property.lastSaleAmount.toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" size="sm">
              <Map className="h-4 w-4 mr-1" />
              View on Map
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              Export Details
            </Button>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Details - Left Side */}
          <div className="space-y-6">
            {/* Property Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Building className="mr-2 h-5 w-5 text-primary" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b border-muted">
                    <dt className="text-muted-foreground">Property Type</dt>
                    <dd className="font-medium">{property.propertyType}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-muted">
                    <dt className="text-muted-foreground">Year Built</dt>
                    <dd className="font-medium">{property.yearBuilt}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-muted">
                    <dt className="text-muted-foreground">Bedrooms</dt>
                    <dd className="font-medium">{property.bedrooms}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-muted">
                    <dt className="text-muted-foreground">Bathrooms</dt>
                    <dd className="font-medium">{property.bathrooms}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-muted">
                    <dt className="text-muted-foreground">Building Sq Ft</dt>
                    <dd className="font-medium">{property.squareFeet.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-muted">
                    <dt className="text-muted-foreground">Lot Size</dt>
                    <dd className="font-medium">{property.lotSize.toLocaleString()} sq ft</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-muted">
                    <dt className="text-muted-foreground">Assessed Value</dt>
                    <dd className="font-medium">${property.assessedValue.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-muted-foreground">Annual Taxes</dt>
                    <dd className="font-medium">${property.taxAmount.toLocaleString()}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            {/* Property Image */}
            {property.photos && property.photos.length > 0 && (
              <Card>
                <CardContent className="p-2">
                  <img 
                    src={property.photos[0]} 
                    alt={property.address}
                    className="w-full h-auto rounded-md"
                  />
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Main Content - Right Side */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="appraisal">Appraisal</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Property Overview</CardTitle>
                    <CardDescription>Summary information about this property</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      This {property.squareFeet} sq ft {property.propertyType.toLowerCase()} property was built in {property.yearBuilt} and features {property.bedrooms} bedrooms and {property.bathrooms} bathrooms on a {property.lotSize} sq ft lot.
                    </p>
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Location Information</h4>
                      <p className="text-sm">
                        Located in {property.city}, {property.state}, this property is in the {property.neighborhood || 'local'} neighborhood. The property has good access to local amenities and is in the {property.schoolDistrict || 'local'} school district.
                      </p>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Market Information</h4>
                      <p className="text-sm">
                        The property was last sold on {new Date(property.lastSaleDate).toLocaleDateString()} for ${property.lastSaleAmount.toLocaleString()}. The current assessed value is ${property.assessedValue.toLocaleString()} with annual taxes of ${property.taxAmount.toLocaleString()}.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="appraisal" className="mt-4">
                <div className="text-sm text-muted-foreground mb-2">
                  This appraisal form uses AI-assisted valuation and analysis.
                </div>
                <URARForm 
                  property={{
                    ...property,
                    legalDescription: property.legalDescription || '',
                    neighborhood: property.neighborhood || '',
                  }}
                  highlightedField={highlightedField}
                  onFieldUpdate={handleFieldUpdate}
                />
              </TabsContent>
              
              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Property History</CardTitle>
                    <CardDescription>Ownership and transaction history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-4 text-muted-foreground">
                      Property history information is currently being compiled.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Property Documents</CardTitle>
                    <CardDescription>Deeds, permits, and other related documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-4 text-muted-foreground">
                      No property documents are available for this parcel yet.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ParcelDetailsPage;