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
import RealEstateAnalyticsPage from './pages/RealEstateAnalyticsPage';
import PropertyValuationPage from './pages/PropertyValuationPage';
import BlackScreenHelpPage from './pages/BlackScreenHelpPage';
import HelpCenterPage from './pages/HelpCenterPage';
import { 
  TutorialManager, 
  TutorialButton, 
  WelcomeScreen,
  AIAssistant 
} from './components/onboarding';

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
      <TutorialManager>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Switch>
            <Route path="/" component={RealEstateAnalyticsPage} />
            <Route path="/valuation" component={PropertyValuationPage} />
            <Route path="/fix-my-screen/help" component={BlackScreenHelpPage} />
            <Route path="/help" component={HelpCenterPage} />
            <Route path="/help/topics/:categoryId/:topicId" component={HelpCenterPage} />
            {/* Add more routes as needed */}
          </Switch>
          
          <TutorialButton position="bottom-right" />
          <AIAssistant />
          
          {showWelcome && (
            <WelcomeScreen onClose={handleCloseWelcome} />
          )}
          
          <Toaster />
        </div>
      </TutorialManager>
    </QueryClientProvider>
  );
};

export default App;