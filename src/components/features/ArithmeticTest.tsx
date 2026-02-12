import { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Task {
    a: number;
    b: number;
    op: '+' | '-';
    result: number;
}

export const ArithmeticTest = () => {
    const [task, setTask] = useState<Task | null>(null);
    const [userInput, setUserInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'failed'>('idle');
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        const savedBest = localStorage.getItem('arithmetic_bestStreak');
        if (savedBest) setBestStreak(parseInt(savedBest));
    }, []);

    const generateTask = () => {
        const isPlus = Math.random() > 0.5;
        let a, b, result;

        if (isPlus) {
            a = Math.floor(Math.random() * 500) + 1;
            b = Math.floor(Math.random() * (1000 - a)) + 1;
            result = a + b;
        } else {
            a = Math.floor(Math.random() * 900) + 100;
            b = Math.floor(Math.random() * a) + 1;
            result = a - b;
        }

        setTask({ a, b, op: isPlus ? '+' : '-', result });
        setUserInput('');
        setStatus('idle');
        setAttempts(0);
    };

    const handleNumberClick = (num: string) => {
        if (status !== 'idle' && status !== 'wrong') return; // Allow retry on 'wrong' (shake)
        if (userInput.length >= 7) return;
        setUserInput(prev => prev + num);
    };

    const handleBackspace = () => {
        if (status !== 'idle') return;
        setUserInput(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        if (status !== 'idle') return;
        setUserInput('');
    };

    useEffect(() => {
        generateTask();
    }, []);

    const triggerSuccess = () => {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
            setBestStreak(newStreak);
            localStorage.setItem('arithmetic_bestStreak', newStreak.toString());
        }

        confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.7 }
        });

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    };

    const checkResult = (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return;

        // Normalize input (comma to dot for parseFloat)
        const val = parseFloat(userInput.replace(',', '.'));
        if (Math.abs(val - task.result) < 0.01) {
            setStatus('correct');
            triggerSuccess();
        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            if (newAttempts >= 3) {
                setStatus('failed');
                setStreak(0);
            } else {
                setStatus('wrong');
                // Shake effect logic handled by class usually, or just state
                setTimeout(() => setStatus('idle'), 800); // Auto-reset to idle after shake/error message
                setUserInput('');
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="arithmetic-container"
        >
            <div className="arithmetic-card">
                <div className="streak-display" style={{ position: 'absolute', top: '1rem', left: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(0,0,0,0.5)', fontWeight: 600, fontSize: '0.9rem' }}>
                        <span>🏆 Rekord: {bestStreak}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontWeight: 800, fontSize: '1rem' }}>
                        <span>🔥 Serie: {streak}</span>
                    </div>
                </div>

                {task && (
                    <div className="arithmetic-form">
                        <div className="arithmetic-display">
                            <div className="display-card primary-card">
                                <span className="card-label">Zahl 1</span>
                                <span className="card-value">{task.a}€</span>
                            </div>
                            <div className="operator-display" style={{
                                fontSize: '2.5rem',
                                fontWeight: '800',
                                color: task.op === '+' ? '#10b981' : '#ef4444',
                                margin: '0 0.5rem'
                            }}>{task.op}</div>
                            <div className="display-card primary-card">
                                <span className="card-label">Zahl 2</span>
                                <span className="card-value">{task.b}€</span>
                            </div>
                            <div className="operator-display">=</div>
                            <div className={`display-card result-card ${status}`}>
                                <span className="card-label">Dein Ergebnis</span>
                                <span className="card-value">{userInput || '?'}€</span>
                            </div>
                        </div>

                        <div className="numpad-section">
                            <div className="numpad-grid">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ','].map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => handleNumberClick(num)}
                                        className="num-btn"
                                        disabled={status !== 'idle'}
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleBackspace}
                                    className="num-btn action delete"
                                    disabled={status !== 'idle'}
                                >
                                    ⌫
                                </button>
                            </div>
                            <div className="numpad-actions">
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="action-btn secondary"
                                    disabled={status !== 'idle' || !userInput}
                                >
                                    Löschen
                                </button>
                                {status === 'idle' || status === 'wrong' ? (
                                    <button
                                        type="button"
                                        onClick={checkResult}
                                        className={`action-btn ${status === 'wrong' ? 'error' : 'primary'}`}
                                        disabled={!userInput}
                                    >
                                        {status === 'wrong' ? `Falsch (${3 - attempts} übrig)` : 'Prüfen'}
                                    </button>
                                ) : status === 'correct' ? (
                                    <motion.button
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        type="button"
                                        onClick={generateTask}
                                        className="action-btn success"
                                    >
                                        Korrekt! Nächste
                                    </motion.button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={generateTask}
                                        className="action-btn error"
                                    >
                                        Leider falsch! (Lösung: {task.result}€)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <button onClick={generateTask} className="refresh-task">
                    <RefreshCcw size={20} />
                </button>
            </div>
        </motion.div>
    );
};
