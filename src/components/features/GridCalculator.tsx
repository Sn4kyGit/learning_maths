import React, { useState, useEffect, useRef } from 'react';

interface GridCalculatorProps {
    a: number;
    b: number;
    op: '+' | '-';
    onCheck: (result: number) => void;
    status: 'idle' | 'correct' | 'wrong' | 'failed';
}

export const GridCalculator: React.FC<GridCalculatorProps> = ({ a, b, op, onCheck, status }) => {
    // We'll use a 6x5 grid (6 columns for up to 999,999; 5 rows: num1, op+num2, line, carries, result)
    // Row 0: num a
    // Row 1: op + num b
    // Row 2: carry row (Merkzahlen)
    // Row 3: result row
    const COLS = 6;
    const ROWS = 4; // We'll handle the line as a CSS border on row 1

    const [grid, setGrid] = useState<Record<string, string>>({});
    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Pre-fill numbers a and b
    useEffect(() => {
        const newGrid: Record<string, string> = {};
        const strA = a.toString();
        const strB = b.toString();

        // Fill row 0 (number a)
        for (let i = 0; i < strA.length; i++) {
            newGrid[`0-${COLS - 1 - i}`] = strA[strA.length - 1 - i];
        }

        // Fill row 1 (number b)
        for (let i = 0; i < strB.length; i++) {
            newGrid[`1-${COLS - 1 - i}`] = strB[strB.length - 1 - i];
        }

        setGrid(newGrid);

        // Focus last result cell
        setTimeout(() => {
            inputRefs.current[`3-${COLS - 1}`]?.focus();
        }, 100);
    }, [a, b]);

    const handleInputChange = (row: number, col: number, value: string) => {
        if (status !== 'idle' && status !== 'wrong') return;

        // Only allow digits
        const digit = value.slice(-1);
        if (digit !== '' && !/^\d$/.test(digit)) return;

        const key = `${row}-${col}`;
        setGrid(prev => ({ ...prev, [key]: digit }));

        // Auto-focus next cell (left for arithmetic)
        if (digit !== '' && col > 0) {
            inputRefs.current[`${row}-${col - 1}`]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
        if (e.key === 'Enter') {
            submitForm();
            return;
        }

        if (e.key === 'Backspace' && !grid[`${row}-${col}`] && col < COLS - 1) {
            inputRefs.current[`${row}-${col + 1}`]?.focus();
            return;
        }

        // Arrow navigation
        if (e.key === 'ArrowLeft' && col > 0) inputRefs.current[`${row}-${col - 1}`]?.focus();
        if (e.key === 'ArrowRight' && col < COLS - 1) inputRefs.current[`${row}-${col + 1}`]?.focus();
        if (e.key === 'ArrowUp' && row > 2) inputRefs.current[`${row - 1}-${col}`]?.focus();
        if (e.key === 'ArrowDown' && row < 3) inputRefs.current[`${row + 1}-${col}`]?.focus();
    };

    const submitForm = () => {
        let resultStr = '';
        for (let i = 0; i < COLS; i++) {
            resultStr += grid[`3-${i}`] || '';
        }
        const numericResult = parseInt(resultStr, 10);
        onCheck(isNaN(numericResult) ? 0 : numericResult);
    };

    return (
        <div className="math-notebook">
            <div className="math-grid-container">
                <div className="math-grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                    {/* Header: numbers a and b are read-only */}
                    {[0, 1].map(row => (
                        <React.Fragment key={row}>
                            {Array.from({ length: COLS }).map((_, col) => {
                                const isOperatorCell = row === 1 && col === 0;
                                return (
                                    <div
                                        key={`${row}-${col}`}
                                        className={`karo-cell static ${row === 1 ? 'row-b' : ''}`}
                                    >
                                        {isOperatorCell ? <span className="grid-operator">{op}</span> : (grid[`${row}-${col}`] || '')}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}

                    {/* Rechenstrich border handled via .row-b class in CSS */}

                    {/* Carry Row (Merkzahlen) */}
                    {Array.from({ length: COLS }).map((_, col) => (
                        <div key={`carry-${col}`} className="karo-cell carry">
                            <input
                                ref={el => inputRefs.current[`2-${col}`] = el}
                                type="text"
                                maxLength={1}
                                value={grid[`2-${col}`] || ''}
                                onChange={(e) => handleInputChange(2, col, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 2, col)}
                                className="carry-input"
                                disabled={status === 'correct' || status === 'failed'}
                            />
                        </div>
                    ))}

                    {/* Result Row */}
                    {Array.from({ length: COLS }).map((_, col) => (
                        <div key={`result-${col}`} className={`karo-cell result ${status}`}>
                            <input
                                ref={el => inputRefs.current[`3-${col}`] = el}
                                type="text"
                                maxLength={1}
                                value={grid[`3-${col}`] || ''}
                                onChange={(e) => handleInputChange(3, col, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 3, col)}
                                className="result-input"
                                disabled={status === 'correct' || status === 'failed'}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid-actions">
                {status === 'idle' || status === 'wrong' ? (
                    <button
                        onClick={submitForm}
                        className={`action-btn ${status === 'wrong' ? 'error' : 'primary'}`}
                    >
                        {status === 'wrong' ? 'Nochmal versuchen' : 'Prüfen'}
                    </button>
                ) : null}
            </div>
        </div>
    );
};
