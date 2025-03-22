import { useMascot } from '@/components/mascot/MascotManager';
import { MascotMood, MascotAction, MascotTip } from '@/components/mascot/MascotCharacter';

// Re-export for convenience
export type { MascotMood, MascotAction, MascotTip };

/**
 * Hook to use the mascot functionality
 * 
 * This hook provides easy access to mascot operations like:
 * - Adding tips
 * - Setting mood and actions
 * - Toggling mascot visibility
 */
export function useMascotHelper() {
  const mascot = useMascot();
  
  /**
   * Show an informational tip from the mascot
   */
  const showInfoTip = (text: string, code?: string, link?: string) => {
    mascot.addTip({
      type: 'info',
      text,
      code,
      link,
      mood: 'happy',
      action: 'wave'
    });
  };
  
  /**
   * Show a success tip from the mascot
   */
  const showSuccessTip = (text: string, code?: string, link?: string) => {
    mascot.addTip({
      type: 'success',
      text,
      code,
      link,
      mood: 'excited',
      action: 'dance'
    });
  };
  
  /**
   * Show a warning tip from the mascot
   */
  const showWarningTip = (text: string, code?: string, link?: string) => {
    mascot.addTip({
      type: 'warning',
      text,
      code,
      link,
      mood: 'thinking',
      action: 'jump'
    });
  };
  
  /**
   * Show an error tip from the mascot
   */
  const showErrorTip = (text: string, code?: string, link?: string) => {
    mascot.addTip({
      type: 'error',
      text,
      code,
      link,
      mood: 'surprised',
      action: 'jump'
    });
  };
  
  /**
   * Show a debugging tip for common issues
   */
  const showDebuggingTip = (errorType: 'network' | 'typo' | 'state' | 'props' | 'syntax') => {
    switch (errorType) {
      case 'network':
        mascot.addTip({
          type: 'warning',
          text: 'Having network issues? Check your API endpoints and error handling.',
          code: `try {\n  const response = await fetch(url);\n  if (!response.ok) throw new Error('Network response was not ok');\n  const data = await response.json();\n} catch (error) {\n  console.error('Fetch error:', error);\n}`,
          mood: 'thinking',
          action: 'wave'
        });
        break;
      case 'typo':
        mascot.addTip({
          type: 'info',
          text: 'Often bugs are just simple typos! Double-check variable and property names.',
          mood: 'happy',
          action: 'wave'
        });
        break;
      case 'state':
        mascot.addTip({
          type: 'warning',
          text: 'React state updates are asynchronous. Use useEffect or callbacks to respond to state changes.',
          code: `useEffect(() => {\n  // Code that depends on someState\n  console.log('State value:', someState);\n}, [someState]);`,
          mood: 'thinking',
          action: 'wave'
        });
        break;
      case 'props':
        mascot.addTip({
          type: 'warning',
          text: 'Check if you\'re passing all required props to your components.',
          code: `// Use prop destructuring with default values\nfunction MyComponent({ prop1 = 'default', prop2 }) {\n  // Component code\n}`,
          mood: 'thinking',
          action: 'wave'
        });
        break;
      case 'syntax':
        mascot.addTip({
          type: 'error',
          text: 'Syntax errors are hard to spot! Check for missing brackets, semicolons, or quotes.',
          mood: 'surprised',
          action: 'jump'
        });
        break;
    }
  };
  
  /**
   * Show a fun coding fact or tip
   */
  const showFunFact = () => {
    const funFacts = [
      "Did you know? The term 'bug' comes from an actual moth found in Harvard's Mark II computer in 1947!",
      "JavaScript was created in just 10 days by Brendan Eich in 1995.",
      "The first computer programmer was Ada Lovelace, who wrote the first algorithm in the 1840s.",
      "The world's first computer game was 'Spacewar!' developed in 1962.",
      "The average programmer writes 10-50 lines of production code per day.",
      "There are over 700 different programming languages!",
      "Python was named after Monty Python, not the snake.",
      "The first computer mouse was made of wood in 1964.",
      "HTML is not technically a programming language; it's a markup language.",
      "About 70% of a developer's time is spent debugging."
    ];
    
    const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
    
    mascot.addTip({
      type: 'info',
      text: randomFact,
      mood: 'excited',
      action: 'jump'
    });
  };
  
  return {
    ...mascot,
    showInfoTip,
    showSuccessTip,
    showWarningTip,
    showErrorTip,
    showDebuggingTip,
    showFunFact
  };
}

export default useMascotHelper;