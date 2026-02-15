import { GamificationContext } from './GamificationContextType';

import React, { useState, useCallback } from 'react';
import { leaderboardService } from '../services/LeaderboardService';

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [points, setPoints] = useState(0);
    const [lives, setLives] = useState(5);
    const [streak, setStreak] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const heroName = localStorage.getItem('heroName');

    const submitScore = useCallback((finalPoints: number) => {
        if (heroName && finalPoints > 0) {
            leaderboardService.updateScore(heroName, finalPoints);
        }
    }, [heroName]);

    const addSuccess = useCallback(() => {
        if (gameOver) return;
        setPoints(p => p + 1);
        setStreak(s => {
            const newStreak = s + 1;
            // Bonus: Every 3-streak gives a life back
            if (newStreak % 3 === 0) {
                setLives(l => Math.min(5, l + 1));
            }
            return newStreak;
        });
    }, [gameOver]);

    const addFailure = useCallback(() => {
        if (gameOver) return;
        setPoints(p => Math.max(0, p - 1));
        setStreak(0);
        setLives(prev => {
            const newLives = Math.max(0, prev - 1);
            if (newLives === 0) {
                setGameOver(true);
                // Submit score when game ends
                setPoints(currentPoints => {
                    submitScore(currentPoints);
                    return currentPoints;
                });
            }
            return newLives;
        });
    }, [gameOver, submitScore]);

    const resetGame = useCallback(() => {
        setPoints(0);
        setLives(5);
        setStreak(0);
        setGameOver(false);
    }, []);

    return (
        <GamificationContext.Provider value={{ points, lives, streak, gameOver, addSuccess, addFailure, resetGame }}>
            {children}
        </GamificationContext.Provider>
    );
};
