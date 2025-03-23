/**
 * HelpCenterPage
 * 
 * Central hub for all help-related resources and documentation
 * for the IntelligentEstate platform.
 */

import React, { useState } from 'react';
import { Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LucideArrowLeft, 
  LucideHome, 
  LucideSearch,
  LucideBookOpen,
  LucideHelpCircle,
  LucideMonitor,
  LucideMapPin,
  LucideCalculator,
  LucideBarChart4,
  LucideGlobe,
  LucideUsers,
  LucideLightbulb,
  LucideCheckCircle,
  LucideFileText,
  LucideVideo
} from 'lucide-react';
import Footer from '@/components/layout/Footer';

// Define topic interface
interface HelpTopic {
  id: string;
  title: string;
  badge?: string;
  link?: string;
}

// Define help category interface
interface HelpCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  topics: HelpTopic[];
}

// Help categories and topics
const helpTopics: HelpCategory[] = [
  {
    id: 'gettingStarted',
    title: 'Getting Started',
    icon: <LucideBookOpen className="h-5 w-5 text-primary" />,
    description: 'Learn the basics of using the IntelligentEstate platform',
    topics: [
      { id: 'quickstart', title: 'Quickstart Guide', badge: 'Recommended' },
      { id: 'interface', title: 'Understanding the Interface' },
      { id: 'firstAnalysis', title: 'Your First Market Analysis' },
      { id: 'accountSetup', title: 'Account Setup & Preferences' }
    ]
  },
  {
    id: 'mapping',
    title: 'Property Mapping',
    icon: <LucideMapPin className="h-5 w-5 text-primary" />,
    description: 'Learn how to use the interactive property mapping features',
    topics: [
      { id: 'mapNavigation', title: 'Map Navigation Controls' },
      { id: 'propertyFilters', title: 'Setting Property Filters' },
      { id: 'heatmapLayers', title: 'Understanding Heatmap Layers' },
      { id: 'saveMapView', title: 'Saving & Sharing Map Views' }
    ]
  },
  {
    id: 'valuation',
    title: 'Property Valuation',
    icon: <LucideCalculator className="h-5 w-5 text-primary" />,
    description: 'Get help with property valuation tools and features',
    topics: [
      { id: 'valuationAccuracy', title: 'Understanding Valuation Accuracy' },
      { id: 'valuationFactors', title: 'Factors Affecting Valuations' },
      { id: 'customValuation', title: 'Custom Valuation Parameters' },
      { id: 'valuationReport', title: 'Generating Valuation Reports' }
    ]
  },
  {
    id: 'marketAnalytics',
    title: 'Market Analytics',
    icon: <LucideBarChart4 className="h-5 w-5 text-primary" />,
    description: 'Help with market trend analysis and data interpretation',
    topics: [
      { id: 'marketMetrics', title: 'Key Market Metrics Explained' },
      { id: 'trendAnalysis', title: 'Trend Analysis Features' },
      { id: 'predictiveModels', title: 'Predictive Market Models' },
      { id: 'customReports', title: 'Creating Custom Analytics Reports' }
    ]
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: <LucideMonitor className="h-5 w-5 text-primary" />,
    description: 'Troubleshooting and technical assistance',
    topics: [
      { id: 'displayIssues', title: 'Display & Screen Issues', link: '/fix-my-screen/help' },
      { id: 'browserCompatibility', title: 'Browser Compatibility' },
      { id: 'dataLoading', title: 'Data Loading Problems' },
      { id: 'systemRequirements', title: 'System Requirements' }
    ]
  },
  {
    id: 'dataIntegration',
    title: 'Data & Integrations',
    icon: <LucideGlobe className="h-5 w-5 text-primary" />,
    description: 'Help with data sources and third-party integrations',
    topics: [
      { id: 'dataSources', title: 'Our Data Sources' },
      { id: 'apiAccess', title: 'API Access & Documentation' },
      { id: 'exportFormats', title: 'Data Export Formats' },
      { id: 'thirdPartyConnectors', title: 'Third-Party Connectors' }
    ]
  }
];

// Frequently asked questions
const faqItems = [
  {
    question: "How accurate are the property valuations?",
    answer: "Our property valuations are typically within 5-10% of actual market value. The accuracy depends on several factors including data availability for the region, property uniqueness, and recent market changes. We use advanced AI models trained on millions of property transactions to provide the most accurate estimates possible."
  },
  {
    question: "How often is market data updated?",
    answer: "Market data is updated daily for most regions. Major metropolitan areas receive real-time updates throughout the day, while rural areas may be updated weekly. The last update time is always displayed in the market dashboard for each region."
  },
  {
    question: "Can I export analytics reports?",
    answer: "Yes, all analytics reports can be exported in multiple formats including PDF, Excel, CSV, and interactive HTML. Look for the export button in the top-right corner of any analytics dashboard or report view."
  },
  {
    question: "How do I save a custom map view?",
    answer: "To save a custom map view, configure your desired filters and zoom level, then click the bookmark icon in the map controls. You can name your saved view and it will appear in your saved views list for quick access later."
  },
  {
    question: "What browsers are supported?",
    answer: "We officially support the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience with our mapping and data visualization features, we recommend using Chrome or Firefox with hardware acceleration enabled."
  },
  {
    question: "How can I get API access to the platform data?",
    answer: "API access is available on Business and Enterprise plans. Visit the API Documentation section to learn about available endpoints, authentication, and usage limits. You can generate API keys from your account settings page."
  }
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('topics');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would perform a search across help content
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl flex-1">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" className="mr-4">
                <LucideArrowLeft className="mr-2 h-4 w-4" />
                <LucideHome className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold flex items-center">
              <LucideHelpCircle className="mr-3 h-7 w-7 text-primary" />
              Help Center
            </h1>
          </div>
          
          {/* Search form */}
          <form onSubmit={handleSearch} className="relative max-w-sm w-full">
            <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search help articles..."
              className="pl-9 pr-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Welcome card */}
        <Card className="mb-8 border shadow-md bg-gradient-to-r from-primary/10 to-background">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Welcome to the Help Center</h2>
                <p className="text-muted-foreground mb-4">
                  Find answers, learn about features, and get the most out of your IntelligentEstate platform.
                  Browse topics below or search for specific questions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default" className="gap-2">
                    <LucideVideo className="h-4 w-4" />
                    <span>Video Tutorials</span>
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <LucideFileText className="h-4 w-4" />
                    <span>Full Documentation</span>
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <LucideUsers className="h-4 w-4" />
                    <span>Contact Support</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <LucideLightbulb className="h-28 w-28 text-primary/40" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="topics" className="flex-1">
              <LucideBookOpen className="h-4 w-4 mr-2" />
              Help Topics
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex-1">
              <LucideHelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex-1">
              <LucideVideo className="h-4 w-4 mr-2" />
              Video Guides
            </TabsTrigger>
          </TabsList>
          
          {/* Help Topics Content */}
          <TabsContent value="topics" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpTopics.map((category) => (
                <Card key={category.id} className="border shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle>{category.title}</CardTitle>
                        <CardDescription className="mt-1">{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.topics.map((topic) => (
                        <li key={topic.id}>
                          <Link 
                            href={topic.link || `/help/topics/${category.id}/${topic.id}`}
                            className="flex items-center justify-between p-2 text-sm hover:bg-muted rounded-md transition-colors"
                          >
                            <span>{topic.title}</span>
                            {topic.badge && (
                              <Badge variant="outline" className="text-xs font-normal">
                                {topic.badge}
                              </Badge>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* FAQ Content */}
          <TabsContent value="faq" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LucideHelpCircle className="h-5 w-5 mr-2 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Quick answers to the most common questions about our platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Video Guides Content */}
          <TabsContent value="videos" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LucideVideo className="h-5 w-5 mr-2 text-primary" />
                  Video Tutorials
                </CardTitle>
                <CardDescription>
                  Learn through step-by-step video demonstrations of platform features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-12 border border-dashed rounded-lg bg-card/50">
                  <LucideVideo className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Video Tutorials Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Our team is currently producing high-quality video tutorials
                    to help you get the most out of the platform.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Subscribe for Updates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Quick help section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LucideCheckCircle className="h-5 w-5 mr-2 text-primary" />
              Need More Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                <LucideUsers className="h-8 w-8 mx-auto mb-2 text-primary/70" />
                <h3 className="font-medium mb-1">Contact Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized help from our support team
                </p>
              </div>
              <div className="border rounded-lg p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                <LucideBookOpen className="h-8 w-8 mx-auto mb-2 text-primary/70" />
                <h3 className="font-medium mb-1">Documentation</h3>
                <p className="text-sm text-muted-foreground">
                  Browse our comprehensive documentation
                </p>
              </div>
              <div className="border rounded-lg p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                <LucideMonitor className="h-8 w-8 mx-auto mb-2 text-primary/70" />
                <h3 className="font-medium mb-1">Screen Issues</h3>
                <p className="text-sm text-muted-foreground">
                  Fix display and black screen problems
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 text-sm text-muted-foreground">
            Our support team is available Monday-Friday, 9am-6pm PT
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
}