/**
 * TutorialButton Component
 * 
 * A floating action button that opens a menu of available tutorials.
 * This provides a way for users to initiate tutorials at any time.
 */

import React, { useState } from 'react';
import { useTutorial } from './TutorialContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LucideHelpCircle, LucideBookOpen, LucideMap, LucideBarChart4 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TutorialButton: React.FC = () => {
  const { startTutorial, categories, progress } = useTutorial();
  const [isOpen, setIsOpen] = useState(false);

  // Map of category IDs to icons
  const categoryIcons: Record<string, React.ReactNode> = {
    'introduction': <LucideBookOpen className="w-4 h-4 mr-2" />,
    'map': <LucideMap className="w-4 h-4 mr-2" />,
    'analytics': <LucideBarChart4 className="w-4 h-4 mr-2" />,
  };

  // Calculate tutorial completion status
  const getTutorialStatus = (categoryId: string) => {
    const stepProgress = progress[categoryId];
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) return { status: 'new', label: 'New' };
    
    if (stepProgress === undefined) {
      return { status: 'new', label: 'New' };
    } else if (stepProgress === category.steps.length - 1) {
      return { status: 'completed', label: 'Completed' };
    } else if (stepProgress > 0) {
      return { status: 'in-progress', label: 'In Progress' };
    }
    
    return { status: 'new', label: 'New' };
  };

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
          >
            <LucideHelpCircle className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Available Tutorials</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categories.map((category) => {
            const { status, label } = getTutorialStatus(category.id);
            
            return (
              <DropdownMenuItem
                key={category.id}
                onClick={() => {
                  startTutorial(category.id);
                  setIsOpen(false);
                }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  {categoryIcons[category.id] || <LucideHelpCircle className="w-4 h-4 mr-2" />}
                  <span>{category.name}</span>
                </div>
                <Badge 
                  variant={
                    status === 'completed' ? 'default' :
                    status === 'in-progress' ? 'outline' : 'secondary'
                  }
                  className="ml-2 text-xs"
                >
                  {label}
                </Badge>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TutorialButton;