/**
 * Application Navigation Component
 * 
 * A consistent navigation bar for use across the application.
 */

import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { 
  Home,
  Building,
  BarChart2, 
  Calculator,
  LineChart,
  HelpCircle,
  MapPin
} from 'lucide-react';

// Define route configuration for cleaner navigation
const routes = [
  {
    name: 'Dashboard',
    path: '/',
    icon: <Home className="h-5 w-5 mr-2" />
  },
  {
    name: 'Properties',
    path: '/property-data',
    icon: <Building className="h-5 w-5 mr-2" />
  },
  {
    name: 'Valuation',
    path: '/valuation',
    icon: <Calculator className="h-5 w-5 mr-2" />
  },
  {
    name: 'Market Analytics',
    path: '/market-trends',
    icon: <BarChart2 className="h-5 w-5 mr-2" />
  },
  {
    name: 'Area Insights',
    path: '/economic-indicators',
    icon: <LineChart className="h-5 w-5 mr-2" />
  },
  {
    name: 'Map View',
    path: '/market-heat-map',
    icon: <MapPin className="h-5 w-5 mr-2" />
  },
  {
    name: 'Help',
    path: '/help',
    icon: <HelpCircle className="h-5 w-5 mr-2" />
  }
];

interface AppNavigationProps {
  currentPath?: string;
}

export function AppNavigation({ currentPath }: AppNavigationProps) {
  const [location] = useLocation();
  const currentRoute = currentPath || location;
  
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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {routes.map((route) => (
              <Link key={route.path} href={route.path}>
                <div 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer
                    ${currentRoute === route.path 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-muted/50 hover:text-primary'
                    }`}
                >
                  {route.icon}
                  <span>{route.name}</span>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button className="p-2 rounded-md text-gray-400 hover:text-primary hover:bg-gray-100 focus:outline-none">
              <svg 
                className="h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation - Hidden by default, can be expanded via state if needed */}
        <div className="hidden md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {routes.map((route) => (
              <Link key={route.path} href={route.path}>
                <div
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                    currentRoute === route.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                  }`}
                >
                  {route.icon}
                  <span>{route.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default AppNavigation;