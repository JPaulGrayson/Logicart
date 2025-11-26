import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Code2, Radio, Keyboard, Info, Lightbulb } from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            LogiGo Studio Help
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="quick-start" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quick-start" className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Quick Start</span>
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              <span>Documentation</span>
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>About</span>
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 mt-4">
            {/* Quick Start Tab */}
            <TabsContent value="quick-start" className="space-y-4 pr-4">
              <div className="space-y-4">
                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                    Paste Your Code
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Copy any JavaScript function and paste it into the code editor on the left. LogiGo instantly parses your code and generates a flowchart visualization.
                  </p>
                  <div className="mt-2 p-3 bg-muted/50 rounded-md font-mono text-xs">
                    function bubbleSort(arr) {'{'}<br />
                    &nbsp;&nbsp;for (let i = 0; i {'<'} arr.length; i++) {'{'}<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;// Your logic here<br />
                    &nbsp;&nbsp;{'}'}<br />
                    {'}'}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                    Execute Step-by-Step
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use the execution controls at the bottom to run your code interactively:
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium min-w-[80px]">▶️ Play</span>
                      <span className="text-muted-foreground">Auto-execute through all steps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium min-w-[80px]">⏸️ Pause</span>
                      <span className="text-muted-foreground">Pause execution at current step</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium min-w-[80px]">⏭️ Step</span>
                      <span className="text-muted-foreground">Execute one step at a time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium min-w-[80px]">🔄 Reset</span>
                      <span className="text-muted-foreground">Reset to beginning</span>
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                    Adjust Speed
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use the speed selector to control execution speed from 0.25x (slow motion) to 20x (lightning fast). Perfect for debugging complex algorithms.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">4</span>
                    Explore the Flowchart
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The flowchart on the right shows your code's control flow. Active nodes are highlighted in real-time as execution progresses. Zoom in/out to see different levels of detail.
                  </p>
                </section>
              </div>
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="documentation" className="space-y-6 pr-4">
              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-blue-500">●</span>
                  Static Mode (Default)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  LogiGo Studio's default mode provides instant code visualization without any setup:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• Paste code → instant flowchart generation</li>
                  <li>• Built-in interpreter for step-by-step execution</li>
                  <li>• No code modification required</li>
                  <li>• Works completely offline</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-green-500">●</span>
                  Live Mode (Runtime Debugging)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Connect to running applications using logigo-core for real-time debugging:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• Install logigo-core in your application</li>
                  <li>• Add <code className="bg-muted px-1 py-0.5 rounded text-xs">LogiGo.checkpoint()</code> calls to your code</li>
                  <li>• Studio automatically detects runtime events</li>
                  <li>• See live variable values and execution flow</li>
                  <li>• Visual Handshake highlights DOM elements</li>
                </ul>
                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                  <p className="text-xs font-semibold mb-2">Example logigo-core integration:</p>
                  <pre className="text-xs font-mono">
{`import LogiGo from 'logigo-core';

function processData(items) {
  LogiGo.checkpoint('start', { 
    items: items.length 
  });
  
  for (let item of items) {
    LogiGo.checkpoint('process', { 
      item, 
      domElement: \`#item-\${item.id}\`
    });
    // Process item...
  }
}`}
                  </pre>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Hierarchical Views</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  For large codebases, LogiGo organizes your code into collapsible sections:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Mile-high view ({'<'}70% zoom):</strong> Shows only major sections</li>
                  <li>• <strong>1000ft view (70-130% zoom):</strong> Shows full flow logic</li>
                  <li>• <strong>100ft detail view ({'>'}130% zoom):</strong> Maximum detail</li>
                  <li>• Click container nodes to collapse/expand sections</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Visual Handshake</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Connect code execution to UI elements on the page:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• Include <code className="bg-muted px-1 py-0.5 rounded text-xs">domElement</code> CSS selector in checkpoints</li>
                  <li>• Studio highlights the element on the page for 1 second</li>
                  <li>• Creates visual connection between logic and UI</li>
                  <li>• Perfect for debugging UI interactions</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Premium Features</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Advanced capabilities for power users:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Ghost Diff:</strong> Visualizes code changes between versions</li>
                  <li>• <strong>Speed Governor:</strong> Extended speed controls (up to 20x)</li>
                  <li>• <strong>Time Travel:</strong> Step backward through execution</li>
                  <li>• <strong>Export:</strong> Save flowcharts as PNG or PDF</li>
                  <li>• <strong>Natural Language Search:</strong> Query flowchart nodes</li>
                </ul>
              </section>
            </TabsContent>

            {/* Keyboard Shortcuts Tab */}
            <TabsContent value="shortcuts" className="space-y-4 pr-4">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">Execution Control</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="Space" description="Play / Pause execution" />
                    <ShortcutRow shortcut="→" description="Step forward (next step)" />
                    <ShortcutRow shortcut="←" description="Step backward (Time Travel)" />
                    <ShortcutRow shortcut="R" description="Reset execution" />
                    <ShortcutRow shortcut="L" description="Toggle loop mode" />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Speed Control</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="[" description="Decrease speed" />
                    <ShortcutRow shortcut="]" description="Increase speed" />
                    <ShortcutRow shortcut="1-5" description="Set speed preset (1=0.5x, 2=1x, 3=2x, 4=5x, 5=10x)" />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">View & Navigation</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="Cmd/Ctrl + K" description="Focus Natural Language Search" />
                    <ShortcutRow shortcut="Cmd/Ctrl + /" description="Toggle code editor sidebar" />
                    <ShortcutRow shortcut="V" description="Toggle variables panel" />
                    <ShortcutRow shortcut="D" description="Toggle Ghost Diff overlay" />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Export & Share</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="Cmd/Ctrl + E" description="Export flowchart as PNG" />
                    <ShortcutRow shortcut="Cmd/Ctrl + P" description="Export flowchart as PDF" />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Testing & Debug</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="Cmd/Ctrl + T" description="Open test panel" />
                    <ShortcutRow shortcut="Cmd/Ctrl + Shift + R" description="Test Reporter API" />
                  </div>
                </section>
              </div>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-4 pr-4">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-2">LogiGo Studio</h3>
                  <p className="text-sm text-muted-foreground">
                    A bidirectional code-to-flowchart visualization tool designed for "Vibe Coders" who benefit from visual learning and debugging.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">Version</h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>LogiGo Studio:</strong> v1.0.0-beta<br />
                    <strong>Reporter API:</strong> v1.0.0-beta.2 (Compatible with logigo-core)
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">Technology Stack</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Parser:</strong> Acorn (ECMAScript 2020)</li>
                    <li>• <strong>Visualization:</strong> React Flow (@xyflow/react)</li>
                    <li>• <strong>UI Framework:</strong> React 18 + TypeScript</li>
                    <li>• <strong>Styling:</strong> Tailwind CSS v4</li>
                    <li>• <strong>Build Tool:</strong> Vite</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Zero-friction static code analysis</li>
                    <li>✓ Real-time runtime debugging (Live Mode)</li>
                    <li>✓ Step-by-step execution with Time Travel</li>
                    <li>✓ Hierarchical views for large codebases</li>
                    <li>✓ Visual Handshake (code ↔ DOM highlighting)</li>
                    <li>✓ Variable inspection and tracking</li>
                    <li>✓ Export to PNG/PDF</li>
                    <li>✓ Natural Language Search (Premium)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">Reporter API Integration</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    LogiGo Studio seamlessly integrates with logigo-core for runtime debugging:
                  </p>
                  <div className="p-3 bg-muted/50 rounded-md text-xs space-y-1">
                    <p><strong>Message Protocol:</strong> window.postMessage</p>
                    <p><strong>Event Types:</strong> LOGIGO_SESSION_START, LOGIGO_CHECKPOINT</p>
                    <p><strong>Security:</strong> Same-origin validation, 15s inactivity timeout</p>
                    <p><strong>Status:</strong> Production ready</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">Philosophy</h3>
                  <p className="text-sm text-muted-foreground italic">
                    "LogiGo Studio is the universal entry point for code visualization—zero friction, instant insights. 
                    For power users who need runtime debugging, seamlessly connect to logigo-core without losing the simplicity."
                  </p>
                </section>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutRow({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
      <span className="text-sm text-muted-foreground">{description}</span>
      <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-background border border-border rounded shadow-sm">
        {shortcut}
      </kbd>
    </div>
  );
}
