import React, { useState, useEffect, useRef } from 'react';
import { CodeEditor } from '@/components/ide/CodeEditor';
import { Flowchart } from '@/components/ide/Flowchart';
import { ExecutionControls } from '@/components/ide/ExecutionControls';
import { VariableWatch } from '@/components/ide/VariableWatch';
import { parseCodeToFlow, FlowNode } from '@/lib/parser';
import { Interpreter, ExecutionState } from '@/lib/interpreter';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Node } from '@xyflow/react';

const DEFAULT_CODE = `function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  let sub = factorial(n - 1);
  return n * sub;
}`;

export default function Workbench() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [flowData, setFlowData] = useState(parseCodeToFlow(DEFAULT_CODE));
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  const interpreterRef = useRef<Interpreter | null>(null);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFlowData(parseCodeToFlow(code));
      // Reset interpreter when code changes
      interpreterRef.current = null;
      setActiveNodeId(null);
      setExecutionState(null);
      setIsPlaying(false);
      setProgress({ current: 0, total: 0 });
    }, 500); // Debounce parsing
    return () => clearTimeout(timer);
  }, [code]);

  const initializeInterpreter = () => {
    console.log('Initializing interpreter with nodeMap:', flowData.nodeMap);
    interpreterRef.current = new Interpreter(code, flowData.nodeMap);
    const success = interpreterRef.current.prepare('factorial', [5]);
    console.log('Interpreter prepare result:', success);
    
    if (success) {
      const prog = interpreterRef.current.getProgress();
      console.log('Progress:', prog);
      setProgress(prog);
      return true;
    }
    console.error('Failed to initialize interpreter');
    return false;
  };

  const handlePlay = () => {
    console.log('Play button clicked');
    if (!interpreterRef.current) {
      const success = initializeInterpreter();
      if (!success) {
        console.error('Failed to initialize interpreter');
        return;
      }
    }
    
    setIsPlaying(true);
    console.log('Starting playback');
    
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
          }
        } else {
          // Execution completed
          handlePause();
        }
      }
    }, 800); // Step every 800ms
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  };

  const handleStepForward = () => {
    console.log('Step button clicked');
    if (!interpreterRef.current) {
      const success = initializeInterpreter();
      if (!success) return;
    }
    
    if (!interpreterRef.current) return;
    
    const step = interpreterRef.current.stepForward();
    console.log('Step result:', step);
    
    if (step) {
      setActiveNodeId(step.nodeId);
      setExecutionState(step.state);
      setProgress(interpreterRef.current.getProgress());
      
      // Find and highlight the source line
      const node = flowData.nodes.find(n => n.id === step.nodeId);
      if (node?.data.sourceData) {
        setHighlightedLine(node.data.sourceData.start.line);
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

  const handleNodeClick = (node: Node) => {
    const flowNode = node as unknown as FlowNode;
    if (flowNode.data?.sourceData) {
      console.log("Node Clicked:", flowNode.data.label, flowNode.data.sourceData);
      setHighlightedLine(flowNode.data.sourceData.start.line);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  const canStep = flowData.nodes.length > 1 && flowData.nodes[0].id !== 'error';

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
        progress={progress}
      />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={20}>
            <CodeEditor 
              code={code} 
              onChange={setCode} 
              highlightedLine={highlightedLine}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={45}>
            <Flowchart 
              nodes={flowData.nodes} 
              edges={flowData.edges} 
              onNodeClick={handleNodeClick}
              activeNodeId={activeNodeId}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={25} minSize={15}>
            <VariableWatch state={executionState} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
