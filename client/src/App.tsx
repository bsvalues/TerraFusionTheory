/**
 * App Component
 * 
 * Main entry point for the IntelligentEstate application.
 * Handles routing and global application state.
 */

import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/lib/queryClient';
import RealEstateAnalyticsPage from './pages/RealEstateAnalyticsPage';
import TutorialManager from './components/onboarding/TutorialManager';

// Main App component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TutorialManager>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Switch>
            <Route path="/" component={RealEstateAnalyticsPage} />
            {/* Add more routes as needed */}
          </Switch>
          <Toaster />
        </div>
      </TutorialManager>
    </QueryClientProvider>
  );
};

export default App;