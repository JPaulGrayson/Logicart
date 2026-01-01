import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as acorn from 'acorn';
import { toast } from 'sonner';
import { CodeEditor } from '@/components/ide/CodeEditor';
import { Flowchart } from '@/components/ide/Flowchart';
import { FlowchartSkeleton } from '@/components/ide/FlowchartSkeleton';
import { EmptyState, SAMPLE_CODE } from '@/components/ide/EmptyState';
import { ExecutionControls } from '@/components/ide/ExecutionControls';
import { VariableWatch } from '@/components/ide/VariableWatch';
import { NodeEditDialog } from '@/components/ide/NodeEditDialog';
import { NodeLabelDialog } from '@/components/ide/NodeLabelDialog';
import { parseCodeToFlow, FlowNode } from '@/lib/parser';
import { Interpreter, ExecutionState } from '@/lib/interpreter';
import { patchCode, extractCode } from '@/lib/codePatcher';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { Node } from '@xyflow/react';
import { useAdapter } from '@/contexts/AdapterContext';
import { GhostDiff, DiffNode } from '@/lib/ghostDiff';
import { features } from '@/lib/features';
import { ExecutionController } from '@/lib/executionController';
import { exportToPNG, exportToPDF } from '@/lib/flowchartExport';
import { NaturalLanguageSearch } from '@/components/ide/NaturalLanguageSearch';
import { TimelineScrubber } from '@/components/ide/TimelineScrubber';
import type { SearchResult } from '@/lib/naturalLanguageSearch';
import { Button } from '@/components/ui/button';
import { Download, FileText, FlaskConical, ChevronLeft, ChevronRight, Code2, Eye, Settings, Search, BookOpen, Share2, HelpCircle, Library, Maximize2, Minimize2, Monitor, Presentation, ZoomIn, Upload, FileCode, Wifi, Radio, X, Copy, Check, Bug, Play, StepForward, Pause, Undo2, Redo2, ExternalLink } from 'lucide-react';
import { historyManager } from '@/lib/historyManager';
import { Link } from 'wouter';
import { algorithmExamples, type AlgorithmExample } from '@/lib/algorithmExamples';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { RuntimeState, CheckpointPayload } from '@shared/reporter-api';
import { isLogiGoMessage, isSessionStart, isCheckpoint } from '@shared/reporter-api';
import { HelpDialog } from '@/components/ide/HelpDialog';
import { ShareDialog } from '@/components/ide/ShareDialog';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useLicense } from '@/hooks/useLicense';
import { useWatchFile } from '@/hooks/useWatchFile';
import { User, LogIn, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VisualizationPanel, DEFAULT_SORTING_STATE, DEFAULT_PATHFINDING_STATE, DEFAULT_CALCULATOR_STATE, DEFAULT_QUIZ_STATE, DEFAULT_TICTACTOE_STATE, DEFAULT_FIBONACCI_STATE, DEFAULT_SNAKE_STATE, type VisualizerType, type SortingState, type PathfindingState, type CalculatorState, type QuizState, type TicTacToeState, type FibonacciState, type SnakeState, type GridEditMode } from '@/components/ide/VisualizationPanel';
import { generateBubbleSortSteps, generateQuickSortSteps, generateAStarSteps, generateMazeSolverSteps, generateCalculatorSteps, generateQuizSteps, generateTicTacToeSteps, generateFibonacciSteps, generateSnakeSteps, type AnimationStep } from '@/lib/visualizationAnimation';

// Use sessionStorage for Ghost Diff - persists within browser session
const STORAGE_KEY = '__logigo_original_snapshot';

const getOriginalSnapshot = (): FlowNode[] => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[Ghost Diff] Failed to read snapshot from storage');
  }
  return [];
};

const setOriginalSnapshot = (nodes: FlowNode[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  } catch (e) {
    console.warn('[Ghost Diff] Failed to save snapshot to storage');
  }
};

const clearOriginalSnapshot = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    console.log('[Ghost Diff] Cleared original snapshot');
  } catch (e) {
    console.warn('[Ghost Diff] Failed to clear snapshot');
  }
};

const detectFunctionCalls = (code: string): boolean => {
  try {
    let ast: any;
    try {
      ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
    } catch {
      ast = acorn.parse(code, { ecmaVersion: 2020, sourceType: 'script' });
    }
    let foundCall = false;
    
    const walk = (node: any): void => {
      if (!node || foundCall) return;
      if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
        return;
      }
      if (node.type === 'CallExpression' || node.type === 'NewExpression' || 
          node.type === 'TaggedTemplateExpression' || node.type === 'ImportExpression') {
        foundCall = true;
        return;
      }
      for (const key in node) {
        if (key === 'type' || key === 'start' || key === 'end' || key === 'loc' || key === 'range') continue;
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(c => walk(c));
        } else if (child && typeof child === 'object' && child.type) {
          walk(child);
        }
      }
    };
    
    for (const stmt of ast.body) {
      if (stmt.type === 'FunctionDeclaration') continue;
      walk(stmt);
      if (foundCall) return true;
    }
    return false;
  } catch {
    return true;
  }
};

export default function Workbench() {
  const { adapter, code, isReady } = useAdapter();
  const { isAuthenticated, user, login, logout, isLoading: licenseLoading } = useLicense();
  const [flowData, setFlowData] = useState(parseCodeToFlow(code));
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelingNode, setLabelingNode] = useState<{ nodeId: string; label: string; currentUserLabel?: string } | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseReady, setParseReady] = useState(false);
  const [playQueued, setPlayQueued] = useState(false);
  const [hasFunctionCalls, setHasFunctionCalls] = useState(() => detectFunctionCalls(code));
  
  // Premium features state
  const [showDiff, setShowDiff] = useState(false);
  const [diffNodes, setDiffNodes] = useState<DiffNode[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Array<{ step: number; label: string }>>([]);
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());
  const [variableHistory, setVariableHistory] = useState<Array<{ step: number; variables: Record<string, unknown> }>>([]);
  
  const interpreterRef = useRef<Interpreter | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ghostDiffRef = useRef<GhostDiff>(new GhostDiff({ debug: true }));
  const executionControllerRef = useRef<ExecutionController>(new ExecutionController({ debug: false }));
  const flowDataRef = useRef(flowData);
  
  // Test feature states
  const [testPanelOpen, setTestPanelOpen] = useState(false);
  
  // New UI state for sidebar layout
  const [codeEditorCollapsed, setCodeEditorCollapsed] = useState(false);
  const [showFloatingVariables, setShowFloatingVariables] = useState(true);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Help dialog state
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // AI Debug / Visualize Flow state
  const [showDebugPane, setShowDebugPane] = useState(false);
  const [debugSessionId, setDebugSessionId] = useState<string | null>(null);
  const [debugPromptCopied, setDebugPromptCopied] = useState(false);
  const [debugCheckpoints, setDebugCheckpoints] = useState<Array<{ id: string; variables: Record<string, unknown>; timestamp: number }>>([]);
  const [originalCodeSnapshot, setOriginalCodeSnapshot] = useState<string | null>(null);
  
  // Fullscreen mode state: null = normal, 'workspace' = with controls, 'presentation' = clean
  const [fullscreenMode, setFullscreenMode] = useState<'workspace' | 'presentation' | null>(null);
  const flowchartContainerRef = useRef<HTMLDivElement>(null);
  
  // Layout presets - refs for programmatic resizing
  const sidebarPanelRef = useRef<ImperativePanelHandle>(null);
  const flowchartPanelRef = useRef<ImperativePanelHandle>(null);
  const [currentLayout, setCurrentLayout] = useState<string>('30-70');
  
  // Layout preset configurations (sidebar : flowchart ratios)
  const layoutPresets = {
    '50-50': { sidebar: 50, flowchart: 50, label: '50/50' },
    '30-70': { sidebar: 30, flowchart: 70, label: '30/70' },
    'flow-only': { sidebar: 0, flowchart: 100, label: 'Flow Only' },
  };
  
  const applyLayoutPreset = (presetKey: keyof typeof layoutPresets) => {
    const preset = layoutPresets[presetKey];
    
    // Expand both panels first to ensure they're not collapsed
    sidebarPanelRef.current?.expand();
    flowchartPanelRef.current?.expand();
    
    // Small delay to let expand complete before resizing
    setTimeout(() => {
      if (presetKey === 'flow-only') {
        sidebarPanelRef.current?.resize(5);
        flowchartPanelRef.current?.resize(95);
      } else {
        sidebarPanelRef.current?.resize(preset.sidebar);
        flowchartPanelRef.current?.resize(preset.flowchart);
      }
    }, 50);
    
    setCurrentLayout(presetKey);
    localStorage.setItem('logigo-layout-preset', presetKey);
  };
  
  // Load saved layout on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('logigo-layout-preset') as keyof typeof layoutPresets | null;
    if (savedLayout && layoutPresets[savedLayout]) {
      // Small delay to ensure panels are mounted
      setTimeout(() => applyLayoutPreset(savedLayout), 100);
    }
  }, []);
  
  // Runtime Mode state (logigo-core integration)
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    isConnected: false,
    mode: 'static',
    checkpointCount: 0
  });
  const [liveCheckpoints, setLiveCheckpoints] = useState<CheckpointPayload[]>([]);
  
  // Remote session state (for ?session= URL parameter - connects to external app)
  const [remoteSessionId, setRemoteSessionId] = useState<string | null>(null);
  const [remoteSessionName, setRemoteSessionName] = useState<string | null>(null);
  const [remoteConnectionStatus, setRemoteConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [remoteCheckpoints, setRemoteCheckpoints] = useState<Array<{ id: string; variables: Record<string, unknown>; timestamp: number }>>([]);
  const [remoteActiveCheckpoint, setRemoteActiveCheckpoint] = useState<{ id: string; variables: Record<string, unknown> } | null>(null);
  const remoteEventSourceRef = useRef<EventSource | null>(null);
  const remoteReconnectAttemptRef = useRef(0);
  const remoteReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlWsRef = useRef<WebSocket | null>(null);
  const [handshakeNodeId, setHandshakeNodeId] = useState<string | null>(null);
  
  // Remote breakpoint/pause state
  const [remotePausedAt, setRemotePausedAt] = useState<string | null>(null);
  const [remoteBreakpoints, setRemoteBreakpoints] = useState<Set<string>>(new Set());
  
  // Backwards compatibility
  const remoteConnected = remoteConnectionStatus === 'connected';
  
  // Compute active node info for Debug Panel display
  // Always use flowData.nodes for label lookup since diffNodes may not have userLabel data
  const activeNodeInfo = useMemo(() => {
    if (!activeNodeId) return { label: undefined, userLabel: undefined };
    const activeNode = flowData.nodes.find(n => n.id === activeNodeId);
    return {
      label: activeNode?.data?.label as string | undefined,
      userLabel: activeNode?.data?.userLabel as string | undefined
    };
  }, [activeNodeId, flowData.nodes]);
  
  // Convert remote breakpoints (checkpointIds) to nodeIds for Flowchart display
  // When in remote mode, only show remote breakpoints, not local ones
  const effectiveBreakpoints = useMemo(() => {
    // If in remote mode, use remote breakpoints (mapped to nodeIds)
    if (remoteSessionId) {
      if (remoteBreakpoints.size === 0) {
        return new Set<string>(); // Empty set for remote mode with no breakpoints
      }
      // Map checkpointIds to nodeIds
      const nodeIds = new Set<string>();
      flowData.nodes.forEach(node => {
        const checkpointId = (node.data?.userLabel as string) || node.id;
        if (remoteBreakpoints.has(checkpointId)) {
          nodeIds.add(node.id);
        }
      });
      return nodeIds;
    }
    // Otherwise use local breakpoints
    return breakpoints;
  }, [remoteSessionId, remoteBreakpoints, breakpoints, flowData.nodes]);
  
  // Algorithm visualization state
  const [activeVisualizer, setActiveVisualizer] = useState<VisualizerType>(null);
  const [sortingState, setSortingState] = useState<SortingState>(DEFAULT_SORTING_STATE);
  const [pathfindingState, setPathfindingState] = useState<PathfindingState>(DEFAULT_PATHFINDING_STATE);
  const [calculatorState, setCalculatorState] = useState<CalculatorState>(DEFAULT_CALCULATOR_STATE);
  const [quizState, setQuizState] = useState<QuizState>(DEFAULT_QUIZ_STATE);
  const [tictactoeState, setTictactoeState] = useState<TicTacToeState>(DEFAULT_TICTACTOE_STATE);
  const [fibonacciState, setFibonacciState] = useState<FibonacciState>(DEFAULT_FIBONACCI_STATE);
  const [snakeState, setSnakeState] = useState<SnakeState>(DEFAULT_SNAKE_STATE);
  const [showVisualization, setShowVisualization] = useState(false);
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<string | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Grid edit mode for pathfinding visualizer
  const [gridEditMode, setGridEditMode] = useState<GridEditMode>(null);

  // File sync watch mode - detect external file changes (e.g., from Replit Agent)
  const [watchModeEnabled, setWatchModeEnabled] = useState(true);
  const { isWatching, lastSyncTime, saveToFile, markAsSaved } = useWatchFile({
    enabled: watchModeEnabled,
    pollInterval: 2000,
    onExternalChange: (data) => {
      if (data.code && data.code !== code) {
        console.log('[Watch Mode] Applying external code change');
        adapter.writeFile(data.code);
        toast.success('Code updated from file sync');
      }
    }
  });

  // Keep flowDataRef in sync with flowData state
  useEffect(() => {
    flowDataRef.current = flowData;
  }, [flowData]);

  // Load shared code from URL parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedCode = urlParams.get('code');
    const isPopup = urlParams.get('popup') === 'true';
    
    if (encodedCode && isReady) {
      try {
        // Decode: first atob (base64 decode), then decodeURIComponent
        const decoded = decodeURIComponent(atob(encodedCode));
        if (decoded.trim()) {
          adapter.writeFile(decoded);
          // Clear the URL parameter to avoid reloading on refresh
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('popup');
          window.history.replaceState({}, '', url.toString());
          
          // If popup mode, auto-apply Flow Only layout
          if (isPopup) {
            setTimeout(() => applyLayoutPreset('flow-only'), 200);
          }
        }
      } catch (e) {
        console.warn('Failed to decode shared code:', e);
      }
    }
  }, [isReady, adapter]);

  // Connect to remote session if ?session= URL parameter is present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (!sessionId || !isReady) return;
    
    console.log('[Remote Session] Connecting to session:', sessionId);
    setRemoteSessionId(sessionId);
    setRemoteConnectionStatus('connecting');
    
    // Self-healing configuration
    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_RECONNECT_DELAY = 1000;
    let sessionEnded = false;
    
    // Fetch session info and code
    fetch(`/api/remote/session/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Session not found');
        return res.json();
      })
      .then(info => {
        console.log('[Remote Session] Session info:', info);
        setRemoteSessionName(info.name || 'Remote App');
        
        // Load code into editor if provided
        if (info.code) {
          adapter.writeFile(info.code);
          toast.success(`Connected to ${info.name || 'Remote App'}`, {
            description: 'Code loaded and listening for checkpoints'
          });
        } else {
          toast.info(`Connected to ${info.name || 'Remote App'}`, {
            description: 'Listening for checkpoints. Use "Add Source Code" in the remote app to visualize the full flowchart.'
          });
        }
        
        // Load existing checkpoints
        if (info.checkpoints && info.checkpoints.length > 0) {
          setRemoteCheckpoints(info.checkpoints);
          setRemoteActiveCheckpoint(info.checkpoints[info.checkpoints.length - 1]);
        }
      })
      .catch(err => {
        console.error('[Remote Session] Failed to fetch session:', err);
        setRemoteConnectionStatus('disconnected');
        toast.error('Session not found', {
          description: 'The remote session may have expired. Ask the app to reconnect.'
        });
      });
    
    // SSE connection with automatic reconnection
    function connectSSE() {
      if (sessionEnded) return;
      
      const eventSource = new EventSource(`/api/remote/stream/${sessionId}`);
      remoteEventSourceRef.current = eventSource;
      
      eventSource.addEventListener('session_info', (e) => {
        const info = JSON.parse(e.data);
        setRemoteSessionName(info.name || 'Remote App');
        setRemoteConnectionStatus('connected');
        remoteReconnectAttemptRef.current = 0; // Reset on successful connection
        
        // If code is updated, reload it
        if (info.code) {
          adapter.writeFile(info.code);
        }
      });
      
      eventSource.addEventListener('checkpoint', (e) => {
        const checkpoint = JSON.parse(e.data);
        console.log('[Remote Session] Checkpoint received:', checkpoint.id);
        setRemoteCheckpoints(prev => [...prev, checkpoint]);
        setRemoteActiveCheckpoint(checkpoint);
      });
      
      eventSource.addEventListener('code_update', (e) => {
        const { code: newCode } = JSON.parse(e.data);
        if (newCode) {
          adapter.writeFile(newCode);
          toast.info('Code updated from remote app');
        }
      });
      
      eventSource.addEventListener('session_end', () => {
        console.log('[Remote Session] Session ended by remote app');
        sessionEnded = true;
        setRemoteConnectionStatus('disconnected');
        toast.info('Remote session ended', {
          description: 'The remote app disconnected. Your flowchart is preserved.'
        });
      });
      
      eventSource.onerror = () => {
        console.warn('[Remote Session] SSE connection error');
        eventSource.close();
        remoteEventSourceRef.current = null;
        
        // Don't reconnect if session was intentionally ended
        if (sessionEnded) {
          setRemoteConnectionStatus('disconnected');
          return;
        }
        
        // Attempt reconnection with exponential backoff
        if (remoteReconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
          remoteReconnectAttemptRef.current++;
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, remoteReconnectAttemptRef.current - 1);
          console.log(`[Remote Session] Reconnecting in ${delay}ms (attempt ${remoteReconnectAttemptRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          setRemoteConnectionStatus('reconnecting');
          
          remoteReconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, delay);
        } else {
          console.error('[Remote Session] Max reconnection attempts reached');
          setRemoteConnectionStatus('disconnected');
          toast.error('Connection lost', {
            description: 'Unable to reconnect to remote session. Refresh the page to try again.'
          });
        }
      };
      
      eventSource.onopen = () => {
        console.log('[Remote Session] SSE connected');
        setRemoteConnectionStatus('connected');
        remoteReconnectAttemptRef.current = 0;
      };
    }
    
    connectSSE();
    
    // Connect WebSocket control channel for visual handshake
    function connectControlChannel() {
      if (sessionEnded) return;
      
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/remote/control/${sessionId}?type=studio`;
      
      try {
        const ws = new WebSocket(wsUrl);
        controlWsRef.current = ws;
        
        ws.onopen = () => {
          console.log('[Control Channel] WebSocket connected');
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'CONFIRM_HIGHLIGHT') {
              console.log('[Control Channel] Highlight confirmed:', message.checkpointId, message.success);
              // Clear handshake state after confirmation
              setTimeout(() => setHandshakeNodeId(null), 500);
            } else if (message.type === 'REMOTE_FOCUS') {
              console.log('[Control Channel] Remote focus requested:', message.checkpointId);
              // Remote app wants to focus on a checkpoint - highlight the node
              // Use ref to avoid stale flowData closure
              const matchingNode = flowDataRef.current.nodes.find(n => 
                (n.data?.userLabel as string) === message.checkpointId
              );
              if (matchingNode) {
                setActiveNodeId(matchingNode.id);
              }
            } else if (message.type === 'PAUSED_AT') {
              console.log('[Control Channel] Remote paused at:', message.checkpointId);
              setRemotePausedAt(message.checkpointId);
              // Find and highlight the paused node
              const pausedNode = flowDataRef.current.nodes.find(n => 
                (n.data?.userLabel as string) === message.checkpointId
              );
              if (pausedNode) {
                setActiveNodeId(pausedNode.id);
              }
              toast.info('Remote Paused', {
                description: `Execution paused at: ${message.checkpointId}`
              });
            } else if (message.type === 'RESUMED') {
              console.log('[Control Channel] Remote resumed execution');
              setRemotePausedAt(null);
            } else if (message.type === 'BREAKPOINTS_UPDATED') {
              console.log('[Control Channel] Remote breakpoints:', message.breakpoints);
              setRemoteBreakpoints(new Set(message.breakpoints || []));
            }
          } catch (e) {
            console.warn('[Control Channel] Invalid message:', e);
          }
        };
        
        ws.onclose = () => {
          console.log('[Control Channel] WebSocket disconnected');
          controlWsRef.current = null;
          // Reconnect after a delay if not ended
          if (!sessionEnded) {
            setTimeout(connectControlChannel, 2000);
          }
        };
        
        ws.onerror = () => {
          console.warn('[Control Channel] WebSocket error');
        };
      } catch (e) {
        console.warn('[Control Channel] Failed to connect:', e);
      }
    }
    
    connectControlChannel();
    
    // Keep session param in URL for reconnection on refresh
    // Don't clear it - allows page refresh to reconnect
    
    return () => {
      sessionEnded = true;
      if (remoteReconnectTimeoutRef.current) {
        clearTimeout(remoteReconnectTimeoutRef.current);
        remoteReconnectTimeoutRef.current = null;
      }
      if (remoteEventSourceRef.current) {
        remoteEventSourceRef.current.close();
        remoteEventSourceRef.current = null;
      }
      if (controlWsRef.current) {
        controlWsRef.current.close();
        controlWsRef.current = null;
      }
      setRemoteConnectionStatus('disconnected');
      setHandshakeNodeId(null); // Clear handshake state on disconnect
    };
  }, [isReady, adapter]);

  // Highlight flowchart node when remote checkpoint arrives
  useEffect(() => {
    if (!remoteActiveCheckpoint || flowData.nodes.length === 0) return;
    
    const checkpointId = remoteActiveCheckpoint.id;
    
    // Try to find a matching node using deterministic matching:
    // 1. Exact match on userLabel (highest priority - set by parser for checkpoint nodes)
    // 2. Exact match on checkpoint ID in label (e.g., checkpoint('upload-start'))
    const matchingNode = flowData.nodes.find(node => {
      const label = (node.data?.label as string) || '';
      const userLabel = (node.data?.userLabel as string) || '';
      
      // Priority 1: Exact match on userLabel (most reliable)
      if (userLabel === checkpointId) {
        return true;
      }
      
      // Priority 2: Exact match with quoted checkpoint ID in label
      // Match checkpoint('id') or checkpoint("id") patterns exactly
      const singleQuoteMatch = label.match(/checkpoint\s*\(\s*'([^']+)'\s*[,)]/);
      const doubleQuoteMatch = label.match(/checkpoint\s*\(\s*"([^"]+)"\s*[,)]/);
      const extractedId = singleQuoteMatch?.[1] || doubleQuoteMatch?.[1];
      
      if (extractedId === checkpointId) {
        return true;
      }
      
      return false;
    });
    
    if (matchingNode) {
      console.log('[Remote Session] Highlighting node:', matchingNode.id, 'for checkpoint:', checkpointId);
      setActiveNodeId(matchingNode.id);
      
      // Also update execution state to show variables in the panel
      setExecutionState({
        variables: remoteActiveCheckpoint.variables,
        callStack: [],
        currentNodeId: matchingNode.id,
        status: 'running',
        output: [],
        error: undefined
      });
    } else {
      console.log('[Remote Session] No matching node found for checkpoint:', checkpointId);
    }
  }, [remoteActiveCheckpoint, flowData.nodes]);

  // Clear breakpoints and variable history when code changes
  useEffect(() => {
    setBreakpoints(new Set());
    setVariableHistory([]);
  }, [code]);

  // Parse code whenever it changes
  useEffect(() => {
    if (!isReady) return;
    
    // Mark parsing started - disables shortcuts immediately
    setIsParsing(true);
    setParseReady(false);
    
    const timer = setTimeout(() => {
      const newFlowData = parseCodeToFlow(code);
      
      // Check if parse succeeded (not an error node)
      const parseSucceeded = newFlowData.nodes.length > 0 && newFlowData.nodes[0]?.id !== 'error';
      
      // If parse failed, keep showing the last valid flowchart (don't update flowData)
      // This prevents jarring "Syntax Error" nodes while typing
      if (!parseSucceeded) {
        console.log('[Parser] Parse error - keeping last valid flowchart');
        setIsParsing(false);
        setParseReady(false);
        return; // Don't update flowData, keep showing last valid state
      }
      
      // Get current original snapshot (persists in window across HMR)
      const currentSnapshot = getOriginalSnapshot();
      
      // Capture original snapshot on first successful parse
      if (newFlowData.nodes.length > 0 && currentSnapshot.length === 0) {
        setOriginalSnapshot(JSON.parse(JSON.stringify(newFlowData.nodes))); // Deep copy
        console.log('[Ghost Diff] Original snapshot captured:', newFlowData.nodes.length, 'nodes');
        // Don't diff on first parse - just store the original
        setFlowData(newFlowData);
        setHasFunctionCalls(detectFunctionCalls(code));
      } else if (features.hasFeature('ghostDiff') && currentSnapshot.length > 0) {
        // Compute diff against ORIGINAL snapshot (only on subsequent parses)
        const diff = ghostDiffRef.current.diffTrees(currentSnapshot, newFlowData.nodes);
        const styledDiffNodes = ghostDiffRef.current.applyDiffStyling(diff.nodes);
        setDiffNodes(styledDiffNodes);
        
        console.log('[Ghost Diff] Stats:', diff.stats);
        setFlowData(newFlowData);
        setHasFunctionCalls(detectFunctionCalls(code));
      } else {
        setFlowData(newFlowData);
        setHasFunctionCalls(detectFunctionCalls(code));
      }
      
      // Reset interpreter when code changes
      interpreterRef.current = null;
      setActiveNodeId(null);
      setExecutionState(null);
      setIsPlaying(false);
      setProgress({ current: 0, total: 0 });
      setIsParsing(false);
      
      // Mark parse ready for successful parse
      setParseReady(true);
      
      // Auto-start playback if user queued it during parsing
      if (parseSucceeded && playQueued) {
        setPlayQueued(false);
        // Use setTimeout to ensure state updates complete
        setTimeout(() => {
          handlePlay();
        }, 0);
      }
    }, 500); // Debounce parsing
    
    return () => {
      clearTimeout(timer);
      setIsParsing(false);
      setParseReady(false);
    };
  }, [code, isReady]);

  // Listen for logigo-core runtime events via postMessage (Reporter API)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return; // Reject cross-origin messages
      }
      
      const message = event.data;
      
      // Protocol check: Only handle messages from LOGIGO_CORE
      if (!isLogiGoMessage(message)) {
        return; // Ignore non-LogiGo messages
      }
      
      // Update heartbeat on any message
      const heartbeat = Date.now();
      
      if (isSessionStart(message)) {
        // Session Start - switch to Live Mode and reset visualization
        console.log('[LogiGo Studio] Session started:', message.payload.sessionId);
        setRuntimeState({
          isConnected: true,
          mode: 'live',
          lastHeartbeat: heartbeat,
          checkpointCount: 0,
          sessionId: message.payload.sessionId,
          sessionStartTime: message.payload.startTime
        });
        
        // Reset visualization state
        setLiveCheckpoints([]);
        setActiveNodeId(null);
        
        // Could reset interpreter or execution state here if needed
      }
      
      if (isCheckpoint(message)) {
        // Checkpoint event - process checkpoint data
        const checkpoint = message.payload;
        console.log('[LogiGo Studio] Checkpoint:', checkpoint.id, checkpoint.variables);
        
        // Add to checkpoints list
        setLiveCheckpoints(prev => [...prev, checkpoint]);
        
        // Update runtime state
        setRuntimeState(prev => ({
          ...prev,
          isConnected: true,
          mode: 'live',
          checkpointCount: prev.checkpointCount + 1,
          currentCheckpoint: checkpoint,
          lastHeartbeat: heartbeat
        }));
        
        // Highlight DOM element if specified (Visual Handshake)
        if (checkpoint.domElement) {
          try {
            const element = document.querySelector(checkpoint.domElement);
            if (element) {
              element.classList.add('logigo-highlight');
              setTimeout(() => {
                element.classList.remove('logigo-highlight');
              }, 1000);
            }
          } catch (e) {
            console.warn('[LogiGo Studio] Invalid DOM selector:', checkpoint.domElement);
          }
        }
        
        // Map checkpoint to flowchart node if metadata includes line number
        if (checkpoint.metadata?.line && flowData.nodeMap) {
          const nodeId = flowData.nodeMap.get(`${checkpoint.metadata.line}:0`);
          if (nodeId) {
            setActiveNodeId(nodeId);
          }
        }
      }
    };
    
    // Inactivity timer: revert to Static Mode if no heartbeat for 15 seconds
    const inactivityTimer = setInterval(() => {
      setRuntimeState(prev => {
        if (prev.mode === 'live' && prev.lastHeartbeat) {
          const inactiveDuration = Date.now() - prev.lastHeartbeat;
          if (inactiveDuration > 15000) { // 15 seconds
            console.log('[LogiGo Studio] Reverting to Static Mode due to inactivity');
            return {
              ...prev,
              isConnected: false,
              mode: 'static'
            };
          }
        }
        return prev;
      });
    }, 5000); // Check every 5 seconds
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(inactivityTimer);
    };
  }, [flowData.nodeMap]);

  const initializeInterpreter = () => {
    interpreterRef.current = new Interpreter(code, flowData.nodeMap);
    
    // Prepare the first function found in the code (no specific function name required)
    const success = interpreterRef.current.prepare();
    
    if (success) {
      const prog = interpreterRef.current.getProgress();
      setProgress(prog);
      return true;
    }
    
    // Check for step limit/recursion depth errors and show helpful message
    if (interpreterRef.current.isStepLimitError()) {
      const friendlyError = interpreterRef.current.getUserFriendlyError();
      toast.warning('Algorithm too complex for autoplay', {
        description: friendlyError || 'Try using Step mode (S key) to step through manually.',
        duration: 8000,
        action: {
          label: 'Got it',
          onClick: () => {}
        }
      });
      // Clear the interpreter so user can retry
      interpreterRef.current = null;
    }
    
    return false;
  };

  const handlePlay = () => {
    // If parsing, queue the play action to run when parsing completes
    if (isParsing) {
      setPlayQueued(true);
      return;
    }
    
    // Clear any pending restart to avoid interrupting manual playback
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    // Clear queued flag if set
    setPlayQueued(false);
    
    if (!interpreterRef.current) {
      const success = initializeInterpreter();
      if (!success) return;
    }
    
    setIsPlaying(true);
    
    // Use ExecutionController for premium tier, simple interval for free tier
    const usePremiumController = features.hasFeature('executionController');
    
    if (usePremiumController) {
      executionControllerRef.current.setSpeed(speed);
    }
    
    // Calculate interval based on speed (base is 800ms)
    const baseInterval = 800;
    const interval = usePremiumController 
      ? executionControllerRef.current.getStepDelay()
      : baseInterval / speed;
    
    // Execute one step and schedule next (using setTimeout for clean breakpoint handling)
    const executeStep = () => {
      if (!interpreterRef.current) return;
      
      const step = interpreterRef.current.stepForward();
      
      if (step) {
        setActiveNodeId(step.nodeId);
        setExecutionState(step.state);
        setProgress(interpreterRef.current.getProgress());
        
        // Record variable history snapshot
        const currentProgress = interpreterRef.current.getProgress();
        setVariableHistory(prev => {
          const existingIdx = prev.findIndex(s => s.step === currentProgress.current);
          if (existingIdx >= 0) return prev;
          return [...prev, { step: currentProgress.current, variables: { ...step.state.variables } }];
        });
        
        // Find and highlight the source line
        const node = flowData.nodes.find(n => n.id === step.nodeId);
        if (node?.data.sourceData) {
          setHighlightedLine(node.data.sourceData.start.line);
          adapter.navigateToLine(node.data.sourceData.start.line);
        }
        
        // Check for breakpoint - pause and don't schedule next step
        if (breakpoints.has(step.nodeId)) {
          setIsPlaying(false);
          if (playIntervalRef.current) {
            clearTimeout(playIntervalRef.current);
            playIntervalRef.current = null;
          }
          return; // Exit without scheduling next step
        }
        
        // Schedule next step
        playIntervalRef.current = setTimeout(executeStep, interval);
      } else {
        // Execution completed
        setIsPlaying(false);
        if (playIntervalRef.current) {
          clearTimeout(playIntervalRef.current);
          playIntervalRef.current = null;
        }
        
        if (loop) {
          // Clear any pending restart
          if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
          }
          
          // Reset and restart after a brief delay
          restartTimeoutRef.current = setTimeout(() => {
            restartTimeoutRef.current = null;
            
            // Reset state
            interpreterRef.current = null;
            setActiveNodeId(null);
            setExecutionState(null);
            setHighlightedLine(null);
            setProgress({ current: 0, total: 0 });
            
            // Start playing again
            handlePlay();
          }, 600);
        }
      }
    };
    
    // Start the execution chain
    playIntervalRef.current = setTimeout(executeStep, interval);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearTimeout(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    // Also clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  const handleStepForward = () => {
    if (!interpreterRef.current) {
      const success = initializeInterpreter();
      if (!success) return;
    }
    
    if (!interpreterRef.current) return;
    
    const step = interpreterRef.current.stepForward();
    
    if (step) {
      setActiveNodeId(step.nodeId);
      setExecutionState(step.state);
      setProgress(interpreterRef.current.getProgress());
      
      // Record variable history snapshot
      const currentProgress = interpreterRef.current.getProgress();
      setVariableHistory(prev => {
        const existingIdx = prev.findIndex(s => s.step === currentProgress.current);
        if (existingIdx >= 0) return prev;
        return [...prev, { step: currentProgress.current, variables: { ...step.state.variables } }];
      });
      
      // Find and highlight the source line
      const node = flowData.nodes.find(n => n.id === step.nodeId);
      if (node?.data.sourceData) {
        setHighlightedLine(node.data.sourceData.start.line);
        adapter.navigateToLine(node.data.sourceData.start.line);
      }
    }
  };

  const handleStepBackward = () => {
    if (!interpreterRef.current) return;
    
    const step = interpreterRef.current.stepBackward();
    
    if (step) {
      setActiveNodeId(step.nodeId);
      setExecutionState(step.state);
      setProgress(interpreterRef.current.getProgress());
      
      // Find and highlight the source line
      const node = flowData.nodes.find(n => n.id === step.nodeId);
      if (node?.data.sourceData) {
        setHighlightedLine(node.data.sourceData.start.line);
        adapter.navigateToLine(node.data.sourceData.start.line);
      }
    }
  };

  const handleJumpToStep = (targetStep: number) => {
    if (!interpreterRef.current) return;
    
    const result = interpreterRef.current.jumpToStep(targetStep);
    
    if (result) {
      setActiveNodeId(result.nodeId);
      setExecutionState(result.state);
      setProgress(interpreterRef.current.getProgress());
      
      // Find and highlight the source line
      const node = flowData.nodes.find(n => n.id === result.nodeId);
      if (node?.data.sourceData) {
        setHighlightedLine(node.data.sourceData.start.line);
        adapter.navigateToLine(node.data.sourceData.start.line);
      }
    } else if (targetStep === 0) {
      // Jumped to beginning
      setActiveNodeId(null);
      setExecutionState(null);
      setProgress(interpreterRef.current.getProgress());
      setHighlightedLine(null);
    }
  };

  const handleAddBookmark = (step: number) => {
    const node = flowData.nodes.find(n => {
      const allSteps = interpreterRef.current?.getAllSteps() || [];
      return allSteps[step - 1]?.nodeId === n.id;
    });
    
    const label = node?.data.label || `Step ${step}`;
    setBookmarks(prev => [...prev, { step, label }]);
  };

  const handleRemoveBookmark = (step: number) => {
    setBookmarks(prev => prev.filter(b => b.step !== step));
  };

  const handleBreakpointToggle = (nodeId: string) => {
    // For remote sessions, send breakpoint commands to the remote app
    if (remoteSessionId && controlWsRef.current?.readyState === WebSocket.OPEN) {
      // Find the node to get its checkpoint ID (userLabel)
      const node = flowData.nodes.find(n => n.id === nodeId);
      const checkpointId = (node?.data?.userLabel as string) || nodeId;
      
      // Toggle on the remote side
      if (remoteBreakpoints.has(checkpointId)) {
        handleRemoteRemoveBreakpoint(checkpointId);
      } else {
        handleRemoteSetBreakpoint(checkpointId);
      }
      return;
    }
    
    // Local breakpoints (non-remote mode)
    setBreakpoints(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleAddLabel = (nodeId: string, currentUserLabel?: string) => {
    const node = flowData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    setLabelingNode({
      nodeId,
      label: node.data?.label || nodeId,
      currentUserLabel
    });
    setLabelDialogOpen(true);
  };

  const handleRemoveLabel = async (nodeId: string) => {
    const node = flowData.nodes.find(n => n.id === nodeId);
    if (!node?.data?.sourceData) return;
    
    const lineNum = node.data.sourceData.start.line;
    const lines = code.split('\n');
    
    // Check line above for @logigo comment
    if (lineNum >= 2) {
      const prevLineIndex = lineNum - 2;
      const prevLine = lines[prevLineIndex];
      if (prevLine && /\/\/\s*@logigo:/i.test(prevLine)) {
        // Remove the comment line
        lines.splice(prevLineIndex, 1);
        const newCode = lines.join('\n');
        
        historyManager.push(newCode);
        adapter.writeFile(newCode);
        markAsSaved();
        // Only save code - parser will regenerate nodes from the new code
        await saveToFile({ code: newCode });
      }
    }
  };

  const handleSaveLabel = async (labelText: string): Promise<{ success: boolean; error?: string }> => {
    if (!labelingNode) return { success: false, error: 'No node selected' };
    
    const node = flowData.nodes.find(n => n.id === labelingNode.nodeId);
    if (!node?.data?.sourceData) return { success: false, error: 'Node has no source location' };
    
    const lineNum = node.data.sourceData.start.line;
    const lines = code.split('\n');
    const indent = lines[lineNum - 1]?.match(/^(\s*)/)?.[1] || '';
    const newComment = `${indent}// @logigo: ${labelText}`;
    
    // Check if there's already a @logigo comment on the line above
    if (lineNum >= 2) {
      const prevLineIndex = lineNum - 2;
      const prevLine = lines[prevLineIndex];
      if (prevLine && /\/\/\s*@logigo:/i.test(prevLine)) {
        // Replace existing comment
        lines[prevLineIndex] = newComment;
      } else {
        // Insert new comment line before the code
        lines.splice(lineNum - 1, 0, newComment);
      }
    } else {
      // Insert at the beginning
      lines.unshift(newComment);
    }
    
    const newCode = lines.join('\n');
    
    try {
      historyManager.push(newCode);
      adapter.writeFile(newCode);
      markAsSaved();
      // Only save code - parser will regenerate nodes from the new code
      await saveToFile({ code: newCode });
      // Clear labeling state
      setLabelingNode(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to save label' };
    }
  };

  const handleReset = () => {
    handlePause();
    interpreterRef.current = null;
    setActiveNodeId(null);
    setExecutionState(null);
    setHighlightedLine(null);
    setProgress({ current: 0, total: 0 });
    setVariableHistory([]);
  };

  const handleStop = () => {
    handlePause();
    interpreterRef.current = null;
    setActiveNodeId(null);
    setExecutionState(null);
    setHighlightedLine(null);
    setProgress({ current: 0, total: 0 });
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    
    // Update ExecutionController if premium tier
    if (features.hasFeature('executionController')) {
      executionControllerRef.current.setSpeed(newSpeed);
    }
    
    // If currently playing, restart with new speed
    if (isPlaying) {
      handlePause();
      // Small delay before restarting
      setTimeout(() => {
        handlePlay();
      }, 50);
    }
  };

  const handleLoopToggle = () => {
    const newLoop = !loop;
    setLoop(newLoop);
    
    // If disabling loop, clear any pending restart
    if (!newLoop && restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  // Remote Control Functions (Bidirectional Protocol)
  const sendRemoteCommand = (message: Record<string, unknown>) => {
    if (controlWsRef.current?.readyState === WebSocket.OPEN) {
      controlWsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  };

  const handleRemoteSetBreakpoint = (checkpointId: string) => {
    if (sendRemoteCommand({ type: 'SET_BREAKPOINT', checkpointId })) {
      console.log('[Remote Control] Set breakpoint:', checkpointId);
    }
  };

  const handleRemoteRemoveBreakpoint = (checkpointId: string) => {
    if (sendRemoteCommand({ type: 'REMOVE_BREAKPOINT', checkpointId })) {
      console.log('[Remote Control] Removed breakpoint:', checkpointId);
    }
  };

  const handleRemoteClearBreakpoints = () => {
    if (sendRemoteCommand({ type: 'CLEAR_BREAKPOINTS' })) {
      console.log('[Remote Control] Cleared all breakpoints');
    }
  };

  const handleRemotePause = () => {
    if (sendRemoteCommand({ type: 'PAUSE' })) {
      console.log('[Remote Control] Sent pause command');
    }
  };

  const handleRemoteResume = () => {
    if (sendRemoteCommand({ type: 'RESUME' })) {
      console.log('[Remote Control] Sent resume command');
      setRemotePausedAt(null);
    }
  };

  const handleRemoteStep = () => {
    if (sendRemoteCommand({ type: 'STEP' })) {
      console.log('[Remote Control] Sent step command');
    }
  };

  const handleNodeClick = (node: Node) => {
    const flowNode = node as unknown as FlowNode;
    if (flowNode.data?.sourceData) {
      setHighlightedLine(flowNode.data.sourceData.start.line);
      adapter.navigateToLine(flowNode.data.sourceData.start.line);
    }
    
    // Visual Handshake: Send highlight command to remote app
    if (remoteSessionId && controlWsRef.current?.readyState === WebSocket.OPEN) {
      const checkpointId = (flowNode.data?.userLabel as string) || flowNode.id;
      const message = {
        type: 'HIGHLIGHT_ELEMENT',
        checkpointId,
        nodeId: flowNode.id,
        line: flowNode.data?.sourceData?.start?.line
      };
      controlWsRef.current.send(JSON.stringify(message));
      setHandshakeNodeId(flowNode.id);
      console.log('[Visual Handshake] Sent highlight request:', checkpointId);
      
      // Fallback timeout: Clear handshake if no confirmation within 3 seconds
      setTimeout(() => {
        setHandshakeNodeId((current) => current === flowNode.id ? null : current);
      }, 3000);
    }
  };

  const handleNodeDoubleClick = (node: Node) => {
    const flowNode = node as unknown as FlowNode;
    
    // Prevent editing while parsing to avoid stale location issues
    if (isParsing) {
      return;
    }
    
    // Only allow editing nodes with source data (not Start/End nodes)
    if (!flowNode.data?.sourceData) {
      return;
    }
    
    // Check if adapter supports editing
    if (!adapter.supportsEditing()) {
      return;
    }
    
    setEditingNode(flowNode);
    setEditDialogOpen(true);
  };

  const handleSaveNodeEdit = async (newCode: string): Promise<{ success: boolean; error?: string }> => {
    if (!editingNode?.data?.sourceData) {
      return { success: false, error: 'No node selected' };
    }
    
    try {
      const patchedCode = patchCode(code, editingNode.data.sourceData, newCode);
      
      // Validate that the patched code parses correctly
      const testParse = parseCodeToFlow(patchedCode);
      
      // Check if parse resulted in error node
      if (testParse.nodes.length > 0 && testParse.nodes[0].id === 'error') {
        return { 
          success: false, 
          error: 'Syntax error: Code contains invalid JavaScript syntax' 
        };
      }
      
      // Clear editing state first to prevent stale location issues
      setEditingNode(null);
      setEditDialogOpen(false);
      
      // Write to file via adapter
      await adapter.writeFile(patchedCode);
      // Also save to file for external sync
      await saveToFile({ code: patchedCode, nodes: flowData.nodes, edges: flowData.edges });
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: `Error: ${err instanceof Error ? err.message : 'Failed to update code'}` 
      };
    }
  };

  const handleCodeChange = (newCode: string) => {
    historyManager.push(newCode);
    adapter.writeFile(newCode);
    // Mark as saved immediately to prevent file watcher from treating this as external
    markAsSaved();
    // Also save to file for external sync (e.g., Replit Agent)
    saveToFile({ code: newCode, nodes: flowData.nodes, edges: flowData.edges });
  };
  
  const [canUndo, setCanUndo] = useState(historyManager.canUndo());
  const [canRedo, setCanRedo] = useState(historyManager.canRedo());
  
  const handleUndo = useCallback(async () => {
    const previousCode = historyManager.undo();
    if (previousCode !== null) {
      // Mark as saved FIRST to prevent file watcher interference
      markAsSaved();
      adapter.writeFile(previousCode);
      // Await the save to ensure lastKnownTime is updated before watcher polls
      await saveToFile({ code: previousCode, nodes: flowData.nodes, edges: flowData.edges });
      setCanUndo(historyManager.canUndo());
      setCanRedo(historyManager.canRedo());
    }
  }, [adapter, flowData.nodes, flowData.edges, markAsSaved, saveToFile]);
  
  const handleRedo = useCallback(async () => {
    const nextCode = historyManager.redo();
    if (nextCode !== null) {
      // Mark as saved FIRST to prevent file watcher interference
      markAsSaved();
      adapter.writeFile(nextCode);
      // Await the save to ensure lastKnownTime is updated before watcher polls
      await saveToFile({ code: nextCode, nodes: flowData.nodes, edges: flowData.edges });
      setCanUndo(historyManager.canUndo());
      setCanRedo(historyManager.canRedo());
    }
  }, [adapter, flowData.nodes, flowData.edges, markAsSaved, saveToFile]);
  
  useEffect(() => {
    setCanUndo(historyManager.canUndo());
    setCanRedo(historyManager.canRedo());
  }, [code]);

  // Track whether we've pushed the initial code to history
  const initialHistoryPushed = useRef(false);
  
  // Push initial code to history on mount (so there's something to undo to)
  useEffect(() => {
    if (code && isReady && !initialHistoryPushed.current) {
      // Clear any stale history from previous sessions and push fresh initial state
      historyManager.clear();
      historyManager.push(code, 'Initial', true);
      initialHistoryPushed.current = true;
      setCanUndo(historyManager.canUndo());
      setCanRedo(historyManager.canRedo());
    }
  }, [code, isReady]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when not in input fields (except our code editor)
      const target = e.target as HTMLElement;
      const isInEditor = target.closest('[data-testid="code-editor"]');
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      // Allow shortcuts in code editor but not in other inputs
      if (isInInput && !isInEditor) return;
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleLoadSample = () => {
    historyManager.push(SAMPLE_CODE, 'Load sample', true);
    adapter.writeFile(SAMPLE_CODE);
    saveToFile({ code: SAMPLE_CODE, nodes: [], edges: [] });
    setCanUndo(historyManager.canUndo());
    setCanRedo(historyManager.canRedo());
  };

  const handleLoadExample = (exampleId: string) => {
    const example = algorithmExamples.find(e => e.id === exampleId);
    if (example) {
      historyManager.push(example.code, `Load ${example.name}`, true);
      adapter.writeFile(example.code);
      saveToFile({ code: example.code, nodes: [], edges: [] });
      setCurrentAlgorithm(exampleId);
      setCanUndo(historyManager.canUndo());
      setCanRedo(historyManager.canRedo());
      
      // Stop any running animation and reset edit mode
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      setIsAnimating(false);
      setAnimationIndex(0);
      setAnimationSteps([]);
      setGridEditMode(null);
      
      // Set up the appropriate visualizer based on example id
      if (example.category === 'sorting') {
        setActiveVisualizer('sorting');
        setSortingState({
          array: [64, 34, 25, 12, 22, 11, 90],
          activeIndices: [],
          sortedIndices: [],
          swapIndices: [],
        });
        setShowVisualization(true);
      } else if (example.category === 'pathfinding') {
        setActiveVisualizer('pathfinding');
        setPathfindingState(DEFAULT_PATHFINDING_STATE);
        setShowVisualization(true);
      } else if (exampleId === 'calculator') {
        setActiveVisualizer('calculator');
        setCalculatorState(DEFAULT_CALCULATOR_STATE);
        setShowVisualization(true);
      } else if (exampleId === 'quiz') {
        setActiveVisualizer('quiz');
        setQuizState(DEFAULT_QUIZ_STATE);
        setShowVisualization(true);
      } else if (exampleId === 'minimax') {
        setActiveVisualizer('tictactoe');
        setTictactoeState(DEFAULT_TICTACTOE_STATE);
        setShowVisualization(true);
      } else if (exampleId === 'fibonacci') {
        setActiveVisualizer('fibonacci');
        setFibonacciState(DEFAULT_FIBONACCI_STATE);
        setShowVisualization(true);
      } else if (exampleId === 'snake') {
        setActiveVisualizer('snake');
        setSnakeState(DEFAULT_SNAKE_STATE);
        setShowVisualization(true);
      } else {
        setActiveVisualizer(null);
        setShowVisualization(false);
      }
    }
  };
  
  const handleResetVisualization = () => {
    // Stop any running animation
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsAnimating(false);
    setAnimationIndex(0);
    setAnimationSteps([]);
    
    if (activeVisualizer === 'sorting') {
      setSortingState({
        array: [64, 34, 25, 12, 22, 11, 90],
        activeIndices: [],
        sortedIndices: [],
        swapIndices: [],
      });
    } else if (activeVisualizer === 'pathfinding') {
      setPathfindingState(DEFAULT_PATHFINDING_STATE);
    } else if (activeVisualizer === 'tictactoe') {
      setTictactoeState(DEFAULT_TICTACTOE_STATE);
    } else if (activeVisualizer === 'snake') {
      setSnakeGameActive(false);
      setSnakeState(DEFAULT_SNAKE_STATE);
    }
  };
  
  const handleCloseVisualization = () => {
    // Stop any running animation
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsAnimating(false);
    setShowVisualization(false);
  };
  
  // Handle cell click in pathfinding grid for setting start/end/walls
  const handleGridCellClick = (node: { x: number; y: number }) => {
    if (!gridEditMode || activeVisualizer !== 'pathfinding') return;
    
    // Stop any running animation when editing
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsAnimating(false);
    setAnimationIndex(0);
    setAnimationSteps([]);
    
    setPathfindingState(prev => {
      const isWall = prev.wallNodes.some(w => w.x === node.x && w.y === node.y);
      const isStart = prev.startNode.x === node.x && prev.startNode.y === node.y;
      const isEnd = prev.endNode.x === node.x && prev.endNode.y === node.y;
      
      if (gridEditMode === 'start') {
        // Don't place start on end or wall
        if (isEnd) return prev;
        return {
          ...prev,
          startNode: node,
          wallNodes: prev.wallNodes.filter(w => !(w.x === node.x && w.y === node.y)),
          pathNodes: [],
          visitedNodes: [],
          currentNode: undefined
        };
      }
      
      if (gridEditMode === 'end') {
        // Don't place end on start or wall
        if (isStart) return prev;
        return {
          ...prev,
          endNode: node,
          wallNodes: prev.wallNodes.filter(w => !(w.x === node.x && w.y === node.y)),
          pathNodes: [],
          visitedNodes: [],
          currentNode: undefined
        };
      }
      
      if (gridEditMode === 'wall') {
        // Don't place wall on start or end
        if (isStart || isEnd) return prev;
        
        // Toggle wall
        if (isWall) {
          return {
            ...prev,
            wallNodes: prev.wallNodes.filter(w => !(w.x === node.x && w.y === node.y)),
            pathNodes: [],
            visitedNodes: [],
            currentNode: undefined
          };
        } else {
          return {
            ...prev,
            wallNodes: [...prev.wallNodes, node],
            pathNodes: [],
            visitedNodes: [],
            currentNode: undefined
          };
        }
      }
      
      return prev;
    });
  };
  
  // Handle TicTacToe cell click for interactive play
  const handleTictactoeMove = (index: number) => {
    // Stop any running animation when user makes a move
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setIsAnimating(false);
    
    // Helper function to check for winner
    const checkWinner = (board: (string | null)[]): string | null => {
      const patterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (const [a,b,c] of patterns) {
        if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
      }
      if (board.every(c => c !== null)) return 'tie';
      return null;
    };
    
    // Minimax algorithm for unbeatable AI
    const minimax = (board: (string | null)[], isMaximizing: boolean, depth: number): number => {
      const winner = checkWinner(board);
      if (winner === 'O') return 10 - depth; // AI wins (prefer faster wins)
      if (winner === 'X') return depth - 10; // Player wins
      if (winner === 'tie') return 0;        // Draw
      
      const emptyCells = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
      
      if (isMaximizing) {
        let bestScore = -Infinity;
        for (const idx of emptyCells) {
          board[idx] = 'O';
          bestScore = Math.max(bestScore, minimax(board, false, depth + 1));
          board[idx] = null;
        }
        return bestScore;
      } else {
        let bestScore = Infinity;
        for (const idx of emptyCells) {
          board[idx] = 'X';
          bestScore = Math.min(bestScore, minimax(board, true, depth + 1));
          board[idx] = null;
        }
        return bestScore;
      }
    };
    
    // Get best move using minimax
    const getAIMove = (board: (string | null)[]): number => {
      const emptyCells = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
      let bestScore = -Infinity;
      let bestMove = emptyCells[0];
      
      for (const idx of emptyCells) {
        board[idx] = 'O';
        const score = minimax(board, false, 0);
        board[idx] = null;
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = idx;
        }
      }
      
      return bestMove;
    };
    
    setTictactoeState(prev => {
      // Don't allow move if game is over or cell is taken
      if (prev.winner || prev.board[index] !== null) return prev;
      
      // Player X makes move
      const newBoard = [...prev.board];
      newBoard[index] = 'X';
      
      // Check if player won
      const playerWinner = checkWinner(newBoard);
      if (playerWinner) {
        return {
          ...prev,
          board: newBoard,
          winner: playerWinner,
          currentPlayer: 'O',
          highlightedCell: index,
          evaluatingCell: null,
          evaluationScore: null
        };
      }
      
      // AI (O) makes move
      const aiMoveIndex = getAIMove(newBoard);
      if (aiMoveIndex !== undefined && aiMoveIndex >= 0) {
        newBoard[aiMoveIndex] = 'O';
        const aiWinner = checkWinner(newBoard);
        
        return {
          ...prev,
          board: newBoard,
          winner: aiWinner,
          currentPlayer: 'X',
          highlightedCell: aiMoveIndex,
          evaluatingCell: null,
          evaluationScore: null
        };
      }
      
      return {
        ...prev,
        board: newBoard,
        currentPlayer: 'O',
        highlightedCell: index,
        evaluatingCell: null,
        evaluationScore: null
      };
    });
  };
  
  // Handle Quiz answer selection
  const handleQuizAnswer = (answerIndex: number) => {
    setQuizState(prev => {
      if (prev.isAnswered) return prev;
      
      const isCorrect = answerIndex === prev.correctAnswer;
      const newScore = isCorrect ? prev.score + 10 : prev.score;
      
      // Show answer result
      const answeredState = {
        ...prev,
        selectedAnswer: answerIndex,
        isAnswered: true,
        score: newScore
      };
      
      // Auto-advance to next question after a delay
      setTimeout(() => {
        setQuizState(current => {
          const nextQuestionIndex = current.currentQuestion + 1;
          
          if (nextQuestionIndex >= current.totalQuestions) {
            // Quiz complete - reset for replay
            return {
              ...DEFAULT_QUIZ_STATE,
              score: current.score
            };
          }
          
          // Move to next question
          const questions = [
            { question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correct: 2 },
            { question: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correct: 1 },
            { question: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Earth'], correct: 1 }
          ];
          
          const nextQ = questions[nextQuestionIndex];
          return {
            ...current,
            question: nextQ.question,
            options: nextQ.options,
            correctAnswer: nextQ.correct,
            currentQuestion: nextQuestionIndex,
            selectedAnswer: null,
            isAnswered: false
          };
        });
      }, 1500);
      
      return answeredState;
    });
  };
  
  // Handle Snake direction change
  const handleSnakeDirectionChange = (newDirection: 'up' | 'down' | 'left' | 'right') => {
    setSnakeState(prev => {
      if (prev.gameOver) return prev;
      return { ...prev, direction: newDirection };
    });
  };
  
  // Handle Calculator expression change
  const handleCalculatorExpressionChange = (expression: string) => {
    // Parse the expression
    const match = expression.match(/^\s*(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)\s*$/);
    if (match) {
      const num1 = parseFloat(match[1]);
      const op = match[2];
      const num2 = parseFloat(match[3]);
      let result: number;
      
      switch (op) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*': result = num1 * num2; break;
        case '/': result = num2 !== 0 ? num1 / num2 : NaN; break;
        default: result = NaN;
      }
      
      setCalculatorState({
        expression,
        num1: match[1],
        num2: match[3],
        operator: op,
        result: isNaN(result) ? 'Error' : result,
        currentStep: 'result'
      });
    } else {
      setCalculatorState(prev => ({
        ...prev,
        expression,
        result: 'Invalid expression',
        currentStep: null
      }));
    }
  };
  
  // Snake game loop - move snake automatically when playing
  const snakeGameLoopRef = useRef<NodeJS.Timeout | null>(null);
  
  const startSnakeGame = () => {
    if (snakeGameLoopRef.current) {
      clearInterval(snakeGameLoopRef.current);
    }
    
    snakeGameLoopRef.current = setInterval(() => {
      setSnakeState(prev => {
        if (prev.gameOver) {
          if (snakeGameLoopRef.current) {
            clearInterval(snakeGameLoopRef.current);
            snakeGameLoopRef.current = null;
          }
          return prev;
        }
        
        const head = prev.snake[0];
        let newHead: { x: number; y: number };
        
        switch (prev.direction) {
          case 'up':
            newHead = { x: head.x, y: head.y - 1 };
            break;
          case 'down':
            newHead = { x: head.x, y: head.y + 1 };
            break;
          case 'left':
            newHead = { x: head.x - 1, y: head.y };
            break;
          case 'right':
            newHead = { x: head.x + 1, y: head.y };
            break;
        }
        
        // Check wall collision
        if (newHead.x < 0 || newHead.x >= prev.gridSize || newHead.y < 0 || newHead.y >= prev.gridSize) {
          return { ...prev, gameOver: true };
        }
        
        // Check self collision
        if (prev.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
          return { ...prev, gameOver: true };
        }
        
        const newSnake = [newHead, ...prev.snake];
        let newFood = prev.food;
        let newScore = prev.score;
        
        // Check food collision
        if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
          newScore += 10;
          // Generate new food position
          const emptyCells: { x: number; y: number }[] = [];
          for (let y = 0; y < prev.gridSize; y++) {
            for (let x = 0; x < prev.gridSize; x++) {
              if (!newSnake.some(s => s.x === x && s.y === y)) {
                emptyCells.push({ x, y });
              }
            }
          }
          if (emptyCells.length > 0) {
            newFood = emptyCells[Math.floor(Math.random() * emptyCells.length)];
          }
        } else {
          newSnake.pop(); // Remove tail if no food eaten
        }
        
        return {
          ...prev,
          snake: newSnake,
          food: newFood,
          score: newScore,
          highlightedSegment: null
        };
      });
    }, 200);
  };
  
  const stopSnakeGame = () => {
    if (snakeGameLoopRef.current) {
      clearInterval(snakeGameLoopRef.current);
      snakeGameLoopRef.current = null;
    }
  };
  
  // Clean up snake game loop on unmount
  useEffect(() => {
    return () => {
      if (snakeGameLoopRef.current) {
        clearInterval(snakeGameLoopRef.current);
      }
    };
  }, []);
  
  // Snake game state for tracking if actively playing
  const [snakeGameActive, setSnakeGameActive] = useState(false);
  
  // Start/stop snake game based on active state
  useEffect(() => {
    if (snakeGameActive && activeVisualizer === 'snake' && showVisualization && !snakeState.gameOver) {
      startSnakeGame();
    } else {
      stopSnakeGame();
    }
    
    return () => stopSnakeGame();
  }, [snakeGameActive, activeVisualizer, showVisualization, snakeState.gameOver]);
  
  // Stop snake game when switching away or closing
  useEffect(() => {
    if (activeVisualizer !== 'snake' || !showVisualization) {
      setSnakeGameActive(false);
    }
  }, [activeVisualizer, showVisualization]);
  
  // Helper function to find flowchart node from line number
  const findNodeByLine = (lineNumber: number): string | null => {
    if (!flowData.nodeMap) {
      return null;
    }
    
    // Look for a node that starts on this line (check column 0 first, then other columns)
    for (let col = 0; col < 50; col++) {
      const locKey = `${lineNumber}:${col}`;
      const nodeId = flowData.nodeMap.get(locKey);
      if (nodeId) {
        return nodeId;
      }
    }
    return null;
  };
  
  // Get list of all available line numbers from the nodeMap for debugging
  const getAvailableLines = (): number[] => {
    if (!flowData.nodeMap) return [];
    const lines = new Set<number>();
    flowData.nodeMap.forEach((nodeId, locKey) => {
      const line = parseInt(locKey.split(':')[0]);
      if (!isNaN(line)) lines.add(line);
    });
    return Array.from(lines).sort((a, b) => a - b);
  };
  
  // Find the closest node to a target line
  const findClosestNode = (targetLine: number): string | null => {
    if (!flowData.nodeMap) return null;
    
    const availableLines = getAvailableLines();
    if (availableLines.length === 0) return null;
    
    // Find closest line
    let closestLine = availableLines[0];
    let minDist = Math.abs(targetLine - closestLine);
    
    for (const line of availableLines) {
      const dist = Math.abs(targetLine - line);
      if (dist < minDist) {
        minDist = dist;
        closestLine = line;
      }
    }
    
    return findNodeByLine(closestLine);
  };
  
  // Apply animation step (updates visualizer state and highlights flowchart node)
  const applyAnimationStep = (step: AnimationStep) => {
    // Update visualizer state
    if (step.type === 'sorting') {
      setSortingState(step.state as SortingState);
    } else if (step.type === 'pathfinding') {
      setPathfindingState(step.state as PathfindingState);
    } else if (step.type === 'calculator') {
      setCalculatorState(step.state as CalculatorState);
    } else if (step.type === 'quiz') {
      setQuizState(step.state as QuizState);
    } else if (step.type === 'tictactoe') {
      setTictactoeState(step.state as TicTacToeState);
    } else if (step.type === 'fibonacci') {
      setFibonacciState(step.state as FibonacciState);
    } else if (step.type === 'snake') {
      setSnakeState(step.state as SnakeState);
    }
    
    // Highlight corresponding flowchart node
    // Priority: lineNumber (if provided) -> closest match via findClosestNode -> stepType heuristic fallback
    const availableLines = getAvailableLines();
    if (availableLines.length === 0) return;
    
    // First priority: Use actual lineNumber from step if available
    if (step.lineNumber !== undefined) {
      const nodeId = findNodeByLine(step.lineNumber);
      if (nodeId) {
        setActiveNodeId(nodeId);
        return;
      }
      // Try finding closest node if exact line doesn't match
      const closestNodeId = findClosestNode(step.lineNumber);
      if (closestNodeId) {
        setActiveNodeId(closestNodeId);
        return;
      }
    }
    
    // Fallback: Use stepType heuristics only when lineNumber is not available
    if (step.stepType) {
      let targetLineIndex = 0;
      switch (step.stepType) {
        case 'init':
          targetLineIndex = 0;
          break;
        case 'compare':
          targetLineIndex = Math.floor(availableLines.length * 0.3);
          break;
        case 'swap':
          targetLineIndex = Math.floor(availableLines.length * 0.5);
          break;
        case 'pivot':
          targetLineIndex = Math.floor(availableLines.length * 0.4);
          break;
        case 'process':
          targetLineIndex = Math.floor(availableLines.length * 0.4);
          break;
        case 'discover':
          targetLineIndex = Math.floor(availableLines.length * 0.6);
          break;
        case 'path':
          targetLineIndex = Math.floor(availableLines.length * 0.7);
          break;
        case 'complete':
          targetLineIndex = availableLines.length - 1;
          break;
        default:
          targetLineIndex = Math.floor(availableLines.length / 2);
      }
      
      targetLineIndex = Math.max(0, Math.min(targetLineIndex, availableLines.length - 1));
      const targetLine = availableLines[targetLineIndex];
      const nodeId = findNodeByLine(targetLine);
      
      if (nodeId) {
        setActiveNodeId(nodeId);
      }
    }
  };

  const handlePlayVisualization = () => {
    // Special handling for snake - use real-time interactive game
    if (activeVisualizer === 'snake') {
      if (snakeGameActive) {
        setSnakeGameActive(false);
        setIsAnimating(false);
      } else {
        // Reset if game over
        if (snakeState.gameOver) {
          setSnakeState(DEFAULT_SNAKE_STATE);
        }
        setSnakeGameActive(true);
        setIsAnimating(true);
      }
      return;
    }
    
    if (isAnimating) {
      // Pause animation
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      setIsAnimating(false);
      return;
    }
    
    // Generate animation steps if not already generated
    let steps = animationSteps;
    if (steps.length === 0) {
      if (currentAlgorithm === 'bubblesort') {
        steps = generateBubbleSortSteps([64, 34, 25, 12, 22, 11, 90]);
      } else if (currentAlgorithm === 'quicksort') {
        steps = generateQuickSortSteps([64, 34, 25, 12, 22, 11, 90]);
      } else if (currentAlgorithm === 'astar') {
        steps = generateAStarSteps(
          DEFAULT_PATHFINDING_STATE.startNode,
          DEFAULT_PATHFINDING_STATE.endNode,
          DEFAULT_PATHFINDING_STATE.rows,
          DEFAULT_PATHFINDING_STATE.cols,
          DEFAULT_PATHFINDING_STATE.wallNodes
        );
      } else if (currentAlgorithm === 'maze') {
        steps = generateMazeSolverSteps(
          DEFAULT_PATHFINDING_STATE.startNode,
          DEFAULT_PATHFINDING_STATE.endNode,
          DEFAULT_PATHFINDING_STATE.rows,
          DEFAULT_PATHFINDING_STATE.cols,
          DEFAULT_PATHFINDING_STATE.wallNodes
        );
      } else if (currentAlgorithm === 'calculator') {
        steps = generateCalculatorSteps(calculatorState.expression || '12 + 5');
      } else if (currentAlgorithm === 'quiz') {
        steps = generateQuizSteps();
      } else if (currentAlgorithm === 'tictactoe' || currentAlgorithm === 'minimax') {
        steps = generateTicTacToeSteps();
      } else if (currentAlgorithm === 'fibonacci') {
        steps = generateFibonacciSteps(8);
      } else if (currentAlgorithm === 'snake') {
        steps = generateSnakeSteps();
      }
      setAnimationSteps(steps);
    }
    
    if (steps.length === 0) return;
    
    // Reset to beginning if at end
    let startIndex = animationIndex;
    if (startIndex >= steps.length) {
      startIndex = 0;
      setAnimationIndex(0);
    }
    
    setIsAnimating(true);
    
    // Calculate interval based on speed (faster = shorter interval)
    const intervalMs = Math.max(50, 500 / speed);
    
    animationIntervalRef.current = setInterval(() => {
      setAnimationIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        
        if (nextIndex >= steps.length) {
          // Animation complete
          if (animationIntervalRef.current) {
            clearInterval(animationIntervalRef.current);
            animationIntervalRef.current = null;
          }
          setIsAnimating(false);
          setActiveNodeId(null); // Clear highlight when done
          return prevIndex;
        }
        
        // Apply the step (updates visualizer and highlights flowchart node)
        applyAnimationStep(steps[nextIndex]);
        
        return nextIndex;
      });
    }, intervalMs);
    
    // Apply first step immediately
    if (steps.length > 0 && startIndex < steps.length) {
      applyAnimationStep(steps[startIndex]);
    }
  };
  
  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, []);

  const handleSearchResults = (result: SearchResult) => {
    setSearchResult(result);
    setHighlightedNodes(result.matchedNodes);
  };

  const handleClearSearch = () => {
    setSearchResult(null);
    setHighlightedNodes(new Set());
  };

  const handleExportPNG = async () => {
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) {
      console.error('Viewport element not found');
      alert('Unable to find flowchart for export. Please try again.');
      return;
    }

    try {
      await exportToPNG(viewportElement, flowData.nodes as Node[], {
        filename: 'logigo-flowchart.png',
        backgroundColor: '#0f172a',
        quality: 2,
      });
    } catch (error) {
      console.error('PNG export failed:', error);
      alert('Export failed. Please try again or check console for details.');
    }
  };

  const handleExportPDF = async () => {
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) {
      console.error('Viewport element not found');
      alert('Unable to find flowchart for export. Please try again.');
      return;
    }

    try {
      await exportToPDF(viewportElement, flowData.nodes as Node[], code, {
        filename: 'logigo-flowchart.pdf',
        backgroundColor: '#0f172a',
        quality: 2,
        includeCode: true,
        includeMetadata: true,
        title: 'LogiGo Code Flowchart',
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try again or check console for details.');
    }
  };

  // File input ref for code import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCode = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        adapter.writeFile(content);
        setCurrentAlgorithm(null);
        setActiveVisualizer(null);
        setShowVisualization(false);
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const handleExportCode = () => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logigo-code.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cleanup interval and timeouts on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  // Derived state for keyboard shortcuts and execution controls
  const hasCode = code.trim().length > 0;
  // UI controls use parseReady for consistent state with shortcuts
  const canExecute = hasCode && parseReady;
  const showCodeEditor = !adapter.hasIntegratedEditor();

  // Keyboard shortcuts for execution controls
  // Always enabled when code exists - handlers queue actions during parsing
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: ' ',
        description: 'Play / Pause',
        action: () => {
          if (isPlaying) {
            handlePause();
          } else {
            handlePlay(); // Queues if parsing
          }
        },
        disabled: !hasCode,
      },
      {
        key: 'k',
        description: 'Play / Pause',
        action: () => {
          if (isPlaying) {
            handlePause();
          } else {
            handlePlay(); // Queues if parsing
          }
        },
        disabled: !hasCode,
      },
      {
        key: 's',
        description: 'Step Forward',
        action: handleStepForward,
        disabled: !canExecute || isPlaying,
      },
      {
        key: 'b',
        description: 'Step Backward',
        action: handleStepBackward,
        disabled: !features.hasFeature('timeTravel') || progress.current === 0,
      },
      {
        key: 'r',
        description: 'Reset',
        action: handleReset,
      },
      {
        key: 'f',
        description: 'Toggle Fullscreen',
        action: () => {
          if (fullscreenMode) {
            setFullscreenMode(null);
          } else {
            setFullscreenMode('workspace');
          }
        },
      },
      {
        key: 'Escape',
        description: 'Exit Fullscreen',
        action: () => {
          if (fullscreenMode) {
            setFullscreenMode(null);
          }
        },
      },
      {
        key: 'o',
        description: 'Import Code (Ctrl+O)',
        action: handleImportCode,
        ctrl: true,
      },
      {
        key: 's',
        description: 'Export Code (Ctrl+S)',
        action: handleExportCode,
        ctrl: true,
        disabled: !hasCode,
      },
    ],
    enabled: isReady,
  });
  
  // Test Functions for Antigravity Features
  const testVisualHandshake = () => {
    console.log('Visual Handshake test triggered!');
    alert('✨ Visual Handshake Test\n\nThis feature will highlight DOM elements when checkpoints execute.\n\nAntigravity team has implemented this in src/overlay.js with the highlightElement() method.');
  };
  
  const testReporterAPI = () => {
    console.log('Reporter API test triggered!');
    
    // Simulate Reporter capturing checkpoint data
    const mockCheckpoints = [
      { id: 'start', timestamp: Date.now(), timeSinceStart: 0, domElement: null, variables: {} },
      { id: 'if_check', timestamp: Date.now() + 100, timeSinceStart: 100, domElement: '#condition', variables: { x: 10 } },
      { id: 'for_loop', timestamp: Date.now() + 250, timeSinceStart: 250, domElement: '#loop', variables: { i: 0 } },
    ];
    
    console.group('📊 LogiGo Reporter API Test');
    console.log('Reporter would capture these checkpoints:');
    mockCheckpoints.forEach((cp, index) => {
      console.log(`[${index + 1}]`, cp);
    });
    
    const mockReport = {
      metadata: {
        exportTime: Date.now(),
        startTime: Date.now() - 250,
        totalDuration: 250
      },
      stats: {
        totalCheckpoints: mockCheckpoints.length,
        totalTime: 250,
        averageInterval: 125
      },
      checkpoints: mockCheckpoints
    };
    
    console.log('Full Report Export:', mockReport);
    console.groupEnd();
    
    alert('✅ Reporter API Test Complete!\n\nCheck the browser console for full JSON data export.');
  };

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-primary-foreground font-mono mb-4 mx-auto">
            C
          </div>
          <p className="text-muted-foreground">Loading Cartographer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col">
      {/* Minimal Header - Just Branding */}
      <header className="h-10 border-b border-border flex items-center justify-between px-6 bg-card z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center font-bold text-primary-foreground font-mono text-sm">
            L
          </div>
          <h1 className="font-semibold tracking-tight text-sm">LogiGo</h1>
          <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">Beta</span>
          {isAuthenticated && user?.tier && user.tier !== 'free' && (
            <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-medium">
              {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
            </span>
          )}
          {remoteSessionId && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
              remoteConnectionStatus === 'connected'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : remoteConnectionStatus === 'reconnecting'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              <Wifi className={`w-3 h-3 ${remoteConnectionStatus === 'reconnecting' ? 'animate-pulse' : ''}`} />
              {remoteConnectionStatus === 'connected' 
                ? `Connected: ${remoteSessionName || 'Remote App'}` 
                : remoteConnectionStatus === 'reconnecting'
                ? 'Reconnecting...'
                : 'Connecting...'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={showDebugPane ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (!showDebugPane) {
                // Capture original code for Ghost Diff when opening debug pane
                setOriginalCodeSnapshot(code);
                // Also set the sessionStorage snapshot for Ghost Diff to use
                const originalNodes = parseCodeToFlow(code).nodes;
                setOriginalSnapshot(originalNodes);
                setDebugCheckpoints([]);
                setDebugSessionId(null);
              }
              setShowDebugPane(!showDebugPane);
            }}
            className={`h-7 gap-1.5 text-xs ${showDebugPane ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10'}`}
            data-testid="button-debug-with-ai"
          >
            <Bug className="w-3.5 h-3.5" />
            Debug with AI
          </Button>
          <ThemeToggle />
          
          {!licenseLoading && (
            isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1.5"
                    data-testid="button-user-menu"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-xs max-w-24 truncate">{user?.name || user?.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user?.name && (
                    <DropdownMenuItem className="text-xs font-medium" disabled>
                      {user.name}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                    Tier: {user?.tier ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1) : 'Free'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="button-logout">
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={login}
                className="h-7 gap-1.5 text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                data-testid="button-login"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Button>
            )
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHelpDialogOpen(true)}
            className="h-7 px-2"
            data-testid="button-help"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </header>
      
      {/* New 2-Panel Layout: Resizable Sidebar + Flowchart Canvas */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ResizablePanelGroup direction="horizontal" autoSaveId="logigo-workbench-panels">
          {/* Left Sidebar - Controls (Resizable) */}
          <ResizablePanel ref={sidebarPanelRef} defaultSize={30} minSize={0} maxSize={100} collapsible>
            <div className="h-full border-r border-border bg-card flex flex-col overflow-y-auto">
              
              {/* Flow Tools Section - Always Visible at Top */}
              <div className="border-b border-border p-3 space-y-2 flex-shrink-0 sticky top-0 bg-card z-10">
                <h3 className="text-xs font-semibold flex items-center gap-1.5 text-foreground/80 uppercase tracking-wide">
                  <Search className="w-3 h-3" />
                  Flow Tools
                </h3>
                
                {/* Natural Language Search - Premium Feature */}
                {features.hasFeature('naturalLanguageSearch') && (
                  <div className="mb-2">
                    <NaturalLanguageSearch
                      nodes={flowData.nodes}
                      onSearchResults={handleSearchResults}
                      onClear={handleClearSearch}
                      inputRef={searchInputRef}
                    />
                  </div>
                )}
                
                <div className="space-y-1">
                  {/* Ghost Diff Toggle */}
                  {features.hasFeature('ghostDiff') && (
                    <div className="flex gap-1">
                      <Button
                        variant={showDiff ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowDiff(!showDiff)}
                        className="flex-1 justify-start gap-2 h-7 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        data-testid="button-ghost-diff"
                      >
                        <span className="text-sm">👻</span> {showDiff ? 'Hide Diff' : 'Show Diff'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          clearOriginalSnapshot();
                          setDiffNodes([]);
                          setShowDiff(false);
                        }}
                        className="h-7 px-2 text-xs cursor-pointer hover:bg-destructive/20"
                        title="Reset diff baseline to current code"
                        data-testid="button-reset-diff"
                      >
                        ↺
                      </Button>
                    </div>
                  )}
                  
                  {/* Share */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShareDialogOpen(true)}
                    disabled={!code.trim()}
                    className="w-full justify-start gap-2 h-7 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    data-testid="button-share"
                  >
                    <span className="text-sm">🔗</span> Share Flowchart
                  </Button>
                  
                  {/* Remote Mode */}
                  <Link href="/remote">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 h-7 text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      data-testid="button-remote-mode"
                    >
                      <span className="text-sm">📡</span> Remote Mode
                    </Button>
                  </Link>
                </div>
                
                {/* Compact Layout, Views & History Row */}
                <div className="pt-2 border-t border-border/50 flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">View</span>
                  <Select value={currentLayout} onValueChange={(value) => applyLayoutPreset(value as keyof typeof layoutPresets)}>
                    <SelectTrigger className="h-7 text-sm text-foreground flex-1" data-testid="select-layout">
                      <SelectValue placeholder="Layout" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(layoutPresets) as Array<keyof typeof layoutPresets>).map((key) => (
                        <SelectItem key={key} value={key} className="text-xs" data-testid={`layout-option-${key}`}>
                          {layoutPresets[key].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant={showFloatingVariables ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowFloatingVariables(!showFloatingVariables)}
                    className="h-7 w-7 p-0"
                    title="Toggle Variables Panel"
                    data-testid="button-toggle-variables"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const popupWidth = Math.min(1920, window.screen.availWidth);
                      const popupHeight = Math.min(1080, window.screen.availHeight);
                      const encodedCode = btoa(encodeURIComponent(code));
                      window.open(
                        `/?code=${encodedCode}&popup=true`,
                        'logigo-flowchart',
                        `width=${popupWidth},height=${popupHeight},menubar=no,toolbar=no,location=no,status=no`
                      );
                    }}
                    className="h-7 w-7 p-0"
                    title="Pop Out Flowchart (Dual Screen)"
                    data-testid="button-popout"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="h-7 w-7 p-0"
                      title="Undo (Ctrl+Z)"
                      data-testid="button-undo"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="h-7 w-7 p-0"
                      title="Redo (Ctrl+Y)"
                      data-testid="button-redo"
                    >
                      <Redo2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Execution Controls Section */}
              <div className="flex-shrink-0">
                <ExecutionControls
                  isPlaying={isPlaying}
                  canStep={canExecute}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onStepForward={handleStepForward}
                  onStepBackward={handleStepBackward}
                  onReset={handleReset}
                  onStop={handleStop}
                  progress={progress}
                  speed={speed}
                  onSpeedChange={handleSpeedChange}
                  loop={loop}
                  onLoopToggle={handleLoopToggle}
                />
              </div>
              
              {/* Remote Control Section - Only when connected to remote session */}
              {remoteSessionId && (
                <div className="border-b border-border p-3 space-y-2 flex-shrink-0">
                  <h3 className="text-xs font-semibold flex items-center gap-1.5 text-foreground/80 uppercase tracking-wide">
                    <Wifi className="w-3 h-3" />
                    Remote Control
                  </h3>
                  <div className="space-y-1">
                    {/* Pause/Resume Button */}
                    {remotePausedAt ? (
                      <div className="space-y-1">
                        <div className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1.5 rounded border border-orange-500/20">
                          ⏸️ Paused at: {remotePausedAt}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleRemoteResume}
                            className="flex-1 justify-center gap-2 h-7 text-xs bg-green-600 hover:bg-green-700"
                            data-testid="button-remote-resume"
                          >
                            <Play className="w-3 h-3" />
                            Resume
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoteStep}
                            className="flex-1 justify-center gap-2 h-7 text-xs"
                            data-testid="button-remote-step"
                          >
                            <StepForward className="w-3 h-3" />
                            Step
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemotePause}
                        className="w-full justify-start gap-2 h-7 text-xs"
                        data-testid="button-remote-pause"
                      >
                        <Pause className="w-3 h-3" />
                        Pause Remote
                      </Button>
                    )}
                    
                    {/* Breakpoints Summary */}
                    {remoteBreakpoints.size > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-purple-400 flex items-center justify-between">
                          <span>Active Breakpoints: {remoteBreakpoints.size}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoteClearBreakpoints}
                            className="h-5 px-1.5 text-xs text-red-400 hover:text-red-300"
                            data-testid="button-clear-breakpoints"
                          >
                            Clear All
                          </Button>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Click nodes to set/remove breakpoints
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Compact Code & Export Row */}
              <div className="border-b border-border p-3 flex-shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".js,.ts,.jsx,.tsx,.mjs"
                  className="hidden"
                  data-testid="input-import-file"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">Code</span>
                  <Select onValueChange={handleLoadExample}>
                    <SelectTrigger className="h-7 text-sm text-foreground flex-1" data-testid="select-example">
                      <SelectValue placeholder="📚 Examples..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70">Sorting</div>
                      {algorithmExamples.filter(e => e.category === 'sorting').map(example => (
                        <SelectItem key={example.id} value={example.id} data-testid={`example-${example.id}`}>
                          {example.name}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70">Pathfinding</div>
                      {algorithmExamples.filter(e => e.category === 'pathfinding').map(example => (
                        <SelectItem key={example.id} value={example.id} data-testid={`example-${example.id}`}>
                          {example.name}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70">Games & Logic</div>
                      {algorithmExamples.filter(e => e.category === 'other').map(example => (
                        <SelectItem key={example.id} value={example.id} data-testid={`example-${example.id}`}>
                          {example.name}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70 border-t border-border mt-1 pt-2">Integration</div>
                      {algorithmExamples.filter(e => e.category === 'integration').map(example => (
                        <SelectItem key={example.id} value={example.id} data-testid={`example-${example.id}`}>
                          {example.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleImportCode}
                      className="h-7 w-7 p-0"
                      title="Import Code (Ctrl+O)"
                      data-testid="button-import-code"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportCode}
                      disabled={!code.trim()}
                      className="h-7 w-7 p-0"
                      title="Export Code (Ctrl+S)"
                      data-testid="button-export-code"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportPNG}
                      className="h-7 w-7 p-0"
                      title="Export as PNG"
                      data-testid="button-export-png"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Code Editor Section - At Bottom */}
              {showCodeEditor && !codeEditorCollapsed && (
                <div className="border-b border-border flex-1 min-h-[200px] overflow-hidden">
                  <div className="h-full">
                    <CodeEditor 
                      code={code} 
                      onChange={handleCodeChange} 
                      highlightedLine={highlightedLine}
                    />
                  </div>
                </div>
              )}
              {showCodeEditor && (
                <div className="border-b border-border flex-shrink-0">
                  <button
                    onClick={() => setCodeEditorCollapsed(!codeEditorCollapsed)}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-accent/50 transition-colors text-sm text-foreground font-medium"
                    data-testid="button-toggle-code-editor"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5" />
                      {codeEditorCollapsed ? 'Show Code' : 'Hide Code'}
                    </div>
                    {codeEditorCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right Panel - Flowchart Canvas (Maximized) */}
          <ResizablePanel ref={flowchartPanelRef} defaultSize={70} minSize={0} collapsible>
            <div className="h-full w-full overflow-hidden relative">
              {isParsing ? (
                <FlowchartSkeleton />
              ) : !code.trim() || flowData.nodes.length === 0 ? (
                <EmptyState onLoadSample={handleLoadSample} />
              ) : (
                <Flowchart 
                  nodes={showDiff && diffNodes.length > 0 ? diffNodes : flowData.nodes} 
                  edges={flowData.edges} 
                  onNodeClick={handleNodeClick}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  onBreakpointToggle={handleBreakpointToggle}
                  onAddLabel={handleAddLabel}
                  onRemoveLabel={handleRemoveLabel}
                  activeNodeId={activeNodeId}
                  highlightedNodes={highlightedNodes}
                  breakpoints={effectiveBreakpoints}
                  runtimeState={runtimeState}
                  handshakeNodeId={handshakeNodeId}
                />
              )}
              
              {/* Fullscreen Controls - Top Left of Flowchart */}
              {!isParsing && code.trim() && flowData.nodes.length > 0 && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFullscreenMode('workspace')}
                    className="h-7 gap-1.5 text-xs bg-card/95 backdrop-blur shadow-md"
                    title="Fullscreen with controls (F)"
                    data-testid="button-fullscreen-workspace"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Fullscreen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFullscreenMode('presentation')}
                    className="h-7 w-7 p-0 bg-card/95 backdrop-blur shadow-md"
                    title="Presentation mode (clean view)"
                    data-testid="button-fullscreen-presentation"
                  >
                    <Presentation className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
              
              {/* Algorithm Visualization Panel - Bottom Left */}
              {showVisualization && activeVisualizer && (
                <div className="absolute bottom-4 left-4 w-[420px] z-50">
                  <VisualizationPanel
                    type={activeVisualizer}
                    title={currentAlgorithm ? algorithmExamples.find(e => e.id === currentAlgorithm)?.name : undefined}
                    sortingState={sortingState}
                    pathfindingState={pathfindingState}
                    calculatorState={calculatorState}
                    quizState={quizState}
                    tictactoeState={tictactoeState}
                    fibonacciState={fibonacciState}
                    snakeState={snakeState}
                    onClose={handleCloseVisualization}
                    onReset={handleResetVisualization}
                    onPlay={handlePlayVisualization}
                    isPlaying={isAnimating}
                    editMode={gridEditMode}
                    onEditModeChange={setGridEditMode}
                    onCellClick={handleGridCellClick}
                    onTictactoeMove={handleTictactoeMove}
                    onQuizAnswer={handleQuizAnswer}
                    onSnakeDirectionChange={handleSnakeDirectionChange}
                    onCalculatorExpressionChange={handleCalculatorExpressionChange}
                    className="h-auto"
                  />
                </div>
              )}
              
              {/* Docked Variables Panel - Bottom Right */}
              {showFloatingVariables && (executionState || progress.total > 0) && (
                <div className="absolute bottom-4 right-4 w-80 max-h-96 bg-card/95 backdrop-blur border-2 border-border rounded-lg shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-2 border-b border-border bg-accent/50">
                    <h3 className="text-xs font-semibold">Debug Panel</h3>
                    <button
                      onClick={() => setShowFloatingVariables(false)}
                      className="hover:bg-accent rounded p-1 text-xs"
                      data-testid="button-close-variables"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {features.hasFeature('timeTravel') && progress.total > 0 ? (
                      <div className="flex flex-col">
                        <div className="flex-1 overflow-auto">
                          <VariableWatch 
                            state={executionState}
                            history={variableHistory}
                            currentStep={progress.current}
                            totalSteps={progress.total}
                            activeNodeLabel={activeNodeInfo.label}
                            activeNodeUserLabel={activeNodeInfo.userLabel}
                            onJumpToStep={handleJumpToStep}
                            hasFunctionCallsInCode={hasFunctionCalls}
                          />
                        </div>
                        <div className="border-t border-border p-2">
                          <TimelineScrubber
                            currentStep={progress.current}
                            totalSteps={progress.total}
                            onJumpToStep={handleJumpToStep}
                            bookmarks={bookmarks}
                            onAddBookmark={handleAddBookmark}
                            onRemoveBookmark={handleRemoveBookmark}
                            disabled={isPlaying}
                          />
                        </div>
                      </div>
                    ) : (
                      <VariableWatch 
                            state={executionState}
                            history={variableHistory}
                            currentStep={progress.current}
                            totalSteps={progress.total}
                            activeNodeLabel={activeNodeInfo.label}
                            activeNodeUserLabel={activeNodeInfo.userLabel}
                            onJumpToStep={handleJumpToStep}
                            hasFunctionCallsInCode={hasFunctionCalls}
                          />
                    )}
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <NodeEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        nodeLabel={editingNode?.data?.label || ''}
        currentCode={editingNode?.data?.sourceData ? extractCode(code, editingNode.data.sourceData) : ''}
        lineStart={editingNode?.data?.sourceData?.start?.line}
        lineEnd={editingNode?.data?.sourceData?.end?.line}
        onSave={handleSaveNodeEdit}
      />

      <NodeLabelDialog
        open={labelDialogOpen}
        onOpenChange={setLabelDialogOpen}
        nodeLabel={labelingNode?.label || ''}
        currentUserLabel={labelingNode?.currentUserLabel}
        onSave={handleSaveLabel}
      />

      
      {/* Help Dialog */}
      <HelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
      
      {/* Share Dialog */}
      <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} code={code} />
      
      {/* AI Debug Pane - Slides in from right */}
      {showDebugPane && (
        <div className="fixed top-10 right-0 bottom-0 w-[400px] bg-card border-l border-border z-40 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-r from-purple-900/30 to-blue-900/30">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-purple-400" />
              <h3 className="font-semibold text-sm">Debug with AI</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugPane(false)}
              className="h-6 w-6 p-0"
              data-testid="button-close-debug-pane"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Step 1: Generate Prompt */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">1</span>
                <h4 className="font-medium text-sm">Copy Debug Prompt</h4>
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                Give this to your AI agent to add debug checkpoints to your code
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prompt = `Add LogiGo.checkpoint() calls to help debug this code. Add checkpoints at:
- Function entry (capture input parameters)
- Before/after if-else branches (capture decision variables)
- Inside loops (capture iteration state)
- Before return statements (capture return value)
- In catch blocks (capture error info)

First, add this script tag to the HTML:
<script src="${window.location.origin}/remote.js?project=DebugSession&autoOpen=true"></script>

Then add checkpoint calls like:
LogiGo.checkpoint('function-start', { param1, param2 });
LogiGo.checkpoint('loop-iteration', { index: i, value });
LogiGo.checkpoint('branch-taken', { condition: x > 0 });

Current code to debug:
\`\`\`javascript
${code}
\`\`\``;
                  navigator.clipboard.writeText(prompt);
                  setDebugPromptCopied(true);
                  setTimeout(() => setDebugPromptCopied(false), 2000);
                  toast.success('Debug prompt copied to clipboard');
                }}
                className="ml-8 gap-2"
                data-testid="button-copy-debug-prompt"
              >
                {debugPromptCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {debugPromptCopied ? 'Copied!' : 'Copy Prompt'}
              </Button>
            </div>
            
            {/* Step 2: Open Visualization */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">2</span>
                <h4 className="font-medium text-sm">Open Live Visualization</h4>
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                Open the visualization page to see checkpoints as they fire
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open('/remote', '_blank');
                }}
                className="ml-8 gap-2"
                data-testid="button-open-visualization"
              >
                <Radio className="w-4 h-4" />
                Open Remote Mode
              </Button>
            </div>
            
            {/* Step 3: Ghost Diff */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">3</span>
                <h4 className="font-medium text-sm">See What Changed</h4>
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                After AI adds checkpoints, toggle Ghost Diff to see the changes
              </p>
              {originalCodeSnapshot && code !== originalCodeSnapshot ? (
                <div className="ml-8 p-2 bg-green-900/30 border border-green-700/50 rounded text-xs">
                  <p className="text-green-400 font-medium">Code has changed since opening debug pane!</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Compute diff between original snapshot and current code
                      const originalNodes = getOriginalSnapshot();
                      const currentNodes = flowData.nodes;
                      
                      if (originalNodes.length > 0) {
                        const diffResult = ghostDiffRef.current.diffTrees(originalNodes, currentNodes);
                        console.log('[Ghost Diff] AI changes:', diffResult);
                        // Apply styling to show the diff visually
                        const styledDiffNodes = ghostDiffRef.current.applyDiffStyling(diffResult.nodes);
                        setDiffNodes(styledDiffNodes);
                        setShowDiff(true);
                        toast.success('Ghost Diff enabled - showing AI changes');
                      } else {
                        toast.error('No baseline snapshot found');
                      }
                    }}
                    className="mt-2 gap-2"
                    data-testid="button-show-ghost-diff"
                  >
                    <span>👻</span> Show Ghost Diff
                  </Button>
                </div>
              ) : (
                <p className="ml-8 text-xs text-gray-500 italic">
                  Waiting for code changes...
                </p>
              )}
            </div>
            
            {/* Quick Tips */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-xs mb-2">Quick Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Checkpoints capture variable state at that moment</li>
                <li>Use descriptive IDs like 'validation-check' or 'loop-start'</li>
                <li>The flowchart builds automatically from checkpoint sequence</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Fullscreen Overlay */}
      {fullscreenMode && (
        <div className="fixed inset-0 z-50 bg-background">
          {/* Fullscreen Flowchart */}
          <div className="h-full w-full" ref={flowchartContainerRef}>
            {isParsing ? (
              <FlowchartSkeleton />
            ) : !code.trim() || flowData.nodes.length === 0 ? (
              <EmptyState onLoadSample={handleLoadSample} />
            ) : (
              <Flowchart 
                nodes={showDiff && diffNodes.length > 0 ? diffNodes : flowData.nodes} 
                edges={flowData.edges} 
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onBreakpointToggle={handleBreakpointToggle}
                onAddLabel={handleAddLabel}
                onRemoveLabel={handleRemoveLabel}
                activeNodeId={activeNodeId}
                highlightedNodes={highlightedNodes}
                breakpoints={effectiveBreakpoints}
                runtimeState={runtimeState}
                handshakeNodeId={handshakeNodeId}
              />
            )}
          </div>
          
          {/* Floating Controls - Only in Workspace Mode */}
          {fullscreenMode === 'workspace' && (
            <>
              {/* Top Controls */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFullscreenMode(null)}
                  className="h-8 gap-2 bg-card/95 backdrop-blur shadow-lg"
                  data-testid="button-exit-fullscreen"
                >
                  <Minimize2 className="w-4 h-4" />
                  Exit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setFullscreenMode('presentation')}
                  className="h-8 gap-2 bg-card/95 backdrop-blur shadow-lg"
                  data-testid="button-presentation-mode"
                >
                  <Presentation className="w-4 h-4" />
                  Presentation
                </Button>
              </div>
              
              {/* Bottom Controls - Execution */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg px-4 py-2 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPlaying ? handlePause : handlePlay}
                  disabled={!canExecute}
                  className="h-8 w-8 p-0"
                >
                  {isPlaying ? '⏸' : '▶'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStepForward}
                  disabled={!canExecute || isPlaying}
                  className="h-8 w-8 p-0"
                >
                  ⏭
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 w-8 p-0"
                >
                  ⏹
                </Button>
                <div className="w-px h-6 bg-border mx-1" />
                <span className="text-xs text-muted-foreground">
                  {progress.current}/{progress.total}
                </span>
              </div>
              
              {/* Algorithm Visualization Panel - Fullscreen */}
              {showVisualization && activeVisualizer && (
                <div className="absolute bottom-4 left-4 w-[420px] z-50">
                  <VisualizationPanel
                    type={activeVisualizer}
                    title={currentAlgorithm ? algorithmExamples.find(e => e.id === currentAlgorithm)?.name : undefined}
                    sortingState={sortingState}
                    pathfindingState={pathfindingState}
                    calculatorState={calculatorState}
                    quizState={quizState}
                    tictactoeState={tictactoeState}
                    fibonacciState={fibonacciState}
                    snakeState={snakeState}
                    onClose={handleCloseVisualization}
                    onReset={handleResetVisualization}
                    onPlay={handlePlayVisualization}
                    isPlaying={isAnimating}
                    editMode={gridEditMode}
                    onEditModeChange={setGridEditMode}
                    onCellClick={handleGridCellClick}
                    onTictactoeMove={handleTictactoeMove}
                    onQuizAnswer={handleQuizAnswer}
                    onSnakeDirectionChange={handleSnakeDirectionChange}
                    onCalculatorExpressionChange={handleCalculatorExpressionChange}
                    className="h-auto"
                  />
                </div>
              )}
            </>
          )}
          
          {/* Presentation Mode - Minimal UI */}
          {fullscreenMode === 'presentation' && (
            <div className="absolute top-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFullscreenMode('workspace')}
                className="h-8 gap-2 bg-card/80 backdrop-blur shadow-lg"
                data-testid="button-workspace-mode"
              >
                <Monitor className="w-4 h-4" />
                Show Controls
              </Button>
            </div>
          )}
          
          {/* Exit hint for presentation mode */}
          {fullscreenMode === 'presentation' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
              <span className="text-xs text-muted-foreground bg-card/80 backdrop-blur px-3 py-1.5 rounded-full">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd> to exit
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
