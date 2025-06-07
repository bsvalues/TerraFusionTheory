/**
 * Voice Search Component
 * 
 * Provides voice-activated search functionality for property queries
 * using the Web Speech API.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Web Speech API type declarations
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface VoiceSearchProps {
  onSearchQuery?: (query: string) => void;
  onTranscriptionUpdate?: (transcript: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({
  onSearchQuery,
  onTranscriptionUpdate,
  placeholder = "Say something like 'Find 3 bedroom homes in Richland under $400,000'",
  disabled = false,
  className = ""
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        toast({
          title: "Voice search activated",
          description: "Listening for your property search...",
        });
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcriptPart;
            setConfidence(result[0].confidence);
          } else {
            interimTranscript += transcriptPart;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        
        if (onTranscriptionUpdate) {
          onTranscriptionUpdate(currentTranscript);
        }

        // If we have a final result and it's substantial, trigger search
        if (finalTranscript.trim().length > 5) {
          handleSearchQuery(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = 'Voice search error occurred';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = `Voice search error: ${event.error}`;
        }
        
        toast({
          title: "Voice search error",
          description: errorMessage,
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscriptionUpdate, toast]);

  const handleSearchQuery = (query: string) => {
    if (onSearchQuery) {
      onSearchQuery(query);
    }
    
    toast({
      title: "Voice search completed",
      description: `Searching for: "${query}"`,
    });
    
    // Clear transcript after search
    setTimeout(() => {
      setTranscript('');
      setConfidence(0);
    }, 2000);
  };

  const startListening = () => {
    if (!isSupported) {
      toast({
        title: "Voice search not available",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
      return;
    }

    if (disabled) {
      toast({
        title: "Voice search disabled",
        description: "Voice search is currently disabled.",
        variant: "destructive"
      });
      return;
    }

    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setConfidence(0);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button variant="outline" size="sm" disabled>
          <VolumeX className="h-4 w-4" />
          <span className="ml-2 text-sm">Voice search not supported</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleListening}
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          disabled={disabled}
          className="relative"
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              <span className="ml-2">Stop</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              <span className="ml-2">Voice Search</span>
            </>
          )}
          
          {isListening && (
            <div className="absolute -top-1 -right-1">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </Button>

        {confidence > 0 && (
          <Badge variant="secondary" className="text-xs">
            {Math.round(confidence * 100)}% confident
          </Badge>
        )}
      </div>

      {/* Transcript Display */}
      {(transcript || isListening) && (
        <Card className="w-full">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {isListening ? 'Listening...' : 'Transcript'}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {transcript || placeholder}
            </p>
            
            {isListening && (
              <div className="mt-2 flex items-center gap-1">
                <div className="w-1 h-4 bg-blue-500 animate-pulse rounded"></div>
                <div className="w-1 h-6 bg-blue-500 animate-pulse rounded" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-3 bg-blue-500 animate-pulse rounded" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-5 bg-blue-500 animate-pulse rounded" style={{ animationDelay: '0.3s' }}></div>
                <span className="ml-2 text-xs text-muted-foreground">Recording...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceSearch;