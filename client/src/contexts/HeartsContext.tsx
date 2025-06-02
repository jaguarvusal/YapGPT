import React, { createContext, useContext, useState, useEffect } from 'react';

interface HeartsContextType {
  hearts: number;
  loseHeart: () => void;
  resetHearts: () => void;
  timeUntilRegeneration: number | null;
}

const HeartsContext = createContext<HeartsContextType | undefined>(undefined);

export const HeartsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hearts, setHearts] = useState(() => {
    const savedHearts = localStorage.getItem('hearts');
    return savedHearts ? parseInt(savedHearts, 10) : 5;
  });

  const [timeUntilRegeneration, setTimeUntilRegeneration] = useState<number | null>(() => {
    const savedTimer = localStorage.getItem('heartRegenerationTimer');
    if (!savedTimer) return null;
    const timeLeft = parseInt(savedTimer, 10) - Date.now();
    return timeLeft > 0 ? timeLeft : null;
  });

  useEffect(() => {
    localStorage.setItem('hearts', hearts.toString());
    
    // If hearts reach 0, start the 24-hour timer
    if (hearts === 0 && !timeUntilRegeneration) {
      const regenerationTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
      localStorage.setItem('heartRegenerationTimer', regenerationTime.toString());
      setTimeUntilRegeneration(24 * 60 * 60 * 1000);
    }
  }, [hearts, timeUntilRegeneration]);

  // Timer effect
  useEffect(() => {
    if (!timeUntilRegeneration) return;

    const timer = setInterval(() => {
      setTimeUntilRegeneration(prev => {
        if (!prev) return null;
        const newTime = prev - 1000;
        
        if (newTime <= 0) {
          clearInterval(timer);
          localStorage.removeItem('heartRegenerationTimer');
          setHearts(5);
          return null;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeUntilRegeneration]);

  const loseHeart = () => {
    setHearts(prev => Math.max(0, prev - 1));
  };

  const resetHearts = () => {
    setHearts(5);
    setTimeUntilRegeneration(null);
    localStorage.removeItem('heartRegenerationTimer');
  };

  return (
    <HeartsContext.Provider value={{ hearts, loseHeart, resetHearts, timeUntilRegeneration }}>
      {children}
    </HeartsContext.Provider>
  );
};

export const useHearts = () => {
  const context = useContext(HeartsContext);
  if (context === undefined) {
    throw new Error('useHearts must be used within a HeartsProvider');
  }
  return context;
}; 