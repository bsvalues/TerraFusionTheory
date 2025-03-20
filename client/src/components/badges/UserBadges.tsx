import React from 'react';
import { 
  BadgeWithProgress,
  BadgeLevel
} from '@/types';
import { Badge } from '../ui/badge';
import { 
  LucideAward, 
  Trophy, 
  Target, 
  LineChart, 
  Map, 
  MessageCircle, 
  Sparkles 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Map badge icons to Lucide components
const badgeIcons: Record<string, React.ReactNode> = {
  'chart-bar': <LineChart className="h-3 w-3 mr-1" />,
  'trending-up': <LineChart className="h-3 w-3 mr-1" />,
  'map': <Map className="h-3 w-3 mr-1" />,
  'sparkles': <Sparkles className="h-3 w-3 mr-1" />,
  'message-circle': <MessageCircle className="h-3 w-3 mr-1" />,
  'target': <Target className="h-3 w-3 mr-1" />,
  'trophy': <Trophy className="h-3 w-3 mr-1" />,
  'award': <LucideAward className="h-3 w-3 mr-1" />
};

// Map badge levels to variants
const levelVariants: Record<BadgeLevel, "default" | "secondary" | "destructive" | "outline" | "warning" | "success" | "info" | "purple"> = {
  [BadgeLevel.BRONZE]: 'warning',
  [BadgeLevel.SILVER]: 'secondary',
  [BadgeLevel.GOLD]: 'warning',
  [BadgeLevel.PLATINUM]: 'purple'
};

interface UserBadgesProps {
  badges: BadgeWithProgress[];
  showProgress?: boolean;
}

const UserBadges: React.FC<UserBadgesProps> = ({ 
  badges, 
  showProgress = true 
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.length === 0 ? (
        <div className="text-sm text-gray-500 italic">No badges earned yet</div>
      ) : (
        badges.map((badge) => (
          <TooltipProvider key={badge.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative inline-block">
                  <Badge 
                    variant={(badge.variant as any) || levelVariants[badge.level as BadgeLevel] || 'default'}
                    className="flex items-center"
                    style={{ 
                      opacity: badge.isUnlocked ? 1 : 0.6, 
                      borderColor: badge.color,
                    }}
                  >
                    {badgeIcons[badge.icon] || <LucideAward className="h-3 w-3 mr-1" />}
                    {badge.name}
                    {badge.isNew && (
                      <span className="ml-1 bg-green-500 rounded-full h-2 w-2" />
                    )}
                  </Badge>
                  {showProgress && !badge.isUnlocked && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-primary h-1 rounded-full"
                        style={{ width: `${badge.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-bold">{badge.name}</div>
                  <div className="text-gray-400">{badge.level ? badge.level.toUpperCase() : 'UNKNOWN'}</div>
                  <div className="mt-1">{badge.description}</div>
                  {badge.isUnlocked ? (
                    <div className="mt-1 text-green-600">
                      ✓ Unlocked {badge.unlockDate && `on ${badge.unlockDate}`}
                    </div>
                  ) : (
                    <div className="mt-1">
                      Progress: {badge.progress}%
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))
      )}
    </div>
  );
};

export default UserBadges;