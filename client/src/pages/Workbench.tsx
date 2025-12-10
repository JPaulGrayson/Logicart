import React, { useState, useEffect, useRef } from 'react';
import { CodeEditor } from '@/components/ide/CodeEditor';
import { Flowchart } from '@/components/ide/Flowchart';
import { FlowchartSkeleton } from '@/components/ide/FlowchartSkeleton';
import { EmptyState, SAMPLE_CODE } from '@/components/ide/EmptyState';
import { ExecutionControls } from '@/components/ide/ExecutionControls';
import { VariableWatch } from '@/components/ide/VariableWatch';
import { NodeEditDialog } from '@/components/ide/NodeEditDialog';
import { parseCodeToFlow, FlowNode } from '@/lib/parser';
import { Interpreter, ExecutionState } from '@/lib/interpreter';
import { patchCode, extractCode } from '@/lib/codePatcher';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Node } from '@xyflow/react';
import { useAdapter } from '@/contexts/AdapterContext';
import { GhostDiff, DiffNode } from '@/lib/ghostDiff';
import { features } from '@/lib/features';
import { ExecutionController } from '@/lib/executionController';
import { exportToPNG, exportToPDF } from '@/lib/flowchartExport';
import { NaturalLanguageSearch } from '@/components/ide/NaturalLanguageSearch';
import { RuntimeOverlay } from '@/components/ide/RuntimeOverlay';
import { TimelineScrubber } from '@/components/ide/TimelineScrubber';
import type { SearchResult } from '@/lib/naturalLanguageSearch';
import { Button } from '@/components/ui/button';
import { Download, FileText, FlaskConical, ChevronLeft, ChevronRight, Code2, Eye, Settings, Search, BookOpen, Share2, HelpCircle, Library, Maximize2, Minimize2, Monitor, Presentation, ZoomIn } from 'lucide-react';
import { algorithmExamples, type AlgorithmExample } from '@/lib/algorithmExamples';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { RuntimeState, CheckpointPayload } from '@shared/reporter-api';
import { isLogiGoMessage, isSessionStart, isCheckpoint } from '@shared/reporter-api';
import { HelpDialog } from '@/components/ide/HelpDialog';
import { VisualizationPanel, DEFAULT_SORTING_STATE, DEFAULT_PATHFINDING_STATE, type VisualizerType, type SortingState, type PathfindingState } from '@/components/ide/VisualizationPanel';
import { generateBubbleSortSteps, generateQuickSortSteps, generateAStarSteps, type AnimationStep } from '@/lib/visualizationAnimation';

export default function Workbench() {
  const { adapter, code, isReady } = useAdapter();
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
  const [isParsing, setIsParsing] = useState(false);
  const [parseReady, setParseReady] = useState(false);
  const [playQueued, setPlayQueued] = useState(false);
  
  // Premium features state
  const [showDiff, setShowDiff] = useState(false);
  const [diffNodes, setDiffNodes] = useState<DiffNode[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Array<{ step: number; label: string }>>([]);
  
  const interpreterRef = useRef<Interpreter | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ghostDiffRef = useRef<GhostDiff>(new GhostDiff({ debug: false }));
  const previousFlowDataRef = useRef<FlowNode[]>([]);
  const executionControllerRef = useRef<ExecutionController>(new ExecutionController({ debug: false }));
  
  // Test feature states
  const [testPanelOpen, setTestPanelOpen] = useState(false);
  
  // New UI state for sidebar layout
  const [codeEditorCollapsed, setCodeEditorCollapsed] = useState(false);
  const [showFloatingVariables, setShowFloatingVariables] = useState(true);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Help dialog state
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Fullscreen mode state: null = normal, 'workspace' = with controls, 'presentation' = clean
  const [fullscreenMode, setFullscreenMode] = useState<'workspace' | 'presentation' | null>(null);
  const flowchartContainerRef = useRef<HTMLDivElement>(null);
  
  // Runtime Mode state (logigo-core integration)
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({
    isConnected: false,
    mode: 'static',
    checkpointCount: 0
  });
  const [liveCheckpoints, setLiveCheckpoints] = useState<CheckpointPayload[]>([]);
  
  // Algorithm visualization state
  const [activeVisualizer, setActiveVisualizer] = useState<VisualizerType>(null);
  const [sortingState, setSortingState] = useState<SortingState>(DEFAULT_SORTING_STATE);
  const [pathfindingState, setPathfindingState] = useState<PathfindingState>(DEFAULT_PATHFINDING_STATE);
  const [showVisualization, setShowVisualization] = useState(false);
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<string | null>(null);
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parse code whenever it changes
  useEffect(() => {
    if (!isReady) return;
    
    // Mark parsing started - disables shortcuts immediately
    setIsParsing(true);
    setParseReady(false);
    
    const timer = setTimeout(() => {
      const newFlowData = parseCodeToFlow(code);
      
      // Compute diff if ghost-diff feature is enabled and there's previous data
      if (features.hasFeature('ghostDiff') && previousFlowDataRef.current.length > 0) {
        const diff = ghostDiffRef.current.diffTrees(previousFlowDataRef.current, newFlowData.nodes);
        const styledDiffNodes = ghostDiffRef.current.applyDiffStyling(diff.nodes);
        setDiffNodes(styledDiffNodes);
        
        if (diff.stats.added > 0 || diff.stats.removed > 0 || diff.stats.modified > 0) {
          console.log('[Ghost Diff]', diff.stats);
        }
      }
      
      // Update flow data and store for next diff
      previousFlowDataRef.current = newFlowData.nodes;
      setFlowData(newFlowData);
      
      // Reset interpreter when code changes
      interpreterRef.current = null;
      setActiveNodeId(null);
      setExecutionState(null);
      setIsPlaying(false);
      setProgress({ current: 0, total: 0 });
      setIsParsing(false);
      
      // Mark parse ready immediately after parse completes
      // Parse succeeds if we have any nodes and the first isn't an error sentinel
      const parseSucceeded = newFlowData.nodes.length > 0 && newFlowData.nodes[0]?.id !== 'error';
      setParseReady(parseSucceeded);
      
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
    
    // Sample POI data for testing route distance calculation
    const samplePois = [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.8044, longitude: -122.2712 },
      { latitude: 37.8716, longitude: -122.2727 }
    ];
    
    const success = interpreterRef.current.prepare('calculateRouteDistance', [samplePois]);
    
    if (success) {
      const prog = interpreterRef.current.getProgress();
      setProgress(prog);
      return true;
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
    
    // Auto-step through execution
    playIntervalRef.current = setInterval(() => {
      if (interpreterRef.current) {
        const step = interpreterRef.current.stepForward();
        
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
        } else {
          // Execution completed - immediately pause to clear interval
          handlePause();
          
          if (loop) {
            // Clear any pending restart
            if (restartTimeoutRef.current) {
              clearTimeout(restartTimeoutRef.current);
            }
            
            // Reset and restart after a brief delay
            // If user manually starts or toggles loop off, the timeout will be cleared
            restartTimeoutRef.current = setTimeout(() => {
              restartTimeoutRef.current = null;
              
              // Reset state
              interpreterRef.current = null;
              setActiveNodeId(null);
              setExecutionState(null);
              setHighlightedLine(null);
              setProgress({ current: 0, total: 0 });
              
              // Start playing again (this will also clear any other pending restarts)
              handlePlay();
            }, 600);
          }
        }
      }
    }, interval);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
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

  const handleReset = () => {
    handlePause();
    interpreterRef.current = null;
    setActiveNodeId(null);
    setExecutionState(null);
    setHighlightedLine(null);
    setProgress({ current: 0, total: 0 });
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

  const handleNodeClick = (node: Node) => {
    const flowNode = node as unknown as FlowNode;
    if (flowNode.data?.sourceData) {
      setHighlightedLine(flowNode.data.sourceData.start.line);
      adapter.navigateToLine(flowNode.data.sourceData.start.line);
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
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: `Error: ${err instanceof Error ? err.message : 'Failed to update code'}` 
      };
    }
  };

  const handleCodeChange = (newCode: string) => {
    // Update code via adapter
    adapter.writeFile(newCode);
  };

  const handleLoadSample = () => {
    adapter.writeFile(SAMPLE_CODE);
  };

  const handleLoadExample = (exampleId: string) => {
    const example = algorithmExamples.find(e => e.id === exampleId);
    if (example) {
      adapter.writeFile(example.code);
      setCurrentAlgorithm(exampleId);
      
      // Stop any running animation
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
      setIsAnimating(false);
      setAnimationIndex(0);
      setAnimationSteps([]);
      
      // Set up the appropriate visualizer
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
          {features.hasFeature('ghostDiff') && (
            <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-medium">
              Premium
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHelpDialogOpen(true)}
          className="h-7 px-2"
          data-testid="button-help"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
      </header>
      
      {/* New 2-Panel Layout: Resizable Sidebar + Flowchart Canvas */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar - Controls (Resizable) */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
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
                    <Button
                      variant={showDiff ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowDiff(!showDiff)}
                      className="w-full justify-start gap-2 h-7 text-xs"
                      data-testid="button-ghost-diff"
                    >
                      <span className="text-sm">👻</span> {showDiff ? 'Hide Diff' : 'Show Diff'}
                    </Button>
                  )}
                  
                  {/* Documentation */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('#', '_blank')}
                    className="w-full justify-start gap-2 h-7 text-xs"
                    data-testid="button-documentation"
                  >
                    <BookOpen className="w-3 h-3" />
                    Documentation
                  </Button>
                  
                  {/* Share */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* TODO: Implement share */}}
                    className="w-full justify-start gap-2 h-7 text-xs"
                    data-testid="button-share"
                  >
                    <Share2 className="w-3 h-3" />
                    Share
                  </Button>
                </div>
              </div>
              
              {/* Code Editor Section - Fully Collapsible */}
              {showCodeEditor && !codeEditorCollapsed && (
                <div className="border-b border-border flex-1 min-h-0 overflow-hidden">
                  <div className="h-full border-b border-border">
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
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-accent/50 transition-colors text-xs font-medium"
                    data-testid="button-toggle-code-editor"
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-3 h-3" />
                      {codeEditorCollapsed ? 'Show Code' : 'Hide Code'}
                    </div>
                    {codeEditorCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                  </button>
                </div>
              )}
              
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
              
              {/* View Controls Section */}
              <div className="border-b border-border p-3 space-y-2 flex-shrink-0">
                <h3 className="text-xs font-semibold flex items-center gap-1.5 text-foreground/80 uppercase tracking-wide">
                  <Eye className="w-3 h-3" />
                  Views
                </h3>
                <div className="space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFloatingVariables(!showFloatingVariables)}
                    className="w-full justify-start gap-2 h-7 text-xs"
                    data-testid="button-toggle-variables"
                  >
                    Variables {showFloatingVariables ? '✓' : ''}
                  </Button>
                </div>
              </div>
              
              {/* Examples Section */}
              <div className="border-b border-border p-3 space-y-2 flex-shrink-0">
                <h3 className="text-xs font-semibold flex items-center gap-1.5 text-foreground/80 uppercase tracking-wide">
                  <Library className="w-3 h-3" />
                  Examples
                </h3>
                <Select onValueChange={handleLoadExample}>
                  <SelectTrigger className="w-full h-8 text-xs" data-testid="select-example">
                    <SelectValue placeholder="Load an algorithm..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70">Sorting</div>
                    {algorithmExamples.filter(e => e.category === 'sorting').map(example => (
                      <SelectItem key={example.id} value={example.id} data-testid={`example-${example.id}`}>
                        <div className="flex flex-col items-start">
                          <span>{example.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70">Pathfinding</div>
                    {algorithmExamples.filter(e => e.category === 'pathfinding').map(example => (
                      <SelectItem key={example.id} value={example.id} data-testid={`example-${example.id}`}>
                        <div className="flex flex-col items-start">
                          <span>{example.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70">Games & Logic</div>
                    {algorithmExamples.filter(e => e.category === 'other').map(example => (
                      <SelectItem key={example.id} value={example.id} data-testid={`example-${example.id}`}>
                        <div className="flex flex-col items-start">
                          <span>{example.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-foreground/60">
                  Load sample algorithms with LogiGo checkpoints
                </p>
              </div>
              
              {/* Export Section */}
              <div className="border-b border-border p-3 space-y-2 flex-shrink-0">
                <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Export</h3>
                <div className="space-y-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPNG}
                    className="w-full justify-start gap-2 h-7 text-xs"
                    data-testid="button-export-png"
                  >
                    <Download className="w-3 h-3" />
                    PNG
                  </Button>
                  {features.hasFeature('ghostDiff') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPDF}
                      className="w-full justify-start gap-2 h-7 text-xs"
                      data-testid="button-export-pdf"
                    >
                      <FileText className="w-3 h-3" />
                      PDF
                    </Button>
                  )}
                </div>
              </div>
              
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right Panel - Flowchart Canvas (Maximized) */}
          <ResizablePanel defaultSize={80}>
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
                  activeNodeId={activeNodeId}
                  highlightedNodes={highlightedNodes}
                  runtimeState={runtimeState}
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
                <div className="absolute bottom-4 left-4 w-96 h-64 z-10">
                  <VisualizationPanel
                    type={activeVisualizer}
                    sortingState={sortingState}
                    pathfindingState={pathfindingState}
                    onClose={handleCloseVisualization}
                    onReset={handleResetVisualization}
                    onPlay={handlePlayVisualization}
                    isPlaying={isAnimating}
                    className="h-full"
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
                          <VariableWatch state={executionState} />
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
                      <VariableWatch state={executionState} />
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

      {/* Runtime Overlay - Premium Feature */}
      {features.hasFeature('overlay') && (
        <RuntimeOverlay
          isPlaying={isPlaying}
          canStep={canExecute}
          currentStep={progress.current}
          totalSteps={progress.total}
          speed={speed}
          onPlay={handlePlay}
          onPause={handlePause}
          onStep={handleStepForward}
          onStepBackward={features.hasFeature('timeTravel') ? handleStepBackward : undefined}
          onReset={handleReset}
          onStop={handleStop}
          onSpeedChange={handleSpeedChange}
        />
      )}
      
      {/* Help Dialog */}
      <HelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen} />
      
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
                activeNodeId={activeNodeId}
                highlightedNodes={highlightedNodes}
                runtimeState={runtimeState}
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
                <div className="absolute bottom-4 left-4 w-96 h-64 z-10">
                  <VisualizationPanel
                    type={activeVisualizer}
                    sortingState={sortingState}
                    pathfindingState={pathfindingState}
                    onClose={handleCloseVisualization}
                    onReset={handleResetVisualization}
                    onPlay={handlePlayVisualization}
                    isPlaying={isAnimating}
                    className="h-full"
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
