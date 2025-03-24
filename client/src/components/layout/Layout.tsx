import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Standard layout component with navigation header
 */
const Layout: React.FC<LayoutProps> = ({ 
  children,
  title = 'IntelligentEstate',
  subtitle
}) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          
          <nav className="flex space-x-4">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link href="/valuation-assistant">
              <Button variant="ghost">AI Assistant</Button>
            </Link>
            <Link href="/gis-demo">
              <Button variant="ghost">GIS Demo</Button>
            </Link>
            <Link href="/badges">
              <Button variant="ghost">Badges</Button>
            </Link>
            <Link href="/code-snippets">
              <Button variant="ghost">Code Snippets</Button>
            </Link>
            <Link href="/agents">
              <Button variant="ghost">Agents</Button>
            </Link>
            <Link href="/mascot-demo">
              <Button variant="ghost">Mascot</Button>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="pb-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;