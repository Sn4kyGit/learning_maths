import { useState, useEffect } from 'react';
import { Wallet as WalletIcon, RotateCcw, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { MoneyDenomination, PlacedMoney } from '../../types/money';

const DENOMINATIONS: MoneyDenomination[] = [
    { id: 'b200', value: 200, label: '200€', type: 'bill', imageUrl: '/assets/money/200_bill.png' },
    { id: 'b100', value: 100, label: '100€', type: 'bill', imageUrl: '/assets/money/100_bill.png' },
    { id: 'b50', value: 50, label: '50€', type: 'bill', imageUrl: '/assets/money/50_bill.png' },
    { id: 'b20', value: 20, label: '20€', type: 'bill', imageUrl: '/assets/money/20_bill.png' },
    { id: 'b10', value: 10, label: '10€', type: 'bill', imageUrl: '/assets/money/10_bill.png' },
    { id: 'b5', value: 5, label: '5€', type: 'bill', imageUrl: '/assets/money/5_bill.png' },
    { id: 'c2', value: 2, label: '2€', type: 'coin', imageUrl: '/assets/money/2_coin.png' },
    { id: 'c1', value: 1, label: '1€', type: 'coin', imageUrl: '/assets/money/1_coin.png' },
    { id: 'c05', value: 0.5, label: '50ct', type: 'coin', imageUrl: '/assets/money/50ct_coin.png' },
];

export const MoneyDragDrop = () => {
    const [placedMoney, setPlacedMoney] = useState<PlacedMoney[]>([]);
    const [targetAmount, setTargetAmount] = useState<number>(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [isSolved, setIsSolved] = useState(false);

    useEffect(() => {
        const savedBest = localStorage.getItem('moneyfiles_bestStreak');
        if (savedBest) setBestStreak(parseInt(savedBest));
    }, []);

    const currentTotal = placedMoney.reduce((sum: number, item) => sum + item.denom.value, 0);

    const generateNewTask = () => {
        let newAmount = 0;
        let attempts = 0;

        do {
            const rand = Math.random();
            if (rand < 0.4) {
                // Easy: 5€ - 100€ (0.50€ steps) -> 10 to 200 halves
                newAmount = (Math.floor(Math.random() * 191) + 10) / 2;
            } else if (rand < 0.7) {
                // Medium: 100€ - 500€ (1€ steps) -> 100 to 500
                newAmount = Math.floor(Math.random() * 401) + 100;
            } else {
                // Hard: 500€ - 1000€ (5€ steps) -> 100 to 200 fives
                newAmount = (Math.floor(Math.random() * 101) + 100) * 5;
            }
            attempts++;
        } while (newAmount === targetAmount && attempts < 10);

        setTargetAmount(newAmount);
        setPlacedMoney([]);
        setIsSolved(false);
    };

    const handleReset = () => {
        setPlacedMoney([]);
        setStreak(0);
    };

    const triggerSuccess = () => {
        if (isSolved) return;
        setIsSolved(true);

        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > bestStreak) {
            setBestStreak(newStreak);
            localStorage.setItem('moneyfiles_bestStreak', newStreak.toString());
        }

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#f59e0b', '#3b82f6']
        });

        // Simple Web Audio success chime
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.2); // C6

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    };

    useEffect(() => {
        if (!isSolved && targetAmount > 0 && Math.abs(currentTotal - targetAmount) < 0.01) {
            triggerSuccess();
        }
    }, [currentTotal, targetAmount, isSolved]);

    useEffect(() => {
        generateNewTask();
    }, []);

    const addMoney = (denom: MoneyDenomination) => {
        if (isSolved) return; // Prevent adding more if already solved
        const newItem = {
            id: `${denom.id}-${Date.now()}`,
            denom,
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50
        };
        setPlacedMoney([...placedMoney, newItem]);
    };



    return (
        <div className="playground">
            <aside className="wallet-section">
                <h2><WalletIcon size={20} /> Geldbeutel</h2>
                <p className="wallet-hint">Klick auf das Geld, um es auf den Tisch zu legen</p>
                <div className="denominations-grid">
                    {DENOMINATIONS.map(denom => (
                        <button
                            key={denom.id}
                            className={`money-button ${denom.type}`}
                            onClick={() => addMoney(denom)}
                            title={denom.label}
                            disabled={isSolved}
                        >
                            <img
                                src={denom.imageUrl}
                                alt={denom.label}
                                className="wallet-money-image"
                            />
                            <span className="money-button-label">{denom.label}</span>
                        </button>
                    ))}
                </div>
            </aside>

            <section className="main-area">
                <div className="task-banner">
                    <div className="streak-display" style={{ position: 'absolute', top: '1rem', right: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                            <span>🏆 Rekord: {bestStreak}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 800, fontSize: '1.1rem' }}>
                            <span>🔥 Serie: {streak}</span>
                        </div>
                    </div>

                    <div className="task-tag">Deine Aufgabe</div>
                    <h2 className="task-title">
                        Lege diesen Betrag auf den Tisch <span className="target-price">{targetAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </h2>

                    {isSolved && (
                        <div className="task-status">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="success-actions"
                            >
                                <span className="success-badge">✓ Korrekt!</span>
                                <button className="next-button" onClick={generateNewTask}>
                                    Nächste <ArrowRight size={16} />
                                </button>
                            </motion.div>
                        </div>
                    )}
                    <button className="reset-button" onClick={handleReset}>
                        <RotateCcw size={16} /> Zurücksetzen
                    </button>
                </div>

                <div className="table-section">
                    <AnimatePresence>
                        {placedMoney.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className={`money-item ${item.denom.type}`}
                                style={{ transform: `translate(${item.x}px, ${item.y}px)` }}
                                onClick={() => setPlacedMoney(placedMoney.filter((m) => m.id !== item.id))}
                            >
                                <div className="money-label">{item.denom.label}</div>
                                <img
                                    src={item.denom.imageUrl}
                                    alt={item.denom.label}
                                    className={`money-image ${item.denom.type}`}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </section>
        </div>
    );
};
