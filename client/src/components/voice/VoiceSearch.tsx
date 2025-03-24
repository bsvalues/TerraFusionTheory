/**
 * VoiceSearch Component
 * 
 * This component provides voice recognition capabilities for property searches,
 * allowing users to speak their property search queries instead of typing them.
 * It integrates with the AI chat interface for a conversational experience.
 */

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Type definitions for the Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

interface VoiceSearchProps {
  onTranscript: (transcript: string) => void;
  isEnabled?: boolean;
  className?: string;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({
  onTranscript,
  isEnabled = true,
  className
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const recognition = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Initialize speech recognition when component mounts
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // Use the browser's SpeechRecognition API
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || 
                                  (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognitionAPI();
      
      // Configure recognition settings
      if (recognition.current) {
        recognition.current.continuous = true;
        recognition.current.interimResults = true;
        recognition.current.lang = 'en-US'; // Set language to English
        
        // Set up event handlers
        recognition.current.onstart = () => {
          setIsListening(true);
          setIsPending(false);
        };
        
        recognition.current.onend = () => {
          setIsListening(false);
          setIsPending(false);
        };
        
        recognition.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          setIsPending(false);
          
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone Access Denied",
              description: "Please enable microphone access in your browser settings to use voice search.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Voice Recognition Error",
              description: `Error: ${event.error}. Please try again.`,
              variant: "destructive"
            });
          }
        };
        
        recognition.current.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Update transcript state
          const fullTranscript = finalTranscript || interimTranscript;
          setTranscript(fullTranscript);
          
          // Only send final results to parent
          if (finalTranscript) {
            onTranscript(finalTranscript);
          }
        };
      }
    } else {
      setIsSupported(false);
      toast({
        title: "Voice Search Not Supported",
        description: "Your browser doesn't support voice recognition. Please try using Chrome, Edge, or Safari.",
        variant: "destructive"
      });
    }
    
    // Cleanup function
    return () => {
      if (recognition.current && isListening) {
        recognition.current.stop();
      }
    };
  }, [onTranscript, toast, isListening]);
  
  // Start listening
  const startListening = () => {
    if (!isSupported || !recognition.current || !isEnabled) return;
    
    try {
      setIsPending(true);
      setTranscript('');
      recognition.current.start();
      
      toast({
        title: "Voice Search Active",
        description: "Speak clearly to search for properties...",
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsPending(false);
      
      toast({
        title: "Voice Recognition Error",
        description: "Failed to start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Stop listening
  const stopListening = () => {
    if (!isSupported || !recognition.current) return;
    
    try {
      recognition.current.stop();
      setIsPending(false);
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };
  
  // If not supported or disabled, render a disabled button
  if (!isSupported || !isEnabled) {
    return (
      <Button 
        variant="outline" 
        size="icon" 
        disabled 
        className={cn("relative", className)}
        title="Voice search not supported in this browser"
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }
  
  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={isListening ? stopListening : startListening}
      disabled={isPending}
      className={cn("relative", className)}
      title={isListening ? "Stop listening" : "Start voice search"}
    >
      {isListening ? (
        <StopCircle className="h-4 w-4 animate-pulse" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      
      {/* Visual indicator when listening */}
      {isListening && (
        <span className="absolute inset-0 rounded-full animate-ping-slow bg-red-400 opacity-30" />
      )}
    </Button>
  );
};

export default VoiceSearch;

// TypeScript declaration for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}