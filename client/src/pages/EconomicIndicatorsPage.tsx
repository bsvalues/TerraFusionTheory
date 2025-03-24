/**
 * Economic Indicators Page
 * 
 * This page provides a comprehensive view of economic indicators for real estate market analysis,
 * including employment, income, business, and housing market metrics.
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building, LineChart, Map, ArrowRight } from 'lucide-react';
import EconomicIndicatorsDashboard from '@/components/economic/EconomicIndicatorsDashboard';
import NaturalHazardRiskAssessment from '@/components/hazards/NaturalHazardRiskAssessment';

const EconomicIndicatorsPage: React.FC = () => {
  const [selectedLocationCode, setSelectedLocationCode] = useState('grandview-city');
  const [selectedLocationType, setSelectedLocationType] = useState<'city' | 'county' | 'zip' | 'metro' | 'state'>('city');
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto py-6 px-4">
      <Helmet>
        <title>Economic Indicators | IntelligentEstate</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Building className="mr-2 h-8 w-8" />
            Economic Indicators
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive economic data for real estate market analysis and investment decisions
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard" className="flex items-center">
            <LineChart className="h-4 w-4 mr-2" />
            <span>Economic Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center">
            <Map className="h-4 w-4 mr-2" />
            <span>Regional Insights</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <EconomicIndicatorsDashboard 
            locationCode={selectedLocationCode}
            locationType={selectedLocationType}
            showTitle={false}
            showHistorical={true}
          />
        </TabsContent>
        
        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Economic Impact on Real Estate</CardTitle>
                  <CardDescription>How economic factors influence property values and market trends</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-2">Employment and Property Values</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Employment rates have a direct impact on housing demand and property values. Strong job markets typically correspond to higher property values and rental rates.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium">Job Growth</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            1% increase in job growth typically corresponds to a 0.5-1.5% increase in property values depending on market elasticity.
                          </p>
                        </div>
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium">Unemployment Rate</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            1% decrease in unemployment rate can lead to a 2-3% increase in property values and rental rates.
                          </p>
                        </div>
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium">Industry Diversity</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Markets with diversified employment sectors tend to have more stable property values during economic downturns.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-2">Income and Affordability</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Income growth affects purchasing power and housing affordability, which in turn influences property demand and values.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium">Income Growth</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Income growth exceeding inflation typically leads to increased buying power and higher property values.
                          </p>
                        </div>
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium">Affordability Index</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Markets with affordability indices below 30% (housing costs as percentage of income) tend to have more sustainable growth.
                          </p>
                        </div>
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium">Income to Home Price Ratio</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            When median home prices exceed 5x median household income, markets often experience affordability challenges.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-medium mb-2">Business Growth and Commercial Real Estate</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Business formation and growth drive demand for commercial real estate and indirectly impact residential markets.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium">New Business Formation</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            High rates of new business formation typically precede increased demand for office, retail, and industrial space.
                          </p>
                        </div>
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium">Commercial Property Impact</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Commercial property vacancy rates below 5% often lead to new construction and development activity.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" className="flex items-center">
                      View Economic Development Plan
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <NaturalHazardRiskAssessment 
                propertyId={selectedLocationCode}
                fullDetailsByDefault={false}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EconomicIndicatorsPage;