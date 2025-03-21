import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, FastForward, Highlighter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define the structure for code blocks and animation steps
export interface CodeLine {
  code: string;
  indent: number;
  lineNumber: number;
  isComment?: boolean;
}

export interface CodeStep {
  id: number;
  title: string;
  description: string;
  highlightLines: number[];
  variables?: Record<string, any>;
  output?: string;
}

export interface CodeSnippetProps {
  title: string;
  description?: string;
  language: string;
  codeLines: CodeLine[];
  steps: CodeStep[];
  className?: string;
  onComplete?: () => void;
  speed?: number;
}

// This will allow syntax highlighting for various languages
const languageClassMap: Record<string, string> = {
  javascript: 'language-javascript',
  typescript: 'language-typescript',
  python: 'language-python',
  java: 'language-java',
  csharp: 'language-csharp',
  sql: 'language-sql',
  html: 'language-html',
  css: 'language-css',
};

const DEFAULT_SPEED = 1;
const SPEEDS = [0.5, 1, 1.5, 2];

const CodeSnippetTheater: React.FC<CodeSnippetProps> = ({
  title,
  description,
  language,
  codeLines,
  steps,
  className,
  onComplete,
  speed = DEFAULT_SPEED,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(speed);
  const [showVariables, setShowVariables] = useState(true);
  const playbackRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the language class for syntax highlighting
  const languageClass = languageClassMap[language] || 'language-plaintext';
  
  // Clear any existing interval when component unmounts
  useEffect(() => {
    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, []);
  
  // Handle auto-playback when isPlaying is true
  useEffect(() => {
    if (isPlaying) {
      playbackRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          const nextStep = prev + 1;
          if (nextStep >= steps.length) {
            setIsPlaying(false);
            if (onComplete) onComplete();
            return prev;
          }
          return nextStep;
        });
      }, 3000 / playbackSpeed); // Adjust speed
    } else if (playbackRef.current) {
      clearInterval(playbackRef.current);
    }
    
    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [isPlaying, steps.length, playbackSpeed, onComplete]);
  
  // Check if a line should be highlighted based on current step
  const isLineHighlighted = (lineNumber: number) => {
    return steps[currentStep]?.highlightLines.includes(lineNumber);
  };
  
  // Move to previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Move to next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (onComplete) {
      onComplete();
    }
  };
  
  // Toggle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Reset to first step
  const reset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };
  
  // Skip to the end
  const skipToEnd = () => {
    setIsPlaying(false);
    setCurrentStep(steps.length - 1);
  };
  
  // Change current step using slider
  const handleSliderChange = (value: number[]) => {
    setCurrentStep(value[0]);
  };
  
  // Change playback speed
  const handleSpeedChange = (value: string) => {
    setPlaybackSpeed(parseFloat(value));
  };
  
  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Code display area */}
        <div className="relative rounded-md border overflow-hidden bg-zinc-950 text-white">
          <div className="p-4 font-mono text-sm overflow-auto max-h-[400px]">
            <div className="flex">
              {/* Line numbers */}
              <div className="pr-4 text-zinc-500 select-none">
                {codeLines.map((line, idx) => (
                  <div key={`line-num-${idx}`} className="text-right">
                    {line.lineNumber}
                  </div>
                ))}
              </div>
              
              {/* Code lines */}
              <div className="flex-1">
                {codeLines.map((line, idx) => (
                  <div 
                    key={`line-${idx}`} 
                    className={cn(
                      "whitespace-pre",
                      isLineHighlighted(line.lineNumber) ? "bg-yellow-500/20" : "",
                      line.isComment ? "text-zinc-500" : ""
                    )}
                    style={{ paddingLeft: `${line.indent * 1.2}rem` }}
                  >
                    <code className={languageClass}>{line.code}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Explanation and variables section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step description */}
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">{steps[currentStep]?.title || "Step"}</h3>
            <p className="text-sm">{steps[currentStep]?.description || "No description"}</p>
            
            {/* Output display if available */}
            {steps[currentStep]?.output && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">Output:</h4>
                <pre className="bg-zinc-900 p-2 rounded text-white text-xs overflow-auto">
                  {steps[currentStep].output}
                </pre>
              </div>
            )}
          </div>
          
          {/* Variables panel */}
          {showVariables && (
            <div className="bg-muted p-4 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Variables</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowVariables(!showVariables)}
                  className="h-6 px-2"
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
              </div>
              
              {steps[currentStep]?.variables ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(steps[currentStep].variables || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-mono text-blue-600 dark:text-blue-400">{key}:</span>
                      <span className="font-mono">
                        {typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No variables for this step</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        {/* Progress bar slider */}
        <div className="w-full">
          <Slider
            value={[currentStep]}
            max={steps.length - 1}
            step={1}
            onValueChange={handleSliderChange}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Step {currentStep + 1}</span>
            <span>Total: {steps.length}</span>
          </div>
        </div>
        
        {/* Playback controls */}
        <div className="flex justify-between items-center w-full">
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={reset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={prevStep} disabled={currentStep === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Previous Step</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPlaying ? 'Pause' : 'Play'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={nextStep}
                    disabled={currentStep === steps.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Next Step</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={skipToEnd}>
                    <FastForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Skip to End</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Speed:</span>
            <Select 
              value={playbackSpeed.toString()} 
              onValueChange={handleSpeedChange}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="1x" />
              </SelectTrigger>
              <SelectContent>
                {SPEEDS.map(s => (
                  <SelectItem key={s} value={s.toString()}>
                    {s}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CodeSnippetTheater;