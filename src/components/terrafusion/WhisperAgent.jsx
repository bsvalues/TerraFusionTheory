import React, { useState, useEffect, useRef } from 'react';
import '../../styles/terrafusion.css';

/**
 * WhisperAgent UX Layer
 * 
 * A lightweight AI overlay that provides context-aware hints 
 * when users hover over various elements of the interface.
 * 
 * Whispers explain what elements do and suggest next actions
 * based on current context and SHAP values.
 */
const WhisperAgent = ({
  targetRef,
  contextType, 
  contextData,
  position = 'bottom',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [whisperContent, setWhisperContent] = useState(null);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [whisperPosition, setWhisperPosition] = useState({ top: 0, left: 0 });
  
  const whisperRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Generate appropriate context-sensitive content based on the context type
  const generateContent = () => {
    if (!contextType || !contextData) return null;
    
    const contentMap = {
      // Whispers for when hovering over comps
      'comp': () => {
        const { similarity, address, attributes } = contextData;
        if (similarity > 90) {
          return {
            title: 'High Similarity Comp',
            message: `${address} is an excellent match at ${similarity}% similarity. Would you like to add it to your analysis?`,
            actionText: 'Add to Comparison Grid',
            icon: '📊'
          };
        } else if (similarity > 75) {
          return {
            title: 'Good Comparable',
            message: `${address} is a good match with ${similarity}% similarity. It may require some adjustments.`,
            actionText: 'Add with Adjustments',
            icon: '⚖️'
          };
        } else {
          return {
            title: 'Consider Carefully',
            message: `${address} has only ${similarity}% similarity. Are you sure you want to use this property?`,
            actionText: 'Review Differences',
            icon: '⚠️'
          };
        }
      },
      
      // Whispers for SHAP values
      'shap': () => {
        const { feature, effect, value } = contextData;
        const absEffect = Math.abs(effect);
        
        if (absEffect > 10000) {
          return {
            title: 'Major Impact Factor',
            message: `${feature} has a very significant ${effect > 0 ? 'positive' : 'negative'} impact of ${effect.toLocaleString()} on the valuation.`,
            actionText: 'Review This Adjustment',
            icon: '🔍'
          };
        } else if (absEffect > 5000) {
          return {
            title: 'Significant Factor',
            message: `${feature} has a notable impact of ${effect > 0 ? '+' : ''}${effect.toLocaleString()} on the final value.`,
            actionText: 'Adjust Value',
            icon: '📝'
          };
        } else {
          return {
            title: 'Minor Factor',
            message: `${feature} has a small impact of ${effect > 0 ? '+' : ''}${effect.toLocaleString()} on the valuation.`,
            actionText: 'Accept',
            icon: '✓'
          };
        }
      },
      
      // Whispers for adjustment sliders
      'adjustment': () => {
        const { feature, currentValue, recommendedValue, impact } = contextData;
        const diff = currentValue - recommendedValue;
        
        if (Math.abs(diff) > 5000) {
          return {
            title: 'Significant Override',
            message: `You've adjusted ${feature} by ${diff > 0 ? '+' : ''}${diff.toLocaleString()} from the recommended value. This has a ${impact > 0 ? 'positive' : 'negative'} impact of ${Math.abs(impact).toLocaleString()} on confidence.`,
            actionText: 'Justify Adjustment',
            icon: '📝'
          };
        } else if (diff === 0) {
          return {
            title: 'Recommended Value',
            message: `You're using the AI-recommended adjustment for ${feature}. This optimizes confidence in your valuation.`,
            actionText: 'Accept',
            icon: '✓'
          };
        } else {
          return {
            title: 'Manual Adjustment',
            message: `You've fine-tuned ${feature} by ${diff > 0 ? '+' : ''}${diff.toLocaleString()}. Would you like to record your reasoning?`,
            actionText: 'Add Note',
            icon: '📌'
          };
        }
      },
      
      // Whispers for empty dropzones
      'dropzone': () => {
        const { index, filledCount } = contextData;
        
        if (filledCount === 0) {
          return {
            title: 'Start Your Analysis',
            message: 'Drag your first comparable here to begin building your valuation grid.',
            actionText: 'Auto-Select Best Comp',
            icon: '👆'
          };
        } else if (filledCount < 3) {
          return {
            title: 'Add Another Comp',
            message: `Adding a ${filledCount + 1}${filledCount === 1 ? 'nd' : 'rd'} comp will increase valuation confidence by approximately 15%.`,
            actionText: 'Auto-Select Next Best',
            icon: '⬆️'
          };
        } else {
          return {
            title: 'Grid Complete',
            message: 'Your analysis grid is full. Consider replacing a less similar comp if needed.',
            actionText: 'Review Grid',
            icon: '✓'
          };
        }
      },
      
      // Whispers for the generate report button
      'report': () => {
        const { compCount, confidence } = contextData;
        
        if (compCount < 3) {
          return {
            title: 'Add More Comps',
            message: `Your report will be stronger with ${3 - compCount} more comparable${compCount === 2 ? '' : 's'}. Current confidence: ${confidence}%.`,
            actionText: 'Generate Anyway',
            icon: '📊'
          };
        } else if (confidence < 80) {
          return {
            title: 'Review Adjustments',
            message: `Confidence is at ${confidence}%. Consider reviewing your adjustments before generating the report.`,
            actionText: 'Review Suggestions',
            icon: '⚙️'
          };
        } else {
          return {
            title: 'Ready for Export',
            message: `Your valuation is ready with ${confidence}% confidence. Generate your report now?`,
            actionText: 'Generate Report',
            icon: '📄'
          };
        }
      },
      
      // Context type not recognized
      'default': () => {
        return {
          title: 'TerraFusion Assistant',
          message: 'Hover over elements to get contextual help and suggestions.',
          actionText: 'Got it',
          icon: '💡'
        };
      }
    };
    
    // Get the appropriate content generator or use default
    const contentGenerator = contentMap[contextType] || contentMap['default'];
    return contentGenerator();
  };
  
  // Calculate position based on target element and preferred position
  const calculatePosition = () => {
    if (!targetRef.current || !whisperRef.current) return;
    
    const targetRect = targetRef.current.getBoundingClientRect();
    const whisperRect = whisperRef.current.getBoundingClientRect();
    const buffer = 8; // space between target and whisper
    
    let top, left;
    
    switch (position) {
      case 'top':
        top = targetRect.top - whisperRect.height - buffer;
        left = targetRect.left + (targetRect.width / 2) - (whisperRect.width / 2);
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (whisperRect.height / 2);
        left = targetRect.right + buffer;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (whisperRect.height / 2);
        left = targetRect.left - whisperRect.width - buffer;
        break;
      case 'bottom':
      default:
        top = targetRect.bottom + buffer;
        left = targetRect.left + (targetRect.width / 2) - (whisperRect.width / 2);
        break;
    }
    
    // Ensure the whisper stays within the viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    if (left < 0) left = buffer;
    if (top < 0) top = buffer;
    if (left + whisperRect.width > viewport.width) left = viewport.width - whisperRect.width - buffer;
    if (top + whisperRect.height > viewport.height) top = viewport.height - whisperRect.height - buffer;
    
    setWhisperPosition({ top, left });
  };
  
  // Handle mouse entering target element
  const handleMouseEnter = () => {
    if (disabled || isMuted) return;
    
    // Generate content first
    const content = generateContent();
    setWhisperContent(content);
    
    // Show the whisper after a short delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setHasBeenSeen(true);
      
      // Position is calculated after render in useEffect
    }, 300); // small delay to prevent flicker on quick mouse movements
  };
  
  // Handle mouse leaving target element
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Hide the whisper with a slight delay
    setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };
  
  // Attach event listeners to target element
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    
    target.addEventListener('mouseenter', handleMouseEnter);
    target.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      target.removeEventListener('mouseenter', handleMouseEnter);
      target.removeEventListener('mouseleave', handleMouseLeave);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [targetRef.current, disabled, isMuted, contextType, contextData]);
  
  // Calculate position after the whisper becomes visible
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, whisperContent]);
  
  // Update content when context changes
  useEffect(() => {
    if (isVisible) {
      const content = generateContent();
      setWhisperContent(content);
    }
  }, [contextType, contextData]);
  
  // Handle clicking the mute button
  const handleMute = (e) => {
    e.stopPropagation();
    setIsMuted(true);
    setIsVisible(false);
  };
  
  // Handle clicking the action button
  const handleAction = (e) => {
    e.stopPropagation();
    
    // Here you would implement the specific action for this whisper
    console.log(`Action clicked for ${contextType} whisper:`, whisperContent);
    
    // For demo purposes, just hide the whisper
    setIsVisible(false);
  };
  
  // Don't render anything if disabled or no content
  if (disabled || !whisperContent) return null;
  
  return (
    <div 
      ref={whisperRef}
      className={`tf-whisper-agent ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        top: `${whisperPosition.top}px`,
        left: `${whisperPosition.left}px`,
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div className="whisper-header">
        <div className="whisper-icon">{whisperContent?.icon || '💡'}</div>
        <div className="whisper-title">{whisperContent?.title || 'TerraFusion Assistant'}</div>
        <button className="whisper-mute" onClick={handleMute}>
          <span className="mute-icon">🔇</span>
        </button>
      </div>
      
      <div className="whisper-message">
        {whisperContent?.message || 'Hover over elements to get contextual help.'}
      </div>
      
      <div className="whisper-actions">
        <button className="whisper-action-button" onClick={handleAction}>
          {whisperContent?.actionText || 'Got it'}
        </button>
        <button className="whisper-dismiss" onClick={() => setIsVisible(false)}>
          Dismiss
        </button>
      </div>
      
      <div className={`whisper-pointer whisper-pointer-${position}`}></div>
    </div>
  );
};

export default WhisperAgent;