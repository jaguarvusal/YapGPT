import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_HEARTS_AND_STREAK } from '../utils/mutations';
import { QUERY_ME } from '../utils/queries';
import Auth from '../utils/auth';

interface HeartsContextType {
  hearts: number;
  loseHeart: () => void;
  resetHearts: () => void;
  timeUntilRegeneration: number | null;
}

const HeartsContext = createContext<HeartsContextType | undefined>(undefined);

export const HeartsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [updateHeartsAndStreak, { error: updateError }] = useMutation(UPDATE_HEARTS_AND_STREAK);
  const { data: userData } = useQuery(QUERY_ME, {
    skip: !Auth.loggedIn(),
  });

  // Add a ref to track the last update timestamp
  const lastUpdateRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);

  const [hearts, setHearts] = useState(() => {
    if (Auth.loggedIn() && userData?.me?.hearts !== undefined) {
      console.log('Loading hearts from database:', userData.me.hearts);
      return userData.me.hearts;
    }
    const savedHearts = localStorage.getItem('hearts');
    console.log('Loading hearts from localStorage:', savedHearts);
    return savedHearts ? parseInt(savedHearts, 10) : 5;
  });

  const [timeUntilRegeneration, setTimeUntilRegeneration] = useState<number | null>(() => {
    if (hearts === 0) {
      const now = Date.now();
      const twentyFourHoursFromNow = now + (24 * 60 * 60 * 1000);
      localStorage.setItem('heartRegenerationTimer', twentyFourHoursFromNow.toString());
      return 24 * 60 * 60 * 1000;
    }
    return null;
  });

  // Update state when user data changes
  useEffect(() => {
    if (Auth.loggedIn() && userData?.me && !isUpdatingRef.current) {
      const now = Date.now();
      // Only update if enough time has passed since last update
      if (now - lastUpdateRef.current > 1000) {
        console.log('User data updated, setting hearts to:', userData.me.hearts);
        setHearts(userData.me.hearts);
        localStorage.setItem('hearts', userData.me.hearts.toString());
        lastUpdateRef.current = now;
      }
      
      // Check if timer has expired
      if (userData.me.heartRegenerationTimer) {
        const regenerationTime = parseInt(userData.me.heartRegenerationTimer, 10);
        const timeLeft = regenerationTime - Date.now();
        
        if (timeLeft <= 0) {
          console.log('Timer expired, resetting hearts');
          setHearts(5);
          setTimeUntilRegeneration(null);
          localStorage.removeItem('heartRegenerationTimer');
          localStorage.setItem('hearts', '5');
          
          // Update database
          updateHeartsAndStreak({
            variables: {
              hearts: 5,
              streak: parseInt(localStorage.getItem('streak') || '0', 10),
              lastLoginDate: localStorage.getItem('lastLoginDate'),
              heartRegenerationTimer: null
            }
          }).catch(error => {
            console.error('Failed to sync hearts with database:', error);
          });
        } else if (timeLeft !== timeUntilRegeneration) {
          setTimeUntilRegeneration(timeLeft);
        }
      } else if (timeUntilRegeneration !== null) {
        setTimeUntilRegeneration(null);
      }
    }
  }, [userData, hearts, timeUntilRegeneration]);

  // Sync with database when hearts or timer changes
  useEffect(() => {
    if (Auth.loggedIn() && hearts !== null && !isUpdatingRef.current) {
      // Only set timer if hearts is 0
      const timer = hearts === 0 && timeUntilRegeneration ? (Date.now() + timeUntilRegeneration).toString() : null;
      
      // Only update if values have actually changed and it's not just a timer tick
      const currentHearts = parseInt(localStorage.getItem('hearts') || '5', 10);
      const currentTimer = localStorage.getItem('heartRegenerationTimer');
      
      if (hearts !== currentHearts || (timer !== currentTimer && !timeUntilRegeneration)) {
        console.log('Syncing hearts and timer with database:', {
          hearts,
          timeUntilRegeneration,
          timer
        });
        
        isUpdatingRef.current = true;
        lastUpdateRef.current = Date.now();
        lastHeartsRef.current = hearts;
        lastTimerRef.current = timer;
        
        updateHeartsAndStreak({
          variables: {
            hearts,
            streak: parseInt(localStorage.getItem('streak') || '0', 10),
            lastLoginDate: localStorage.getItem('lastLoginDate'),
            heartRegenerationTimer: timer
          }
        }).catch(error => {
          console.error('Failed to sync hearts with database:', error);
        }).finally(() => {
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 1000);
        });
      }
    }
  }, [hearts, timeUntilRegeneration]);

  // Log any update errors
  useEffect(() => {
    if (updateError) {
      console.error('Error updating hearts:', updateError);
    }
  }, [updateError]);

  // Reset timer to 5 seconds when hearts reach 0
  useEffect(() => {
    if (hearts === 0) {
      const now = Date.now();
      const fiveSecondsFromNow = now + (5 * 1000);
      localStorage.setItem('heartRegenerationTimer', fiveSecondsFromNow.toString());
      setTimeUntilRegeneration(5 * 1000);
    }
  }, [hearts]);

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
          isUpdatingRef.current = true;
          lastUpdateRef.current = Date.now();
          setHearts(5);
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 1000);
          return null;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeUntilRegeneration]);

  const loseHeart = async () => {
    if (hearts === null) return; // Don't allow losing hearts while loading
    
    console.log('Losing heart, current hearts:', hearts);
    const newHearts = Math.max(0, hearts - 1);
    console.log('New hearts value:', newHearts);
    
    // Set updating flag
    isUpdatingRef.current = true;
    lastUpdateRef.current = Date.now();
    
    // Update local state first
    setHearts(newHearts);
    localStorage.setItem('hearts', newHearts.toString());
    
    // If this will be the last heart, set timer to 24 hours
    if (newHearts === 0) {
      console.log('Setting 24 hour timer');
      const regenerationTime = Date.now() + 24 * 60 * 60 * 1000;
      setTimeUntilRegeneration(24 * 60 * 60 * 1000);
      localStorage.setItem('heartRegenerationTimer', regenerationTime.toString());
      
      // If logged in, update database
      if (Auth.loggedIn()) {
        try {
          await updateHeartsAndStreak({
            variables: {
              hearts: newHearts,
              streak: parseInt(localStorage.getItem('streak') || '0', 10),
              lastLoginDate: localStorage.getItem('lastLoginDate'),
              heartRegenerationTimer: regenerationTime.toString()
            }
          });
        } catch (error) {
          console.error('Failed to sync hearts with database:', error);
          // Revert local state if database update fails
          setHearts(hearts);
          localStorage.setItem('hearts', hearts.toString());
          setTimeUntilRegeneration(null);
          localStorage.removeItem('heartRegenerationTimer');
        }
      }
    } else {
      // If logged in, update database for regular heart loss
      if (Auth.loggedIn()) {
        try {
          await updateHeartsAndStreak({
            variables: {
              hearts: newHearts,
              streak: parseInt(localStorage.getItem('streak') || '0', 10),
              lastLoginDate: localStorage.getItem('lastLoginDate'),
              heartRegenerationTimer: null
            }
          });
        } catch (error) {
          console.error('Failed to sync hearts with database:', error);
          // Revert local state if database update fails
          setHearts(hearts);
          localStorage.setItem('hearts', hearts.toString());
        }
      }
    }
    
    // Clear updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 1000);
  };

  const resetHearts = () => {
    console.log('Resetting hearts to 5');
    setHearts(5);
    setTimeUntilRegeneration(null);
    localStorage.removeItem('heartRegenerationTimer');
    localStorage.setItem('hearts', '5');
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