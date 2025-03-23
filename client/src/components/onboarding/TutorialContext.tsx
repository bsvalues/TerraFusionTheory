/**
 * TutorialContext
 * 
 * This context provides state management for the interactive tutorial system.
 * It tracks the current tutorial step, user progress, and handles navigation
 * through the tutorial flow.
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define tutorial steps
export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  actions?: {
    label: string;
    action: () => void;
  }[];
  completionCriteria?: () => boolean;
};

// Define the tutorial category/feature
export type TutorialCategory = {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
};

// Context type definition
interface TutorialContextType {
  isActive: boolean;
  activeCategory: TutorialCategory | null;
  currentStepIndex: number;
  progress: Record<string, number>; // categoryId -> step index
  startTutorial: (categoryId: string) => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  markStepComplete: () => void;
  categories: TutorialCategory[];
  tutorialCategories: TutorialCategory[]; // For TutorialButton dropdown
  aiAssistantMessage: string;
  updateAiMessage: (message: string) => void;
}

// Create context with default values
const TutorialContext = createContext<TutorialContextType>({
  isActive: false,
  activeCategory: null,
  currentStepIndex: 0,
  progress: {},
  startTutorial: () => {},
  endTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  markStepComplete: () => {},
  categories: [],
  tutorialCategories: [],
  aiAssistantMessage: '',
  updateAiMessage: () => {},
});

// Tutorial categories with steps
const tutorialCategories: TutorialCategory[] = [
  {
    id: 'introduction',
    name: 'Getting Started',
    description: 'Introduction to the IntelligentEstate platform and basic navigation',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to IntelligentEstate',
        description: 'This interactive tutorial will guide you through the key features of our real estate analytics platform.',
        position: 'center',
        actions: [
          {
            label: 'Continue',
            action: () => {},
          },
        ],
      },
      {
        id: 'navigation',
        title: 'Main Navigation',
        description: 'The top navigation bar provides access to the main areas of the application. Click on different sections to explore the platform.',
        target: 'header nav',
        position: 'bottom',
        actions: [
          {
            label: 'Next',
            action: () => {},
          },
        ],
      },
      {
        id: 'tabs',
        title: 'Map and Analytics Tabs',
        description: 'Use these tabs to switch between the interactive property map and the market analytics dashboard.',
        target: '[role="tablist"]',
        position: 'bottom',
        actions: [
          {
            label: 'Next',
            action: () => {},
          },
        ],
      },
      {
        id: 'completion',
        title: 'Ready to Explore',
        description: 'You now know the basics of navigating the platform. Continue to explore specific features in detail.',
        position: 'center',
        actions: [
          {
            label: 'Finish Introduction',
            action: () => {},
          },
          {
            label: 'Continue to Map Tutorial',
            action: () => {},
          },
        ],
      },
    ],
  },
  {
    id: 'map',
    name: 'Interactive Property Map',
    description: 'Learn how to use the interactive property map to explore listings',
    steps: [
      {
        id: 'map-overview',
        title: 'Property Map Overview',
        description: 'The interactive map shows property listings in the selected area. You can zoom, pan, and click on properties to see details.',
        position: 'center',
        actions: [
          {
            label: 'Continue',
            action: () => {},
          },
        ],
      },
      {
        id: 'map-toggle',
        title: 'Map View Options',
        description: 'Toggle between different map views: Properties, Heatmap, and Boundaries to visualize real estate data in different ways.',
        target: '.absolute.top-4.left-4',
        position: 'right',
        actions: [
          {
            label: 'Next',
            action: () => {},
          },
        ],
      },
      {
        id: 'map-filters',
        title: 'Property Filters',
        description: 'Use the Filters button to refine properties shown on the map by price, bedrooms, property type, and more.',
        target: '.absolute.top-4.right-4',
        position: 'left',
        actions: [
          {
            label: 'Next',
            action: () => {},
          },
        ],
      },
      {
        id: 'property-list',
        title: 'Property List',
        description: 'This panel shows a list of properties currently displayed on the map. Click on any property to see its details.',
        target: '.absolute.bottom-4.left-4',
        position: 'top',
        actions: [
          {
            label: 'Next',
            action: () => {},
          },
        ],
      },
      {
        id: 'property-details',
        title: 'Property Details',
        description: 'When you select a property on the map or from the list, its details appear in this panel.',
        target: '.absolute.bottom-4.right-4',
        position: 'top',
        actions: [
          {
            label: 'Finish Map Tutorial',
            action: () => {},
          },
        ],
      },
    ],
  },
  {
    id: 'analytics',
    name: 'Market Analytics Dashboard',
    description: 'Learn how to use the market analytics dashboard to gain insights',
    steps: [
      {
        id: 'analytics-overview',
        title: 'Market Analytics Overview',
        description: 'The Market Analytics dashboard provides insights into real estate trends, pricing, and market conditions.',
        position: 'center',
        actions: [
          {
            label: 'Continue',
            action: () => {},
          },
        ],
      },
      {
        id: 'analytics-selection',
        title: 'Area Selection',
        description: 'Use these dropdowns to select a specific area and timeframe for your market analysis.',
        target: '.flex.items-center.space-x-2',
        position: 'bottom',
        actions: [
          {
            label: 'Next',
            action: () => {},
          },
        ],
      },
      {
        id: 'analytics-metrics',
        title: 'Key Market Metrics',
        description: 'These cards show essential market metrics such as median price, days on market, active listings, and price per square foot.',
        target: '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4',
        position: 'bottom',
        actions: [
          {
            label: 'Next',
            action: () => {},
          },
        ],
      },
      {
        id: 'analytics-charts',
        title: 'Interactive Charts',
        description: 'Explore market trends through these interactive charts. Hover over data points to see detailed information.',
        target: '.h-80',
        position: 'top',
        actions: [
          {
            label: 'Next',
            action: () => {},
          },
        ],
      },
      {
        id: 'analytics-tabs',
        title: 'Analysis Categories',
        description: 'Switch between these tabs to view different analyses: Market Overview, Price Trends, Market Distribution, and Hotspots.',
        target: '[role="tablist"]',
        position: 'bottom',
        actions: [
          {
            label: 'Finish Analytics Tutorial',
            action: () => {},
          },
        ],
      },
    ],
  },
];

// Provider component
export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TutorialCategory | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [aiAssistantMessage, setAiAssistantMessage] = useState('');

  // Initialize with AI welcome message
  useEffect(() => {
    setAiAssistantMessage(
      "Welcome to IntelligentEstate! I'm your AI assistant and I'll guide you through this powerful real estate analytics platform. Would you like to start with an introduction tutorial?"
    );
  }, []);

  // Start a tutorial for a specific category
  const startTutorial = (categoryId: string) => {
    const category = tutorialCategories.find((cat) => cat.id === categoryId);
    if (category) {
      setActiveCategory(category);
      // Resume from last saved position or start at beginning
      const savedProgress = progress[categoryId] || 0;
      setCurrentStepIndex(savedProgress);
      setIsActive(true);

      // Update AI message based on the category
      if (categoryId === 'introduction') {
        setAiAssistantMessage(
          "Let's start with a quick introduction to IntelligentEstate. I'll show you how to navigate the platform and access its key features."
        );
      } else if (categoryId === 'map') {
        setAiAssistantMessage(
          "The interactive property map is a powerful tool for exploring real estate listings. I'll show you how to use filters, different views, and property details."
        );
      } else if (categoryId === 'analytics') {
        setAiAssistantMessage(
          "The market analytics dashboard provides valuable insights into real estate trends. Let's explore how to analyze market data effectively."
        );
      }
    }
  };

  // End the current tutorial
  const endTutorial = () => {
    setIsActive(false);
    setActiveCategory(null);
    setAiAssistantMessage(
      "You've completed the tutorial! Feel free to explore the platform on your own, or start another tutorial when you're ready."
    );
  };

  // Go to the next step
  const nextStep = () => {
    if (activeCategory && currentStepIndex < activeCategory.steps.length - 1) {
      const newStepIndex = currentStepIndex + 1;
      setCurrentStepIndex(newStepIndex);
      
      // Update progress
      saveProgress(activeCategory.id, newStepIndex);
      
      // Update AI message based on the new step
      const newStep = activeCategory.steps[newStepIndex];
      updateAiMessageForStep(newStep);
    } else {
      // End of tutorial
      endTutorial();
    }
  };

  // Go to the previous step
  const prevStep = () => {
    if (activeCategory && currentStepIndex > 0) {
      const newStepIndex = currentStepIndex - 1;
      setCurrentStepIndex(newStepIndex);
      
      // Update AI message based on the new step
      const newStep = activeCategory.steps[newStepIndex];
      updateAiMessageForStep(newStep);
    }
  };

  // Go to a specific step
  const goToStep = (index: number) => {
    if (activeCategory && index >= 0 && index < activeCategory.steps.length) {
      setCurrentStepIndex(index);
      saveProgress(activeCategory.id, index);
      
      // Update AI message based on the new step
      const newStep = activeCategory.steps[index];
      updateAiMessageForStep(newStep);
    }
  };

  // Mark current step as complete
  const markStepComplete = () => {
    if (activeCategory) {
      saveProgress(activeCategory.id, currentStepIndex);
      nextStep();
    }
  };

  // Update AI message for a specific step
  const updateAiMessageForStep = (step: TutorialStep) => {
    // Generate a more conversational AI message based on the step
    const messages = {
      'welcome': "Welcome to IntelligentEstate! I'll be your guide through this powerful platform. Let's start with the basics.",
      'navigation': "This navigation bar is your main way to move around the application. Take a moment to familiarize yourself with the different sections.",
      'tabs': "These tabs let you switch between the map view and analytics dashboard - they're the heart of this platform.",
      'completion': "Great job! You've learned the basics of navigating IntelligentEstate. Would you like to explore the map features next?",
      'map-overview': "The interactive map shows all property listings in the area. You can zoom, pan, and interact with properties here.",
      'map-toggle': "Try switching between these different map views to see property data visualized in different ways.",
      'map-filters': "The filters panel helps you narrow down properties by criteria like price range, bedrooms, and property type.",
      'property-list': "This panel shows the properties currently visible on your map. Click any property to see more details about it.",
      'property-details': "When you select a property, you'll see detailed information about it in this panel, including price, features, and photos.",
      'analytics-overview': "The analytics dashboard gives you powerful insights into market trends and property valuations.",
      'analytics-selection': "Use these controls to select different areas and time periods for your market analysis.",
      'analytics-metrics': "These key metrics provide a quick snapshot of the current market conditions in your selected area.",
      'analytics-charts': "These interactive charts visualize trends over time. Hover over them to see specific data points.",
      'analytics-tabs': "Switch between these different analysis views to explore various aspects of the market."
    };
    
    // Set the message if it exists, otherwise use the step description
    setAiAssistantMessage(messages[step.id as keyof typeof messages] || step.description);
  };

  // Save progress for a category
  const saveProgress = (categoryId: string, stepIndex: number) => {
    setProgress((prev) => ({
      ...prev,
      [categoryId]: stepIndex,
    }));
  };

  // Update AI assistant message
  const updateAiMessage = (message: string) => {
    setAiAssistantMessage(message);
  };

  // Context value
  const value = {
    isActive,
    activeCategory,
    currentStepIndex,
    progress,
    startTutorial,
    endTutorial,
    nextStep,
    prevStep,
    goToStep,
    markStepComplete,
    categories: tutorialCategories,
    tutorialCategories,
    aiAssistantMessage,
    updateAiMessage,
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
};

// Custom hook to use the tutorial context
export const useTutorial = () => useContext(TutorialContext);

export default TutorialContext;