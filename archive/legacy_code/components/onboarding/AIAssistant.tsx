/**
 * AIAssistant Component
 * 
 * This component renders an AI assistant interface that provides
 * helpful guidance during the tutorial and interactive usage of the platform.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTutorial } from './TutorialContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  LucideMessageSquare, 
  LucideMinimize2, 
  LucideMaximize2,
  LucideSend,
  LucideLifeBuoy
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

// Message type definition
interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const { aiAssistantMessage, startTutorial, categories } = useTutorial();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate a unique ID for messages
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Add initial AI message when component mounts
  useEffect(() => {
    // Only add welcome message on first load
    if (messages.length === 0) {
      setMessages([
        {
          id: generateId(),
          text: aiAssistantMessage,
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
      // Open the assistant by default
      setIsOpen(true);
    }
  }, []);

  // Update with new AI message when it changes
  useEffect(() => {
    if (aiAssistantMessage && isOpen) {
      const lastMessage = messages[messages.length - 1];
      
      // Only add if it's different from the last AI message
      if (!lastMessage || lastMessage.sender !== 'ai' || lastMessage.text !== aiAssistantMessage) {
        setMessages(prev => [...prev, {
          id: generateId(),
          text: aiAssistantMessage,
          sender: 'ai',
          timestamp: new Date()
        }]);
      }
    }
  }, [aiAssistantMessage]);

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle user message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Process user input to determine intent
    processUserInput(inputValue);
  };

  // Process user input and determine response
  const processUserInput = (input: string) => {
    const normalizedInput = input.toLowerCase();
    
    // Check for tutorial requests
    if (normalizedInput.includes('tutorial') || normalizedInput.includes('guide') || normalizedInput.includes('help')) {
      if (normalizedInput.includes('map') || normalizedInput.includes('property')) {
        setTimeout(() => startTutorial('map'), 500);
        return;
      } else if (normalizedInput.includes('analytics') || normalizedInput.includes('market')) {
        setTimeout(() => startTutorial('analytics'), 500);
        return;
      } else if (normalizedInput.includes('start') || normalizedInput.includes('begin') || normalizedInput.includes('introduction')) {
        setTimeout(() => startTutorial('introduction'), 500);
        return;
      }
      
      // General tutorial request
      const aiResponse: Message = {
        id: generateId(),
        text: "I can guide you through several tutorials. Which would you like to start?\n\n- Introduction to the platform\n- Interactive property map\n- Market analytics dashboard",
        sender: 'ai',
        timestamp: new Date(Date.now() + 800) // Add slight delay for natural feel
      };
      setTimeout(() => setMessages(prev => [...prev, aiResponse]), 800);
      return;
    }
    
    // Check for feature-specific questions
    if (normalizedInput.includes('filter') || normalizedInput.includes('search')) {
      const aiResponse: Message = {
        id: generateId(),
        text: "You can filter properties using the filter button in the top-right corner of the map. Would you like me to show you how to use the filters?",
        sender: 'ai',
        timestamp: new Date(Date.now() + 800)
      };
      setTimeout(() => setMessages(prev => [...prev, aiResponse]), 800);
      return;
    }
    
    if (normalizedInput.includes('analytics') || normalizedInput.includes('dashboard') || normalizedInput.includes('chart')) {
      const aiResponse: Message = {
        id: generateId(),
        text: "The analytics dashboard provides market insights through interactive charts and data visualizations. Would you like to explore the analytics dashboard tutorial?",
        sender: 'ai',
        timestamp: new Date(Date.now() + 800)
      };
      setTimeout(() => setMessages(prev => [...prev, aiResponse]), 800);
      return;
    }
    
    if (normalizedInput.includes('yes') || normalizedInput.includes('show me')) {
      // Check the previous AI message to determine context
      const previousAiMessage = [...messages].reverse().find(m => m.sender === 'ai');
      if (previousAiMessage) {
        if (previousAiMessage.text.includes('filter')) {
          setTimeout(() => startTutorial('map'), 500);
          return;
        } else if (previousAiMessage.text.includes('analytics dashboard tutorial')) {
          setTimeout(() => startTutorial('analytics'), 500);
          return;
        } else if (previousAiMessage.text.includes('which would you like to start')) {
          setTimeout(() => startTutorial('introduction'), 500);
          return;
        }
      }
    }
    
    // Default response when we can't determine intent
    const aiResponse: Message = {
      id: generateId(),
      text: "I'm here to help you navigate the IntelligentEstate platform. You can ask me about features like the property map, market analytics, or start a tutorial by saying 'start tutorial'.",
      sender: 'ai',
      timestamp: new Date(Date.now() + 1000)
    };
    setTimeout(() => setMessages(prev => [...prev, aiResponse]), 1000);
  };

  // Toggle the assistant open/closed
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  // Start a specific tutorial category
  const handleStartTutorial = (categoryId: string) => {
    startTutorial(categoryId);
    setIsMinimized(true);
  };

  // Format AI message with links
  const formatMessage = (message: string) => {
    // Replace tutorial names with clickable buttons
    let formattedMessage = message;
    categories.forEach(category => {
      const regex = new RegExp(`(${category.name})`, 'gi');
      formattedMessage = formattedMessage.replace(regex, 
        `<button class="text-primary underline font-medium" data-category-id="${category.id}">$1</button>`
      );
    });
    
    return { __html: formattedMessage };
  };

  // Handle click on formatted message (for tutorial links)
  const handleMessageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' && target.dataset.categoryId) {
      handleStartTutorial(target.dataset.categoryId);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {/* Chat interface */}
      {isOpen && (
        <Card 
          className={`mb-2 shadow-lg transition-all duration-300 ease-in-out animate-in slide-in-from-right-5 fade-in ${
            isMinimized ? 'w-64 h-16' : 'w-80 sm:w-96 h-96'
          }`}
        >
          {/* Header */}
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2 animate-in fade-in duration-300">
                <AvatarImage src="/ai-assistant-avatar.png" />
                <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
              </Avatar>
              <div className="font-semibold animate-in fade-in slide-in-from-left-3 duration-200">AI Assistant</div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 transition-transform hover:scale-110 duration-200"
              onClick={toggleMinimized}
            >
              {isMinimized ? <LucideMaximize2 className="h-4 w-4" /> : <LucideMinimize2 className="h-4 w-4" />}
            </Button>
          </CardHeader>
          
          {/* Message content */}
          {!isMinimized && (
            <>
              <CardContent className="p-4 h-[calc(100%-120px)] overflow-y-auto">
                <div className="flex flex-col space-y-3">
                  {messages.map((message, index) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-lg px-3 py-2 animate-in ${
                          message.sender === 'user' 
                            ? 'slide-in-from-right-3 bg-primary text-primary-foreground' 
                            : 'slide-in-from-left-3 bg-muted'
                        } duration-200 delay-${Math.min(index * 100, 500)}`}
                      >
                        {message.sender === 'ai' ? (
                          <div 
                            dangerouslySetInnerHTML={formatMessage(message.text)} 
                            onClick={handleMessageClick}
                          />
                        ) : (
                          <div>{message.text}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              
              <CardFooter className="p-2 border-t">
                <form onSubmit={handleSubmit} className="flex w-full space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="h-10 w-10 transition-transform hover:scale-105">
                    <LucideSend className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </>
          )}
        </Card>
      )}
      
      {/* Toggle button */}
      <Button
        variant={isOpen ? "outline" : "default"}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-bounce-slow"
        onClick={toggleOpen}
      >
        {isOpen ? (
          <LucideMessageSquare className="h-6 w-6 transition-transform duration-200" />
        ) : (
          <LucideLifeBuoy className="h-6 w-6 transition-transform duration-200" />
        )}
      </Button>
    </div>
  );
};

export default AIAssistant;