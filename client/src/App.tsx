import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/lib/queryClient';
import { ComparisonProvider } from './context/ComparisonContext';
import { TutorialProvider } from './components/onboarding/TutorialContext';
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
import ParcelDetailsPageNew from './pages/terrafusion/ParcelDetailsPageNew';
import GAMAPage from './pages/GAMAPage';
import { AISpecialistChat } from './components/ai';
import ComparisonButton from './components/property/ComparisonButton';
import ComparisonFloatingButton from './components/property/ComparisonFloatingButton';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TutorialProvider>
        <ComparisonProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
          <Switch>
            <Route path="/" component={RealEstateAnalyticsPage} />
            <Route path="/valuation" component={PropertyValuationPage} />
            <Route path="/property-valuation-demo" component={PropertyValuationPage} />
            <Route path="/neighborhood-sentiment" component={ConsolidatedSentimentPage} />
            <Route path="/sentiment-map" component={ConsolidatedSentimentPage} />
            <Route path="/sentiment-trends" component={ConsolidatedSentimentPage} />
            <Route path="/neighborhood-comparison" component={NeighborhoodComparisonPage} />
            <Route path="/school-economic-analysis" component={UnifiedEconomicAnalysisPage} />
            <Route path="/economic-indicators" component={UnifiedEconomicAnalysisPage} />
            <Route path="/property/:propertyId" component={ParcelDetailsPageNew} />
            <Route path="/parcel/:id" component={ParcelDetailsPageNew} />
            <Route path="/property-comparison" component={PropertyComparisonPage} />
            <Route path="/advanced-property-comparison" component={AdvancedPropertyComparisonPage} />
            <Route path="/market-trends" component={MarketTrendsPage} />
            <Route path="/natural-hazards" component={NaturalHazardPage} />
            <Route path="/mass-appraisal" component={MassAppraisalPage} />
            <Route path="/gama" component={GAMAPage} />
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
            <Route component={NotFoundPage} />
          </Switch>
          
          <ComparisonButton position="bottom-right" />
          <ComparisonFloatingButton />
          <AISpecialistChat />
          <Toaster />
        </div>
          </ComparisonProvider>
        </TutorialProvider>
    </QueryClientProvider>
  );
};

export default App;