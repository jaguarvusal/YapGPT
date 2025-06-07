import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const HeartsContext = createContext(undefined);
export const HeartsProvider = ({ children }) => {
    const [hearts, setHearts] = useState(() => {
        const savedHearts = localStorage.getItem('hearts');
        return savedHearts ? parseInt(savedHearts, 10) : 5;
    });
    const [timeUntilRegeneration, setTimeUntilRegeneration] = useState(() => {
        const savedTimer = localStorage.getItem('heartRegenerationTimer');
        if (!savedTimer)
            return null;
        const regenerationTime = parseInt(savedTimer, 10);
        const timeLeft = regenerationTime - Date.now();
        // If regeneration time has passed, reset hearts
        if (timeLeft <= 0) {
            localStorage.removeItem('heartRegenerationTimer');
            localStorage.setItem('hearts', '5');
            return null;
        }
        return timeLeft;
    });
    // Check for regeneration on mount and when hearts change
    useEffect(() => {
        const savedTimer = localStorage.getItem('heartRegenerationTimer');
        if (savedTimer) {
            const regenerationTime = parseInt(savedTimer, 10);
            const timeLeft = regenerationTime - Date.now();
            if (timeLeft <= 0) {
                // Regeneration time has passed
                setHearts(5);
                setTimeUntilRegeneration(null);
                localStorage.removeItem('heartRegenerationTimer');
                localStorage.setItem('hearts', '5');
            }
        }
    }, [hearts]);
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
        if (!timeUntilRegeneration)
            return;
        const timer = setInterval(() => {
            setTimeUntilRegeneration(prev => {
                if (!prev)
                    return null;
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
        localStorage.setItem('hearts', '5');
    };
    return (_jsx(HeartsContext.Provider, { value: { hearts, loseHeart, resetHearts, timeUntilRegeneration }, children: children }));
};
export const useHearts = () => {
    const context = useContext(HeartsContext);
    if (context === undefined) {
        throw new Error('useHearts must be used within a HeartsProvider');
    }
    return context;
};
