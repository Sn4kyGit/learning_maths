import { useState } from 'react';
import { RotateCcw, CheckCircle2, Trophy, Flame, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types (Re-using from original or defining if needed) ---
type MoneyType = 'bill' | 'coin';

interface MoneyDenomination {
    value: number;
    label: string;
    type: MoneyType;
    image: string;
}

const DENOMINATIONS: MoneyDenomination[] = [
    { value: 200, label: '200€', type: 'bill', image: '/assets/money/200_bill.png' },
    { value: 100, label: '100€', type: 'bill', image: '/assets/money/100_bill.png' },
    { value: 50, label: '50€', type: 'bill', image: '/assets/money/50_bill.png' },
    { value: 20, label: '20€', type: 'bill', image: '/assets/money/20_bill.png' },
    { value: 10, label: '10€', type: 'bill', image: '/assets/money/10_bill.png' },
    { value: 5, label: '5€', type: 'bill', image: '/assets/money/5_bill.png' },
    { value: 2, label: '2€', type: 'coin', image: '/assets/money/2_coin.png' },
    { value: 1, label: '1€', type: 'coin', image: '/assets/money/1_coin.png' },
    { value: 0.5, label: '50ct', type: 'coin', image: '/assets/money/50ct_coin.png' },
    { value: 0.2, label: '20ct', type: 'coin', image: '/assets/money/20ct_coin.png' },
    { value: 0.1, label: '10ct', type: 'coin', image: '/assets/money/10ct_coin.png' },
    { value: 0.05, label: '5ct', type: 'coin', image: '/assets/money/5ct_coin.png' },
    { value: 0.02, label: '2ct', type: 'coin', image: '/assets/money/2ct_coin.png' },
    { value: 0.01, label: '1ct', type: 'coin', image: '/assets/money/1ct_coin.png' },
];

const generateRandomAmount = () => {
    const randomVal = (Math.floor(Math.random() * 850 * 100) + 150) / 100;
    return Math.round(randomVal * 100) / 100;
};

export const MoneyDragDropMobile = () => {
    const [targetAmount, setTargetAmount] = useState<number>(() => generateRandomAmount());
    const [placedItems, setPlacedItems] = useState<MoneyDenomination[]>([]);
    const [success, setSuccess] = useState(false);

    // Stats
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(() => {
        const saved = localStorage.getItem('money_bestStreak');
        return saved ? parseInt(saved) : 0;
    });

    const generateNewTask = () => {
        setTargetAmount(generateRandomAmount());
        setPlacedItems([]);
        setSuccess(false);
    };

    const checkWinCondition = (amount: number) => {
        if (!success && targetAmount > 0 && Math.abs(amount - targetAmount) < 0.001) {
            setSuccess(true);
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > bestStreak) {
                setBestStreak(newStreak);
                localStorage.setItem('money_bestStreak', newStreak.toString());
            }

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.8 },
                colors: ['#6366f1', '#f59e0b', '#06b6d4', '#10b981']
            });
        }
    };

    const handleAddMoney = (denom: MoneyDenomination) => {
        if (success) return;
        const newItems = [...placedItems, denom];
        setPlacedItems(newItems);
        const newTotal = newItems.reduce((acc, item) => acc + item.value, 0);
        const roundedTotal = Math.round(newTotal * 100) / 100;
        checkWinCondition(roundedTotal);
    };

    const handleRemoveMoney = (indexToRemove: number) => {
        if (success) return;
        const newItems = placedItems.filter((_, idx) => idx !== indexToRemove);
        setPlacedItems(newItems);
        const newTotal = newItems.reduce((acc, item) => acc + item.value, 0);
        const roundedTotal = Math.round(newTotal * 100) / 100;
        checkWinCondition(roundedTotal);
    };

    const handleReset = () => {
        setPlacedItems([]);
    };

    return (
        <div className="mobile-feature-container">
            {/* Target Banner */}
            <motion.div
                className="mobile-task-banner"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className="mobile-stats">
                    <div className="m-stat"><Trophy size={16} /> {bestStreak}</div>
                    <div className="m-stat"><Flame size={16} /> {streak}</div>
                </div>
                <h2 className="m-task-title">Lege diesen Betrag:</h2>
                <div className="m-target-price">{targetAmount.toFixed(2).replace('.', ',')} €</div>

                <div className="m-status-area">
                    {success && (
                        <motion.button
                            className="m-next-btn"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={generateNewTask}
                        >
                            Nächste Aufgabe <CheckCircle2 size={18} />
                        </motion.button>
                    )}
                    {!success && placedItems.length > 0 && (
                        <button className="m-reset-btn" onClick={handleReset}>
                            <RotateCcw size={18} /> Tisch leeren
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Table Area (Horizontal Scroll) */}
            <div className="mobile-table-section">
                <AnimatePresence>
                    {placedItems.length === 0 ? (
                        <div className="m-empty-hint">Tippe auf das Geld unten! 👇</div>
                    ) : (
                        <div className="m-placed-grid">
                            {placedItems.map((item, idx) => (
                                <motion.div
                                    key={`${item.label}-${idx}`}
                                    className="m-placed-item"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    onClick={() => handleRemoveMoney(idx)}
                                >
                                    <img src={item.image} alt={item.label} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Wallet Shelf (Grid) */}
            <div className="mobile-wallet-shelf">
                <div className="m-shelf-header">Geldbeutel</div>
                <div className="m-wallet-grid">
                    {DENOMINATIONS.map((d) => (
                        <button
                            key={d.label}
                            className="m-wallet-btn"
                            onClick={() => handleAddMoney(d)}
                        >
                            <img src={d.image} alt={d.label} />
                            <span className="m-btn-overlay"><Plus size={14} /></span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
