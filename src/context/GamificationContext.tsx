import { GamificationContext } from './GamificationContextType';

import React, { useState, useEffect } from 'react';
import { leaderboardService } from '../services/LeaderboardService';

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [points, setPoints] = useState(() => {
        const saved = localStorage.getItem('global_points');
        return saved ? parseInt(saved) : 0;
    });
    const [lives, setLives] = useState(() => {
        const saved = localStorage.getItem('global_lives');
        return saved ? parseInt(saved) : 5;
    });
    const [streak, setStreak] = useState(() => {
        const saved = localStorage.getItem('global_streak');
        return saved ? parseInt(saved) : 0;
    });

    const heroName = localStorage.getItem('heroName');

    // Persist to local storage
    useEffect(() => {
        localStorage.setItem('global_points', points.toString());
        localStorage.setItem('global_lives', lives.toString());
        localStorage.setItem('global_streak', streak.toString());

        // Sync with Vercel KV if hero name exists
        if (heroName) {
            leaderboardService.updateScore(heroName, points);
        }
    }, [points, lives, streak, heroName]);

    const addSuccess = () => {
        setPoints(p => p + 1);
        const newStreak = streak + 1;
        setStreak(newStreak);

        // Bonus: Every 3-streak gives a life back
        if (newStreak % 3 === 0 && lives < 5) {
            setLives(l => l + 1);
        }
    };

    const addFailure = () => {
        setPoints(p => Math.max(0, p - 1));
        setLives(l => Math.max(0, l - 1));
        setStreak(0);
    };

    return (
        <GamificationContext.Provider value={{ points, lives, streak, addSuccess, addFailure }}>
            {children}
        </GamificationContext.Provider>
    );
};

