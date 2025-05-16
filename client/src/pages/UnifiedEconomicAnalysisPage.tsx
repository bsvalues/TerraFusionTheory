/**
 * Unified Economic Analysis Page
 * 
 * This page combines the School District Analysis and Economic Indicators
 * to provide a comprehensive view of an area's educational and economic landscape.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
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
import { Button } from '@/components/ui/button';
import { 
  Building, 
  LineChart, 
  Map, 
  ArrowRight,
  School,
  Briefcase,
  Home,
  ChevronLeft,
  Filter,
  BarChart,
  Calculator,
  GraduationCap,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import EconomicIndicatorsDashboard from '@/components/economic/EconomicIndicatorsDashboard';
import Footer from '@/components/layout/Footer';
import { Link } from 'wouter';

// Placeholder component for School District Analysis
const SchoolDistrictAnalysis = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <GraduationCap className="mr-2 h-5 w-5 text-primary" />
              District Overview
            </CardTitle>
            <CardDescription>Grandview School District Performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Rating</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-2">
                    <div className="h-full rounded-full bg-green-500" style={{ width: '78%' }} />
                  </div>
                  <span className="text-xs font-medium">7.8/10</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Academic Performance</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-2">
                    <div className="h-full rounded-full bg-green-500" style={{ width: '82%' }} />
                  </div>
                  <span className="text-xs font-medium">8.2/10</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Teacher Quality</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-2">
                    <div className="h-full rounded-full bg-green-500" style={{ width: '85%' }} />
                  </div>
                  <span className="text-xs font-medium">8.5/10</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Extracurricular Activities</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-2">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: '73%' }} />
                  </div>
                  <span className="text-xs font-medium">7.3/10</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Facilities</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mr-2">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: '76%' }} />
                  </div>
                  <span className="text-xs font-medium">7.6/10</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BarChart className="mr-2 h-5 w-5 text-primary" />
              Academic Performance
            </CardTitle>
            <CardDescription>Test scores and college readiness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted/30 rounded-md flex items-center justify-center">
              <div className="text-center">
                <BarChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Academic performance chart</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <School className="mr-2 h-5 w-5 text-primary" />
            Schools in District
          </CardTitle>
          <CardDescription>Grandview Schools Summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Grandview High School', type: 'High School', rating: 8.1, students: 950 },
              { name: 'Grandview Middle School', type: 'Middle School', rating: 7.8, students: 720 },
              { name: 'Smith Elementary', type: 'Elementary', rating: 8.4, students: 510 },
              { name: 'Washington Elementary', type: 'Elementary', rating: 7.9, students: 480 }
            ].map((school, index) => (
              <Card key={index} className="bg-muted/10">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-base">{school.name}</h4>
                      <p className="text-sm text-muted-foreground">{school.type} • {school.students} students</p>
                    </div>
                    <div className="flex items-center bg-muted px-3 py-1 rounded-full">
                      <span className="font-medium mr-1">{school.rating}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const UnifiedEconomicAnalysisPage: React.FC = () => {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('economic');
  const [selectedLocation, setSelectedLocation] = useState<string>('grandview-city');
  
  // Set the initial active tab based on the route
  useEffect(() => {
    if (location === '/school-economic-analysis') {
      setActiveTab('school');
    } else {
      setActiveTab('economic');
    }
  }, [location]);
  
  // Update page title based on active tab
  useEffect(() => {
    document.title = activeTab === 'school' 
      ? 'School District Analysis | IntelligentEstate' 
      : 'Economic Indicators | IntelligentEstate';
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>
          {activeTab === 'school' 
            ? 'School District Analysis' 
            : 'Economic Indicators'} | IntelligentEstate
        </title>
      </Helmet>
      
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">Area Economic Analysis</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grandview-city">Grandview City</SelectItem>
                  <SelectItem value="yakima-county">Yakima County</SelectItem>
                  <SelectItem value="98930">ZIP 98930</SelectItem>
                  <SelectItem value="yakima-metro">Yakima Metro Area</SelectItem>
                  <SelectItem value="washington-state">Washington State</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 container mx-auto py-6 px-4">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="economic" className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Economic Indicators
            </TabsTrigger>
            <TabsTrigger value="school" className="flex items-center">
              <School className="mr-2 h-4 w-4" />
              School District Analysis
            </TabsTrigger>
          </TabsList>
          
          {/* Economic Indicators Tab Content */}
          <TabsContent value="economic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  Economic Indicators Dashboard
                </CardTitle>
                <CardDescription>
                  Comprehensive local economic data for {selectedLocation.replace('-', ' ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EconomicIndicatorsDashboard 
                  locationCode={selectedLocation}
                  locationType="city" 
                  showTitle={false}
                  showHistorical={true}
                />
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="mr-2 h-4 w-4 text-primary" />
                    Employment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Unemployment Rate</span>
                      <span className="font-medium">4.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Job Growth (YoY)</span>
                      <span className="font-medium text-green-600">+2.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg. Wage Growth</span>
                      <span className="font-medium text-green-600">+3.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Labor Force Part.</span>
                      <span className="font-medium">62.8%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-primary" />
                    Income & Housing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Median Household Income</span>
                      <span className="font-medium">$58,400</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Per Capita Income</span>
                      <span className="font-medium">$32,150</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Median Home Value</span>
                      <span className="font-medium">$285,700</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Home Price Growth (YoY)</span>
                      <span className="font-medium text-green-600">+8.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Building className="mr-2 h-4 w-4 text-primary" />
                    Business Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">New Business Formation</span>
                      <span className="font-medium text-green-600">+5.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Retail Sales Growth</span>
                      <span className="font-medium text-green-600">+4.1%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Commercial Vacancy Rate</span>
                      <span className="font-medium">6.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Industrial Space Demand</span>
                      <span className="font-medium text-green-600">High</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* School District Tab Content */}
          <TabsContent value="school" className="space-y-6">
            <SchoolDistrictAnalysis />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default UnifiedEconomicAnalysisPage;