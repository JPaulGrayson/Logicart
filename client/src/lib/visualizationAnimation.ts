import type { SortingState, PathfindingState } from '@/components/ide/VisualizationPanel';

export interface AnimationStep {
  type: 'sorting' | 'pathfinding';
  state: SortingState | PathfindingState;
  description?: string;
  lineNumber?: number;
  stepType?: 'init' | 'compare' | 'swap' | 'complete' | 'process' | 'discover' | 'path' | 'pivot';
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
