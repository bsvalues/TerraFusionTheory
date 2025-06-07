import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeWithProgress, BadgeLevel, BadgeType as BadgeCategory } from '@/types';
import { useBadges } from '@/hooks/useBadges';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LucideAward, 
  Trophy, 
  Target, 
  LineChart, 
  Map, 
  MessageCircle, 
  Sparkles,
  Filter,
  Search
} from 'lucide-react';
import BadgeManagement from '@/components/badges/BadgeManagement';

// Map badge icons to components
const badgeIcons: Record<string, React.ReactNode> = {
  'chart-bar': <LineChart className="h-5 w-5" />,
  'trending-up': <LineChart className="h-5 w-5" />,
  'map': <Map className="h-5 w-5" />,
  'sparkles': <Sparkles className="h-5 w-5" />,
  'message-circle': <MessageCircle className="h-5 w-5" />,
  'target': <Target className="h-5 w-5" />,
  'trophy': <Trophy className="h-5 w-5" />,
  'award': <LucideAward className="h-5 w-5" />
};

// Map badge levels to color classes
const badgeLevelColors: Record<BadgeLevel, string> = {
  [BadgeLevel.BRONZE]: 'bg-amber-700',
  [BadgeLevel.SILVER]: 'bg-gray-400',
  [BadgeLevel.GOLD]: 'bg-yellow-500',
  [BadgeLevel.PLATINUM]: 'bg-purple-500'
};

const BadgesPage: React.FC = () => {
  const userId = 1; // Default user ID
  const { badges, isLoading } = useBadges(userId);
  
  // Fetch all available badges to show what can be earned
  const { data: allBadges = [], isLoading: isLoadingAllBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const response = await fetch('/api/badges');
      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }
      return response.json();
    }
  });
  
  // State for filtering and searching
  const [activeTab, setActiveTab] = useState('earned');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter badges based on current filters and search term
  const filterBadges = (badgesList: BadgeWithProgress[]) => {
    return badgesList.filter(badge => {
      // Filter by badge type
      if (filterType !== 'all' && badge.type !== filterType) {
        return false;
      }
      
      // Filter by badge level
      if (filterLevel !== 'all' && badge.level !== filterLevel) {
        return false;
      }
      
      // Filter by search term
      if (searchTerm && !badge.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !badge.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  };

  // Get badges that the user has earned
  const earnedBadges = badges.filter(badge => badge.isUnlocked);
  
  // Get badges that are in progress
  const inProgressBadges = badges.filter(badge => !badge.isUnlocked && badge.progress > 0);
  
  // Get badges that are not yet started
  const availableBadges = allBadges.filter((availableBadge: any) => 
    !badges.some(userBadge => userBadge.id === availableBadge.id)
  ).map((badge: any) => ({
    ...badge,
    isUnlocked: false,
    progress: 0,
    id: badge.id
  }));
  
  // Apply filters based on active tab
  const filteredBadges = activeTab === 'earned' 
    ? filterBadges(earnedBadges)
    : activeTab === 'in-progress'
      ? filterBadges(inProgressBadges)
      : activeTab === 'available'
        ? filterBadges(availableBadges as BadgeWithProgress[])
        : activeTab === 'manage'
          ? []
          : filterBadges(badges);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Badge Dashboard</h1>
      
      <Tabs defaultValue="earned" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="all">All Badges</TabsTrigger>
            <TabsTrigger value="earned">Earned ({earnedBadges.length})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({inProgressBadges.length})</TabsTrigger>
            <TabsTrigger value="available">Available ({availableBadges.length})</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>
          
          {activeTab !== 'manage' && (
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search badges..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={BadgeCategory.EFFICIENCY}>Efficiency</SelectItem>
                    <SelectItem value={BadgeCategory.ACCURACY}>Accuracy</SelectItem>
                    <SelectItem value={BadgeCategory.SPEED}>Speed</SelectItem>
                    <SelectItem value={BadgeCategory.CONSISTENCY}>Consistency</SelectItem>
                    <SelectItem value={BadgeCategory.INNOVATION}>Innovation</SelectItem>
                    <SelectItem value={BadgeCategory.COLLABORATION}>Collaboration</SelectItem>
                    <SelectItem value={BadgeCategory.ACHIEVEMENT}>Achievement</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-full md:w-40">
                    <LucideAward className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value={BadgeLevel.BRONZE}>Bronze</SelectItem>
                    <SelectItem value={BadgeLevel.SILVER}>Silver</SelectItem>
                    <SelectItem value={BadgeLevel.GOLD}>Gold</SelectItem>
                    <SelectItem value={BadgeLevel.PLATINUM}>Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
                    <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-2 w-full bg-gray-200 rounded"></div>
                  </CardFooter>
                </Card>
              ))
            ) : filteredBadges.length === 0 ? (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No badges match your filter criteria</CardTitle>
                  <CardDescription>
                    Try adjusting your filters or search term.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              filteredBadges.map((badge) => (
                <Card 
                  key={badge.id}
                  className={`transition-all duration-300 ${
                    badge.isUnlocked ? 'border-primary shadow-md' : 'hover:shadow-md'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          {badge.name}
                          {badge.isNew && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              New
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <span className="uppercase">{badge.level}</span>
                          <span>•</span>
                          <span>{badge.type}</span>
                        </CardDescription>
                      </div>
                      <div 
                        className={`p-2 rounded-full flex items-center justify-center text-white ${
                          badge.level ? badgeLevelColors[badge.level as BadgeLevel] : 'bg-gray-500'
                        }`}
                      >
                        {badge.icon && badgeIcons[badge.icon] || <LucideAward className="h-5 w-5" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{badge.description}</p>
                    
                    {badge.isUnlocked ? (
                      <div className="text-green-600 text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        Unlocked {badge.unlockDate && `on ${badge.unlockDate}`}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Progress value={badge.progress} />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>{badge.progress}%</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="earned" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
                    <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredBadges.length === 0 ? (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No earned badges yet</CardTitle>
                  <CardDescription>
                    Complete tasks and projects to earn badges.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              filteredBadges.map((badge) => (
                <Card key={badge.id} className="border-primary shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{badge.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <span className="uppercase">{badge.level}</span>
                          <span>•</span>
                          <span>{badge.type}</span>
                        </CardDescription>
                      </div>
                      <div 
                        className={`p-2 rounded-full flex items-center justify-center text-white ${
                          badge.level ? badgeLevelColors[badge.level as BadgeLevel] : 'bg-gray-500'
                        }`}
                      >
                        {badge.icon && badgeIcons[badge.icon] || <LucideAward className="h-5 w-5" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{badge.description}</p>
                    
                    <div className="text-green-600 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      Unlocked {badge.unlockDate && `on ${badge.unlockDate}`}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="in-progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
                    <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-2 w-full bg-gray-200 rounded"></div>
                  </CardFooter>
                </Card>
              ))
            ) : filteredBadges.length === 0 ? (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No badges in progress</CardTitle>
                  <CardDescription>
                    Start working on tasks to make progress toward badges.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              filteredBadges.map((badge) => (
                <Card key={badge.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{badge.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <span className="uppercase">{badge.level}</span>
                          <span>•</span>
                          <span>{badge.type}</span>
                        </CardDescription>
                      </div>
                      <div 
                        className={`p-2 rounded-full flex items-center justify-center text-white ${
                          badge.level ? badgeLevelColors[badge.level as BadgeLevel] : 'bg-gray-500'
                        }`}
                        style={{ opacity: 0.7 }}
                      >
                        {badge.icon && badgeIcons[badge.icon] || <LucideAward className="h-5 w-5" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{badge.description}</p>
                    
                    <div className="space-y-2">
                      <Progress value={badge.progress} />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progress</span>
                        <span>{badge.progress}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="available" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingAllBadges ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
                    <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : filteredBadges.length === 0 ? (
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>No badges available</CardTitle>
                  <CardDescription>
                    You've started working on all available badges.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              filteredBadges.map((badge) => (
                <Card key={badge.id} className="opacity-80 hover:opacity-100 transition-opacity">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{badge.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <span className="uppercase">{badge.level}</span>
                          <span>•</span>
                          <span>{badge.type}</span>
                        </CardDescription>
                      </div>
                      <div 
                        className={`p-2 rounded-full flex items-center justify-center text-white ${
                          badge.level ? badgeLevelColors[badge.level as BadgeLevel] : 'bg-gray-500'
                        }`}
                        style={{ opacity: 0.5 }}
                      >
                        {badge.icon && badgeIcons[badge.icon] || <LucideAward className="h-5 w-5" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{badge.description}</p>
                    
                    <div className="text-sm text-gray-500">
                      Not yet started
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="manage">
          <BadgeManagement userId={userId} />
        </TabsContent>
      </Tabs>
      
      <div className="bg-gray-50 rounded-lg p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Badge Achievements</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-primary mb-1">{earnedBadges.length}</div>
            <div className="text-sm text-gray-500">Earned Badges</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-blue-500 mb-1">{inProgressBadges.length}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-amber-500 mb-1">{availableBadges.length}</div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-3xl font-bold text-purple-500 mb-1">{allBadges.length}</div>
            <div className="text-sm text-gray-500">Total Badges</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgesPage;