import React, { useState } from 'react';

/**
 * CompGridDropzone Component
 * 
 * Provides a grid of dropzones for receiving comparable properties
 * from the SmartCompTray. Allows for easy selection, removal, and
 * comparison of properties.
 */
export const CompGridDropzone = ({ 
  subjectProperty,
  selectedComps,
  onCompAdded,
  onCompRemoved,
  onCompSelected,
  selectedCompIndex,
  onRecalculate,
  adjustments
}) => {
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'copy';
  };
  
  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };
  
  // Handle drop
  const handleDrop = (e, index) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    try {
      const property = JSON.parse(e.dataTransfer.getData('application/json'));
      onCompAdded(index, property);
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };
  
  // Handle remove
  const handleRemove = (e, index) => {
    e.stopPropagation();
    onCompRemoved(index);
  };
  
  // Handle click on comp
  const handleCompClick = (index) => {
    onCompSelected(index);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Get adjustment data for a comp
  const getAdjustment = (compId) => {
    if (!adjustments) return null;
    return adjustments.find(adj => adj.comp_id === compId);
  };
  
  return (
    <div className="space-y-4">
      <div className="tf-comp-grid">
        {selectedComps.map((comp, index) => (
          <div
            key={index}
            className={`tf-comp-grid-cell ${dragOverIndex === index ? 'tf-comp-grid-cell-active' : ''} ${selectedCompIndex === index && comp ? 'tf-comp-grid-cell-selected' : ''}`}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => comp && handleCompClick(index)}
          >
            {comp ? (
              <div className="relative w-full h-full">
                {/* Remove button */}
                <button
                  className="absolute top-0 right-0 p-1 bg-gray-800/80 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                  onClick={(e) => handleRemove(e, index)}
                  aria-label="Remove"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Property card */}
                <div className="bg-gray-800 p-3 rounded-md shadow-md w-full">
                  <div className="aspect-video bg-gray-700 rounded-md overflow-hidden mb-3">
                    <img 
                      src={comp.imageUrl} 
                      alt={comp.address}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm truncate">{comp.address}</h3>
                    
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{formatCurrency(comp.price)}</span>
                      <span className="text-gray-400">{comp.distance.toFixed(1)} mi</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="bg-gray-700 p-1 rounded text-center">
                        <span>{comp.squareFeet.toLocaleString()} sqft</span>
                      </div>
                      <div className="bg-gray-700 p-1 rounded text-center">
                        <span>{comp.bedrooms} bd</span>
                      </div>
                      <div className="bg-gray-700 p-1 rounded text-center">
                        <span>{comp.bathrooms} ba</span>
                      </div>
                    </div>
                    
                    {/* Adjusted price if available */}
                    {getAdjustment(comp.id) && (
                      <div className="pt-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Adjusted:</span>
                          <span className="font-medium text-blue-400">
                            {formatCurrency(getAdjustment(comp.id).adjusted_price)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="mb-2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500">Drop a comparable here</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center pt-2">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          onClick={onRecalculate}
        >
          Calculate Valuation
        </button>
      </div>
    </div>
  );
};