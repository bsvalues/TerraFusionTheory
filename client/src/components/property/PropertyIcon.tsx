/**
 * PropertyIcon Component
 * 
 * Displays an icon representing a property type with adaptive color scheme.
 */

import React from 'react';
import { getPropertyColorScheme } from '@/utils/propertyColorSchemes';

interface PropertyIconProps {
  propertyType: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'outline' | 'solid' | 'colored';
  className?: string;
}

/**
 * PropertyIcon displays a property type icon with the appropriate color scheme
 */
export default function PropertyIcon({
  propertyType,
  size = 'md',
  variant = 'outline',
  className = ''
}: PropertyIconProps) {
  const colorScheme = getPropertyColorScheme(propertyType);
  
  // Size variations
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  // Variant styling
  const getIconStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          fill: colorScheme.primary,
          stroke: 'none',
          className: ''
        };
      case 'colored':
        return {
          fill: 'none',
          stroke: colorScheme.primary,
          className: ''
        };
      case 'outline':
      default:
        return {
          fill: 'none',
          stroke: 'currentColor',
          className: ''
        };
    }
  };
  
  const iconStyles = getIconStyles();
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${sizeClasses[size]} ${iconStyles.className} ${className}`}
      fill={iconStyles.fill}
      viewBox="0 0 24 24" 
      stroke={iconStyles.stroke}
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={variant === 'solid' ? 0 : 2}
        d={colorScheme.icon} 
      />
    </svg>
  );
}