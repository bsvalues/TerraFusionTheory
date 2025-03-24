import React, { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

const DevAuthLoginPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/dev-auth');
  const query = new URLSearchParams(window.location.search);
  const tokenFromQuery = query.get('token');
  
  const [token, setToken] = useState(tokenFromQuery || '');
  const [loading, setLoading] = useState(!!tokenFromQuery);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If a token is provided in the URL, attempt to validate it automatically
  useEffect(() => {
    if (tokenFromQuery) {
      handleLogin();
    }
  }, [tokenFromQuery]);

  const handleLogin = async () => {
    if (!token) {
      setError('Please enter a valid token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/dev-auth/login?token=${token}`);
      
      // If we get a response back (not a redirect), it means success
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      } else {
        // This shouldn't happen as successful login should redirect
        setError('Login successful, but no redirect occurred. Please try refreshing the page.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred during authentication. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Developer Authentication</CardTitle>
          <CardDescription>
            This page is for development use only. Enter a one-time authentication token to login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4">
              <AlertTitle>Login Successful</AlertTitle>
              <AlertDescription>
                You have been authenticated successfully. Redirecting to homepage...
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="token">Authentication Token</Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter your one-time token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading || success}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleLogin} 
            disabled={loading || success || !token}
            className="w-full"
          >
            {loading ? <><Spinner className="mr-2" /> Authenticating...</> : 'Login'}
          </Button>
        </CardFooter>
      </Card>
      
      <p className="text-center text-sm text-muted-foreground mt-4">
        Need a token? Ask an administrator to generate one for you.
      </p>
    </div>
  );
};

export default DevAuthLoginPage;