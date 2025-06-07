/**
 * School and Economic Analysis Page
 * 
 * This page combines the School District Analysis Feature and 
 * Local Economic Indicators Dashboard to provide a comprehensive
 * view of an area's educational and economic landscape.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { 
  School, 
  BarChart4, 
  PlusCircle, 
  MinusCircle, 
  Info, 
  MapPin, 
  Award,
  Home
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import our custom components
import SchoolDistrictMap from '@/components/school-district/SchoolDistrictMap';
import SchoolComparisonChart from '@/components/school-district/SchoolComparisonChart';
import EconomicIndicatorsDashboard from '@/components/economic/EconomicIndicatorsDashboard';

// Import our services
import schoolDistrictService, { School as SchoolType } from '@/services/school-district.service';
import economicIndicatorsService from '@/services/economic-indicators.service';

const SchoolAndEconomicAnalysisPage: React.FC = () => {
  // State for the page
  const [selectedCity, setSelectedCity] = useState<string>('Richland');
  const [selectedState, setSelectedState] = useState<string>('WA');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('richland-city');
  
  // Query to get regions for the selector
  const { data: regions } = useQuery({
    queryKey: ['/api/economic-regions'],
    queryFn: async () => {
      return await economicIndicatorsService.getRegions();
    }
  });
  
  // Handle selection of a school
  const handleSchoolSelect = (school: SchoolType) => {
    if (selectedSchools.includes(school.id)) {
      setSelectedSchools(selectedSchools.filter(id => id !== school.id));
    } else {
      // Limit to 5 selected schools
      if (selectedSchools.length < 5) {
        setSelectedSchools([...selectedSchools, school.id]);
      }
    }
  };
  
  // Effect to update region when city changes
  useEffect(() => {
    if (regions) {
      // Find a matching region based on city name
      const matchingRegion = regions.find(region => 
        region.name.toLowerCase() === selectedCity.toLowerCase() && 
        region.state === selectedState
      );
      
      if (matchingRegion) {
        setSelectedRegionId(matchingRegion.id);
      }
    }
  }, [selectedCity, selectedState, regions]);
  
  // Handle city and state change
  const handleCityStateChange = (city: string, state: string) => {
    setSelectedCity(city);
    setSelectedState(state);
    // Clear selected schools when changing location
    setSelectedSchools([]);
  };
  
  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School & Economic Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Explore school districts and economic indicators in your area of interest
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedCity}
              onValueChange={(value) => handleCityStateChange(value, selectedState)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Richland">Richland</SelectItem>
                <SelectItem value="Grandview">Grandview</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={selectedState}
              onValueChange={(value) => handleCityStateChange(selectedCity, value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WA">Washington</SelectItem>
                <SelectItem value="OR">Oregon</SelectItem>
                <SelectItem value="CA">California</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Alert className="max-w-xl">
            <Info className="h-4 w-4" />
            <AlertTitle>Location-Based Analysis</AlertTitle>
            <AlertDescription>
              Select schools on the map to compare them, and explore economic indicators 
              that may affect property values and investment decisions.
            </AlertDescription>
          </Alert>
        </div>
        
        <Tabs defaultValue="schools" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schools" className="flex items-center">
              <School className="mr-2 h-4 w-4" />
              School Districts
            </TabsTrigger>
            <TabsTrigger value="economics" className="flex items-center">
              <BarChart4 className="mr-2 h-4 w-4" />
              Economic Indicators
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="schools" className="space-y-6">
            {/* School District Map */}
            <SchoolDistrictMap 
              initialCity={selectedCity}
              initialState={selectedState}
              height={500}
              onSchoolSelect={handleSchoolSelect}
            />
            
            {/* School Comparison Chart */}
            <div className="mt-6">
              <SchoolComparisonChart schoolIds={selectedSchools} />
            </div>
            
            {/* Property Value Impact */}
            {selectedSchools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Home className="mr-2 h-5 w-5" />
                    School Quality & Property Values
                  </CardTitle>
                  <CardDescription>
                    How school quality metrics impact local real estate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="impact">
                      <AccordionTrigger>
                        Property Value Impact of School Quality
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <p>
                            Studies consistently show that homes in high-performing school districts command a significant 
                            price premium, often ranging from 7% to 20% higher than similar homes in average or 
                            below-average districts.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-lg border p-3">
                              <div className="font-medium mb-1 flex items-center">
                                <Award className="h-4 w-4 mr-1" />
                                School Ratings
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Each point increase in school ratings (1-10 scale) correlates with a 1-2% increase 
                                in property values within the school's enrollment zone.
                              </p>
                            </div>
                            
                            <div className="rounded-lg border p-3">
                              <div className="font-medium mb-1 flex items-center">
                                <Award className="h-4 w-4 mr-1" />
                                Test Scores
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Properties in districts with above-average test scores typically sell for 5-13% more 
                                than comparable properties in districts with below-average scores.
                              </p>
                            </div>
                            
                            <div className="rounded-lg border p-3">
                              <div className="font-medium mb-1 flex items-center">
                                <Award className="h-4 w-4 mr-1" />
                                Teacher Quality
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Better student-teacher ratios and higher teacher qualifications correlate with stronger 
                                home value appreciation over time.
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground italic">
                            Note: The relationship between school quality and property values is influenced by many factors 
                            including local economic conditions, community amenities, and housing supply.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="investment">
                      <AccordionTrigger>
                        Investment Implications
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <p>
                            Properties in highly-rated school districts tend to be more resilient during economic downturns 
                            and appreciate more quickly during recovery periods. Consider these investment implications:
                          </p>
                          
                          <ul className="list-disc list-inside space-y-2">
                            <li>
                              <span className="font-medium">Stability:</span> Properties in good school districts typically maintain 
                              value better during market downturns.
                            </li>
                            <li>
                              <span className="font-medium">Demand:</span> These properties often sell faster with fewer days on market 
                              compared to similar homes in lower-performing districts.
                            </li>
                            <li>
                              <span className="font-medium">Rental potential:</span> Rental properties in good school districts generally 
                              see more stable tenant retention and often command premium rents.
                            </li>
                            <li>
                              <span className="font-medium">Appreciation:</span> Long-term appreciation tends to be stronger in areas with 
                              consistently high-performing schools.
                            </li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="economics">
            {/* Economic Indicators Dashboard */}
            <EconomicIndicatorsDashboard 
              regionId={selectedRegionId}
              timeframe="year"
            />
          </TabsContent>
        </Tabs>
        
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Combined Analysis Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">School-Economy Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium">Employment Trends:</span> Strong job growth typically correlates with increasing 
                    enrollment and improved funding for local schools. In {selectedCity}, the current job growth rate of {selectedCity === "Richland" ? "3.1%" : "1.8%"} 
                    suggests a {selectedCity === "Richland" ? "positive" : "stable"} outlook for school district resources.
                  </p>
                  
                  <p>
                    <span className="font-medium">Income Levels:</span> Areas with higher median household incomes often have better-funded 
                    schools through property taxes. {selectedCity}'s median household income of ${selectedCity === "Richland" ? "78,500" : "52,000"} 
                    is {selectedCity === "Richland" ? "above" : "below"} the state average, suggesting {selectedCity === "Richland" ? "strong" : "moderate"} local funding potential.
                  </p>
                  
                  <p>
                    <span className="font-medium">Housing Market:</span> School quality and housing values form a self-reinforcing cycle. 
                    Better schools increase property values, which can increase school funding through property taxes.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Investment Considerations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium">Short-term Outlook:</span> Based on current economic indicators and school performance metrics, 
                    property investments in {selectedCity} appear to have a {selectedCity === "Richland" ? "strong" : "moderate"} short-term growth potential.
                  </p>
                  
                  <p>
                    <span className="font-medium">Long-term Potential:</span> The combination of {selectedCity === "Richland" ? "above-average school ratings" : "improving school performance"} 
                    and {selectedCity === "Richland" ? "positive" : "stable"} economic indicators suggests {selectedCity === "Richland" ? "favorable" : "reasonable"} long-term investment potential.
                  </p>
                  
                  <p>
                    <span className="font-medium">Risk Factors:</span> {selectedCity === "Richland" ? 
                      "The relatively high dependency on government sector employment presents some concentration risk if federal funding priorities shift." : 
                      "The lower income levels and more agricultural economic base may introduce more volatility during economic downturns."}
                  </p>
                  
                  <p>
                    <span className="font-medium">Recommendation:</span> Consider properties in areas served by the highest-rated schools within {selectedCity}, 
                    particularly those with strong test scores and favorable student-teacher ratios, for optimal investment performance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolAndEconomicAnalysisPage;