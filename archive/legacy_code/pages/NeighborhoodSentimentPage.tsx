/**
 * Neighborhood Sentiment Analysis Page
 * 
 * This page displays the neighborhood sentiment analysis dashboard,
 * allowing users to explore public perception data for different neighborhoods.
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import NeighborhoodSentimentDashboard from '@/components/dashboard/NeighborhoodSentimentDashboard';

const NeighborhoodSentimentPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      <Helmet>
        <title>Neighborhood Sentiment | IntelligentEstate</title>
      </Helmet>
      
      <NeighborhoodSentimentDashboard />
    </div>
  );
};

export default NeighborhoodSentimentPage;