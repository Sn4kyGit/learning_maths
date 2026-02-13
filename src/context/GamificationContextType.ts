import { createContext } from 'react';

export interface GamificationContextType {
    points: number;
    lives: number;
    streak: number;
    addSuccess: () => void;
    addFailure: () => void;
}

export const GamificationContext = createContext<GamificationContextType | undefined>(undefined);
