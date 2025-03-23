import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'wouter';
import { 
  LucideAlertTriangle, 
  LucideArrowLeft, 
  LucideCheckCircle2, 
  LucideExternalLink, 
  LucideHome, 
  LucideMonitor, 
  LucideRefreshCw, 
  LucideSettings
} from 'lucide-react';

export default function BlackScreenHelpPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="ghost" className="mr-4">
            <LucideArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold flex items-center">
          <LucideMonitor className="mr-2 h-6 w-6 text-primary" />
          Screen Display Troubleshooting
        </h1>
      </div>
      
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded">
        <div className="flex items-start">
          <LucideAlertTriangle className="h-6 w-6 text-amber-600 mr-3 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-amber-800">Experiencing Display Issues?</h2>
            <p className="text-amber-700">
              If you're seeing a black screen or experiencing other display problems with the real estate
              analytics application, this guide will help you resolve common issues.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <LucideRefreshCw className="mr-2 h-5 w-5 text-primary" />
              Quick Solutions
            </CardTitle>
            <CardDescription>Try these simple fixes first</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-2 border-green-400 pl-4 py-1">
              <h3 className="font-medium">Refresh the Page</h3>
              <p className="text-sm text-muted-foreground">
                Often a simple page refresh will resolve temporary rendering issues. Press F5 or use your browser's
                refresh button.
              </p>
            </div>
            
            <div className="border-l-2 border-green-400 pl-4 py-1">
              <h3 className="font-medium">Clear Browser Cache</h3>
              <p className="text-sm text-muted-foreground">
                Clearing your browser cache can resolve issues with outdated or corrupted files.
              </p>
              <div className="mt-2 text-xs">
                <code className="bg-muted p-1 rounded">Chrome: Ctrl+Shift+Delete</code>
                <br />
                <code className="bg-muted p-1 rounded">Firefox: Ctrl+Shift+Delete</code>
                <br />
                <code className="bg-muted p-1 rounded">Safari: Option+Command+E</code>
              </div>
            </div>
            
            <div className="border-l-2 border-green-400 pl-4 py-1">
              <h3 className="font-medium">Try Private/Incognito Mode</h3>
              <p className="text-sm text-muted-foreground">
                Opening the application in a private/incognito window can bypass extension conflicts and cached data issues.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <LucideSettings className="mr-2 h-5 w-5 text-primary" />
              Advanced Troubleshooting
            </CardTitle>
            <CardDescription>For persistent display problems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-2 border-blue-400 pl-4 py-1">
              <h3 className="font-medium">Update Graphics Drivers</h3>
              <p className="text-sm text-muted-foreground">
                Outdated graphics drivers can cause rendering issues with map visualizations and data charts.
                Visit your graphics card manufacturer's website for the latest drivers.
              </p>
            </div>
            
            <div className="border-l-2 border-blue-400 pl-4 py-1">
              <h3 className="font-medium">Disable Hardware Acceleration</h3>
              <p className="text-sm text-muted-foreground">
                Try disabling hardware acceleration in your browser settings if you experience map rendering issues.
              </p>
              <div className="mt-2 text-xs">
                <code className="bg-muted p-1 rounded">Chrome: Settings &rarr; Advanced &rarr; System &rarr; Use hardware acceleration</code>
              </div>
            </div>
            
            <div className="border-l-2 border-blue-400 pl-4 py-1">
              <h3 className="font-medium">Try Different Browser</h3>
              <p className="text-sm text-muted-foreground">
                Some features may work better in different browsers. Our application is optimized for Chrome, Firefox, and Edge.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <LucideCheckCircle2 className="mr-2 h-5 w-5 text-primary" />
            Fallback Options
          </CardTitle>
          <CardDescription>
            Alternative ways to access our real estate analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-4 bg-card/50">
                <h3 className="font-medium text-primary">Simplified View Mode</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Our application offers a simplified view that reduces graphics processing requirements.
                  This mode disables advanced visualizations but keeps all data accessible.
                </p>
                <Button className="mt-3 w-full" variant="outline">
                  <LucideExternalLink className="mr-2 h-4 w-4" />
                  Switch to Simplified View
                </Button>
              </div>
              
              <div className="border rounded p-4 bg-card/50">
                <h3 className="font-medium text-primary">Static Data Export</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You can export property data and analytics as static reports in PDF or Excel format
                  if you're unable to view the interactive dashboards.
                </p>
                <Button className="mt-3 w-full" variant="outline">
                  <LucideExternalLink className="mr-2 h-4 w-4" />
                  Access Data Exports
                </Button>
              </div>
            </div>
            
            <div className="border rounded p-4 bg-primary/5 mt-4">
              <h3 className="font-medium">Mobile Application</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Our mobile application offers a streamlined experience that may work better on some devices.
                It's available for both iOS and Android platforms.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button variant="secondary" size="sm">
                  Download for iOS
                </Button>
                <Button variant="secondary" size="sm">
                  Download for Android
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Still Having Problems?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            If you've tried all the suggested solutions and are still experiencing display issues,
            please contact our support team with details about your device, browser, and the specific
            problems you're encountering.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>Contact Support</Button>
            <Button variant="outline">
              <LucideHome className="mr-2 h-4 w-4" />
              Return to Homepage
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground border-t pt-3">
          Last updated: March 23, 2025 • Real Estate Intelligence Platform v2.4.1
        </CardFooter>
      </Card>
    </div>
  );
}