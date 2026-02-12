import { useState } from 'react';
import {
    DndContext,
    useDraggable,
    useDroppable,
    DragOverlay,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    DragStartEvent,
    DragEndEvent
} from '@dnd-kit/core';
import { MoveLeft, RotateCcw, CheckCircle2, Trophy, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type MoneyType = 'bill' | 'coin';

interface MoneyDenomination {
    value: number;
    label: string;
    type: MoneyType;
    image: string; // Path to image
}

// --- Data ---
const DENOMINATIONS: MoneyDenomination[] = [
    // Bills
    // { value: 500, label: '500€', type: 'bill', image: '/assets/money/500_bill.png' }, // Missing
    { value: 200, label: '200€', type: 'bill', image: '/assets/money/200_bill.png' },
    { value: 100, label: '100€', type: 'bill', image: '/assets/money/100_bill.png' },
    { value: 50, label: '50€', type: 'bill', image: '/assets/money/50_bill.png' },
    { value: 20, label: '20€', type: 'bill', image: '/assets/money/20_bill.png' },
    { value: 10, label: '10€', type: 'bill', image: '/assets/money/10_bill.png' },
    { value: 5, label: '5€', type: 'bill', image: '/assets/money/5_bill.png' },
    // Coins
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
    // Generate a random amount between 1.50€ and 850.00€
    const randomVal = (Math.floor(Math.random() * 850 * 100) + 150) / 100;
    return Math.round(randomVal * 100) / 100;
};

export const MoneyDragDrop = () => {
    // Game State
    const [targetAmount, setTargetAmount] = useState<number>(() => generateRandomAmount());
    const [placedItems, setPlacedItems] = useState<MoneyDenomination[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Stats
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(() => {
        const saved = localStorage.getItem('money_bestStreak');
        return saved ? parseInt(saved) : 0;
    });

    // Sensors with activation constraints to allow clicks
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10, // Must move 10px to start drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5, // Must hold for 250ms or move less than 5px before drag starts
            },
        }),
    );

    const generateNewTask = () => {
        setTargetAmount(generateRandomAmount());
        setPlacedItems([]);
        setSuccess(false);
    };

    const checkWinCondition = (amount: number) => {
        if (!success && targetAmount > 0 && Math.abs(amount - targetAmount) < 0.001) {
            setSuccess(true);

            // Updates Stats
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > bestStreak) {
                setBestStreak(newStreak);
                localStorage.setItem('money_bestStreak', newStreak.toString());
            }

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#f59e0b', '#06b6d4', '#10b981']
            });
        }
    };

    // Drag Logic
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (over && over.id === 'drop-zone') {
            // Find denomination
            const denom = DENOMINATIONS.find(d => d.label === active.id);
            if (denom) {
                // Add to table
                const newItems = [...placedItems, denom];
                setPlacedItems(newItems);

                // Recalculate Total
                const newTotal = newItems.reduce((acc, item) => acc + item.value, 0);
                const roundedTotal = Math.round(newTotal * 100) / 100;
                checkWinCondition(roundedTotal);
            }
        }
    };

    const handleReset = () => {
        setPlacedItems([]);
        // Note: Resetting table doesn't break streak if they haven't won yet
        // Only explicit failure would break streak, but here they just retry
    };

    // Click Handlers
    const handleAddMoney = (denom: MoneyDenomination) => {
        if (success) return; // Disable adding if already won

        const newItems = [...placedItems, denom];
        setPlacedItems(newItems);

        // Recalculate Total
        const newTotal = newItems.reduce((acc: number, item: MoneyDenomination) => acc + item.value, 0);
        const roundedTotal = Math.round(newTotal * 100) / 100;
        setCurrentAmount(roundedTotal);
        checkWinCondition(roundedTotal);
    };

    const handleRemoveMoney = (indexToRemove: number) => {
        if (success) return;

        const newItems = placedItems.filter((_: MoneyDenomination, idx: number) => idx !== indexToRemove);
        setPlacedItems(newItems);

        // Recalculate Total
        const newTotal = newItems.reduce((acc: number, item: MoneyDenomination) => acc + item.value, 0);
        const roundedTotal = Math.round(newTotal * 100) / 100;
        checkWinCondition(roundedTotal);
    };

    // --- Sub-Components ---

    // Draggable Source Item (Wallet)
    const DraggableMoney = ({ denom }: { denom: MoneyDenomination }) => {
        const { attributes, listeners, setNodeRef, transform } = useDraggable({
            id: denom.label,
            data: { denom }
        });

        const style = transform ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zIndex: 1000
        } : undefined;

        // Custom class for size adjustment based on type
        const isBill = denom.type === 'bill';

        return (
            <button
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`money-button ${isBill ? 'bill' : 'coin'}`}
                title={`${denom.label} (Klicken zum Hinzufügen)`}
                onClick={() => handleAddMoney(denom)}
            >
                <img src={denom.image} alt={denom.label} className="wallet-money-image" />
                <span className="money-button-label">{denom.label}</span>
            </button>
        );
    };

    // Droppable Target (Table)
    const DropZone = () => {
        const { setNodeRef, isOver } = useDroppable({
            id: 'drop-zone',
        });

        return (
            <div
                ref={setNodeRef}
                className={`table-section ${isOver ? 'highlight' : ''}`}
            >
                {placedItems.length === 0 && (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.3,
                        pointerEvents: 'none'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <MoveLeft size={48} className="animate-bounce-left" />
                            <p>Lege das Geld hier ab</p>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {placedItems.map((item: MoneyDenomination, idx: number) => (
                        <motion.div
                            key={`${item.label}-${idx}`}
                            className={`money-item ${item.type}`}
                            initial={{ scale: 0, rotate: Math.random() * 20 - 10 }}
                            animate={{ scale: 1, rotate: Math.random() * 10 - 5 }}
                            exit={{ scale: 0, opacity: 0 }}
                            layout
                            onClick={() => handleRemoveMoney(idx)}
                            style={{ cursor: success ? 'default' : 'pointer' }}
                            title="Klicken zum Entfernen"
                        >
                            <img
                                src={item.image}
                                alt={item.label}
                                className="money-image"
                                style={{
                                    width: item.type === 'bill' ? '120px' : '70px'
                                }}
                            />
                            <span className="money-label">{item.label}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="playground">
                {/* Left Sidebar: Wallet */}
                <aside className="wallet-section">
                    <h2>
                        <span>👛</span> Dein Geldbeutel
                    </h2>
                    <p className="wallet-hint">Klicke auf das Geld oder ziehe es auf den Tisch</p>

                    <div className="denominations-grid">
                        {DENOMINATIONS.map((d) => (
                            <DraggableMoney key={d.label} denom={d} />
                        ))}
                    </div>
                </aside>

                {/* Main Area */}
                <main className="main-area">
                    {/* Task Banner */}
                    <motion.div
                        className="task-banner"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <h2 className="task-title">Lege diesen Betrag:</h2>
                        <div className="task-price-tag">
                            <span className="target-price">{targetAmount.toFixed(2).replace('.', ',')} €</span>
                        </div>

                        {/* Stats Row */}
                        <div className="stats-row">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="stat-item"
                            >
                                <Trophy size={24} className="stat-icon trophy" />
                                <span className="stat-label">Rekord</span>
                                <span className="stat-value">{bestStreak}</span>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="stat-item"
                            >
                                <Flame size={24} className="stat-icon flame" />
                                <span className="stat-label">Serie</span>
                                <span className="stat-value">{streak}</span>
                            </motion.div>
                        </div>

                        <div className="task-status">
                            {/* Current Amount Hidden for Challenge */}

                            {success && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="success-badge"
                                >
                                    <CheckCircle2 size={24} />
                                    <span>Perfekt!</span>
                                </motion.div>
                            )}

                            {success && (
                                <button className="next-button" onClick={generateNewTask}>
                                    Nächste Aufgabe
                                </button>
                            )}

                            {!success && placedItems.length > 0 && (
                                <button className="reset-button-small" onClick={handleReset} title="Tisch leeren">
                                    <RotateCcw size={20} />
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Drop Zone */}
                    <DropZone />
                </main>

                <DragOverlay>
                    {activeId ? (
                        <div className="money-drag-preview">
                            {/* Simple Preview */}
                            <img
                                src={DENOMINATIONS.find(d => d.label === activeId)?.image}
                                alt="preview"
                                style={{ width: '80px', opacity: 0.8 }}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};
