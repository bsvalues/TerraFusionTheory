import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Form schema for token generation
const tokenFormSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required' }).transform(val => parseInt(val, 10)),
  expirationMinutes: z.string().transform(val => parseInt(val, 10)).pipe(
    z.number().min(5, { message: 'Minimum expiration is 5 minutes' }).max(1440, { message: 'Maximum expiration is 24 hours (1440 minutes)' })
  ),
});

// Type for form data with string values as required by form components
type TokenFormValues = {
  userId: string;
  expirationMinutes: string;
};

// Token type
interface Token {
  userId: number;
  tokenFragment: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

const DevAuthAdminPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [generatedToken, setGeneratedToken] = useState<{
    token: string;
    loginUrl: string;
    userId: number;
    expiresInMinutes: number;
  } | null>(null);
  const [stats, setStats] = useState<{ activeTokenCount: number; isEnabled: boolean } | null>(null);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);

  // Initialize form
  const form = useForm<TokenFormValues>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: {
      userId: "1", // Default to first user as string (will be transformed by schema)
      expirationMinutes: "60", // Default to 60 minutes as string (will be transformed by schema)
    },
  });

  // Load users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch users. Please try again.',
          variant: 'destructive',
        });
      }
    };

    fetchUsers();
  }, [toast]);

  // Load stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dev-auth/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch token stats:', error);
      }
    };

    fetchStats();
  }, []);

  // Load tokens for a specific user
  const loadUserTokens = async (userId: number) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/dev-auth/user/${userId}/tokens`);
      setTokens(response.data.tokens);
      setActiveUserId(userId);
    } catch (error) {
      console.error('Failed to fetch user tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tokens for this user.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof tokenFormSchema>) => {
    setIsLoading(true);
    setGeneratedToken(null);
    
    try {
      const response = await axios.post('/api/dev-auth/token', {
        userId: values.userId, // Now it's already a number due to transform
        expirationMinutes: values.expirationMinutes,
      });
      
      setGeneratedToken(response.data);
      toast({
        title: 'Token Generated',
        description: 'One-time authentication token has been generated successfully.',
      });
      
      // Refresh stats
      const statsResponse = await axios.get('/api/dev-auth/stats');
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to generate token:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate token. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke a specific token
  const revokeToken = async (token: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.delete(`/api/dev-auth/token/${token}`);
      
      // Refresh tokens list
      if (activeUserId) {
        await loadUserTokens(activeUserId);
      }
      
      // Refresh stats
      const statsResponse = await axios.get('/api/dev-auth/stats');
      setStats(statsResponse.data);
      
      toast({
        title: 'Token Revoked',
        description: 'The token has been revoked successfully.',
      });
    } catch (error) {
      console.error('Failed to revoke token:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke token. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Revoke all tokens for a user
  const revokeAllTokens = async (userId: number) => {
    if (!confirm(`Are you sure you want to revoke all tokens for user ${userId}?`)) {
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.delete(`/api/dev-auth/user/${userId}/tokens`);
      
      // Refresh tokens list
      setTokens([]);
      
      // Refresh stats
      const statsResponse = await axios.get('/api/dev-auth/stats');
      setStats(statsResponse.data);
      
      toast({
        title: 'Tokens Revoked',
        description: `All tokens for user ${userId} have been revoked.`,
      });
    } catch (error) {
      console.error('Failed to revoke tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke tokens. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied!',
        description: message,
      });
    });
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Development Authentication Admin</h1>
      
      {stats && !stats.isEnabled && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Dev Auth Disabled</AlertTitle>
          <AlertDescription>
            The development authentication service is currently disabled. It only works in development environments.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Tokens</CardTitle>
            <CardDescription>Currently active one-time tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats ? stats.activeTokenCount : <Spinner />}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Dev auth service status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={stats?.isEnabled ? "success" : "destructive"}>
              {stats?.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Current environment</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{process.env.NODE_ENV || 'development'}</Badge>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="generate">Generate Token</TabsTrigger>
          <TabsTrigger value="manage">Manage Tokens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate One-Time Token</CardTitle>
                <CardDescription>
                  Create a new one-time authentication token for development access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User ID</FormLabel>
                          <Select
                            disabled={isLoading}
                            onValueChange={field.onChange}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a user" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map(user => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.username} (ID: {user.id})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The user who will be authenticated with this token
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expirationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Time (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="60"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            How long the token will be valid (5-1440 minutes)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? <><Spinner className="mr-2" /> Generating...</> : 'Generate Token'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {generatedToken && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Token</CardTitle>
                  <CardDescription>
                    This token can only be used once and will expire in {generatedToken.expiresInMinutes} minutes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Token:</label>
                    <div className="flex mt-1">
                      <Input
                        value={generatedToken.token}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button 
                        variant="outline" 
                        className="ml-2"
                        onClick={() => copyToClipboard(generatedToken.token, 'Token copied to clipboard')}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Login URL:</label>
                    <div className="flex mt-1">
                      <Input
                        value={generatedToken.loginUrl}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button 
                        variant="outline" 
                        className="ml-2"
                        onClick={() => copyToClipboard(generatedToken.loginUrl, 'Login URL copied to clipboard')}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => window.open(generatedToken.loginUrl, '_blank')}
                  >
                    Open Login URL
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage Authentication Tokens</CardTitle>
              <CardDescription>
                View and revoke active one-time authentication tokens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <FormLabel>Select User</FormLabel>
                  <div className="flex space-x-2 mt-1">
                    <Select
                      onValueChange={(value) => loadUserTokens(parseInt(value, 10))}
                      defaultValue={activeUserId?.toString()}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} (ID: {user.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {activeUserId && (
                      <Button 
                        variant="destructive" 
                        onClick={() => revokeAllTokens(activeUserId)}
                        disabled={isLoading || tokens.length === 0}
                      >
                        Revoke All
                      </Button>
                    )}
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner className="h-8 w-8" />
                  </div>
                ) : activeUserId ? (
                  tokens.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      No active tokens found for this user.
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Token Fragment</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tokens.map((token, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-mono">{token.tokenFragment}</TableCell>
                              <TableCell>{new Date(token.createdAt).toLocaleString()}</TableCell>
                              <TableCell>{new Date(token.expiresAt).toLocaleString()}</TableCell>
                              <TableCell>
                                {token.used ? (
                                  <Badge variant="secondary">Used</Badge>
                                ) : (
                                  <Badge variant="success">Active</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => revokeToken(token.tokenFragment.replace('...', ''))}
                                  disabled={isLoading}
                                >
                                  Revoke
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    Select a user to view their tokens.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DevAuthAdminPage;