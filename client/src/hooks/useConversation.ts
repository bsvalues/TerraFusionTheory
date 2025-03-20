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
    
    // Ensure rawConversation is treated as an object with messages property
    const conversationData = rawConversation as Conversation | { messages?: string | Message[] };
    
    return {
      ...rawConversation,
      messages: typeof conversationData.messages === 'string' 
        ? JSON.parse(conversationData.messages) 
        : (conversationData.messages || [])
    };
  }, [rawConversation]);
  
  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // We can either send just the message content as a string
      // or continue sending the full message object - server handles both now
      const message: Partial<Message> = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      
      return apiRequest<Conversation>(`/api/projects/${projectId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
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
