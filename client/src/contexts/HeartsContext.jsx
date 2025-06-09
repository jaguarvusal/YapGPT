import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Auth from '../utils/auth';

const HeartsContext = createContext();

export const HeartsProvider = ({ children }) => {
    const [hearts, setHearts] = useState(() => {
        const storedHearts = localStorage.getItem('hearts');
        return storedHearts ? parseInt(storedHearts, 10) : 5;
    });

    const [timeUntilRegeneration, setTimeUntilRegeneration] = useState(() => {
        const storedTimer = localStorage.getItem('heartRegenerationTimer');
        if (!storedTimer) return null;
        
        const timeLeft = parseInt(storedTimer, 10) - Date.now();
        return timeLeft > 0 ? timeLeft : null;
    });

    const timerRef = useRef(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Start regeneration timer if needed
    useEffect(() => {
        if (timeUntilRegeneration === null) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            setTimeUntilRegeneration(prev => {
                if (!prev) return null;
                const newTime = prev - 1000;
                
                if (newTime <= 0) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    setHearts(5);
                    localStorage.setItem('hearts', '5');
                    localStorage.removeItem('heartRegenerationTimer');
                    return null;
                }
                
                return newTime;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [timeUntilRegeneration]);

    const loseHeart = () => {
        if (hearts === null) return;
        
        console.log('Losing heart, current hearts:', hearts);
        const newHearts = Math.max(0, hearts - 1);
        console.log('New hearts value:', newHearts);
        
        setHearts(newHearts);
        localStorage.setItem('hearts', newHearts.toString());
        
        // If this will be the last heart, set timer to 24 hours
        if (newHearts === 0) {
            console.log('Setting 24 hour timer');
            const regenerationTime = Date.now() + 24 * 60 * 60 * 1000;
            setTimeUntilRegeneration(24 * 60 * 60 * 1000);
            localStorage.setItem('heartRegenerationTimer', regenerationTime.toString());
        } else {
            setTimeUntilRegeneration(null);
            localStorage.removeItem('heartRegenerationTimer');
        }
    };

    const resetHearts = () => {
        setHearts(5);
        setTimeUntilRegeneration(null);
        localStorage.setItem('hearts', '5');
        localStorage.removeItem('heartRegenerationTimer');
        
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    return (
        <HeartsContext.Provider value={{ hearts, loseHeart, resetHearts, timeUntilRegeneration }}>
            {children}
        </HeartsContext.Provider>
    );
};

export const useHearts = () => {
    const context = useContext(HeartsContext);
    if (!context) {
        throw new Error('useHearts must be used within a HeartsProvider');
    }
    return context;
}; 