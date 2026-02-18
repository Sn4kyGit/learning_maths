import { GamificationContext } from './GamificationContextType';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { leaderboardService } from '../services/LeaderboardService';

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [points, setPoints] = useState(0);
    const [lives, setLives] = useState(5);
    const [streak, setStreak] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    // Track points with a ref so we can read the latest value outside of React's batching
    const pointsRef = useRef(0);

    const heroName = localStorage.getItem('heroName');

    // Submit score when game over is triggered
    useEffect(() => {
        if (gameOver && heroName) {
            const finalScore = pointsRef.current;
            leaderboardService.updateScore(heroName, finalScore);
        }
    }, [gameOver, heroName]);

    const addSuccess = useCallback(() => {
        if (gameOver) return;
        setPoints(p => {
            const newPoints = p + 1;
            pointsRef.current = newPoints;
            return newPoints;
        });
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

        // Store points BEFORE deduction for the score submission
        setLives(prev => {
            const newLives = Math.max(0, prev - 1);
            if (newLives === 0) {
                // Game over — submit the score BEFORE deducting
                // pointsRef.current still has the pre-deduction value here
                setGameOver(true);
            }
            return newLives;
        });

        // Deduct point (but don't go below 0)
        setPoints(p => {
            const newPoints = Math.max(0, p - 1);
            // Only update ref if game is NOT over (preserve pre-deduction score for submission)
            if (!gameOver) {
                pointsRef.current = newPoints;
            }
            return newPoints;
        });

        setStreak(0);
    }, [gameOver]);

    const resetGame = useCallback(() => {
        setPoints(0);
        setLives(5);
        setStreak(0);
        setGameOver(false);
        pointsRef.current = 0;
    }, []);

    return (
        <GamificationContext.Provider value={{ points, lives, streak, gameOver, addSuccess, addFailure, resetGame }}>
            {children}
        </GamificationContext.Provider>
    );
};
