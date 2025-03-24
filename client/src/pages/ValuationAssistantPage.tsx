/**
 * Valuation Assistant Page
 * 
 * This page displays the AI-powered valuation assistant interface
 * for property valuation and real estate questions.
 */

import React from 'react';
import ValuationAssistant from '@/components/valuation/ValuationAssistant';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

/**
 * Page component for the AI-powered valuation assistant
 */
export default function ValuationAssistantPage() {
  return (
    <Layout title="AI Valuation Assistant" subtitle="Get instant property valuations and expert guidance">
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-card">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">
                AI-Powered Valuation Assistant
              </h2>
              <p className="text-muted-foreground mb-6">
                Our valuation assistant combines professional appraisal methodologies with advanced AI
                to provide accurate property valuations and answer your real estate questions.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex flex-col items-center p-4 bg-card border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                      <path d="M5 3v4"/>
                      <path d="M19 17v4"/>
                      <path d="M3 5h4"/>
                      <path d="M17 19h4"/>
                    </svg>
                  </div>
                  <h3 className="font-medium mb-1">Multiple Approaches</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Sales Comparison, Cost, Income, and Automated Valuation
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-card border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M7 7h.01"/>
                      <path d="M12 7h.01"/>
                      <path d="M17 7h.01"/>
                      <path d="M7 12h.01"/>
                      <path d="M12 12h.01"/>
                      <path d="M17 12h.01"/>
                      <path d="M7 17h.01"/>
                      <path d="M12 17h.01"/>
                      <path d="M17 17h.01"/>
                    </svg>
                  </div>
                  <h3 className="font-medium mb-1">Comprehensive Analysis</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Detailed property valuation with confidence scores
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-4 bg-card border rounded-lg">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <h3 className="font-medium mb-1">Professional Expertise</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Built on industry-standard appraisal methodologies
                  </p>
                </div>
              </div>
              
              <Separator className="my-8" />
              
              <ValuationAssistant />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}