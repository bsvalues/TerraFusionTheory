import React from 'react';
import { MascotMood } from './MascotCharacter';

interface MascotSvgProps {
  mood: MascotMood;
  size?: number;
  className?: string;
}

const MascotSvg: React.FC<MascotSvgProps> = ({ 
  mood, 
  size = 50, 
  className = "" 
}) => {
  // Shared style for all expressions
  const baseStyle = {
    width: size,
    height: size
  };
  
  // Body color - a cute light blue
  const bodyColor = "#5FB0D5";
  // Dark blue for outlines and details
  const outlineColor = "#2A5978";
  
  /**
   * Render the appropriate face based on mood
   */
  const renderFace = () => {
    switch (mood) {
      case 'happy':
        return (
          <>
            {/* Happy eyes (upside-down u shape) */}
            <path 
              d="M18,22 Q20,18 22,22" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            <path 
              d="M28,22 Q30,18 32,22" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            
            {/* Happy smile */}
            <path 
              d="M20,30 Q25,34 30,30" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </>
        );
        
      case 'thinking':
        return (
          <>
            {/* Neutral eyes (dots) */}
            <circle cx="20" cy="22" r="1.5" fill={outlineColor} />
            <circle cx="30" cy="22" r="1.5" fill={outlineColor} />
            
            {/* Thinking mouth (straight line) */}
            <path 
              d="M21,31 L29,31" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            
            {/* Thinking bubble */}
            <circle cx="38" cy="15" r="3" fill={outlineColor} />
          </>
        );
        
      case 'surprised':
        return (
          <>
            {/* Surprised eyes (circles) */}
            <circle cx="20" cy="22" r="2.5" fill={outlineColor} />
            <circle cx="30" cy="22" r="2.5" fill={outlineColor} />
            
            {/* Surprised mouth (small o) */}
            <circle cx="25" cy="31" r="2" fill={outlineColor} />
          </>
        );
        
      case 'sleepy':
        return (
          <>
            {/* Sleepy eyes (straight lines) */}
            <path 
              d="M17,22 L23,22" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            <path 
              d="M27,22 L33,22" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            
            {/* Sleepy mouth (zzz) */}
            <text 
              x="25" 
              y="32" 
              textAnchor="middle" 
              fontSize="8" 
              fill={outlineColor}
            >
              zzz
            </text>
          </>
        );
        
      case 'excited':
        return (
          <>
            {/* Excited eyes (stars) */}
            <path 
              d="M20,22 L20,19 L22,22 L19,20 L23,20" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path 
              d="M30,22 L30,19 L32,22 L29,20 L33,20" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Excited mouth (big smile with teeth) */}
            <path 
              d="M18,30 Q25,36 32,30" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
            <path 
              d="M22,32 L28,32" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1" 
              strokeLinecap="round"
            />
          </>
        );
        
      default:
        return (
          <>
            {/* Default eyes (simple circles) */}
            <circle cx="20" cy="22" r="1.5" fill={outlineColor} />
            <circle cx="30" cy="22" r="1.5" fill={outlineColor} />
            
            {/* Default mouth (simple curve) */}
            <path 
              d="M20,30 Q25,33 30,30" 
              fill="none" 
              stroke={outlineColor} 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </>
        );
    }
  };
  
  return (
    <svg 
      viewBox="0 0 50 50" 
      style={baseStyle} 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="25" cy="25" r="23" fill="white" />
      
      {/* Body */}
      <circle cx="25" cy="25" r="20" fill={bodyColor} />
      
      {/* Antenna */}
      <path 
        d="M25,5 Q20,0 15,3" 
        fill="none" 
        stroke={outlineColor} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <circle cx="13" cy="3" r="2" fill="#FFC107" />
      
      {/* Face based on mood */}
      {renderFace()}
      
      {/* Code symbol on belly */}
      <path 
        d="M18,38 L15,42 L18,46" 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path 
        d="M32,38 L35,42 L32,46" 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="2" 
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path 
        d="M28,36 L22,48" 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default MascotSvg;