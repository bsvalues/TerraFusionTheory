/**
 * Property Color Schemes
 * 
 * This utility provides color schemes for different property types
 * to create a consistent visual language throughout the application.
 */

// Property type identifier types
export type PropertyType = 
  | 'single_family'
  | 'multi_family'
  | 'condo'
  | 'townhouse'
  | 'commercial'
  | 'industrial'
  | 'land'
  | 'not_specified';

// Color scheme interface
export interface PropertyColorScheme {
  primary: string;     // Main color for headers, buttons, etc.
  secondary: string;   // Secondary accent color
  text: string;        // Text color on primary background
  icon: string;        // Icon associated with this property type
  badge: string;       // Badge background color
  badgeText: string;   // Badge text color
  light: string;       // Lighter version for backgrounds
  dark: string;        // Darker version for borders/shadows
  gradient: string;    // CSS gradient for visual elements
}

// Property icon paths
export const propertyIcons = {
  single_family: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  multi_family: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  condo: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  townhouse: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
  commercial: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5',
  industrial: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  land: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  not_specified: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
};

// Color schemes for each property type
export const propertyColorSchemes: Record<PropertyType, PropertyColorScheme> = {
  single_family: {
    primary: '#3b82f6',  // Blue
    secondary: '#60a5fa',
    text: '#ffffff',
    icon: propertyIcons.single_family,
    badge: '#dbeafe',
    badgeText: '#1e40af',
    light: '#eff6ff',
    dark: '#1e40af',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  },
  multi_family: {
    primary: '#8b5cf6',  // Purple
    secondary: '#a78bfa',
    text: '#ffffff',
    icon: propertyIcons.multi_family,
    badge: '#f5f3ff',
    badgeText: '#5b21b6',
    light: '#f5f3ff',
    dark: '#5b21b6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  condo: {
    primary: '#14b8a6',  // Teal
    secondary: '#2dd4bf',
    text: '#ffffff',
    icon: propertyIcons.condo,
    badge: '#ccfbf1',
    badgeText: '#0f766e',
    light: '#f0fdfa',
    dark: '#0f766e',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)'
  },
  townhouse: {
    primary: '#f59e0b',  // Amber
    secondary: '#fbbf24',
    text: '#ffffff',
    icon: propertyIcons.townhouse,
    badge: '#fef3c7',
    badgeText: '#b45309',
    light: '#fffbeb',
    dark: '#b45309',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  commercial: {
    primary: '#ef4444',  // Red
    secondary: '#f87171',
    text: '#ffffff',
    icon: propertyIcons.commercial,
    badge: '#fee2e2',
    badgeText: '#b91c1c',
    light: '#fef2f2',
    dark: '#b91c1c',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  },
  industrial: {
    primary: '#64748b',  // Slate
    secondary: '#94a3b8',
    text: '#ffffff',
    icon: propertyIcons.industrial,
    badge: '#f1f5f9',
    badgeText: '#334155',
    light: '#f8fafc',
    dark: '#334155',
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
  },
  land: {
    primary: '#10b981',  // Emerald
    secondary: '#34d399',
    text: '#ffffff',
    icon: propertyIcons.land,
    badge: '#d1fae5',
    badgeText: '#065f46',
    light: '#ecfdf5',
    dark: '#065f46',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  not_specified: {
    primary: '#6b7280',  // Gray
    secondary: '#9ca3af',
    text: '#ffffff',
    icon: propertyIcons.not_specified,
    badge: '#f3f4f6',
    badgeText: '#374151',
    light: '#f9fafb',
    dark: '#374151',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
  }
};

/**
 * Get color scheme for a property type
 * @param propertyType The property type
 * @returns The color scheme object
 */
export function getPropertyColorScheme(propertyType: string): PropertyColorScheme {
  return propertyColorSchemes[propertyType as PropertyType] || propertyColorSchemes.not_specified;
}

/**
 * Get a property type badge with appropriate styling
 * @param propertyType The property type
 * @returns CSS class names for the badge
 */
export function getPropertyBadgeClasses(propertyType: string): string {
  const scheme = getPropertyColorScheme(propertyType);
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[${scheme.badge}] text-[${scheme.badgeText}]`;
}

/**
 * Get a human-readable property type label
 */
export function getPropertyTypeLabel(propertyType: string): string {
  const labels: Record<string, string> = {
    single_family: 'Single Family',
    multi_family: 'Multi-Family',
    condo: 'Condominium',
    townhouse: 'Townhouse',
    commercial: 'Commercial',
    industrial: 'Industrial',
    land: 'Vacant Land',
    not_specified: 'Not Specified'
  };
  
  return labels[propertyType] || 'Unknown';
}

/**
 * Get a property icon SVG path based on type
 */
export function getPropertyIconPath(propertyType: string): string {
  return (propertyIcons as Record<string, string>)[propertyType] || propertyIcons.not_specified;
}