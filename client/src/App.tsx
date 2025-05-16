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
import NeighborhoodSentimentPage from './pages/NeighborhoodSentimentPage';
import ConsolidatedSentimentPage from './pages/ConsolidatedSentimentPage';
import PropertyEnrichmentDemo from './pages/PropertyEnrichmentDemo';
import NeighborhoodComparisonPage from './pages/NeighborhoodComparisonPage';
import SchoolAndEconomicAnalysisPage from './pages/SchoolAndEconomicAnalysisPage';
import EconomicIndicatorsPage from './pages/EconomicIndicatorsPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PropertyComparisonPage from './pages/PropertyComparisonPage';
import AdvancedPropertyComparisonPage from './pages/AdvancedPropertyComparisonPage';
import MarketTrendsPage from './pages/MarketTrendsPage';
import NaturalHazardPage from './pages/NaturalHazardPage';
import MassAppraisalPage from './pages/MassAppraisalPage';
import MarketHeatMapPage from './pages/MarketHeatMapPage';
import ValuationAssistantPage from './pages/ValuationAssistantPage';
import AdaptiveColorSchemePage from './pages/AdaptiveColorSchemePage';
import MCPToolPage from './pages/MCPToolPage';
import BlackScreenHelpPage from './pages/BlackScreenHelpPage';
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
import ParcelDetailsPage from './pages/terrafusion/ParcelDetailsPage';
import ParcelDetailsPageNew from './pages/terrafusion/ParcelDetailsPageNew';
import AuditTrailPage from './pages/terrafusion/AuditTrailPage';
import ComparisonGridPage from './pages/terrafusion/ComparisonGridPage';
// Additional TerraFusion pages will be imported here once created

import { 
  TutorialManager, 
  TutorialButton, 
  WelcomeScreen,
  AIAssistant 
} from './components/onboarding';
import { AISpecialistChat } from './components/ai';
import ComparisonButton from './components/property/ComparisonButton';
import ComparisonFloatingButton from './components/property/ComparisonFloatingButton';
import SystemMonitorPage from './pages/SystemMonitorPage';

// Main App component
const App = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Check if this is the user's first visit
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) {
      // Show welcome screen after a short delay for better UX
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasVisitedBefore', 'true');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>
        <TutorialManager>
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
              <Route path="/property-enrichment" component={PropertyEnrichmentDemo} />
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
              <Route path="/valuation-assistant" component={ValuationAssistantPage} />
              <Route path="/adaptive-color-scheme" component={AdaptiveColorSchemePage} />
              <Route path="/mcp-tool" component={MCPToolPage} />
              <Route path="/recommendations" component={RecommendationsPage} />
              <Route path="/system/monitor" component={SystemMonitorPage} />
              <Route path="/fix-my-screen/help" component={BlackScreenHelpPage} />
              <Route path="/help" component={HelpCenterPage} />
              <Route path="/help/topics/:categoryId/:topicId" component={HelpCenterPage} />
              <Route path="/dev-auth" component={DevAuthLoginPage} />
              <Route path="/dev-auth/admin" component={DevAuthAdminPage} />
              <Route path="/admin/users" component={UserAdminPage} />
              <Route path="/data-quality" component={DataQualityPage} />
              <Route path="/property-data" component={PropertyDataPage} />
              <Route path="/audit/:parcelId" component={AuditTrailPage} />
              <Route path="/comps/:parcelId" component={ComparisonGridPage} />
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