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
import { Download, FileText, FlaskConical } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

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
      <header className="h-14 border-b border-border flex items-center px-6 bg-card z-10 justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-primary-foreground font-mono">
            L
          </div>
          <h1 className="font-semibold tracking-tight">LogiGo</h1>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Beta</span>
          {features.hasFeature('ghostDiff') && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-medium">
              Premium
            </span>
          )}
        </div>
        
        {/* Natural Language Search - Premium Feature */}
        {features.hasFeature('naturalLanguageSearch') && (
          <div className="flex-1 max-w-md">
            <NaturalLanguageSearch
              nodes={flowData.nodes}
              onSearchResults={handleSearchResults}
              onClear={handleClearSearch}
            />
          </div>
        )}
        
        <div className="flex items-center gap-3">
            {features.hasFeature('ghostDiff') && (
              <Button
                variant={showDiff ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDiff(!showDiff)}
                className="gap-2"
                data-testid="button-ghost-diff"
              >
                <span>👻</span> {showDiff ? 'Hide' : 'Show'} Ghost Diff
              </Button>
            )}
            
            <div className="h-6 w-px bg-border" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPNG}
              className="gap-2"
              data-testid="button-export-png"
              title="Export as PNG (Free)"
            >
              <Download className="w-4 h-4" />
              PNG
            </Button>
            
            {features.hasFeature('ghostDiff') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-2"
                data-testid="button-export-pdf"
                title="Export as PDF (Premium)"
              >
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            )}
            
            <div className="h-6 w-px bg-border" />
            
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-lg shadow-primary/20">
              Share
            </button>
        </div>
      </header>
      
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
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {showCodeEditor && (
            <>
              <ResizablePanel defaultSize={30} minSize={20}>
                <CodeEditor 
                  code={code} 
                  onChange={handleCodeChange} 
                  highlightedLine={highlightedLine}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}
          
          <ResizablePanel defaultSize={showCodeEditor ? 45 : 60}>
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
              />
            )}
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={25} minSize={15}>
            {features.hasFeature('timeTravel') && progress.total > 0 ? (
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={60}>
                  <VariableWatch state={executionState} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40} minSize={20}>
                  <div className="h-full overflow-auto p-4">
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
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <VariableWatch state={executionState} />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <NodeEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        nodeLabel={editingNode?.data?.label || ''}
        currentCode={editingNode?.data?.sourceData ? extractCode(code, editingNode.data.sourceData) : ''}
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
    </div>
  );
}
