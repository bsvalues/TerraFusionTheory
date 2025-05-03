import React, { useState, useEffect, useRef } from 'react';
import '../../styles/terrafusion.css';

/**
 * Cinematic Walkthrough Engine
 * 
 * Creates an auto-playing "story mode" demo that guides users through
 * the TerraFusion CompFusion experience with narrated, animated steps.
 */
const CinematicWalkthrough = ({ 
  subjectProperty,
  availableComps,
  onComplete = () => {},
  autoPlay = true,
  skipIntro = false
}) => {
  const [currentStep, setCurrentStep] = useState(skipIntro ? 1 : 0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [selectedComps, setSelectedComps] = useState([]);
  const [narrative, setNarrative] = useState('');
  const [visibleSHAP, setVisibleSHAP] = useState(null);
  const [adjustments, setAdjustments] = useState({});
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const narrativeRef = useRef(null);
  const compCardRefs = useRef([]);
  const dropzoneRefs = useRef([]);
  
  const typingSpeed = 50; // ms per character
  
  // Step definitions for the walkthrough
  const steps = [
    {
      name: 'intro',
      title: 'Welcome to TerraFusion',
      narrative: 'Experience the future of property valuation with our intelligent CompFusion platform.',
      duration: 3000,
    },
    {
      name: 'subject',
      title: 'Subject Property',
      narrative: `Now examining subject property at ${subjectProperty?.address || '123 Main St'}. TerraFusion has analyzed all property features and is ready to begin comparable selection.`,
      duration: 5000,
    },
    {
      name: 'comp_selection',
      title: 'Smart Comp Selection',
      narrative: 'Our AI has identified optimal comparable properties. Observe as the most relevant comp is automatically selected based on multiple similarity factors.',
      action: () => {
        // Simulate the first comp being dragged to the first position
        const firstComp = availableComps?.[0] || { id: 'comp1', address: '456 Market St', similarity: 92 };
        animateCompDrag(firstComp, 0);
      },
      duration: 8000,
    },
    {
      name: 'shap_analysis',
      title: 'SHAP Analysis',
      narrative: 'TerraFusion is now calculating the individual impact of each property feature using explainable AI technology (SHAP values).',
      action: () => {
        // Show SHAP values
        setVisibleSHAP({
          features: [
            { feature: 'Gross Living Area', effect: 9200, value: '+9,200 from GLA match' },
            { feature: 'Location Quality', effect: -3500, value: '-3,500 from location difference' },
            { feature: 'Property Age', effect: 2100, value: '+2,100 from similar age' },
            { feature: 'Lot Size', effect: 1500, value: '+1,500 from lot size' },
          ],
          baseValue: subjectProperty?.price || 500000,
          outputValue: (subjectProperty?.price || 500000) + 9300,
        });
      },
      duration: 10000,
    },
    {
      name: 'adjustment',
      title: 'Intelligent Adjustments',
      narrative: 'Based on the SHAP analysis, TerraFusion is now suggesting optimal adjustments to account for property differences.',
      action: () => {
        // Set adjustments
        setAdjustments({
          'Gross Living Area': 9200,
          'Location Quality': -3500,
          'Property Age': 2100,
          'Lot Size': 1500,
        });
      },
      duration: 7000,
    },
    {
      name: 'user_control',
      title: 'Your Turn',
      narrative: 'You now have complete control over the valuation process. Continue refining the analysis or export the results instantly.',
      action: () => {
        // Add the second comp
        if (availableComps && availableComps.length > 1) {
          const secondComp = availableComps[1];
          animateCompDrag(secondComp, 1);
        }
        
        setIsFinalizing(true);
      },
      duration: 8000,
    },
    {
      name: 'conclusion',
      title: 'Experience Complete',
      narrative: 'This concludes the TerraFusion walkthrough. You may now continue with your own analysis or restart the demo.',
      action: () => {
        onComplete();
      },
      duration: 5000,
    }
  ];
  
  // Type out the narrative text with a typewriter effect
  const typeNarrative = (text) => {
    let index = 0;
    setNarrative('');
    
    const typing = setInterval(() => {
      setNarrative((prev) => prev + text.charAt(index));
      index++;
      
      if (index >= text.length) {
        clearInterval(typing);
      }
    }, typingSpeed);
    
    return () => clearInterval(typing);
  };
  
  // Animate comp card being dragged to dropzone
  const animateCompDrag = (comp, dropzoneIndex) => {
    const compIndex = availableComps.findIndex(c => c.id === comp.id);
    if (compIndex === -1) return;
    
    // Create clone of the comp card for animation
    const originalCard = compCardRefs.current[compIndex];
    const dropzone = dropzoneRefs.current[dropzoneIndex];
    
    if (!originalCard || !dropzone) return;
    
    const clone = originalCard.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = '1000';
    clone.style.width = `${originalCard.offsetWidth}px`;
    clone.style.height = `${originalCard.offsetHeight}px`;
    
    const originalRect = originalCard.getBoundingClientRect();
    const dropzoneRect = dropzone.getBoundingClientRect();
    
    clone.style.left = `${originalRect.left}px`;
    clone.style.top = `${originalRect.top}px`;
    document.body.appendChild(clone);
    
    // Highlight the original card
    originalCard.classList.add('tf-comp-card-selected');
    
    // Animate the clone to the dropzone
    setTimeout(() => {
      clone.style.transition = 'all 1s ease-in-out';
      clone.classList.add('tf-comp-card-dragging');
      clone.style.left = `${dropzoneRect.left}px`;
      clone.style.top = `${dropzoneRect.top}px`;
      clone.style.width = `${dropzoneRect.width}px`;
      clone.style.height = `${dropzoneRect.height}px`;
      
      // Highlight the dropzone
      dropzone.classList.add('tf-comp-grid-cell-active');
      
      setTimeout(() => {
        // Add the comp to selectedComps array
        setSelectedComps(prev => [...prev, comp]);
        
        // Remove the clone and update classes
        document.body.removeChild(clone);
        dropzone.classList.remove('tf-comp-grid-cell-active');
        dropzone.classList.add('tf-comp-grid-cell-selected');
        
        // Show a whisper effect with the SHAP tooltip
        if (dropzoneIndex === 0) {
          const shapTooltip = document.createElement('div');
          shapTooltip.className = 'tf-whisper-tooltip';
          shapTooltip.innerHTML = '<div class="whisper-value">+9,200 from GLA match</div>';
          
          dropzone.appendChild(shapTooltip);
          
          setTimeout(() => {
            shapTooltip.classList.add('whisper-fade-in');
            
            setTimeout(() => {
              shapTooltip.classList.add('whisper-fade-out');
              
              setTimeout(() => {
                if (dropzone.contains(shapTooltip)) {
                  dropzone.removeChild(shapTooltip);
                }
              }, 1000);
            }, 3000);
          }, 100);
        }
        
      }, 1000);
    }, 500);
  };
  
  // Control the walkthrough playback
  useEffect(() => {
    if (!isPlaying) return;
    
    const currentStepData = steps[currentStep];
    
    if (!currentStepData) {
      setIsPlaying(false);
      return;
    }
    
    // Type the narrative
    const clearTyping = typeNarrative(currentStepData.narrative);
    
    // Execute step action if defined
    if (currentStepData.action) {
      currentStepData.action();
    }
    
    // Advance to next step after duration
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, currentStepData.duration);
    
    return () => {
      clearTimeout(timer);
      clearTyping();
    };
  }, [currentStep, isPlaying]);
  
  // Render each of the comp cards
  const renderCompCards = () => {
    return (
      <div className="tf-comp-tray">
        {(availableComps || []).map((comp, index) => (
          <div 
            key={comp.id}
            className="tf-comp-card"
            ref={el => compCardRefs.current[index] = el}
          >
            <div className="comp-similarity">
              <span className="similarity-score">{comp.similarity || 90}%</span>
              <span className="similarity-label">Match</span>
            </div>
            <h4 className="comp-address">{comp.address}</h4>
            <div className="comp-details">
              <div className="comp-detail">
                <span className="detail-label">Price:</span>
                <span className="detail-value">${comp.price?.toLocaleString() || '450,000'}</span>
              </div>
              <div className="comp-detail">
                <span className="detail-label">SqFt:</span>
                <span className="detail-value">{comp.sqft || '2,250'}</span>
              </div>
              <div className="comp-detail">
                <span className="detail-label">Bed/Bath:</span>
                <span className="detail-value">{comp.bedrooms || 3}/{comp.bathrooms || 2}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render the comp dropzones
  const renderDropzones = () => {
    return (
      <div className="tf-comp-grid">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`tf-comp-grid-cell ${selectedComps[index] ? 'tf-comp-grid-cell-selected' : ''}`}
            ref={el => dropzoneRefs.current[index] = el}
          >
            {selectedComps[index] ? (
              <div className="selected-comp">
                <h4 className="comp-address">{selectedComps[index].address}</h4>
                <div className="comp-details">
                  <div className="comp-detail">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value">${selectedComps[index].price?.toLocaleString() || '450,000'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <span className="dropzone-placeholder">Drop Comp Here</span>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render SHAP visualization
  const renderSHAP = () => {
    if (!visibleSHAP) return null;
    
    return (
      <div className="tf-shap-visualization tf-viz-fade-in">
        <h3>Feature Impact Analysis (SHAP)</h3>
        
        <div className="shap-features">
          {visibleSHAP.features.map((feature, index) => (
            <div key={index} className="shap-feature">
              <div className="feature-header">
                <span className="feature-name">{feature.feature}</span>
                <span className={`feature-effect ${feature.effect > 0 ? 'tf-data-positive' : 'tf-data-negative'}`}>
                  {feature.effect > 0 ? '+' : ''}{feature.effect.toLocaleString()}
                </span>
              </div>
              <div className="feature-bar-container">
                <div 
                  className={`feature-bar ${feature.effect > 0 ? 'positive-bar' : 'negative-bar'}`}
                  style={{ 
                    width: `${Math.min(100, Math.abs(feature.effect) / 100)}%`, 
                    marginLeft: feature.effect < 0 ? 'auto' : 0 
                  }}
                ></div>
              </div>
              {feature.value && (
                <div className="feature-value">{feature.value}</div>
              )}
            </div>
          ))}
        </div>
        
        <div className="shap-summary">
          <div className="summary-item">
            <span className="summary-label">Base Value:</span>
            <span className="summary-value">${visibleSHAP.baseValue.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Adjusted Value:</span>
            <span className="summary-value">${visibleSHAP.outputValue.toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Net Adjustment:</span>
            <span className={`summary-value ${(visibleSHAP.outputValue - visibleSHAP.baseValue) > 0 ? 'tf-data-positive' : 'tf-data-negative'}`}>
              {(visibleSHAP.outputValue - visibleSHAP.baseValue) > 0 ? '+' : ''}
              ${(visibleSHAP.outputValue - visibleSHAP.baseValue).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  };
  
  // Render adjustments panel
  const renderAdjustments = () => {
    if (Object.keys(adjustments).length === 0) return null;
    
    return (
      <div className="tf-adjustments-panel tf-viz-fade-in">
        <h3>Suggested Adjustments</h3>
        
        <div className="adjustments-list">
          {Object.entries(adjustments).map(([feature, value], index) => (
            <div key={index} className="adjustment-item">
              <div className="adjustment-feature">{feature}</div>
              <div className={`adjustment-value ${value > 0 ? 'tf-data-positive' : 'tf-data-negative'}`}>
                {value > 0 ? '+' : ''}{value.toLocaleString()}
              </div>
              <div className="adjustment-slider">
                <input 
                  type="range"
                  min={value - 5000}
                  max={value + 5000}
                  step={100}
                  defaultValue={value}
                  className="slider"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="adjustment-actions">
          <button className="btn-apply-all">Apply All Adjustments</button>
          <button className="btn-reset">Reset</button>
        </div>
      </div>
    );
  };
  
  // Render step progress indicators
  const renderStepIndicators = () => {
    return (
      <div className="walkthrough-steps">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`step-indicator ${index === currentStep ? 'current-step' : ''} ${index < currentStep ? 'completed-step' : ''}`}
            onClick={() => {
              if (index <= currentStep) {
                setCurrentStep(index);
                setIsPlaying(true);
              }
            }}
          >
            {index + 1}
          </div>
        ))}
      </div>
    );
  };
  
  // Render walkthrough controls
  const renderControls = () => {
    return (
      <div className="walkthrough-controls">
        <button 
          className="control-button"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <button
          className="control-button"
          onClick={() => {
            if (currentStep > 0) {
              setCurrentStep(currentStep - 1);
              setIsPlaying(true);
            }
          }}
          disabled={currentStep === 0}
        >
          Previous
        </button>
        
        <button
          className="control-button"
          onClick={() => {
            if (currentStep < steps.length - 1) {
              setCurrentStep(currentStep + 1);
              setIsPlaying(true);
            }
          }}
          disabled={currentStep === steps.length - 1}
        >
          Next
        </button>
        
        <button
          className="control-button"
          onClick={() => {
            setCurrentStep(0);
            setSelectedComps([]);
            setVisibleSHAP(null);
            setAdjustments({});
            setIsFinalizing(false);
            setIsPlaying(true);
          }}
        >
          Restart
        </button>
      </div>
    );
  };
  
  return (
    <div className="cinematic-walkthrough">
      <div className="walkthrough-header">
        <div className="step-title">{steps[currentStep]?.title || 'TerraFusion Walkthrough'}</div>
        {renderStepIndicators()}
        {renderControls()}
      </div>
      
      <div className="narrative-container">
        <div className="narrative-text" ref={narrativeRef}>
          {narrative}
        </div>
      </div>
      
      <div className="walkthrough-content">
        <div className="walkthrough-column">
          <h3>Subject Property</h3>
          <div className="subject-property-card">
            <h4>{subjectProperty?.address || '123 Main St'}</h4>
            <div className="subject-details">
              <div className="subject-detail">
                <span className="detail-label">Estimated Value:</span>
                <span className="detail-value">${subjectProperty?.price?.toLocaleString() || '500,000'}</span>
              </div>
              <div className="subject-detail">
                <span className="detail-label">SqFt:</span>
                <span className="detail-value">{subjectProperty?.sqft || '2,400'}</span>
              </div>
              <div className="subject-detail">
                <span className="detail-label">Bed/Bath:</span>
                <span className="detail-value">{subjectProperty?.bedrooms || 4}/{subjectProperty?.bathrooms || 2.5}</span>
              </div>
            </div>
          </div>
          
          <h3>Available Comparables</h3>
          {renderCompCards()}
        </div>
        
        <div className="walkthrough-column">
          <h3>Selected Comparables</h3>
          {renderDropzones()}
          
          {visibleSHAP && renderSHAP()}
          
          {Object.keys(adjustments).length > 0 && renderAdjustments()}
          
          {isFinalizing && (
            <div className="finalize-actions tf-viz-fade-in">
              <button className="btn-finalize">Generate Valuation Report</button>
              <div className="whisper-hint">
                <div className="whisper-icon">💡</div>
                <div className="whisper-text">
                  Add one more comparable to increase confidence by 7%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CinematicWalkthrough;