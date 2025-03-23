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
  LucideMapPin, 
  LucideBarChart, 
  LucideSearch, 
  LucideHome, 
  LucideBriefcase, 
  LucideSettings,
  Calculator as LucideCalculator 
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
          <div className="flex items-center animate-in slide-in-from-left-5 duration-500">
            <LucideHome className="h-6 w-6 mr-2 text-primary animate-pulse-glow" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">IntelligentEstate</h1>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            {['Dashboard', 'Properties', 'Market Analytics', 'Predictions', 'Reports'].map((item, index) => (
              <a 
                key={item} 
                href="#"
                className="text-sm font-medium relative group animate-in slide-in-from-top-3 duration-700"
                style={{ animationDelay: `${150 + index * 100}ms` }}
              >
                <span className="transition-colors duration-200 group-hover:text-primary">{item}</span>
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4 animate-in slide-in-from-right-5 duration-500">
            {/* Property Valuation Link */}
            <Link href="/valuation">
              <button className="p-2 rounded-full transition-all duration-300 hover:bg-secondary hover:shadow-md hover:scale-110 animate-in fade-in duration-700 flex items-center text-sm font-medium">
                <LucideCalculator className="h-5 w-5 mr-1" />
                <span className="hidden md:inline">Valuation</span>
              </button>
            </Link>
            
            {/* Other action buttons */}
            {[
              { icon: <LucideSearch className="h-5 w-5" />, delay: 100 },
              { icon: <LucideBriefcase className="h-5 w-5" />, delay: 200 },
              { icon: <LucideSettings className="h-5 w-5" />, delay: 300 }
            ].map((button, index) => (
              <button 
                key={index}
                className="p-2 rounded-full transition-all duration-300 hover:bg-secondary hover:shadow-md hover:scale-110 animate-in fade-in duration-700"
                style={{ animationDelay: `${button.delay}ms` }}
              >
                {button.icon}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="h-16 w-full justify-start bg-transparent animate-in slide-in-from-bottom-3 duration-700">
              <TabsTrigger 
                value="map" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 hover:bg-secondary/40 animate-in fade-in slide-in-from-left-3 duration-500"
              >
                <LucideMapPin className={`mr-2 h-4 w-4 transition-transform duration-300 ${activeTab === 'map' ? 'scale-125 text-primary' : ''}`} />
                <span className={`relative ${activeTab === 'map' ? 'text-primary font-medium' : ''}`}>
                  Property Map
                  {activeTab === 'map' && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-left duration-300"></span>
                  )}
                </span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="market" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 hover:bg-secondary/40 animate-in fade-in slide-in-from-left-3 duration-500 delay-100"
              >
                <LucideBarChart className={`mr-2 h-4 w-4 transition-transform duration-300 ${activeTab === 'market' ? 'scale-125 text-primary' : ''}`} />
                <span className={`relative ${activeTab === 'market' ? 'text-primary font-medium' : ''}`}>
                  Market Analytics
                  {activeTab === 'market' && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-left duration-300"></span>
                  )}
                </span>
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
      <footer className="border-t py-4 px-4 text-center text-sm text-muted-foreground animate-in fade-in-50 slide-in-from-bottom-2 duration-1000 delay-300">
        <div className="container mx-auto">
          <p>© 2025 IntelligentEstate. All rights reserved.</p>
          <div className="flex justify-center mt-2 space-x-4 text-xs">
            <a href="#" className="hover:text-primary transition-colors duration-200">Terms</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Support</a>
            <a href="#" className="hover:text-primary transition-colors duration-200">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RealEstateAnalyticsPage;