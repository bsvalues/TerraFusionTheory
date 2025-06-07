import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeWithProgress } from '@/types';
import { processBadgeNotifications } from '@/components/badges/BadgeNotification';

export function useBadges(userId: number, projectId?: number, enableNotifications: boolean = true) {
  // Store previous badges to detect changes
  const previousBadgesRef = useRef<BadgeWithProgress[]>([]);
  
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

  // Process badge notifications when badges change
  useEffect(() => {
    if (badges && enableNotifications) {
      const currentBadges = badges || [];
      const previousBadges = previousBadgesRef.current;
      
      // Only process notifications if this isn't the first load (to avoid notification spam)
      if (previousBadges.length > 0) {
        processBadgeNotifications(previousBadges, currentBadges);
      }
      
      // Update previous badges reference
      previousBadgesRef.current = currentBadges;
    }
  }, [badges, enableNotifications]);

  return {
    badges: badges || [],
    isLoading,
    error
  };
}