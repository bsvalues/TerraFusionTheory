import React from 'react';
import { Badge as BadgeType, BadgeLevel, BadgeWithProgress } from '@/types';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// Badge color mapping
const badgeLevelColorMap: Record<BadgeLevel, string> = {
  [BadgeLevel.BRONZE]: 'bg-amber-700',
  [BadgeLevel.SILVER]: 'bg-gray-400',
  [BadgeLevel.GOLD]: 'bg-yellow-500',
  [BadgeLevel.PLATINUM]: 'bg-purple-400'
};

// Badge icon mapping
const getBadgeIcon = (badge: BadgeType) => {
  // Use badge.icon if available, otherwise use a default
  return badge.icon || '🏆';
};

/**
 * Shows a toast notification when a badge is earned or updated
 */
export const showBadgeNotification = (badge: BadgeWithProgress, isNewBadge: boolean = false) => {
  toast({
    title: isNewBadge ? '🎉 New Badge Earned!' : '📈 Badge Progress Updated',
    description: (
      <Card className="border-0 shadow-none p-0">
        <CardContent className="p-0 pt-2">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full text-white ${
              badge.level && badgeLevelColorMap[badge.level as BadgeLevel] || 'bg-gray-500'
            }`}>
              <span className="text-lg">{getBadgeIcon(badge)}</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold">{badge.name}</h4>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
              {!isNewBadge && badge.progress < 100 && (
                <div className="mt-1">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                  <p className="text-xs mt-0.5 text-right">{badge.progress}%</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    duration: 5000,
  });
};

/**
 * Compares old and new badge arrays to find newly earned or updated badges
 * Returns badges that should trigger notifications
 */
export const detectBadgeChanges = (
  oldBadges: BadgeWithProgress[] = [], 
  newBadges: BadgeWithProgress[] = []
): { newlyEarned: BadgeWithProgress[], progressUpdated: BadgeWithProgress[] } => {
  const newlyEarned: BadgeWithProgress[] = [];
  const progressUpdated: BadgeWithProgress[] = [];
  
  // Check for new badges or updated badges
  newBadges.forEach(newBadge => {
    const oldBadge = oldBadges.find(b => b.id === newBadge.id);
    
    // If badge didn't exist before or wasn't unlocked but now is
    if (!oldBadge || (!oldBadge.isUnlocked && newBadge.isUnlocked)) {
      newlyEarned.push(newBadge);
    } 
    // If progress has increased significantly (5% or more)
    else if (
      !newBadge.isUnlocked && 
      oldBadge && 
      newBadge.progress > oldBadge.progress && 
      newBadge.progress - oldBadge.progress >= 5
    ) {
      progressUpdated.push(newBadge);
    }
  });
  
  return { newlyEarned, progressUpdated };
};

/**
 * Process badge changes and show appropriate notifications
 */
export const processBadgeNotifications = (
  oldBadges: BadgeWithProgress[] = [], 
  newBadges: BadgeWithProgress[] = []
) => {
  const { newlyEarned, progressUpdated } = detectBadgeChanges(oldBadges, newBadges);
  
  // Show notifications for newly earned badges
  newlyEarned.forEach(badge => {
    showBadgeNotification(badge, true);
  });
  
  // Show notifications for significant progress updates
  progressUpdated.forEach(badge => {
    showBadgeNotification(badge, false);
  });
  
  return newlyEarned.length + progressUpdated.length > 0;
};