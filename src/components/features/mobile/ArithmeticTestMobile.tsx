import { useState, useCallback } from 'react';
import { Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GridCalculatorMobile } from './GridCalculatorMobile';

interface Task {
    id: string;
    num1: number;
    num2: number;
    operator: '+' | '-';
}

export const ArithmeticTestMobile = () => {
    function generateTaskData() {
        const isAddition = Math.random() > 0.5;
        // Adjust numbers for grid size (max 4 digits + 2 decimals)
        // Let's use cents for the calculation but display as €, so numbers like 145,20
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

    const generateNewTask = useCallback(() => {
        setTask(generateTaskData());
        setShowSuccess(false);
    }, []);

    const handleSuccess = () => {
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
            setBestStreak(newStreak);
            localStorage.setItem('arithmetic_bestStreak', newStreak.toString());
        }
        setShowSuccess(true);
    };

    const handleFailure = () => {
        setStreak(0);
    };

    return (
        <div className="mobile-feature-container">
            <div className="mobile-task-banner blue">
                <div className="mobile-stats">
                    <div className="m-stat"><Trophy size={16} /> {bestStreak}</div>
                    <div className="m-stat"><Flame size={16} /> {streak}</div>
                </div>
                <h2 className="m-task-title">Rechne im Karoheft aus:</h2>
            </div>

            <GridCalculatorMobile
                key={task.id}
                num1={task.num1}
                num2={task.num2}
                operator={task.operator}
                isMoney={true}
                onSuccess={handleSuccess}
                onFailure={handleFailure}
                onNext={generateNewTask}
            />

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
