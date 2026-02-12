import { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { GridCalculator } from './GridCalculator';

interface Task {
    a: number;
    b: number;
    op: '+' | '-';
    result: number;
}

export const ArithmeticTest = () => {
    const [task, setTask] = useState<Task | null>(null);
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
        setStatus('idle');
        setAttempts(0);
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

    const checkResult = (val: number) => {
        if (!task) return;

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
                setTimeout(() => setStatus('idle'), 1500);
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
                        <GridCalculator
                            a={task.a}
                            b={task.b}
                            op={task.op}
                            onCheck={(val) => checkResult(val)}
                            status={status}
                        />

                        {status === 'correct' && (
                            <div className="numpad-actions" style={{ marginTop: '1.5rem' }}>
                                <motion.button
                                    initial={{ scale: 0.9 }}
                                    animate={{ scale: 1 }}
                                    type="button"
                                    onClick={generateTask}
                                    className="action-btn success"
                                >
                                    Korrekt! Nächste
                                </motion.button>
                            </div>
                        )}
                        {status === 'failed' && (
                            <div className="numpad-actions" style={{ marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={generateTask}
                                    className="action-btn error"
                                >
                                    Leider falsch! (Lösung: {task.result}€)
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <button onClick={generateTask} className="refresh-task">
                    <RefreshCcw size={20} />
                </button>
            </div>
        </motion.div>
    );
};
