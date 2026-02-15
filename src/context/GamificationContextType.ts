import { createContext } from 'react';

export interface GamificationContextType {
    points: number;
    lives: number;
    streak: number;
    gameOver: boolean;
    addSuccess: () => void;
    addFailure: () => void;
    resetGame: () => void;
}

export const GamificationContext = createContext<GamificationContextType | undefined>(undefined);
