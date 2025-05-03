/**
 * Agent Insights Module
 * 
 * This component displays recent agent insights on the dashboard.
 */

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Brain, 
  BrainCircuit, 
  Home, 
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
  Building,
  RefreshCw,
  Info,
  AlertTriangle,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';

// Sample insight data for demonstration
const sampleInsights = {
  forecast: {
    title: "Rising Values in Downtown",
    description: "Properties in downtown district projected to increase 7.2% over next quarter based on recent sales and economic indicators.",
    date: "2025-05-01T14:30:00Z",
    metric: 7.2,
    unit: "%",
    trend: "up",
    confidence: 86,
    source: "ForecastAgent"
  },
  overrides: {
    title: "Quality Adjustments",
    description: "Most frequent override this week was quality of construction adjustments (32% of all user overrides).",
    date: "2025-05-02T09:15:00Z",
    metric: 32,
    unit: "%",
    count: 28,
    source: "ValuationAgent"
  },
  comps: {
    title: "456 Oak Avenue",
    description: "This property has been used as a comparable in 14 different valuations in the past 30 days.",
    date: "2025-05-01T16:45:00Z",
    metric: 14,
    unit: "uses",
    trend: "up",
    source: "CompsAgent"
  },
  features: {
    title: "Location Quality",
    description: "Location quality has been the most influential value factor across all valuations this week.",
    date: "2025-05-02T11:20:00Z",
    metric: 0.42,
    unit: "SHAP",
    source: "ValuationAgent"
  }
};

const AgentInsightsModule = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <BrainCircuit className="mr-2 h-5 w-5 text-primary" />
            Agent Insights
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Recent insights from the AI agent system
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="overrides">Overrides</TabsTrigger>
            <TabsTrigger value="comps">Top Comps</TabsTrigger>
            <TabsTrigger value="features">SHAP</TabsTrigger>
          </TabsList>
          
          <div className="p-4">
            <TabsContent value="all" className="m-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Forecast Card */}
                <Card className="bg-muted/30 shadow-none border">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base">Top Forecast Today</CardTitle>
                        <CardDescription className="text-xs">
                          From ForecastAgent
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {sampleInsights.forecast.metric}{sampleInsights.forecast.unit}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm font-medium">{sampleInsights.forecast.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sampleInsights.forecast.description}
                    </p>
                    <div className="mt-2 text-xs flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(sampleInsights.forecast.date)}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Override Count Card */}
                <Card className="bg-muted/30 shadow-none border">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base">Override Count This Week</CardTitle>
                        <CardDescription className="text-xs">
                          From ValuationAgent
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        <UserCheck className="mr-1 h-3 w-3" />
                        {sampleInsights.overrides.count} overrides
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm font-medium">{sampleInsights.overrides.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sampleInsights.overrides.description}
                    </p>
                    <div className="mt-2 text-xs flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(sampleInsights.overrides.date)}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Most Used Comp Card */}
                <Card className="bg-muted/30 shadow-none border">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base">Most Used Comp</CardTitle>
                        <CardDescription className="text-xs">
                          From CompsAgent
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                        <Home className="mr-1 h-3 w-3" />
                        {sampleInsights.comps.metric} {sampleInsights.comps.unit}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm font-medium">{sampleInsights.comps.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sampleInsights.comps.description}
                    </p>
                    <div className="mt-2 text-xs flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(sampleInsights.comps.date)}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Top SHAP Feature Card */}
                <Card className="bg-muted/30 shadow-none border">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base">Top SHAP Feature of Week</CardTitle>
                        <CardDescription className="text-xs">
                          From ValuationAgent
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        <Star className="mr-1 h-3 w-3" />
                        {sampleInsights.features.metric.toFixed(2)} {sampleInsights.features.unit}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm font-medium">{sampleInsights.features.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sampleInsights.features.description}
                    </p>
                    <div className="mt-2 text-xs flex items-center text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(sampleInsights.features.date)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="forecast" className="m-0">
              <Card className="shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {sampleInsights.forecast.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {sampleInsights.forecast.metric}{sampleInsights.forecast.unit}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(sampleInsights.forecast.date)}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm mb-3">
                    {sampleInsights.forecast.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence Level</span>
                      <span className="font-medium">{sampleInsights.forecast.confidence}%</span>
                    </div>
                    <Progress value={sampleInsights.forecast.confidence} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on 87 recent sales and 12 market indicators
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    <LineChart className="mr-1 h-3 w-3" />
                    View Detailed Forecast
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="overrides" className="m-0">
              <Card className="shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {sampleInsights.overrides.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      <UserCheck className="mr-1 h-3 w-3" />
                      {sampleInsights.overrides.count} overrides
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(sampleInsights.overrides.date)}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm mb-3">
                    {sampleInsights.overrides.description}
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Quality of Construction</span>
                        <span className="font-medium">32%</span>
                      </div>
                      <Progress value={32} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Condition</span>
                        <span className="font-medium">24%</span>
                      </div>
                      <Progress value={24} className="h-2" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Location Adjustment</span>
                        <span className="font-medium">18%</span>
                      </div>
                      <Progress value={18} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    <ChevronRight className="mr-1 h-3 w-3" />
                    View Override Patterns
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="comps" className="m-0">
              <Card className="shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {sampleInsights.comps.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                      <Home className="mr-1 h-3 w-3" />
                      {sampleInsights.comps.metric} {sampleInsights.comps.unit}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(sampleInsights.comps.date)}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm mb-3">
                    {sampleInsights.comps.description}
                  </p>
                  <div className="space-y-3">
                    <div className="text-sm space-y-1">
                      <p className="font-medium">Property Details</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sale Price:</span>
                          <span>$545,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sale Date:</span>
                          <span>03/15/2025</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Beds/Baths:</span>
                          <span>3 / 2</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sq Ft:</span>
                          <span>1,980</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    <ChevronRight className="mr-1 h-3 w-3" />
                    View Property Details
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="features" className="m-0">
              <Card className="shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {sampleInsights.features.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                      <Star className="mr-1 h-3 w-3" />
                      {sampleInsights.features.metric.toFixed(2)} {sampleInsights.features.unit}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatDate(sampleInsights.features.date)}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm mb-3">
                    {sampleInsights.features.description}
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Top 5 Value Factors (SHAP)</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Location Quality</span>
                        <span className="font-medium">0.42</span>
                      </div>
                      <Progress value={42} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Square Footage</span>
                        <span className="font-medium">0.24</span>
                      </div>
                      <Progress value={24} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Condition</span>
                        <span className="font-medium">0.18</span>
                      </div>
                      <Progress value={18} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Age</span>
                        <span className="font-medium text-destructive">-0.12</span>
                      </div>
                      <Progress value={12} className="h-2 bg-destructive/20" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Bathrooms</span>
                        <span className="font-medium">0.08</span>
                      </div>
                      <Progress value={8} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    <BrainCircuit className="mr-1 h-3 w-3" />
                    View SHAP Analysis
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AgentInsightsModule;