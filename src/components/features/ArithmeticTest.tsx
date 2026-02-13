import { useState, useCallback } from 'react';
import { RefreshCcw, CheckCircle2 } from 'lucide-react';
import { GridCalculator } from './GridCalculator';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../../hooks/useGamification';

// --- Types ---
interface Task {
    id: string;
    num1: number;
    num2: number;
    operator: '+' | '-';
    type: 'money' | 'number';
}

export const ArithmeticTest = () => {
    // Global State
    const { addSuccess, addFailure } = useGamification();

    // State
    const [task, setTask] = useState<Task>(() => {
        const isAddition = Math.random() > 0.5;
        const n1 = Math.floor(Math.random() * 80000) + 1000;
        const n2 = isAddition
            ? Math.floor(Math.random() * (90000 - n1)) + 1000
            : Math.floor(Math.random() * (n1 - 1000)) + 1000;

        return {
            id: Math.random().toString(36).substring(7),
            num1: n1,
            num2: n2,
            operator: isAddition ? '+' : '-',
            type: 'money'
        };
    });
    const [showSuccess, setShowSuccess] = useState(false);

    // Task Generation Logic
    const generateTask = useCallback(() => {
        const isAddition = Math.random() > 0.5;
        let n1, n2;

        if (isAddition) {
            n1 = Math.floor(Math.random() * 80000) + 1000;
            n2 = Math.floor(Math.random() * (90000 - n1)) + 1000;
        } else {
            n1 = Math.floor(Math.random() * 80000) + 2000;
            n2 = Math.floor(Math.random() * (n1 - 1000)) + 1000;
        }

        const newTask: Task = {
            id: Math.random().toString(36).substring(7),
            num1: n1,
            num2: n2,
            operator: isAddition ? '+' : '-',
            type: 'money'
        };

        setTask(newTask);
        setShowSuccess(false);
    }, []);

    const handleSuccess = () => {
        addSuccess();
        setShowSuccess(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#f59e0b', '#06b6d4', '#10b981']
        });
    };

    const handleFailure = () => {
        addFailure();
    };

    return (
        <div className="arithmetic-card">
            {/* Background Decoration */}
            <div className="at-bg-deco" />

            {/* Header Section */}
            <div className="at-header-section">
                <motion.h2
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="at-headline"
                >
                    Löse die Aufgaben ordentlich wie im Heft! 📝
                </motion.h2>
            </div>

            {/* Actions */}
            <div className="at-actions">
                <button
                    onClick={generateTask}
                    className="at-refresh-btn"
                    title="Neue Aufgabe"
                >
                    <RefreshCcw size={20} />
                </button>
            </div>

            {/* Success Message Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ scale: 0, rotate: -10, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="at-success-overlay"
                    >
                        <div className="at-success-message">
                            <CheckCircle2 size={32} strokeWidth={3} />
                            <span>KORREKT!</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Notebook Area */}
            <div className="math-notebook mt-4">
                <AnimatePresence mode="wait">
                    {task && (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                            className="w-full flex justify-center"
                        >
                            <GridCalculator
                                key={task.id}
                                num1={task.num1}
                                num2={task.num2}
                                operator={task.operator}
                                isMoney={task.type === 'money'}
                                onSuccess={handleSuccess}
                                onFailure={handleFailure}
                                onNext={generateTask}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
