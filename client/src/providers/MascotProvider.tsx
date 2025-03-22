import React from 'react';
import { MascotProvider as MascotSystem } from '@/components/mascot/MascotManager';

/**
 * Root Mascot Provider
 * 
 * Wraps the application with the mascot system for providing playful debugging tips
 */
export const MascotProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <MascotSystem
      defaultEnabled={true}
      mascotName="Cody"
      defaultMood="happy"
      defaultAction="wave"
    >
      {children}
    </MascotSystem>
  );
};

export default MascotProvider;