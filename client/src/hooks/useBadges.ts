import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeWithProgress } from '@/types';

export function useBadges(userId: number, projectId?: number) {
  const { 
    data: badges,
    isLoading,
    error
  } = useQuery({
    queryKey: projectId ? ['badges', userId, projectId] : ['badges', userId],
    queryFn: async () => {
      const endpoint = projectId 
        ? `/api/users/${userId}/badges/project/${projectId}`
        : `/api/users/${userId}/badges`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }
      
      return response.json() as Promise<BadgeWithProgress[]>;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });

  return {
    badges: badges || [],
    isLoading,
    error
  };
}