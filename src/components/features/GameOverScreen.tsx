import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';

const MOTIVATIONAL_TEXTS = [
    'Übung macht den Meister!',
    'Beim nächsten Mal schaffst du mehr!',
    'Jeder Mathe-Superheld braucht Training!',
    'Toll gespielt! Versuch es nochmal!',
    'Du wirst mit jedem Versuch besser!',
    'Niemals aufgeben — Superhelden stehen immer wieder auf!',
    'Mathe ist wie ein Muskel — trainiere weiter!',
    'Fehler sind Freunde — sie helfen dir zu lernen!',
];

const getRandomMotivation = () => {
    return MOTIVATIONAL_TEXTS[Math.floor(Math.random() * MOTIVATIONAL_TEXTS.length)];
};

export const GameOverScreen = () => {
    const { points, resetGame } = useGamification();
    const motivation = getRandomMotivation();

    return (
        <motion.div
            className="game-over-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="game-over-card"
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            >
                <div className="game-over-emoji">{'😵'}</div>
                <h2 className="game-over-title">Alle Versuche aufgebraucht!</h2>

                <div className="game-over-score">
                    <Trophy size={28} className="game-over-trophy" />
                    <span className="game-over-points">{points}</span>
                    <span className="game-over-label">Punkte</span>
                </div>

                <p className="game-over-motivation">{motivation}</p>

                <motion.button
                    className="game-over-restart-btn"
                    onClick={resetGame}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <RotateCcw size={20} />
                    Nochmal spielen!
                </motion.button>
            </motion.div>
        </motion.div>
    );
};
