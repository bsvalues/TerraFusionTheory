import React from 'react';
import { BadgeWithProgress } from '@/types';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Award, Trophy, Star, Target } from 'lucide-react';

interface UserBadgesProps {
  badges: BadgeWithProgress[];
  showProgress?: boolean;
}

const badgeIcons = {
  award: Award,
  trophy: Trophy,
  star: Star,
  target: Target,
};

const badgeLevelColors = {
  bronze: 'bg-amber-600',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-500',
};

const UserBadges: React.FC<UserBadgesProps> = ({ badges, showProgress = false }) => {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Award className="h-12 w-12 mx-auto mb-2 opacity-30" />
        <p>No badges earned yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {badges.map((badge) => {
        const IconComponent = badgeIcons[badge.icon as keyof typeof badgeIcons] || Award;
        const levelColor = badgeLevelColors[badge.level as keyof typeof badgeLevelColors] || 'bg-gray-500';
        
        return (
          <div
            key={badge.id}
            className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 text-sm">{badge.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
              </div>
              <div className={`p-2 rounded-full flex items-center justify-center text-white ${levelColor}`}>
                <IconComponent className="h-4 w-4" />
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="uppercase font-medium">{badge.level}</span>
              <Badge variant="outline" className="text-xs">
                {badge.type}
              </Badge>
            </div>
            
            {showProgress && badge.progress !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{badge.progress}%</span>
                </div>
                <Progress value={badge.progress} className="h-1" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UserBadges;