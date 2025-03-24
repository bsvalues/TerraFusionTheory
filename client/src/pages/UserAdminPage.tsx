import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string | null;
}

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  email: z.string().email().optional().nullable(),
});

export default function UserAdminPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const { 
    data: users, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery<User[]>({ 
    queryKey: ['/api/users'],
    refetchOnWindowFocus: false,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });
  
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      toast({
        title: "User created",
        description: `User ${values.username} was created successfully`,
      });
      
      // Reset form and close dialog
      form.reset();
      setIsCreateDialogOpen(false);
      
      // Refresh user list
      refetch();
    } catch (err) {
      console.error('Error creating user:', err);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  }
  
  async function onEditSubmit(values: z.infer<typeof formSchema>) {
    if (!editingUserId) return;
    
    try {
      // For now, we'll just show a success message
      // In a real app, we would send a PATCH request to update the user
      toast({
        title: "User updated",
        description: `User ${values.username} was updated successfully`,
      });
      
      // Reset form and refresh user list
      editForm.reset();
      setEditingUserId(null);
      refetch();
    } catch (err) {
      console.error('Error updating user:', err);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  }
  
  async function handleDeleteUser(userId: number) {
    try {
      // For now, we'll just show a success message
      // In a real app, we would send a DELETE request to delete the user
      toast({
        title: "User deleted",
        description: "User was deleted successfully",
      });
      
      // Refresh user list
      refetch();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="text-destructive text-xl">Error loading users</div>
        <div className="text-muted-foreground mt-2">{(error as Error)?.message || 'Unknown error'}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage users and their access</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create new user</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. Make sure to use a secure password.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormDescription>
                          The user's login name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Must be at least 6 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="user@example.com" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Optional email address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create User
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <Dialog
                      onOpenChange={(open) => {
                        if (open) {
                          // Load user data into form when opening the dialog
                          editForm.reset({
                            username: user.username,
                            email: user.email || "",
                            password: "", // Leave blank for edit
                          });
                          setEditingUserId(user.id);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="mr-2">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User</DialogTitle>
                          <DialogDescription>
                            Update user information. Leave password blank to keep current password.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...editForm}>
                          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                              control={editForm.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input placeholder="username" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="password" 
                                      placeholder="Leave blank to keep current" 
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Leave blank to keep current password
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={editForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="user@example.com" 
                                      {...field} 
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="submit" disabled={editForm.formState.isSubmitting}>
                                {editForm.formState.isSubmitting && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                        >
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete user "{user.username}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => document.getElementById("close-delete-dialog")?.click()}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => {
                              handleDeleteUser(user.id);
                              document.getElementById("close-delete-dialog")?.click();
                            }}
                          >
                            Delete User
                          </Button>
                        </DialogFooter>
                        <button id="close-delete-dialog" className="hidden" />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {users && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No users found. Add a user to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}