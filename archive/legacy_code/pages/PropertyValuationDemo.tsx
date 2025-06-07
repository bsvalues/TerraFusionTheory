/**
 * Property Valuation Demo Page
 * 
 * This page showcases the property valuation capabilities with external data integration.
 */

import { Button } from '@/components/ui/button';
import { PropertyValuationWidget } from '@/components/property/PropertyValuationWidget';
import { useState } from 'react';
import { 
  CheckCircle, 
  ChevronLeft, 
  CloudRain, 
  HelpCircle, 
  HeartPulse, 
  LineChart, 
  Users 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function PropertyValuationDemo() {
  const [showClimateFactors, setShowClimateFactors] = useState(true);
  const [showDemographicFactors, setShowDemographicFactors] = useState(true);
  const [showWeatherFactors, setShowWeatherFactors] = useState(true);
  const { toast } = useToast();
  
  const handleToggleFactors = (type: string, enabled: boolean) => {
    switch (type) {
      case 'climate':
        setShowClimateFactors(enabled);
        break;
      case 'demographic':
        setShowDemographicFactors(enabled);
        break;
      case 'weather':
        setShowWeatherFactors(enabled);
        break;
    }
    
    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} data ${enabled ? 'enabled' : 'disabled'}`,
      description: `Property valuations will ${enabled ? 'now' : 'no longer'} include ${type} factors.`,
      duration: 3000,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/">
            <Button variant="ghost" className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Property Valuation Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Advanced property valuations enhanced with external data integration
          </p>
        </div>
        <div className="hidden md:block">
          <Button variant="outline" className="mr-2">
            <HelpCircle className="h-4 w-4 mr-2" /> How It Works
          </Button>
          <Button variant="default">
            <CheckCircle className="h-4 w-4 mr-2" /> Try With Your Property
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>
                Control which external data factors affect valuation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CloudRain className="h-4 w-4 text-blue-500" />
                    <Label htmlFor="weather-switch">Weather Data</Label>
                  </div>
                  <Switch 
                    id="weather-switch" 
                    checked={showWeatherFactors}
                    onCheckedChange={(checked) => handleToggleFactors('weather', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HeartPulse className="h-4 w-4 text-green-500" />
                    <Label htmlFor="climate-switch">Climate Data</Label>
                  </div>
                  <Switch 
                    id="climate-switch" 
                    checked={showClimateFactors}
                    onCheckedChange={(checked) => handleToggleFactors('climate', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <Label htmlFor="demographic-switch">Demographic Data</Label>
                  </div>
                  <Switch 
                    id="demographic-switch" 
                    checked={showDemographicFactors}
                    onCheckedChange={(checked) => handleToggleFactors('demographic', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Why It Matters</CardTitle>
              <CardDescription>
                Benefits of data-enhanced valuations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>More accurate pricing reflecting real-world conditions</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Better understanding of climate and weather impacts on value</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Insight into demographic trends affecting markets</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Seasonal adjustment factors for more timely valuations</span>
                </li>
                <li className="flex">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Risk-adjusted comparables accounting for environmental factors</span>
                </li>
              </ul>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center mb-2">
                  <LineChart className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm font-medium">Average Improvement</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Properties valued with external data integration show a 12-18% improvement in 
                  accuracy compared to traditional valuation methods.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <PropertyValuationWidget 
            showClimateFactors={showClimateFactors}
            showDemographicFactors={showDemographicFactors}
            showWeatherFactors={showWeatherFactors}
          />
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <CloudRain className="h-4 w-4 text-blue-500 mr-2" />
                  Weather Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Current conditions can affect property showings, market activity, and perceived value.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <HeartPulse className="h-4 w-4 text-green-500 mr-2" />
                  Climate Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Long-term climate patterns affect risk factors, maintenance costs, and overall desirability.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Users className="h-4 w-4 text-purple-500 mr-2" />
                  Demographic Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>Local population characteristics influence market demand, growth potential, and price trends.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}