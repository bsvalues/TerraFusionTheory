import React, { useState, useEffect } from 'react';
import { X, Copy, ExternalLink, MessageSquare } from 'lucide-react';
import MascotSvg from './MascotSvg';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useToast } from '@/hooks/use-toast';

// Types of tooltips/tips the mascot can provide
export type MascotTipType = 'error' | 'warning' | 'info' | 'success';

// Mascot mood states for visual feedback
export type MascotMood = 'happy' | 'thinking' | 'surprised' | 'sad' | 'excited' | 'sleepy';

// Mascot animations/actions
export type MascotAction = 'idle' | 'jump' | 'wave' | 'dance' | 'spin';

// Structure of a tip/hint from the mascot
export interface MascotTip {
  id: string;
  type: MascotTipType;
  text: string;
  code?: string;
  link?: string;
  mood?: MascotMood;
  action?: MascotAction;
}

interface MascotCharacterProps {
  name: string;
  defaultMood?: MascotMood;
  defaultAction?: MascotAction;
  tips: MascotTip[];
  onTipDismiss: (id: string) => void;
  onTipAction: (id: string) => void;
}

const MascotCharacter: React.FC<MascotCharacterProps> = ({
  name,
  defaultMood = 'happy',
  defaultAction = 'idle',
  tips,
  onTipDismiss,
  onTipAction,
}) => {
  const { toast } = useToast();
  const [mood, setMood] = useState<MascotMood>(defaultMood);
  const [action, setAction] = useState<MascotAction>(defaultAction);
  const [showTips, setShowTips] = useState<boolean>(false);
  const [activeTip, setActiveTip] = useState<MascotTip | null>(null);
  
  // Update mascot mood and action based on latest tip
  useEffect(() => {
    if (tips.length > 0) {
      const latestTip = tips[tips.length - 1];
      if (latestTip?.mood) {
        setMood(latestTip.mood);
      }
      if (latestTip?.action) {
        setAction(latestTip.action);
        
        // Reset action to idle after animation completes
        const actionTimeout = setTimeout(() => {
          setAction('idle');
        }, 3000);
        
        return () => clearTimeout(actionTimeout);
      }
    }
  }, [tips]);
  
  // Handle copying code to clipboard
  const handleCopyCode = (code: string, tipId: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        toast({
          title: "Code copied!",
          description: "The code example has been copied to your clipboard.",
          variant: "default",
        });
        onTipAction(tipId);
      })
      .catch(err => {
        console.error('Could not copy code:', err);
        toast({
          title: "Copy failed",
          description: "Could not copy code to clipboard.",
          variant: "destructive",
        });
      });
  };
  
  // Handle opening external links
  const handleOpenLink = (link: string, tipId: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
    onTipAction(tipId);
  };
  
  // Handle dismissing a tip
  const handleDismissTip = (tipId: string) => {
    onTipDismiss(tipId);
    if (activeTip && activeTip.id === tipId) {
      setActiveTip(null);
    }
  };
  
  // Map tip type to color variant
  const getTipColorVariant = (type: MascotTipType): string => {
    switch (type) {
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-950/30';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30';
      case 'success':
        return 'border-green-500 bg-green-50 dark:bg-green-950/30';
      case 'info':
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/30';
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
      {/* Tips panel */}
      {showTips && tips.length > 0 && (
        <div className="mb-2 max-h-[70vh] w-80 overflow-y-auto rounded-lg border bg-background shadow-lg">
          <div className="sticky top-0 flex items-center justify-between border-b bg-background p-2">
            <h3 className="text-sm font-medium">Coding Tips ({tips.length})</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowTips(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {tips.map((tip) => (
              <Card 
                key={tip.id} 
                className={`mb-2 border-l-4 ${getTipColorVariant(tip.type)}`}
              >
                <CardHeader className="p-3 pb-0">
                  <div className="flex justify-between">
                    <CardTitle className="text-sm">
                      {tip.type === 'error' && 'Error Detected'}
                      {tip.type === 'warning' && 'Warning'}
                      {tip.type === 'info' && 'Coding Tip'}
                      {tip.type === 'success' && 'Success Tip'}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDismissTip(tip.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    From {name} the coding companion
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-3">
                  <p className="text-sm">{tip.text}</p>
                  
                  {tip.code && (
                    <div className="mt-2 rounded-md bg-muted p-2">
                      <pre className="text-xs overflow-x-auto">
                        <code>{tip.code}</code>
                      </pre>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="flex justify-end space-x-2 p-2 pt-0">
                  {tip.code && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleCopyCode(tip.code!, tip.id)}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy Code
                    </Button>
                  )}
                  
                  {tip.link && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleOpenLink(tip.link!, tip.id)}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Learn More
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Active tip display */}
      {activeTip && !showTips && (
        <div className={`mb-2 w-64 rounded-lg border-l-4 border bg-background p-3 shadow-lg ${getTipColorVariant(activeTip.type)}`}>
          <div className="flex justify-between">
            <p className="text-xs font-medium">
              {activeTip.type === 'error' && 'Error Tip'}
              {activeTip.type === 'warning' && 'Warning'}
              {activeTip.type === 'info' && 'Coding Tip'}
              {activeTip.type === 'success' && 'Success Tip'}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => setActiveTip(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="mt-1 text-xs">{activeTip.text}</p>
          <div className="mt-2 flex justify-end space-x-2">
            {activeTip.code && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => handleCopyCode(activeTip.code!, activeTip.id)}
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
            )}
            
            {activeTip.link && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => handleOpenLink(activeTip.link!, activeTip.id)}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Link
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Mascot character with hover interaction */}
      <HoverCard openDelay={100} closeDelay={200}>
        <HoverCardTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full bg-background p-1 shadow-md"
            onClick={() => {
              if (tips.length > 0) {
                if (showTips) {
                  setShowTips(false);
                  setActiveTip(tips[tips.length - 1]);
                } else {
                  setShowTips(true);
                  setActiveTip(null);
                }
              } else {
                // No tips, just animate the mascot
                setAction(action === 'idle' ? 'wave' : 'idle');
                setTimeout(() => setAction('idle'), 2000);
              }
            }}
          >
            <MascotSvg mood={mood} action={action} size={40} />
          </Button>
        </HoverCardTrigger>
        
        <HoverCardContent 
          side="top" 
          align="end" 
          className="w-48 p-2"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">Coding Companion</p>
            </div>
            
            {tips.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setShowTips(true);
                  setActiveTip(null);
                }}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="mt-2">
            <p className="text-xs">
              {tips.length === 0 && "I'll provide coding tips when errors occur!"}
              {tips.length === 1 && "You have 1 coding tip available!"}
              {tips.length > 1 && `You have ${tips.length} coding tips available!`}
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export default MascotCharacter;