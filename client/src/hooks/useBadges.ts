import { useQuery } from '@tanstack/react-query';

export interface BadgeWithProgress {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  earned: boolean;
  earnedAt?: string;
}

export function useBadges(userId: number, projectId: number) {
  const { data: badges = [], isLoading, error } = useQuery({
    queryKey: ['/api/badges', userId, projectId],
    queryFn: async () => {
      const response = await fetch(`/api/badges?userId=${userId}&projectId=${projectId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch badges: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    badges,
    isLoading,
    error,
  };
}