/**
 * HelpCenterPage
 * 
 * Comprehensive help center with searchable documentation,
 * FAQs, and troubleshooting guides.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import Footer from '@/components/layout/Footer';
import { 
  ArrowLeft as ArrowLeftIcon,
  Search as SearchIcon,
  HelpCircle as HelpCircleIcon,
  Book as BookIcon,
  FileQuestion as FileQuestionIcon,
  Settings2 as Settings2Icon,
  MapPin as MapPinIcon,
  Calculator as CalculatorIcon,
  BarChart3 as BarChart3Icon,
  Map as MapIcon,
  Home as HomeIcon,
  Lightbulb as LightbulbIcon,
  Sparkle as SparkleIcon
} from 'lucide-react';

// Help content structure
interface HelpTopic {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  keywords: string[];
}

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  topics: HelpTopic[];
}

// Define help categories and topics
const helpCategories: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of using the Real Estate Intelligence Platform',
    icon: <SparkleIcon className="h-5 w-5" />,
    topics: [
      {
        id: 'platform-overview',
        title: 'Platform Overview',
        keywords: ['overview', 'introduction', 'basics', 'tutorial'],
        content: (
          <div className="space-y-4">
            <p>
              Welcome to the Real Estate Intelligence Platform, your comprehensive solution for real estate analytics,
              valuation, and market insights powered by advanced AI and geospatial technologies.
            </p>
            <div className="rounded-md bg-muted p-4">
              <h4 className="font-medium mb-2">Key Features:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Interactive property maps with advanced filtering</li>
                <li>AI-powered property valuation tools</li>
                <li>Real-time market analytics and trend predictions</li>
                <li>Comprehensive property data with aerial imagery</li>
                <li>Customizable reports and data visualization</li>
              </ul>
            </div>
            <p>
              The platform is organized into several main sections, accessible from the main navigation:
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <MapIcon className="h-4 w-4 mr-2 text-primary" />
                    Property Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualize properties across regions with customizable layers and filters.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <CalculatorIcon className="h-4 w-4 mr-2 text-primary" />
                    Valuation Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get accurate property valuations using our AI-powered analysis engine.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <BarChart3Icon className="h-4 w-4 mr-2 text-primary" />
                    Market Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Explore market trends, price movements, and future predictions.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <LightbulbIcon className="h-4 w-4 mr-2 text-primary" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Discover opportunities and risks using our advanced AI analysis.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      },
      {
        id: 'navigating-the-platform',
        title: 'Navigating the Platform',
        keywords: ['navigation', 'menu', 'interface', 'layout'],
        content: (
          <div className="space-y-4">
            <p>
              The Real Estate Intelligence Platform features an intuitive, user-friendly interface designed to help you quickly access the information and tools you need.
            </p>
            
            <h4 className="font-medium mt-6 mb-2">Main Navigation</h4>
            <p>The main navigation bar at the top of the screen provides access to:</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><strong>Dashboard:</strong> Your personalized overview with key metrics and recent activities</li>
              <li><strong>Property Map:</strong> Interactive geospatial visualization of properties</li>
              <li><strong>Valuation Tools:</strong> AI-powered property valuation capabilities</li>
              <li><strong>Market Analytics:</strong> Comprehensive market data and trend analysis</li>
              <li><strong>Reports:</strong> Generate and access customized property and market reports</li>
            </ul>
            
            <h4 className="font-medium mt-6 mb-2">Common Page Elements</h4>
            <p>Throughout the platform, you'll find these consistent UI elements:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Filter Panels:</strong> Refine data using customizable filters</li>
              <li><strong>Data Cards:</strong> Concise information displays with key metrics</li>
              <li><strong>Action Buttons:</strong> Perform common tasks like saving, sharing or exporting</li>
              <li><strong>Context Help:</strong> Look for the <HelpCircleIcon className="h-3 w-3 inline mx-1" /> icon for contextual help</li>
            </ul>
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <LightbulbIcon className="h-4 w-4 mr-2 text-yellow-500" />
                Pro Tips:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use keyboard shortcuts (press <kbd className="px-1.5 py-0.5 rounded border bg-background">?</kbd> to view all shortcuts)</li>
                <li>Customize your dashboard by dragging and rearranging widgets</li>
                <li>Save frequently used filters as presets for quick access</li>
                <li>Enable notifications to stay updated on market changes</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'interactive-tutorial',
        title: 'Interactive Tutorial',
        keywords: ['tutorial', 'guide', 'walkthrough', 'learning'],
        content: (
          <div className="space-y-4">
            <p>
              Our interactive tutorial provides a step-by-step introduction to the platform's features and capabilities.
              The tutorial is designed to help both new users and experienced professionals get the most out of our tools.
            </p>
            
            <h4 className="font-medium mt-4 mb-2">Starting the Tutorial</h4>
            <p>
              You can access the interactive tutorial at any time by clicking the tutorial button located in the 
              bottom-right corner of the screen. The tutorial is context-aware and will adapt based on which section 
              of the application you're currently using.
            </p>
            
            <div className="bg-muted rounded-lg p-4 my-4">
              <h5 className="font-medium mb-2">Tutorial Features:</h5>
              <ul className="list-disc pl-5 space-y-1">
                <li>Interactive step-by-step guidance</li>
                <li>Contextual explanations of features</li>
                <li>Practice exercises with real data</li>
                <li>Progress tracking across sessions</li>
                <li>Advanced tutorials for power users</li>
              </ul>
            </div>
            
            <h4 className="font-medium mt-6 mb-2">Tutorial Modules</h4>
            <p>Our comprehensive tutorial is divided into several modules:</p>
            
            <div className="grid gap-3 sm:grid-cols-2 mt-3">
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Basic Navigation</h5>
                <p className="text-xs text-muted-foreground">Learn the interface layout and basic navigation</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Property Mapping</h5>
                <p className="text-xs text-muted-foreground">Master the interactive map and spatial tools</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Valuation Tools</h5>
                <p className="text-xs text-muted-foreground">Use AI-powered property valuation features</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Market Analysis</h5>
                <p className="text-xs text-muted-foreground">Analyze trends and market conditions</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Report Generation</h5>
                <p className="text-xs text-muted-foreground">Create custom reports and visualizations</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Advanced Features</h5>
                <p className="text-xs text-muted-foreground">Explore power-user tools and capabilities</p>
              </div>
            </div>
            
            <div className="mt-6">
              <Button className="gap-2">
                <SparkleIcon className="h-4 w-4" />
                Start Interactive Tutorial
              </Button>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'map-features',
    title: 'Interactive Map',
    description: 'Learn how to use our advanced mapping tools',
    icon: <MapIcon className="h-5 w-5" />,
    topics: [
      {
        id: 'map-navigation',
        title: 'Map Navigation & Controls',
        keywords: ['map', 'navigation', 'zoom', 'pan', 'controls'],
        content: (
          <div className="space-y-4">
            <p>
              Our interactive map provides powerful geospatial visualization tools with an intuitive interface
              for exploring properties and market data.
            </p>
            
            <h4 className="font-medium mt-4 mb-2">Basic Map Controls</h4>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 mb-6">
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Pan</h5>
                <p className="text-xs text-muted-foreground">Click and drag to move the map</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Zoom</h5>
                <p className="text-xs text-muted-foreground">Scroll wheel or use the +/- buttons</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Reset View</h5>
                <p className="text-xs text-muted-foreground">Click the compass icon to reset</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Search</h5>
                <p className="text-xs text-muted-foreground">Enter address or coordinates</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Measure</h5>
                <p className="text-xs text-muted-foreground">Calculate distances and areas</p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Full Screen</h5>
                <p className="text-xs text-muted-foreground">Expand map to fill the screen</p>
              </div>
            </div>
            
            <h4 className="font-medium mt-6 mb-2">Map Layers</h4>
            <p>
              Toggle different data layers to visualize various aspects of properties and market conditions:
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><strong>Property Markers:</strong> Individual properties with customizable icons</li>
              <li><strong>Heat Maps:</strong> Density visualizations of property values, sales activity, etc.</li>
              <li><strong>Boundary Layers:</strong> Display neighborhoods, school districts, flood zones, etc.</li>
              <li><strong>Satellite Imagery:</strong> High-resolution aerial photography</li>
              <li><strong>Street View:</strong> 360° ground-level imagery where available</li>
            </ul>
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <LightbulbIcon className="h-4 w-4 mr-2 text-yellow-500" />
                Pro Tips:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Hold <kbd className="px-1.5 py-0.5 rounded border bg-background">Shift</kbd> while drawing to create perfect circles or squares</li>
                <li>Save your custom map views to quickly return to areas of interest</li>
                <li>Use split screen to compare different map layers side by side</li>
                <li>Export map views as high-resolution images for reports</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'property-filtering',
        title: 'Property Filtering & Search',
        keywords: ['filter', 'search', 'property', 'criteria', 'find'],
        content: (
          <div className="space-y-4">
            <p>
              Our advanced filtering system allows you to quickly narrow down properties based on specific criteria
              and find exactly what you're looking for.
            </p>
            
            <h4 className="font-medium mt-4 mb-2">Filter Categories</h4>
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Basic Filters</h5>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                  <li>Property type (residential, commercial, etc.)</li>
                  <li>Price range</li>
                  <li>Square footage</li>
                  <li>Number of bedrooms/bathrooms</li>
                  <li>Year built</li>
                </ul>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Location Filters</h5>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                  <li>Distance from a point</li>
                  <li>Neighborhood/district</li>
                  <li>School district</li>
                  <li>Flood zone</li>
                  <li>Walk score</li>
                </ul>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Market Filters</h5>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                  <li>Days on market</li>
                  <li>Price change percentage</li>
                  <li>Historical sale data</li>
                  <li>Market trend indicators</li>
                  <li>Appreciation rate</li>
                </ul>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Advanced Filters</h5>
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                  <li>Property features (pool, garage, etc.)</li>
                  <li>Tax assessment value</li>
                  <li>Investment potential score</li>
                  <li>Predicted appreciation</li>
                  <li>Custom AI-generated criteria</li>
                </ul>
              </div>
            </div>
            
            <h4 className="font-medium mt-6 mb-2">Search Tools</h4>
            <p>
              Beyond filters, you can use our specialized search tools:
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><strong>Address Search:</strong> Find specific properties by address</li>
              <li><strong>Draw Tool:</strong> Define custom search areas by drawing on the map</li>
              <li><strong>Similar Property Search:</strong> Find properties similar to a selected one</li>
              <li><strong>Natural Language Search:</strong> Describe what you're looking for in plain English</li>
            </ul>
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <LightbulbIcon className="h-4 w-4 mr-2 text-yellow-500" />
                Pro Tips:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Save complex filter combinations as presets for quick access</li>
                <li>Create alerts for when new properties match your criteria</li>
                <li>Export filtered property lists to CSV or PDF</li>
                <li>Use the comparison tool to evaluate multiple filtered sets</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'valuation-tools',
    title: 'Valuation Tools',
    description: 'Learn to use our AI-powered property valuation features',
    icon: <CalculatorIcon className="h-5 w-5" />,
    topics: [
      {
        id: 'property-valuation',
        title: 'Property Valuation Widget',
        keywords: ['valuation', 'estimate', 'pricing', 'appraisal', 'value'],
        content: (
          <div className="space-y-4">
            <p>
              Our Property Valuation Widget utilizes advanced AI algorithms and comprehensive market data
              to provide accurate property valuations with detailed supporting analysis.
            </p>
            
            <h4 className="font-medium mt-4 mb-2">Using the Valuation Widget</h4>
            <ol className="list-decimal pl-5 space-y-2 mb-4">
              <li>
                <strong>Enter Property Details:</strong> Provide basic information such as address, property type, 
                square footage, bedrooms, and bathrooms. The more details you provide, the more accurate your valuation.
              </li>
              <li>
                <strong>Add Property Features:</strong> Include information about special features like renovations, 
                pools, views, or other amenities that might affect the property's value.
              </li>
              <li>
                <strong>Select Comps Method:</strong> Choose between automated comp selection or manually select 
                comparable properties for the valuation.
              </li>
              <li>
                <strong>Review Results:</strong> Examine the valuation result, confidence score, and supporting data 
                that explains how the valuation was calculated.
              </li>
            </ol>
            
            <h4 className="font-medium mt-6 mb-2">Understanding Valuation Results</h4>
            <p>
              The valuation results include:
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><strong>Estimated Value Range:</strong> The probable value range with confidence intervals</li>
              <li><strong>Comparable Properties:</strong> Similar properties used in the valuation</li>
              <li><strong>Value Factors:</strong> Specific features that positively or negatively impact value</li>
              <li><strong>Market Context:</strong> Current market conditions affecting the valuation</li>
              <li><strong>Historical Trends:</strong> Value changes over time and future projections</li>
            </ul>
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <LightbulbIcon className="h-4 w-4 mr-2 text-yellow-500" />
                Pro Tips:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Upload property photos to improve valuation accuracy</li>
                <li>Save valuations to track changes over time</li>
                <li>Compare different valuation methods (AVM, comps-based, etc.)</li>
                <li>Generate professional valuation reports for clients or lenders</li>
                <li>Use the "What If" scenario tool to see how improvements might affect value</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'trend-prediction',
        title: 'Trend Prediction & Forecasting',
        keywords: ['prediction', 'forecast', 'trends', 'future', 'appreciation'],
        content: (
          <div className="space-y-4">
            <p>
              Our Trend Prediction system leverages machine learning and historical data analysis to forecast
              property values, market movements, and investment opportunities.
            </p>
            
            <h4 className="font-medium mt-4 mb-2">Prediction Features</h4>
            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Property Value Forecasting</h5>
                <p className="text-xs text-muted-foreground">
                  Projected value changes for specific properties over customizable time periods
                </p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Market Trend Analysis</h5>
                <p className="text-xs text-muted-foreground">
                  Broader market movement predictions with confidence intervals
                </p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Neighborhood Hotspot Detection</h5>
                <p className="text-xs text-muted-foreground">
                  Identification of areas likely to see rapid appreciation
                </p>
              </div>
              <div className="border rounded-md p-3">
                <h5 className="font-medium text-sm mb-1">Risk Assessment</h5>
                <p className="text-xs text-muted-foreground">
                  Evaluation of market volatility and investment risk factors
                </p>
              </div>
            </div>
            
            <h4 className="font-medium mt-6 mb-2">Understanding the Prediction Models</h4>
            <p>
              Our prediction system uses multiple AI models:
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><strong>Time Series Analysis:</strong> Examines historical patterns and cyclical trends</li>
              <li><strong>Regression Models:</strong> Identifies relationships between various market factors</li>
              <li><strong>Machine Learning:</strong> Adapts to changing market conditions and learns from outcomes</li>
              <li><strong>Sentiment Analysis:</strong> Incorporates market sentiment from news and social media</li>
            </ul>
            
            <h4 className="font-medium mt-6 mb-2">Interpreting Prediction Results</h4>
            <p>
              When reviewing predictions, consider these factors:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <strong>Confidence Score:</strong> Higher scores indicate greater certainty in the prediction
              </li>
              <li>
                <strong>Prediction Range:</strong> The range shows potential variance in outcomes
              </li>
              <li>
                <strong>Contributing Factors:</strong> The key variables driving the prediction
              </li>
              <li>
                <strong>Sensitivity Analysis:</strong> How changes in different factors affect the prediction
              </li>
            </ul>
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <LightbulbIcon className="h-4 w-4 mr-2 text-yellow-500" />
                Pro Tips:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Compare multiple prediction scenarios with different assumptions</li>
                <li>Set up alerts for when predictions change significantly</li>
                <li>Use the backtesting tool to check prediction accuracy against historical data</li>
                <li>Combine prediction data with investment return calculators for ROI analysis</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Solutions for common issues and technical problems',
    icon: <Settings2Icon className="h-5 w-5" />,
    topics: [
      {
        id: 'common-issues',
        title: 'Common Issues & Solutions',
        keywords: ['problems', 'issues', 'errors', 'troubleshoot', 'fix'],
        content: (
          <div className="space-y-4">
            <p>
              This guide covers solutions for common issues you might encounter while using the platform.
              If you can't find a solution here, please contact our support team.
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Map doesn't load or displays incorrectly</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">Try these solutions:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Refresh the page</li>
                      <li>Clear your browser cache</li>
                      <li>Check your internet connection</li>
                      <li>Disable browser extensions that might interfere with maps</li>
                      <li>Ensure WebGL is enabled in your browser</li>
                    </ol>
                    <p className="text-sm mt-2">
                      If the issue persists, try using a different browser or visit our 
                      <Link href="/fix-my-screen/help" className="text-primary ml-1 hover:underline">
                        display troubleshooting page
                      </Link>.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>Search results aren't loading</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">If search results aren't appearing:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Verify your search criteria isn't too restrictive</li>
                      <li>Check that you're connected to the internet</li>
                      <li>Clear filters and try a broader search</li>
                      <li>Restart your browser</li>
                    </ol>
                    <p className="text-sm text-muted-foreground mt-2">
                      Note: Very specific combinations of filters might result in no matching properties.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>Property valuation tool isn't working</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">Try these solutions:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Ensure all required fields are completed correctly</li>
                      <li>Verify the address is formatted properly</li>
                      <li>Check that your account has valuation permissions</li>
                      <li>Try using a different property address</li>
                    </ol>
                    <p className="text-sm mt-2">
                      Some properties may not have sufficient data for accurate valuation. Try adding more property details or using a different valuation method.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>Reports won't generate or download</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">If you're having issues with reports:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Ensure your browser allows pop-ups from our site</li>
                      <li>Check that you have sufficient permissions for report generation</li>
                      <li>Verify you have a PDF viewer installed</li>
                      <li>Try generating a smaller report with fewer elements</li>
                    </ol>
                    <p className="text-sm mt-2">
                      Large reports with many high-resolution images may take longer to generate. Please be patient or try reducing the report complexity.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>Account or login issues</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">For account-related problems:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Try resetting your password</li>
                      <li>Clear browser cookies</li>
                      <li>Ensure your account hasn't been locked due to too many failed login attempts</li>
                      <li>Verify your subscription status is active</li>
                      <li>Check that you're using the correct email address</li>
                    </ol>
                    <p className="text-sm mt-2">
                      If you continue to have problems, please contact our support team for assistance.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="rounded-md bg-muted p-4 mt-6">
              <h4 className="font-medium mb-2 flex items-center">
                <LightbulbIcon className="h-4 w-4 mr-2 text-yellow-500" />
                General Troubleshooting Tips:
              </h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Refresh the page or restart your browser</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try using a different browser</li>
                <li>Check your internet connection</li>
                <li>Disable browser extensions that might interfere</li>
                <li>Ensure your browser is updated to the latest version</li>
              </ol>
            </div>
            
            <div className="mt-6 border-t pt-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Still having issues? Our support team is here to help.
              </p>
              <Button className="gap-2">
                Contact Support
              </Button>
            </div>
          </div>
        )
      },
      {
        id: 'display-issues',
        title: 'Display & Rendering Problems',
        keywords: ['screen', 'display', 'rendering', 'black screen', 'blank'],
        content: (
          <div className="space-y-4">
            <p>
              If you're experiencing display issues such as blank screens, layout problems, 
              or map rendering errors, follow these troubleshooting steps.
            </p>
            
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4 mt-2 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <HelpCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    For serious display issues, visit our 
                    <Link href="/fix-my-screen/help" className="text-blue-600 font-medium ml-1 hover:underline">
                      dedicated troubleshooting page
                    </Link>
                    , which is designed to work even when other elements fail to load.
                  </p>
                </div>
              </div>
            </div>
            
            <h4 className="font-medium mt-6 mb-3">Common Display Issues</h4>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Blank or white screen</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">If you see a blank white screen:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Refresh the page (try hard refresh with Ctrl+F5)</li>
                      <li>Clear browser cache and cookies</li>
                      <li>Disable browser extensions, especially ad blockers</li>
                      <li>Try a different browser</li>
                      <li>Clear local storage (visit /fix-my-screen/help)</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>Map rendering problems</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">For map display issues:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Ensure WebGL is enabled in your browser</li>
                      <li>Update your graphics drivers</li>
                      <li>Try disabling hardware acceleration in your browser</li>
                      <li>Reduce the number of active map layers</li>
                      <li>Try the 2D map view instead of 3D</li>
                    </ol>
                    <p className="text-sm text-muted-foreground mt-2">
                      Note: Advanced 3D maps require a moderately powerful graphics card and updated drivers.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>Layout or styling issues</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">If elements appear misaligned or unstyled:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Refresh the page</li>
                      <li>Clear browser cache (CSS files might be cached)</li>
                      <li>Try resizing the browser window</li>
                      <li>Check if your browser is up to date</li>
                      <li>Disable custom themes or extensions that modify page styles</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>Images not loading</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">If property images or icons aren't displaying:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Check your internet connection</li>
                      <li>Ensure your browser isn't blocking images</li>
                      <li>Clear browser cache</li>
                      <li>Try loading a different property</li>
                      <li>Verify that content blockers aren't preventing image loading</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>Performance issues (slow loading)</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p className="text-sm">If the application is running slowly:</p>
                    <ol className="list-decimal pl-5 text-sm space-y-1">
                      <li>Close other browser tabs and applications</li>
                      <li>Reduce the number of active map layers and filters</li>
                      <li>Try using the "lite" version of the map</li>
                      <li>Disable browser extensions</li>
                      <li>Clear browser cache and temporary files</li>
                    </ol>
                    <p className="text-sm text-muted-foreground mt-2">
                      Complex visualizations with many properties can be resource-intensive. Consider narrowing your search area if performance is an issue.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <h4 className="font-medium mt-6 mb-3">Browser Compatibility</h4>
            <p className="text-sm">
              Our platform is optimized for these browsers:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
              <li>Google Chrome (recommended) - version 90+</li>
              <li>Mozilla Firefox - version 88+</li>
              <li>Microsoft Edge - version 90+</li>
              <li>Safari - version 14+</li>
            </ul>
            
            <div className="rounded-md bg-muted p-4 mt-4">
              <h4 className="font-medium mb-2 flex items-center">
                <LightbulbIcon className="h-4 w-4 mr-2 text-yellow-500" />
                System Requirements:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>At least 8GB RAM recommended for optimal performance</li>
                <li>Updated graphics drivers for 3D map visualizations</li>
                <li>Stable internet connection (5+ Mbps recommended)</li>
                <li>JavaScript and cookies enabled</li>
                <li>WebGL support for map rendering</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'faqs',
    title: 'FAQs',
    description: 'Answers to frequently asked questions',
    icon: <FileQuestionIcon className="h-5 w-5" />,
    topics: [
      {
        id: 'general-faqs',
        title: 'General Questions',
        keywords: ['faq', 'questions', 'general', 'common'],
        content: (
          <div className="space-y-4">
            <p>
              Here are answers to the most common questions about our Real Estate Intelligence Platform.
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How accurate are the property valuations?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    Our property valuations typically have an accuracy range of 3-7% compared to actual sale prices in most markets. 
                    The accuracy depends on several factors including data availability, market volatility, and property uniqueness. 
                    Each valuation includes a confidence score to indicate the expected accuracy level.
                  </p>
                  <p className="text-sm mt-2">
                    For the most accurate results, we recommend providing detailed property information and reviewing the comparable 
                    properties used in the valuation. You can also manually select comparable properties if you have specific knowledge 
                    about the local market.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger>How frequently is property data updated?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    Our data update frequency varies by region and data source:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                    <li>Property listings: Updated daily</li>
                    <li>Sales data: Updated weekly in most areas</li>
                    <li>Tax assessment data: Updated quarterly or as released by municipalities</li>
                    <li>Market trends: Updated weekly</li>
                    <li>Aerial imagery: Updated annually or as new imagery becomes available</li>
                  </ul>
                  <p className="text-sm mt-2">
                    You can see the last update date for specific data in the information panel for each property or data layer.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger>Can I export data for use in other applications?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    Yes, you can export data in several formats:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                    <li>Property lists can be exported to CSV, Excel, or PDF</li>
                    <li>Maps can be exported as high-resolution images (PNG, JPEG)</li>
                    <li>Reports can be generated as PDFs</li>
                    <li>Market data can be exported to CSV or Excel</li>
                    <li>GIS data can be exported in various formats including GeoJSON and Shapefile</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Look for the export or download button in each tool's interface. Export capabilities may vary based on your account type.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger>How do I interpret the market trend predictions?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    Our market trend predictions use AI and statistical models to forecast future market conditions. Key elements to understand:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                    <li><strong>Prediction Range:</strong> Shows the high and low potential outcomes</li>
                    <li><strong>Confidence Score:</strong> Indicates the statistical reliability of the prediction</li>
                    <li><strong>Contributing Factors:</strong> Lists the market variables most influencing the prediction</li>
                    <li><strong>Historical Accuracy:</strong> Shows how well previous predictions matched actual outcomes</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Remember that predictions are based on current data and trends. Unexpected economic events or policy changes can affect accuracy.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger>What GIS data sources are used in the platform?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    Our platform integrates multiple GIS data sources including:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                    <li>Government parcel and tax assessment data</li>
                    <li>FEMA flood maps and environmental data</li>
                    <li>Census demographic information</li>
                    <li>School district boundaries</li>
                    <li>Transportation infrastructure</li>
                    <li>Zoning information</li>
                    <li>Commercial satellite and aerial imagery</li>
                    <li>OpenStreetMap and other open source GIS resources</li>
                  </ul>
                  <p className="text-sm mt-2">
                    We maintain partnerships with leading data providers to ensure comprehensive and current geospatial information.
                  </p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6">
                <AccordionTrigger>How secure is my data on the platform?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm">
                    We implement comprehensive security measures to protect your data:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                    <li>End-to-end encryption for all data transfers</li>
                    <li>Multi-factor authentication options</li>
                    <li>Role-based access controls</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Compliance with industry security standards</li>
                    <li>Regular data backups with secure storage</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Your search history, saved properties, and custom reports are only accessible to your account. 
                    We do not sell personal user data to third parties.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-3">Have a different question?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                If you couldn't find the answer you were looking for, you can:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <SearchIcon className="h-4 w-4" />
                  Search All FAQs
                </Button>
                <Button className="gap-2">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Technical documentation and API references',
    icon: <BookIcon className="h-5 w-5" />,
    topics: [
      {
        id: 'api-docs',
        title: 'API Documentation',
        keywords: ['api', 'developer', 'integration', 'endpoints'],
        content: (
          <div className="space-y-4">
            <p>
              Our platform offers a comprehensive API for developers to integrate real estate
              data and analytics into their own applications.
            </p>
            
            <div className="rounded-md bg-muted p-4 mb-6">
              <h4 className="font-medium mb-2">API Quick Links:</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <a href="#" className="text-sm text-primary hover:underline flex items-center">
                  <FileQuestionIcon className="h-3.5 w-3.5 mr-1.5" />
                  API Overview & Getting Started
                </a>
                <a href="#" className="text-sm text-primary hover:underline flex items-center">
                  <FileQuestionIcon className="h-3.5 w-3.5 mr-1.5" />
                  Authentication Guide
                </a>
                <a href="#" className="text-sm text-primary hover:underline flex items-center">
                  <FileQuestionIcon className="h-3.5 w-3.5 mr-1.5" />
                  Endpoint Reference
                </a>
                <a href="#" className="text-sm text-primary hover:underline flex items-center">
                  <FileQuestionIcon className="h-3.5 w-3.5 mr-1.5" />
                  Rate Limits & Usage
                </a>
                <a href="#" className="text-sm text-primary hover:underline flex items-center">
                  <FileQuestionIcon className="h-3.5 w-3.5 mr-1.5" />
                  Example Implementations
                </a>
                <a href="#" className="text-sm text-primary hover:underline flex items-center">
                  <FileQuestionIcon className="h-3.5 w-3.5 mr-1.5" />
                  SDK Documentation
                </a>
              </div>
            </div>
            
            <h4 className="font-medium mt-6 mb-3">API Overview</h4>
            <p className="text-sm">
              Our RESTful API provides access to property data, market analytics, valuations, 
              and geospatial information. The API uses standard HTTP methods and returns responses 
              in JSON format.
            </p>
            
            <div className="mt-4 font-mono text-xs bg-black text-green-400 p-4 rounded-md overflow-x-auto">
              <pre>
                {`// Example API Request
fetch('https://api.real-estate-intelligence.com/v1/properties', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}
              </pre>
            </div>
            
            <h4 className="font-medium mt-6 mb-3">Available Endpoints</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left font-medium">Endpoint</th>
                    <th className="py-2 px-3 text-left font-medium">Description</th>
                    <th className="py-2 px-3 text-left font-medium">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">/v1/properties</td>
                    <td className="py-2 px-3">List and search properties</td>
                    <td className="py-2 px-3 font-mono text-xs">GET, POST</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">/v1/properties/{`{id}`}</td>
                    <td className="py-2 px-3">Get property details</td>
                    <td className="py-2 px-3 font-mono text-xs">GET</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">/v1/market/trends</td>
                    <td className="py-2 px-3">Get market trend data</td>
                    <td className="py-2 px-3 font-mono text-xs">GET</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">/v1/valuation</td>
                    <td className="py-2 px-3">Property valuation</td>
                    <td className="py-2 px-3 font-mono text-xs">POST</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">/v1/geo/search</td>
                    <td className="py-2 px-3">Geospatial search</td>
                    <td className="py-2 px-3 font-mono text-xs">POST</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="rounded-md bg-muted p-4 mt-6">
              <h4 className="font-medium mb-2 flex items-center">
                <LightbulbIcon className="h-4 w-4 mr-2 text-yellow-500" />
                Getting Started with the API:
              </h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Generate an API key in your account settings</li>
                <li>Review the authentication documentation</li>
                <li>Test endpoints using our interactive API explorer</li>
                <li>Check out our example implementations and SDKs</li>
                <li>Start with small request volumes and observe rate limits</li>
              </ol>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6">
              For complete API documentation, code examples, and SDK references, visit our 
              <a href="#" className="text-primary ml-1 hover:underline">developer portal</a>.
            </p>
          </div>
        )
      }
    ]
  },
];

export default function HelpCenterPage() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const { categoryId, topicId } = params;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTopics, setFilteredTopics] = useState<HelpTopic[]>([]);
  const [activeTab, setActiveTab] = useState(categoryId || 'getting-started');
  const [activeTopic, setActiveTopic] = useState(topicId || (categoryId ? helpCategories.find(c => c.id === categoryId)?.topics[0]?.id : 'platform-overview'));
  
  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTopics([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results: HelpTopic[] = [];
    
    helpCategories.forEach(category => {
      category.topics.forEach(topic => {
        if (
          topic.title.toLowerCase().includes(query) || 
          topic.keywords.some(keyword => keyword.toLowerCase().includes(query))
        ) {
          results.push(topic);
        }
      });
    });
    
    setFilteredTopics(results);
  }, [searchQuery]);
  
  // Update URL when tab or topic changes
  useEffect(() => {
    if (activeTab && activeTopic) {
      setLocation(`/help/topics/${activeTab}/${activeTopic}`, { replace: true });
    }
  }, [activeTab, activeTopic, setLocation]);
  
  // Set active tab and topic based on URL params
  useEffect(() => {
    if (categoryId) {
      setActiveTab(categoryId);
      
      // If no topic specified, use first topic in category
      if (!topicId && helpCategories.find(c => c.id === categoryId)) {
        const firstTopicInCategory = helpCategories.find(c => c.id === categoryId)?.topics[0]?.id;
        if (firstTopicInCategory) {
          setActiveTopic(firstTopicInCategory);
        }
      } else if (topicId) {
        setActiveTopic(topicId);
      }
    }
  }, [categoryId, topicId]);
  
  // Get current category
  const currentCategory = helpCategories.find(category => category.id === activeTab);
  
  // Get current topic content
  const getCurrentTopicContent = () => {
    if (!activeTopic) return null;
    
    const allTopics = helpCategories.flatMap(category => category.topics);
    const currentTopic = allTopics.find(topic => topic.id === activeTopic);
    
    return currentTopic?.content || null;
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <HomeIcon className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold flex items-center">
                <HelpCircleIcon className="h-6 w-6 mr-2 text-primary" />
                Help Center
              </h1>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeftIcon className="h-4 w-4" />
                Return to App
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <div className="container py-6">
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search help topics..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {filteredTopics.length > 0 && (
            <div className="mt-2 rounded-md border bg-card shadow-sm">
              <div className="p-2">
                <p className="text-sm text-muted-foreground px-2 py-1">
                  {filteredTopics.length} result{filteredTopics.length !== 1 ? 's' : ''}
                </p>
                <ul className="divide-y">
                  {filteredTopics.map(topic => {
                    // Find which category this topic belongs to
                    const parentCategory = helpCategories.find(category => 
                      category.topics.some(t => t.id === topic.id)
                    );
                    
                    return (
                      <li key={topic.id}>
                        <button 
                          className="w-full px-3 py-2 text-left hover:bg-muted rounded-sm text-sm flex items-start"
                          onClick={() => {
                            if (parentCategory) {
                              setActiveTab(parentCategory.id);
                              setActiveTopic(topic.id);
                              setSearchQuery('');
                            }
                          }}
                        >
                          <span className="font-medium">{topic.title}</span>
                          {parentCategory && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              in {parentCategory.title}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      
        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex border-b">
              <div className="p-1.5 overflow-x-auto">
                <TabsList className="bg-transparent h-auto p-0 space-x-2">
                  {helpCategories.map(category => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      className="py-2 px-3 data-[state=active]:bg-muted"
                    >
                      <span className="flex items-center gap-1.5">
                        {category.icon}
                        {category.title}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>
            
            {helpCategories.map(category => (
              <TabsContent key={category.id} value={category.id} className="m-0">
                <div className="grid md:grid-cols-[250px_1fr]">
                  <div className="border-r bg-muted/40">
                    <ScrollArea className="h-[calc(100vh-250px)] md:h-auto">
                      <div className="p-4">
                        <h2 className="font-medium text-base mb-1">{category.title}</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                          {category.description}
                        </p>
                        <ul className="space-y-1">
                          {category.topics.map(topic => (
                            <li key={topic.id}>
                              <button
                                className={`
                                  w-full text-left rounded px-3 py-1.5 text-sm font-medium
                                  ${activeTopic === topic.id 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'hover:bg-muted text-foreground'
                                  }
                                `}
                                onClick={() => setActiveTopic(topic.id)}
                              >
                                {topic.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <div className="p-6 max-w-3xl">
                    <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                      {getCurrentTopicContent()}
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}