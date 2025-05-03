import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Activity, FileBarChart2, Layers, Info } from 'lucide-react';
import AuditTab from '@/components/terrafusion/audit/AuditTab';
import AgentFeedPanel from '@/components/terrafusion/AgentFeedPanel';
import RetrainStatusWidget from '@/components/terrafusion/audit/RetrainStatusWidget';

// Define property interface
interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
}

export default function AuditTrailPage() {
  const { parcelId } = useParams<{ parcelId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchPropertyDetails();
  }, [parcelId]);
  
  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would be a real API call in production
      // const response = await fetch(`/api/properties/${parcelId}`);
      // if (!response.ok) throw new Error('Failed to fetch property details');
      // const data = await response.json();
      
      // For development, use mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API latency
      
      // Mock property data
      const mockProperty = {
        id: parcelId,
        address: '123 Main Street',
        city: 'Grandview',
        state: 'WA',
        zipCode: '98930',
        propertyType: 'Single Family Residential'
      };
      
      setProperty(mockProperty);
    } catch (error) {
      console.error('Error fetching property details:', error);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !property) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error || !property) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to load property details</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{error || 'Property not found'}</p>
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
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Audit Trail</h1>
          <p className="text-muted-foreground">
            {property.address}, {property.city}, {property.state} {property.zipCode} | Parcel ID: {property.id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/parcel/${parcelId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Property
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/valuation/${parcelId}`}>
              <FileBarChart2 className="mr-2 h-4 w-4" />
              Valuation Summary
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Overview</CardTitle>
              <CardDescription>AI decision transparency and tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <Info className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-medium">What is the Audit Trail?</h3>
                  <p className="text-sm text-muted-foreground">
                    This page shows all AI predictions, user overrides, and model retraining events for this property.
                    It provides full transparency into how valuations are determined.
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Quick Links</h3>
                <div className="space-y-2">
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href={`/valuation/${parcelId}`}>
                      <FileBarChart2 className="mr-2 h-4 w-4" />
                      View Valuation Summary
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href={`/comps/${parcelId}`}>
                      <Layers className="mr-2 h-4 w-4" />
                      Comparable Properties
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <a href={`/api/properties/${parcelId}/report`} target="_blank" rel="noopener noreferrer">
                      <Activity className="mr-2 h-4 w-4" />
                      Download Audit Report
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <RetrainStatusWidget propertyId={parcelId} />
          
          {/* Agent Feed */}
          <AgentFeedPanel 
            propertyId={parcelId} 
            title="TerraFusion Agent Insights"
            description="Real-time agent feedback and analysis"
            height="400px"
          />
        </div>
        
        {/* Main content area */}
        <div className="md:col-span-2">
          <AuditTab propertyId={parcelId} />
        </div>
      </div>
    </div>
  );
}