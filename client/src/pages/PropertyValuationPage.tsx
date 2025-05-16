/**
 * Property Valuation Page (Consolidated)
 * 
 * This page combines the standard property valuation functionality
 * with the demo capabilities, providing a complete valuation experience.
 */

import { useCallback, useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import PropertyValuationWidget from '@/components/valuation/PropertyValuationWidget';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Calculator as LucideCalculator, 
  BarChart4 as LucideBarChart4, 
  MapPin as LucideMapPin, 
  Info as LucideInfo, 
  Home as LucideHome, 
  ChevronLeft as LucideChevronLeft,
  HelpCircle as LucideHelpCircle,
  Monitor as LucideMonitor,
  CheckCircle,
  CloudRain,
  HeartPulse,
  LineChart,
  Users
} from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function PropertyValuationPage() {
  const [activeTab, setActiveTab] = useState('valuation');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Determine if we're in demo mode from the URL
  useEffect(() => {
    setIsDemoMode(location === '/property-valuation-demo');
    document.title = isDemoMode 
      ? 'Valuation Demo - IntelligentEstate' 
      : 'Property Valuation - IntelligentEstate';
  }, [location, isDemoMode]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);
  
  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
    toast({
      title: isDemoMode ? "Exiting Demo Mode" : "Entering Demo Mode",
      description: isDemoMode 
        ? "Switching to standard valuation interface" 
        : "Enhanced demo features activated with sample data",
      duration: 3000
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container px-4 py-6 max-w-7xl mx-auto animate-in fade-in-50 duration-500 flex-1">
        {/* Navigation links */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <LucideChevronLeft className="h-4 w-4 mr-1" />
                <LucideHome className="h-4 w-4 mr-1" />
                Back to Dashboard
              </button>
            </Link>
            
            {/* Demo mode toggle */}
            <div className="flex items-center space-x-2 ml-4">
              <Switch 
                id="demo-mode" 
                checked={isDemoMode}
                onCheckedChange={toggleDemoMode}
              />
              <Label htmlFor="demo-mode" className="text-sm">Demo Mode</Label>
              {isDemoMode && (
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Enhanced Features
                </Badge>
              )}
            </div>
          </div>
          
          <div className="relative group">
            <button className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              <LucideHelpCircle className="h-4 w-4 mr-1" />
              Help
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover border hidden group-hover:block z-50 animate-in slide-in-from-top-5 fade-in-50 duration-200">
              <div className="py-1 rounded-md bg-popover">
                <div className="px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer" onClick={() => window.location.href = '/help'}>
                  <div className="flex items-center">
                    <LucideHelpCircle className="h-4 w-4 mr-2" />
                    Help Center
                  </div>
                </div>
                <div className="px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer" onClick={() => window.location.href = '/fix-my-screen/help'}>
                  <div className="flex items-center">
                    <LucideMonitor className="h-4 w-4 mr-2" />
                    Display Issues
                  </div>
                </div>
                <div className="px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer" onClick={() => window.location.href = '/help/topics/valuation/valuationAccuracy'}>
                  <div className="flex items-center">
                    <LucideCalculator className="h-4 w-4 mr-2" />
                    Valuation Help
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <LucideCalculator className="mr-2 h-7 w-7 text-primary" />
            Property Valuation
          </h1>
          <p className="text-muted-foreground mt-2">
            Get accurate property valuations powered by AI and market analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Valuation Widget */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="valuation" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="valuation" className="flex items-center">
                  <LucideCalculator className="mr-2 h-4 w-4" />
                  Valuation Tool
                </TabsTrigger>
                <TabsTrigger value="market" className="flex items-center">
                  <LucideBarChart4 className="mr-2 h-4 w-4" />
                  Market Analysis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="valuation" className="mt-4">
                <PropertyValuationWidget />
              </TabsContent>
              
              <TabsContent value="market" className="mt-4">
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <LucideBarChart4 className="mr-2 h-5 w-5 text-primary" />
                      Local Market Trends
                    </CardTitle>
                    <CardDescription>
                      Current real estate market trends affecting property values
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 border border-dashed rounded-lg bg-card/50">
                      <p className="text-muted-foreground">
                        Market analysis tools will be available in the next update
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* About Valuation Tool */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <LucideInfo className="mr-2 h-4 w-4 text-primary" />
                  About This Tool
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>
                    Our AI-powered valuation tool uses advanced machine learning algorithms to provide accurate property value estimates based on:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Comparable property sales</li>
                    <li>Location-specific market trends</li>
                    <li>Property characteristics</li>
                    <li>Historical price movements</li>
                    <li>Economic indicators</li>
                  </ul>
                  <div className="pt-2">
                    <Badge variant="outline" className="text-xs">AI-Powered</Badge>
                    <Badge variant="outline" className="text-xs ml-2">Real-time Data</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Popular Areas */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <LucideMapPin className="mr-2 h-4 w-4 text-primary" />
                  Popular Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <span className="font-medium">Grandview, WA</span>
                    <Badge variant="outline" className="text-xs">Hot</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <span className="font-medium">Sunnyside, WA</span>
                    <Badge variant="outline" className="text-xs">Rising</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <span className="font-medium">Prosser, WA</span>
                    <Badge variant="outline" className="text-xs">Stable</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <span className="font-medium">Yakima, WA</span>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Demo Mode Features - only shown when demo mode is active */}
            {isDemoMode && (
              <Card className="border shadow-sm mt-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    Demo Mode - Enhanced Data Sources
                  </CardTitle>
                  <CardDescription>
                    Access to enhanced valuation data sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { icon: <Users className="h-4 w-4 text-blue-500" />, name: "Census Demographics Integration", desc: "Enriched neighborhood data" },
                      { icon: <CloudRain className="h-4 w-4 text-blue-500" />, name: "Climate Risk Assessment", desc: "Flood, fire, and storm data" },
                      { icon: <HeartPulse className="h-4 w-4 text-blue-500" />, name: "Neighborhood Health Index", desc: "Livability metrics" },
                      { icon: <LineChart className="h-4 w-4 text-blue-500" />, name: "Economic Forecasting", desc: "Predictive market trends" }
                    ].map((source, i) => (
                      <div key={i} className="flex items-center p-2 rounded-md bg-white dark:bg-blue-950/20 shadow-sm">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md mr-3">
                          {source.icon}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{source.name}</div>
                          <div className="text-xs text-muted-foreground">{source.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}