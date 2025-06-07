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
    <div className={`fixed ${positionClasses[position]} z-40 ${className} animate-in fade-in slide-in-from-bottom-5 duration-700`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:bg-primary/90 animate-pulse-glow"
            variant="default"
          >
            <LucideHelpCircle className="h-6 w-6 transition-transform duration-200" />
            <span className="sr-only">Open Tutorial</span>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56 animate-in zoom-in-95 duration-300">
          <DropdownMenuLabel>Tutorial Categories</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {tutorialCategories.map((category: TutorialCategory, index: number) => (
            <DropdownMenuItem
              key={category.id}
              onClick={() => startTutorial(category.id)}
              className={`cursor-pointer hover:bg-primary/10 transition-colors duration-200 animate-in slide-in-from-right-3 duration-300 fade-in`}
              style={{ animationDelay: `${index * 75}ms` }}
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