/**
 * TutorialOverlay Component
 * 
 * This component renders the step-by-step tutorial overlay with
 * highlighted target elements, instructions, and navigation controls.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useTutorial } from './TutorialContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideX, LucideArrowLeft, LucideArrowRight, LucideCheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Progress } from '@/components/ui/progress';

// Helper to get element coordinates
const getElementCoordinates = (selector: string | undefined) => {
  if (!selector) return null;
  
  const element = document.querySelector(selector);
  if (!element) return null;
  
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    element
  };
};

// Calculate tooltip position
const calculatePosition = (
  targetRect: { top: number; left: number; width: number; height: number } | null,
  tooltipWidth: number,
  tooltipHeight: number,
  position: 'top' | 'right' | 'bottom' | 'left' | 'center' = 'bottom'
) => {
  if (!targetRect || position === 'center') {
    // Center in the viewport
    return {
      top: window.innerHeight / 2 - tooltipHeight / 2,
      left: window.innerWidth / 2 - tooltipWidth / 2
    };
  }

  // Calculate position based on the specified direction
  switch (position) {
    case 'top':
      return {
        top: targetRect.top - tooltipHeight - 10,
        left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2
      };
    case 'right':
      return {
        top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        left: targetRect.left + targetRect.width + 10
      };
    case 'bottom':
      return {
        top: targetRect.top + targetRect.height + 10,
        left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2
      };
    case 'left':
      return {
        top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
        left: targetRect.left - tooltipWidth - 10
      };
    default:
      return {
        top: targetRect.top + targetRect.height + 10,
        left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2
      };
  }
};

const TutorialOverlay: React.FC = () => {
  const { 
    isActive, 
    activeCategory, 
    currentStepIndex, 
    endTutorial, 
    nextStep, 
    prevStep, 
    goToStep
  } = useTutorial();
  
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [highlightBox, setHighlightBox] = useState<null | {
    top: number;
    left: number;
    width: number;
    height: number;
  }>(null);
  
  // Update position and highlight when step changes
  useEffect(() => {
    if (!isActive || !activeCategory) return;
    
    const currentStep = activeCategory.steps[currentStepIndex];
    const targetEl = getElementCoordinates(currentStep.target);
    
    // Set the highlight box dimensions
    if (targetEl) {
      setHighlightBox({
        top: targetEl.top,
        left: targetEl.left,
        width: targetEl.width,
        height: targetEl.height
      });
      
      // Add a highlight class to the target element
      targetEl.element.classList.add('tutorial-target');
    } else {
      setHighlightBox(null);
    }
    
    // Calculate tooltip position after a short delay to ensure it's rendered
    setTimeout(() => {
      if (tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const tooltipPosition = calculatePosition(
          targetEl,
          tooltipRect.width,
          tooltipRect.height,
          currentStep.position
        );
        
        // Ensure tooltip stays within viewport
        const adjustedPosition = {
          top: Math.max(20, Math.min(window.innerHeight - tooltipRect.height - 20, tooltipPosition.top)),
          left: Math.max(20, Math.min(window.innerWidth - tooltipRect.width - 20, tooltipPosition.left))
        };
        
        setPosition(adjustedPosition);
      }
    }, 50);
    
    // Cleanup when component unmounts or step changes
    return () => {
      if (targetEl?.element) {
        targetEl.element.classList.remove('tutorial-target');
      }
    };
  }, [isActive, activeCategory, currentStepIndex]);
  
  // Exit early if tutorial is not active
  if (!isActive || !activeCategory) return null;
  
  const currentStep = activeCategory.steps[currentStepIndex];
  const isLastStep = currentStepIndex === activeCategory.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;
  const progressPercentage = ((currentStepIndex + 1) / activeCategory.steps.length) * 100;
  
  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={endTutorial} />
      
      {/* Highlight cutout */}
      {highlightBox && (
        <div
          className="absolute bg-transparent box-content border-2 border-primary z-10 pointer-events-none"
          style={{
            top: highlightBox.top - 4,
            left: highlightBox.left - 4,
            width: highlightBox.width,
            height: highlightBox.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)'
          }}
        />
      )}
      
      {/* Tutorial card */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-auto z-20"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          maxWidth: '350px',
          transition: 'top 0.2s, left 0.2s'
        }}
      >
        <Card className="shadow-lg border-primary/20">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg font-semibold">{currentStep.title}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={endTutorial}
              >
                <LucideX className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progressPercentage} className="h-1 mt-1" />
          </CardHeader>
          
          <CardContent className="text-sm">
            <p>{currentStep.description}</p>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-2">
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={prevStep}
                disabled={isFirstStep}
              >
                <LucideArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              
              <Button 
                size="sm" 
                onClick={nextStep}
              >
                {isLastStep ? (
                  <>
                    <LucideCheckCircle2 className="mr-1 h-4 w-4" />
                    Finish
                  </>
                ) : (
                  <>
                    Next
                    <LucideArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {currentStepIndex + 1} of {activeCategory.steps.length}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>,
    document.body
  );
};

export default TutorialOverlay;