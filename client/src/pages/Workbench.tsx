import React, { useState, useEffect, useRef } from 'react';
import { CodeEditor } from '@/components/ide/CodeEditor';
import { Flowchart } from '@/components/ide/Flowchart';
import { ExecutionControls } from '@/components/ide/ExecutionControls';
import { VariableWatch } from '@/components/ide/VariableWatch';
import { NodeEditDialog } from '@/components/ide/NodeEditDialog';
import { parseCodeToFlow, FlowNode } from '@/lib/parser';
import { Interpreter, ExecutionState } from '@/lib/interpreter';
import { patchCode, extractCode } from '@/lib/codePatcher';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Node } from '@xyflow/react';
import { useAdapter } from '@/contexts/AdapterContext';

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
  
  const interpreterRef = useRef<Interpreter | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse code whenever it changes
  useEffect(() => {
    if (!isReady) return;
    
    setIsParsing(true);
    
    const timer = setTimeout(() => {
      setFlowData(parseCodeToFlow(code));
      // Reset interpreter when code changes
      interpreterRef.current = null;
      setActiveNodeId(null);
      setExecutionState(null);
      setIsPlaying(false);
      setProgress({ current: 0, total: 0 });
      setIsParsing(false);
    }, 500); // Debounce parsing
    
    return () => {
      clearTimeout(timer);
      setIsParsing(false);
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
    // Clear any pending restart to avoid interrupting manual playback
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (!interpreterRef.current) {
      const success = initializeInterpreter();
      if (!success) return;
    }
    
    setIsPlaying(true);
    
    // Calculate interval based on speed (base is 800ms)
    const baseInterval = 800;
    const interval = baseInterval / speed;
    
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

  const canStep = flowData.nodes.length > 1 && flowData.nodes[0].id !== 'error';
  const showCodeEditor = !adapter.hasIntegratedEditor();

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
      <header className="h-14 border-b border-border flex items-center px-6 bg-card z-10 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-primary-foreground font-mono">
            C
          </div>
          <h1 className="font-semibold tracking-tight">Cartographer</h1>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Beta</span>
        </div>
        <div className="flex items-center gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-lg shadow-primary/20">
              Share
            </button>
        </div>
      </header>
      
      <ExecutionControls
        isPlaying={isPlaying}
        canStep={canStep}
        onPlay={handlePlay}
        onPause={handlePause}
        onStepForward={handleStepForward}
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
            <Flowchart 
              nodes={flowData.nodes} 
              edges={flowData.edges} 
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              activeNodeId={activeNodeId}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={25} minSize={15}>
            <VariableWatch state={executionState} />
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
    </div>
  );
}
