import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as aiClient from '@/lib/aiClient';
import { useToast } from '@/hooks/use-toast';
import { useErrors } from '@/hooks/useErrors';

/**
 * Hook for using AI services in components
 */
export function useAI() {
  const { toast } = useToast();
  const { logApiError } = useErrors();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<aiClient.AIProvider | undefined>(undefined);
  
  // Get available AI providers
  const {
    data: providers = [],
    isLoading: isProvidersLoading,
    error: providersError,
    refetch: refetchProviders
  } = useQuery({
    queryKey: ['/v2/ai/providers'],
    queryFn: aiClient.getAvailableProviders,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: true // Always fetch on mount
  });
  
  // AI message mutation
  const messageAI = useMutation({
    mutationFn: ({ message, projectId }: { message: string; projectId: number }) => 
      aiClient.sendMessage(message, projectId, selectedProvider),
    onError: (error) => {
      logApiError('Failed to send message to AI', error);
      toast({
        title: 'Error',
        description: 'Failed to send message to AI. Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  // Analyze requirements mutation
  const analyzeRequirements = useMutation({
    mutationFn: (projectDetails: string) => 
      aiClient.analyzeRequirements(projectDetails, selectedProvider),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
    onError: (error) => {
      logApiError('Failed to analyze requirements', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze requirements. Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  // Generate architecture mutation
  const generateArchitecture = useMutation({
    mutationFn: (requirements: string) => 
      aiClient.generateArchitecture(requirements, selectedProvider),
    onError: (error) => {
      logApiError('Failed to generate architecture', error);
      toast({
        title: 'Error',
        description: 'Failed to generate architecture. Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  // Generate code mutation
  const generateCode = useMutation({
    mutationFn: ({ requirements, language }: { requirements: string; language: string }) => 
      aiClient.generateCode(requirements, language, selectedProvider),
    onError: (error) => {
      logApiError('Failed to generate code', error);
      toast({
        title: 'Error',
        description: 'Failed to generate code. Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  // Debug code mutation
  const debugCode = useMutation({
    mutationFn: ({ code, error }: { code: string; error: string }) => 
      aiClient.debugCode(code, error, selectedProvider),
    onError: (error) => {
      logApiError('Failed to debug code', error);
      toast({
        title: 'Error',
        description: 'Failed to debug code. Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  // Generate documentation mutation
  const generateDocumentation = useMutation({
    mutationFn: ({ code, docType }: { code: string; docType: string }) => 
      aiClient.generateDocumentation(code, docType, selectedProvider),
    onError: (error) => {
      logApiError('Failed to generate documentation', error);
      toast({
        title: 'Error',
        description: 'Failed to generate documentation. Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  return {
    // Providers management
    providers,
    isProvidersLoading,
    providersError,
    refetchProviders,
    selectedProvider,
    setSelectedProvider,
    
    // AI operations
    messageAI,
    analyzeRequirements,
    generateArchitecture,
    generateCode, 
    debugCode,
    generateDocumentation
  };
}