import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, User } from 'lucide-react';
import { Leaderboard } from './Leaderboard';

interface WelcomeScreenProps {
    onStart: (name: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Basic language filter
    const BAD_WORDS = ['scheiße', 'blöd', 'doof', 'kacke', 'mist', 'arsch', 'pisse', 'depp'];

    const validateName = (val: string) => {
        const lower = val.toLowerCase();
        if (BAD_WORDS.some(word => lower.includes(word))) {
            return "Wähle bitte einen schöneren Helden-Namen! ✨";
        }
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Bitte gib deinen Namen ein!");
            return;
        }

        const validationError = validateName(trimmedName);
        if (validationError) {
            setError(validationError);
            return;
        }

        onStart(trimmedName);
    };

    const handleNameChange = (val: string) => {
        setName(val);
        if (error) setError(null);
    };

    return (
        <div className="welcome-screen">
            <div className="hero-hub-container">
                <div className="hero-hub-content">
                    <motion.div
                        className="welcome-card"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                    >
                        <h2 className="welcome-title">Bist du bereit, <br />ein Superheld zu sein?</h2>

                        <form onSubmit={handleSubmit} className="name-form">
                            <div className="hero-input-wrapper">
                                <User className="input-icon" size={24} />
                                <input
                                    type="text"
                                    placeholder="Dein Helden-Name..."
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    maxLength={15}
                                    className={`hero-name-input ${error ? 'input-error' : ''}`}
                                />
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.p
                                        className="name-error-msg"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <motion.button
                                type="submit"
                                className="start-mission-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Play size={24} fill="currentColor" />
                                Mission starten
                            </motion.button>
                        </form>
                    </motion.div>

                    <Leaderboard />
                </div>
            </div>
        </div>
    );
};
