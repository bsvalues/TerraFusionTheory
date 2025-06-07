/**
 * Tutorial Context
 * 
 * Provides tutorial state management and guidance functionality
 * for the real estate platform onboarding experience.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

// Tutorial step types
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  isCompleted?: boolean;
}

// Tutorial flow types
export interface TutorialFlow {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  isActive?: boolean;
  progress?: number;
}

// Tutorial context interface
interface TutorialContextType {
  // State
  isActive: boolean;
  currentFlow: TutorialFlow | null;
  currentStepIndex: number;
  completedFlows: string[];
  
  // Actions
  startTutorial: (flowId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  completeTutorial: () => void;
  skipTutorial: () => void;
  markStepCompleted: (stepId: string) => void;
  resetTutorial: () => void;
  
  // Helpers
  getCurrentStep: () => TutorialStep | null;
  isLastStep: () => boolean;
  isFirstStep: () => boolean;
  getTutorialProgress: () => number;
}

// Predefined tutorial flows
const TUTORIAL_FLOWS: TutorialFlow[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of the real estate platform',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to IntelligentEstate',
        description: 'This platform provides AI-powered real estate analytics and insights.',
        placement: 'bottom'
      },
      {
        id: 'navigation',
        title: 'Navigation',
        description: 'Use the sidebar to access different sections of the platform.',
        target: '.sidebar',
        placement: 'right'
      },
      {
        id: 'search',
        title: 'Property Search',
        description: 'Search for properties using the search bar or voice commands.',
        target: '.search-input',
        placement: 'bottom'
      },
      {
        id: 'ai-chat',
        title: 'AI Assistant',
        description: 'Get help from our AI specialists for property analysis and technical support.',
        target: '.ai-chat-button',
        placement: 'left'
      }
    ]
  },
  {
    id: 'property-analysis',
    name: 'Property Analysis',
    description: 'Learn how to analyze properties effectively',
    steps: [
      {
        id: 'select-property',
        title: 'Select a Property',
        description: 'Click on any property to view detailed analysis.',
        placement: 'top'
      },
      {
        id: 'view-insights',
        title: 'Property Insights',
        description: 'Review AI-generated insights about the property.',
        target: '.property-insights',
        placement: 'right'
      },
      {
        id: 'compare-properties',
        title: 'Property Comparison',
        description: 'Compare multiple properties side by side.',
        target: '.compare-button',
        placement: 'top'
      },
      {
        id: 'market-trends',
        title: 'Market Trends',
        description: 'Analyze local market trends and predictions.',
        target: '.market-trends',
        placement: 'bottom'
      }
    ]
  },
  {
    id: 'ai-features',
    name: 'AI Features',
    description: 'Discover advanced AI capabilities',
    steps: [
      {
        id: 'voice-search',
        title: 'Voice Search',
        description: 'Use voice commands to search for properties naturally.',
        target: '.voice-search',
        placement: 'bottom'
      },
      {
        id: 'ai-specialists',
        title: 'AI Specialists',
        description: 'Chat with different AI specialists for specific expertise.',
        target: '.specialist-tabs',
        placement: 'top'
      },
      {
        id: 'property-recommendations',
        title: 'Smart Recommendations',
        description: 'Get personalized property recommendations based on your preferences.',
        target: '.recommendations',
        placement: 'left'
      }
    ]
  }
];

// Create context
const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Tutorial provider component
export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<TutorialFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedFlows, setCompletedFlows] = useState<string[]>([]);

  const startTutorial = useCallback((flowId: string) => {
    const flow = TUTORIAL_FLOWS.find(f => f.id === flowId);
    if (flow) {
      setCurrentFlow(flow);
      setCurrentStepIndex(0);
      setIsActive(true);
    }
  }, []);

  const nextStep = useCallback(() => {
    if (currentFlow && currentStepIndex < currentFlow.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeTutorial();
    }
  }, [currentFlow, currentStepIndex]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const completeTutorial = useCallback(() => {
    if (currentFlow) {
      setCompletedFlows(prev => [...prev, currentFlow.id]);
    }
    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
  }, [currentFlow]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
  }, []);

  const markStepCompleted = useCallback((stepId: string) => {
    if (currentFlow) {
      const updatedFlow = {
        ...currentFlow,
        steps: currentFlow.steps.map(step =>
          step.id === stepId ? { ...step, isCompleted: true } : step
        )
      };
      setCurrentFlow(updatedFlow);
    }
  }, [currentFlow]);

  const resetTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
    setCompletedFlows([]);
  }, []);

  const getCurrentStep = useCallback((): TutorialStep | null => {
    if (currentFlow && currentFlow.steps[currentStepIndex]) {
      return currentFlow.steps[currentStepIndex];
    }
    return null;
  }, [currentFlow, currentStepIndex]);

  const isLastStep = useCallback((): boolean => {
    if (!currentFlow) return false;
    return currentStepIndex === currentFlow.steps.length - 1;
  }, [currentFlow, currentStepIndex]);

  const isFirstStep = useCallback((): boolean => {
    return currentStepIndex === 0;
  }, [currentStepIndex]);

  const getTutorialProgress = useCallback((): number => {
    if (!currentFlow) return 0;
    return Math.round(((currentStepIndex + 1) / currentFlow.steps.length) * 100);
  }, [currentFlow, currentStepIndex]);

  const value: TutorialContextType = {
    // State
    isActive,
    currentFlow,
    currentStepIndex,
    completedFlows,
    
    // Actions
    startTutorial,
    nextStep,
    previousStep,
    completeTutorial,
    skipTutorial,
    markStepCompleted,
    resetTutorial,
    
    // Helpers
    getCurrentStep,
    isLastStep,
    isFirstStep,
    getTutorialProgress
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

// Custom hook to use tutorial context
export const useTutorial = (): TutorialContextType => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

// Export tutorial flows for reference
export { TUTORIAL_FLOWS };
export type { TutorialFlow, TutorialStep };