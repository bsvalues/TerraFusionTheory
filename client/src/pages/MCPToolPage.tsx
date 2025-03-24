/**
 * MCP Tool Page
 * 
 * This page showcases the MCP Tool integration with a demo UI.
 */

import React from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  CircuitBoard, 
  Code, 
  Workflow, 
  Library, 
  PanelRight
} from 'lucide-react';
import { MCPToolDemo } from '@/components/ai/MCPToolDemo';
import Footer from '@/components/layout/Footer';

export default function MCPToolPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <CircuitBoard className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Model Control Protocol Integration</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Interact with AI models through a controlled interface with enhanced capabilities
          </p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="demo" className="flex items-center">
              <PanelRight className="h-4 w-4 mr-2" />
              MCP Demo
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center">
              <Workflow className="h-4 w-4 mr-2" />
              Architecture
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center">
              <Code className="h-4 w-4 mr-2" />
              Integration Code
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center">
              <Library className="h-4 w-4 mr-2" />
              Documentation
            </TabsTrigger>
          </TabsList>
          
          {/* MCP Demo Tab */}
          <TabsContent value="demo" className="space-y-8">
            <div className="max-w-3xl mx-auto">
              <MCPToolDemo />
            </div>
          </TabsContent>
          
          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>MCP Architecture</CardTitle>
                <CardDescription>
                  How the Model Control Protocol integrates with our system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary/20 rounded-md p-6 border border-border">
                  <div className="flex flex-col space-y-6">
                    {/* Frontend Layer */}
                    <div className="bg-background rounded-md p-4 border border-border">
                      <h3 className="text-lg font-semibold mb-2">Frontend Layer</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-primary/10 rounded p-2 text-center">React UI Components</div>
                        <div className="bg-primary/10 rounded p-2 text-center">TanStack Query Hooks</div>
                        <div className="bg-primary/10 rounded p-2 text-center">API Service Client</div>
                      </div>
                    </div>
                    
                    {/* API Layer */}
                    <div className="relative">
                      <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-border"></div>
                      <div className="bg-background rounded-md p-4 border border-border">
                        <h3 className="text-lg font-semibold mb-2">API Layer</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-primary/10 rounded p-2 text-center">Express Routes</div>
                          <div className="bg-primary/10 rounded p-2 text-center">Validation</div>
                          <div className="bg-primary/10 rounded p-2 text-center">Rate Limiting</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* MCP Core */}
                    <div className="relative">
                      <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-border"></div>
                      <div className="bg-background rounded-md p-4 border border-primary">
                        <h3 className="text-lg font-semibold mb-2 text-primary">MCP Core</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="bg-primary/10 rounded p-2 text-center font-medium">Model Control Protocol</div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-secondary/30 rounded p-2 text-center text-sm">Tool Registry</div>
                            <div className="bg-secondary/30 rounded p-2 text-center text-sm">Context Manager</div>
                            <div className="bg-secondary/30 rounded p-2 text-center text-sm">Model Router</div>
                            <div className="bg-secondary/30 rounded p-2 text-center text-sm">Response Formatter</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* External Services */}
                    <div className="relative">
                      <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-border"></div>
                      <div className="bg-background rounded-md p-4 border border-border">
                        <h3 className="text-lg font-semibold mb-2">External Services</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-primary/10 rounded p-2 text-center">OpenAI API</div>
                          <div className="bg-primary/10 rounded p-2 text-center">Vector Database</div>
                          <div className="bg-primary/10 rounded p-2 text-center">Tool-specific APIs</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Integration Code Tab */}
          <TabsContent value="code" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frontend Integration</CardTitle>
                  <CardDescription>
                    React hooks and components
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-80 font-mono text-sm">
{`// Example React hook usage
import { useMCP } from '@/hooks/useAgent';

function MyComponent() {
  const { mutate, isPending } = useMCP();
  
  const handleSubmit = () => {
    mutate(
      { 
        prompt: "Your prompt here",
        options: {
          model: "gpt-3.5-turbo",
          temperature: 0.7
        }
      },
      {
        onSuccess: (data) => {
          console.log(data.result);
        }
      }
    );
  };
  
  return (
    <button 
      onClick={handleSubmit}
      disabled={isPending}
    >
      {isPending ? "Processing..." : "Send"}
    </button>
  );
}`}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Backend Integration</CardTitle>
                  <CardDescription>
                    API endpoint setup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-80 font-mono text-sm">
{`// Example Express route handler
app.post('/api/tools/mcp', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    
    // Validate input
    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }
    
    // Execute MCP operation
    const result = await mcpTool.execute(prompt, options);
    
    // Return response
    return res.json({
      result: result.content,
      usage: result.usage,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('MCP error:', error);
    return res.status(500).json({
      error: 'Failed to process MCP request'
    });
  }
});`}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>MCP Documentation</CardTitle>
                <CardDescription>
                  How to use the Model Control Protocol in your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Overview</h3>
                  <p className="text-muted-foreground">
                    The Model Control Protocol (MCP) provides a standardized interface for interacting with
                    AI models with enhanced control over parameters, tools, and context. It allows for consistent
                    integration across different model providers while adding security, monitoring, and extension capabilities.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">Key Concepts</h3>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li><span className="font-medium text-foreground">Tools:</span> Extensions that give the model additional capabilities (web search, calculation, etc.)</li>
                    <li><span className="font-medium text-foreground">Context:</span> Additional information provided to the model to inform its responses</li>
                    <li><span className="font-medium text-foreground">Model Router:</span> Directs requests to the appropriate model based on requirements</li>
                    <li><span className="font-medium text-foreground">Response Formatting:</span> Standardizes outputs for consistent parsing</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">Available Tools</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <Card className="bg-secondary/10">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base">Web Search</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 px-4">
                        <p className="text-sm">Searches the web for up-to-date information beyond the model's knowledge cutoff.</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-secondary/10">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base">Vector DB Search</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 px-4">
                        <p className="text-sm">Searches vector databases for semantically similar content.</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-secondary/10">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base">Calculator</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 px-4">
                        <p className="text-sm">Performs precise mathematical calculations beyond model capabilities.</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-secondary/10">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-base">Code Executor</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 px-4">
                        <p className="text-sm">Executes code snippets in a sandboxed environment to validate results.</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}