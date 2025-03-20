import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge as BadgeType, BadgeLevel, BadgeType as BadgeCategory, BadgeWithProgress } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LucideAward, Plus, Edit, Trash2 } from 'lucide-react';
import UserBadges from './UserBadges';

interface BadgeManagementProps {
  userId?: number;
  projectId?: number;
}

const BadgeManagement: React.FC<BadgeManagementProps> = ({ userId = 1, projectId }) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all badges
  const { data: allBadges = [], isLoading: isLoadingBadges } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const response = await fetch('/api/badges');
      if (!response.ok) {
        throw new Error('Failed to fetch badges');
      }
      return response.json() as Promise<BadgeType[]>;
    }
  });

  // Fetch user badges
  const { data: userBadges = [], isLoading: isLoadingUserBadges } = useQuery({
    queryKey: ['badges', userId, projectId],
    queryFn: async () => {
      const endpoint = projectId
        ? `/api/users/${userId}/badges/project/${projectId}`
        : `/api/users/${userId}/badges`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch user badges');
      }
      return response.json() as Promise<BadgeWithProgress[]>;
    },
    enabled: !!userId
  });

  // Create badge mutation
  const createBadgeMutation = useMutation({
    mutationFn: async (newBadge: Omit<BadgeType, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBadge),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create badge');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast({
        title: 'Badge Created',
        description: 'The badge was successfully created.',
        variant: 'default',
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create badge',
        variant: 'destructive',
      });
    }
  });

  // Update badge mutation
  const updateBadgeMutation = useMutation({
    mutationFn: async (badge: BadgeType) => {
      const response = await fetch(`/api/badges/${badge.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(badge),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update badge');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast({
        title: 'Badge Updated',
        description: 'The badge was successfully updated.',
        variant: 'default',
      });
      setIsEditDialogOpen(false);
      setSelectedBadge(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update badge',
        variant: 'destructive',
      });
    }
  });
  
  // Delete badge mutation
  const deleteBadgeMutation = useMutation({
    mutationFn: async (badgeId: number) => {
      const response = await fetch(`/api/badges/${badgeId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete badge');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast({
        title: 'Badge Deleted',
        description: 'The badge was successfully deleted.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete badge',
        variant: 'destructive',
      });
    }
  });

  // Award badge to user mutation
  const awardBadgeMutation = useMutation({
    mutationFn: async ({ badgeId, progress }: { badgeId: number, progress: number }) => {
      const response = await fetch(`/api/users/${userId}/badges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          badgeId,
          userId,
          projectId: projectId || null,
          progress,
          metadata: {}
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to award badge');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges', userId] });
      queryClient.invalidateQueries({ queryKey: ['badges', userId, projectId] });
      toast({
        title: 'Badge Awarded',
        description: 'The badge was successfully awarded to the user.',
        variant: 'default',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to award badge',
        variant: 'destructive',
      });
    }
  });

  // Badge form state
  const [formData, setFormData] = useState<Partial<BadgeType>>({
    name: '',
    description: '',
    type: BadgeCategory.ACHIEVEMENT,
    level: BadgeLevel.BRONZE,
    criteria: {},
    icon: 'award',
    color: '#f59e0b',
  });

  const handleFormChange = (field: keyof BadgeType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateBadge = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.type || !formData.level) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    createBadgeMutation.mutate(formData as any);
  };

  const handleUpdateBadge = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBadge || !formData.name || !formData.description || !formData.type || !formData.level) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    updateBadgeMutation.mutate({ ...selectedBadge, ...formData } as BadgeType);
  };

  const handleEditBadge = (badge: BadgeType) => {
    setSelectedBadge(badge);
    setFormData(badge);
    setIsEditDialogOpen(true);
  };

  const handleDeleteBadge = (badgeId: number) => {
    if (window.confirm('Are you sure you want to delete this badge?')) {
      deleteBadgeMutation.mutate(badgeId);
    }
  };

  const handleAwardBadge = (badgeId: number, progress: number = 0) => {
    awardBadgeMutation.mutate({ badgeId, progress });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="existing">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">Existing Badges</TabsTrigger>
          <TabsTrigger value="user">User Badges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="existing" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Badge Management</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Badge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Badge</DialogTitle>
                  <DialogDescription>
                    Create a new badge that can be awarded to users.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBadge} className="space-y-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleFormChange('type', value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select badge type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={BadgeCategory.EFFICIENCY}>Efficiency</SelectItem>
                        <SelectItem value={BadgeCategory.ACCURACY}>Accuracy</SelectItem>
                        <SelectItem value={BadgeCategory.SPEED}>Speed</SelectItem>
                        <SelectItem value={BadgeCategory.CONSISTENCY}>Consistency</SelectItem>
                        <SelectItem value={BadgeCategory.INNOVATION}>Innovation</SelectItem>
                        <SelectItem value={BadgeCategory.COLLABORATION}>Collaboration</SelectItem>
                        <SelectItem value={BadgeCategory.ACHIEVEMENT}>Achievement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="level" className="text-right">
                      Level
                    </Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => handleFormChange('level', value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select badge level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={BadgeLevel.BRONZE}>Bronze</SelectItem>
                        <SelectItem value={BadgeLevel.SILVER}>Silver</SelectItem>
                        <SelectItem value={BadgeLevel.GOLD}>Gold</SelectItem>
                        <SelectItem value={BadgeLevel.PLATINUM}>Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="icon" className="text-right">
                      Icon
                    </Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(value) => handleFormChange('icon', value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="award">Award</SelectItem>
                        <SelectItem value="trophy">Trophy</SelectItem>
                        <SelectItem value="target">Target</SelectItem>
                        <SelectItem value="chart-bar">Chart</SelectItem>
                        <SelectItem value="map">Map</SelectItem>
                        <SelectItem value="sparkles">Sparkles</SelectItem>
                        <SelectItem value="message-circle">Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="color" className="text-right">
                      Color
                    </Label>
                    <div className="col-span-3 flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => handleFormChange('color', e.target.value)}
                        className="w-16"
                      />
                      <Input
                        type="text"
                        value={formData.color}
                        onChange={(e) => handleFormChange('color', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createBadgeMutation.isPending}>
                      {createBadgeMutation.isPending ? 'Creating...' : 'Create Badge'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoadingBadges ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableCaption>A list of all available badges</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBadges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                        No badges found. Create your first badge!
                      </TableCell>
                    </TableRow>
                  ) : (
                    allBadges.map((badge) => (
                      <TableRow key={badge.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <LucideAward
                              className="h-4 w-4"
                              style={{ color: badge.color || undefined }}
                            />
                            {badge.name}
                          </div>
                        </TableCell>
                        <TableCell>{badge.type}</TableCell>
                        <TableCell className="uppercase">{badge.level}</TableCell>
                        <TableCell className="max-w-xs truncate">{badge.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAwardBadge(badge.id, 100)}
                            >
                              Award
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditBadge(badge)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteBadge(badge.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="user" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">User Badges</h2>
          </div>
          
          {isLoadingUserBadges ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBadges.length === 0 ? (
                <Card className="col-span-full">
                  <CardHeader>
                    <CardTitle>No badges earned yet</CardTitle>
                    <CardDescription>
                      This user hasn't earned any badges for this project yet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Award badges to recognize user achievements and progress.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                userBadges.map((badge) => (
                  <Card key={badge.id} className={badge.isUnlocked ? "border-primary" : ""}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{badge.name}</CardTitle>
                          <CardDescription>
                            {badge.level?.toUpperCase()} • {badge.type}
                          </CardDescription>
                        </div>
                        <div
                          className={`p-2 rounded-full flex items-center justify-center text-white ${
                            badge.level === BadgeLevel.GOLD ? 'bg-yellow-500' :
                            badge.level === BadgeLevel.SILVER ? 'bg-gray-400' :
                            badge.level === BadgeLevel.BRONZE ? 'bg-amber-700' :
                            badge.level === BadgeLevel.PLATINUM ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`}
                        >
                          <LucideAward className="h-5 w-5" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{badge.description}</p>
                      
                      {badge.isUnlocked ? (
                        <div className="text-green-600 text-sm font-medium flex items-center">
                          ✓ Unlocked {badge.unlockDate && `on ${badge.unlockDate}`}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-700"
                              style={{ width: `${badge.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Progress</span>
                            <span>{badge.progress}%</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      {!badge.isUnlocked && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAwardBadge(badge.badgeId, 100)}
                        >
                          Complete Badge
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Badge Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Badge</DialogTitle>
            <DialogDescription>
              Update this badge's details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBadge} className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleFormChange('type', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select badge type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BadgeCategory.EFFICIENCY}>Efficiency</SelectItem>
                  <SelectItem value={BadgeCategory.ACCURACY}>Accuracy</SelectItem>
                  <SelectItem value={BadgeCategory.SPEED}>Speed</SelectItem>
                  <SelectItem value={BadgeCategory.CONSISTENCY}>Consistency</SelectItem>
                  <SelectItem value={BadgeCategory.INNOVATION}>Innovation</SelectItem>
                  <SelectItem value={BadgeCategory.COLLABORATION}>Collaboration</SelectItem>
                  <SelectItem value={BadgeCategory.ACHIEVEMENT}>Achievement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-level" className="text-right">
                Level
              </Label>
              <Select
                value={formData.level}
                onValueChange={(value) => handleFormChange('level', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select badge level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BadgeLevel.BRONZE}>Bronze</SelectItem>
                  <SelectItem value={BadgeLevel.SILVER}>Silver</SelectItem>
                  <SelectItem value={BadgeLevel.GOLD}>Gold</SelectItem>
                  <SelectItem value={BadgeLevel.PLATINUM}>Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-icon" className="text-right">
                Icon
              </Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => handleFormChange('icon', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="award">Award</SelectItem>
                  <SelectItem value="trophy">Trophy</SelectItem>
                  <SelectItem value="target">Target</SelectItem>
                  <SelectItem value="chart-bar">Chart</SelectItem>
                  <SelectItem value="map">Map</SelectItem>
                  <SelectItem value="sparkles">Sparkles</SelectItem>
                  <SelectItem value="message-circle">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleFormChange('color', e.target.value)}
                  className="w-16"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleFormChange('color', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBadgeMutation.isPending}>
                {updateBadgeMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BadgeManagement;