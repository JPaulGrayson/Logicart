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
}`
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
}`
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
}`
  }
];

export function getExampleById(id: string): AlgorithmExample | undefined {
  return algorithmExamples.find(example => example.id === id);
}

export function getExamplesByCategory(category: AlgorithmExample['category']): AlgorithmExample[] {
  return algorithmExamples.filter(example => example.category === category);
}
