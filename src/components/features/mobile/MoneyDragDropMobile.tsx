import { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle2, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../../../hooks/useGamification';

// --- Types ---
type MoneyType = 'bill' | 'coin';

interface MoneyDenomination {
    value: number;
    label: string;
    type: MoneyType;
    image: string;
}

const DENOMINATIONS: MoneyDenomination[] = [
    { value: 20000, label: '200€', type: 'bill', image: '/assets/money/200_bill.png' },
    { value: 10000, label: '100€', type: 'bill', image: '/assets/money/100_bill.png' },
    { value: 5000, label: '50€', type: 'bill', image: '/assets/money/50_bill.png' },
    { value: 2000, label: '20€', type: 'bill', image: '/assets/money/20_bill.png' },
    { value: 1000, label: '10€', type: 'bill', image: '/assets/money/10_bill.png' },
    { value: 500, label: '5€', type: 'bill', image: '/assets/money/5_bill.png' },
    { value: 200, label: '2€', type: 'coin', image: '/assets/money/2_coin.png' },
    { value: 100, label: '1€', type: 'coin', image: '/assets/money/1_coin.png' },
    { value: 50, label: '50ct', type: 'coin', image: '/assets/money/50ct_coin.png' },
    { value: 20, label: '20ct', type: 'coin', image: '/assets/money/20ct_coin.png' },
    { value: 10, label: '10ct', type: 'coin', image: '/assets/money/10ct_coin.png' },
    { value: 5, label: '5ct', type: 'coin', image: '/assets/money/5ct_coin.png' },
    { value: 2, label: '2ct', type: 'coin', image: '/assets/money/2ct_coin.png' },
    { value: 1, label: '1ct', type: 'coin', image: '/assets/money/1ct_coin.png' },
];

const generateRandomAmount = () => {
    return Math.floor(Math.random() * 84851) + 150;
};

export const MoneyDragDropMobile = () => {
    const { addSuccess } = useGamification();
    const [targetAmount, setTargetAmount] = useState<number>(() => generateRandomAmount());
    const [placedItems, setPlacedItems] = useState<MoneyDenomination[]>([]);
    const [success, setSuccess] = useState(false);

    // Calculate current total from placed items
    const currentTotal = placedItems.reduce((acc, item) => acc + item.value, 0);

    // Check win condition whenever placedItems or targetAmount changes
    useEffect(() => {
        if (success) return; // Already won

        if (targetAmount > 0 && currentTotal === targetAmount) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSuccess(true);
            addSuccess();

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.8 },
                colors: ['#6366f1', '#f59e0b', '#06b6d4', '#10b981']
            });
        }
    }, [placedItems, targetAmount, success, addSuccess, currentTotal]); // Dependencies

    const generateNewTask = () => {
        const newAmount = generateRandomAmount();
        console.log('Generating new task. New Target:', newAmount);
        setTargetAmount(newAmount);
        setPlacedItems([]);
        setSuccess(false);
    };

    const handleAddMoney = (denom: MoneyDenomination) => {
        if (success) return;
        setPlacedItems(prev => [...prev, denom]);
    };

    const handleRemoveMoney = (indexToRemove: number) => {
        if (success) return;
        setPlacedItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
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
                <h2 className="m-task-title">Lege diesen Betrag:</h2>
                <div className="m-target-price">{(targetAmount / 100).toFixed(2).replace('.', ',')} €</div>

                {/* Optional: Show current total for feedback/debugging */}
                <div className="m-current-total" style={{ fontSize: '0.9rem', color: currentTotal > targetAmount ? '#ef4444' : '#64748b', marginTop: '4px' }}>
                    Aktuell: {(currentTotal / 100).toFixed(2).replace('.', ',')} €
                </div>

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
