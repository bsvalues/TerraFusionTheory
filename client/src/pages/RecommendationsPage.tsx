import React, { useState } from 'react';
import { PropertyRecommendationCarousel } from '@/components/recommendations/PropertyRecommendationCarousel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function RecommendationsPage() {
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [propertyLimit, setPropertyLimit] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Fetch popular property tags for filtering
  const { data: propertyTags, isLoading: tagsLoading } = useQuery<string[]>({
    queryKey: ['/api/recommendations/tags'],
    enabled: true,
  });
  
  const handleViewDetails = (property: any) => {
    console.log('View details for property:', property.id);
    // In a real app, this would navigate to a property details page
    // navigate(`/property/${property.id}`);
  };
  
  const handleFavorite = (property: any) => {
    console.log('Toggle favorite for property:', property.id);
    // In a real app, this would call the API to save or remove a favorite
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Property Valuation Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive property valuations using mass appraisal and individual appraisal methodologies
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Show</span>
          <Select
            defaultValue={propertyLimit.toString()}
            onValueChange={(value) => setPropertyLimit(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground whitespace-nowrap">properties</span>
        </div>
      </div>
      
      <div className="mb-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Property Valuation System</AlertTitle>
          <AlertDescription>
            Our advanced valuation engine integrates multiple approaches including sales comparison, cost approach,
            and mass appraisal methods to deliver accurate property valuations for both fee appraisers and assessors.
          </AlertDescription>
        </Alert>
      </div>
      
      <div className="mb-8">
        <Tabs defaultValue="all" onValueChange={setSelectedTab}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Properties</TabsTrigger>
              <TabsTrigger value="investment">Mass Appraisal</TabsTrigger>
              <TabsTrigger value="family">Fee Appraisal</TabsTrigger>
              <TabsTrigger value="trending">Assessment Review</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap gap-2">
              {!tagsLoading && propertyTags ? (
                propertyTags.slice(0, 6).map((tag) => (
                  <Badge 
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <div className="h-5 animate-pulse bg-muted rounded w-32"></div>
              )}
            </div>
          </div>
          
          <TabsContent value="all">
            <PropertyRecommendationCarousel 
              limit={propertyLimit}
              filterByTags={selectedTags}
              onViewDetails={handleViewDetails}
              onFavorite={handleFavorite}
            />
          </TabsContent>
          
          <TabsContent value="investment">
            <PropertyRecommendationCarousel 
              limit={propertyLimit}
              filterByTags={['Assessed', 'Market Aligned', 'Above Average', ...selectedTags]}
              onViewDetails={handleViewDetails}
              onFavorite={handleFavorite}
            />
          </TabsContent>
          
          <TabsContent value="family">
            <PropertyRecommendationCarousel 
              limit={propertyLimit}
              filterByTags={['Single Family', 'High Quality', 'Recent Construction', ...selectedTags]}
              onViewDetails={handleViewDetails}
              onFavorite={handleFavorite}
            />
          </TabsContent>
          
          <TabsContent value="trending">
            <PropertyRecommendationCarousel 
              limit={propertyLimit}
              filterByTags={['Under-assessed', 'Needs Assessment', 'Functionally Obsolete', ...selectedTags]}
              onViewDetails={handleViewDetails}
              onFavorite={handleFavorite}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
            <CardDescription>
              Real-time market trends affecting property values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Rising interest rates</h4>
                  <p className="text-sm text-muted-foreground">
                    Interest rates have increased by 0.5% in the last month, affecting mortgage affordability.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Inventory levels up</h4>
                  <p className="text-sm text-muted-foreground">
                    Available properties in Grandview have increased by 12% compared to the previous quarter.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Neighborhood development</h4>
                  <p className="text-sm text-muted-foreground">
                    New commercial development planned for North Grandview, potentially increasing property values.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Preferences</CardTitle>
            <CardDescription>
              Property features influencing your recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">School Quality</span>
                  <span className="text-sm text-muted-foreground">High Priority</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-primary rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Investment Potential</span>
                  <span className="text-sm text-muted-foreground">Medium Priority</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-primary rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Modern Features</span>
                  <span className="text-sm text-muted-foreground">Low Priority</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-primary rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Proximity to Amenities</span>
                  <span className="text-sm text-muted-foreground">High Priority</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className="h-2 bg-primary rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}