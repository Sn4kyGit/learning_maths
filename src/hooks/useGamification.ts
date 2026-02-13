import { useContext } from 'react';
import { GamificationContext } from '../context/GamificationContextType';

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (!context) throw new Error('useGamification must be used within GamificationProvider');
    return context;
};
