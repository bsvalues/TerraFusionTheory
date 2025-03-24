import { Helmet } from 'react-helmet';
import MarketHeatMap from '../components/market/MarketHeatMap';

const MarketHeatMapPage = () => {
  return (
    <>
      <Helmet>
        <title>Real-time Property Market Heat Map | IntelligentEstate</title>
        <meta 
          name="description" 
          content="Visualize property market trends and hotspots with our real-time heat map analytics."
        />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <MarketHeatMap />
      </div>
    </>
  );
};

export default MarketHeatMapPage;