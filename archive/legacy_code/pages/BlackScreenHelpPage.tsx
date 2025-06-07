/**
 * BlackScreenHelpPage
 * 
 * A dedicated help page for users experiencing blank/black screen issues.
 * This page provides troubleshooting steps and is designed to be minimal
 * to maximize chances of rendering correctly even when other UI components fail.
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft as ArrowLeftIcon,
  RefreshCw as RefreshCwIcon,
  Monitor as MonitorIcon,
  Brush as BrushIcon,
  Trash2 as TrashIcon,
  Globe as GlobeIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from 'lucide-react';

export default function BlackScreenHelpPage() {
  // Function to clear local storage
  const handleClearLocalStorage = () => {
    localStorage.clear();
    alert('Local storage cleared successfully. The page will now reload.');
    window.location.reload();
  };

  // Function to clear cache (simulated)
  const handleClearCache = () => {
    // Show informational message since we can't directly clear browser cache
    alert('To clear your browser cache: \n\n' +
      '1. Open browser settings\n' +
      '2. Go to Privacy & Security\n' +
      '3. Click "Clear browsing data"\n' +
      '4. Select "Cached images and files"\n' +
      '5. Click "Clear data"\n\n' +
      'After clearing your cache, please reload this page.');
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Simple header that's unlikely to cause rendering issues */}
      <header className="py-4 px-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-medium flex items-center">
            <MonitorIcon className="mr-2 h-5 w-5" />
            Display Troubleshooting
          </h1>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-1">
              <ArrowLeftIcon className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                This page uses minimal styling and JavaScript to maximize compatibility with browser issues. 
                If you're seeing this page correctly but experiencing problems with the main application, 
                try the troubleshooting steps below.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-6">Common Solutions for Display Issues</h2>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-5">
              <h3 className="flex items-center text-lg font-medium mb-3">
                <RefreshCwIcon className="h-5 w-5 mr-2 text-green-600" />
                Reload the Application
              </h3>
              <p className="text-gray-700 mb-4">
                The simplest fix is often to reload the page, which can resolve temporary glitches.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="gap-1"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Reload Now
              </Button>
            </div>

            <div className="border rounded-lg p-5">
              <h3 className="flex items-center text-lg font-medium mb-3">
                <TrashIcon className="h-5 w-5 mr-2 text-amber-600" />
                Clear Local Storage
              </h3>
              <p className="text-gray-700 mb-4">
                Clearing the application's stored data can fix issues caused by corrupted settings.
                This will reset your preferences but won't delete any important data.
              </p>
              <Button 
                onClick={handleClearLocalStorage} 
                variant="outline"
                className="gap-1"
              >
                <TrashIcon className="h-4 w-4" />
                Clear Local Storage
              </Button>
            </div>

            <div className="border rounded-lg p-5">
              <h3 className="flex items-center text-lg font-medium mb-3">
                <BrushIcon className="h-5 w-5 mr-2 text-purple-600" />
                Clear Browser Cache
              </h3>
              <p className="text-gray-700 mb-4">
                If you're seeing older versions of the application or styles aren't loading correctly,
                clearing your browser cache can help.
              </p>
              <Button 
                onClick={handleClearCache} 
                variant="outline"
                className="gap-1"
              >
                <BrushIcon className="h-4 w-4" />
                How to Clear Cache
              </Button>
            </div>

            <div className="border rounded-lg p-5">
              <h3 className="flex items-center text-lg font-medium mb-3">
                <GlobeIcon className="h-5 w-5 mr-2 text-blue-600" />
                Try a Different Browser
              </h3>
              <p className="text-gray-700 mb-4">
                If issues persist, try accessing the application in a different web browser.
                We recommend Chrome, Firefox, or Edge for the best experience.
              </p>
            </div>

            <div className="border rounded-lg p-5">
              <h3 className="flex items-center text-lg font-medium mb-3">
                <SettingsIcon className="h-5 w-5 mr-2 text-gray-600" />
                Check Device Settings
              </h3>
              <p className="text-gray-700">
                Ensure your device has:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
                <li>JavaScript enabled</li>
                <li>Cookies enabled</li>
                <li>No content blockers preventing our application</li>
                <li>Updated graphics drivers (for 3D map visualizations)</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t">
            <h3 className="text-lg font-medium mb-4">Still Having Issues?</h3>
            <p className="text-gray-700 mb-5">
              If none of these solutions resolve your display problems, please contact our support team
              with details about your device, browser, and the specific issues you're experiencing.
            </p>
            <Link href="/help">
              <Button variant="default" className="gap-2">
                Visit Help Center
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-4 px-6 border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Real Estate Intelligence Platform • Technical Support
        </div>
      </footer>
    </div>
  );
}