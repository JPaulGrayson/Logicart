// --- CALCULATOR ---
function calculate(a, b, operator) {
    if (operator === '+') return a + b;
    if (operator === '-') return a - b;
    if (operator === '*') return a * b;
    if (operator === '/') {
        if (b === 0) return 'Error';
        return a / b;
    }
    return 'Unknown';
}

// --- INPUT PARSER ---
function parseExpression(expr) {
    let foundOperator = false;
    for (let i = 0; i < expr.length; i++) {
        // parsing logic
    }
}
