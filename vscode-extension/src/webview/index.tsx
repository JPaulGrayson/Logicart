import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

declare global {
  interface Window {
    flowData: any;
    filePath: string;
    vscode: any;
  }
}

// ============== TYPES ==============
interface FlowNode {
  id: string;
  type: 'input' | 'output' | 'default' | 'decision' | 'container';
  data: {
    label: string;
    sourceData?: any;
    description?: string;
    children?: string[];
    collapsed?: boolean;
  };
  position: { x: number; y: number };
  className?: string;
  style?: any;
  parentNode?: string;
  extent?: 'parent';
  hidden?: boolean;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: any;
  animated?: boolean;
}

interface ExecutionState {
  variables: Record<string, any>;
  currentNodeId: string | null;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error?: string;
}

interface InterpreterStep {
  nodeId: string;
  state: ExecutionState;
}

type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

interface DiffNode extends FlowNode {
  diffStatus?: DiffStatus;
}

// ============== FEATURE FLAGS ==============
interface FeatureFlags {
  executionController: boolean;
  ghostDiff: boolean;
  timeTravel: boolean;
  naturalLanguageSearch: boolean;
}

const TIERS = {
  free: { executionController: false, ghostDiff: false, timeTravel: false, naturalLanguageSearch: false },
  premium: { executionController: true, ghostDiff: true, timeTravel: true, naturalLanguageSearch: true },
};

// Default to premium for development
const features: FeatureFlags = TIERS.premium;

// ============== ALGORITHM EXAMPLES ==============
interface AlgorithmExample {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
}

const algorithmExamples: AlgorithmExample[] = [
  {
    id: 'calculator',
    name: '🧮 Calculator',
    category: 'basics',
    description: 'Simple calculator with control flow',
    code: `function calculate(a, b, operator) {
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
  return 'Unknown operator';
}`
  },
  {
    id: 'fibonacci',
    name: '🔢 Fibonacci',
    category: 'recursion',
    description: 'Recursive Fibonacci with memoization',
    code: `function fibonacci(n, memo = {}) {
  if (n in memo) {
    return memo[n];
  }
  if (n <= 1) {
    return n;
  }
  
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

function runDemo() {
  let result = fibonacci(10);
  console.log(result);
  return result;
}`
  },
  {
    id: 'bubblesort',
    name: '📊 Bubble Sort',
    category: 'sorting',
    description: 'Simple sorting algorithm',
    code: `function bubbleSort(array) {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length - i - 1; j++) {
      if (array[j] > array[j + 1]) {
        let temp = array[j];
        array[j] = array[j + 1];
        array[j + 1] = temp;
      }
    }
  }
  return array;
}`
  },
  {
    id: 'maze',
    name: '🧩 Maze Solver',
    category: 'pathfinding',
    description: 'Recursive backtracking',
    code: `function solveMaze(maze, x, y, visited) {
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
}`
  },
  {
    id: 'minimax',
    name: '🎮 Tic-Tac-Toe AI',
    category: 'games',
    description: 'Minimax algorithm',
    code: `function checkWinner(board) {
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
}`
  },
  {
    id: 'binarysearch',
    name: '🔍 Binary Search',
    category: 'search',
    description: 'Efficient O(log n) search',
    code: `function binarySearch(array, target) {
  let left = 0;
  let right = array.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    
    if (array[mid] === target) {
      return mid;
    }
    
    if (array[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}`
  },
  {
    id: 'mergesort',
    name: '🔄 Merge Sort',
    category: 'sorting',
    description: 'Divide and conquer O(n log n)',
    code: `function mergeSort(array) {
  if (array.length <= 1) {
    return array;
  }
  
  let mid = Math.floor(array.length / 2);
  let left = mergeSort(array.slice(0, mid));
  let right = mergeSort(array.slice(mid));
  
  return merge(left, right);
}

function merge(left, right) {
  let result = [];
  let i = 0;
  let j = 0;
  
  while (i < left.length && j < right.length) {
    if (left[i] < right[j]) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }
  
  return result.concat(left.slice(i)).concat(right.slice(j));
}`
  },
  {
    id: 'linkedlist',
    name: '🔗 Linked List',
    category: 'data-structures',
    description: 'Basic linked list operations',
    code: `function createNode(value) {
  return { value: value, next: null };
}

function append(head, value) {
  let newNode = createNode(value);
  
  if (!head) {
    return newNode;
  }
  
  let current = head;
  while (current.next) {
    current = current.next;
  }
  
  current.next = newNode;
  return head;
}

function find(head, value) {
  let current = head;
  
  while (current) {
    if (current.value === value) {
      return current;
    }
    current = current.next;
  }
  
  return null;
}`
  },
  {
    id: 'treetraversal',
    name: '🌳 Tree Traversal',
    category: 'data-structures',
    description: 'DFS and BFS traversals',
    code: `function inorderTraversal(node) {
  if (!node) return [];
  
  let result = [];
  result = result.concat(inorderTraversal(node.left));
  result.push(node.value);
  result = result.concat(inorderTraversal(node.right));
  
  return result;
}

function preorderTraversal(node) {
  if (!node) return [];
  
  let result = [];
  result.push(node.value);
  result = result.concat(preorderTraversal(node.left));
  result = result.concat(preorderTraversal(node.right));
  
  return result;
}

function breadthFirst(root) {
  if (!root) return [];
  
  let queue = [root];
  let result = [];
  
  while (queue.length > 0) {
    let node = queue.shift();
    result.push(node.value);
    
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  
  return result;
}`
  }
];

// ============== GHOST DIFF ENGINE ==============
class GhostDiff {
  diffTrees(oldNodes: FlowNode[], newNodes: FlowNode[]): DiffNode[] {
    const oldMap = new Map(oldNodes.map(n => [n.id, n]));
    const newMap = new Map(newNodes.map(n => [n.id, n]));
    const result: DiffNode[] = [];

    // Check new nodes
    newNodes.forEach(newNode => {
      const oldNode = oldMap.get(newNode.id);
      if (!oldNode) {
        result.push({ ...newNode, diffStatus: 'added' });
      } else if (this.nodesAreDifferent(oldNode, newNode)) {
        result.push({ ...newNode, diffStatus: 'modified' });
      } else {
        result.push({ ...newNode, diffStatus: 'unchanged' });
      }
    });

    // Check for removed nodes
    oldNodes.forEach(oldNode => {
      if (!newMap.has(oldNode.id)) {
        result.push({ ...oldNode, diffStatus: 'removed' });
      }
    });

    return result;
  }

  private nodesAreDifferent(oldNode: FlowNode, newNode: FlowNode): boolean {
    return oldNode.data.label !== newNode.data.label || oldNode.type !== newNode.type;
  }
}

// ============== INTERPRETER ==============
class SimpleInterpreter {
  private steps: InterpreterStep[] = [];
  private currentStepIndex = 0;

  constructor(flowData: any) {
    this.generateStepsFromFlow(flowData);
  }

  private generateStepsFromFlow(flowData: any) {
    const nodes = (flowData.nodes || []).filter((n: FlowNode) =>
      n.type !== 'container' && !n.hidden
    );

    nodes.forEach((node: FlowNode, index: number) => {
      this.steps.push({
        nodeId: node.id,
        state: {
          variables: this.generateMockVariables(index, node),
          currentNodeId: node.id,
          status: 'running'
        }
      });
    });
  }

  private generateMockVariables(stepIndex: number, node: FlowNode): Record<string, any> {
    const vars: Record<string, any> = {};
    if (stepIndex > 0) {
      vars['step'] = stepIndex;
      // Extract variable names from node label if possible
      const label = node.data.label || '';
      if (label.includes('=')) {
        const varName = label.split('=')[0].trim().split(' ').pop();
        if (varName) vars[varName] = `value_${stepIndex}`;
      }
    }
    return vars;
  }

  stepForward(): InterpreterStep | null {
    if (this.currentStepIndex < this.steps.length) {
      return this.steps[this.currentStepIndex++];
    }
    return null;
  }

  stepBackward(): InterpreterStep | null {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  getProgress() {
    return { current: this.currentStepIndex, total: this.steps.length };
  }

  getCurrentStep(): InterpreterStep | null {
    if (this.currentStepIndex > 0 && this.currentStepIndex <= this.steps.length) {
      return this.steps[this.currentStepIndex - 1];
    }
    return null;
  }

  reset() {
    this.currentStepIndex = 0;
  }

  canStepForward(): boolean {
    return this.currentStepIndex < this.steps.length;
  }
}

// ============== EXECUTION CONTROLS ==============
interface ExecutionControlsProps {
  isPlaying: boolean;
  canStep: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  progress: { current: number; total: number };
  speed: number;
  onSpeedChange: (speed: number) => void;
}

function ExecutionControls({
  isPlaying, canStep, onPlay, onPause, onStepForward, onStepBackward, onReset, progress, speed, onSpeedChange
}: ExecutionControlsProps) {
  const hasTimeTravel = features.timeTravel;
  const hasSpeedControl = features.executionController;
  const canStepBack = hasTimeTravel && progress.current > 0;

  return (
    <div className="execution-controls">
      <div className="controls-group">
        <button onClick={isPlaying ? onPause : onPlay} disabled={!canStep} className="control-btn primary" title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        {hasTimeTravel && (
          <button onClick={onStepBackward} disabled={!canStepBack || isPlaying} className="control-btn" title="Step Backward (Time Travel)">◀</button>
        )}
        <button onClick={onStepForward} disabled={!canStep || isPlaying} className="control-btn" title="Step Forward">▶|</button>
        <button onClick={onReset} className="control-btn" title="Reset">↻</button>
      </div>

      {hasSpeedControl && (
        <div className="speed-control">
          <span className="speed-label">Speed:</span>
          <select value={speed} onChange={(e) => onSpeedChange(parseFloat(e.target.value))} className="speed-select">
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x ⚡</option>
            <option value="10">10x ⚡</option>
          </select>
        </div>
      )}

      {progress.total > 0 && (
        <div className="progress-info">
          <span className="step-count">Step {progress.current} / {progress.total}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {!hasTimeTravel && (
        <div className="upgrade-hint">⬆️ <a href="#" className="upgrade-link">Upgrade for Time Travel</a></div>
      )}
    </div>
  );
}

// ============== VARIABLE WATCH PANEL ==============
function VariableWatch({ variables }: { variables: Record<string, any> }) {
  const entries = Object.entries(variables);

  return (
    <div className="variable-watch">
      <h3>📊 Variables</h3>
      {entries.length === 0 ? (
        <p className="empty-message">Run code to see variable values</p>
      ) : (
        <div className="variable-list">
          {entries.map(([name, value]) => (
            <div key={name} className="variable-item">
              <span className="var-name">{name}</span>
              <span className="var-equals">=</span>
              <span className="var-value">{JSON.stringify(value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== ALGORITHM EXAMPLES DROPDOWN ==============
function AlgorithmExamplesDropdown({ onSelect }: { onSelect: (example: AlgorithmExample) => void }) {
  return (
    <div className="examples-dropdown">
      <label className="examples-label">📚 Examples:</label>
      <select
        className="examples-select"
        onChange={(e) => {
          const example = algorithmExamples.find(ex => ex.id === e.target.value);
          if (example) onSelect(example);
        }}
        defaultValue=""
      >
        <option value="" disabled>Choose an algorithm...</option>
        {algorithmExamples.map(ex => (
          <option key={ex.id} value={ex.id}>{ex.name}</option>
        ))}
      </select>
    </div>
  );
}

// ============== DIFF STATS PANEL ==============
function DiffStats({ nodes }: { nodes: DiffNode[] }) {
  if (!features.ghostDiff) return null;

  const stats = {
    added: nodes.filter(n => n.diffStatus === 'added').length,
    removed: nodes.filter(n => n.diffStatus === 'removed').length,
    modified: nodes.filter(n => n.diffStatus === 'modified').length,
  };

  const hasChanges = stats.added > 0 || stats.removed > 0 || stats.modified > 0;
  if (!hasChanges) return null;

  return (
    <div className="diff-stats">
      <span className="diff-title">👻 Ghost Diff:</span>
      {stats.added > 0 && <span className="diff-added">+{stats.added}</span>}
      {stats.removed > 0 && <span className="diff-removed">-{stats.removed}</span>}
      {stats.modified > 0 && <span className="diff-modified">~{stats.modified}</span>}
    </div>
  );
}

// ============== SEARCH BAR ==============
interface SearchBarProps {
  nodes: FlowNode[];
  onResultSelect: (nodeId: string) => void;
}

function SearchBar({ nodes, onResultSelect }: SearchBarProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Array<{ node: FlowNode; score: number }>>([]);
  const [showResults, setShowResults] = React.useState(false);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Simple search implementation
    const queryLower = searchQuery.toLowerCase();
    const matches = nodes
      .filter(n => {
        const label = (n.data.label || '').toLowerCase();
        return label.includes(queryLower) || n.type.includes(queryLower);
      })
      .map(n => ({ node: n, score: 1 }))
      .slice(0, 5);

    setResults(matches);
    setShowResults(true);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="🔍 Search nodes..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => query.length >= 2 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        className="search-input"
      />
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map(({ node }) => (
            <div
              key={node.id}
              className="search-result-item"
              onClick={() => {
                onResultSelect(node.id);
                setShowResults(false);
                setQuery('');
              }}
            >
              <span className="result-type">{node.type}</span>
              <span className="result-label">{node.data.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============== ZOOM CONTROLS ==============
type ZoomLevel = 'system' | 'feature' | 'function' | 'statement';

interface ZoomControlsProps {
  currentZoom: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
}

function ZoomControls({ currentZoom, onZoomChange }: ZoomControlsProps) {
  const levels: { level: ZoomLevel; icon: string; label: string }[] = [
    { level: 'system', icon: '🏢', label: 'System' },
    { level: 'feature', icon: '📦', label: 'Feature' },
    { level: 'function', icon: '⚡', label: 'Function' },
    { level: 'statement', icon: '📝', label: 'Statement' },
  ];

  return (
    <div className="zoom-controls">
      <span className="zoom-label">Zoom:</span>
      {levels.map(({ level, icon, label }) => (
        <button
          key={level}
          className={`zoom-btn ${currentZoom === level ? 'active' : ''}`}
          onClick={() => onZoomChange(level)}
          title={label}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

// ============== VARIABLE HISTORY GRAPH ==============
interface VariableHistoryProps {
  history: Array<{ step: number; variables: Record<string, any> }>;
  selectedVariable?: string;
}

function VariableHistoryGraph({ history, selectedVariable }: VariableHistoryProps) {
  if (history.length === 0 || !selectedVariable) {
    return null;
  }

  const values = history
    .map(h => ({ step: h.step, value: h.variables[selectedVariable] }))
    .filter(v => v.value !== undefined);

  if (values.length === 0) return null;

  const maxValue = Math.max(...values.map(v => typeof v.value === 'number' ? v.value : 0));
  const minValue = Math.min(...values.map(v => typeof v.value === 'number' ? v.value : 0));
  const range = maxValue - minValue || 1;

  return (
    <div className="variable-history">
      <h4>📈 {selectedVariable} over time</h4>
      <div className="history-graph">
        {values.map((v, i) => {
          const height = typeof v.value === 'number'
            ? ((v.value - minValue) / range) * 100
            : 50;
          return (
            <div key={i} className="history-bar-container" title={`Step ${v.step}: ${v.value}`}>
              <div className="history-bar" style={{ height: `${height}%` }} />
              <span className="history-step">{v.step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============== BREAKPOINT INDICATOR ==============
interface BreakpointIndicatorProps {
  hasBreakpoint: boolean;
  onToggle: () => void;
}

function BreakpointIndicator({ hasBreakpoint, onToggle }: BreakpointIndicatorProps) {
  return (
    <div
      className={`breakpoint-indicator ${hasBreakpoint ? 'active' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={hasBreakpoint ? 'Remove breakpoint' : 'Add breakpoint'}
    >
      ●
    </div>
  );
}

// ============== STATE PERSISTENCE ==============
interface PersistedState {
  collapsedContainers: string[];
  selectedNodeId: string | null;
  zoomLevel: ZoomLevel;
  breakpoints: string[];
  speed: number;
  focusedNodeId: string | null;
}

function loadPersistedState(): Partial<PersistedState> {
  try {
    const state = window.vscode.getState();
    return state || {};
  } catch {
    return {};
  }
}

function savePersistedState(state: PersistedState): void {
  try {
    window.vscode.setState(state);
  } catch (e) {
    console.error('Failed to persist state:', e);
  }
}

// ============== MAIN FLOWCHART VIEWER ==============
function FlowchartViewer() {
  // Load persisted state on initial render
  const persistedState = React.useMemo(() => loadPersistedState(), []);

  const [flowData, setFlowData] = React.useState(window.flowData);
  const [previousFlowData, setPreviousFlowData] = React.useState<any>(null);
  const [selectedNode, setSelectedNode] = React.useState<FlowNode | null>(() => {
    // Restore selected node from persisted state
    if (persistedState.selectedNodeId && window.flowData?.nodes) {
      return window.flowData.nodes.find((n: FlowNode) => n.id === persistedState.selectedNodeId) || null;
    }
    return null;
  });
  const [collapsedContainers, setCollapsedContainers] = React.useState<Set<string>>(() => {
    // Restore collapsed containers from persisted state
    return new Set(persistedState.collapsedContainers || []);
  });

  // Execution state
  const [interpreter, setInterpreter] = React.useState<SimpleInterpreter | null>(null);
  const [currentStep, setCurrentStep] = React.useState<InterpreterStep | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(() => persistedState.speed || 1);
  const [progress, setProgress] = React.useState({ current: 0, total: 0 });

  // Ghost Diff
  const ghostDiff = React.useMemo(() => new GhostDiff(), []);
  const [diffNodes, setDiffNodes] = React.useState<DiffNode[]>([]);

  // New features state
  const [breakpoints, setBreakpoints] = React.useState<Set<string>>(() => {
    return new Set(persistedState.breakpoints || []);
  });
  const [zoomLevel, setZoomLevel] = React.useState<ZoomLevel>(() => persistedState.zoomLevel || 'function');
  const [variableHistory, setVariableHistory] = React.useState<Array<{ step: number; variables: Record<string, any> }>>([]);
  const [selectedVariable, setSelectedVariable] = React.useState<string | undefined>();
  const [focusedNodeId, setFocusedNodeId] = React.useState<string | undefined>(() => persistedState.focusedNodeId || undefined);

  const playIntervalRef = React.useRef<number | null>(null);

  // Persist state whenever it changes
  React.useEffect(() => {
    const state: PersistedState = {
      collapsedContainers: Array.from(collapsedContainers),
      selectedNodeId: selectedNode?.id || null,
      zoomLevel,
      breakpoints: Array.from(breakpoints),
      speed,
      focusedNodeId: focusedNodeId || null,
    };
    savePersistedState(state);
  }, [collapsedContainers, selectedNode, zoomLevel, breakpoints, speed, focusedNodeId]);

  // Initialize interpreter when flowData changes
  React.useEffect(() => {
    console.log('[Webview] flowData changed - new nodes:', flowData?.nodes?.length);

    // Track previous for ghost diff
    if (flowData && previousFlowData && features.ghostDiff) {
      const diff = ghostDiff.diffTrees(previousFlowData.nodes || [], flowData.nodes || []);
      setDiffNodes(diff);
    } else {
      setDiffNodes((flowData.nodes || []).map((n: FlowNode) => ({ ...n, diffStatus: 'unchanged' as DiffStatus })));
    }

    setPreviousFlowData(flowData);

    const interp = new SimpleInterpreter(flowData);
    setInterpreter(interp);
    setProgress(interp.getProgress());
    setCurrentStep(null);
  }, [flowData, ghostDiff]);

  // Handle auto-play
  React.useEffect(() => {
    if (isPlaying && interpreter) {
      playIntervalRef.current = window.setInterval(() => {
        const step = interpreter.stepForward();
        if (step) {
          setCurrentStep(step);
          setProgress(interpreter.getProgress());
        } else {
          setIsPlaying(false);
        }
      }, 1000 / speed);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, speed, interpreter]);

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('[Webview] Received message:', message);
      if (message.type === 'updateFlow' && message.flowData) {
        console.log('[Webview] Updating flowData - nodes:', message.flowData.nodes?.length);
        // Use deep copy to ensure React detects the change
        const newFlowData = JSON.parse(JSON.stringify(message.flowData));
        setFlowData(newFlowData);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleNodeClick = (node: FlowNode) => {
    setSelectedNode(node);
    if (node.data.sourceData) {
      window.vscode.postMessage({ command: 'jumpToLine', line: node.data.sourceData.start.line });
    }
  };

  const toggleContainer = (containerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedContainers(prev => {
      const next = new Set(prev);
      next.has(containerId) ? next.delete(containerId) : next.add(containerId);
      return next;
    });
  };

  const handleExampleSelect = (example: AlgorithmExample) => {
    // Send example code to VS Code to insert
    window.vscode.postMessage({ command: 'insertCode', code: example.code });
  };

  // Execution handlers
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleStepForward = () => {
    if (interpreter) {
      const step = interpreter.stepForward();
      if (step) {
        setCurrentStep(step);
        setProgress(interpreter.getProgress());
      }
    }
  };

  const handleStepBackward = () => {
    if (interpreter) {
      const step = interpreter.stepBackward();
      setCurrentStep(step);
      setProgress(interpreter.getProgress());
    }
  };

  const handleReset = () => {
    if (interpreter) {
      interpreter.reset();
      setCurrentStep(null);
      setProgress(interpreter.getProgress());
      setIsPlaying(false);
    }
  };

  // Filter visible nodes
  const visibleNodes = diffNodes.filter(node => {
    if (node.hidden) return false;
    if (node.parentNode && collapsedContainers.has(node.parentNode)) return false;
    return true;
  });

  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const edges: FlowEdge[] = flowData.edges || [];
  const visibleEdges = edges.filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));

  const containerNodes = visibleNodes.filter(n => n.type === 'container');
  const regularNodes = visibleNodes.filter(n => n.type !== 'container');

  // Calculate viewBox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  visibleNodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.style?.width || 150;
    const height = node.style?.height || 40;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  const padding = 50;
  const viewBox = visibleNodes.length > 0
    ? `${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} ${maxY - minY + 2 * padding}`
    : '0 0 400 300';

  const getNodeColor = (node: DiffNode) => {
    // Current step override
    if (currentStep?.nodeId === node.id) return '#22c55e';

    // Ghost diff colors
    if (features.ghostDiff && node.diffStatus) {
      switch (node.diffStatus) {
        case 'added': return '#4ade80';
        case 'removed': return '#f87171';
        case 'modified': return '#facc15';
      }
    }

    switch (node.type) {
      case 'input': return '#3b82f6';
      case 'output': return '#ef4444';
      case 'decision': return '#fbbf24';
      case 'container': return '#1e293b';
      default: return '#e5e7eb';
    }
  };

  const getNodeTextColor = (node: DiffNode) => {
    if (currentStep?.nodeId === node.id) return 'white';
    if (node.diffStatus === 'removed') return '#fee2e2';
    switch (node.type) {
      case 'input': case 'output': case 'container': return 'white';
      default: return '#1f2937';
    }
  };

  const getNodeOpacity = (node: DiffNode) => {
    if (node.diffStatus === 'removed') return 0.5;
    return 1;
  };

  return (
    <div className="flowchart-container">
      <div className="header">
        <h2>LogiGo for VS Code</h2>
        <SearchBar
          nodes={flowData.nodes || []}
          onResultSelect={(nodeId) => {
            setFocusedNodeId(nodeId);
            const node = (flowData.nodes || []).find((n: FlowNode) => n.id === nodeId);
            if (node) handleNodeClick(node);
          }}
        />
        <ZoomControls currentZoom={zoomLevel} onZoomChange={setZoomLevel} />
        <AlgorithmExamplesDropdown onSelect={handleExampleSelect} />
        <DiffStats nodes={diffNodes} />
        {selectedNode && (
          <div className="selected-node-info">
            {selectedNode.data.label}
            {selectedNode.data.sourceData && <span> (Line {selectedNode.data.sourceData.start.line})</span>}
          </div>
        )}
      </div>

      <ExecutionControls
        isPlaying={isPlaying}
        canStep={interpreter?.canStepForward() ?? false}
        onPlay={handlePlay}
        onPause={handlePause}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onReset={handleReset}
        progress={progress}
        speed={speed}
        onSpeedChange={setSpeed}
      />

      <div className="main-content">
        <svg viewBox={viewBox} className="flowchart-svg">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#666" />
            </marker>
            <marker id="arrowhead-active" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
            </marker>
          </defs>

          {/* Container nodes */}
          {containerNodes.map(node => {
            const x = node.position.x;
            const y = node.position.y;
            const width = node.style?.width || 300;
            const height = collapsedContainers.has(node.id) ? 60 : (node.style?.height || 200);
            const isCollapsed = collapsedContainers.has(node.id);

            return (
              <g key={node.id} className="container-node" onClick={() => handleNodeClick(node)} style={{ opacity: getNodeOpacity(node) }}>
                <rect x={x} y={y} width={width} height={height} rx="12" fill="#1e293b" stroke={getNodeColor(node)} strokeWidth="2" />
                <rect x={x} y={y} width={width} height="40" rx="12" fill="#3b82f6" />
                <rect x={x} y={y + 28} width={width} height="14" fill="#3b82f6" />
                <g className="collapse-button" onClick={(e) => toggleContainer(node.id, e as any)} style={{ cursor: 'pointer' }}>
                  <circle cx={x + 20} cy={y + 20} r="10" fill="rgba(255,255,255,0.2)" />
                  <text x={x + 20} y={y + 24} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">{isCollapsed ? '▶' : '▼'}</text>
                </g>
                <text x={x + 40} y={y + 25} fill="white" fontSize="14" fontWeight="bold">{node.data.label}</text>
              </g>
            );
          })}

          {/* Edges */}
          {visibleEdges.map(edge => {
            const sourceNode = visibleNodes.find(n => n.id === edge.source);
            const targetNode = visibleNodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const sourceX = sourceNode.position.x + (sourceNode.style?.width || 150) / 2;
            const sourceY = sourceNode.position.y + (sourceNode.style?.height || 40);
            const targetX = targetNode.position.x + (targetNode.style?.width || 150) / 2;
            const targetY = targetNode.position.y;
            const midY = (sourceY + targetY) / 2;
            const isActive = currentStep?.nodeId === targetNode.id;

            return (
              <g key={edge.id}>
                <path
                  d={`M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`}
                  stroke={isActive ? '#22c55e' : '#666'}
                  strokeWidth={isActive ? '3' : '2'}
                  fill="none"
                  markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                />
                {edge.label && <text x={targetX} y={midY - 5} textAnchor="middle" className="edge-label">{edge.label}</text>}
              </g>
            );
          })}

          {/* Regular nodes */}
          {regularNodes.map(node => {
            const isDecision = node.type === 'decision';
            const x = node.position.x;
            const y = node.position.y;
            const width = node.style?.width || 150;
            const height = node.style?.height || 40;
            const isCurrentStep = currentStep?.nodeId === node.id;

            return (
              <g key={node.id} onClick={() => handleNodeClick(node)} className={`node ${isCurrentStep ? 'current-step' : ''}`} style={{ cursor: 'pointer', opacity: getNodeOpacity(node) }}>
                {isDecision ? (
                  <polygon points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`} fill={getNodeColor(node)} stroke={isCurrentStep ? '#22c55e' : '#333'} strokeWidth={isCurrentStep ? '3' : '2'} />
                ) : (
                  <rect x={x} y={y} width={width} height={height} rx="8" fill={getNodeColor(node)} stroke={isCurrentStep ? '#22c55e' : '#333'} strokeWidth={isCurrentStep ? '3' : '2'} />
                )}
                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" className="node-label" fill={getNodeTextColor(node)}>
                  {node.data.label}
                </text>
              </g>
            );
          })}
        </svg>

        <VariableWatch variables={currentStep?.state.variables || {}} />
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<FlowchartViewer />);
