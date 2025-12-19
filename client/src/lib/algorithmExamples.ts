export interface AlgorithmExample {
  id: string;
  name: string;
  category: 'sorting' | 'pathfinding' | 'search' | 'other';
  description: string;
  code: string;
  domPattern?: string;
}

export const algorithmExamples: AlgorithmExample[] = [
  {
    id: 'quicksort',
    name: 'Quick Sort',
    category: 'sorting',
    description: 'Efficient divide-and-conquer sorting algorithm with O(n log n) average complexity',
    domPattern: '#bar-{index}',
    code: `// Quick Sort with LogiGo checkpoints
async function runQuickSort() {
    const array = [64, 34, 25, 12, 22, 11, 90];
    await LogiGo.checkpoint('quicksort:init', { 
        variables: { array: array } 
    });
    await quickSort(array, 0, array.length - 1);
    await LogiGo.checkpoint('quicksort:complete', { 
        color: '#2ecc71',
        variables: { sorted: array } 
    });
}

async function quickSort(array, low, high) {
    if (low < high) {
        await LogiGo.checkpoint('quick_sort:partition_start:' + low + ':' + high);
        let pi = await partition(array, low, high);

        await quickSort(array, low, pi - 1);
        await quickSort(array, pi + 1, high);
    }
}

async function partition(array, low, high) {
    let pivot = array[high];
    
    // Highlight Pivot
    await LogiGo.checkpoint('partition:pivot_selected', {
        domElement: '#bar-' + high,
        color: '#9b59b6',
        variables: { pivot: pivot }
    });

    let i = (low - 1);

    for (let j = low; j < high; j++) {
        await LogiGo.checkpoint('partition:compare:' + j, {
            domElement: '#bar-' + j,
            color: '#f1c40f',
            variables: { current: array[j], pivot: pivot }
        });

        if (array[j] < pivot) {
            i++;
            // Swap logic
            let temp = array[i];
            array[i] = array[j];
            array[j] = temp;
            
            await LogiGo.checkpoint('swap:' + i + ':' + j, { color: '#e74c3c' });
        }
    }
    // Swap pivot to correct position
    let temp = array[i + 1];
    array[i + 1] = array[high];
    array[high] = temp;
    
    return (i + 1);
}

// Run the algorithm
runQuickSort();`
  },
  {
    id: 'bubblesort',
    name: 'Bubble Sort',
    category: 'sorting',
    description: 'Simple comparison-based sorting with O(n²) complexity - great for learning',
    domPattern: '#bar-{index}',
    code: `// Bubble Sort with LogiGo checkpoints
async function runBubbleSort(array) {
    await LogiGo.checkpoint('bubble_sort:start', { variables: { array: array } });

    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length - i - 1; j++) {
            
            // Checkpoint: Comparison
            await LogiGo.checkpoint('compare:' + j + ':' + (j + 1), {
                domElement: '#bar-' + j,
                color: '#f1c40f', // Yellow for compare
                variables: { left: array[j], right: array[j + 1] }
            });

            if (array[j] > array[j + 1]) {
                // Visual Handshake: Highlight swap
                await LogiGo.checkpoint('swap:' + j + ':' + (j + 1), {
                    domElement: '#bar-' + j,
                    color: '#e74c3c', // Red for swap
                    variables: { i: j, j: j + 1 }
                });
                
                // Perform swap
                let temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
            }
        }
    }
    await LogiGo.checkpoint('bubble_sort:complete', { color: '#2ecc71' });
}

// Run with sample data
runBubbleSort([64, 34, 25, 12, 22, 11, 90]);`
  },
  {
    id: 'astar',
    name: 'A* Pathfinder',
    category: 'pathfinding',
    description: 'Optimal pathfinding algorithm using heuristics for efficient graph traversal',
    domPattern: '#cell-{x}-{y}',
    code: `// A* Pathfinding Algorithm with LogiGo checkpoints
async function runAStar(startNode, endNode, grid) {
    await LogiGo.checkpoint('astar:start', {
        variables: { start: startNode, end: endNode }
    });

    const openSet = [startNode];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(key(startNode), 0);
    fScore.set(key(startNode), heuristic(startNode, endNode));

    const visited = new Set();

    while (openSet.length > 0) {
        // Find node with lowest fScore
        let current = openSet.reduce((a, b) =>
            (fScore.get(key(a)) || Infinity) < (fScore.get(key(b)) || Infinity) ? a : b
        );

        // Visual: Highlight current node processing
        await LogiGo.checkpoint('process:' + current.x + ':' + current.y, {
            domElement: '#cell-' + current.x + '-' + current.y,
            color: '#f1c40f',
            variables: {
                x: current.x,
                y: current.y,
                f: fScore.get(key(current)).toFixed(1)
            }
        });

        if (current.x === endNode.x && current.y === endNode.y) {
            await reconstructPath(cameFrom, current);
            return;
        }

        openSet.splice(openSet.indexOf(current), 1);
        visited.add(key(current));

        for (const neighbor of getNeighbors(current, grid)) {
            if (visited.has(key(neighbor))) continue;

            const tentativeGScore = (gScore.get(key(current)) || Infinity) + 1;

            if (tentativeGScore < (gScore.get(key(neighbor)) || Infinity)) {
                cameFrom.set(key(neighbor), current);
                gScore.set(key(neighbor), tentativeGScore);
                fScore.set(key(neighbor), tentativeGScore + heuristic(neighbor, endNode));

                if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                    
                    // Visual: Highlight neighbor discovery
                    await LogiGo.checkpoint('discover:' + neighbor.x + ':' + neighbor.y, {
                        domElement: '#cell-' + neighbor.x + '-' + neighbor.y,
                        color: '#a8e6cf'
                    });
                }
            }
        }
    }
    await LogiGo.checkpoint('astar:fail', { color: '#e74c3c' });
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function key(node) {
    return node.x + ',' + node.y;
}

// Run with sample grid
const grid = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0]
];
runAStar({x: 0, y: 0}, {x: 4, y: 4}, grid);`
  },
  // New examples from testing
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'other',
    description: 'Simple calculator with expression parsing - great for learning control flow',
    code: `// --- CALCULATOR ---
function calculate(a, b, operator) {
  if (operator === '+') {
    return a + b;
  }
  if (operator === '-') {
    return a - b;
  }
  if (operator === '*') {
    return a * b;
  }
  if (operator === '/') {
    if (b === 0) {
      return 'Error: Division by zero';
    }
    return a / b;
  }
  return 'Error: Unknown operator';
}

// --- INPUT PARSER ---
function parseExpression(expr) {
  let num1 = '';
  let num2 = '';
  let operator = '';
  let foundOperator = false;
  
  for (let i = 0; i < expr.length; i++) {
    let char = expr[i];
    if (char === '+' || char === '-' || char === '*' || char === '/') {
      operator = char;
      foundOperator = true;
    } else if (!foundOperator) {
      num1 = num1 + char;
    } else {
      num2 = num2 + char;
    }
  }
  
  return calculate(parseFloat(num1), parseFloat(num2), operator);
}

// Run with sample expression
let result = parseExpression("25+17");
console.log(result);`
  },
  {
    id: 'quiz',
    name: 'Quiz Game',
    category: 'other',
    description: 'Simple quiz game with state management and scoring logic',
    code: `// --- QUIZ STATE ---
function initializeQuiz(questions) {
  let state = {
    questions: questions,
    currentIndex: 0,
    score: 0,
    isComplete: false
  };
  return state;
}

// --- ANSWER CHECKER ---
function checkAnswer(state, userAnswer) {
  let currentQuestion = state.questions[state.currentIndex];
  
  if (userAnswer === currentQuestion.correct) {
    state.score = state.score + 10;
    return { correct: true, score: state.score };
  }
  
  return { correct: false, score: state.score };
}

// --- QUIZ PROGRESSION ---
function nextQuestion(state) {
  state.currentIndex = state.currentIndex + 1;
  
  if (state.currentIndex >= state.questions.length) {
    state.isComplete = true;
    return { done: true, finalScore: state.score };
  }
  
  return { 
    done: false, 
    question: state.questions[state.currentIndex] 
  };
}

// --- GAME LOOP ---
function playRound(state, userAnswer) {
  let result = checkAnswer(state, userAnswer);
  
  if (result.correct) {
    console.log('Correct! Score:', result.score);
  } else {
    console.log('Wrong answer');
  }
  
  return nextQuestion(state);
}

// Run with sample questions
const questions = [
  { text: "What is 2+2?", correct: "4" },
  { text: "What is the capital of France?", correct: "Paris" }
];
let state = initializeQuiz(questions);
playRound(state, "4");`
  },
  {
    id: 'minimax',
    name: 'Tic-Tac-Toe AI',
    category: 'other',
    description: 'Minimax algorithm for unbeatable Tic-Tac-Toe AI - recursive decision making',
    code: `// --- TIC-TAC-TOE MINIMAX AI ---
function checkWinner(board) {
  const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  
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
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, depth + 1, true));
        board[i] = null;
      }
    }
    return best;
  }
}

// Run with sample board
const board = ['X', null, 'O', null, null, null, null, null, null];
let bestScore = minimax(board, 0, true);
console.log("Best score:", bestScore);`
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Memoized',
    category: 'other',
    description: 'Recursive Fibonacci with memoization - demonstrates optimization',
    code: `// --- FIBONACCI RECURSION ---
function fibonacci(n, memo = {}) {
  if (n in memo) {
    return memo[n];
  }
  if (n <= 1) {
    return n;
  }
  
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

// --- USAGE EXAMPLE ---
function runDemo() {
  let result = fibonacci(10);
  console.log(result);
  return result;
}

// Run the demo
runDemo();`
  },
  {
    id: 'maze',
    name: 'Maze Solver',
    category: 'pathfinding',
    description: 'Recursive backtracking maze solver - explores all paths',
    code: `// --- MAZE SOLVER ---
function solveMaze(maze, x, y, visited) {
  // Base cases
  if (x < 0 || x >= maze.length || y < 0 || y >= maze[0].length) {
    return false;
  }
  
  if (maze[x][y] === 1 || visited.has(x + ',' + y)) {
    return false;
  }
  
  if (maze[x][y] === 'E') {
    return true;
  }
  
  // Mark as visited
  visited.add(x + ',' + y);
  
  // Try all four directions
  if (solveMaze(maze, x-1, y, visited)) return true;
  if (solveMaze(maze, x+1, y, visited)) return true;
  if (solveMaze(maze, x, y-1, visited)) return true;
  if (solveMaze(maze, x, y+1, visited)) return true;
  
  // Backtrack
  visited.delete(x + ',' + y);
  return false;
}

// Run with sample maze (0=path, 1=wall, E=exit)
const maze = [
  [0, 0, 1, 0],
  [1, 0, 0, 0],
  [0, 0, 1, 0],
  [0, 1, 0, 'E']
];
solveMaze(maze, 0, 0, new Set());`
  },
  {
    id: 'snake',
    name: 'Snake Game',
    category: 'other',
    description: 'Classic Snake game logic - movement, collision detection, game loop',
    code: `// --- SNAKE MOVEMENT ---
function moveSnake(snake, velocityX, velocityY) {
  for (let i = snake.length - 1; i > 0; i--) {
    snake[i] = snake[i - 1];
  }
  snake[0] = {
    x: snake[0].x + velocityX,
    y: snake[0].y + velocityY
  };
  return snake;
}

// --- COLLISION DETECTION ---
function checkCollision(snake, gridSize) {
  const head = snake[0];
  
  if (head.x < 0 || head.x >= gridSize) {
    return true;
  }
  if (head.y < 0 || head.y >= gridSize) {
    return true;
  }
  
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return true;
    }
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
  
  if (state.snake[0].x === state.food.x && state.snake[0].y === state.food.y) {
    state.score = state.score + 10;
  }
  
  return state;
}

// Run with sample state
const state = {
  snake: [{x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}],
  velocityX: 1,
  velocityY: 0,
  gridSize: 10,
  food: {x: 7, y: 5},
  score: 0,
  gameOver: false
};
gameLoop(state);`
  }
];

export function getExampleById(id: string): AlgorithmExample | undefined {
  return algorithmExamples.find(example => example.id === id);
}

export function getExamplesByCategory(category: AlgorithmExample['category']): AlgorithmExample[] {
  return algorithmExamples.filter(example => example.category === category);
}
