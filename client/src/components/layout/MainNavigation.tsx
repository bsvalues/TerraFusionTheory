/**
 * Main Navigation Component
 * 
 * A consistent navigation bar that appears across all pages
 * allowing for easy navigation through the application.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Building, 
  BarChart2, 
  Map, 
  LineChart, 
  FileText, 
  Calculator, 
  Heart, 
  School, 
  Briefcase, 
  Settings, 
  HelpCircle 
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const MainNavigation = () => {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Close mobile menu when location changes
  useEffect(() => {
    setIsExpanded(false);
  }, [location]);
  
  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/',
      icon: <Home className="h-5 w-5" />
    },
    {
      name: 'Properties',
      href: '/property-data',
      icon: <Building className="h-5 w-5" />,
      children: [
        {
          name: 'Property Data',
          href: '/property-data',
          icon: <Building className="h-4 w-4" />
        },
        {
          name: 'Property Valuation',
          href: '/valuation',
          icon: <Calculator className="h-4 w-4" />
        },
        {
          name: 'Property Comparison',
          href: '/property-comparison',
          icon: <FileText className="h-4 w-4" />
        }
      ]
    },
    {
      name: 'Market Analytics',
      href: '/market-trends',
      icon: <BarChart2 className="h-5 w-5" />,
      children: [
        {
          name: 'Market Trends',
          href: '/market-trends',
          icon: <LineChart className="h-4 w-4" />
        },
        {
          name: 'Heat Map',
          href: '/market-heat-map',
          icon: <Map className="h-4 w-4" />
        },
        {
          name: 'Mass Appraisal',
          href: '/mass-appraisal',
          icon: <Calculator className="h-4 w-4" />
        }
      ]
    },
    {
      name: 'Area Insights',
      href: '/economic-indicators',
      icon: <Briefcase className="h-5 w-5" />,
      children: [
        {
          name: 'Economic Indicators',
          href: '/economic-indicators',
          icon: <Briefcase className="h-4 w-4" />
        },
        {
          name: 'School Districts',
          href: '/school-economic-analysis',
          icon: <School className="h-4 w-4" />
        },
        {
          name: 'Neighborhood Sentiment',
          href: '/neighborhood-sentiment',
          icon: <Heart className="h-4 w-4" />
        }
      ]
    },
    {
      name: 'Help',
      href: '/help',
      icon: <HelpCircle className="h-5 w-5" />
    }
  ];
  
  // Find active parent based on current location
  const findActiveParent = () => {
    const path = location;
    const activeParent = navItems.find(item => 
      item.href === path || 
      (item.children && item.children.some(child => child.href === path))
    );
    return activeParent;
  };
  
  const activeParent = findActiveParent();
  
  return (
    <nav className="bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center h-16 cursor-pointer">
                <Home className="h-6 w-6 mr-2 text-primary" />
                <span className="font-bold text-lg">IntelligentEstate</span>
              </div>
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              <svg 
                className={`${isExpanded ? 'hidden' : 'block'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg 
                className={`${isExpanded ? 'block' : 'hidden'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                <Link href={item.href}>
                  <div 
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                      activeParent?.name === item.name 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-gray-700 hover:bg-muted/50 hover:text-primary'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    <span>{item.name}</span>
                    {item.children && (
                      <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </Link>
                
                {/* Dropdown for items with children */}
                {item.children && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white z-10 hidden group-hover:block">
                    <div className="py-1 rounded-md bg-white">
                      {item.children.map((child) => (
                        <Link key={child.name} href={child.href}>
                          <div 
                            className={`flex items-center px-4 py-2 text-sm ${
                              location === child.href 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-gray-700 hover:bg-muted/50 hover:text-primary'
                            }`}
                          >
                            <span className="mr-2">{child.icon}</span>
                            <span>{child.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile menu dropdown */}
      <div className={`${isExpanded ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <div key={item.name}>
              <Link href={item.href}>
                <div 
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                    activeParent?.name === item.name 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-700 hover:bg-muted/50 hover:text-primary'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              </Link>
              
              {/* Show children for active parent */}
              {item.children && activeParent?.name === item.name && (
                <div className="mt-2 pl-10 space-y-2">
                  {item.children.map((child) => (
                    <Link key={child.name} href={child.href}>
                      <div 
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          location === child.href 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-gray-600 hover:bg-muted/50 hover:text-primary'
                        }`}
                      >
                        <span className="mr-2">{child.icon}</span>
                        <span>{child.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;