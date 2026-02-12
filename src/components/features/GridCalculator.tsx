import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

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
    const DIGIT_COLS = 6;
    const COMMA_COL_INDEX = 4;
    const TOTAL_COLS = DIGIT_COLS + 1;

    const controls = useAnimation(); // For the shake effect

    const [grid, setGrid] = useState<Record<string, string>>(() => {
        const initialGrid: Record<string, string> = {};
        const formatNum = (n: number) => n.toString().padStart(6, '0');
        const strA = formatNum(num1);
        const strB = formatNum(num2);

        const fillRow = (row: number, str: string) => {
            let foundSignificant = false;
            for (let i = 0; i < str.length; i++) {
                const char = str[i];
                const isDecimalPlace = i >= str.length - 2;

                if (char !== '0' || foundSignificant || isDecimalPlace) {
                    foundSignificant = true;
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

    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [lastInputCell, setLastInputCell] = useState<string | null>(null);
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Side effects (Focus)
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRefs.current[`3-${TOTAL_COLS - 1}`]?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, [TOTAL_COLS]);

    const handleInputChange = (row: number, col: number, value: string) => {
        if (status === 'correct') return;
        if (col === COMMA_COL_INDEX) return;

        const digit = value.slice(-1);
        if (digit !== '' && !/^\d$/.test(digit)) return;

        const key = `${row}-${col}`;
        setGrid(prev => ({ ...prev, [key]: digit }));

        if (digit !== '') {
            setLastInputCell(key);
            setTimeout(() => setLastInputCell(null), 300);

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
    };

    const submitForm = async () => {
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
            setTimeout(() => onNext?.(), 1500);
        } else {
            setStatus('wrong');
            await controls.start({
                x: [-10, 10, -10, 10, 0],
                transition: { duration: 0.4 }
            });
            onFailure?.();
            setTimeout(() => setStatus('idle'), 1000);
        }
    };

    const clearGrid = () => {
        setGrid(prev => {
            const next = { ...prev };
            for (let i = 0; i < TOTAL_COLS; i++) {
                delete next[`2-${i}`];
                delete next[`3-${i}`];
            }
            return next;
        });
        setTimeout(() => inputRefs.current[`3-${TOTAL_COLS - 1}`]?.focus(), 50);
    };

    const hasContent = Object.keys(grid).some(key => (key.startsWith('2-') || key.startsWith('3-')) && grid[key]);

    const gridTemplate = Array.from({ length: TOTAL_COLS })
        .map((_, i) => i === COMMA_COL_INDEX ? '25px' : '50px')
        .join(' ');

    return (
        <div className="math-notebook">
            <motion.div className="math-grid-container" animate={controls}>
                <div className="math-grid-wrapper">
                    <div className="math-grid" style={{ gridTemplateColumns: gridTemplate }}>
                        {/* Header: read-only numbers */}
                        {[0, 1].map(row => (
                            <React.Fragment key={row}>
                                {Array.from({ length: TOTAL_COLS }).map((_, col) => {
                                    const isOperatorCell = row === 1 && col === 0;
                                    const isCommaCell = col === COMMA_COL_INDEX;
                                    return (
                                        <div
                                            key={`${row}-${col}`}
                                            className={`karo-cell static ${isCommaCell ? 'comma-cell' : ''}`}
                                        >
                                            {isOperatorCell ? (
                                                <span className="grid-operator">{operator}</span>
                                            ) : isCommaCell ? (
                                                <span className="grid-comma">,</span>
                                            ) : (
                                                grid[`${row}-${col}`] || ''
                                            )}
                                            {isMoney && col === TOTAL_COLS - 1 && <span className="grid-currency">€</span>}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}

                        {/* Carry Row */}
                        {Array.from({ length: TOTAL_COLS }).map((_, col) => {
                            const isCommaCell = col === COMMA_COL_INDEX;
                            return (
                                <div key={`carry-${col}`} className={`karo-cell carry ${isCommaCell ? 'comma-cell' : ''} ${lastInputCell === `2-${col}` ? 'animate-pop' : ''}`}>
                                    {!isCommaCell && (
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
                                <div key={`result-${col}`} className={`karo-cell result ${status} ${isCommaCell ? 'comma-cell' : ''} ${lastInputCell === `3-${col}` ? 'animate-pop' : ''}`}>
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
                        <button className="grid-reset-btn" onClick={clearGrid} title="Löschen">✕</button>
                    )}
                </div>
            </motion.div>

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
