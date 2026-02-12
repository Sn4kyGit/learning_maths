import { useState, useMemo, useCallback } from 'react';
import type { AIProblem, Difficulty } from '../../../services/OpenRouterService';
import { PREDEFINED_PROBLEMS } from '../../../data/predefinedProblems';
import { RefreshCcw, Star, SendHorizonal, XCircle, Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const AIWordProblemsMobile = () => {
    const [difficulty] = useState<Difficulty>('medium');
    const [problem, setProblem] = useState<AIProblem | null>(null);
    const [loading, setLoading] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [hasStarted, setHasStarted] = useState(false);

    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState<number>(() => {
        const saved = localStorage.getItem('wordproblems_bestStreak');
        return saved ? parseInt(saved) : 0;
    });

    const fetchNewProblem = useCallback(async (diff: Difficulty = difficulty) => {
        setHasStarted(true);
        setStatus('idle');
        setUserInput('');
        setLoading(true);

        // Try to get from predefined first if any left, else Generate
        try {
            const predefined = PREDEFINED_PROBLEMS[diff];
            const randomIndex = Math.floor(Math.random() * predefined.length);
            const nextProblem = predefined[randomIndex];
            setProblem(nextProblem);
        } catch (error) {
            console.error("Failed to fetch problem:", error);
        } finally {
            setLoading(false);
        }
    }, [difficulty]);

    const handleCheck = () => {
        if (!problem) return;
        const val = parseFloat(userInput.replace(',', '.'));
        if (Math.abs(val - problem.solution) < 0.01) {
            setStatus('correct');
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > bestStreak) {
                setBestStreak(newStreak);
                localStorage.setItem('wordproblems_bestStreak', newStreak.toString());
            }
            confetti({
                particleCount: 80,
                spread: 50,
                origin: { y: 0.8 }
            });
        } else {
            setStatus('wrong');
            setStreak(0);
        }
    };

    const problemImage = useMemo(() => {
        if (!problem?.id) return null;
        return `/images/problems/${problem.id}.jpg`;
    }, [problem]);

    if (!hasStarted) {
        return (
            <div className="mobile-feature-container centered">
                <h2 className="m-intro-title">Mathe-Geschichten 📖</h2>
                <div className="m-diff-grid">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                        <button
                            key={d}
                            onClick={() => fetchNewProblem(d)}
                            className={`m-diff-card ${d}`}
                        >
                            <div className="m-stars">
                                {[...Array(d === 'easy' ? 1 : d === 'medium' ? 2 : 3)].map((_, i) => (
                                    <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
                                ))}
                            </div>
                            <span>{d === 'easy' ? 'Einfach' : d === 'medium' ? 'Mittel' : 'Schwer'}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mobile-feature-container">
            {/* Minimal Header */}
            <div className="m-ai-top-bar">
                <div className="m-stats">
                    <div className="m-stat"><Trophy size={14} /> {bestStreak}</div>
                    <div className="m-stat"><Flame size={14} /> {streak}</div>
                </div>
                <button onClick={() => setHasStarted(false)} className="m-back-btn">Abbrechen</button>
            </div>

            {loading ? (
                <div className="m-loading"><RefreshCcw className="spinner" /></div>
            ) : (
                <div className="m-ai-content">
                    {/* Story Area (Scrollable if needed) */}
                    <div className="m-problem-card">
                        <div className="m-problem-story">{problem?.story}</div>
                        <h3 className="m-problem-question">{problem?.question}</h3>
                    </div>

                    {/* Image (Small & Square) */}
                    {problemImage && (
                        <div className="m-polaroid-small">
                            <img src={problemImage} alt="Illustration" />
                        </div>
                    )}

                    {/* Input Area (Bottom Fixed-ish) */}
                    <div className="m-ai-solution-row">
                        <div className="m-input-side">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="0,00"
                                className="m-ai-input"
                            />
                            <span className="m-unit">€</span>
                        </div>

                        {status !== 'correct' ? (
                            <button className="m-send-btn" onClick={handleCheck} disabled={!userInput}>
                                <SendHorizonal />
                            </button>
                        ) : (
                            <button className="m-send-btn next" onClick={() => fetchNewProblem()}>
                                <RefreshCcw />
                            </button>
                        )}
                    </div>

                    <AnimatePresence>
                        {status === 'wrong' && (
                            <motion.div initial={{ x: -10 }} animate={{ x: 0 }} className="m-error-pill">
                                <XCircle size={14} /> Falsch, probier's nochmal!
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
