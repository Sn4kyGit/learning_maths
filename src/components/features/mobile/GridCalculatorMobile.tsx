import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Delete } from 'lucide-react';

interface GridCalculatorMobileProps {
    num1: number;
    num2: number;
    operator: '+' | '-';
    isMoney?: boolean;
    onSuccess?: () => void;
    onFailure?: () => void;
    onNext?: () => void;
}

export const GridCalculatorMobile: React.FC<GridCalculatorMobileProps> = ({
    num1,
    num2,
    operator,
    isMoney = false,
    onSuccess,
    onFailure,
    onNext
}) => {
    // 7x5 grid (6 digit columns + 1 comma column; 5 rows)
    const DIGIT_COLS = 6;
    const COMMA_COL_INDEX = 4;
    const TOTAL_COLS = DIGIT_COLS + 1;

    const controls = useAnimation(); // For the shake effect

    const [grid, setGrid] = useState<Record<string, string>>(() => {
        const initialGrid: Record<string, string> = {};
        // Convert numbers to strings, pad with leading zeros if necessary
        // Assuming max 4 digits + 2 decimals for money
        const formatNum = (n: number) => {
            const str = n.toString();
            return str.padStart(6, '0'); // Pad to fit the 6 digit columns
        };

        const strA = formatNum(num1);
        const strB = formatNum(num2);

        const fillRow = (row: number, str: string) => {
            let foundSignificant = false;
            // Iterate from left to right (start of string)
            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                // Significant digits are anything after the first non-zero,
                // OR any digit in the last 2 positions (decimals for money)
                const isDecimalPlace = i >= str.length - 2;

                if (char !== '0' || foundSignificant || isDecimalPlace) {
                    foundSignificant = true;
                    // Calculate column same as before: right-to-left mapping
                    const reverseIdx = str.length - 1 - i;
                    const gridCol = TOTAL_COLS - 1 - (reverseIdx >= 2 ? reverseIdx + 1 : reverseIdx);
                    if (gridCol >= 0) {
                        initialGrid[`${row}-${gridCol}`] = char;
                    }
                }
            }
        };

        fillRow(0, strA);
        fillRow(1, strB);
        return initialGrid;
    });

    const [activeCell, setActiveCell] = useState<string>(`3-${TOTAL_COLS - 1}`);
    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [lastInputCell, setLastInputCell] = useState<string | null>(null);

    const handleKeypadPress = (val: string) => {
        if (status === 'correct') return;

        const [row, col] = activeCell.split('-').map(Number);

        // Haptic Feedback
        if (window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }

        if (val === 'delete') {
            setGrid(prev => {
                const next = { ...prev };
                delete next[activeCell];
                return next;
            });
            return;
        }

        // Add digit to grid
        setGrid(prev => ({ ...prev, [activeCell]: val }));
        setLastInputCell(activeCell);

        // Reset pop animation state after a short delay
        setTimeout(() => setLastInputCell(null), 300);

        // Auto-advance logic (left for arithmetic)
        if (col > 0) {
            let nextCol = col - 1;
            if (nextCol === COMMA_COL_INDEX) nextCol--;
            if (nextCol >= 0) {
                setActiveCell(`${row}-${nextCol}`);
            }
        }
    };

    const handleCarryToggle = (cellId: string) => {
        if (status === 'correct') return;
        setGrid(prev => {
            const next = { ...prev };
            if (next[cellId] === '1') {
                delete next[cellId];
            } else {
                next[cellId] = '1';
                // Trigger pop animation for carry too
                setLastInputCell(cellId);
                setTimeout(() => setLastInputCell(null), 300);
            }
            return next;
        });
        if (window.navigator.vibrate) window.navigator.vibrate(5);
    };

    const submitAnswer = async () => {
        let resultStr = '';
        for (let i = 0; i < TOTAL_COLS; i++) {
            if (i === COMMA_COL_INDEX) continue;
            resultStr += grid[`3-${i}`] || '0';
        }
        const numericResult = parseInt(resultStr, 10);

        let expected = 0;
        if (operator === '+') expected = num1 + num2;
        else expected = num1 - num2;

        if (numericResult === expected) {
            setStatus('correct');
            if (window.navigator.vibrate) window.navigator.vibrate([50, 30, 50]);
            onSuccess?.();
            setTimeout(() => onNext?.(), 1500);
        } else {
            setStatus('wrong');
            if (window.navigator.vibrate) window.navigator.vibrate(200);

            // Shake UI
            await controls.start({
                x: [-5, 5, -5, 5, 0],
                transition: { duration: 0.4 }
            });

            onFailure?.();
            setTimeout(() => setStatus('idle'), 1000);
        }
    };

    const hasContent = Object.keys(grid).some(key => (key.startsWith('2-') || key.startsWith('3-')) && grid[key]);

    const gridTemplate = Array.from({ length: TOTAL_COLS })
        .map((_, i) => i === COMMA_COL_INDEX ? '20px' : '45px')
        .join(' ');

    return (
        <div className="m-karoheft-wrapper">
            <motion.div className="m-grid-container" animate={controls}>
                <div className="m-math-grid" style={{ gridTemplateColumns: gridTemplate }}>
                    {/* Header: numbers a and b */}
                    {[0, 1].map(row => (
                        <React.Fragment key={row}>
                            {Array.from({ length: TOTAL_COLS }).map((_, col) => {
                                const isOperatorCell = row === 1 && col === 0;
                                const isCommaCell = col === COMMA_COL_INDEX;
                                return (
                                    <div
                                        key={`${row}-${col}`}
                                        className={`m-karo-cell static ${isCommaCell ? 'm-comma-cell' : ''}`}
                                    >
                                        {isOperatorCell ? (
                                            <span className="m-grid-operator">{operator}</span>
                                        ) : isCommaCell ? (
                                            <span className="m-comma">,</span>
                                        ) : (
                                            grid[`${row}-${col}`] || ''
                                        )}
                                        {isMoney && col === TOTAL_COLS - 1 && <span className="m-currency-mobile">€</span>}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}

                    {/* Carry Row */}
                    {Array.from({ length: TOTAL_COLS }).map((_, col) => {
                        const isCommaCell = col === COMMA_COL_INDEX;
                        const cellId = `2-${col}`;
                        return (
                            <div
                                key={cellId}
                                onClick={() => !isCommaCell && handleCarryToggle(cellId)}
                                className={`m-karo-cell carry ${isCommaCell ? 'm-comma-cell' : ''} ${activeCell === cellId ? 'active' : ''} ${lastInputCell === cellId ? 'animate-pop' : ''}`}
                            >
                                {!isCommaCell && (grid[cellId] || '')}
                            </div>
                        );
                    })}

                    {/* Result Row */}
                    {Array.from({ length: TOTAL_COLS }).map((_, col) => {
                        const isCommaCell = col === COMMA_COL_INDEX;
                        const cellId = `3-${col}`;
                        return (
                            <div
                                key={cellId}
                                onClick={() => !isCommaCell && setActiveCell(cellId)}
                                className={`m-karo-cell result ${isCommaCell ? 'm-comma-cell' : ''} ${activeCell === cellId ? 'active' : ''} ${status} ${lastInputCell === cellId ? 'animate-pop' : ''}`}
                            >
                                {isCommaCell ? (
                                    <span className="m-comma">,</span>
                                ) : (
                                    grid[cellId] || ''
                                )}
                                {isMoney && col === TOTAL_COLS - 1 && <span className="m-currency-mobile">€</span>}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Floating Keypad */}
            <div className="m-floating-keypad-container">
                <motion.div
                    className="m-floating-keypad"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                        <motion.button
                            key={n}
                            className="m-keypad-key"
                            whileTap={{ scale: 0.9, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                            onClick={() => handleKeypadPress(n.toString())}
                        >
                            {n}
                        </motion.button>
                    ))}
                    <motion.button
                        className="m-keypad-key delete"
                        whileTap={{ scale: 0.9, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                        onClick={() => handleKeypadPress('delete')}
                    >
                        <Delete size={20} />
                    </motion.button>
                </motion.div>
            </div>

            {/* Submit Button */}
            <div className="m-status-area">
                <motion.button
                    className={`m-next-btn ${hasContent ? 'active' : ''}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={submitAnswer}
                    disabled={status === 'correct'}
                >
                    {status === 'correct' ? 'Super!' : 'Prüfen'}
                </motion.button>
            </div>
        </div>
    );
};
