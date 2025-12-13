import type { SortingState, PathfindingState, CalculatorState, QuizState, TicTacToeState, FibonacciState, SnakeState } from '@/components/ide/VisualizationPanel';

export type AnimationStepType = 'sorting' | 'pathfinding' | 'calculator' | 'quiz' | 'tictactoe' | 'fibonacci' | 'snake';

export interface AnimationStep {
  type: AnimationStepType;
  state: SortingState | PathfindingState | CalculatorState | QuizState | TicTacToeState | FibonacciState | SnakeState;
  description?: string;
  lineNumber?: number;
  stepType?: 'init' | 'compare' | 'swap' | 'complete' | 'process' | 'discover' | 'path' | 'pivot' | 'parse' | 'calculate' | 'result' | 'answer' | 'move' | 'evaluate' | 'compute' | 'memoize';
}

export interface LineMapping {
  bubblesort: {
    init: number;
    outerLoop: number;
    innerLoop: number;
    compare: number;
    swap: number;
    complete: number;
  };
  quicksort: {
    init: number;
    partition: number;
    pivot: number;
    compare: number;
    swap: number;
    complete: number;
  };
  astar: {
    init: number;
    process: number;
    discover: number;
    path: number;
    complete: number;
  };
  maze: {
    init: number;
    explore: number;
    backtrack: number;
    path: number;
    complete: number;
  };
}

export const LINE_MAPPINGS: LineMapping = {
  bubblesort: {
    init: 2,
    outerLoop: 4,
    innerLoop: 5,
    compare: 8,
    swap: 16,
    complete: 22
  },
  quicksort: {
    init: 2,
    partition: 10,
    pivot: 12,
    compare: 20,
    swap: 29,
    complete: 6
  },
  astar: {
    init: 2,
    process: 18,
    discover: 42,
    path: 21,
    complete: 50
  },
  maze: {
    init: 2,
    explore: 8,
    backtrack: 12,
    path: 15,
    complete: 20
  }
};

export function generateBubbleSortSteps(initialArray: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const array = [...initialArray];
  const n = array.length;
  const sortedIndices: number[] = [];
  const lines = LINE_MAPPINGS.bubblesort;

  steps.push({
    type: 'sorting',
    state: { array: [...array], activeIndices: [], sortedIndices: [], swapIndices: [] },
    description: 'Starting Bubble Sort',
    lineNumber: lines.init,
    stepType: 'init'
  });

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        type: 'sorting',
        state: { array: [...array], activeIndices: [j, j + 1], sortedIndices: [...sortedIndices], swapIndices: [] },
        description: `Comparing ${array[j]} and ${array[j + 1]}`,
        lineNumber: lines.compare,
        stepType: 'compare'
      });

      if (array[j] > array[j + 1]) {
        steps.push({
          type: 'sorting',
          state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [j, j + 1] },
          description: `Swapping ${array[j]} and ${array[j + 1]}`,
          lineNumber: lines.swap,
          stepType: 'swap'
        });

        [array[j], array[j + 1]] = [array[j + 1], array[j]];

        steps.push({
          type: 'sorting',
          state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [] },
          description: 'Swap complete',
          lineNumber: lines.swap,
          stepType: 'swap'
        });
      }
    }
    sortedIndices.unshift(n - 1 - i);
  }

  steps.push({
    type: 'sorting',
    state: { array: [...array], activeIndices: [], sortedIndices: Array.from({ length: n }, (_, i) => i), swapIndices: [] },
    description: 'Sorting complete!',
    lineNumber: lines.complete,
    stepType: 'complete'
  });

  return steps;
}

export function generateQuickSortSteps(initialArray: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const array = [...initialArray];
  const sortedIndices: number[] = [];
  const lines = LINE_MAPPINGS.quicksort;

  steps.push({
    type: 'sorting',
    state: { array: [...array], activeIndices: [], sortedIndices: [], swapIndices: [], pivotIndex: undefined },
    description: 'Starting Quick Sort',
    lineNumber: lines.init,
    stepType: 'init'
  });

  function quickSort(low: number, high: number) {
    if (low < high) {
      const pi = partition(low, high);
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    } else if (low === high) {
      sortedIndices.push(low);
    }
  }

  function partition(low: number, high: number): number {
    const pivot = array[high];
    
    steps.push({
      type: 'sorting',
      state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [], pivotIndex: high },
      description: `Pivot selected: ${pivot}`,
      lineNumber: lines.pivot,
      stepType: 'pivot'
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      steps.push({
        type: 'sorting',
        state: { array: [...array], activeIndices: [j], sortedIndices: [...sortedIndices], swapIndices: [], pivotIndex: high },
        description: `Comparing ${array[j]} with pivot ${pivot}`,
        lineNumber: lines.compare,
        stepType: 'compare'
      });

      if (array[j] < pivot) {
        i++;
        if (i !== j) {
          steps.push({
            type: 'sorting',
            state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [i, j], pivotIndex: high },
            description: `Swapping ${array[i]} and ${array[j]}`,
            lineNumber: lines.swap,
            stepType: 'swap'
          });

          [array[i], array[j]] = [array[j], array[i]];

          steps.push({
            type: 'sorting',
            state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [], pivotIndex: high },
            description: 'Swap complete',
            lineNumber: lines.swap,
            stepType: 'swap'
          });
        }
      }
    }

    if (i + 1 !== high) {
      steps.push({
        type: 'sorting',
        state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [i + 1, high], pivotIndex: high },
        description: `Moving pivot to position ${i + 1}`,
        lineNumber: lines.swap,
        stepType: 'swap'
      });

      [array[i + 1], array[high]] = [array[high], array[i + 1]];
    }

    sortedIndices.push(i + 1);
    
    steps.push({
      type: 'sorting',
      state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [], pivotIndex: undefined },
      description: `Pivot ${pivot} is now in correct position`,
      lineNumber: lines.pivot,
      stepType: 'pivot'
    });

    return i + 1;
  }

  quickSort(0, array.length - 1);

  steps.push({
    type: 'sorting',
    state: { array: [...array], activeIndices: [], sortedIndices: Array.from({ length: array.length }, (_, i) => i), swapIndices: [] },
    description: 'Sorting complete!',
    lineNumber: lines.complete,
    stepType: 'complete'
  });

  return steps;
}

interface Node {
  x: number;
  y: number;
}

export function generateAStarSteps(
  startNode: Node,
  endNode: Node,
  rows: number,
  cols: number,
  walls: Node[]
): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const wallSet = new Set(walls.map(w => `${w.x},${w.y}`));
  const lines = LINE_MAPPINGS.astar;

  const baseState = (): PathfindingState => ({
    rows,
    cols,
    startNode,
    endNode,
    wallNodes: walls,
    pathNodes: [],
    visitedNodes: [],
    currentNode: undefined
  });

  steps.push({
    type: 'pathfinding',
    state: baseState(),
    description: 'Starting A* Pathfinding',
    lineNumber: lines.init,
    stepType: 'init'
  });

  const openSet: Node[] = [startNode];
  const cameFrom = new Map<string, Node>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const visited: Node[] = [];

  const key = (n: Node) => `${n.x},${n.y}`;
  const heuristic = (a: Node, b: Node) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  gScore.set(key(startNode), 0);
  fScore.set(key(startNode), heuristic(startNode, endNode));

  while (openSet.length > 0) {
    let current = openSet.reduce((a, b) =>
      (fScore.get(key(a)) ?? Infinity) < (fScore.get(key(b)) ?? Infinity) ? a : b
    );

    steps.push({
      type: 'pathfinding',
      state: {
        ...baseState(),
        visitedNodes: [...visited],
        currentNode: current
      },
      description: `Processing cell (${current.x}, ${current.y})`,
      lineNumber: lines.process,
      stepType: 'process'
    });

    if (current.x === endNode.x && current.y === endNode.y) {
      const path: Node[] = [];
      let curr: Node | undefined = current;
      while (curr) {
        path.unshift(curr);
        curr = cameFrom.get(key(curr));
      }

      for (let i = 0; i <= path.length; i++) {
        steps.push({
          type: 'pathfinding',
          state: {
            ...baseState(),
            visitedNodes: [...visited],
            pathNodes: path.slice(0, i),
            currentNode: undefined
          },
          description: i === path.length ? 'Path found!' : `Tracing path...`,
          lineNumber: lines.path,
          stepType: 'path'
        });
      }

      return steps;
    }

    openSet.splice(openSet.indexOf(current), 1);
    visited.push(current);

    const neighbors: Node[] = [
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y }
    ].filter(n =>
      n.x >= 0 && n.x < cols && n.y >= 0 && n.y < rows &&
      !wallSet.has(key(n)) &&
      !visited.some(v => v.x === n.x && v.y === n.y)
    );

    for (const neighbor of neighbors) {
      const tentativeGScore = (gScore.get(key(current)) ?? Infinity) + 1;

      if (tentativeGScore < (gScore.get(key(neighbor)) ?? Infinity)) {
        cameFrom.set(key(neighbor), current);
        gScore.set(key(neighbor), tentativeGScore);
        fScore.set(key(neighbor), tentativeGScore + heuristic(neighbor, endNode));

        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push(neighbor);

          steps.push({
            type: 'pathfinding',
            state: {
              ...baseState(),
              visitedNodes: [...visited],
              currentNode: neighbor
            },
            description: `Discovered cell (${neighbor.x}, ${neighbor.y})`,
            lineNumber: lines.discover,
            stepType: 'discover'
          });
        }
      }
    }

    if (steps.length > 500) break;
  }

  steps.push({
    type: 'pathfinding',
    state: {
      ...baseState(),
      visitedNodes: [...visited],
      currentNode: undefined
    },
    description: 'No path found',
    lineNumber: lines.complete,
    stepType: 'complete'
  });

  return steps;
}

// Maze solver using recursive backtracking (DFS)
export function generateMazeSolverSteps(
  startNode: Node,
  endNode: Node,
  rows: number,
  cols: number,
  walls: Node[]
): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const wallSet = new Set(walls.map(w => `${w.x},${w.y}`));
  const lines = LINE_MAPPINGS.maze;
  
  const baseState = (): PathfindingState => ({
    rows,
    cols,
    startNode,
    endNode,
    wallNodes: walls,
    pathNodes: [],
    visitedNodes: [],
    currentNode: undefined
  });

  steps.push({
    type: 'pathfinding',
    state: baseState(),
    description: 'Starting Maze Solver (DFS backtracking)',
    lineNumber: lines.init,
    stepType: 'init'
  });

  const visited: Node[] = [];
  const path: Node[] = [];
  const key = (n: Node) => `${n.x},${n.y}`;
  const visitedSet = new Set<string>();

  function solve(current: Node): boolean {
    if (steps.length > 200) return false; // Limit steps
    
    if (current.x < 0 || current.x >= cols || current.y < 0 || current.y >= rows) {
      return false;
    }
    
    if (wallSet.has(key(current)) || visitedSet.has(key(current))) {
      return false;
    }

    visitedSet.add(key(current));
    visited.push(current);
    path.push(current);

    steps.push({
      type: 'pathfinding',
      state: {
        ...baseState(),
        visitedNodes: [...visited],
        pathNodes: [...path],
        currentNode: current
      },
      description: `Exploring cell (${current.x}, ${current.y})`,
      lineNumber: lines.explore,
      stepType: 'process'
    });

    if (current.x === endNode.x && current.y === endNode.y) {
      steps.push({
        type: 'pathfinding',
        state: {
          ...baseState(),
          visitedNodes: [...visited],
          pathNodes: [...path],
          currentNode: undefined
        },
        description: 'Exit found!',
        lineNumber: lines.complete,
        stepType: 'complete'
      });
      return true;
    }

    const directions = [
      { x: current.x, y: current.y - 1 },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y }
    ];

    for (const next of directions) {
      if (solve(next)) {
        return true;
      }
    }

    path.pop();
    steps.push({
      type: 'pathfinding',
      state: {
        ...baseState(),
        visitedNodes: [...visited],
        pathNodes: [...path],
        currentNode: current
      },
      description: `Backtracking from (${current.x}, ${current.y})`,
      lineNumber: lines.backtrack,
      stepType: 'discover'
    });

    return false;
  }

  const found = solve(startNode);

  if (!found && steps.length <= 200) {
    steps.push({
      type: 'pathfinding',
      state: {
        ...baseState(),
        visitedNodes: [...visited],
        pathNodes: [],
        currentNode: undefined
      },
      description: 'No path found!',
      lineNumber: lines.complete,
      stepType: 'complete'
    });
  }

  return steps;
}

// Calculator visualization - shows expression parsing and evaluation
export function generateCalculatorSteps(expression: string): AnimationStep[] {
  const steps: AnimationStep[] = [];
  
  // Parse expression like "12 + 5" or "24 * 3"
  const match = expression.match(/(\d+)\s*([+\-*/])\s*(\d+)/);
  if (!match) {
    steps.push({
      type: 'calculator',
      state: { expression, num1: '', num2: '', operator: '', result: 'Invalid expression', currentStep: null },
      description: 'Invalid expression format',
      stepType: 'result'
    });
    return steps;
  }
  
  const [, num1, operator, num2] = match;
  
  // Step 1: Initial state
  steps.push({
    type: 'calculator',
    state: { expression, num1: '', num2: '', operator: '', result: '', currentStep: null },
    description: 'Starting calculation',
    stepType: 'init'
  });
  
  // Step 2: Parse first number
  steps.push({
    type: 'calculator',
    state: { expression, num1, num2: '', operator: '', result: '', currentStep: 'parse' },
    description: `Parsing first number: ${num1}`,
    stepType: 'parse'
  });
  
  // Step 3: Parse operator
  steps.push({
    type: 'calculator',
    state: { expression, num1, num2: '', operator, result: '', currentStep: 'parse' },
    description: `Found operator: ${operator}`,
    stepType: 'parse'
  });
  
  // Step 4: Parse second number
  steps.push({
    type: 'calculator',
    state: { expression, num1, num2, operator, result: '', currentStep: 'parse' },
    description: `Parsing second number: ${num2}`,
    stepType: 'parse'
  });
  
  // Step 5: Calculate
  let result: number;
  switch (operator) {
    case '+': result = parseInt(num1) + parseInt(num2); break;
    case '-': result = parseInt(num1) - parseInt(num2); break;
    case '*': result = parseInt(num1) * parseInt(num2); break;
    case '/': result = parseInt(num1) / parseInt(num2); break;
    default: result = 0;
  }
  
  steps.push({
    type: 'calculator',
    state: { expression, num1, num2, operator, result: '', currentStep: 'calculate' },
    description: `Calculating ${num1} ${operator} ${num2}`,
    stepType: 'calculate'
  });
  
  // Step 6: Show result
  steps.push({
    type: 'calculator',
    state: { expression, num1, num2, operator, result, currentStep: 'result' },
    description: `Result: ${result}`,
    stepType: 'result'
  });
  
  return steps;
}

// Quiz visualization - shows question/answer flow
export function generateQuizSteps(): AnimationStep[] {
  const steps: AnimationStep[] = [];
  
  const questions = [
    { question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: 1 },
    { question: 'Capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correctAnswer: 2 },
    { question: 'Largest planet?', options: ['Mars', 'Jupiter', 'Saturn', 'Venus'], correctAnswer: 1 }
  ];
  
  let score = 0;
  
  // Initial state
  steps.push({
    type: 'quiz',
    state: { question: '', options: [], correctAnswer: 0, selectedAnswer: null, score: 0, totalQuestions: questions.length, currentQuestion: 0, isAnswered: false },
    description: 'Starting quiz',
    stepType: 'init'
  });
  
  questions.forEach((q, idx) => {
    // Show question
    steps.push({
      type: 'quiz',
      state: { question: q.question, options: q.options, correctAnswer: q.correctAnswer, selectedAnswer: null, score, totalQuestions: questions.length, currentQuestion: idx + 1, isAnswered: false },
      description: `Question ${idx + 1}: ${q.question}`,
      stepType: 'process'
    });
    
    // Simulate answer (correct answer for demo)
    steps.push({
      type: 'quiz',
      state: { question: q.question, options: q.options, correctAnswer: q.correctAnswer, selectedAnswer: q.correctAnswer, score, totalQuestions: questions.length, currentQuestion: idx + 1, isAnswered: false },
      description: `Selected: ${q.options[q.correctAnswer]}`,
      stepType: 'answer'
    });
    
    // Check answer
    score++;
    steps.push({
      type: 'quiz',
      state: { question: q.question, options: q.options, correctAnswer: q.correctAnswer, selectedAnswer: q.correctAnswer, score, totalQuestions: questions.length, currentQuestion: idx + 1, isAnswered: true },
      description: 'Correct!',
      stepType: 'result'
    });
  });
  
  // Final score
  steps.push({
    type: 'quiz',
    state: { question: 'Quiz Complete!', options: [], correctAnswer: 0, selectedAnswer: null, score, totalQuestions: questions.length, currentQuestion: questions.length, isAnswered: true },
    description: `Final Score: ${score}/${questions.length}`,
    stepType: 'complete'
  });
  
  return steps;
}

// TicTacToe visualization - shows game moves with minimax evaluation
export function generateTicTacToeSteps(): AnimationStep[] {
  const steps: AnimationStep[] = [];
  
  // Predefined game sequence: X wins diagonally
  const moves = [
    { cell: 4, player: 'X' }, // Center
    { cell: 0, player: 'O' }, // Top-left
    { cell: 2, player: 'X' }, // Top-right
    { cell: 6, player: 'O' }, // Bottom-left
    { cell: 8, player: 'X' }, // Bottom-right (diagonal)
    { cell: 1, player: 'O' }, // Top-center
    { cell: 5, player: 'X' }, // Middle-right
    { cell: 3, player: 'O' }, // Middle-left
    { cell: 7, player: 'X' }  // Bottom-center (X wins)
  ];
  
  const board: (string | null)[] = Array(9).fill(null);
  
  // Initial state
  steps.push({
    type: 'tictactoe',
    state: { board: [...board], currentPlayer: 'X', winner: null, highlightedCell: null, evaluatingCell: null, evaluationScore: null },
    description: 'Starting Tic-Tac-Toe',
    stepType: 'init'
  });
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    
    // Show evaluation
    steps.push({
      type: 'tictactoe',
      state: { board: [...board], currentPlayer: move.player as 'X' | 'O', winner: null, highlightedCell: null, evaluatingCell: move.cell, evaluationScore: move.player === 'X' ? 1 : -1 },
      description: `${move.player} evaluating cell ${move.cell}`,
      stepType: 'evaluate'
    });
    
    // Make move
    board[move.cell] = move.player;
    
    // Check for winner after this move
    const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let winner: string | null = null;
    for (const pattern of winPatterns) {
      if (board[pattern[0]] && board[pattern[0]] === board[pattern[1]] && board[pattern[1]] === board[pattern[2]]) {
        winner = board[pattern[0]];
        break;
      }
    }
    
    steps.push({
      type: 'tictactoe',
      state: { board: [...board], currentPlayer: move.player === 'X' ? 'O' : 'X', winner, highlightedCell: move.cell, evaluatingCell: null, evaluationScore: null },
      description: winner ? `${winner} wins!` : `${move.player} plays at cell ${move.cell}`,
      stepType: winner ? 'complete' : 'move'
    });
    
    if (winner) break;
  }
  
  return steps;
}

// Fibonacci visualization - shows recursive memoization
export function generateFibonacciSteps(n: number = 8): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const sequence: number[] = [];
  const memoized: number[] = [];
  
  // Initial state
  steps.push({
    type: 'fibonacci',
    state: { sequence: [], currentIndex: null, memoizedIndices: [], computingN: n, callStack: [] },
    description: `Computing Fibonacci(${n})`,
    stepType: 'init'
  });
  
  // Iterative fibonacci with visualization
  for (let i = 0; i <= n; i++) {
    // Show computing step
    steps.push({
      type: 'fibonacci',
      state: { sequence: [...sequence], currentIndex: i, memoizedIndices: [...memoized], computingN: i, callStack: i > 1 ? [i-1, i-2] : [] },
      description: i <= 1 ? `Base case: F(${i}) = ${i}` : `Computing F(${i}) = F(${i-1}) + F(${i-2})`,
      stepType: 'compute'
    });
    
    // Calculate value
    const value = i <= 1 ? i : sequence[i-1] + sequence[i-2];
    sequence.push(value);
    memoized.push(i);
    
    // Show memoization
    steps.push({
      type: 'fibonacci',
      state: { sequence: [...sequence], currentIndex: i, memoizedIndices: [...memoized], computingN: null, callStack: [] },
      description: `F(${i}) = ${value} (memoized)`,
      stepType: 'memoize'
    });
  }
  
  // Complete
  steps.push({
    type: 'fibonacci',
    state: { sequence: [...sequence], currentIndex: null, memoizedIndices: [...memoized], computingN: null, callStack: [] },
    description: `Sequence complete: ${sequence.join(', ')}`,
    stepType: 'complete'
  });
  
  return steps;
}

// Snake game visualization - shows movement algorithm
export function generateSnakeSteps(): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const gridSize = 10;
  
  // Helper to check if position is on snake
  const isOnSnake = (pos: { x: number; y: number }, snakeBody: { x: number; y: number }[]) => {
    return snakeBody.some(s => s.x === pos.x && s.y === pos.y);
  };
  
  // Helper to find valid food position
  const findFoodPosition = (snakeBody: { x: number; y: number }[]): { x: number; y: number } => {
    let attempts = 0;
    while (attempts < 100) {
      const pos = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
      if (!isOnSnake(pos, snakeBody)) return pos;
      attempts++;
    }
    return { x: 0, y: 0 };
  };
  
  // Initial snake position
  let snake = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 }
  ];
  let food = { x: 7, y: 5 };
  let score = 0;
  let direction: 'up' | 'down' | 'left' | 'right' = 'right';
  
  // Initial state
  steps.push({
    type: 'snake',
    state: { gridSize, snake: snake.map(s => ({...s})), food: {...food}, score, gameOver: false, direction, highlightedSegment: null },
    description: 'Starting Snake game',
    stepType: 'init'
  });
  
  // Simulate movement - a simple path that eats food
  const moves: Array<'up' | 'down' | 'left' | 'right'> = [
    'right', 'right', 'up', 'up', 'left', 'left', 'down', 'right', 'right', 'down', 'down', 'left'
  ];
  
  for (let i = 0; i < moves.length; i++) {
    const newDirection = moves[i];
    
    // Show direction change step if direction changed
    if (newDirection !== direction) {
      steps.push({
        type: 'snake',
        state: { gridSize, snake: snake.map(s => ({...s})), food: {...food}, score, gameOver: false, direction: newDirection, highlightedSegment: 0 },
        description: `Turning ${newDirection}`,
        stepType: 'process'
      });
    }
    
    direction = newDirection;
    const head = { ...snake[0] };
    
    // Calculate new head position
    switch (direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }
    
    // Check boundaries
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
      steps.push({
        type: 'snake',
        state: { gridSize, snake: snake.map(s => ({...s})), food: {...food}, score, gameOver: true, direction, highlightedSegment: 0 },
        description: 'Game Over: Hit wall!',
        stepType: 'complete'
      });
      break;
    }
    
    // Check self collision
    if (isOnSnake(head, snake)) {
      steps.push({
        type: 'snake',
        state: { gridSize, snake: snake.map(s => ({...s})), food: {...food}, score, gameOver: true, direction, highlightedSegment: 0 },
        description: 'Game Over: Hit self!',
        stepType: 'complete'
      });
      break;
    }
    
    // Move snake
    snake = [head, ...snake];
    
    // Check if ate food
    if (head.x === food.x && head.y === food.y) {
      score++;
      // Find new food position that's not on snake
      food = findFoodPosition(snake);
      
      steps.push({
        type: 'snake',
        state: { gridSize, snake: snake.map(s => ({...s})), food: {...food}, score, gameOver: false, direction, highlightedSegment: 0 },
        description: `Ate food! Score: ${score}`,
        stepType: 'result'
      });
    } else {
      snake = snake.slice(0, -1);
      
      steps.push({
        type: 'snake',
        state: { gridSize, snake: snake.map(s => ({...s})), food: {...food}, score, gameOver: false, direction, highlightedSegment: null },
        description: `Moving ${direction}`,
        stepType: 'move'
      });
    }
  }
  
  // Final state if we didn't hit a wall
  if (steps[steps.length - 1].stepType !== 'complete') {
    steps.push({
      type: 'snake',
      state: { gridSize, snake: snake.map(s => ({...s})), food: {...food}, score, gameOver: false, direction, highlightedSegment: null },
      description: `Simulation complete! Final score: ${score}`,
      stepType: 'complete'
    });
  }
  
  return steps;
}
