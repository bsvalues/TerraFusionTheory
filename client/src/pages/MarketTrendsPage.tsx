/**
 * Market Trends Page
 * 
 * This page displays interactive visualizations of real estate market trends and predictions,
 * including historical data and forecasts for different property types and areas.
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  LineChart, 
  BarChart,
  PieChart,
  AreaChart,
  ArrowDown,
  ArrowUp,
  Info
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import PropertyMarketTrends from '@/components/charts/PropertyMarketTrends';
import MarketPredictionChart from '@/components/charts/MarketPredictionChart';
import marketTrendsService from '@/services/market-trends.service';

const MarketTrendsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [yearOverYearData, setYearOverYearData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArea, setSelectedArea] = useState<string>('grandview');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all');
  
  useEffect(() => {
    const fetchYearOverYearData = async () => {
      try {
        const data = await marketTrendsService.getYearOverYearComparison(
          selectedArea,
          selectedPropertyType
        );
        setYearOverYearData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching year-over-year data:', error);
        setLoading(false);
      }
    };
    
    fetchYearOverYearData();
  }, [selectedArea, selectedPropertyType]);
  
  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
  };
  
  const handlePropertyTypeChange = (type: string) => {
    setSelectedPropertyType(type);
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <Helmet>
        <title>Market Trends | IntelligentEstate</title>
      </Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <TrendingUp className="mr-2 h-8 w-8" />
            Real Estate Market Trends
          </h1>
          <p className="text-muted-foreground mt-1">
            Interactive visualizations of market data and AI-powered predictions
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button variant="outline" onClick={() => window.print()}>
            <LineChart className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Year over year summary cards */}
      {!loading && yearOverYearData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard 
            title="Median Price" 
            value={`$${yearOverYearData.medianPriceChange.currentYear.toLocaleString()}`}
            changePercent={yearOverYearData.medianPriceChange.percent}
            previous={`$${yearOverYearData.medianPriceChange.lastYear.toLocaleString()}`}
            icon={<BarChart className="h-5 w-5" />}
          />
          
          <MetricCard 
            title="Inventory" 
            value={yearOverYearData.inventoryChange.currentYear.toString()}
            changePercent={yearOverYearData.inventoryChange.percent}
            previous={yearOverYearData.inventoryChange.lastYear.toString()}
            icon={<PieChart className="h-5 w-5" />}
          />
          
          <MetricCard 
            title="Days on Market" 
            value={yearOverYearData.daysOnMarketChange.currentYear.toString()}
            changePercent={yearOverYearData.daysOnMarketChange.percent * -1} // Invert - lower is better
            previous={yearOverYearData.daysOnMarketChange.lastYear.toString()}
            icon={<AreaChart className="h-5 w-5" />}
            invertChange={true}
          />
          
          <MetricCard 
            title="Sales Volume" 
            value={yearOverYearData.salesVolumeChange.currentYear.toString()}
            changePercent={yearOverYearData.salesVolumeChange.percent}
            previous={yearOverYearData.salesVolumeChange.lastYear.toString()}
            icon={<LineChart className="h-5 w-5" />}
          />
        </div>
      )}
      
      <Tabs defaultValue="historical" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="historical">Historical Trends</TabsTrigger>
          <TabsTrigger value="forecast">Market Forecast</TabsTrigger>
        </TabsList>
        
        <TabsContent value="historical" className="space-y-6">
          <PropertyMarketTrends 
            areaCode={selectedArea}
            propertyType={selectedPropertyType}
            timeFrame="1y"
          />
        </TabsContent>
        
        <TabsContent value="forecast" className="space-y-6">
          <MarketPredictionChart 
            areaCode={selectedArea}
            propertyType={selectedPropertyType}
          />
        </TabsContent>
      </Tabs>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Market Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
            <CardDescription>Expert analysis of current conditions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Supply and Demand</h4>
                <p className="text-sm text-muted-foreground">
                  The Grandview market continues to show strong demand despite limited inventory, 
                  putting upward pressure on prices, particularly in the single-family segment.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Seasonal Patterns</h4>
                <p className="text-sm text-muted-foreground">
                  Typical seasonal slowdown expected in winter months, with activity 
                  projected to increase again in spring. Price growth may moderate but remain positive.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Interest Rate Impact</h4>
                <p className="text-sm text-muted-foreground">
                  Recent interest rate trends are affecting buyer purchasing power, 
                  though local market resilience is stronger than national averages.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Market Sentiment */}
        <Card>
          <CardHeader>
            <CardTitle>Market Sentiment</CardTitle>
            <CardDescription>Buyer and seller perception metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <h4 className="font-semibold">Buyer Confidence</h4>
                  <span className="text-amber-500 font-medium">Moderate</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Buyers are cautiously optimistic but concerned about affordability
                </p>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <h4 className="font-semibold">Seller Confidence</h4>
                  <span className="text-green-500 font-medium">Strong</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sellers remain confident due to limited inventory and steady demand
                </p>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <h4 className="font-semibold">Professional Outlook</h4>
                  <span className="text-blue-500 font-medium">Positive</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Real estate professionals expect stable growth with some short-term fluctuations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recommendation */}
        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>Market Recommendations</CardTitle>
            <CardDescription>AI-powered strategic insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center">
                  <Badge variant="outline" className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">Buyers</Badge>
                  Consider Acting Soon
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  With prices projected to rise 7.2% over the next year, current conditions 
                  present a window of opportunity before further appreciation.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold flex items-center">
                  <Badge variant="outline" className="mr-2 bg-amber-100 text-amber-800 hover:bg-amber-100">Sellers</Badge>
                  Strong Position
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Limited inventory creates favorable conditions for sellers, 
                  with properties spending 18.2% less time on market compared to last year.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold flex items-center">
                  <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100">Investors</Badge>
                  Focus on Rental Yield
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  With appreciation moderating from recent peaks, focus on properties 
                  with strong rental demand and cash flow potential.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper component for metric cards
interface MetricCardProps {
  title: string;
  value: string;
  changePercent: number;
  previous: string;
  icon: React.ReactNode;
  invertChange?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  changePercent, 
  previous,
  icon,
  invertChange = false
}) => {
  // For some metrics like "Days on Market," a negative change is actually positive
  // The invertChange parameter allows us to handle this display logic
  const displayedChangePercent = invertChange ? changePercent : changePercent;
  const isPositive = invertChange ? changePercent > 0 : changePercent > 0;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className="rounded-full p-2 bg-primary/10">
            {icon}
          </div>
        </div>
        
        <div className="flex items-center mt-4">
          {isPositive ? (
            <ArrowUp className={`h-4 w-4 ${invertChange ? 'text-green-500' : 'text-green-500'} mr-1`} />
          ) : (
            <ArrowDown className={`h-4 w-4 ${invertChange ? 'text-red-500' : 'text-red-500'} mr-1`} />
          )}
          
          <span className={`text-sm font-medium ${isPositive ? (invertChange ? 'text-green-500' : 'text-green-500') : (invertChange ? 'text-red-500' : 'text-red-500')}`}>
            {displayedChangePercent >= 0 ? '+' : ''}{displayedChangePercent.toFixed(1)}%
          </span>
          
          <span className="text-sm text-muted-foreground ml-2">vs. last year ({previous})</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketTrendsPage;