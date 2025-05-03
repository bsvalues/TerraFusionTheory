/**
 * Dashboard Page
 * 
 * Main dashboard for the IntelligentEstate platform,
 * including AI agent insights and system overview.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import AgentInsightsModule from '@/components/dashboard/AgentInsightsModule';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  LayoutDashboard,
  BarChart,
  Search,
  Plus,
  Clock,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Building,
  Map,
  Home as HomeIcon,
  Users,
  CheckCircle
} from 'lucide-react';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <Layout title="Dashboard" subtitle="Real Estate Intelligence Platform">
      <div className="container mx-auto py-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <LayoutDashboard className="mr-2 h-6 w-6 text-primary" />
            Dashboard
          </h1>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <div className="relative w-[250px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search for a property..."
                className="pl-8 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Valuation
            </Button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Valuations
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,284</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">12%</span>
                <span className="ml-1">from last month</span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Avg. Property Value
              </CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(425000)}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">3.2%</span>
                <span className="ml-1">from last month</span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Markets
              </CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">2</span>
                <span className="ml-1">new markets this month</span>
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Valuation Accuracy
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.2%</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">1.5%</span>
                <span className="ml-1">from last quarter</span>
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent property valuations and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-1">
                    <p className="text-sm font-medium">Property Valuation Completed</p>
                    <p className="text-xs text-muted-foreground">123 Main St, Anytown, CA</p>
                    <p className="text-xs text-muted-foreground mt-1">Today, 10:30 AM</p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4 py-1">
                    <p className="text-sm font-medium">New Comps Selected</p>
                    <p className="text-xs text-muted-foreground">5 comparable properties for 456 Oak Ave</p>
                    <p className="text-xs text-muted-foreground mt-1">Today, 9:15 AM</p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4 py-1">
                    <p className="text-sm font-medium">Market Analysis Report</p>
                    <p className="text-xs text-muted-foreground">Downtown district Q2 2025 forecast</p>
                    <p className="text-xs text-muted-foreground mt-1">Yesterday, 3:45 PM</p>
                  </div>
                  
                  <div className="border-l-4 border-amber-500 pl-4 py-1">
                    <p className="text-sm font-medium">Valuation Adjustments</p>
                    <p className="text-xs text-muted-foreground">Manual overrides for 789 Pine St</p>
                    <p className="text-xs text-muted-foreground mt-1">Yesterday, 1:20 PM</p>
                  </div>
                  
                  <div className="border-l-4 border-gray-300 pl-4 py-1">
                    <p className="text-sm font-medium">Property Added</p>
                    <p className="text-xs text-muted-foreground">234 Cedar Ln, Anytown, CA</p>
                    <p className="text-xs text-muted-foreground mt-1">May 1, 2025, 11:00 AM</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button variant="outline" className="w-full text-sm">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Team Activity
                </CardTitle>
                <CardDescription>
                  Recent actions from your team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      JS
                    </div>
                    <div>
                      <p className="text-sm font-medium">John Smith</p>
                      <p className="text-xs text-muted-foreground">
                        Completed valuation for 567 Elm St
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        1 hour ago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      SD
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sarah Davis</p>
                      <p className="text-xs text-muted-foreground">
                        Updated market analysis for downtown district
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        3 hours ago
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      RJ
                    </div>
                    <div>
                      <p className="text-sm font-medium">Robert Johnson</p>
                      <p className="text-xs text-muted-foreground">
                        Added 3 new properties to the database
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Yesterday
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button variant="outline" className="w-full text-sm">
                    View Team Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content - Right Columns */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="insights">AI Insights</TabsTrigger>
                <TabsTrigger value="valuations">Recent Valuations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-4 space-y-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BarChart className="mr-2 h-5 w-5 text-primary" />
                      Market Overview
                    </CardTitle>
                    <CardDescription>
                      Current market trends and statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center bg-muted/40 rounded-md text-muted-foreground">
                      [Market Trends Chart]
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Median Price</p>
                        <p className="text-lg font-bold">{formatCurrency(450000)}</p>
                        <p className="text-xs text-green-500 flex items-center">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          4.2%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg. Days on Market</p>
                        <p className="text-lg font-bold">24</p>
                        <p className="text-xs text-green-500 flex items-center">
                          <ArrowDown className="h-3 w-3 mr-1" />
                          3 days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Inventory</p>
                        <p className="text-lg font-bold">1,245</p>
                        <p className="text-xs text-red-500 flex items-center">
                          <ArrowDown className="h-3 w-3 mr-1" />
                          5.1%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Agent Insights Module */}
                <AgentInsightsModule />
              </TabsContent>
              
              <TabsContent value="insights" className="mt-4">
                <AgentInsightsModule />
              </TabsContent>
              
              <TabsContent value="valuations" className="mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <HomeIcon className="mr-2 h-5 w-5 text-primary" />
                      Recent Valuations
                    </CardTitle>
                    <CardDescription>
                      Your most recent property valuations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium">123 Main St</p>
                          <p className="text-sm text-muted-foreground">Anytown, CA 90210</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(520000)}</p>
                          <p className="text-sm text-muted-foreground">May 3, 2025</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium">456 Oak Ave</p>
                          <p className="text-sm text-muted-foreground">Anytown, CA 90210</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(645000)}</p>
                          <p className="text-sm text-muted-foreground">May 2, 2025</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium">789 Pine Ln</p>
                          <p className="text-sm text-muted-foreground">Anytown, CA 90211</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(390000)}</p>
                          <p className="text-sm text-muted-foreground">May 2, 2025</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium">321 Cedar Dr</p>
                          <p className="text-sm text-muted-foreground">Anytown, CA 90211</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(575000)}</p>
                          <p className="text-sm text-muted-foreground">May 1, 2025</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium">567 Maple Ct</p>
                          <p className="text-sm text-muted-foreground">Anytown, CA 90212</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(425000)}</p>
                          <p className="text-sm text-muted-foreground">Apr 30, 2025</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Button variant="outline" className="w-full">
                        View All Valuations
                      </Button>
                    </div>
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

export default DashboardPage;