export interface AlgorithmExample {
  id: string;
  name: string;
  category: 'sorting' | 'pathfinding' | 'search' | 'other' | 'integration';
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
  },
  // Integration Examples - Show how to add LogiGo to existing apps
  {
    id: 'integration-todo',
    name: 'Todo App Integration',
    category: 'integration',
    description: 'Learn how to add LogiGo checkpoints to a typical todo app - step by step',
    code: `// ================================================
// INTEGRATION EXAMPLE: Adding LogiGo to a Todo App
// ================================================
// This example shows BOTH integration methods:
// 1. Static Mode: Use // @logigo: comments for flowchart labels
// 2. Live Mode: Use LogiGo.checkpoint() for runtime visualization

// --- TODO STORAGE ---
// @logigo: Initialize todo storage
const todos = [];

// --- ADD TODO ---
// @logigo: Add new todo function
async function addTodo(text) {
  // Checkpoint: Track function entry with variable state
  await LogiGo.checkpoint('todo:add:start', { 
    variables: { text, todoCount: todos.length } 
  });
  
  // @logigo: Create todo object
  const todo = {
    id: Date.now(),
    text: text,
    completed: false
  };
  
  // Checkpoint: Track new todo creation
  await LogiGo.checkpoint('todo:add:created', { 
    variables: { todo } 
  });
  
  // @logigo: Add to list
  todos.push(todo);
  
  // @logigo: Return new todo
  return todo;
}

// --- TOGGLE COMPLETE ---
// @logigo: Toggle todo completion
async function toggleTodo(id) {
  await LogiGo.checkpoint('todo:toggle:start', { 
    variables: { searchId: id } 
  });
  
  // @logigo: Find todo by ID
  for (let i = 0; i < todos.length; i++) {
    // Checkpoint: Highlight each comparison
    await LogiGo.checkpoint('todo:toggle:compare:' + i, {
      color: '#f1c40f',
      variables: { checking: todos[i].id, target: id }
    });
    
    // @logigo: Check if match
    if (todos[i].id === id) {
      // @logigo: Toggle status
      todos[i].completed = !todos[i].completed;
      
      // Checkpoint: Found and toggled
      await LogiGo.checkpoint('todo:toggle:done', {
        color: '#2ecc71',
        variables: { toggled: todos[i] }
      });
      return todos[i];
    }
  }
  // @logigo: Not found
  return null;
}

// --- DELETE TODO ---
// @logigo: Delete todo function
async function deleteTodo(id) {
  await LogiGo.checkpoint('todo:delete:start', { variables: { id } });
  
  // @logigo: Find index
  for (let i = 0; i < todos.length; i++) {
    // @logigo: Check if match
    if (todos[i].id === id) {
      // @logigo: Remove from array
      todos.splice(i, 1);
      
      await LogiGo.checkpoint('todo:delete:done', { 
        color: '#e74c3c',
        variables: { deletedId: id, remaining: todos.length }
      });
      return true;
    }
  }
  // @logigo: Not found
  return false;
}

// --- FILTER TODOS ---
// @logigo: Get filtered todos
async function getFilteredTodos(filter) {
  await LogiGo.checkpoint('todo:filter:start', { variables: { filter } });
  
  // @logigo: Check filter type
  if (filter === 'completed') {
    // @logigo: Return only completed
    const result = todos.filter(t => t.completed);
    await LogiGo.checkpoint('todo:filter:done', { variables: { count: result.length } });
    return result;
  }
  // @logigo: Check for active filter
  if (filter === 'active') {
    // @logigo: Return only active
    const result = todos.filter(t => !t.completed);
    await LogiGo.checkpoint('todo:filter:done', { variables: { count: result.length } });
    return result;
  }
  // @logigo: Return all
  return todos;
}

// --- RUN DEMO ---
// In Static Mode: Flowchart shows labeled nodes
// In Live Mode: Checkpoints fire during execution
async function runDemo() {
  await addTodo("Learn LogiGo");
  await addTodo("Build amazing app");
  await addTodo("Ship to users");
  await toggleTodo(todos[0].id);
  await getFilteredTodos('completed');
}

runDemo();`
  },
  {
    id: 'integration-api',
    name: 'API Handler Integration',
    category: 'integration',
    description: 'Add LogiGo to API request/response handling code',
    code: `// ================================================
// INTEGRATION EXAMPLE: API Handler with LogiGo
// ================================================
// Shows how to visualize request processing flow
// Demonstrates: validation, rate limiting, error paths

// --- REQUEST VALIDATOR ---
// @logigo: Validate incoming request
async function validateRequest(request) {
  await LogiGo.checkpoint('validate:start', { 
    variables: { hasBody: !!request.body } 
  });
  
  // @logigo: Check if body exists
  if (!request.body) {
    await LogiGo.checkpoint('validate:fail', { 
      color: '#e74c3c',
      variables: { error: 'Missing body' }
    });
    return { valid: false, error: 'Missing body' };
  }
  
  // @logigo: Check required fields
  if (!request.body.email) {
    await LogiGo.checkpoint('validate:fail', { 
      color: '#e74c3c',
      variables: { error: 'Missing email' }
    });
    return { valid: false, error: 'Missing email' };
  }
  
  // @logigo: Validate email format
  const emailRegex = /^[^@]+@[^@]+\\.[^@]+$/;
  if (!emailRegex.test(request.body.email)) {
    await LogiGo.checkpoint('validate:fail', { 
      color: '#e74c3c',
      variables: { error: 'Invalid email' }
    });
    return { valid: false, error: 'Invalid email format' };
  }
  
  // @logigo: Request is valid
  await LogiGo.checkpoint('validate:pass', { 
    color: '#2ecc71',
    variables: { email: request.body.email }
  });
  return { valid: true };
}

// --- RATE LIMITER ---
// @logigo: Rate limit storage
const rateLimits = {};

// @logigo: Check rate limit
async function checkRateLimit(clientId) {
  const now = Date.now();
  const windowMs = 60000;
  const maxRequests = 10;
  
  await LogiGo.checkpoint('ratelimit:check', { 
    variables: { clientId } 
  });
  
  // @logigo: Initialize client record
  if (!rateLimits[clientId]) {
    rateLimits[clientId] = { count: 0, resetAt: now + windowMs };
    await LogiGo.checkpoint('ratelimit:new_client', { 
      color: '#3498db',
      variables: { clientId }
    });
  }
  
  const client = rateLimits[clientId];
  
  // @logigo: Check if window expired
  if (now > client.resetAt) {
    // @logigo: Reset window
    client.count = 0;
    client.resetAt = now + windowMs;
  }
  
  // @logigo: Increment count
  client.count++;
  
  // @logigo: Check limit
  if (client.count > maxRequests) {
    await LogiGo.checkpoint('ratelimit:exceeded', { 
      color: '#e74c3c',
      variables: { count: client.count, max: maxRequests }
    });
    return { allowed: false, retryAfter: client.resetAt - now };
  }
  
  // @logigo: Request allowed
  await LogiGo.checkpoint('ratelimit:allowed', { 
    color: '#2ecc71',
    variables: { remaining: maxRequests - client.count }
  });
  return { allowed: true, remaining: maxRequests - client.count };
}

// --- REQUEST HANDLER ---
// @logigo: Handle API request
async function handleRequest(request) {
  await LogiGo.checkpoint('request:received', { 
    variables: { clientId: request.clientId }
  });
  
  // @logigo: Check rate limit first
  const rateCheck = await checkRateLimit(request.clientId);
  if (!rateCheck.allowed) {
    await LogiGo.checkpoint('response:429', { color: '#e74c3c' });
    return { status: 429, body: { error: 'Too many requests' } };
  }
  
  // @logigo: Validate request
  const validation = await validateRequest(request);
  if (!validation.valid) {
    await LogiGo.checkpoint('response:400', { color: '#e74c3c' });
    return { status: 400, body: { error: validation.error } };
  }
  
  // @logigo: Process request
  const result = { id: Date.now(), email: request.body.email };
  
  // @logigo: Return success
  await LogiGo.checkpoint('response:200', { 
    color: '#2ecc71',
    variables: { result }
  });
  return { status: 200, body: result };
}

// --- TEST THE FLOW ---
async function runDemo() {
  const testRequest = {
    clientId: 'user-123',
    body: { email: 'test@example.com' }
  };
  await handleRequest(testRequest);
}

runDemo();`
  },
  {
    id: 'integration-checkout',
    name: 'Checkout Flow Integration',
    category: 'integration',
    description: 'Visualize e-commerce checkout logic with validation and totals',
    code: `// ================================================
// INTEGRATION EXAMPLE: E-commerce Checkout
// ================================================
// Visualize cart calculations and checkout flow
// Shows: state management, calculations, discounts

// --- CART STATE ---
// @logigo: Initialize cart
const cart = {
  items: [],
  coupon: null
};

// --- ADD TO CART ---
// @logigo: Add item to cart
async function addToCart(product, quantity) {
  await LogiGo.checkpoint('cart:add:start', { 
    variables: { product: product.name, quantity }
  });
  
  // @logigo: Check if already in cart
  const existing = cart.items.find(i => i.productId === product.id);
  
  if (existing) {
    // @logigo: Update quantity
    existing.quantity += quantity;
    await LogiGo.checkpoint('cart:add:updated', { 
      color: '#f1c40f',
      variables: { item: existing.name, newQty: existing.quantity }
    });
  } else {
    // @logigo: Add new item
    cart.items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity
    });
    await LogiGo.checkpoint('cart:add:new', { 
      color: '#2ecc71',
      variables: { item: product.name }
    });
  }
  
  return cart;
}

// --- CALCULATE SUBTOTAL ---
// @logigo: Calculate cart subtotal
async function calculateSubtotal() {
  let subtotal = 0;
  
  await LogiGo.checkpoint('calc:subtotal:start', { 
    variables: { itemCount: cart.items.length }
  });
  
  // @logigo: Sum all items
  for (let item of cart.items) {
    // @logigo: Calculate item total
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    
    await LogiGo.checkpoint('calc:item', { 
      variables: { item: item.name, total: itemTotal.toFixed(2) }
    });
  }
  
  await LogiGo.checkpoint('calc:subtotal:done', { 
    variables: { subtotal: subtotal.toFixed(2) }
  });
  return subtotal;
}

// --- APPLY COUPON ---
// @logigo: Apply discount coupon
async function applyCoupon(code) {
  await LogiGo.checkpoint('coupon:check', { variables: { code } });
  
  const coupons = {
    'SAVE10': { type: 'percent', value: 10 },
    'SAVE20': { type: 'percent', value: 20 },
    'FLAT50': { type: 'fixed', value: 50 }
  };
  
  // @logigo: Look up coupon
  if (coupons[code]) {
    cart.coupon = coupons[code];
    await LogiGo.checkpoint('coupon:applied', { 
      color: '#2ecc71',
      variables: { discount: cart.coupon.value + (cart.coupon.type === 'percent' ? '%' : ' off') }
    });
    return { success: true, coupon: cart.coupon };
  }
  
  // @logigo: Invalid coupon
  await LogiGo.checkpoint('coupon:invalid', { color: '#e74c3c' });
  return { success: false, error: 'Invalid code' };
}

// --- CALCULATE TOTAL ---
// @logigo: Calculate final total
async function calculateTotal() {
  // @logigo: Get subtotal
  let total = await calculateSubtotal();
  const originalTotal = total;
  
  // @logigo: Apply coupon if present
  if (cart.coupon) {
    if (cart.coupon.type === 'percent') {
      // @logigo: Apply percentage discount
      const discount = total * (cart.coupon.value / 100);
      total = total - discount;
      await LogiGo.checkpoint('discount:percent', { 
        color: '#9b59b6',
        variables: { discount: discount.toFixed(2) }
      });
    } else {
      // @logigo: Apply fixed discount
      total = Math.max(0, total - cart.coupon.value);
      await LogiGo.checkpoint('discount:fixed', { 
        color: '#9b59b6',
        variables: { discount: cart.coupon.value }
      });
    }
  }
  
  // @logigo: Add tax (8%)
  const tax = total * 0.08;
  total += tax;
  
  await LogiGo.checkpoint('calc:final', { 
    color: '#2ecc71',
    variables: { 
      subtotal: originalTotal.toFixed(2), 
      tax: tax.toFixed(2), 
      total: total.toFixed(2) 
    }
  });
  
  // @logigo: Return final total
  return { subtotal: originalTotal, tax, total };
}

// --- RUN CHECKOUT DEMO ---
async function runDemo() {
  await addToCart({ id: 1, name: 'Widget', price: 29.99 }, 2);
  await addToCart({ id: 2, name: 'Gadget', price: 49.99 }, 1);
  await applyCoupon('SAVE10');
  await calculateTotal();
}

runDemo();`
  }
];

export function getExampleById(id: string): AlgorithmExample | undefined {
  return algorithmExamples.find(example => example.id === id);
}

export function getExamplesByCategory(category: AlgorithmExample['category']): AlgorithmExample[] {
  return algorithmExamples.filter(example => example.category === category);
}
