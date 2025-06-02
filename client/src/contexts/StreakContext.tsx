import React, { createContext, useContext, useState, useEffect } from 'react';

interface StreakContextType {
  streak: number;
  lastLoginDate: string | null;
  showStreakPopup: boolean;
  setShowStreakPopup: (show: boolean) => void;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streak, setStreak] = useState(() => {
    const savedStreak = localStorage.getItem('streak');
    return savedStreak ? parseInt(savedStreak, 10) : 0;
  });

  const [lastLoginDate, setLastLoginDate] = useState<string | null>(() => {
    return localStorage.getItem('lastLoginDate');
  });

  const [showStreakPopup, setShowStreakPopup] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    if (!lastLoginDate) {
      // First time user
      setStreak(1);
      setLastLoginDate(today);
      setShowStreakPopup(true);
      localStorage.setItem('streak', '1');
      localStorage.setItem('lastLoginDate', today);
    } else {
      const lastLogin = new Date(lastLoginDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLogin.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        // User logged in yesterday, increment streak
        const newStreak = streak + 1;
        setStreak(newStreak);
        setLastLoginDate(today);
        setShowStreakPopup(true);
        localStorage.setItem('streak', newStreak.toString());
        localStorage.setItem('lastLoginDate', today);
      } else if (lastLogin.toISOString().split('T')[0] !== today) {
        // User missed a day, reset streak
        setStreak(1);
        setLastLoginDate(today);
        setShowStreakPopup(true);
        localStorage.setItem('streak', '1');
        localStorage.setItem('lastLoginDate', today);
      }
    }
  }, []);

  return (
    <StreakContext.Provider value={{ streak, lastLoginDate, showStreakPopup, setShowStreakPopup }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
}; 