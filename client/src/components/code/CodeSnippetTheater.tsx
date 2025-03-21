import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronRight,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';

export interface CodeLine {
  lineNumber: number;
  indent: number;
  code: string;
  isComment: boolean;
}

export interface CodeStep {
  id: number;
  title: string;
  description: string;
  highlightLines: number[];
  variables: Record<string, any>;
  output?: string;
}

interface CodeSnippetTheaterProps {
  title: string;
  description: string;
  language: string;
  codeLines: CodeLine[];
  steps: CodeStep[];
}

const CodeSnippetTheater: React.FC<CodeSnippetTheaterProps> = ({
  title,
  description,
  language,
  codeLines,
  steps
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2); // seconds per step
  const [showVariables, setShowVariables] = useState(true);
  const [showOutput, setShowOutput] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];

  // Autoplay functionality
  useEffect(() => {
    if (isPlaying) {
      timeoutRef.current = setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, playbackSpeed * 1000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying, currentStepIndex, steps.length, playbackSpeed]);

  // Scroll highlighted lines into view
  useEffect(() => {
    if (codeContainerRef.current && currentStep) {
      const highlightedLines = currentStep.highlightLines;
      if (highlightedLines && highlightedLines.length > 0) {
        const lineToScrollTo = highlightedLines[0]; // Scroll to first highlighted line
        const lineElement = codeContainerRef.current.querySelector(`[data-line-number="${lineToScrollTo}"]`);
        if (lineElement) {
          lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentStep]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const goToFirstStep = () => {
    setCurrentStepIndex(0);
  };

  const goToLastStep = () => {
    setCurrentStepIndex(steps.length - 1);
  };

  const resetPlayback = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const toggleVariablesDisplay = () => {
    setShowVariables(!showVariables);
  };

  const toggleOutputDisplay = () => {
    setShowOutput(!showOutput);
  };

  const formatValue = (value: any): string => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      return `[${value.map(v => typeof v === 'string' ? `"${v}"` : v).join(', ')}]`;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return String(value);
  };

  // Determines if a line should be highlighted based on the current step
  const isLineHighlighted = (lineNumber: number) => {
    return currentStep && currentStep.highlightLines.includes(lineNumber);
  };

  // Syntax highlighting colors based on language
  const getSyntaxColor = (code: string, isComment: boolean, language: string) => {
    if (isComment) return 'text-gray-500';

    // Very basic syntax highlighting - in a real app, use a proper library
    if (language === 'javascript' || language === 'typescript') {
      if (/\b(function|return|if|else|for|while|do|switch|case|break|continue|new|try|catch|finally|throw|typeof|instanceof|var|let|const)\b/.test(code)) {
        return 'text-purple-600'; // Keywords
      }
      if (/\b(true|false|null|undefined|NaN|Infinity)\b/.test(code)) {
        return 'text-blue-600'; // Constants
      }
      if (/\b(console)\b/.test(code)) {
        return 'text-green-600'; // Console
      }
      if (/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`/.test(code)) {
        return 'text-yellow-600'; // Strings
      }
      if (/\b\d+\b/.test(code)) {
        return 'text-blue-600'; // Numbers
      }
    } else if (language === 'python') {
      if (/\b(def|import|from|as|return|if|elif|else|for|while|break|continue|try|except|finally|raise|with|in|is|not|and|or|True|False|None)\b/.test(code)) {
        return 'text-purple-600'; // Keywords
      }
      if (/\b(print)\b/.test(code)) {
        return 'text-green-600'; // Print
      }
      if (/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/.test(code)) {
        return 'text-yellow-600'; // Strings
      }
      if (/\b\d+\b/.test(code)) {
        return 'text-blue-600'; // Numbers
      }
    } else if (language === 'sql') {
      if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|TABLE|FROM|WHERE|GROUP BY|ORDER BY|JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|HAVING|AS|ON|AND|OR|NOT|IN|BETWEEN|LIKE|IS NULL|IS NOT NULL|COUNT|SUM|AVG|MAX|MIN|DISTINCT)\b/i.test(code)) {
        return 'text-purple-600'; // Keywords
      }
      if (/'([^'\\]|\\.)*'/.test(code)) {
        return 'text-yellow-600'; // Strings
      }
      if (/\b\d+\b/.test(code)) {
        return 'text-blue-600'; // Numbers
      }
    }

    return 'text-gray-900'; // Default text color
  };

  return (
    <div className="code-theater">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="w-full md:w-1/2">
          <h4 className="text-md font-semibold mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          
          {/* Step navigation */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">
                Step {currentStepIndex + 1} of {steps.length}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleVariablesDisplay} 
                  className="text-xs"
                >
                  {showVariables ? 'Hide Variables' : 'Show Variables'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleOutputDisplay} 
                  className="text-xs"
                >
                  {showOutput ? 'Hide Output' : 'Show Output'}
                </Button>
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-md mb-4">
              <h5 className="font-medium mb-1">{currentStep.title}</h5>
              <p className="text-sm">{currentStep.description}</p>
            </div>
            
            {/* Playback controls */}
            <div className="flex items-center space-x-2 mb-4">
              <Button variant="outline" size="icon" onClick={goToFirstStep} title="First Step">
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-3" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToPreviousStep} title="Previous Step">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={togglePlayback} variant="default" className="flex-1">
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextStep} title="Next Step">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToLastStep} title="Last Step">
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-3" />
              </Button>
              <Button variant="outline" size="icon" onClick={resetPlayback} title="Reset">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Playback speed control */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Fast</span>
                <span>Slow</span>
              </div>
              <Slider 
                defaultValue={[playbackSpeed]} 
                max={5}
                min={0.5}
                step={0.5}
                onValueChange={(value: number[]) => setPlaybackSpeed(value[0])}
              />
            </div>
            
            {/* Variables display */}
            {showVariables && Object.keys(currentStep.variables).length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Variables:</h5>
                <div className="bg-muted p-3 rounded-md overflow-x-auto">
                  <pre className="text-xs">
                    {Object.entries(currentStep.variables).map(([key, value]) => (
                      <div key={key} className="mb-1">
                        <span className="text-blue-600">{key}</span>: <span className="text-gray-900">{formatValue(value)}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Output display */}
            {showOutput && currentStep.output && (
              <div className="mt-4">
                <h5 className="text-sm font-medium mb-2">Output:</h5>
                <div className="bg-black text-white p-3 rounded-md overflow-x-auto max-h-40">
                  <pre className="text-xs whitespace-pre-wrap">{currentStep.output}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Code display */}
        <div className="w-full md:w-1/2">
          <div className="border rounded-md overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b flex items-center">
              <span className="text-sm font-medium">{language}</span>
            </div>
            <div 
              ref={codeContainerRef}
              className="bg-white p-4 overflow-auto max-h-[500px] code-font-mono"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
            >
              {codeLines.map((line) => (
                <div 
                  key={line.lineNumber}
                  data-line-number={line.lineNumber}
                  className={`flex ${isLineHighlighted(line.lineNumber) ? 'bg-yellow-100' : ''}`}
                >
                  <div className="text-gray-400 text-right mr-4 select-none w-8">{line.lineNumber}</div>
                  <div className="overflow-x-auto w-full">
                    <span style={{ marginLeft: `${line.indent * 1}rem` }} className={getSyntaxColor(line.code, line.isComment, language)}>
                      {line.code || '\u00A0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeSnippetTheater;