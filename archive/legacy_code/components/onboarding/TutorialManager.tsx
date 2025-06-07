/**
 * TutorialManager Component
 * 
 * This is the main component that integrates all tutorial-related components
 * and handles the tutorial workflow. It includes the tutorial provider,
 * overlay, and AI assistant.
 */

import React from 'react';
import { TutorialProvider } from './TutorialContext';
import TutorialOverlay from './TutorialOverlay';
import AIAssistant from './AIAssistant';

interface TutorialManagerProps {
  children: React.ReactNode;
  showButton?: boolean;
}

const TutorialManager: React.FC<TutorialManagerProps> = ({ 
  children,
  showButton = true
}) => {
  return (
    <TutorialProvider>
      {children}
      <TutorialOverlay />
      <AIAssistant />
      {/* Tutorial button will be added here */}
    </TutorialProvider>
  );
};

export default TutorialManager;