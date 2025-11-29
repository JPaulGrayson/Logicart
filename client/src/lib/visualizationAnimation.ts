import type { SortingState, PathfindingState } from '@/components/ide/VisualizationPanel';

export interface AnimationStep {
  type: 'sorting' | 'pathfinding';
  state: SortingState | PathfindingState;
  description?: string;
}

export function generateBubbleSortSteps(initialArray: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const array = [...initialArray];
  const n = array.length;
  const sortedIndices: number[] = [];

  steps.push({
    type: 'sorting',
    state: { array: [...array], activeIndices: [], sortedIndices: [], swapIndices: [] },
    description: 'Starting Bubble Sort'
  });

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        type: 'sorting',
        state: { array: [...array], activeIndices: [j, j + 1], sortedIndices: [...sortedIndices], swapIndices: [] },
        description: `Comparing ${array[j]} and ${array[j + 1]}`
      });

      if (array[j] > array[j + 1]) {
        steps.push({
          type: 'sorting',
          state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [j, j + 1] },
          description: `Swapping ${array[j]} and ${array[j + 1]}`
        });

        [array[j], array[j + 1]] = [array[j + 1], array[j]];

        steps.push({
          type: 'sorting',
          state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [] },
          description: 'Swap complete'
        });
      }
    }
    sortedIndices.unshift(n - 1 - i);
  }

  steps.push({
    type: 'sorting',
    state: { array: [...array], activeIndices: [], sortedIndices: Array.from({ length: n }, (_, i) => i), swapIndices: [] },
    description: 'Sorting complete!'
  });

  return steps;
}

export function generateQuickSortSteps(initialArray: number[]): AnimationStep[] {
  const steps: AnimationStep[] = [];
  const array = [...initialArray];
  const sortedIndices: number[] = [];

  steps.push({
    type: 'sorting',
    state: { array: [...array], activeIndices: [], sortedIndices: [], swapIndices: [], pivotIndex: undefined },
    description: 'Starting Quick Sort'
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
      description: `Pivot selected: ${pivot}`
    });

    let i = low - 1;

    for (let j = low; j < high; j++) {
      steps.push({
        type: 'sorting',
        state: { array: [...array], activeIndices: [j], sortedIndices: [...sortedIndices], swapIndices: [], pivotIndex: high },
        description: `Comparing ${array[j]} with pivot ${pivot}`
      });

      if (array[j] < pivot) {
        i++;
        if (i !== j) {
          steps.push({
            type: 'sorting',
            state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [i, j], pivotIndex: high },
            description: `Swapping ${array[i]} and ${array[j]}`
          });

          [array[i], array[j]] = [array[j], array[i]];

          steps.push({
            type: 'sorting',
            state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [], pivotIndex: high },
            description: 'Swap complete'
          });
        }
      }
    }

    if (i + 1 !== high) {
      steps.push({
        type: 'sorting',
        state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [i + 1, high], pivotIndex: high },
        description: `Moving pivot to position ${i + 1}`
      });

      [array[i + 1], array[high]] = [array[high], array[i + 1]];
    }

    sortedIndices.push(i + 1);
    
    steps.push({
      type: 'sorting',
      state: { array: [...array], activeIndices: [], sortedIndices: [...sortedIndices], swapIndices: [], pivotIndex: undefined },
      description: `Pivot ${pivot} is now in correct position`
    });

    return i + 1;
  }

  quickSort(0, array.length - 1);

  steps.push({
    type: 'sorting',
    state: { array: [...array], activeIndices: [], sortedIndices: Array.from({ length: array.length }, (_, i) => i), swapIndices: [] },
    description: 'Sorting complete!'
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
    description: 'Starting A* Pathfinding'
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
      description: `Processing cell (${current.x}, ${current.y})`
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
          description: i === path.length ? 'Path found!' : `Tracing path...`
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
            description: `Discovered cell (${neighbor.x}, ${neighbor.y})`
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
    description: 'No path found'
  });

  return steps;
}
