import React, { useState } from 'react';

/**
 * SmartCompTray Component
 * 
 * Displays a grid of comparable properties that can be dragged into the comparison grid.
 * Shows key information and visual indicators of similarity to the subject property.
 */
export const SmartCompTray = ({ properties, subjectProperty, onCompSelected }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter properties based on search term
  const filteredProperties = properties.filter(property => {
    const searchLower = searchTerm.toLowerCase();
    return (
      property.address.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.zipCode.includes(searchTerm)
    );
  });
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Format distance
  const formatDistance = (distance) => {
    return distance === 0 ? 'Subject' : `${distance.toFixed(1)} mi`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  // Get similarity color based on confidence score
  const getSimilarityColor = (confidence) => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 80) return 'bg-green-400';
    if (confidence >= 70) return 'bg-yellow-400';
    return 'bg-yellow-500';
  };
  
  // Handle drag start
  const handleDragStart = (e, property) => {
    e.dataTransfer.setData('application/json', JSON.stringify(property));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Add a dragging class to the element
    e.currentTarget.classList.add('tf-comp-card-dragging');
  };
  
  // Handle drag end
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('tf-comp-card-dragging');
  };
  
  // Handle click to select
  const handleClick = (property) => {
    onCompSelected(property);
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by address, city, or zip code..."
          className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* Comparable properties grid */}
      <div className="tf-comp-tray">
        {filteredProperties.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            No matching properties found
          </div>
        ) : (
          filteredProperties.map((property) => (
            <div
              key={property.id}
              className="tf-comp-card"
              draggable
              onDragStart={(e) => handleDragStart(e, property)}
              onDragEnd={handleDragEnd}
              onClick={() => handleClick(property)}
            >
              {property.confidence && (
                <div className="absolute top-2 right-2 z-10">
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSimilarityColor(property.confidence)} text-gray-900`}>
                    {property.confidence}% Match
                  </div>
                </div>
              )}
              
              <div className="aspect-video bg-gray-700 rounded-md overflow-hidden mb-3">
                <img 
                  src={property.imageUrl} 
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-sm truncate">{property.address}</h3>
                  <span className="text-xs text-gray-400">{formatDistance(property.distance)}</span>
                </div>
                
                <p className="text-xs text-gray-400">{property.city}, {property.state} {property.zipCode}</p>
                
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{formatCurrency(property.price)}</span>
                  <span className="text-gray-400">{formatDate(property.saleDate)}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div className="bg-gray-700/50 p-1 rounded text-center">
                    <span>{property.squareFeet.toLocaleString()} sqft</span>
                  </div>
                  <div className="bg-gray-700/50 p-1 rounded text-center">
                    <span>{property.bedrooms} bd</span>
                  </div>
                  <div className="bg-gray-700/50 p-1 rounded text-center">
                    <span>{property.bathrooms} ba</span>
                  </div>
                </div>
                
                {property.similarities && (
                  <div className="pt-2">
                    <div className="grid grid-cols-4 gap-1">
                      <SimilarityBar label="Loc" value={property.similarities.location} />
                      <SimilarityBar label="Size" value={property.similarities.size} />
                      <SimilarityBar label="Feat" value={property.similarities.features} />
                      <SimilarityBar label="Cond" value={property.similarities.condition} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Similarity bar component
const SimilarityBar = ({ label, value }) => {
  // Get color based on similarity value
  const getColor = (val) => {
    if (val >= 0.9) return 'bg-green-500';
    if (val >= 0.8) return 'bg-green-400';
    if (val >= 0.7) return 'bg-yellow-400';
    if (val >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-gray-400 text-center">{label}</span>
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(value)}`}
          style={{ width: `${value * 100}%` }}
        ></div>
      </div>
    </div>
  );
};