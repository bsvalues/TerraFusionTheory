import React from 'react';
import { Link, useLocation } from 'wouter';
import { NavItem } from '@/types';

const DEVELOPMENT_STAGES: NavItem[] = [
  {
    label: 'Requirements Analysis',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    href: '/',
  },
  {
    label: 'Design & Architecture',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    href: '/design',
  },
  {
    label: 'Code Generation',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    href: '/code',
  },
  {
    label: 'Debugging & Testing',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    href: '/debugging',
  },
  {
    label: 'Deployment & CI/CD',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
    href: '/deployment',
  },
  {
    label: 'Documentation',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    href: '/documentation',
  },
];

const SETTINGS: NavItem[] = [
  {
    label: 'Configuration',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    href: '/configuration',
  },
  {
    label: 'System Monitor',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    href: '/system/monitor',
  },
  {
    label: 'Agent System',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    href: '/agents',
  },
  {
    label: 'Badges',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    href: '/badges',
  },
  {
    label: 'Code Snippets',
    icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
    href: '/code-snippets',
  },
  {
    label: 'Activity Log',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    href: '/activity',
  },
];

const NavItemComponent = ({ item }: { item: NavItem }) => {
  const [location] = useLocation();
  const isActive = location === item.href;

  return (
    <div className="w-full">
      <Link href={item.href}>
        <div
          className={`flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer ${
            isActive
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg
            className={`mr-3 h-5 w-5 ${isActive ? '' : 'text-gray-500'}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
          </svg>
          {item.label}
        </div>
      </Link>
    </div>
  );
};

const Sidebar = () => {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="h-16 flex items-center border-b border-gray-200 px-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl">BS</span>
            </div>
            <h1 className="text-xl font-semibold">AI Developer</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <div className="px-2 mb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Development Stages
          </div>
          
          {DEVELOPMENT_STAGES.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
          
          <div className="px-2 mt-6 mb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Settings
          </div>
          
          {SETTINGS.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
