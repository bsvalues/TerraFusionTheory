/**
 * ContextHelp Component
 * 
 * A reusable component to display context-sensitive help tooltips
 * throughout the application.
 */

import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HelpCircle as HelpCircleIcon, ExternalLink as ExternalLinkIcon } from 'lucide-react';

export interface ContextHelpProps {
  title: string;
  content: React.ReactNode;
  helpLink?: string;
  helpLinkText?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconClassName?: string;
}

export function ContextHelp({
  title,
  content,
  helpLink,
  helpLinkText = "Learn more",
  position = 'top',
  size = 'md',
  className = "",
  iconClassName = ""
}: ContextHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const iconSize = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }[size];
  
  const contentWidth = {
    sm: 'w-48',
    md: 'w-72',
    lg: 'w-96'
  }[size];
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-auto w-auto rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground ${className}`}
          onClick={() => setIsOpen(true)}
          aria-label={`Help for ${title}`}
        >
          <HelpCircleIcon className={`${iconSize} ${iconClassName}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={`${contentWidth} p-0`} 
        side={position}
        sideOffset={5}
        align="center"
      >
        <Card className="border-0 shadow-none">
          <div className="p-4">
            <h3 className="font-medium text-base mb-2">{title}</h3>
            <div className="text-sm text-muted-foreground">
              {content}
            </div>
            {helpLink && (
              <div className="mt-3 pt-2 border-t">
                <Link href={helpLink}>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-xs font-normal text-primary"
                  >
                    {helpLinkText}
                    <ExternalLinkIcon className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

export default ContextHelp;