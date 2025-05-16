/**
 * RealEstateAnalyticsPage
 * 
 * This is the main page for the real estate analytics platform.
 * It integrates mapping, market analytics, and property data features.
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  BarChart, 
  Calculator,
  Home
} from 'lucide-react';
import MapContainer from '@/components/mapping/MapContainer';
import MarketDashboard from '@/components/dashboard/MarketDashboard';
import Footer from '@/components/layout/Footer';
import AppNavigation from '@/components/layout/AppNavigation';

// Main component
const RealEstateAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Navigation Bar */}
      <AppNavigation currentPath="/" />
      
      {/* Sub Header with action buttons */}
      <div className="border-b bg-muted/10">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <MapPin className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-xl font-medium">Real Estate Analytics</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link href="/valuation">
              <button className="p-2 rounded transition-all hover:bg-secondary flex items-center text-sm font-medium">
                <Calculator className="h-4 w-4 mr-1" />
                <span>Valuation</span>
              </button>
            </Link>
            
            <Link href="/market-heat-map">
              <button className="p-2 rounded transition-all hover:bg-secondary flex items-center text-sm font-medium">
                <BarChart className="h-4 w-4 mr-1" />
                <span>Heat Map</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="h-16 w-full justify-start bg-transparent animate-in slide-in-from-bottom-3 duration-700">
              <TabsTrigger 
                value="map" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 hover:bg-secondary/40"
              >
                <MapPin className="mr-2 h-4 w-4" />
                <span>Property Map</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="market" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 hover:bg-secondary/40"
              >
                <BarChart className="mr-2 h-4 w-4" />
                <span>Market Analytics</span>
              </TabsTrigger>
              {/* Add more tabs as needed */}
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent 
              value="map" 
              className="h-full m-0 data-[state=active]:flex flex-col"
              forceMount={true}
            >
              <div 
                className={`h-full transition-all duration-500 ease-in-out ${
                  activeTab === 'map' 
                    ? 'opacity-100 animate-in fade-in-0 zoom-in-[98%] duration-500' 
                    : 'opacity-0 animate-out fade-out-0 zoom-out-[98%] duration-500'
                }`}
              >
                <MapContainer />
              </div>
            </TabsContent>
            
            <TabsContent 
              value="market" 
              className="h-full m-0 data-[state=active]:flex flex-col"
              forceMount={true}
            >
              <div 
                className={`h-full transition-all duration-500 ease-in-out ${
                  activeTab === 'market' 
                    ? 'opacity-100 animate-in fade-in-0 zoom-in-[98%] duration-500' 
                    : 'opacity-0 animate-out fade-out-0 zoom-out-[98%] duration-500'
                }`}
              >
                <MarketDashboard />
              </div>
            </TabsContent>
            
            {/* Add more tab content as needed */}
          </div>
        </Tabs>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RealEstateAnalyticsPage;