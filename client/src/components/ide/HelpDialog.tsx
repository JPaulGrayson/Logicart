import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
          <DialogDescription>
            Quick start guide, documentation, keyboard shortcuts, and information about LogiGo Studio
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="quick-start" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quick-start" className="flex items-center gap-1.5" data-testid="tab-quick-start">
              <Zap className="w-3.5 h-3.5" />
              <span>Quick Start</span>
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center gap-1.5" data-testid="tab-documentation">
              <Code2 className="w-3.5 h-3.5" />
              <span>Documentation</span>
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center gap-1.5" data-testid="tab-shortcuts">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Shortcuts</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-1.5" data-testid="tab-about">
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
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-sm">👻</span>
                  Ghost Diff (Premium)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Visualize code changes directly on the flowchart. When you edit your code, Ghost Diff compares the previous version with your current version and highlights the differences:
                </p>
                <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-2">
                  <p className="text-xs font-semibold">Color Coding:</p>
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-green-500"></span>
                      <span className="text-muted-foreground"><strong>Green:</strong> New nodes (code you just added)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-red-500 opacity-50"></span>
                      <span className="text-muted-foreground"><strong>Red/Ghost:</strong> Deleted nodes (code that was removed)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-yellow-500"></span>
                      <span className="text-muted-foreground"><strong>Yellow:</strong> Modified nodes (code that changed)</span>
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Toggle with the "Show Diff" button in Flow Tools, or press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">D</kbd> on your keyboard.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Breakpoints
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Pause execution at specific points in your code to inspect the program state:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Set a breakpoint:</strong> Right-click on any flowchart node (no menu appears - the breakpoint toggles immediately)</li>
                  <li>• <strong>Visual indicator:</strong> Once set, a red dot appears on the left side of the node</li>
                  <li>• <strong>Execution pauses:</strong> When playback reaches a breakpoint, it automatically pauses</li>
                  <li>• <strong>Inspect state:</strong> Check the Variables panel to see current values</li>
                  <li>• <strong>Continue:</strong> Press Play to resume until the next breakpoint, or right-click again to remove it</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Breakpoints are cleared when you modify the code, as the flowchart structure may change.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-purple-500">~</span>
                  Variable History Timeline
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Track how variables change throughout execution with a visual timeline:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Access:</strong> Click the "History" tab in the Variables panel</li>
                  <li>• <strong>Value chips:</strong> Each variable shows clickable chips for each recorded value</li>
                  <li>• <strong>Step navigation:</strong> Click any value chip to jump to that execution step</li>
                  <li>• <strong>Bar charts:</strong> For numeric variables with multiple values, a mini bar chart appears below</li>
                  <li>• <strong>Trend indicators:</strong> Numeric variables show up/down arrows when values change</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  History is reset when you modify the code or click Reset.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-blue-400">🔗</span>
                  Shareable URLs
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Share your flowchart with others using a single link:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Generate link:</strong> Click "Share Flowchart" in Flow Tools</li>
                  <li>• <strong>Clipboard copy:</strong> The link is copied to your clipboard (you'll see a confirmation)</li>
                  <li>• <strong>How it works:</strong> Your code is encoded (base64) and embedded in the URL</li>
                  <li>• <strong>Recipient view:</strong> Anyone with the link sees the exact same flowchart</li>
                  <li>• <strong>No account needed:</strong> Sharing works without sign-up or login</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Very long code may create long URLs. Some platforms truncate long URLs.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-orange-400">📚</span>
                  Algorithm Examples
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Pre-loaded algorithm samples to help you learn and explore LogiGo's features:
                </p>
                <div className="space-y-3 text-sm text-muted-foreground ml-4">
                  <div>
                    <p className="font-medium text-foreground mb-1">Sorting Algorithms</p>
                    <ul className="space-y-1">
                      <li>• <strong>Quick Sort:</strong> Divide-and-conquer sorting with partition visualization</li>
                      <li>• <strong>Bubble Sort:</strong> Simple comparison-based sorting for beginners</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Pathfinding</p>
                    <ul className="space-y-1">
                      <li>• <strong>A* Pathfinder:</strong> Optimal pathfinding with heuristic-based graph traversal</li>
                      <li>• <strong>Maze Solver:</strong> Recursive backtracking to find a path through a maze</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Games (Interactive)</p>
                    <ul className="space-y-1">
                      <li>• <strong>TicTacToe AI:</strong> Play against an unbeatable minimax AI opponent</li>
                      <li>• <strong>Snake Game:</strong> Classic snake game - use Arrow keys or WASD to play</li>
                      <li>• <strong>Quiz Game:</strong> Interactive trivia quiz with score tracking</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Math & Recursion</p>
                    <ul className="space-y-1">
                      <li>• <strong>Fibonacci Memoized:</strong> Optimized recursive calculation with memoization</li>
                      <li>• <strong>Calculator:</strong> Enter custom expressions like "25*4" to compute</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Access examples from the "Examples" dropdown in the sidebar.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-purple-400">🎛️</span>
                  Execution Controls vs Runtime Controls
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  LogiGo has two types of playback controls that serve different purposes:
                </p>
                
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-semibold mb-2">Execution Controls (Sidebar)</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Located in the left sidebar, these step through your code line-by-line with flowchart highlighting:
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• <strong>Play/Pause:</strong> Auto-step through code</li>
                      <li>• <strong>Step Forward:</strong> Move one step forward</li>
                      <li>• <strong>Step Back:</strong> Move one step backward <span className="text-purple-400">(Premium: Time Travel)</span></li>
                      <li>• <strong>Reset/Stop:</strong> Return to beginning or end execution</li>
                      <li>• <strong>Loop:</strong> Toggle continuous replay</li>
                      <li>• <strong>Speed:</strong> 0.5x, 1x, 2x (Premium: up to 20x)</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-md border border-purple-500/30">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      Runtime Controls (Floating Overlay - Premium)
                      <span className="text-[10px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded">PREMIUM</span>
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      A floating purple panel at the bottom center that stays visible even when scrolling:
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• <strong>Same controls:</strong> Play, Step Back, Step Forward, Reset, Stop</li>
                      <li>• <strong>Extended speeds:</strong> 0.25x, 0.5x, 1x, 2x, 3x, 5x, 10x, 20x⚡</li>
                      <li>• <strong>Always visible:</strong> Floats above the canvas for quick access</li>
                    </ul>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Key difference:</strong> Execution Controls are for debugging code logic step-by-step. 
                  Runtime Controls provide persistent access with premium speed options for power users.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Other Premium Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Speed Governor:</strong> Extended speed controls from 0.25x to 20x</li>
                  <li>• <strong>Time Travel:</strong> Step backward through execution history</li>
                  <li>• <strong>Export:</strong> Save flowcharts as PNG or PDF images</li>
                  <li>• <strong>Natural Language Search:</strong> Search flowchart nodes using plain English queries</li>
                </ul>
              </section>
            </TabsContent>

            {/* Keyboard Shortcuts Tab */}
            <TabsContent value="shortcuts" className="space-y-4 pr-4">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">Execution Control</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="Space or K" description="Play / Pause execution" />
                    <ShortcutRow shortcut="S or →" description="Step forward (next step)" />
                    <ShortcutRow shortcut="B or ←" description="Step backward (Time Travel)" />
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
                    <ShortcutRow shortcut="F" description="Toggle fullscreen (Workspace mode)" />
                    <ShortcutRow shortcut="Escape" description="Exit fullscreen" />
                    <ShortcutRow shortcut="V" description="Toggle variables panel" />
                    <ShortcutRow shortcut="D" description="Toggle Ghost Diff overlay" />
                    <ShortcutRow shortcut="Cmd/Ctrl + K" description="Focus Natural Language Search" />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">File Operations</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="Cmd/Ctrl + O" description="Import code from file" />
                    <ShortcutRow shortcut="Cmd/Ctrl + S" description="Export code to file" />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Export & Share</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="Cmd/Ctrl + E" description="Export flowchart as PNG" />
                    <ShortcutRow shortcut="Cmd/Ctrl + P" description="Export flowchart as PDF" />
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
                    <p><strong>Message Protocol:</strong> window.postMessage (same-origin)</p>
                    <p><strong>Message Envelope:</strong> {`{ source: 'LOGIGO_CORE', type: string, payload: any }`}</p>
                    <p><strong>Event Types:</strong> LOGIGO_SESSION_START, LOGIGO_CHECKPOINT</p>
                    <p><strong>Security:</strong> Origin validation, source verification, 15s inactivity timeout</p>
                    <p><strong>Status:</strong> v1.0.0-beta.2 (Final Draft)</p>
                    <p className="text-muted-foreground italic mt-2">Future: Handshake protocol for bidirectional control</p>
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
