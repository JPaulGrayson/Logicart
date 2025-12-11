/**
 * LogiGo VS Code Extension Test Runner
 * Validates all test cases from VSCODE_TESTING_GUIDE.md
 */

import { parseCodeToFlow } from '../bridge/dist/parser.js';

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, ...args) {
  console.log(color, ...args, COLORS.reset);
}

// Test Cases from VSCODE_TESTING_GUIDE.md
const testCases = [
  {
    id: '1.1',
    name: 'Quick Sort',
    code: `
async function quickSort(array, low, high) {
    if (low < high) {
        let pi = await partition(array, low, high);
        await quickSort(array, low, pi - 1);
        await quickSort(array, pi + 1, high);
    }
}`,
    expected: {
      hasDecisionNode: true,
      description: 'Decision node for `if (low < high)`, recursive calls visible'
    }
  },
  {
    id: '1.2',
    name: 'Bubble Sort',
    code: `
for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length - i - 1; j++) {
        if (array[j] > array[j + 1]) {
            // swap
        }
    }
}`,
    expected: {
      hasDecisionNode: true,
      minNodes: 3,
      description: 'Nested for loop structure with decision node inside'
    }
  },
  {
    id: '1.3',
    name: 'A* Pathfinder',
    code: `
function findPath(openSet, end) {
  while (openSet.length > 0) {
      let current = findLowest(openSet);
      if (current === end) return path;
      // process neighbors
  }
}`,
    expected: {
      hasDecisionNode: true,
      description: 'While loop with decision branches'
    }
  },
  {
    id: '2.1',
    name: 'Section Markers',
    code: `
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
}`,
    expected: {
      containerCount: 2,
      containerNames: ['AUTH LOGIC', 'MAIN LOGIC'],
      description: 'TWO container nodes: "AUTH LOGIC" and "MAIN LOGIC"'
    }
  },
  {
    id: '2.2',
    name: 'Function Fallback (No Markers)',
    code: `
function foo() {
  if (x) return 1;
  return 0;
}
function bar() {
  for (let i = 0; i < 10; i++) {
    // loop
  }
}`,
    expected: {
      containerCount: 2,
      containerNames: ['foo', 'bar'],
      description: 'TWO containers named "foo" and "bar" (auto-detected)'
    }
  },
  {
    id: '2.3',
    name: 'Global Flow Fallback',
    code: `
let x = 1;
if (x > 0) {
  console.log('positive');
}`,
    expected: {
      containerCount: 1,
      containerNames: ['Global Flow'],
      description: 'ONE container named "Global Flow"'
    }
  },
  {
    id: '3.1',
    name: 'Minimax AI',
    code: `
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
}`,
    expected: {
      containerCount: 1,
      hasDecisionNode: true,
      description: 'Container "TIC-TAC-TOE MINIMAX AI", multiple decision nodes'
    }
  },
  {
    id: '3.2',
    name: 'Fibonacci',
    code: `
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
}`,
    expected: {
      containerCount: 2,
      containerNames: ['FIBONACCI RECURSION', 'USAGE EXAMPLE'],
      description: 'TWO containers, base case decision nodes'
    }
  },
  {
    id: '3.3',
    name: 'Maze Solver',
    code: `
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
}`,
    expected: {
      containerCount: 1,
      containerNames: ['MAZE SOLVER'],
      hasDecisionNode: true,
      minDecisions: 4,
      description: 'Multiple decision nodes for boundary checks, four recursive calls'
    }
  },
  {
    id: '3.4',
    name: 'Snake Game',
    code: `
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
}`,
    expected: {
      containerCount: 3,
      containerNames: ['SNAKE MOVEMENT', 'COLLISION DETECTION', 'GAME LOOP'],
      description: 'THREE containers, for loops with decision branches'
    }
  },
  {
    id: '4.1',
    name: 'Calculator Simple',
    code: `
// --- CALCULATOR ---
function calculate(a, b, operator) {
  if (operator === '+') return a + b;
  if (operator === '-') return a - b;
  return 'Unknown';
}`,
    expected: {
      containerCount: 1,
      containerNames: ['CALCULATOR'],
      hasDecisionNode: true,
      description: '1 container, decision tree for operators'
    }
  },
  {
    id: '4.2',
    name: 'Calculator + Parser',
    code: `
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
}`,
    expected: {
      containerCount: 2,
      containerNames: ['CALCULATOR', 'INPUT PARSER'],
      description: '2 containers, flowchart expands organically'
    }
  }
];

function runTest(testCase) {
  const result = {
    id: testCase.id,
    name: testCase.name,
    passed: true,
    errors: [],
    details: {}
  };

  try {
    const flowData = parseCodeToFlow(testCase.code);
    const nodes = flowData.nodes;
    const edges = flowData.edges;

    // Count node types
    const containers = nodes.filter(n => n.type === 'container');
    const decisions = nodes.filter(n => n.type === 'decision');
    const outputs = nodes.filter(n => n.type === 'output');

    result.details = {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      containerCount: containers.length,
      decisionCount: decisions.length,
      outputCount: outputs.length,
      containerNames: containers.map(c => c.data.label)
    };

    // Validate expectations
    const exp = testCase.expected;

    if (exp.containerCount !== undefined && containers.length !== exp.containerCount) {
      result.passed = false;
      result.errors.push(`Expected ${exp.containerCount} containers, got ${containers.length}`);
    }

    if (exp.containerNames) {
      for (const name of exp.containerNames) {
        if (!containers.some(c => c.data.label.includes(name))) {
          result.passed = false;
          result.errors.push(`Missing container: "${name}"`);
        }
      }
    }

    if (exp.hasDecisionNode && decisions.length === 0) {
      result.passed = false;
      result.errors.push('Expected decision nodes but found none');
    }

    if (exp.minDecisions && decisions.length < exp.minDecisions) {
      result.passed = false;
      result.errors.push(`Expected at least ${exp.minDecisions} decisions, got ${decisions.length}`);
    }

    if (exp.minNodes && nodes.length < exp.minNodes) {
      result.passed = false;
      result.errors.push(`Expected at least ${exp.minNodes} nodes, got ${nodes.length}`);
    }

  } catch (error) {
    result.passed = false;
    result.errors.push(`Parse error: ${error.message}`);
  }

  return result;
}

function printResults(results) {
  console.log('\n' + '='.repeat(70));
  log(COLORS.bold + COLORS.blue, '📊 LogiGo VS Code Extension Test Results');
  console.log('='.repeat(70) + '\n');

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? COLORS.green : COLORS.red;

    log(color, `${status} | Test ${result.id}: ${result.name}`);

    if (result.passed) {
      passed++;
      console.log(`       📦 Containers: ${result.details.containerCount} | 💎 Decisions: ${result.details.decisionCount} | 🔗 Edges: ${result.details.totalEdges}`);
      if (result.details.containerNames.length > 0) {
        console.log(`       📁 Names: [${result.details.containerNames.join(', ')}]`);
      }
    } else {
      failed++;
      for (const error of result.errors) {
        log(COLORS.red, `       ⚠️  ${error}`);
      }
    }
    console.log();
  }

  console.log('='.repeat(70));
  log(passed === results.length ? COLORS.green : COLORS.yellow,
    `📈 Results: ${passed}/${results.length} tests passed (${failed} failed)`);
  console.log('='.repeat(70) + '\n');

  return { passed, failed, total: results.length };
}

// Run all tests
console.log('\n🚀 Starting LogiGo Test Suite...\n');
const results = testCases.map(runTest);
const summary = printResults(results);

// Exit with appropriate code
process.exit(summary.failed > 0 ? 1 : 0);
