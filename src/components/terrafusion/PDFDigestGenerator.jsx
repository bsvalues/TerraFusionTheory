import React, { useState } from 'react';
import '../../styles/terrafusion.css';

/**
 * PDF Comp Digest Generator
 * 
 * Creates professional PDF reports that compile all the key information
 * about the valuation process including selected comps, adjustments,
 * AI vs human decisions, confidence metrics, and decision ledger.
 */
const PDFDigestGenerator = ({
  subjectProperty,
  selectedComps = [],
  adjustments = {},
  shapData = {},
  sessionHistory = [],
  onGenerate
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeOptions, setIncludeOptions] = useState({
    coverPage: true,
    executiveSummary: true,
    compAnalysis: true,
    adjustmentBreakdown: true,
    confidenceMetrics: true,
    aiHumanCollaboration: true,
    appendices: true
  });
  const [reportTitle, setReportTitle] = useState('');
  const [appraiserNotes, setAppraiserNotes] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Generate a default report title based on subject property
  const getDefaultReportTitle = () => {
    if (!subjectProperty) return 'Property Valuation Report';
    return `Valuation Report: ${subjectProperty.address || 'Subject Property'}`;
  };
  
  // Toggle an include option
  const toggleOption = (option) => {
    setIncludeOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  // Handle generating the PDF
  const handleGeneratePDF = () => {
    setIsGenerating(true);
    
    // In a real implementation, this would call a PDF generation service
    // For this demo, we'll simulate the generation with a timeout
    setTimeout(() => {
      setIsGenerating(false);
      
      if (onGenerate) {
        onGenerate({
          title: reportTitle || getDefaultReportTitle(),
          options: includeOptions,
          notes: appraiserNotes,
          timestamp: new Date().toISOString()
        });
      }
    }, 2000);
  };
  
  // Calculate confidence score based on comps and adjustments
  const calculateConfidence = () => {
    if (!selectedComps || selectedComps.length === 0) return 0;
    
    // Base confidence on number of comps (up to 3)
    let baseConfidence = Math.min(selectedComps.length * 20, 60);
    
    // Add confidence based on average similarity score
    const avgSimilarity = selectedComps.reduce((sum, comp) => sum + (comp.similarity || 80), 0) / selectedComps.length;
    let similarityConfidence = (avgSimilarity / 100) * 30;
    
    // Adjustment factor (reduce confidence if there are many large adjustments)
    let adjustmentFactor = 1;
    if (Object.keys(adjustments).length > 0) {
      const adjustmentCount = Object.keys(adjustments).length;
      const largeAdjustments = Object.values(adjustments).filter(val => Math.abs(val) > 10000).length;
      
      adjustmentFactor = 1 - (largeAdjustments * 0.05);
    }
    
    const finalConfidence = Math.round((baseConfidence + similarityConfidence) * adjustmentFactor);
    return Math.min(100, Math.max(0, finalConfidence));
  };
  
  // Preview what the report will include
  const renderReportPreview = () => {
    const confidence = calculateConfidence();
    
    return (
      <div className="tf-report-preview">
        <div className="preview-header">
          <h3>Report Preview</h3>
          <div className="confidence-meter">
            <div className="confidence-label">Confidence:</div>
            <div className="confidence-bar-container">
              <div 
                className="confidence-bar" 
                style={{ 
                  width: `${confidence}%`,
                  backgroundColor: confidence > 80 ? 'var(--success)' : 
                                   confidence > 60 ? 'var(--warning)' : 
                                   'var(--danger)'
                }}
              ></div>
            </div>
            <div className="confidence-value">{confidence}%</div>
          </div>
        </div>
        
        <div className="preview-content">
          {includeOptions.coverPage && (
            <div className="preview-section">
              <div className="preview-section-icon">📄</div>
              <div className="preview-section-details">
                <div className="preview-section-title">Cover Page</div>
                <div className="preview-section-description">
                  TerraFusion branded cover with property details and valuation summary
                </div>
              </div>
            </div>
          )}
          
          {includeOptions.executiveSummary && (
            <div className="preview-section">
              <div className="preview-section-icon">📊</div>
              <div className="preview-section-details">
                <div className="preview-section-title">Executive Summary</div>
                <div className="preview-section-description">
                  Key findings and final valuation with confidence metrics
                </div>
              </div>
            </div>
          )}
          
          {includeOptions.compAnalysis && (
            <div className="preview-section">
              <div className="preview-section-icon">🏠</div>
              <div className="preview-section-details">
                <div className="preview-section-title">Comparable Analysis</div>
                <div className="preview-section-description">
                  {selectedComps.length} comparable properties with similarity metrics and key features
                </div>
              </div>
            </div>
          )}
          
          {includeOptions.adjustmentBreakdown && (
            <div className="preview-section">
              <div className="preview-section-icon">⚖️</div>
              <div className="preview-section-details">
                <div className="preview-section-title">Adjustment Breakdown</div>
                <div className="preview-section-description">
                  Detailed explanation of {Object.keys(adjustments).length} adjustments with SHAP visualizations
                </div>
              </div>
            </div>
          )}
          
          {includeOptions.confidenceMetrics && (
            <div className="preview-section">
              <div className="preview-section-icon">📈</div>
              <div className="preview-section-details">
                <div className="preview-section-title">Confidence Metrics</div>
                <div className="preview-section-description">
                  Statistical analysis of valuation confidence and potential variance
                </div>
              </div>
            </div>
          )}
          
          {includeOptions.aiHumanCollaboration && (
            <div className="preview-section">
              <div className="preview-section-icon">🤝</div>
              <div className="preview-section-details">
                <div className="preview-section-title">AI/Human Collaboration</div>
                <div className="preview-section-description">
                  Transparent documentation of AI suggestions and human decisions
                </div>
              </div>
            </div>
          )}
          
          {includeOptions.appendices && (
            <div className="preview-section">
              <div className="preview-section-icon">📎</div>
              <div className="preview-section-details">
                <div className="preview-section-title">Appendices</div>
                <div className="preview-section-description">
                  Supporting data, market conditions, and additional property information
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="tf-pdf-digest-generator">
      <div className="generator-header">
        <h3>Valuation Report Generator</h3>
        <p className="generator-description">
          Generate a comprehensive report that documents your valuation process and findings. 
          All adjustments, comparables, and confidence metrics will be included.
        </p>
      </div>
      
      <div className="generator-form">
        <div className="form-group">
          <label htmlFor="report-title">Report Title</label>
          <input
            id="report-title"
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder={getDefaultReportTitle()}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="appraiser-notes">Appraiser Notes (Optional)</label>
          <textarea
            id="appraiser-notes"
            value={appraiserNotes}
            onChange={(e) => setAppraiserNotes(e.target.value)}
            placeholder="Add any additional context, observations, or explanations..."
            className="form-textarea"
            rows={4}
          />
        </div>
        
        <div className="form-section">
          <div className="section-header" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
            <h4>Report Sections</h4>
            <span className="toggle-icon">{showAdvancedOptions ? '▼' : '▶'}</span>
          </div>
          
          {showAdvancedOptions && (
            <div className="section-options">
              {Object.entries(includeOptions).map(([option, isIncluded]) => (
                <div key={option} className="option-checkbox">
                  <input
                    type="checkbox"
                    id={`option-${option}`}
                    checked={isIncluded}
                    onChange={() => toggleOption(option)}
                  />
                  <label htmlFor={`option-${option}`}>
                    {option.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {renderReportPreview()}
      
      <div className="generator-actions">
        <button
          className="btn-generate-pdf"
          onClick={handleGeneratePDF}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate PDF Report'}
        </button>
        <div className="generator-note">
          This will create a branded TerraFusion report with all selected sections.
        </div>
      </div>
    </div>
  );
};

export default PDFDigestGenerator;