// Centralized route configuration for TerraFusionTheory client

export interface AppRoute {
  path: string;
  label: string;
  element: React.ReactNode;
  icon?: React.ReactNode;
  showInNav?: boolean;
}

import React from 'react';
import Home from './pages/Home';
import DashboardPage from './pages/DashboardPage';
import GAMAPage from './pages/GAMAPage';
import MarketTrendsPage from './pages/MarketTrendsPage';
import PropertyDataPage from './pages/PropertyDataPage';
import TerraGAMAPage from './pages/TerraGAMAPage';

export const appRoutes: AppRoute[] = [
  {
    path: '/',
    label: 'Home',
    element: <Home />,
    showInNav: true
  },
  {
    path: '/dashboard',
    label: 'Dashboard',
    element: <DashboardPage />,
    showInNav: true
  },
  {
    path: '/gama',
    label: 'GAMA',
    element: <GAMAPage />,
    showInNav: true
  },
  {
    path: '/market-trends',
    label: 'Market Trends',
    element: <MarketTrendsPage />,
    showInNav: true
  },
  {
    path: '/property-data',
    label: 'Property Data',
    element: <PropertyDataPage />,
    showInNav: true
  },
  {
    path: '/terra-gama',
    label: 'TerraGAMA',
    element: <TerraGAMAPage />,
    showInNav: false
  }
];
