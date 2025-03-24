/**
 * MCP Tool Demo Component
 * 
 * This component demonstrates how to use the MCP tool with React hooks.
 * It provides a simple interface for sending prompts to the MCP tool.
 */

import React, { useState } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Send, BrainCircuit } from 'lucide-react';
import { useMCP } from '@/hooks/useAgent';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export function MCPToolDemo() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [temperature, setTemperature] = useState(0.7);
  const [response, setResponse] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { mutate: executeMCP, isPending } = useMCP();

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    
    setResponse('');
    
    const options = {
      model,
      temperature,
      tools: tools.length > 0 ? tools : undefined
    };
    
    executeMCP(
      { prompt, options },
      {
        onSuccess: (data) => {
          setResponse(data.result);
        },
        onError: (error) => {
          console.error('MCP error:', error);
          setResponse('Error: Could not process your request. Please try again.');
        }
      }
    );
  };
  
  const availableTools = [
    { id: 'search_web', label: 'Web Search' },
    { id: 'search_vector_db', label: 'Vector DB Search' },
    { id: 'calculator', label: 'Calculator' },
    { id: 'code_executor', label: 'Code Executor' },
  ];

  const handleToolToggle = (toolId: string) => {
    setTools(prev => 
      prev.includes(toolId)
        ? prev.filter(t => t !== toolId)
        : [...prev, toolId]
    );
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto shadow-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <CardTitle>Model Control Protocol (MCP)</CardTitle>
        </div>
        <CardDescription>
          Send prompts to AI models with fine-grained control over parameters and tools
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Enter your prompt here..."
            className="min-h-[120px]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        
        {/* Advanced Options Toggle */}
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>
        </div>
        
        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 bg-secondary/20 p-4 rounded-md">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={model}
                onValueChange={setModel}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>OpenAI Models</SelectLabel>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="temperature">Temperature: {temperature}</Label>
                <span className="text-xs text-muted-foreground">
                  {temperature === 0 ? 'Deterministic' : temperature < 0.3 ? 'Conservative' : temperature < 0.7 ? 'Balanced' : 'Creative'}
                </span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={(values) => setTemperature(values[0])}
              />
            </div>
            
            {/* Tools Selection */}
            <div className="space-y-2">
              <Label>Tools</Label>
              <div className="flex flex-wrap gap-2">
                {availableTools.map((tool) => (
                  <Button
                    key={tool.id}
                    type="button"
                    size="sm"
                    variant={tools.includes(tool.id) ? "default" : "outline"}
                    onClick={() => handleToolToggle(tool.id)}
                  >
                    {tool.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Response Display */}
        {(response || isPending) && (
          <div className="space-y-2 mt-4">
            <Label>Response</Label>
            <div className="min-h-[120px] p-3 bg-secondary/10 rounded-md whitespace-pre-wrap">
              {isPending ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Processing...</span>
                </div>
              ) : (
                response
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handleSubmit}
          disabled={isPending || !prompt.trim()}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send to MCP
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}