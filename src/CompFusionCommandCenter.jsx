import React, { useState, useEffect, useMemo } from 'react';
import { SmartCompTray } from './components/SmartCompTray';
import { CompGridDropzone } from './components/CompGridDropzone';
import { CompImpactVisualizer } from './components/CompImpactVisualizer';
import { NarrativeAgent } from './components/NarrativeAgent';
import { calculateShapValues } from './utils/CompAgentSHAP';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/terrafusion.css';

const CompFusionCommandCenter = () => {
  const [loading, setLoading] = useState(true);
  const [comparableProperties, setComparableProperties] = useState([]);
  const [subjectProperty, setSubjectProperty] = useState(null);
  const [selectedComps, setSelectedComps] = useState([null, null, null]);
  const [selectedCompIndex, setSelectedCompIndex] = useState(null);
  const [shapData, setShapData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [adjustmentsData, setAdjustmentsData] = useState(null);

  // Load comp data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch comp data
        const compResponse = await fetch('/mock_comp_data.json');
        const compData = await compResponse.json();
        setSubjectProperty(compData.subject_property);
        setComparableProperties(compData.comparable_properties);

        // Fetch adjustments data
        const adjustmentsResponse = await fetch('/mock_adjustments.json');
        const adjustments = await adjustmentsResponse.json();
        setAdjustmentsData(adjustments);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching comp data:', error);
        toast.error('Error loading property data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle adding a comp to the selected list
  const handleCompAdded = (index, comp) => {
    const newComps = [...selectedComps];
    newComps[index] = comp;
    setSelectedComps(newComps);
    setSelectedCompIndex(index); // Select this comp to show its impact
  };

  // Handle removing a comp from the selected list
  const handleCompRemoved = (index) => {
    const newComps = [...selectedComps];
    newComps[index] = null;
    setSelectedComps(newComps);
    
    // If the selected comp was removed, clear the selection or select another comp
    if (selectedCompIndex === index) {
      const nextComp = selectedComps.findIndex((comp, i) => i !== index && comp !== null);
      setSelectedCompIndex(nextComp !== -1 ? nextComp : null);
    }
  };

  // Handle selecting a comp to view its impact
  const handleSelectCompForImpact = (index) => {
    setSelectedCompIndex(index);
  };

  // Calculate SHAP data when a comp is selected
  useEffect(() => {
    if (selectedCompIndex !== null && selectedComps[selectedCompIndex] && subjectProperty) {
      setIsCalculating(true);
      
      // In a production environment, this would be an API call
      // Instead, we're using our local calculator with a simulated delay
      setTimeout(() => {
        const newShapData = calculateShapValues(
          selectedComps[selectedCompIndex],
          subjectProperty
        );
        setShapData(newShapData);
        setIsCalculating(false);
      }, 800); // Simulate API delay
    }
  }, [selectedCompIndex, selectedComps, subjectProperty]);

  // Handle recalculation of all comps
  const handleRecalculate = () => {
    // Count valid comps
    const validComps = selectedComps.filter(comp => comp !== null).length;
    
    if (validComps === 0) {
      toast.warning('Please select at least one comparable property');
      return;
    }
    
    // Simulate a recalculation
    toast.info('Recalculating values...');
    
    setTimeout(() => {
      // Get the average of adjusted prices from our mock data
      const adjustedPrices = selectedComps
        .filter(comp => comp !== null)
        .map(comp => {
          const adjustment = adjustmentsData?.adjustments.find(a => a.comp_id === comp.id);
          return adjustment ? adjustment.adjusted_price : comp.price;
        });
      
      if (adjustedPrices.length > 0) {
        const avgPrice = Math.round(
          adjustedPrices.reduce((sum, price) => sum + price, 0) / adjustedPrices.length
        );
        
        toast.success(`Based on your selected comps, the estimated value is ${formatCurrency(avgPrice)}`);
      }
    }, 1500);
  };

  // Helper to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get adjusted comp from adjustments data
  const getAdjustedComp = (compId) => {
    if (!adjustmentsData) return null;
    return adjustmentsData.adjustments.find(adj => adj.comp_id === compId);
  };

  // If loading, show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-semibold">Loading TerraFusion CompFusion...</h2>
          <p className="text-gray-400 mt-2">Please wait while we initialize the platform</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-12">
      {/* Header */}
      <header className="bg-gray-800 py-4 px-6 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-400">TerraFusion</h1>
            <span className="px-2 py-1 rounded bg-blue-900 text-blue-200 text-xs">CompFusion</span>
          </div>
          <div>
            <button 
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleRecalculate}
            >
              Recalculate Valuation
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left column - Subject property and form */}
          <div className="col-span-12 lg:col-span-8">
            <div className="space-y-6">
              {/* Subject property */}
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-blue-400 mb-4">Subject Property</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="aspect-video bg-gray-700 rounded-md overflow-hidden">
                      <img 
                        src={subjectProperty.imageUrl} 
                        alt={subjectProperty.address}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{subjectProperty.address}</h3>
                    <p className="text-gray-400">{subjectProperty.city}, {subjectProperty.state} {subjectProperty.zipCode}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400">Price</p>
                        <p className="font-medium">{formatCurrency(subjectProperty.price)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Square Feet</p>
                        <p className="font-medium">{subjectProperty.squareFeet.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Bedrooms</p>
                        <p className="font-medium">{subjectProperty.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Bathrooms</p>
                        <p className="font-medium">{subjectProperty.bathrooms}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Year Built</p>
                        <p className="font-medium">{subjectProperty.yearBuilt}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Lot Size</p>
                        <p className="font-medium">{subjectProperty.lotSize} acres</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Comp selection grid */}
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-blue-400 mb-4">Select Comparable Properties</h2>
                <p className="text-gray-400 mb-6">
                  Drag properties from the tray below to the comparison grid to select your top comparable properties.
                </p>
                
                <CompGridDropzone
                  subjectProperty={subjectProperty}
                  selectedComps={selectedComps}
                  onCompAdded={handleCompAdded}
                  onCompRemoved={handleCompRemoved}
                  onCompSelected={handleSelectCompForImpact}
                  selectedCompIndex={selectedCompIndex}
                  onRecalculate={handleRecalculate}
                  adjustments={adjustmentsData?.adjustments}
                />
              </div>
              
              {/* Show the Impact Visualizer if a comp is selected */}
              {selectedCompIndex !== null && selectedComps[selectedCompIndex] && (
                <div className="bg-gray-800 rounded-lg p-6 shadow-lg tf-viz-fade-in">
                  <h2 className="text-xl font-semibold text-blue-400 mb-4">Value Impact Analysis</h2>
                  
                  <CompImpactVisualizer
                    compProperty={selectedComps[selectedCompIndex]}
                    subjectProperty={subjectProperty}
                    shapData={shapData || undefined}
                    loading={isCalculating}
                    adjustment={getAdjustedComp(selectedComps[selectedCompIndex].id)}
                  />
                  
                  {/* Narrative explanation of the impact */}
                  {shapData && !isCalculating && (
                    <div className="mt-6 tf-viz-fade-in">
                      <NarrativeAgent
                        compProperty={selectedComps[selectedCompIndex]}
                        subjectProperty={subjectProperty}
                        shapData={shapData}
                        adjustment={getAdjustedComp(selectedComps[selectedCompIndex].id)}
                      />
                    </div>
                  )}
                </div>
              )}
              
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-blue-400 mb-4">Available Comparable Properties</h2>
                <SmartCompTray
                  properties={comparableProperties}
                  subjectProperty={subjectProperty}
                  onCompSelected={(comp) => {
                    // Find first empty slot
                    const emptyIndex = selectedComps.findIndex(comp => comp === null);
                    if (emptyIndex !== -1) {
                      handleCompAdded(emptyIndex, comp);
                    } else {
                      toast.warning('All slots filled. Please remove a property before adding a new one.');
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Right column - Analysis and insights */}
          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-4 space-y-6">
              {/* AI Assistant recommendations */}
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-medium text-blue-400 mb-2">AI Assistant Recommendations</h3>
                <p className="text-sm text-blue-100 mb-3">
                  Based on our analysis of the subject property at {subjectProperty.address}, I recommend considering these factors:
                </p>
                <ul className="space-y-2 text-sm text-blue-200">
                  <li className="flex">
                    <span className="mr-2">•</span>
                    <span>Properties built between 1995-2000 will require fewer adjustments</span>
                  </li>
                  <li className="flex">
                    <span className="mr-2">•</span>
                    <span>Focus on homes within 1 mile for best location comparability</span>
                  </li>
                  <li className="flex">
                    <span className="mr-2">•</span>
                    <span>Properties with 4 bedrooms and 2+ bathrooms match the subject best</span>
                  </li>
                  <li className="flex">
                    <span className="mr-2">•</span>
                    <span>Recent sales (last 3 months) will provide the most accurate market conditions</span>
                  </li>
                </ul>
              </div>
              
              {/* Market insights */}
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-medium text-blue-400 mb-2">Market Insights</h3>
                <p className="text-sm text-gray-400 mb-3">
                  The {subjectProperty.city}, {subjectProperty.state} market has shown a 5.2% appreciation over the past 12 months. 
                  Properties in this neighborhood typically sell within 3% of list price.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-700/50 p-3 rounded-md">
                    <p className="text-gray-400">Avg. Days on Market</p>
                    <p className="text-lg font-medium">24</p>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-md">
                    <p className="text-gray-400">Price per Sq.Ft.</p>
                    <p className="text-lg font-medium">$175</p>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-md">
                    <p className="text-gray-400">12-Month Trend</p>
                    <p className="text-lg font-medium text-green-500">+5.2%</p>
                  </div>
                  <div className="bg-gray-700/50 p-3 rounded-md">
                    <p className="text-gray-400">Avg. Sale/List</p>
                    <p className="text-lg font-medium">98.2%</p>
                  </div>
                </div>
              </div>
              
              {/* Activity log */}
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-lg font-medium text-blue-400 mb-2">Activity Log</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-gray-700/50 rounded">
                    <div className="font-medium">Comp Grid Created</div>
                    <div className="text-gray-400">You created a new comparison grid for {subjectProperty.address}</div>
                    <div className="text-xs text-gray-500">Just now</div>
                  </div>
                  <div className="p-2 bg-gray-700/50 rounded">
                    <div className="font-medium">Property Viewed</div>
                    <div className="text-gray-400">You viewed details for {subjectProperty.address}</div>
                    <div className="text-xs text-gray-500">5 minutes ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default CompFusionCommandCenter;