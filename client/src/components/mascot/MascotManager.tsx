import React, { useState, useEffect, createContext, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MascotCharacter, { MascotTip, MascotMood, MascotAction } from './MascotCharacter';

// Debugging patterns to look for in console logs and errors
interface DebugPattern {
  pattern: RegExp;
  tipGenerator: (match: RegExpMatchArray) => MascotTip;
}

// Context for the mascot manager
interface MascotContextType {
  addTip: (tip: Omit<MascotTip, 'id'>) => void;
  clearTips: () => void;
  setMascotMood: (mood: MascotMood) => void;
  setMascotAction: (action: MascotAction) => void;
  toggleMascotEnabled: () => void;
  isMascotEnabled: boolean;
}

const MascotContext = createContext<MascotContextType | undefined>(undefined);

// Hook to use the mascot context
export const useMascot = () => {
  const context = useContext(MascotContext);
  if (context === undefined) {
    throw new Error('useMascot must be used within a MascotProvider');
  }
  return context;
};

interface MascotManagerProps {
  children: React.ReactNode;
  defaultEnabled?: boolean;
  mascotName?: string;
  defaultMood?: MascotMood;
  defaultAction?: MascotAction;
}

export const MascotProvider: React.FC<MascotManagerProps> = ({
  children,
  defaultEnabled = true,
  mascotName = "Cody",
  defaultMood = "happy",
  defaultAction = "idle",
}) => {
  const [tips, setTips] = useState<MascotTip[]>([]);
  const [mascotMood, setMascotMood] = useState<MascotMood>(defaultMood);
  const [mascotAction, setMascotAction] = useState<MascotAction>(defaultAction);
  const [isMascotEnabled, setIsMascotEnabled] = useState<boolean>(defaultEnabled);
  
  // Define common debugging patterns
  const debugPatterns: DebugPattern[] = [
    {
      pattern: /TypeError: (\w+) is not a function/i,
      tipGenerator: (match) => ({
        type: 'error',
        text: `Oops! It looks like "${match[1]}" is not a function. Make sure it's defined correctly!`,
        code: `// Check if ${match[1]} is properly defined and callable\nconsole.log(typeof ${match[1]});`,
        mood: 'surprised',
        action: 'jump'
      })
    },
    {
      pattern: /Cannot read properties of (undefined|null) \(reading '(.+)'\)/i,
      tipGenerator: (match) => ({
        type: 'error',
        text: `You're trying to access the property "${match[2]}" on something that's ${match[1]}!`,
        code: `// Add a safety check:\nconst value = obj?.${match[2]} || fallbackValue;`,
        mood: 'thinking',
        action: 'wave'
      })
    },
    {
      pattern: /Failed to fetch|Network Error/i,
      tipGenerator: () => ({
        type: 'warning',
        text: `Looks like we have a network issue. Check your connection or API endpoint.`,
        code: `// Add error handling to your fetch:\ntry {\n  const response = await fetch(url);\n  // ...\n} catch (err) {\n  console.error('Network error:', err);\n}`,
        mood: 'thinking',
        action: 'wave'
      })
    },
    {
      pattern: /undefined is not an object/i,
      tipGenerator: () => ({
        type: 'error',
        text: `You're trying to work with an object that doesn't exist yet!`,
        code: `// Use optional chaining to safely access nested properties:\nconst value = obj?.prop?.nestedProp;`,
        mood: 'surprised',
        action: 'jump'
      })
    },
    {
      pattern: /Maximum update depth exceeded/i,
      tipGenerator: () => ({
        type: 'error',
        text: `Infinite loop alert! Check your useEffect dependencies or state updates.`,
        code: `// Make sure your useEffect doesn't update its own dependencies:\nuseEffect(() => {\n  // Effect code\n}, [dependencies]); // Double-check these!`,
        mood: 'surprised',
        action: 'spin'
      })
    },
    {
      pattern: /Invalid hook call/i,
      tipGenerator: () => ({
        type: 'error',
        text: `Hooks can only be called inside function components or custom hooks!`,
        link: 'https://reactjs.org/docs/hooks-rules.html',
        mood: 'thinking',
        action: 'wave'
      })
    },
    {
      pattern: /Memory leak.*React/i,
      tipGenerator: () => ({
        type: 'warning',
        text: `Possible memory leak! Make sure to clean up subscriptions in useEffect.`,
        code: `useEffect(() => {\n  // Setup code\n  return () => {\n    // Cleanup code\n  };\n}, []);`,
        mood: 'thinking',
        action: 'wave'
      })
    },
    {
      pattern: /each child in a list should have a unique "key" prop/i,
      tipGenerator: () => ({
        type: 'warning',
        text: `Don't forget to add a unique key prop when mapping arrays in React!`,
        code: `{items.map(item => (\n  <Component key={item.id} {...item} />\n))}`,
        mood: 'thinking',
        action: 'wave'
      })
    },
    {
      pattern: /CORS policy/i,
      tipGenerator: () => ({
        type: 'error',
        text: `CORS issue detected! Your browser is blocking cross-origin requests.`,
        link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
        mood: 'surprised',
        action: 'jump'
      })
    },
    {
      pattern: /Uncaught ReferenceError: (.*) is not defined/i,
      tipGenerator: (match) => ({
        type: 'error',
        text: `"${match[1]}" is not defined. Did you forget to import it or declare it?`,
        code: `// Make sure to import or declare "${match[1]}" before using it\nimport { ${match[1]} } from './somewhere';`,
        mood: 'thinking',
        action: 'wave'
      })
    }
  ];
  
  // Funny random tips to show occasionally
  const funTips: Omit<MascotTip, 'id'>[] = [
    {
      type: 'info',
      text: "Did you know? The first bug was an actual moth found in Harvard's Mark II computer in 1947!",
      link: 'https://en.wikipedia.org/wiki/Debugging#Etymology',
      mood: 'excited',
      action: 'jump'
    },
    {
      type: 'info',
      text: "Pro tip: 'console.table()' is great for displaying objects and arrays in a neat table format!",
      code: `console.table([{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }]);`,
      mood: 'happy',
      action: 'dance'
    },
    {
      type: 'info',
      text: "Remember, 90% of coding is debugging and the other 10% is writing bugs.",
      mood: 'thinking',
      action: 'wave'
    },
    {
      type: 'info',
      text: "Try rubber duck debugging! Explain your code to a rubber duck (or me!) line by line.",
      mood: 'excited',
      action: 'dance'
    },
    {
      type: 'info',
      text: "Need a break? The Pomodoro Technique suggests working for 25 minutes, then taking a 5-minute break.",
      mood: 'sleepy',
      action: 'idle'
    }
  ];
  
  // Console error interceptor
  useEffect(() => {
    if (!isMascotEnabled) return;
    
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    // Override console.error to catch errors
    console.error = function(...args) {
      // Call original console.error
      originalConsoleError.apply(console, args);
      
      // Convert arguments to string for pattern matching
      const errorString = args.map(arg => String(arg)).join(' ');
      
      // Check if this error matches any of our patterns
      for (const { pattern, tipGenerator } of debugPatterns) {
        const match = errorString.match(pattern);
        if (match) {
          // Create a tip from the match
          const newTip = {
            id: uuidv4(),
            ...tipGenerator(match)
          };
          
          // Add the tip
          setTips(prevTips => [...prevTips, newTip]);
          break; // Only add one tip per error
        }
      }
    };
    
    // Override console.warn to catch warnings
    console.warn = function(...args) {
      // Call original console.warn
      originalConsoleWarn.apply(console, args);
      
      // Convert arguments to string for pattern matching
      const warnString = args.map(arg => String(arg)).join(' ');
      
      // Check if this warning matches any of our patterns
      for (const { pattern, tipGenerator } of debugPatterns) {
        const match = warnString.match(pattern);
        if (match) {
          // Create a tip from the match
          const newTip = {
            id: uuidv4(),
            ...tipGenerator(match)
          };
          
          // Add the tip
          setTips(prevTips => [...prevTips, newTip]);
          break; // Only add one tip per warning
        }
      }
    };
    
    // Intercept global errors
    const handleGlobalError = (event: ErrorEvent) => {
      const errorString = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
      
      // Check if this error matches any of our patterns
      for (const { pattern, tipGenerator } of debugPatterns) {
        const match = errorString.match(pattern);
        if (match) {
          // Create a tip from the match
          const newTip = {
            id: uuidv4(),
            ...tipGenerator(match)
          };
          
          // Add the tip
          setTips(prevTips => [...prevTips, newTip]);
          break; // Only add one tip per error
        }
      }
    };
    
    // Add global error listener
    window.addEventListener('error', handleGlobalError);
    
    // Show a random fun tip occasionally (every 10 minutes)
    const funTipInterval = setInterval(() => {
      // 20% chance to show a fun tip
      if (Math.random() < 0.2) {
        const randomFunTip = funTips[Math.floor(Math.random() * funTips.length)];
        addTip(randomFunTip);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    // Cleanup
    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener('error', handleGlobalError);
      clearInterval(funTipInterval);
    };
  }, [isMascotEnabled]);
  
  // Add a new tip
  const addTip = (tip: Omit<MascotTip, 'id'>) => {
    if (!isMascotEnabled) return;
    
    const newTip: MascotTip = {
      id: uuidv4(),
      ...tip
    };
    
    setTips(prevTips => [...prevTips, newTip]);
  };
  
  // Clear all tips
  const clearTips = () => {
    setTips([]);
  };
  
  // Handle tip dismissal
  const handleTipDismiss = (tipId: string) => {
    setTips(prevTips => prevTips.filter(tip => tip.id !== tipId));
  };
  
  // Handle tip action (copy code or open link)
  const handleTipAction = (tipId: string) => {
    // Find tip by ID
    const tip = tips.find(t => t.id === tipId);
    
    // Log action for analytics
    if (tip) {
      console.log(`Mascot tip action: ${tip.type} - ${tip.text.substring(0, 30)}...`);
    }
  };
  
  // Toggle mascot enabled/disabled
  const toggleMascotEnabled = () => {
    setIsMascotEnabled(prev => !prev);
  };
  
  // Context value
  const contextValue: MascotContextType = {
    addTip,
    clearTips,
    setMascotMood,
    setMascotAction,
    toggleMascotEnabled,
    isMascotEnabled
  };
  
  return (
    <MascotContext.Provider value={contextValue}>
      {children}
      
      {/* Only render the mascot if enabled */}
      {isMascotEnabled && (
        <MascotCharacter
          name={mascotName}
          defaultMood={mascotMood}
          defaultAction={mascotAction}
          tips={tips}
          onTipDismiss={handleTipDismiss}
          onTipAction={handleTipAction}
        />
      )}
    </MascotContext.Provider>
  );
};

export default MascotProvider;