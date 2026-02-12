import { useState, useEffect, useMemo } from 'react';
import { generateAIWordProblem } from '../../services/OpenRouterService';
import type { AIProblem, Difficulty } from '../../services/OpenRouterService';
import { PREDEFINED_PROBLEMS } from '../../data/predefinedProblems';
import { Brain, Send, CheckCircle2, XCircle, RefreshCcw, ImageIcon } from 'lucide-react';
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
    const [bestStreak, setBestStreak] = useState(0);

    // Problem Pool state - initialized with predefined problems
    const [pool, setPool] = useState<Record<Difficulty, AIProblem[]>>({
        easy: [...PREDEFINED_PROBLEMS.easy],
        medium: [...PREDEFINED_PROBLEMS.medium],
        hard: [...PREDEFINED_PROBLEMS.hard]
    });

    // Background refill check on mount
    useEffect(() => {
        refillPool('easy');
        refillPool('medium');
        refillPool('hard');

        const savedBest = localStorage.getItem('wordproblems_bestStreak');
        if (savedBest) setBestStreak(parseInt(savedBest));
    }, []);

    const refillPool = async (diff: Difficulty) => {
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
    };

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
            // Add timestamp to force reload and avoid caching old images
            return `/images/problems/${problem.id}.jpg?t=${Date.now()}`;
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
            origin: { y: 0.5 }
        });

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
                            <div className="ai-icon-bg large">
                                <Brain size={40} color="#6366f1" />
                            </div>
                            <h2>KI-Spezialaufgabe</h2>
                            <p>Wähle einen Schwierigkeitsgrad, um zu starten:</p>
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
                                    <span className="diff-label">
                                        {d === 'easy' ? 'Einfach' : d === 'medium' ? 'Mittel' : 'Schwer'}
                                    </span>
                                    <span className="diff-desc">
                                        {d === 'easy' ? 'Nur 3 Zahlen' : d === 'medium' ? '4 bis 6 Zahlen' : '6 bis 8 Zahlen'}
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
                        className="loading-container"
                    >
                        <RefreshCcw className="spinner" size={48} />
                        <p>KI denkt nach...</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ai-card has-image"
                    >
                        <div className="ai-content-layout">
                            <div className="ai-main-text">
                                <div className="ai-header">
                                    <div className="ai-icon-bg">
                                        <Brain size={24} color="#6366f1" />
                                    </div>
                                    <div className="ai-title-group">
                                        <h3>KI-Spezialaufgabe</h3>
                                        <div className="difficulty-selector">
                                            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                                                <button
                                                    key={d}
                                                    onClick={() => changeDifficulty(d)}
                                                    className={`diff-btn ${d} ${difficulty === d ? 'active' : ''}`}
                                                    disabled={loading}
                                                >
                                                    {d === 'easy' ? 'Einfach' : d === 'medium' ? 'Mittel' : 'Schwer'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="streak-display" style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(0,0,0,0.5)', fontWeight: 600, fontSize: '0.9rem' }}>
                                            <span>🏆 Rekord: {bestStreak}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontWeight: 800, fontSize: '1rem' }}>
                                            <span>🔥 Serie: {streak}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ai-story">
                                    <p>{problem?.story}</p>
                                </div>

                                <div className="ai-question">
                                    <p>{problem?.question}</p>
                                </div>

                                <div className="ai-interaction">
                                    <div className="input-wrapper">
                                        <input
                                            type="text"
                                            value={userInput}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value)}
                                            placeholder="Wie viel Euro?"
                                            className={`ai-input ${status}`}
                                        />
                                        <span className="currency-unit">€</span>
                                    </div>
                                    <button
                                        onClick={handleCheck}
                                        className="ai-submit-button"
                                        disabled={!userInput || loading}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>

                                {status !== 'idle' && (
                                    <div className={`ai-feedback ${status}`}>
                                        {status === 'correct' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                                        <span>{status === 'correct' ? 'Super gemacht!' : 'Versuch es noch einmal.'}</span>
                                        {status === 'correct' && (
                                            <button onClick={() => fetchNewProblem()} className="next-ai-btn">Nächste Aufgabe</button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="ai-image-section">
                                {problemImage && (
                                    <div className="ai-comic-frame">
                                        <div className="ai-img-loading">
                                            <ImageIcon size={32} />
                                        </div>
                                        <img
                                            src={problemImage}
                                            alt="Problem Illustration"
                                            className="ai-comic-img"
                                            onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none'; // Hide if missing
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
