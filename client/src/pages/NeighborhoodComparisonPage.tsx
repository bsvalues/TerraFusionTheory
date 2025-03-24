/**
 * Neighborhood Comparison Page
 * 
 * This page displays the Neighborhood Comparison Wizard and allows users
 * to compare different neighborhoods across various metrics.
 */

import { useState } from 'react';
import { Building, Info } from 'lucide-react';
import NeighborhoodComparisonWizard from '@/components/neighborhood/NeighborhoodComparisonWizard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

const NeighborhoodComparisonPage = () => {
  const [wizardVisible, setWizardVisible] = useState(true);

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Building className="mr-2 h-8 w-8" />
            Neighborhood Comparison
          </h1>
          <p className="text-muted-foreground">
            Compare neighborhoods across multiple metrics to find your ideal location
          </p>
        </div>

        {wizardVisible ? (
          <div className="mt-2 mx-auto w-full">
            <NeighborhoodComparisonWizard 
              onClose={() => setWizardVisible(false)}
            />
          </div>
        ) : (
          <div className="flex justify-center mt-6">
            <Button 
              size="lg" 
              onClick={() => setWizardVisible(true)}
              className="gap-2"
            >
              <Building className="h-5 w-5" />
              Start Neighborhood Comparison
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Why Compare Neighborhoods?</CardTitle>
              <CardDescription>
                Make informed decisions about where to live or invest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Neighborhood comparison gives you a comprehensive view of how different areas stack up across 
                key factors that affect your quality of life and property value.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                    <span className="text-xs">✓</span>
                  </div>
                  <span>Find the best value for your budget</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                    <span className="text-xs">✓</span>
                  </div>
                  <span>Discover areas with the best schools</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                    <span className="text-xs">✓</span>
                  </div>
                  <span>Compare safety, amenities, and walkability</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                    <span className="text-xs">✓</span>
                  </div>
                  <span>Identify growing areas with investment potential</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Metrics Explained</CardTitle>
              <CardDescription>
                Understanding the data behind the comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="housing">
                  <AccordionTrigger className="text-sm font-medium">Housing & Value Metrics</AccordionTrigger>
                  <AccordionContent className="text-sm">
                    <p>
                      <strong>Median Home Price:</strong> The middle price point of all homes in the area.
                    </p>
                    <p>
                      <strong>Price per Sqft:</strong> The average cost per square foot, useful for comparing value.
                    </p>
                    <p>
                      <strong>Price Growth:</strong> Annual percentage increase in property values.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="quality">
                  <AccordionTrigger className="text-sm font-medium">Quality of Life Metrics</AccordionTrigger>
                  <AccordionContent className="text-sm">
                    <p>
                      <strong>Safety Score:</strong> Rating based on crime statistics and resident surveys.
                    </p>
                    <p>
                      <strong>Walkability:</strong> How easily you can reach amenities on foot.
                    </p>
                    <p>
                      <strong>Parks Access:</strong> Proximity and quality of green spaces and recreation areas.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="education">
                  <AccordionTrigger className="text-sm font-medium">Education Metrics</AccordionTrigger>
                  <AccordionContent className="text-sm">
                    <p>
                      <strong>School Rating:</strong> Quality of public schools based on test scores and other factors.
                    </p>
                    <p>
                      <strong>Student-Teacher Ratio:</strong> Average number of students per teacher.
                    </p>
                    <p>
                      <strong>College Readiness:</strong> How well local schools prepare students for higher education.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips for Comparison</CardTitle>
              <CardDescription>
                Getting the most from your neighborhood analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Prioritize Your Needs:</strong> Focus on the metrics that matter most to your lifestyle, 
                    such as schools for families or walkability for urban dwellers.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Consider Future Growth:</strong> Sometimes neighborhoods with moderate current scores 
                    but positive trends may be the best investment.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Explore Visually:</strong> Switch between different chart types to gain 
                    different perspectives on the same data.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Visit in Person:</strong> Use this tool to narrow down options, then 
                    visit neighborhoods to get a feel for the community.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodComparisonPage;