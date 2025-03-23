/**
 * AIAssistantChat Component
 * 
 * A specialized chat interface for interacting with different AI assistants
 * that provide domain-specific expertise for our real estate platform.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquareText as MessageSquareTextIcon,
  SendHorizonal as SendIcon,
  Home as HomeIcon,
  Calculator as CalculatorIcon,
  Wrench as WrenchIcon,
  RotateCcw as RotateCcwIcon,
  Sparkles as SparklesIcon,
  Share2 as ShareIcon,
  Download as DownloadIcon,
  Copy as CopyIcon,
  Save as SaveIcon,
  User as UserIcon,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  assistantType?: 'appraisal' | 'maintenance';
}

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'appraisal' | 'maintenance';
  examples: string[];
}

// Define available assistants
const assistants: Assistant[] = [
  {
    id: 'appraisal',
    name: 'RealEstate Appraisal Assistant',
    description: 'Valuation expertise, market trends, and property analysis',
    icon: <CalculatorIcon className="h-5 w-5" />,
    type: 'appraisal',
    examples: [
      "What factors most affect property valuation in suburban areas?",
      "How would adding a swimming pool impact my home's value?",
      "Explain the difference between market value and assessed value",
      "What's the cap rate formula and how do I interpret the results?",
      "How reliable are automated valuation models for unique properties?"
    ]
  },
  {
    id: 'maintenance',
    name: 'Maintenance & Integration Assistant',
    description: 'System troubleshooting, ETL pipelines, and technical help',
    icon: <WrenchIcon className="h-5 w-5" />,
    type: 'maintenance',
    examples: [
      "How can I improve our ETL pipeline performance?",
      "What's the best way to integrate legacy property data systems?",
      "Recommend monitoring tools for real estate data processes",
      "How should we structure our database for optimal spatial queries?",
      "What are best practices for securing property data APIs?"
    ]
  }
];

// Simulate AI responses
const simulateAIResponse = async (
  message: string, 
  assistantType: 'appraisal' | 'maintenance'
): Promise<string> => {
  // In a real implementation, this would call the backend API
  // which would then interact with the appropriate AI model
  return new Promise((resolve) => {
    setTimeout(() => {
      if (assistantType === 'appraisal') {
        resolve(`Based on my analysis, ${message.length > 20 
          ? "I can provide you with detailed insights on property valuation factors. The key considerations include location, property condition, square footage, comparable sales, and current market trends. Would you like me to elaborate on any specific aspect?"
          : "I need more specific information about the property or market area you're interested in to provide an accurate assessment. Could you provide more details?"}`);
      } else {
        resolve(`From a technical standpoint, ${message.length > 30
          ? "I understand your system integration question. To optimize your ETL pipeline or resolve this issue, I recommend following industry best practices for data processing, including incremental loads, proper error handling, and monitoring. Would you like specific implementation details?"
          : "I need more context about your system architecture and specific technical requirements to provide targeted recommendations. Could you elaborate on your current setup?"}`);
      }
    }, 1500); // Simulate network delay
  });
};

// Main component
export function AISpecialistChat() {
  const [activeTab, setActiveTab] = useState<string>('appraisal');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversations, setConversations] = useState<{
    [key: string]: ChatMessage[];
  }>({
    appraisal: [],
    maintenance: []
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);
  
  // Get current assistant
  const currentAssistant = assistants.find(a => a.id === activeTab) || assistants[0];
  
  // Get current conversation
  const currentConversation = conversations[activeTab] || [];
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to conversation
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      assistantType: currentAssistant.type
    };
    
    setConversations(prev => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), userMessage]
    }));
    
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Get AI response
      const response = await simulateAIResponse(
        inputMessage, 
        currentAssistant.type
      );
      
      // Add assistant message to conversation
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        assistantType: currentAssistant.type
      };
      
      setConversations(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), assistantMessage]
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from the assistant",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle using an example
  const handleUseExample = (example: string) => {
    setInputMessage(example);
  };
  
  // Handle reset conversation
  const handleResetConversation = () => {
    setConversations(prev => ({
      ...prev,
      [activeTab]: []
    }));
    
    toast({
      title: "Conversation Reset",
      description: `Your conversation with the ${currentAssistant.name} has been reset.`
    });
  };
  
  // Handle copying conversation
  const handleCopyConversation = () => {
    const conversationText = currentConversation
      .map(msg => `${msg.role === 'user' ? 'You' : currentAssistant.name}: ${msg.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(conversationText).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "The conversation has been copied to your clipboard."
      });
    });
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm" 
          className="gap-2"
        >
          <MessageSquareTextIcon className="h-4 w-4" />
          AI Assistant
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[550px] md:max-w-[750px] lg:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Get specialized help from our AI assistants with property valuation, market trends, and technical integration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="h-[550px] flex flex-col">
          <Tabs defaultValue="appraisal" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="border-b pb-2">
              <TabsList>
                {assistants.map(assistant => (
                  <TabsTrigger key={assistant.id} value={assistant.id} className="gap-2">
                    {assistant.icon}
                    {assistant.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {assistants.map(assistant => (
              <TabsContent 
                key={assistant.id} 
                value={assistant.id} 
                className="flex-1 flex flex-col p-0 mt-0"
              >
                <div className="flex flex-col flex-1">
                  <ScrollArea className="flex-1 pr-4 py-4">
                    {conversations[assistant.id]?.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="bg-primary/5 p-4 rounded-full mb-4">
                          {assistant.icon}
                        </div>
                        <h3 className="font-medium text-lg mb-2">{assistant.name}</h3>
                        <p className="text-muted-foreground text-sm mb-6">
                          {assistant.description}
                        </p>
                        
                        <div className="w-full max-w-md">
                          <h4 className="font-medium text-sm mb-3">Try asking about:</h4>
                          <div className="space-y-2">
                            {assistant.examples.map((example, i) => (
                              <Button 
                                key={i} 
                                variant="outline" 
                                size="sm"
                                className="w-full justify-start text-left h-auto py-2 px-3"
                                onClick={() => handleUseExample(example)}
                              >
                                <ChevronRightIcon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                                <span className="truncate">{example}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 px-1">
                        {conversations[assistant.id]?.map((message) => (
                          <div 
                            key={message.id} 
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                              <Avatar className={`h-8 w-8 ${message.role === 'assistant' ? 'bg-primary/10' : 'bg-background'}`}>
                                {message.role === 'assistant' ? (
                                  assistant.icon
                                ) : (
                                  <UserIcon className="h-4 w-4" />
                                )}
                              </Avatar>
                              
                              <div>
                                <div className={`rounded-lg px-4 py-2.5 text-sm ${
                                  message.role === 'assistant' 
                                    ? 'bg-muted' 
                                    : 'bg-primary text-primary-foreground'
                                }`}>
                                  {message.content}
                                </div>
                                <div className={`text-xs text-muted-foreground mt-1 ${
                                  message.role === 'user' ? 'text-right' : ''
                                }`}>
                                  {message.timestamp.toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="flex gap-3 max-w-[80%]">
                              <Avatar className="h-8 w-8 bg-primary/10">
                                {assistant.icon}
                              </Avatar>
                              
                              <div>
                                <div className="rounded-lg px-4 py-2.5 bg-muted w-60">
                                  <div className="flex flex-col gap-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="border-t p-4">
                    <div className="flex gap-3">
                      <form 
                        className="flex-1"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                      >
                        <div className="flex gap-2">
                          <Input
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder={`Ask the ${assistant.name}...`}
                            className="flex-1"
                            disabled={isLoading}
                          />
                          <Button 
                            type="submit" 
                            size="icon"
                            disabled={!inputMessage.trim() || isLoading}
                          >
                            <SendIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </div>
                    
                    {conversations[assistant.id]?.length > 0 && (
                      <div className="flex justify-end gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleResetConversation}
                          className="h-8 px-2 text-xs"
                        >
                          <RotateCcwIcon className="h-3.5 w-3.5 mr-1" />
                          Reset
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCopyConversation}
                          className="h-8 px-2 text-xs"
                        >
                          <CopyIcon className="h-3.5 w-3.5 mr-1" />
                          Copy
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        <DialogFooter className="sm:justify-start gap-2 flex-wrap pt-2">
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
          <div className="text-xs text-muted-foreground ml-auto pt-1">
            Powered by Replit AI Playground
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AISpecialistChat;