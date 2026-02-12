# Design Plan: Math Notebook (Karoheft) Calculator

A specialized UI component for children to perform arithmetic operations in a "written" format (schriftliches Rechnen) using a grid layout similar to a school math notebook.

## Core Interaction
- **Grid Layout**: A 10x10 (flexible) grid of "Karo" cells.
- **Pre-filled Data**: The prompt's numbers (`a` and `b`) are placed automatically in the top rows, aligned by place value (ones, tens, hundreds).
- **Operation Line**: A line below the second number to separate the task from the solution area.
- **Carry Row (Merkzahlen)**: A row of smaller input fields for carry-over values.
- **Result Row**: The main input area for the final answer.
- **Input Handling**:
    - Each cell is a small input field (limited to 1 character).
    - Arrow keys or jumping logic (right-to-left) to facilitate natural mental arithmetic flow.
    - Submit via "Prüfen" button or Enter key.

## Technical Architecture

### Components
- `GridCalculator`: The main entry point for the grid logic.
- `GridCell`: A reusable input component for individual squares.

### State Management
- `gridData`: A 2D array or object map representing the contents of each cell.
- `focusedCell`: Coordinate of the currently active input.

### Validation
- Extract the digits from the final result row.
- Compare the concatenated number with the expected `task.result`.

## UI/UX
- **Aesthetic**: Blue grid lines, "Plus Jakarta Sans" font for a clean look, vibrant green/red for feedback.
- **Accessibility**: High contrast for the operator (+/-), clear labels for "Merkzahlen" and "Ergebnis".
