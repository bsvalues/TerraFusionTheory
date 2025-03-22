import React from 'react';
import { MascotMood, MascotAction } from './MascotCharacter';

interface MascotSvgProps {
  mood: MascotMood;
  action: MascotAction;
  size?: number;
}

const MascotSvg: React.FC<MascotSvgProps> = ({ 
  mood, 
  action, 
  size = 40 
}) => {
  // Animation keyframes based on the action
  const getAnimation = (action: MascotAction): React.CSSProperties => {
    switch (action) {
      case 'jump':
        return {
          animation: 'mascot-jump 0.5s ease-in-out infinite alternate'
        };
      case 'wave':
        return {
          animation: 'mascot-wave 0.7s ease-in-out'
        };
      case 'dance':
        return {
          animation: 'mascot-dance 0.8s ease-in-out infinite alternate'
        };
      case 'spin':
        return {
          animation: 'mascot-spin 1s linear'
        };
      case 'idle':
      default:
        return {
          animation: 'mascot-idle 3s ease-in-out infinite alternate'
        };
    }
  };

  // Expressions for different moods
  const getMoodExpression = (mood: MascotMood): { eyes: React.ReactNode, mouth: React.ReactNode } => {
    switch (mood) {
      case 'happy':
        return {
          eyes: (
            <>
              <circle cx="35%" cy="40%" r="8%" fill="#222" />
              <circle cx="65%" cy="40%" r="8%" fill="#222" />
            </>
          ),
          mouth: (
            <path d="M30 60 Q50 75 70 60" stroke="#222" strokeWidth="3" fill="none" />
          )
        };
      case 'thinking':
        return {
          eyes: (
            <>
              <circle cx="35%" cy="40%" r="8%" fill="#222" />
              <circle cx="65%" cy="40%" r="8%" fill="#222" />
              <line x1="20%" y1="30%" x2="40%" y2="30%" stroke="#222" strokeWidth="3" />
              <line x1="60%" y1="30%" x2="80%" y2="30%" stroke="#222" strokeWidth="3" />
            </>
          ),
          mouth: (
            <path d="M40 65 Q50 60 60 65" stroke="#222" strokeWidth="2.5" fill="none" />
          )
        };
      case 'surprised':
        return {
          eyes: (
            <>
              <circle cx="35%" cy="40%" r="10%" fill="#222" />
              <circle cx="65%" cy="40%" r="10%" fill="#222" />
              <circle cx="35%" cy="40%" r="4%" fill="white" />
              <circle cx="65%" cy="40%" r="4%" fill="white" />
            </>
          ),
          mouth: (
            <circle cx="50%" cy="65%" r="10%" fill="#222" />
          )
        };
      case 'sad':
        return {
          eyes: (
            <>
              <circle cx="35%" cy="40%" r="8%" fill="#222" />
              <circle cx="65%" cy="40%" r="8%" fill="#222" />
            </>
          ),
          mouth: (
            <path d="M30 65 Q50 55 70 65" stroke="#222" strokeWidth="3" fill="none" />
          )
        };
      case 'excited':
        return {
          eyes: (
            <>
              <path d="M25 35 L35 45 M45 35 L35 45" stroke="#222" strokeWidth="3" />
              <path d="M55 35 L65 45 M75 35 L65 45" stroke="#222" strokeWidth="3" />
            </>
          ),
          mouth: (
            <path d="M30 60 Q50 80 70 60" stroke="#222" strokeWidth="3" fill="none" />
          )
        };
      case 'sleepy':
        return {
          eyes: (
            <>
              <line x1="25%" y1="40%" x2="45%" y2="40%" stroke="#222" strokeWidth="3" />
              <line x1="55%" y1="40%" x2="75%" y2="40%" stroke="#222" strokeWidth="3" />
            </>
          ),
          mouth: (
            <path d="M40 65 Q50 70 60 65" stroke="#222" strokeWidth="2.5" fill="none" />
          )
        };
      default:
        return {
          eyes: (
            <>
              <circle cx="35%" cy="40%" r="8%" fill="#222" />
              <circle cx="65%" cy="40%" r="8%" fill="#222" />
            </>
          ),
          mouth: (
            <path d="M40 60 Q50 70 60 60" stroke="#222" strokeWidth="2.5" fill="none" />
          )
        };
    }
  };

  const expression = getMoodExpression(mood);
  const animationStyle = getAnimation(action);

  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        ...animationStyle
      }}
      className="relative"
    >
      <svg 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Main circular body */}
        <circle cx="50" cy="50" r="45" fill="#3b82f6" />
        
        {/* Expression (eyes and mouth) */}
        {expression.eyes}
        {expression.mouth}
        
        {/* Optional accessories based on mood */}
        {mood === 'thinking' && (
          <circle cx="80" cy="25" r="10" fill="white" stroke="#222" strokeWidth="1" />
        )}
        
        {mood === 'excited' && (
          <>
            <path d="M15 15 L25 5 M85 15 L75 5" stroke="#222" strokeWidth="2" />
            <path d="M15 35 L5 25 M85 35 L95 25" stroke="#222" strokeWidth="2" />
          </>
        )}
        
        {mood === 'sleepy' && (
          <path d="M70 25 Q75 15 85 20" stroke="#222" strokeWidth="2" fill="none" />
        )}
      </svg>
      
      {/* Animation styles are defined in global CSS */}
    </div>
  );
};

export default MascotSvg;