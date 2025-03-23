/**
 * RealEstateAnalyticsPage
 * 
 * This is the main page for the real estate analytics platform.
 * It integrates mapping, market analytics, and property data features.
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LucideMapPin, 
  LucideBarChart, 
  LucideSearch, 
  LucideHome, 
  LucideBriefcase, 
  LucideSettings 
} from 'lucide-react';
import MapContainer from '@/components/mapping/MapContainer';
import MarketDashboard from '@/components/dashboard/MarketDashboard';

// Main component
const RealEstateAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <LucideHome className="h-6 w-6 mr-2 text-primary" />
            <h1 className="text-xl font-bold">IntelligentEstate</h1>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-sm font-medium hover:text-primary">Dashboard</a>
            <a href="#" className="text-sm font-medium hover:text-primary">Properties</a>
            <a href="#" className="text-sm font-medium hover:text-primary">Market Analytics</a>
            <a href="#" className="text-sm font-medium hover:text-primary">Predictions</a>
            <a href="#" className="text-sm font-medium hover:text-primary">Reports</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-secondary">
              <LucideSearch className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-secondary">
              <LucideBriefcase className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-secondary">
              <LucideSettings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="h-16 w-full justify-start bg-transparent">
              <TabsTrigger value="map" className="data-[state=active]:bg-background">
                <LucideMapPin className="mr-2 h-4 w-4" />
                Property Map
              </TabsTrigger>
              <TabsTrigger value="market" className="data-[state=active]:bg-background">
                <LucideBarChart className="mr-2 h-4 w-4" />
                Market Analytics
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
      <footer className="border-t py-4 px-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          <p>© 2025 IntelligentEstate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default RealEstateAnalyticsPage;