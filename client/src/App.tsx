/**
 * App Component
 * 
 * Main entry point for the IntelligentEstate application.
 * Handles routing and global application state.
 */

import { useState, useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/lib/queryClient';
import { ComparisonProvider } from './context/ComparisonContext';
import RealEstateAnalyticsPage from './pages/RealEstateAnalyticsPage';
import PropertyValuationPage from './pages/PropertyValuationPage';
import ConsolidatedSentimentPage from './pages/ConsolidatedSentimentPage';
import NeighborhoodComparisonPage from './pages/NeighborhoodComparisonPage';
import PropertyComparisonPage from './pages/PropertyComparisonPage';
import AdvancedPropertyComparisonPage from './pages/AdvancedPropertyComparisonPage';
import MarketTrendsPage from './pages/MarketTrendsPage';
import NaturalHazardPage from './pages/NaturalHazardPage';
import MassAppraisalPage from './pages/MassAppraisalPage';
import MarketHeatMapPage from './pages/MarketHeatMapPage';
import ValuationAssistantPage from './pages/ValuationAssistantPage';
import MCPToolPage from './pages/MCPToolPage';
import HelpCenterPage from './pages/HelpCenterPage';
import DevAuthLoginPage from './pages/DevAuthLoginPage';
import DevAuthAdminPage from './pages/DevAuthAdminPage';
import UserAdminPage from './pages/UserAdminPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import NotFoundPage from './pages/NotFoundPage';
import DataQualityPage from './pages/DataQualityPage';
import PropertyDataPage from './pages/PropertyDataPage';
import UnifiedEconomicAnalysisPage from './pages/UnifiedEconomicAnalysisPage';
import NeighborhoodTrendsPage from './pages/NeighborhoodTrendsPage';

// TerraFusion integration pages
import ParcelDetailsPageNew from './pages/terrafusion/ParcelDetailsPageNew';

import { AISpecialistChat } from './components/ai';
import ComparisonButton from './components/property/ComparisonButton';
import ComparisonFloatingButton from './components/property/ComparisonFloatingButton';


// Main App component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
            <Switch>
              <Route path="/" component={RealEstateAnalyticsPage} />
              {/* Consolidated valuation routes */}
              <Route path="/valuation" component={PropertyValuationPage} />
              <Route path="/property-valuation-demo" component={PropertyValuationPage} />
              
              {/* Consolidated sentiment analysis pages */}
              <Route path="/neighborhood-sentiment" component={ConsolidatedSentimentPage} />
              <Route path="/sentiment-map" component={ConsolidatedSentimentPage} />
              <Route path="/sentiment-trends" component={ConsolidatedSentimentPage} />
              <Route path="/neighborhood-comparison" component={NeighborhoodComparisonPage} />
              
              {/* Consolidated economic analysis pages */}
              <Route path="/school-economic-analysis" component={UnifiedEconomicAnalysisPage} />
              <Route path="/economic-indicators" component={UnifiedEconomicAnalysisPage} />
              {/* Property consolidated routes */}
              <Route path="/property/:propertyId" component={ParcelDetailsPageNew} />
              <Route path="/parcel/:id" component={ParcelDetailsPageNew} />
              
              {/* Comparison consolidated routes - will consolidate these next */}
              <Route path="/property-comparison" component={PropertyComparisonPage} />
              <Route path="/advanced-property-comparison" component={AdvancedPropertyComparisonPage} />
              
              <Route path="/market-trends" component={MarketTrendsPage} />
              <Route path="/natural-hazards" component={NaturalHazardPage} />
              <Route path="/mass-appraisal" component={MassAppraisalPage} />
              <Route path="/market-heat-map" component={MarketHeatMapPage} />
              <Route path="/neighborhood-trends" component={NeighborhoodTrendsPage} />
              <Route path="/valuation-assistant" component={ValuationAssistantPage} />
              <Route path="/mcp-tool" component={MCPToolPage} />
              <Route path="/recommendations" component={RecommendationsPage} />
              <Route path="/help" component={HelpCenterPage} />
              <Route path="/help/topics/:categoryId/:topicId" component={HelpCenterPage} />
              <Route path="/dev-auth" component={DevAuthLoginPage} />
              <Route path="/dev-auth/admin" component={DevAuthAdminPage} />
              <Route path="/admin/users" component={UserAdminPage} />
              <Route path="/data-quality" component={DataQualityPage} />
              <Route path="/property-data" component={PropertyDataPage} />
              <Route path="/audit/:parcelId" component={ParcelDetailsPageNew} />
              <Route path="/comps/:parcelId" component={ParcelDetailsPageNew} />
              {/* These routes will be implemented as components are created */}
              {/* <Route path="/valuation/:id" component={ValuationSummaryPage} /> */}
              
              <Route component={NotFoundPage} />
            </Switch>
            
            <TutorialButton position="bottom-right" />
            <ComparisonButton position="bottom-right" />
            <ComparisonFloatingButton />
            
            {/* Enhanced AI Assistant with specialist capabilities */}
            <AISpecialistChat />
            
            {showWelcome && (
              <WelcomeScreen onClose={handleCloseWelcome} />
            )}
            
            <Toaster />
          </div>
        </TutorialManager>
      </ComparisonProvider>
    </QueryClientProvider>
  );
};

export default App;