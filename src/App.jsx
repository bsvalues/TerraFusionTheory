import React from 'react';
import TerraFusionSynestheticDemo from './components/terrafusion/TerraFusionSynestheticDemo';
import './styles/terrafusion.css';

/**
 * Main App Component
 * 
 * Entry point for the TerraFusion CompFusion platform demo.
 * 
 * This app now showcases the TerraFusion Synesthetic Suite, which features:
 * 1. Cinematic Walkthrough Engine
 * 2. Whisper Agent UX Layer
 * 3. PDF Comp Digest Generator
 * 4. Emotional State UI
 */
function App() {
  return (
    <div className="app">
      <TerraFusionSynestheticDemo />
    </div>
  );
}

export default App;