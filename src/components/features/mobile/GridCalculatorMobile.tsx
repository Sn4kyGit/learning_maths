import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
            // Fill from right to left
            for (let i = 0; i < str.length; i++) {
                const char = str[str.length - 1 - i];
                const gridCol = TOTAL_COLS - 1 - (i >= 2 ? i + 1 : i);
                if (gridCol >= 0 && char !== '0') {
                    initialGrid[`${row}-${gridCol}`] = char;
                }
            }
        };

        fillRow(0, strA);
        fillRow(1, strB);
        return initialGrid;
    });

    const [activeCell, setActiveCell] = useState<string>(`3-${TOTAL_COLS - 1}`);
    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');

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

        // Auto-advance logic (left for arithmetic)
        if (col > 0) {
            let nextCol = col - 1;
            if (nextCol === COMMA_COL_INDEX) nextCol--;
            if (nextCol >= 0) {
                setActiveCell(`${row}-${nextCol}`);
            }
        }
    };

    const submitAnswer = () => {
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
            onFailure?.();
            setTimeout(() => setStatus('idle'), 1000);
        }
    };

    const hasContent = Object.keys(grid).some(key => (key.startsWith('2-') || key.startsWith('3-')) && grid[key]);

    return (
        <div className="m-karoheft-wrapper">
            <div className="m-grid-container">
                <div className="m-math-grid" style={{ gridTemplateColumns: `repeat(${TOTAL_COLS}, 1fr)` }}>
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
                                onClick={() => !isCommaCell && setActiveCell(cellId)}
                                className={`m-karo-cell carry ${isCommaCell ? 'm-comma-cell' : ''} ${activeCell === cellId ? 'active' : ''}`}
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
                                className={`m-karo-cell result ${isCommaCell ? 'm-comma-cell' : ''} ${activeCell === cellId ? 'active' : ''} ${status}`}
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
            </div>

            {/* Floating Keypad */}
            <div className="m-floating-keypad-container">
                <motion.div
                    className="m-floating-keypad"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
                        <button
                            key={n}
                            className="m-keypad-key"
                            onClick={() => handleKeypadPress(n.toString())}
                        >
                            {n}
                        </button>
                    ))}
                    <button
                        className="m-keypad-key delete"
                        onClick={() => handleKeypadPress('delete')}
                    >
                        <Delete size={20} />
                    </button>
                </motion.div>
            </div>

            {/* Submit Button */}
            <div className="m-status-area">
                <button
                    className={`m-next-btn ${hasContent ? 'active' : ''}`}
                    onClick={submitAnswer}
                    disabled={status === 'correct'}
                >
                    {status === 'correct' ? 'Super!' : 'Prüfen'}
                </button>
            </div>
        </div>
    );
};
