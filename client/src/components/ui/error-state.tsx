/**
 * ErrorState Component
 * 
 * A reusable component for displaying errors throughout the application
 * with consistent styling and helpful recovery actions.
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { 
  AlertTriangle as AlertTriangleIcon,
  RefreshCw as RefreshCwIcon, 
  Home as HomeIcon,
  Monitor as MonitorIcon,
  HelpCircle as HelpCircleIcon,
  ArrowLeft as ArrowLeftIcon
} from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  errorCode?: string | number;
  errorDetails?: string;
  actionText?: string;
  actionFn?: () => void;
  showHomeLink?: boolean;
  showHelpLink?: boolean;
  showRefreshButton?: boolean;
  showBackButton?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an issue while processing your request.",
  errorCode,
  errorDetails,
  actionText,
  actionFn,
  showHomeLink = true,
  showHelpLink = true,
  showRefreshButton = true,
  showBackButton = false,
  icon = <AlertTriangleIcon className="h-10 w-10 text-destructive" />,
  className = ""
}: ErrorStateProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className={`w-full max-w-lg mx-auto my-8 ${className}`}>
      <Card className="border shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            {icon}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {errorCode && (
            <div className="bg-muted/50 p-3 rounded-md text-center text-muted-foreground mb-4">
              <span className="font-mono">Error Code: {errorCode}</span>
            </div>
          )}
          
          {errorDetails && (
            <div className="bg-muted p-3 rounded-md mb-4 overflow-auto max-h-32">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                {errorDetails}
              </pre>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3 justify-center">
            {actionText && actionFn && (
              <Button onClick={actionFn} variant="default">
                {actionText}
              </Button>
            )}
            
            {showRefreshButton && (
              <Button 
                onClick={handleRefresh} 
                variant="outline"
                className="gap-1"
              >
                <RefreshCwIcon className="h-4 w-4 mr-1" />
                Refresh Page
              </Button>
            )}
            
            {showBackButton && (
              <Button 
                onClick={handleGoBack} 
                variant="outline"
                className="gap-1"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Go Back
              </Button>
            )}
            
            {showHomeLink && (
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="gap-1"
                >
                  <HomeIcon className="h-4 w-4 mr-1" />
                  Home
                </Button>
              </Link>
            )}
            
            {showHelpLink && (
              <Link href="/help">
                <Button 
                  variant="ghost"
                  className="gap-1"
                >
                  <HelpCircleIcon className="h-4 w-4 mr-1" />
                  Help Center
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="border-t pt-4 flex justify-center">
          <Link href="/fix-my-screen/help" className="text-sm text-muted-foreground hover:underline inline-flex items-center">
            <MonitorIcon className="h-3.5 w-3.5 mr-1.5" />
            Display Issues? Click here for help
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ErrorState;