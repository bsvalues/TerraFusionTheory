import React, { useState, useRef, useEffect } from 'react';
import CinematicWalkthrough from './CinematicWalkthrough';
import WhisperAgent from './WhisperAgent';
import PDFDigestGenerator from './PDFDigestGenerator';
import '../../styles/terrafusion.css';

/**
 * TerraFusion Synesthetic Demo
 * 
 * A comprehensive demonstration of the TerraFusion Synesthetic Suite,
 * showcasing the Cinematic Walkthrough, Whisper Agent UX Layer,
 * and PDF Comp Digest Generator.
 */
const TerraFusionSynestheticDemo = () => {
  // Demo state
  const [currentView, setCurrentView] = useState('intro'); // intro, walkthrough, pdf
  const [demoStarted, setDemoStarted] = useState(false);
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [emotionalState, setEmotionalState] = useState({
    userConfidence: 0,
    userInterest: 0,
    lastAction: null,
    hoverCount: 0,
    revertCount: 0
  });
  
  // Component refs for whisper agents
  const exploreButtonRef = useRef(null);
  const reportButtonRef = useRef(null);
  const helpButtonRef = useRef(null);
  
  // Subject property and comps data
  const subjectProperty = {
    id: 'subject1',
    address: '2204 Hill Dr, Grandview, WA',
    price: 525000,
    sqft: 2450,
    bedrooms: 4,
    bathrooms: 2.5,
    yearBuilt: 2005,
    lotSize: 0.28
  };
  
  const availableComps = [
    {
      id: 'comp1',
      address: '2187 Valley View Rd, Grandview, WA',
      price: 515000,
      sqft: 2300,
      bedrooms: 4,
      bathrooms: 2.5,
      yearBuilt: 2007,
      lotSize: 0.25,
      similarity: 92
    },
    {
      id: 'comp2',
      address: '2356 Hilltop Ave, Grandview, WA',
      price: 540000,
      sqft: 2520,
      bedrooms: 4,
      bathrooms: 3,
      yearBuilt: 2008,
      lotSize: 0.30,
      similarity: 88
    },
    {
      id: 'comp3',
      address: '2092 Orchard Lane, Grandview, WA',
      price: 495000,
      sqft: 2250,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2003,
      lotSize: 0.22,
      similarity: 84
    },
    {
      id: 'comp4',
      address: '2413 Summit Drive, Grandview, WA',
      price: 565000,
      sqft: 2650,
      bedrooms: 5,
      bathrooms: 3,
      yearBuilt: 2010,
      lotSize: 0.32,
      similarity: 78
    },
    {
      id: 'comp5',
      address: '2175 Vineyard Rd, Grandview, WA',
      price: 505000,
      sqft: 2300,
      bedrooms: 4,
      bathrooms: 2,
      yearBuilt: 2002,
      lotSize: 0.26,
      similarity: 81
    }
  ];
  
  // Adjustments for the demo
  const shapData = {
    baseValue: 525000,
    outputValue: 534300,
    features: [
      {
        feature: 'Gross Living Area',
        effect: 9200,
        value: '2300 sqft vs 2450 sqft',
        description: 'The comparable is 150 sqft smaller than the subject'
      },
      {
        feature: 'Location Quality',
        effect: -3500,
        value: '0.8 miles from subject',
        description: 'The comparable is in a slightly inferior location'
      },
      {
        feature: 'Property Age',
        effect: 2100,
        value: '2007 vs 2005',
        description: 'The comparable is 2 years newer than the subject'
      },
      {
        feature: 'Lot Size',
        effect: 1500,
        value: '0.25 acres vs 0.28 acres',
        description: 'The comparable has a slightly smaller lot'
      }
    ]
  };
  
  // Session history for PDF generation
  const sessionHistory = [
    {
      timestamp: '2025-05-03T14:32:10Z',
      action: 'Selected subject property',
      details: '2204 Hill Dr, Grandview, WA'
    },
    {
      timestamp: '2025-05-03T14:32:45Z',
      action: 'Auto-selected comparable',
      details: '2187 Valley View Rd (92% similarity)'
    },
    {
      timestamp: '2025-05-03T14:33:20Z',
      action: 'SHAP analysis generated',
      details: 'Net adjustment: +$9,300'
    },
    {
      timestamp: '2025-05-03T14:34:05Z',
      action: 'Modified adjustment',
      details: 'Location Quality: -$3,500 → -$4,000'
    }
  ];
  
  // Track emotional state changes based on user interactions
  const updateEmotionalState = (action, data) => {
    setEmotionalState(prev => {
      const newState = { ...prev, lastAction: action };
      
      switch (action) {
        case 'hover_comp':
          return {
            ...newState,
            hoverCount: prev.hoverCount + 1,
            userInterest: Math.min(100, prev.userInterest + 5)
          };
        case 'select_comp':
          return {
            ...newState,
            userConfidence: Math.min(100, prev.userConfidence + 10),
            userInterest: Math.min(100, prev.userInterest + 15)
          };
        case 'hover_shap':
          return {
            ...newState,
            userInterest: Math.min(100, prev.userInterest + 8)
          };
        case 'revert_adjustment':
          return {
            ...newState,
            revertCount: prev.revertCount + 1,
            userConfidence: Math.max(0, prev.userConfidence - 5)
          };
        default:
          return newState;
      }
    });
  };
  
  // Start the demo experience
  const startDemo = () => {
    setDemoStarted(true);
    setCurrentView('walkthrough');
  };
  
  // Handle walkthrough completion
  const handleWalkthroughComplete = () => {
    setWalkthroughComplete(true);
    // After a short delay, show the PDF generator
    setTimeout(() => {
      setCurrentView('pdf');
    }, 1000);
  };
  
  // Handle PDF generation
  const handlePDFGenerated = (reportData) => {
    console.log('PDF Report Generated:', reportData);
    // In a real implementation, this would trigger a download or open the PDF
    
    // Show success message
    alert('PDF Report Generated Successfully!');
    
    // Reset the demo (optional)
    // setCurrentView('intro');
    // setDemoStarted(false);
    // setWalkthroughComplete(false);
  };
  
  // Render intro view
  const renderIntroView = () => {
    return (
      <div className="tf-demo-intro">
        <div className="intro-content">
          <h1 className="intro-title">TerraFusion Synesthetic Suite</h1>
          <p className="intro-description">
            Experience the future of property valuation with our revolutionary AI-powered platform.
            TerraFusion transforms complex property data into a seamless, intuitive experience.
          </p>
          
          <div className="intro-features">
            <div className="intro-feature">
              <div className="feature-icon">🎬</div>
              <div className="feature-content">
                <h3>Cinematic Walkthrough</h3>
                <p>A guided, story-driven experience that showcases the valuation process from start to finish.</p>
              </div>
            </div>
            
            <div className="intro-feature">
              <div className="feature-icon">💬</div>
              <div className="feature-content">
                <h3>Whisper Agent UX Layer</h3>
                <p>Contextual hints and suggestions that appear as you interact with the platform.</p>
              </div>
            </div>
            
            <div className="intro-feature">
              <div className="feature-icon">📄</div>
              <div className="feature-content">
                <h3>PDF Comp Digest Generator</h3>
                <p>Create comprehensive, beautifully designed reports documenting your valuation process.</p>
              </div>
            </div>
          </div>
          
          <div className="intro-actions" ref={exploreButtonRef}>
            <button className="btn-start-demo" onClick={startDemo}>
              Begin Experience
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the active view
  const renderActiveView = () => {
    switch (currentView) {
      case 'walkthrough':
        return (
          <CinematicWalkthrough
            subjectProperty={subjectProperty}
            availableComps={availableComps}
            onComplete={handleWalkthroughComplete}
            autoPlay={true}
          />
        );
      case 'pdf':
        return (
          <PDFDigestGenerator
            subjectProperty={subjectProperty}
            selectedComps={availableComps.slice(0, 2)}
            adjustments={{
              'Gross Living Area': 9200,
              'Location Quality': -3500,
              'Property Age': 2100,
              'Lot Size': 1500
            }}
            shapData={shapData}
            sessionHistory={sessionHistory}
            onGenerate={handlePDFGenerated}
          />
        );
      case 'intro':
      default:
        return renderIntroView();
    }
  };
  
  // Render whisper agents if demo started
  const renderWhisperAgents = () => {
    if (!demoStarted) {
      return (
        <WhisperAgent
          targetRef={exploreButtonRef}
          contextType="intro"
          contextData={{
            isFirst: true
          }}
          position="top"
        />
      );
    }
    
    return null;
  };
  
  // Display emotional state debugging if enabled
  const renderEmotionalStateDebug = () => {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div className="emotional-state-debug">
          <h4>Emotional State Debug</h4>
          <div className="state-values">
            <div className="state-item">
              <span className="state-label">User Confidence:</span>
              <span className="state-value">{emotionalState.userConfidence}%</span>
            </div>
            <div className="state-item">
              <span className="state-label">User Interest:</span>
              <span className="state-value">{emotionalState.userInterest}%</span>
            </div>
            <div className="state-item">
              <span className="state-label">Last Action:</span>
              <span className="state-value">{emotionalState.lastAction || 'None'}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Hover Count:</span>
              <span className="state-value">{emotionalState.hoverCount}</span>
            </div>
            <div className="state-item">
              <span className="state-label">Revert Count:</span>
              <span className="state-value">{emotionalState.revertCount}</span>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="tf-synesthetic-demo">
      <div className="demo-header">
        <div className="demo-logo">
          <span className="logo-icon">TF</span>
          <span className="logo-text">TerraFusion</span>
        </div>
        
        <div className="demo-nav">
          <button 
            className={`nav-button ${currentView === 'intro' ? 'active' : ''}`}
            onClick={() => setCurrentView('intro')}
          >
            Introduction
          </button>
          <button 
            className={`nav-button ${currentView === 'walkthrough' ? 'active' : ''}`}
            onClick={() => setCurrentView('walkthrough')}
            disabled={!demoStarted}
          >
            Walkthrough
          </button>
          <button 
            className={`nav-button ${currentView === 'pdf' ? 'active' : ''}`}
            onClick={() => setCurrentView('pdf')}
            disabled={!walkthroughComplete}
            ref={reportButtonRef}
          >
            Report Generator
          </button>
        </div>
        
        <div className="demo-actions">
          <button className="action-button" ref={helpButtonRef}>
            <span className="action-icon">?</span>
            <span className="action-text">Help</span>
          </button>
        </div>
      </div>
      
      <div className="demo-content">
        {renderActiveView()}
      </div>
      
      {renderWhisperAgents()}
      {renderEmotionalStateDebug()}
    </div>
  );
};

export default TerraFusionSynestheticDemo;