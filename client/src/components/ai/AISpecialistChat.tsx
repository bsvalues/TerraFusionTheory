/**
 * Enhanced AISpecialistChat Component
 *
 * This unified AI assistant component integrates tutorial guidance functionality 
 * with specialized AI-powered chat for real estate analysis and technical support.
 * It features different AI specialists with contextual property insights
 * that automatically appear when discussing specific properties.
 * 
 * Enhanced with voice-activated property search functionality and tutorial integration.
 */

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, MinusCircle, ChevronUp, RefreshCw, LifeBuoy, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTutorial } from '../onboarding/TutorialContext';
import agentService, { QueryContext } from '@/services/agent.service';
import PropertyInsightCard, { PropertyInsight } from './PropertyInsightCard';
import propertyInsightsService from '@/services/property-insights.service';
import VoiceSearch from '../voice/VoiceSearch';

// AI Specialist types
enum SpecialistType {
  PROPERTY = 'property',
  TECHNICAL = 'technical',
  COLLABORATIVE = 'collaborative',
  TUTORIAL = 'tutorial'
}

// Message interface
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  specialist: SpecialistType;
  isTyping?: boolean;
  propertyInsights?: PropertyInsight[];
}

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Component for AI Specialist Chat
const AISpecialistChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeSpecialist, setActiveSpecialist] = useState<SpecialistType>(SpecialistType.PROPERTY);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { aiAssistantMessage, startTutorial, categories } = useTutorial();
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Add welcome messages when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: Record<SpecialistType, string> = {
        [SpecialistType.PROPERTY]: 
          "Hello! I'm your Property Valuation Specialist. I can help you analyze market trends, evaluate property values, and understand investment opportunities.\n\nTry mentioning a property address like:\n• '1205 Newcomer St, Richland, WA'\n• '324 Columbia Point Dr, Richland'\n• '123 Main St, Grandview'\n\nI'll show you detailed property insights! How can I assist you today?",
        [SpecialistType.TECHNICAL]: 
          "Welcome! I'm your Technical Integration Specialist. I can help with integrating data sources, troubleshooting technical issues, and optimizing your analytics workflow. What can I help you with?",
        [SpecialistType.COLLABORATIVE]:
          "Welcome to Collaborative Mode! Here, both the Real Estate and Technical specialists work together to provide comprehensive answers that combine real estate expertise with technical implementation knowledge.\n\nTry asking about specific properties or neighborhoods like:\n• 'Tell me about Columbia Point in Richland'\n• 'What's the market like in Meadow Springs?'\n• 'Property values in South Richland'\n\nHow can we assist you today?",
        [SpecialistType.TUTORIAL]:
          "Welcome to IntelligentEstate! I'm your AI assistant and I'll guide you through this powerful real estate analytics platform. You can ask me about features like the property map, market analytics, or start a tutorial by saying 'start tutorial'."
      };
      
      // Add welcome message for active specialist
      addAIMessage(welcomeMessages[activeSpecialist]);
    }
  }, [isOpen, activeSpecialist, messages.length]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;
    
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
      specialist: activeSpecialist
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    // Add typing indicator
    const typingIndicatorId = generateId();
    setMessages(prev => [
      ...prev, 
      {
        id: typingIndicatorId,
        content: '',
        sender: 'ai',
        timestamp: new Date(),
        specialist: activeSpecialist,
        isTyping: true
      }
    ]);
    
    try {
      const context: QueryContext = { 
        currentSpecialist: activeSpecialist,
        source: 'ai_specialist_chat'
      };
      
      let response: string;
      
      // Use agent service based on active specialist
      if (activeSpecialist === SpecialistType.COLLABORATIVE) {
        // Use collaborative mode with both agents
        context.enableCollaboration = true;
        response = await agentService.askCollaborative(input, context);
      } else if (activeSpecialist === SpecialistType.PROPERTY) {
        // Use real estate agent
        response = await agentService.askRealEstateAgent(input, context);
      } else {
        // Use developer agent
        response = await agentService.askDeveloperAgent(input, context);
      }
      
      // Remove typing indicator and add AI response
      setMessages(prev => prev.filter(m => m.id !== typingIndicatorId));
      addAIMessage(response);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingIndicatorId));
      
      // Add error message
      addAIMessage("I'm sorry, I encountered an error processing your request. Please try again later.");
      
      toast({
        title: "Connection Error",
        description: "Could not connect to AI specialist. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Add AI message helper
  const addAIMessage = async (content: string) => {
    // Only check for property insights if in property or collaborative mode
    let propertyInsights: PropertyInsight[] | undefined;
    
    if (activeSpecialist === SpecialistType.PROPERTY || activeSpecialist === SpecialistType.COLLABORATIVE) {
      try {
        // Detect property addresses in the AI response
        const insightResponse = await propertyInsightsService.detectPropertyInsights(content);
        
        if (insightResponse.detected && insightResponse.properties.length > 0) {
          propertyInsights = insightResponse.properties;
        }
      } catch (error) {
        console.error('Error detecting property insights:', error);
      }
    }
    
    const aiMessage: Message = {
      id: generateId(),
      content,
      sender: 'ai',
      timestamp: new Date(),
      specialist: activeSpecialist,
      propertyInsights
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  // Handle specialist change
  const handleSpecialistChange = (type: SpecialistType) => {
    if (type !== activeSpecialist) {
      setActiveSpecialist(type);
      
      // Clear messages when switching specialists
      setMessages([]);
    }
  };

  // Handle toggle chat
  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Handle minimize chat
  const minimizeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(true);
  };

  // Handle maximize chat
  const maximizeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(false);
  };

  // Handle close chat
  const closeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle voice input from the voice search component
  const handleVoiceInput = (transcript: string) => {
    // Append the transcript to any existing input
    setInput(currentInput => currentInput + (currentInput ? ' ' : '') + transcript);
    
    toast({
      title: "Voice input received",
      description: transcript,
      duration: 3000,
    });
    
    // If the transcript is a complete query, we can auto-send it
    // This is optional and can be adjusted based on user feedback
    if (transcript.trim().length > 15 && 
        (transcript.endsWith('.') || 
         transcript.endsWith('?') || 
         transcript.endsWith('!'))) {
      // Short delay to allow user to see what was transcribed
      setTimeout(() => {
        handleSendMessage();
      }, 500);
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={toggleChat} 
                variant="default"
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chat with AI Specialists</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out",
            isMinimized 
              ? "w-60 h-12 overflow-hidden shadow-md rounded-md" 
              : "w-80 md:w-96 h-[500px] shadow-xl rounded-lg"
          )}
        >
          {/* Minimized Header */}
          {isMinimized && (
            <div 
              className="bg-primary text-primary-foreground h-full flex items-center justify-between px-4 cursor-pointer rounded-md"
              onClick={maximizeChat}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">AI Specialist Chat</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 p-0 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary/80"
                  onClick={maximizeChat}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Full Chat Interface */}
          {!isMinimized && (
            <Card className="h-full flex flex-col overflow-hidden border-none shadow-none">
              <CardHeader className="py-3 px-4 border-b bg-primary text-primary-foreground flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  AI Specialist Chat
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={minimizeChat}
                    className="h-6 w-6 p-0 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary/80"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={closeChat}
                    className="h-6 w-6 p-0 text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary/80"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <div className="flex-1 overflow-hidden">
                <Tabs 
                  defaultValue={SpecialistType.PROPERTY}
                  value={activeSpecialist}
                  onValueChange={(value) => handleSpecialistChange(value as SpecialistType)}
                  className="h-full flex flex-col"
                >
                  <TabsList className="w-full h-auto p-0 bg-muted/30 grid grid-cols-4">
                    <TabsTrigger 
                      value={SpecialistType.PROPERTY}
                      className="text-xs py-2"
                    >
                      Property
                    </TabsTrigger>
                    <TabsTrigger 
                      value={SpecialistType.TECHNICAL}
                      className="text-xs py-2"
                    >
                      Technical
                    </TabsTrigger>
                    <TabsTrigger 
                      value={SpecialistType.COLLABORATIVE}
                      className="text-xs py-2"
                    >
                      Collaborative
                    </TabsTrigger>
                    <TabsTrigger 
                      value={SpecialistType.TUTORIAL}
                      className="text-xs py-2"
                    >
                      Tutorial
                    </TabsTrigger>
                  </TabsList>

                  {/* Chat content for both tabs */}
                  <div className="flex-1 flex flex-col h-[calc(500px-100px)]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={cn(
                            "flex items-start gap-2.5 group",
                            message.sender === 'user' ? "justify-end" : "justify-start"
                          )}
                        >
                          {message.sender === 'ai' && (
                            <Avatar className="h-8 w-8 border bg-primary/10">
                              <AvatarFallback className="text-xs">
                                {message.specialist === SpecialistType.PROPERTY 
                                  ? 'RE' 
                                  : message.specialist === SpecialistType.TECHNICAL 
                                    ? 'TS'
                                    : 'AI'
                                }
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div 
                            className={cn(
                              "max-w-[80%] px-4 py-2 rounded-lg",
                              message.sender === 'user' 
                                ? "bg-primary text-primary-foreground rounded-tr-none" 
                                : "bg-muted rounded-tl-none",
                              message.isTyping && "animate-pulse"
                            )}
                          >
                            {message.isTyping ? (
                              <div className="flex space-x-1 items-center h-6">
                                <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3">
                                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                
                                {/* Property Insights */}
                                {message.propertyInsights && message.propertyInsights.length > 0 && (
                                  <div className="mt-2 space-y-3">
                                    {message.propertyInsights.map((property) => (
                                      <PropertyInsightCard
                                        key={property.propertyId}
                                        insight={property}
                                        compact={true}
                                        className="mt-2"
                                        onViewDetails={(id) => {
                                          const message = `Tell me more about the property at ${property.address}`;
                                          setInput(message);
                                          toast({
                                            title: "Property Selected",
                                            description: `Loaded query for ${property.address}`,
                                          });
                                        }}
                                        onViewOnMap={(coordinates) => {
                                          // In a real app, we would center the map on these coordinates
                                          // For now, just set up a query about the neighborhood
                                          const neighborhood = property.neighborhood || "";
                                          const message = neighborhood 
                                            ? `What can you tell me about the ${neighborhood} neighborhood in ${property.address.split(',')[1]}?` 
                                            : `What's the area like around ${property.address}?`;
                                          setInput(message);
                                          toast({
                                            title: "Location Selected",
                                            description: `Loaded neighborhood query for ${property.address.split(',')[0]}`,
                                          });
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            <div 
                              className={cn(
                                "text-xs opacity-70 mt-1 text-right",
                                message.sender === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}
                            >
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          {message.sender === 'user' && (
                            <Avatar className="h-8 w-8 border">
                              <AvatarFallback className="text-xs">YOU</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    <CardFooter className="p-3 border-t">
                      <form 
                        className="flex w-full items-end gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                      >
                        <div className="relative flex-1">
                          <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type or speak your message..."
                            className="min-h-10 resize-none w-full pr-9"
                            disabled={isProcessing}
                          />
                          <div className="absolute right-2 bottom-2">
                            <VoiceSearch 
                              onTranscript={handleVoiceInput}
                              isEnabled={!isProcessing}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          size="sm"
                          disabled={isProcessing || !input.trim()}
                        >
                          Send
                        </Button>
                      </form>
                    </CardFooter>
                  </div>
                </Tabs>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
};

export default AISpecialistChat;