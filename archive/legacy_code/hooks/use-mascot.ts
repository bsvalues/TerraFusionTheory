import { useContext } from 'react';
import { MascotTip, MascotMood, MascotAction } from '@/components/mascot/MascotCharacter';
import { useMascot as useMascotContext } from '@/components/mascot/MascotManager';

/**
 * Custom hook to access and control the mascot system
 * 
 * This hook provides access to the mascot context and exposes functions
 * to add tips, change the mascot's mood and actions, and control visibility.
 */
export const useMascot = () => {
  // Get the mascot context
  const context = useMascotContext();
  
  /**
   * Add a new coding tip
   * @param tip The tip to add (will automatically get an ID assigned)
   */
  const addTip = (tip: Omit<MascotTip, 'id'>) => {
    context.addTip(tip);
  };
  
  /**
   * Add an error tip with the specified message and optional code example
   * @param message The error message
   * @param code Optional code snippet
   * @param link Optional link to documentation
   */
  const addErrorTip = (message: string, code?: string, link?: string) => {
    context.addTip({
      type: 'error',
      text: message,
      code,
      link,
      mood: 'surprised',
      action: 'jump'
    });
  };
  
  /**
   * Add a warning tip with the specified message and optional code example
   * @param message The warning message
   * @param code Optional code snippet
   * @param link Optional link to documentation
   */
  const addWarningTip = (message: string, code?: string, link?: string) => {
    context.addTip({
      type: 'warning',
      text: message,
      code,
      link,
      mood: 'thinking',
      action: 'wave'
    });
  };
  
  /**
   * Add an info tip with the specified message and optional code example
   * @param message The info message
   * @param code Optional code snippet
   * @param link Optional link to documentation
   */
  const addInfoTip = (message: string, code?: string, link?: string) => {
    context.addTip({
      type: 'info',
      text: message,
      code,
      link,
      mood: 'happy',
      action: 'idle'
    });
  };
  
  /**
   * Add a success tip with the specified message and optional code example
   * @param message The success message
   * @param code Optional code snippet
   * @param link Optional link to documentation
   */
  const addSuccessTip = (message: string, code?: string, link?: string) => {
    context.addTip({
      type: 'success',
      text: message,
      code,
      link,
      mood: 'excited',
      action: 'dance'
    });
  };
  
  /**
   * Clear all tips
   */
  const clearTips = () => {
    context.clearTips();
  };
  
  /**
   * Set the mascot's mood
   * @param mood The mood to set
   */
  const setMascotMood = (mood: MascotMood) => {
    context.setMascotMood(mood);
  };
  
  /**
   * Set the mascot's action/animation
   * @param action The action to perform
   */
  const setMascotAction = (action: MascotAction) => {
    context.setMascotAction(action);
  };
  
  /**
   * Toggle whether the mascot is enabled or disabled
   */
  const toggleMascotEnabled = () => {
    context.toggleMascotEnabled();
  };
  
  /**
   * Check if the mascot is currently enabled
   */
  const isMascotEnabled = context.isMascotEnabled;
  
  return {
    addTip,
    addErrorTip,
    addWarningTip,
    addInfoTip,
    addSuccessTip,
    clearTips,
    setMascotMood,
    setMascotAction,
    toggleMascotEnabled,
    isMascotEnabled
  };
};

export default useMascot;