import { useState, useEffect, useMemo, useCallback } from 'react';
import { generateAIWordProblem } from '../../services/OpenRouterService';
import type { AIProblem, Difficulty } from '../../services/OpenRouterService';
import { PREDEFINED_PROBLEMS } from '../../data/predefinedProblems';
import { CheckCircle2, XCircle, RefreshCcw, ImageIcon, SendHorizonal, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const POOL_SIZE = 10;
const MIN_POOL_SIZE = 3;

export const AIWordProblems = () => {
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
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

    // Problem Pool state - initialized with predefined problems
    const [pool, setPool] = useState<Record<Difficulty, AIProblem[]>>({
        easy: [...PREDEFINED_PROBLEMS.easy],
        medium: [...PREDEFINED_PROBLEMS.medium],
        hard: [...PREDEFINED_PROBLEMS.hard]
    });

    const refillPool = useCallback(async (diff: Difficulty) => {
        const currentCount = pool[diff].length;
        if (currentCount >= POOL_SIZE) return;

        const refillBackground = async () => {
            const needed = POOL_SIZE - currentCount;
            for (let i = 0; i < needed; i++) {
                try {
                    const newProblem = await generateAIWordProblem(diff);
                    setPool(prev => ({
                        ...prev,
                        [diff]: [...prev[diff], newProblem]
                    }));
                } catch (error) {
                    console.error(`Error refilling pool for ${diff}:`, error);
                    break;
                }
            }
        };

        refillBackground();
    }, [pool]);

    // Background refill check on mount
    useEffect(() => {
        refillPool('easy');
        refillPool('medium');
        refillPool('hard');
    }, [refillPool]);

    const fetchNewProblem = async (diff: Difficulty = difficulty) => {
        setHasStarted(true);
        setStatus('idle');
        setUserInput('');

        setPool(currentPool => {
            const currentCount = currentPool[diff].length;

            if (currentCount > 0) {
                const nextProblem = currentPool[diff][0];
                const remainingPool = currentPool[diff].slice(1);

                setProblem(nextProblem);

                if (remainingPool.length < MIN_POOL_SIZE) {
                    setTimeout(() => refillPool(diff), 100);
                }

                return {
                    ...currentPool,
                    [diff]: remainingPool
                };
            } else {
                setLoading(true);
                generateAIWordProblem(diff).then(newProblem => {
                    setProblem(newProblem);
                    setLoading(false);
                    refillPool(diff);
                }).catch(error => {
                    console.error("Failed to fetch emergency problem:", error);
                    setLoading(false);
                });
                return currentPool;
            }
        });
    };

    const changeDifficulty = (newDiff: Difficulty) => {
        setDifficulty(newDiff);
        if (hasStarted) {
            fetchNewProblem(newDiff);
        }
    };

    // Dynamic Image URL based on the story
    const problemImage = useMemo(() => {
        if (!problem) return null;

        // Use local image if ID exists (predefined problem)
        if (problem.id) {
            // We only need to busting cache if the problem actually changes
            return `/images/problems/${problem.id}.jpg?v=${problem.id}`;
        }

        return null; // No image for dynamic problems (or show a default placeholder if needed)
    }, [problem]);

    const triggerSuccess = () => {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
            setBestStreak(newStreak);
            localStorage.setItem('wordproblems_bestStreak', newStreak.toString());
        }

        confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#6366f1', '#f59e0b', '#06b6d4', '#10b981']
        });

        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        oscillator.frequency.exponentialRampToValueAtTime(1318.51, audioCtx.currentTime + 0.15); // E6
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    };

    const handleCheck = () => {
        if (!problem) return;
        const val = parseFloat(userInput.replace(',', '.'));
        if (Math.abs(val - problem.solution) < 0.01) {
            setStatus('correct');
            triggerSuccess();
        } else {
            setStatus('wrong');
            setStreak(0);
        }
    };

    const handleInputFocus = () => {
        if (userInput === '?') setUserInput('');
    };

    return (
        <div className="ai-problems-container">
            <AnimatePresence mode="wait">
                {!hasStarted ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="ai-intro-card"
                    >
                        <div className="ai-intro-header">
                            <h2>Wähle einen Schwierigkeitsgrad, um zu starten:</h2>
                        </div>
                        <div className="difficulty-grid">
                            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                                <button
                                    key={d}
                                    onClick={() => {
                                        setDifficulty(d);
                                        fetchNewProblem(d);
                                    }}
                                    className={`diff-card ${d}`}
                                >
                                    <div className="stars-row">
                                        {[...Array(d === 'easy' ? 1 : d === 'medium' ? 2 : 3)].map((_, i) => (
                                            <Star key={i} size={24} fill="currentColor" strokeWidth={0} />
                                        ))}
                                    </div>
                                    <span className="diff-label">
                                        {d === 'easy' ? 'Einfach' : d === 'medium' ? 'Mittel' : 'Schwer'}
                                    </span>
                                    <span className="diff-desc">
                                        {d === 'easy' ? '3 Zahlen' : d === 'medium' ? '4-6 Zahlen' : '6-8 Zahlen'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ) : loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ai-loading-container"
                    >
                        <RefreshCcw className="spinner" size={48} />
                        <p>KI denkt nach...</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ai-card"
                    >
                        <div className="ai-content-layout">
                            {/* Top Bar: Difficulty & Stats */}
                            <div className="ai-top-bar">
                                <div className="difficulty-pills">
                                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => changeDifficulty(d)}
                                            className={`diff-pill ${d} ${difficulty === d ? 'active' : ''}`}
                                            disabled={loading}
                                        >
                                            {d === 'easy' ? 'Einfach' : d === 'medium' ? 'Mittel' : 'Schwer'}
                                        </button>
                                    ))}
                                </div>

                                <div className="stats-group">
                                    <div className="stat-pill" title="Rekord">
                                        <span className="stat-icon">🏆</span>
                                        <span className="stat-value">{bestStreak}</span>
                                        <span className="stat-label">Rekord</span>
                                    </div>
                                    <div className="stat-pill" title="Aktuelle Serie">
                                        <span className="stat-icon">🔥</span>
                                        <span className="stat-value">{streak}</span>
                                        <span className="stat-label">Serie</span>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-split-view">
                                <div className="ai-reading-area">
                                    {/* The "Story Card" - A quiet zone for reading */}
                                    <div className="problem-card">
                                        <div className="problem-story">
                                            {problem?.story}
                                        </div>
                                        <h2 className="problem-question">
                                            {problem?.question}
                                        </h2>
                                    </div>

                                    {/* Interaction Row - Unified Split Input */}
                                    <div className="solution-area">
                                        <h3 className="solution-label">Gib die Lösung ein:</h3>
                                        <div className="unified-input-group">
                                            <div className="input-side">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={userInput}
                                                    onChange={(e) => setUserInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                                                    onFocus={handleInputFocus}
                                                    className="solution-input"
                                                    disabled={status === 'correct'}
                                                    autoFocus
                                                />
                                                <span className="unit-label">€</span>
                                            </div>

                                            {status !== 'correct' ? (
                                                <button
                                                    className="split-submit-btn"
                                                    onClick={handleCheck}
                                                    disabled={!userInput}
                                                    title="Prüfen"
                                                >
                                                    <SendHorizonal size={24} />
                                                </button>
                                            ) : (
                                                <button
                                                    className="split-submit-btn next"
                                                    onClick={() => fetchNewProblem()}
                                                    title="Nächste Aufgabe"
                                                >
                                                    <RefreshCcw size={24} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Message */}
                                    <div className="status-feedback">
                                        <AnimatePresence>
                                            {status === 'correct' && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="feedback-pill success"
                                                >
                                                    <CheckCircle2 size={24} />
                                                    <span>Perfekt gelöst!</span>
                                                </motion.div>
                                            )}
                                            {status === 'wrong' && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className="feedback-pill error"
                                                >
                                                    <XCircle size={24} />
                                                    <span>Probier's noch einmal!</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="ai-illustration-area">
                                    {problemImage && (
                                        <motion.div
                                            initial={{ rotate: -2, opacity: 0 }}
                                            animate={{ rotate: 2, opacity: 1 }}
                                            className="polaroid-frame"
                                        >
                                            <div className="img-placeholder">
                                                <ImageIcon size={32} />
                                            </div>
                                            <img
                                                src={problemImage}
                                                alt="Illustration"
                                                className="polaroid-img"
                                                onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};
