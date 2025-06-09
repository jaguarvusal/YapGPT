import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME } from '../utils/queries';
import { UPDATE_HEARTS_AND_STREAK } from '../utils/mutations';
import Auth from '../utils/auth';

interface StreakContextType {
  streak: number;
  lastLoginDate: string | null;
  showStreakPopup: boolean;
  setShowStreakPopup: (show: boolean) => void;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: userData } = useQuery(QUERY_ME, {
    skip: !Auth.loggedIn(),
  });

  const [updateHeartsAndStreak] = useMutation(UPDATE_HEARTS_AND_STREAK);

  const [streak, setStreak] = useState(1);
  const [lastLoginDate, setLastLoginDate] = useState<string | null>(null);
  const [showStreakPopup, setShowStreakPopup] = useState(false);

  // Initialize or update streak data
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastShownPopup = localStorage.getItem('lastShownStreakPopup');

    // Show popup if we haven't shown it today
    if (lastShownPopup !== today) {
      setShowStreakPopup(true);
      localStorage.setItem('lastShownStreakPopup', today);
    }

    if (!Auth.loggedIn()) {
      setStreak(1);
      return;
    }

    if (userData?.me) {
      // Update local state with server data
      setStreak(userData.me.streak);
      setLastLoginDate(userData.me.lastLoginDate);

      // Sync with server to update streak if needed
      updateHeartsAndStreak({
        variables: {
          hearts: userData.me.hearts,
          streak: userData.me.streak,
          lastLoginDate: today,
          heartRegenerationTimer: userData.me.heartRegenerationTimer
        }
      }).then(({ data }) => {
        if (data?.updateHeartsAndStreak) {
          setStreak(data.updateHeartsAndStreak.streak);
          setLastLoginDate(data.updateHeartsAndStreak.lastLoginDate);
        }
      }).catch(error => {
        console.error('Error updating streak:', error);
      });
    }
  }, [userData, updateHeartsAndStreak]);

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