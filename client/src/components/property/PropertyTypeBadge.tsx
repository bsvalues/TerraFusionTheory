/**
 * PropertyTypeBadge Component
 * 
 * A customizable badge that shows property type with appropriate color scheme.
 */

import React from 'react';
import { getPropertyColorScheme, getPropertyTypeLabel } from '@/utils/propertyColorSchemes';

interface PropertyTypeBadgeProps {
  propertyType: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * PropertyTypeBadge displays a property type with an adaptive color scheme
 */
export default function PropertyTypeBadge({
  propertyType,
  size = 'md',
  showIcon = true,
  className = ''
}: PropertyTypeBadgeProps) {
  const colorScheme = getPropertyColorScheme(propertyType);
  const label = getPropertyTypeLabel(propertyType);
  
  // Size variations
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        backgroundColor: colorScheme.badge,
        color: colorScheme.badgeText
      }}
    >
      {showIcon && (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          style={{ color: colorScheme.badgeText }}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d={colorScheme.icon} 
          />
        </svg>
      )}
      {label}
    </span>
  );
}