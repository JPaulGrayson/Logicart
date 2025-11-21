import React, { useState, useEffect } from 'react';
import { CodeEditor } from '@/components/ide/CodeEditor';
import { Flowchart } from '@/components/ide/Flowchart';
import { parseCodeToFlow } from '@/lib/parser';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setFlowData(parseCodeToFlow(code));
    }, 500); // Debounce parsing
    return () => clearTimeout(timer);
  }, [code]);

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
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={40} minSize={20}>
            <CodeEditor code={code} onChange={setCode} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={60}>
            <Flowchart nodes={flowData.nodes} edges={flowData.edges} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
