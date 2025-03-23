import { useCallback, useState, useEffect } from 'react';
import { Link } from 'wouter';
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
import { Calculator as LucideCalculator, BarChart4 as LucideBarChart4, MapPin as LucideMapPin, Info as LucideInfo, Home as LucideHome, ChevronLeft as LucideChevronLeft } from 'lucide-react';

export default function PropertyValuationPage() {
  const [activeTab, setActiveTab] = useState('valuation');
  
  useEffect(() => {
    document.title = 'Property Valuation - IntelligentEstate';
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  return (
    <div className="container px-4 py-6 max-w-7xl mx-auto animate-in fade-in-50 duration-500">
      {/* Back to home link */}
      <Link href="/">
        <button className="mb-4 flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <LucideChevronLeft className="h-4 w-4 mr-1" />
          <LucideHome className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
      </Link>
      
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
        </div>
      </div>
    </div>
  );
}