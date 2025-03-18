import { useState, useEffect, useMemo } from 'react';
import { Conversation, Message } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useConversation = (projectId: number) => {
  const queryClient = useQueryClient();
  
  // Fetch conversation data
  const { data: rawConversation, isLoading, error } = useQuery({
    queryKey: [`/api/projects/${projectId}/conversation`],
  });
  
  // Parse conversation messages
  const conversation = useMemo(() => {
    if (!rawConversation) return null;
    
    return {
      ...rawConversation,
      messages: typeof rawConversation.messages === 'string' 
        ? JSON.parse(rawConversation.messages) 
        : (rawConversation.messages || [])
    };
  }, [rawConversation]);
  
  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const message: Partial<Message> = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      
      const response = await apiRequest(
        'POST',
        `/api/projects/${projectId}/messages`,
        { message }
      );
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/conversation`] });
    },
  });

  const sendMessage = async (content: string) => {
    await addMessageMutation.mutateAsync(content);
  };

  // Return mock data if real data is loading
  // This ensures the UI can render immediately
  const defaultConversation: Conversation = {
    id: 0,
    projectId,
    messages: []
  };

  return {
    conversation: conversation || defaultConversation,
    isLoading,
    error,
    sendMessage,
    isSending: addMessageMutation.isPending,
  };
};
