// LogiGo VS Code Extension Test File
// Run "LogiGo: Visualize Current File" command to test

// --- QUICK SORT TEST ---
async function quickSort(array, low, high) {
    if (low < high) {
        let pi = await partition(array, low, high);
        await quickSort(array, low, pi - 1);
        await quickSort(array, pi + 1, high);
    }
}

// --- SECTION MARKERS TEST ---
// --- AUTH LOGIC ---
function validateUser(user) {
    if (!user.email) return false;
    return true;
}

// --- MAIN LOGIC ---
function processData(data) {
    for (let i = 0; i < data.length; i++) {
        // process
    }
}

// --- CALCULATOR TEST ---
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

// --- FIBONACCI RECURSION ---
function fibonacci(n, memo = {}) {
    if (n in memo) return memo[n];
    if (n <= 1) return n;
    memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
    return memo[n];
}

// --- BUBBLE SORT TEST ---
function bubbleSort(array) {
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length - i - 1; j++) {
            if (array[j] > array[j + 1]) {
                // swap
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }
        }
    }
    return array;
}
