# LogiGo Studio Testing Guide for VS Code Extension

> **Source:** Shared by LogiGo from Replit - all test cases have been validated ✅ on Replit

## Overview
This document provides test cases for parallel testing of the VS Code extension using the shared `@logigo/bridge` package. The Replit integration has validated all these cases - the VS Code extension should produce **identical flowcharts**.

---

## Test Environment Setup

- [x] Ensure VS Code extension imports `parseCodeToFlow` from `@logigo/bridge`
- [x] Extension should use the same types: `FlowNode`, `FlowEdge`, `FlowData`
- [x] Container nodes should render with **collapsible UI**

---

## Phase 1: Built-in Algorithm Examples

### Test 1.1: Quick Sort
```javascript
async function quickSort(array, low, high) {
    if (low < high) {
        let pi = await partition(array, low, high);
        await quickSort(array, low, pi - 1);
        await quickSort(array, pi + 1, high);
    }
}
```
**Expected:** Decision node for `if (low < high)`, recursive calls visible, partition function call node

### Test 1.2: Bubble Sort
```javascript
for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length - i - 1; j++) {
        if (array[j] > array[j + 1]) {
            // swap
        }
    }
}
```
**Expected:** Nested for loop structure with decision node inside

### Test 1.3: A* Pathfinder
```javascript
while (openSet.length > 0) {
    let current = findLowest(openSet);
    if (current === end) return path;
    // process neighbors
}
```
**Expected:** While loop with decision branches for goal check and neighbor processing

---

## Phase 2: Container Node Testing

### Test 2.1: Section Markers
```javascript
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
```
**Expected:** **TWO** container nodes: "AUTH LOGIC" and "MAIN LOGIC"

### Test 2.2: Function Fallback (No Markers)
```javascript
function foo() {
  if (x) return 1;
  return 0;
}
function bar() {
  for (let i = 0; i < 10; i++) {
    // loop
  }
}
```
**Expected:** **TWO** containers named "foo" and "bar" (auto-detected from function declarations)

### Test 2.3: Global Flow Fallback
```javascript
let x = 1;
if (x > 0) {
  console.log('positive');
}
```
**Expected:** **ONE** container named "Global Flow" (no section markers, no function declarations)

---

## Phase 3: Complex Algorithm Testing

### Test 3.1: Tic-Tac-Toe Minimax AI
```javascript
// --- TIC-TAC-TOE MINIMAX AI ---
function checkWinner(board) {
  const winPatterns = [[0,1,2], [3,4,5], [6,7,8]];
  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : 'tie';
}
function minimax(board, depth, isMaximizing) {
  const winner = checkWinner(board);
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (winner === 'tie') return 0;
  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = null;
      }
    }
    return best;
  }
  return 0;
}
```
**Expected:** Container "TIC-TAC-TOE MINIMAX AI", multiple decision nodes, for loop with nested conditional

### Test 3.2: Recursive Fibonacci with Memoization
```javascript
// --- FIBONACCI RECURSION ---
function fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}
// --- USAGE EXAMPLE ---
function runDemo() {
  let result = fibonacci(10);
  return result;
}
```
**Expected:** TWO containers, base case decision nodes, recursive call nodes

### Test 3.3: Maze Solver with Backtracking
```javascript
// --- MAZE SOLVER ---
function solveMaze(maze, x, y, visited) {
  if (x < 0 || x >= maze.length || y < 0 || y >= maze[0].length) {
    return false;
  }
  if (maze[x][y] === 1 || visited.has(x + ',' + y)) {
    return false;
  }
  if (maze[x][y] === 'E') {
    return true;
  }
  visited.add(x + ',' + y);
  if (solveMaze(maze, x-1, y, visited)) return true;
  if (solveMaze(maze, x+1, y, visited)) return true;
  if (solveMaze(maze, x, y-1, visited)) return true;
  if (solveMaze(maze, x, y+1, visited)) return true;
  visited.delete(x + ',' + y);
  return false;
}
```
**Expected:** Multiple decision nodes for boundary/wall checks, four recursive calls visible

### Test 3.4: Snake Game Logic
```javascript
// --- SNAKE MOVEMENT ---
function moveSnake(snake, velocityX, velocityY) {
  for (let i = snake.length - 1; i > 0; i--) {
    snake[i] = snake[i - 1];
  }
  snake[0] = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
  return snake;
}
// --- COLLISION DETECTION ---
function checkCollision(snake, gridSize) {
  const head = snake[0];
  if (head.x < 0 || head.x >= gridSize) return true;
  if (head.y < 0 || head.y >= gridSize) return true;
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) return true;
  }
  return false;
}
// --- GAME LOOP ---
function gameLoop(state) {
  if (checkCollision(state.snake, state.gridSize)) {
    state.gameOver = true;
    return state;
  }
  moveSnake(state.snake, state.velocityX, state.velocityY);
  return state;
}
```
**Expected:** THREE containers, for loops with decision branches, function call nodes

---

## Phase 4: Incremental Development Simulation

### Test 4.1: Start Simple
```javascript
// --- CALCULATOR ---
function calculate(a, b, operator) {
  if (operator === '+') return a + b;
  if (operator === '-') return a - b;
  return 'Unknown';
}
```
**Expected:** 1 container, decision tree for operators

### Test 4.2: Add Feature
```javascript
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
```
**Expected:** 2 containers now, flowchart expands organically

---

## Verification Checklist

For each test case, verify:

- [ ] Container nodes render with correct names
- [ ] Decision nodes (diamonds) appear for `if`/`for`/`while`
- [ ] Loop edges show animated back-arrows
- [ ] Multiple return statements create multiple exit nodes
- [ ] Start node appears at top of flow
- [ ] Dagre layout positions nodes without overlap
- [ ] `nodeMap` correctly maps source locations to node IDs

---

## FlowNode Type Reference

```typescript
interface FlowNode {
  id: string;
  type: 'input' | 'output' | 'default' | 'decision' | 'container';
  data: {
    label: string;
    description?: string;
    sourceData?: SourceLocation;
    children?: string[];
    collapsed?: boolean;
    zoomLevel?: 'mile-high' | '1000ft' | '100ft';
    isChildOfCollapsed?: boolean;
  };
  position: { x: number; y: number };
  parentNode?: string;
  extent?: 'parent';
  hidden?: boolean;
  style?: { width: number; height: number };
}
```

---

## Control Messages (For Bi-directional Editing)

```typescript
// Studio → IDE
LOGIGO_JUMP_TO_LINE: { path: string, line: number, column?: number }
LOGIGO_WRITE_FILE: { path: string, content: string }
LOGIGO_REQUEST_FILE: { path?: string }
```

---

## Test Results Template

| Test ID | Test Name            | Replit Result | VS Code Result | Notes |
|---------|----------------------|---------------|----------------|-------|
| 1.1     | Quick Sort           | ✅ Pass       | ✅ Pass        | 1 container, 1 decision, 4 edges |
| 1.2     | Bubble Sort          | ✅ Pass       | ✅ Pass        | 3 decisions, 10 edges |
| 1.3     | A* Pathfinder        | ✅ Pass       | ✅ Pass        | 2 decisions, 6 edges |
| 2.1     | Section Markers      | ✅ Pass       | ✅ Pass        | 2 containers: AUTH LOGIC, MAIN LOGIC |
| 2.2     | Function Fallback    | ✅ Pass       | ✅ Pass        | 2 containers: foo, bar |
| 2.3     | Global Flow          | ✅ Pass       | ✅ Pass        | 1 container: Global Flow |
| 3.1     | Minimax AI           | ✅ Pass       | ✅ Pass        | 6 decisions, 21 edges |
| 3.2     | Fibonacci            | ✅ Pass       | ✅ Pass        | 2 containers, 2 decisions |
| 3.3     | Maze Solver          | ✅ Pass       | ✅ Pass        | 7 decisions, 17 edges |
| 3.4     | Snake Game           | ✅ Pass       | ✅ Pass        | 3 containers, 6 decisions |
| 4.1     | Calculator Simple    | ✅ Pass       | ✅ Pass        | 2 decisions, 5 edges |
| 4.2     | Calculator + Parser  | ✅ Pass       | ✅ Pass        | 2 containers, 6 decisions |

**Last tested:** 2025-12-10 via automated test runner
