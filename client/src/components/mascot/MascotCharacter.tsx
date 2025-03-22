import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  ThumbsUp, 
  AlertTriangle, 
  Bug, 
  Code, 
  Coffee, 
  Zap 
} from 'lucide-react';
import MascotSvg from './MascotSvg';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export type MascotMood = 'happy' | 'thinking' | 'surprised' | 'sleepy' | 'excited';
export type MascotAction = 'wave' | 'dance' | 'jump' | 'spin' | 'idle';

export interface MascotTip {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'error' | 'success';
  code?: string;
  link?: string;
  dismissable?: boolean;
  mood?: MascotMood;
  action?: MascotAction;
}

interface MascotCharacterProps {
  name?: string;
  defaultMood?: MascotMood;
  defaultAction?: MascotAction;
  tips?: MascotTip[];
  onTipDismiss?: (tipId: string) => void;
  onTipAction?: (tipId: string) => void;
  className?: string;
}

const MascotCharacter: React.FC<MascotCharacterProps> = ({
  name = "Cody",
  defaultMood = "happy",
  defaultAction = "idle",
  tips = [],
  onTipDismiss,
  onTipAction,
  className = "",
}) => {
  const [mood, setMood] = useState<MascotMood>(defaultMood);
  const [action, setAction] = useState<MascotAction>(defaultAction);
  const [activeTip, setActiveTip] = useState<MascotTip | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [isMascotVisible, setIsMascotVisible] = useState(true);
  const { toast } = useToast();
  
  // Set a new tip when tips change or after dismissing
  useEffect(() => {
    if (tips.length > 0 && !activeTip) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setActiveTip(randomTip);
      setShowBubble(true);
      
      // Set mood based on tip type or specified mood
      if (randomTip.mood) {
        setMood(randomTip.mood);
      } else {
        switch (randomTip.type) {
          case 'error':
            setMood('surprised');
            break;
          case 'warning':
            setMood('thinking');
            break;
          case 'success':
            setMood('happy');
            break;
          default:
            setMood('happy');
        }
      }
      
      // Set action if specified
      if (randomTip.action) {
        setAction(randomTip.action);
        
        // Reset to idle after animation
        const actionDuration = randomTip.action === 'dance' ? 3000 : 1500;
        setTimeout(() => {
          setAction('idle');
        }, actionDuration);
      }
    }
  }, [tips, activeTip]);
  
  const handleDismissTip = () => {
    if (activeTip && onTipDismiss) {
      onTipDismiss(activeTip.id);
    }
    setShowBubble(false);
    
    // Clear active tip after animation
    setTimeout(() => {
      setActiveTip(null);
    }, 300);
  };
  
  const handleTipAction = () => {
    if (activeTip && onTipAction) {
      onTipAction(activeTip.id);
      
      // If we have code, copy it to clipboard
      if (activeTip.code) {
        navigator.clipboard.writeText(activeTip.code)
          .then(() => {
            toast({
              title: "Code copied!",
              description: "The suggested code has been copied to your clipboard.",
              duration: 3000,
            });
          })
          .catch(err => {
            console.error('Failed to copy code:', err);
          });
      }
      
      // If we have a link, open it
      if (activeTip.link) {
        window.open(activeTip.link, '_blank');
      }
    }
  };
  
  const toggleMascotVisibility = () => {
    setIsMascotVisible(!isMascotVisible);
  };
  
  // We're already importing the component at the top
  
  // Get the appropriate icon for the tip type
  const getTipIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Code className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <Bug className="h-4 w-4" />;
      case 'success':
        return <ThumbsUp className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };
  
  // Animations for different actions
  const getAnimationProps = () => {
    switch (action) {
      case 'wave':
        return {
          animate: {
            rotate: [0, 20, -10, 20, 0],
            transition: { duration: 1, repeat: 1 }
          }
        };
      case 'dance':
        return {
          animate: {
            y: [0, -15, 0, -15, 0],
            x: [0, 10, 0, -10, 0],
            rotate: [0, 5, 0, -5, 0],
            transition: { duration: 2, repeat: Infinity }
          }
        };
      case 'jump':
        return {
          animate: {
            y: [0, -20, 0],
            transition: { duration: 0.5, repeat: 2 }
          }
        };
      case 'spin':
        return {
          animate: {
            rotate: [0, 360],
            transition: { duration: 1 }
          }
        };
      default:
        return {
          animate: {
            y: [0, -5, 0],
            transition: { duration: 2, repeat: Infinity }
          }
        };
    }
  };
  
  if (!isMascotVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                onClick={toggleMascotVisibility}
                className="rounded-full h-10 w-10 p-1 shadow-lg bg-primary text-primary-foreground"
              >
                <Coffee className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Show {name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex flex-col items-end ${className}`}>
      {/* Speech bubble with tip */}
      <AnimatePresence>
        {showBubble && activeTip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className={`
              mb-2 max-w-xs rounded-lg shadow-lg p-3 relative
              ${activeTip.type === 'error' ? 'bg-destructive text-destructive-foreground' :
                activeTip.type === 'warning' ? 'bg-warning text-warning-foreground' :
                activeTip.type === 'success' ? 'bg-success text-success-foreground' :
                'bg-muted text-muted-foreground'
              }
            `}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 font-medium mb-1">
                {getTipIcon(activeTip.type)}
                <span>{name} says:</span>
              </div>
              {activeTip.dismissable !== false && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismissTip}
                  className="h-5 w-5 rounded-full -mt-1 -mr-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <p className="text-sm mb-2">{activeTip.text}</p>
            
            {activeTip.code && (
              <div className="bg-black/10 dark:bg-white/10 rounded p-2 my-2 overflow-x-auto text-xs font-mono">
                <pre>{activeTip.code}</pre>
              </div>
            )}
            
            {(activeTip.code || activeTip.link) && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs mt-1 flex items-center gap-1 hover:bg-black/10 dark:hover:bg-white/10"
                onClick={handleTipAction}
              >
                {activeTip.code ? 'Copy Solution' : 'Learn More'} <Zap className="h-3 w-3 ml-1" />
              </Button>
            )}
            
            {/* Speech bubble pointer */}
            <div className="absolute -bottom-2 right-4 w-4 h-4 rotate-45 
              ${activeTip.type === 'error' ? 'bg-destructive' :
                activeTip.type === 'warning' ? 'bg-warning' :
                activeTip.type === 'success' ? 'bg-success' :
                'bg-muted'
              }"
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mascot container */}
      <div className="flex items-end">
        {/* Mascot character - using emoji for simplicity, could replace with custom SVG or image */}
        <motion.div
          className="cursor-pointer relative bg-muted p-2 rounded-full shadow-lg"
          onClick={() => {
            if (!showBubble && activeTip) {
              setShowBubble(true);
            } else if (showBubble) {
              handleDismissTip();
            } else {
              setAction('wave');
              setTimeout(() => setAction('idle'), 1000);
            }
          }}
          {...getAnimationProps()}
        >
          <MascotSvg mood={mood} size={60} />
          
          {/* Toggle visibility button */}
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              toggleMascotVisibility();
            }}
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default MascotCharacter;