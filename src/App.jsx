import React from 'react';
import CompFusionCommandCenter from './CompFusionCommandCenter';
import './styles/terrafusion.css';

/**
 * Main App Component
 * 
 * Entry point for the TerraFusion CompFusion platform demo.
 */
function App() {
  return (
    <div className="app">
      <CompFusionCommandCenter />
    </div>
  );
}

export default App;