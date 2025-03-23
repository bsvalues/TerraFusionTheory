/**
 * WelcomeScreen Component
 * 
 * This component displays an interactive welcome screen for first-time users
 * with feature highlights and getting started guidance.
 */

import React, { useState } from 'react';
import { useTutorial } from './TutorialContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LucideMapPin,
  LucideBarChart,
  LucideHome,
  LucideArrowRight,
  LucideCheck,
  LucideX
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tutorialCategory?: string;
}

interface WelcomeScreenProps {
  onClose: () => void;
  showAgain?: boolean;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onClose, showAgain = true }) => {
  const { startTutorial } = useTutorial();
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(!showAgain);

  // Define key features of the application
  const features: Feature[] = [
    {
      id: 'property-map',
      title: 'Interactive Property Map',
      description: 'Explore properties with our interactive map. Filter by various criteria and view detailed property information.',
      icon: <LucideMapPin className="h-8 w-8 text-primary" />,
      tutorialCategory: 'map'
    },
    {
      id: 'market-analytics',
      title: 'Market Analytics',
      description: 'Analyze market trends, pricing data, and key metrics to gain insights into the real estate market.',
      icon: <LucideBarChart className="h-8 w-8 text-primary" />,
      tutorialCategory: 'analytics'
    },
    {
      id: 'platform-overview',
      title: 'Platform Overview',
      description: 'Get familiar with the IntelligentEstate platform and its powerful features for real estate professionals.',
      icon: <LucideHome className="h-8 w-8 text-primary" />,
      tutorialCategory: 'introduction'
    }
  ];

  const handleStartTutorial = (categoryId?: string) => {
    if (categoryId) {
      startTutorial(categoryId);
    }
    onClose();
  };

  const handleNext = () => {
    if (activeFeatureIndex < features.length - 1) {
      setActiveFeatureIndex(activeFeatureIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (activeFeatureIndex > 0) {
      setActiveFeatureIndex(activeFeatureIndex - 1);
    }
  };

  const activeFeature = features[activeFeatureIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl mx-4 shadow-xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-bold animate-in slide-in-from-left-5 duration-300">
              Welcome to IntelligentEstate
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 transition-transform hover:scale-110 duration-200" 
              onClick={onClose}
            >
              <LucideX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-5 gap-6">
            {/* Feature navigation sidebar */}
            <div className="md:col-span-2 flex flex-col space-y-2">
              {features.map((feature, index) => (
                <Button
                  key={feature.id}
                  variant={index === activeFeatureIndex ? "default" : "outline"}
                  className={`justify-start h-auto py-3 px-4 transition-all animate-in slide-in-from-left-3 duration-300 delay-${index * 100}`}
                  onClick={() => setActiveFeatureIndex(index)}
                >
                  <div className="mr-3">{feature.icon}</div>
                  <div className="text-left">
                    <div className="font-medium">{feature.title}</div>
                  </div>
                </Button>
              ))}
            </div>

            {/* Feature details */}
            <div className="md:col-span-3 flex flex-col animate-in fade-in-50 slide-in-from-right-3 duration-300">
              <div className="flex justify-center mb-6">
                {activeFeature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4 text-center">{activeFeature.title}</h3>
              <p className="text-muted-foreground mb-6">{activeFeature.description}</p>
              
              {activeFeature.tutorialCategory && (
                <Button 
                  className="w-full mb-4 transition-all hover:translate-y-[-2px]"
                  onClick={() => handleStartTutorial(activeFeature.tutorialCategory)}
                >
                  Start {activeFeature.title} Tutorial
                  <LucideArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between border-t pt-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDontShowAgain(!dontShowAgain)}
              className="flex items-center space-x-2"
            >
              <div className="w-4 h-4 border border-input rounded flex items-center justify-center">
                {dontShowAgain && <LucideCheck className="h-3 w-3" />}
              </div>
              <span>Don't show this again</span>
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevious}
              disabled={activeFeatureIndex === 0}
              className="transition-all hover:translate-x-[-2px]"
            >
              Previous
            </Button>
            <Button 
              variant={activeFeatureIndex === features.length - 1 ? "default" : "outline"}
              size="sm" 
              onClick={handleNext}
              className="transition-all hover:translate-x-[2px]"
            >
              {activeFeatureIndex === features.length - 1 ? "Get Started" : "Next"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WelcomeScreen;