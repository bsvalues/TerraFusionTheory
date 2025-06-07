import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  capabilities: string[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}

const AgentTestPage = () => {
  // State for agents
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  
  // State for technical question
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  
  // State for code generation
  const [codeRequirements, setCodeRequirements] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeExplanation, setCodeExplanation] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);
  
  // State for memory search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  
  // State for agent collaboration
  const [sourceAgentId, setSourceAgentId] = useState<string>('');
  const [targetAgentId, setTargetAgentId] = useState<string>('');
  const [collaborationMessage, setCollaborationMessage] = useState('');
  const [collaborationResult, setCollaborationResult] = useState('');
  const [collaborating, setCollaborating] = useState(false);
  
  // Response message for showing API results
  const [responseMessage, setResponseMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents();
  }, []);
  
  // Fetch all available agents
  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      const response = await fetch('/api/agent-demo/agents');
      const data = await response.json();
      
      if (data.success && data.agents) {
        setAgents(data.agents);
        
        // Set default selected agent if available
        if (data.agents.length > 0) {
          const developerAgent = data.agents.find((a: Agent) => a.type === 'DEVELOPER');
          if (developerAgent) {
            setSelectedAgentId(developerAgent.id);
            setSourceAgentId(developerAgent.id);
          } else {
            setSelectedAgentId(data.agents[0].id);
            setSourceAgentId(data.agents[0].id);
          }
          
          // Set target agent if there's more than one
          if (data.agents.length > 1) {
            const realEstateAgent = data.agents.find((a: Agent) => a.type === 'REAL_ESTATE');
            if (realEstateAgent) {
              setTargetAgentId(realEstateAgent.id);
            } else {
              setTargetAgentId(data.agents[1].id);
            }
          }
        }
      } else {
        setResponseMessage({ type: 'error', text: 'Failed to fetch agents: ' + (data.error || 'Unknown error') });
      }
    } catch (error) {
      setResponseMessage({ type: 'error', text: 'Error fetching agents: ' + (error instanceof Error ? error.message : String(error)) });
    } finally {
      setLoadingAgents(false);
    }
  };
  
  // Ask a technical question
  const handleAskQuestion = async () => {
    if (!question) {
      setResponseMessage({ type: 'error', text: 'Please enter a question' });
      return;
    }
    
    try {
      setAskingQuestion(true);
      setResponseMessage(null);
      
      const response = await fetch('/api/agent-demo/answer-technical-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      
      if (data.success && data.result) {
        setAnswer(data.result.answer || JSON.stringify(data.result, null, 2));
        setResponseMessage({ type: 'success', text: 'Question answered successfully' });
      } else {
        setResponseMessage({ type: 'error', text: 'Failed to get answer: ' + (data.error || 'Unknown error') });
      }
    } catch (error) {
      setResponseMessage({ type: 'error', text: 'Error asking question: ' + (error instanceof Error ? error.message : String(error)) });
    } finally {
      setAskingQuestion(false);
    }
  };
  
  // Generate code
  const handleGenerateCode = async () => {
    if (!codeRequirements || !codeLanguage) {
      setResponseMessage({ type: 'error', text: 'Please enter code requirements and select a language' });
      return;
    }
    
    try {
      setGeneratingCode(true);
      setResponseMessage(null);
      
      const response = await fetch('/api/agent-demo/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: codeRequirements,
          language: codeLanguage,
          style: 'clean'
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.result) {
        setGeneratedCode(data.result.code || '');
        setCodeExplanation(data.result.explanation || '');
        setResponseMessage({ type: 'success', text: 'Code generated successfully' });
      } else {
        setResponseMessage({ type: 'error', text: 'Failed to generate code: ' + (data.error || 'Unknown error') });
      }
    } catch (error) {
      setResponseMessage({ type: 'error', text: 'Error generating code: ' + (error instanceof Error ? error.message : String(error)) });
    } finally {
      setGeneratingCode(false);
    }
  };
  
  // Search vector memory
  const handleSearchMemory = async () => {
    if (!searchQuery) {
      setResponseMessage({ type: 'error', text: 'Please enter a search query' });
      return;
    }
    
    try {
      setSearching(true);
      setResponseMessage(null);
      
      const response = await fetch('/api/agent-demo/search-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          limit: 5,
          threshold: 0.2,
          diversityFactor: 0.4
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results || []);
        setResponseMessage({ type: 'success', text: `Found ${data.results ? data.results.length : 0} results` });
      } else {
        setResponseMessage({ type: 'error', text: 'Failed to search memory: ' + (data.error || 'Unknown error') });
      }
    } catch (error) {
      setResponseMessage({ type: 'error', text: 'Error searching memory: ' + (error instanceof Error ? error.message : String(error)) });
    } finally {
      setSearching(false);
    }
  };
  
  // Test agent collaboration
  const handleTestCollaboration = async () => {
    if (!sourceAgentId || !targetAgentId || !collaborationMessage) {
      setResponseMessage({ type: 'error', text: 'Please select source and target agents and enter a message' });
      return;
    }
    
    try {
      setCollaborating(true);
      setResponseMessage(null);
      
      const response = await fetch('/api/agent-demo/agent-collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_agent_id: sourceAgentId,
          target_agent_id: targetAgentId,
          message: collaborationMessage,
          task: 'answer_question'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCollaborationResult(JSON.stringify(data.result, null, 2));
        setResponseMessage({ type: 'success', text: 'Collaboration successful' });
      } else {
        setResponseMessage({ type: 'error', text: 'Collaboration failed: ' + (data.error || 'Unknown error') });
      }
    } catch (error) {
      setResponseMessage({ type: 'error', text: 'Error during collaboration: ' + (error instanceof Error ? error.message : String(error)) });
    } finally {
      setCollaborating(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agent System Test Interface</h1>
        <Button onClick={fetchAgents} variant="outline" disabled={loadingAgents}>
          {loadingAgents ? 'Loading...' : 'Refresh Agents'}
        </Button>
      </div>
      
      {responseMessage && (
        <div className={`p-4 rounded-md ${responseMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {responseMessage.text}
        </div>
      )}
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Agents</CardTitle>
          <CardDescription>These are the AI agents registered in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAgents ? (
            <div className="text-center py-4">Loading agents...</div>
          ) : agents.length === 0 ? (
            <div className="text-center py-4">No agents found. Try creating some agents first.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map(agent => (
                <Card key={agent.id} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{agent.name}</CardTitle>
                      <Badge variant="outline">{agent.type}</Badge>
                    </div>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map(cap => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="text-sm text-gray-500">
                    ID: {agent.id}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="question" className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="question">Ask Question</TabsTrigger>
          <TabsTrigger value="code">Generate Code</TabsTrigger>
          <TabsTrigger value="collaboration">Agent Collaboration</TabsTrigger>
          <TabsTrigger value="memory">Search Memory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="question" className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Ask Technical Question</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea 
                id="question" 
                placeholder="Enter your technical question here..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
              />
            </div>
            
            <Button onClick={handleAskQuestion} disabled={askingQuestion || !question}>
              {askingQuestion ? 'Processing...' : 'Ask Question'}
            </Button>
            
            {answer && (
              <div className="mt-4 space-y-2">
                <Label>Answer</Label>
                <div className="p-4 border rounded-md bg-gray-50 whitespace-pre-wrap">
                  {answer}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="code" className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Generate Code</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Programming Language</Label>
              <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="csharp">C#</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea 
                id="requirements" 
                placeholder="Describe what the code should do..."
                value={codeRequirements}
                onChange={(e) => setCodeRequirements(e.target.value)}
                rows={3}
              />
            </div>
            
            <Button onClick={handleGenerateCode} disabled={generatingCode || !codeRequirements || !codeLanguage}>
              {generatingCode ? 'Generating...' : 'Generate Code'}
            </Button>
            
            {generatedCode && (
              <div className="mt-4 space-y-2">
                <Label>Generated Code</Label>
                <div className="p-4 border rounded-md bg-gray-50 font-mono text-sm whitespace-pre-wrap">
                  {generatedCode}
                </div>
              </div>
            )}
            
            {codeExplanation && (
              <div className="mt-4 space-y-2">
                <Label>Explanation</Label>
                <div className="p-4 border rounded-md bg-gray-50 whitespace-pre-wrap">
                  {codeExplanation}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="collaboration" className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Agent Collaboration</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source-agent">Source Agent</Label>
                <Select value={sourceAgentId} onValueChange={setSourceAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-agent">Target Agent</Label>
                <Select value={targetAgentId} onValueChange={setTargetAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name} ({agent.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="collab-message">Message</Label>
              <Textarea 
                id="collab-message" 
                placeholder="Enter message to send between agents..."
                value={collaborationMessage}
                onChange={(e) => setCollaborationMessage(e.target.value)}
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleTestCollaboration} 
              disabled={collaborating || !sourceAgentId || !targetAgentId || !collaborationMessage}
            >
              {collaborating ? 'Processing...' : 'Test Collaboration'}
            </Button>
            
            {collaborationResult && (
              <div className="mt-4 space-y-2">
                <Label>Collaboration Result</Label>
                <div className="p-4 border rounded-md bg-gray-50 whitespace-pre-wrap">
                  {collaborationResult}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="memory" className="p-4 border rounded-md">
          <h2 className="text-xl font-semibold mb-4">Search Vector Memory</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search-query">Search Query</Label>
              <Input 
                id="search-query" 
                placeholder="Enter search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button onClick={handleSearchMemory} disabled={searching || !searchQuery}>
              {searching ? 'Searching...' : 'Search Memory'}
            </Button>
            
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Search Results ({searchResults.length})</Label>
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div key={index} className="p-4 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">Score: {result.score.toFixed(4)}</Badge>
                        {result.entry.metadata && (
                          <div className="flex space-x-1">
                            {result.entry.metadata.tags && result.entry.metadata.tags.map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap">{result.entry.text}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {result.entry.metadata && (
                          <>Source: {result.entry.metadata.source} | Created: {new Date(result.entry.createdAt).toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentTestPage;