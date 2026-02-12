import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GridCalculatorProps {
    num1: number;
    num2: number;
    operator: '+' | '-';
    isMoney?: boolean;
    onSuccess?: () => void;
    onFailure?: () => void;
    onNext?: () => void;
}

export const GridCalculator: React.FC<GridCalculatorProps> = ({
    num1,
    num2,
    operator,
    isMoney = false,
    onSuccess,
    onFailure,
    onNext
}) => {
    // We'll use a 7x5 grid (6 digit columns + 1 comma column; 5 rows)
    // The comma is between columns 4 and 5 (10^0 and 10^-1)
    const DIGIT_COLS = 6;
    const COMMA_COL_INDEX = 4; // 0, 1, 2, 3, [COMMA], 4, 5
    const TOTAL_COLS = DIGIT_COLS + 1;

    const [grid, setGrid] = useState<Record<string, string>>(() => {
        const initialGrid: Record<string, string> = {};
        const strA = num1.toString().padStart(3, '0');
        const strB = num2.toString().padStart(3, '0');

        const fillRow = (row: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
                const char = str[str.length - 1 - i];
                const gridCol = TOTAL_COLS - 1 - (i >= 2 ? i + 1 : i);
                if (gridCol >= 0) {
                    initialGrid[`${row}-${gridCol}`] = char;
                }
            }
        };

        fillRow(0, strA);
        fillRow(1, strB);
        return initialGrid;
    });

    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Side effects (Focus)
    useEffect(() => {
        // Focus last result cell (TOTAL_COLS - 1)
        const timer = setTimeout(() => {
            inputRefs.current[`3-${TOTAL_COLS - 1}`]?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, [TOTAL_COLS]);

    const handleInputChange = (row: number, col: number, value: string) => {
        if (status === 'correct') return;
        if (col === COMMA_COL_INDEX) return; // Comma is static

        // Only allow digits
        const digit = value.slice(-1);
        if (digit !== '' && !/^\d$/.test(digit)) return;

        const key = `${row}-${col}`;
        setGrid(prev => ({ ...prev, [key]: digit }));

        // Auto-focus next cell (left for arithmetic)
        if (digit !== '') {
            let nextCol = col - 1;
            if (nextCol === COMMA_COL_INDEX) nextCol--;
            if (nextCol >= 0) {
                inputRefs.current[`${row}-${nextCol}`]?.focus();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
        if (e.key === 'Enter') {
            submitForm();
            return;
        }

        if (e.key === 'Backspace' && !grid[`${row}-${col}`]) {
            let nextCol = col + 1;
            if (nextCol === COMMA_COL_INDEX) nextCol++;
            if (nextCol < TOTAL_COLS) {
                inputRefs.current[`${row}-${nextCol}`]?.focus();
            }
            return;
        }

        // Arrow navigation
        if (e.key === 'ArrowLeft') {
            let nextCol = col - 1;
            if (nextCol === COMMA_COL_INDEX) nextCol--;
            if (nextCol >= 0) inputRefs.current[`${row}-${nextCol}`]?.focus();
        }
        if (e.key === 'ArrowRight') {
            let nextCol = col + 1;
            if (nextCol === COMMA_COL_INDEX) nextCol++;
            if (nextCol < TOTAL_COLS) inputRefs.current[`${row}-${nextCol}`]?.focus();
        }
        if (e.key === 'ArrowUp' && row > 2) inputRefs.current[`${row - 1}-${col}`]?.focus();
        if (e.key === 'ArrowDown' && row < 3) inputRefs.current[`${row + 1}-${col}`]?.focus();
    };

    const submitForm = () => {
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
            onSuccess?.();
            setTimeout(() => {
                onNext?.();
            }, 1500);
        } else {
            setStatus('wrong');
            onFailure?.();
            setTimeout(() => setStatus('idle'), 1000);
        }
    };

    const clearGrid = () => {
        setGrid(prev => {
            const next = { ...prev };
            for (let i = 0; i < TOTAL_COLS; i++) {
                delete next[`2-${i}`]; // Clear carries
                delete next[`3-${i}`]; // Clear results
            }
            return next;
        });
        // Refocus last cell
        setTimeout(() => {
            inputRefs.current[`3-${TOTAL_COLS - 1}`]?.focus();
        }, 50);
    };

    const hasContent = Object.keys(grid).some(key => (key.startsWith('2-') || key.startsWith('3-')) && grid[key]);

    return (
        <div className="math-notebook">
            <div className="math-grid-container">
                <div className="math-grid-wrapper">
                    <div className="math-grid money" style={{ gridTemplateColumns: `repeat(${TOTAL_COLS}, 1fr)` }}>
                        {/* Header: numbers a and b are read-only */}
                        {[0, 1].map(row => (
                            <React.Fragment key={row}>
                                {Array.from({ length: TOTAL_COLS }).map((_, col) => {
                                    const isOperatorCell = row === 1 && col === 0;
                                    const isCommaCell = col === COMMA_COL_INDEX;
                                    return (
                                        <div
                                            key={`${row}-${col}`}
                                            className={`karo-cell static ${row === 1 ? 'row-b' : ''} ${isCommaCell ? 'comma-cell' : ''}`}
                                        >
                                            {isOperatorCell ? (
                                                <span className="grid-operator">{operator}</span>
                                            ) : isCommaCell ? (
                                                <span className="grid-comma">,</span>
                                            ) : (
                                                grid[`${row}-${col}`] || ''
                                            )}
                                            {/* Show Currency symbol after last column */}
                                            {isMoney && col === TOTAL_COLS - 1 && <span className="grid-currency">€</span>}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}

                        {/* Carry Row (Merkzahlen) */}
                        {Array.from({ length: TOTAL_COLS }).map((_, col) => {
                            const isCommaCell = col === COMMA_COL_INDEX;
                            return (
                                <div key={`carry-${col}`} className={`karo-cell carry ${isCommaCell ? 'comma-cell' : ''}`}>
                                    {isCommaCell ? (
                                        <span className="grid-comma invisible">,</span>
                                    ) : (
                                        <input
                                            ref={el => { inputRefs.current[`2-${col}`] = el; }}
                                            type="text"
                                            maxLength={1}
                                            value={grid[`2-${col}`] || ''}
                                            onChange={(e) => handleInputChange(2, col, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, 2, col)}
                                            className="carry-input"
                                            disabled={status === 'correct'}
                                        />
                                    )}
                                </div>
                            );
                        })}

                        {/* Result Row */}
                        {Array.from({ length: TOTAL_COLS }).map((_, col) => {
                            const isCommaCell = col === COMMA_COL_INDEX;
                            return (
                                <div key={`result-${col}`} className={`karo-cell result ${status} ${isCommaCell ? 'comma-cell' : ''}`}>
                                    {isCommaCell ? (
                                        <span className="grid-comma">,</span>
                                    ) : (
                                        <input
                                            ref={el => { inputRefs.current[`3-${col}`] = el; }}
                                            type="text"
                                            maxLength={1}
                                            value={grid[`3-${col}`] || ''}
                                            onChange={(e) => handleInputChange(3, col, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, 3, col)}
                                            className="result-input"
                                            disabled={status === 'correct'}
                                        />
                                    )}
                                    {isMoney && col === TOTAL_COLS - 1 && <span className="grid-currency">€</span>}
                                </div>
                            );
                        })}
                    </div>

                    {(hasContent || status === 'wrong') && status !== 'correct' && (
                        <button
                            className="grid-reset-btn"
                            onClick={clearGrid}
                            title="Löschen"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="grid-actions">
                <AnimatePresence>
                    {(status === 'idle' || status === 'wrong') && (
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            onClick={submitForm}
                            className={`action-btn ${status === 'wrong' ? 'error' : 'primary'}`}
                        >
                            {status === 'wrong' ? 'Nochmal versuchen' : 'Prüfen'}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
