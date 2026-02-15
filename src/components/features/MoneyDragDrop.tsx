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
import { MoveLeft, RotateCcw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '../../hooks/useGamification';

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
    // Bills (values in cents)
    { value: 20000, label: '200€', type: 'bill', image: '/assets/money/200_bill.png' },
    { value: 10000, label: '100€', type: 'bill', image: '/assets/money/100_bill.png' },
    { value: 5000, label: '50€', type: 'bill', image: '/assets/money/50_bill.png' },
    { value: 2000, label: '20€', type: 'bill', image: '/assets/money/20_bill.png' },
    { value: 1000, label: '10€', type: 'bill', image: '/assets/money/10_bill.png' },
    { value: 500, label: '5€', type: 'bill', image: '/assets/money/5_bill.png' },
    // Coins (values in cents)
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
    // Generate a random amount between 150 cents (1.50€) and 85000 cents (850.00€)
    return Math.floor(Math.random() * 84851) + 150;
};

export const MoneyDragDrop = () => {
    // Global State
    const { addSuccess, addFailure } = useGamification();

    // Game State
    const [targetAmount, setTargetAmount] = useState<number>(() => generateRandomAmount());
    const [placedItems, setPlacedItems] = useState<MoneyDenomination[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Sensors
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
    );

    const generateNewTask = () => {
        setTargetAmount(generateRandomAmount());
        setPlacedItems([]);
        setSuccess(false);
    };

    const checkWinCondition = (amountCents: number) => {
        if (!success && targetAmount > 0 && amountCents === targetAmount) {
            setSuccess(true);
            addSuccess();

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
            const denom = DENOMINATIONS.find(d => d.label === active.id);
            if (denom) {
                const newItems = [...placedItems, denom];
                setPlacedItems(newItems);

                const newTotalCents = newItems.reduce((acc, item) => acc + item.value, 0);

                checkWinCondition(newTotalCents);
            }
        }
    };

    const handleReset = () => {
        setPlacedItems([]);
        addFailure();
    };

    const handleAddMoney = (denom: MoneyDenomination) => {
        if (success) return;
        const newItems = [...placedItems, denom];
        setPlacedItems(newItems);
        const newTotalCents = newItems.reduce((acc: number, item: MoneyDenomination) => acc + item.value, 0);
        checkWinCondition(newTotalCents);
    };

    const handleRemoveMoney = (indexToRemove: number) => {
        if (success) return;
        const newItems = placedItems.filter((_: MoneyDenomination, idx: number) => idx !== indexToRemove);
        setPlacedItems(newItems);
        const newTotalCents = newItems.reduce((acc: number, item: MoneyDenomination) => acc + item.value, 0);
        checkWinCondition(newTotalCents);
    };

    // Sub-Components
    const DraggableMoney = ({ denom }: { denom: MoneyDenomination }) => {
        const { attributes, listeners, setNodeRef, transform } = useDraggable({
            id: denom.label,
            data: { denom }
        });

        const style = transform ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            zIndex: 1000
        } : undefined;

        const isBill = denom.type === 'bill';

        return (
            <button
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`money-button ${isBill ? 'bill' : 'coin'}`}
                title={denom.label}
                onClick={() => handleAddMoney(denom)}
            >
                <img src={denom.image} alt={denom.label} className="wallet-money-image" />
                <span className="money-button-label">{denom.label}</span>
            </button>
        );
    };

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

                <main className="main-area">
                    <motion.div
                        className="task-banner"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                    >
                        <h2 className="task-title">Lege diesen Betrag:</h2>
                        <div className="task-price-tag">
                            <span className="target-price">{(targetAmount / 100).toFixed(2).replace('.', ',')} €</span>
                        </div>

                        <div className="task-status">
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

                    <DropZone />
                </main>

                <DragOverlay>
                    {activeId ? (
                        <div className="money-drag-preview">
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
