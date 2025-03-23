/**
 * TutorialButton Component
 * 
 * This component provides a floating button to access the tutorial
 * from anywhere in the application.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { useTutorial, TutorialCategory } from './TutorialContext';
import { LucideHelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TutorialButtonProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const TutorialButton: React.FC<TutorialButtonProps> = ({
  className = '',
  position = 'bottom-right'
}) => {
  const { startTutorial, tutorialCategories } = useTutorial();

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg"
            variant="default"
          >
            <LucideHelpCircle className="h-6 w-6" />
            <span className="sr-only">Open Tutorial</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Tutorial Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {tutorialCategories.map((category: TutorialCategory) => (
            <DropdownMenuItem
              key={category.id}
              onClick={() => startTutorial(category.id)}
              className="cursor-pointer"
            >
              {category.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TutorialButton;