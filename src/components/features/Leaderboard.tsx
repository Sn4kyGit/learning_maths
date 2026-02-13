import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, X, User } from 'lucide-react';
import { leaderboardService } from '../../services/LeaderboardService';

export interface LeaderboardEntry {
    name: string;
    score: number;
    streak?: number;
    isCurrentUser?: boolean;
}

interface LeaderboardProps {
    onClose?: () => void;
    isModal?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose, isModal }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const heroName = localStorage.getItem('heroName');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            const data = await leaderboardService.getTopPlayers();

            // Mark current user
            const processedData = data.map(entry => ({
                ...entry,
                isCurrentUser: entry.name === heroName
            }));

            // If current user is not in top 10, we could theoretically fetch their rank
            // but for now, we just display the top 10.

            setLeaderboard(processedData);
            setLoading(false);
        };

        fetchLeaderboard();
    }, [heroName]);

    const content = (
        <motion.div
            className={`leaderboard-card ${isModal ? 'modal-view' : ''}`}
            initial={isModal ? { scale: 0.9, opacity: 0 } : { y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ delay: isModal ? 0 : 0.3 }}
        >
            <div className="leaderboard-header">
                <div className="lb-title-group">
                    <Trophy size={24} className="text-amber-500" />
                    <h3>Globale Hall of Fame</h3>
                </div>
                {onClose && (
                    <button onClick={onClose} className="lb-close-btn">
                        <X size={24} />
                    </button>
                )}
            </div>

            <div className="leaderboard-list">
                {loading ? (
                    <div className="lb-loading">Lade Helden...</div>
                ) : leaderboard.length === 0 ? (
                    <div className="lb-empty">Noch keine Helden eingetragen. Werde der Erste!</div>
                ) : (
                    leaderboard.map((hero, index) => (
                        <motion.div
                            key={`${hero.name}-${index}`}
                            className={`lb-entry rank-${index + 1} ${hero.isCurrentUser ? 'current-user-lb' : ''}`}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <span className="lb-rank">#{index + 1}</span>
                            <div className="lb-name-group">
                                {hero.isCurrentUser && <User size={14} className="text-indigo-500" />}
                                <span className="lb-name">{hero.name}</span>
                            </div>
                            <div className="lb-stats">
                                {hero.streak !== undefined && hero.streak > 0 && (
                                    <span className="lb-streak"><Flame size={12} /> {hero.streak}</span>
                                )}
                                <span className="lb-score">{hero.score}</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="lb-footer-hint">
                Synchronisiert mit Vercel KV ⚡️
            </div>
        </motion.div>
    );

    if (isModal) {
        return (
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
                {content}
            </div>
        );
    }

    return content;
};
