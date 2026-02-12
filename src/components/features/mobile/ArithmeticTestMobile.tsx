import { useState, useCallback } from 'react';
import { CheckCircle2, Trophy, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
    id: string;
    num1: number;
    num2: number;
    operator: '+' | '-';
}

export const ArithmeticTestMobile = () => {
    function generateTaskData() {
        const isAddition = Math.random() > 0.5;
        const n1 = Math.floor(Math.random() * 80000) + 1000;
        const n2 = isAddition
            ? Math.floor(Math.random() * (90000 - n1)) + 1000
            : Math.floor(Math.random() * (n1 - 1000)) + 1000;
        return {
            id: Math.random().toString(36).substring(7),
            num1: n1,
            num2: n2,
            operator: isAddition ? '+' : '-' as '+' | '-'
        };
    }

    const [task, setTask] = useState<Task>(() => generateTaskData());
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(() => {
        const saved = localStorage.getItem('arithmetic_bestStreak');
        return saved ? parseInt(saved) : 0;
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [userInput, setUserInput] = useState('');


    const generateNewTask = useCallback(() => {
        setTask(generateTaskData());
        setShowSuccess(false);
        setUserInput('');
    }, []);

    const handleKeypadPress = (val: string) => {
        if (showSuccess) return;
        if (val === 'C') {
            setUserInput('');
        } else if (val === '⌫') {
            setUserInput(prev => prev.slice(0, -1));
        } else if (userInput.length < 8) {
            setUserInput(prev => prev + val);
        }
    };

    const checkAnswer = () => {
        const expected = task.operator === '+'
            ? task.num1 + task.num2
            : task.num1 - task.num2;

        const userVal = parseInt(userInput.replace(',', '').replace('.', '')) || 0;

        if (userVal === expected) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > bestStreak) {
                setBestStreak(newStreak);
                localStorage.setItem('arithmetic_bestStreak', newStreak.toString());
            }
            setShowSuccess(true);
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.7 }
            });
            setTimeout(generateNewTask, 2000);
        } else {
            setStreak(0);
            setUserInput('');
            // Optional: Shake effect
        }
    };

    const formatMoney = (cents: number) => {
        return (cents / 100).toFixed(2).replace('.', ',') + ' €';
    };

    return (
        <div className="mobile-feature-container">
            <div className="mobile-task-banner blue">
                <div className="mobile-stats">
                    <div className="m-stat"><Trophy size={16} /> {bestStreak}</div>
                    <div className="m-stat"><Flame size={16} /> {streak}</div>
                </div>
                <h2 className="m-task-title">Rechne schnell aus:</h2>

                <div className="m-arithmetic-display">
                    <div className="m-num">{formatMoney(task.num1)}</div>
                    <div className="m-op">{task.operator}</div>
                    <div className="m-num underline">{formatMoney(task.num2)}</div>
                </div>
            </div>

            <div className="m-input-display">
                <div className={`m-user-val ${showSuccess ? 'success' : ''}`}>
                    {userInput ? (
                        <>
                            {userInput.slice(0, -2) || '0'},{userInput.slice(-2).padStart(2, '0')} €
                        </>
                    ) : '0,00 €'}
                </div>
            </div>

            {/* Keypad */}
            <div className="m-keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map((key) => (
                    <button
                        key={key.toString()}
                        className={`m-key ${key === 'C' ? 'clear' : ''}`}
                        onClick={() => handleKeypadPress(key.toString())}
                    >
                        {key}
                    </button>
                ))}
            </div>

            <button
                className={`m-submit-btn ${userInput ? 'active' : ''}`}
                disabled={!userInput || showSuccess}
                onClick={checkAnswer}
            >
                {showSuccess ? <CheckCircle2 size={24} /> : 'Prüfen'}
            </button>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        className="m-success-toast"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        Richtig! 🎉
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
