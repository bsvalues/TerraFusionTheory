/**
 * NotFoundPage
 * 
 * Custom 404 page for routes that don't exist
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Home as HomeIcon,
  Search as SearchIcon,
  HelpCircle as HelpCircleIcon,
  MapPin as MapPinIcon,
  Calculator as CalculatorIcon
} from 'lucide-react';
import Footer from '@/components/layout/Footer';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 container max-w-5xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="text-9xl font-bold text-primary/10">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <SearchIcon className="h-16 w-16 text-primary/70" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find the page you're looking for. The page may have been moved, 
            deleted, or may never have existed.
          </p>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              <Link href="/">
                <Button className="gap-2">
                  <HomeIcon className="h-4 w-4" />
                  Return Home
                </Button>
              </Link>
              <Link href="/help">
                <Button variant="outline" className="gap-2">
                  <HelpCircleIcon className="h-4 w-4" />
                  Help Center
                </Button>
              </Link>
            </div>
            
            <div className="bg-muted/40 rounded-lg p-6">
              <h2 className="font-medium text-lg mb-3">Popular Destinations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 hover:bg-background/90"
                  >
                    <MapPinIcon className="h-4 w-4 text-primary" />
                    Property Map
                  </Button>
                </Link>
                <Link href="/valuation">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 hover:bg-background/90"
                  >
                    <CalculatorIcon className="h-4 w-4 text-primary" />
                    Property Valuation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}