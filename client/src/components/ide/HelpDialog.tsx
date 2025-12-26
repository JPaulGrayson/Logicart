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
                    Use the execution controls in the sidebar to run your code interactively:
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
                    Use the speed selector in the sidebar to control execution speed from 0.25x (slow motion) to 20x (lightning fast). Perfect for debugging complex algorithms or quickly scanning familiar code.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">4</span>
                    Explore the Flowchart
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The flowchart shows your code's control flow. Active nodes are highlighted in real-time as execution progresses. Use scroll/pinch to zoom, and drag to pan around large flowcharts.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-sm font-bold">💡</span>
                    Pro Tip: Add Labels
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Make your flowcharts more readable by adding human-friendly labels:
                  </p>
                  <div className="p-3 bg-muted/50 rounded-md font-mono text-xs">
                    {'// @logigo: Initialize counter'}<br />
                    let i = 0;<br /><br />
                    {'// @logigo: Check if done'}<br />
                    while (i {'<'} 10) {'{ ... }'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Nodes with labels show a blue dot. Hover to see the original code.
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
                  <span className="text-purple-500">🤖</span>
                  Remote Mode - For Vibe Coders (Easiest!)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Connect any external app to LogiGo. Just copy this prompt into your AI agent:
                </p>
                <div className="p-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-md border border-purple-500/30 font-mono text-xs whitespace-pre-wrap max-h-80 overflow-y-auto">
{`Add LogiGo visualization to this project so I can see a flowchart of my code execution.

1. Add this script tag to the HTML head (before any other scripts):
   <script src="https://logigo-studio.replit.app/remote.js?project=MyApp&autoOpen=true"></script>

2. In my JavaScript code, add checkpoint() calls at important points:
   checkpoint('step-name', { variableName: value });

Example:
function addTodo(text) {
  checkpoint('addTodo-start', { text });
  const todo = { id: Date.now(), text, completed: false };
  checkpoint('todo-created', { todo });
  todos.push(todo);
  checkpoint('addTodo-end', { count: todos.length });
  return todo;
}

The flowchart will show each checkpoint as a step, highlighting in real-time as my code runs.`}
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    <strong>What happens:</strong> When remote.js loads, it creates a session with LogiGo Studio automatically. 
                    The <code className="bg-muted px-1 py-0.5 rounded">checkpoint()</code> function becomes globally available - no imports needed.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Full documentation:</strong> See <code className="bg-muted px-1 py-0.5 rounded">docs/INTEGRATION_PROMPT.md</code> for 
                    copy-paste prompts and <code className="bg-muted px-1 py-0.5 rounded">docs/INTEGRATION_GUIDE.md</code> for API reference.
                  </p>
                </div>
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
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-cyan-500">📋</span>
                  Integration Options
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose your integration approach:
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-semibold mb-1">Option 1: Remote Mode (Recommended)</p>
                    <p className="text-xs text-muted-foreground">
                      Add a single script tag + checkpoint() calls. Works with any AI agent on any platform 
                      (Replit, VS Code, Cursor, Windsurf, etc). No npm install required.
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-semibold mb-1">Option 2: Vite/React Apps</p>
                    <p className="text-xs text-muted-foreground">
                      Use <code className="bg-muted px-1 py-0.5 rounded">LogiGo.registerCode()</code> to send 
                      source code for full flowchart generation. Works with development builds only.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  See <code className="bg-muted px-1 py-0.5 rounded text-xs">docs/INTEGRATION_GUIDE.md</code> for 
                  detailed API reference and troubleshooting.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  User-Defined Labels
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Add human-readable labels to your code that appear directly in the flowchart instead of code snippets:
                </p>
                <div className="mt-2 p-3 bg-muted/50 rounded-md">
                  <p className="text-xs font-semibold mb-2">Syntax:</p>
                  <pre className="text-xs font-mono">
{`// @logigo: Initialize counter
let i = 0;

// @logigo: Check loop condition
while (i < 10) {
  // @logigo: Increment counter
  i++;
}`}
                  </pre>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4 mt-3">
                  <li>• <strong>Blue dot indicator:</strong> Nodes with user labels show a blue dot in the top-right corner</li>
                  <li>• <strong>Hover for code:</strong> Hover over labeled nodes to see the original code in a tooltip</li>
                  <li>• <strong>Debug Panel:</strong> Step indicator shows user labels when stepping through execution</li>
                  <li>• <strong>Works everywhere:</strong> Labels work in both Static Mode and Live Mode</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-yellow-500">✏️</span>
                  Bidirectional Editing
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Edit code directly from the flowchart - changes sync back to your source:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Double-click any node:</strong> Opens an inline editor for that code block</li>
                  <li>• <strong>Edit and save:</strong> Your changes update the source code in the editor</li>
                  <li>• <strong>Flowchart updates:</strong> The flowchart regenerates to reflect your changes</li>
                  <li>• <strong>Two-way sync:</strong> Edit in code or flowchart - both stay in sync</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-gradient bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text">🤖</span>
                  Model Arena (4-AI Comparison)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Compare code generation from 4 different AI models side-by-side:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>4 AI Models:</strong> OpenAI GPT-4o, Gemini 3 Flash, Claude Opus 4.5, Grok 4</li>
                  <li>• <strong>Side-by-side view:</strong> See code and flowcharts from all models at once</li>
                  <li>• <strong>Chairman Verdict:</strong> AI synthesizes all responses into one recommendation</li>
                  <li>• <strong>Session History:</strong> Save and review past arena sessions</li>
                  <li>• <strong>Code Similarity:</strong> See how similar the generated solutions are</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Access via the "Model Arena" link in the header navigation.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-red-500">🔧</span>
                  Debug Arena
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get debugging advice from 4 AI models simultaneously:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Describe your problem:</strong> Explain the bug you're encountering</li>
                  <li>• <strong>Paste error logs:</strong> Include stack traces and error messages</li>
                  <li>• <strong>Add code snippets:</strong> Share the relevant code</li>
                  <li>• <strong>Compare solutions:</strong> See different debugging approaches from each AI</li>
                  <li>• <strong>Chairman synthesis:</strong> Get a unified debugging recommendation</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Toggle between "Code" and "Debug" modes in the Model Arena.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-amber-500">🔑</span>
                  BYOK (Bring Your Own Key)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Use your own API keys for AI features in Model Arena:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Settings button:</strong> Click the gear icon in Model Arena header</li>
                  <li>• <strong>Add your keys:</strong> Enter API keys for OpenAI, Gemini, Anthropic, or xAI</li>
                  <li>• <strong>Local storage:</strong> Keys are stored securely in your browser only</li>
                  <li>• <strong>Per-request:</strong> Keys are sent via headers, never stored on server</li>
                  <li>• <strong>Optional:</strong> LogiGo works without your keys using shared quota</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-blue-500">💻</span>
                  VS Code Extension
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Visualize code directly in VS Code with the LogiGo extension:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Command palette:</strong> "LogiGo: Visualize Current File"</li>
                  <li>• <strong>Auto-refresh:</strong> Flowchart updates as you type</li>
                  <li>• <strong>Jump to line:</strong> Click flowchart nodes to navigate to source</li>
                  <li>• <strong>Bidirectional:</strong> Edit code from the flowchart panel</li>
                  <li>• <strong>LM Context:</strong> Provides flowchart context to GitHub Copilot</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Install from the <code className="bg-muted px-1 py-0.5 rounded text-xs">vscode-extension/</code> folder (.vsix file).
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-cyan-500">🔍</span>
                  View Levels
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  LogiGo displays a view level indicator based on your current zoom level:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Mile-High ({'<'}40% zoom):</strong> Overview of your entire codebase structure</li>
                  <li>• <strong>1000ft (40-100% zoom):</strong> Normal viewing with full flow logic visible</li>
                  <li>• <strong>100ft ({'>'}100% zoom):</strong> Detailed view for examining specific nodes</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  The current view level is shown in the flowchart header (e.g., "View: 1000ft (50%)").
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-purple-500">📦</span>
                  Collapsible Containers
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Organize large flowcharts with collapsible section containers:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Create sections:</strong> Use <code className="bg-muted px-1 py-0.5 rounded text-xs">// --- SECTION NAME ---</code> comments</li>
                  <li>• <strong>Click to toggle:</strong> Click container nodes to expand or collapse</li>
                  <li>• <strong>Visual indicators:</strong> Chevron icons show collapse state, badge shows child count</li>
                  <li>• <strong>Hide children:</strong> Collapsed containers hide all child nodes</li>
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
                  Share your flowchart with others using database-backed short links:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Create share:</strong> Click "Share Flowchart" to open the share dialog</li>
                  <li>• <strong>Add metadata:</strong> Give your share a title and optional description</li>
                  <li>• <strong>Short URLs:</strong> Links are short and clean (e.g., /s/abc12345)</li>
                  <li>• <strong>View tracking:</strong> See how many times your share has been viewed</li>
                  <li>• <strong>No account needed:</strong> Sharing works without sign-up or login</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Shares are stored in the database with persistent short IDs.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-green-400">📐</span>
                  Layout Presets (New in V1)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Quickly switch between different workspace layouts:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>50/50:</strong> Equal split between code editor and flowchart</li>
                  <li>• <strong>30/70:</strong> More space for flowchart visualization</li>
                  <li>• <strong>70/30:</strong> More space for code editing</li>
                  <li>• <strong>Code Only:</strong> Maximize code editor, minimize flowchart</li>
                  <li>• <strong>Flow Only:</strong> Maximize flowchart, minimize code editor</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Find the preset buttons in the sidebar under "Layout". Your preference is saved.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-cyan-400">🔍</span>
                  Zoom Presets (New in V1)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Jump to standard zoom levels with one click:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>25%:</strong> Maximum zoom out for overview of large flowcharts</li>
                  <li>• <strong>50%:</strong> Mid-range view for navigating structure</li>
                  <li>• <strong>100%:</strong> Full size for reading node details</li>
                  <li>• <strong>Fit:</strong> Auto-fit the entire flowchart to the viewport</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Find the zoom buttons in the flowchart toolbar.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-yellow-400">↩️</span>
                  Undo/Redo History (New in V1)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Easily undo and redo code changes:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Undo:</strong> Press Ctrl+Z (Cmd+Z on Mac) to undo last change</li>
                  <li>• <strong>Redo:</strong> Press Ctrl+Y (Cmd+Y on Mac) to redo undone change</li>
                  <li>• <strong>Smart saving:</strong> Changes are recorded after 1 second of inactivity</li>
                  <li>• <strong>Toolbar buttons:</strong> Click Undo/Redo in the sidebar History section</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  History is preserved during your session. Reset when you reload the page.
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
                  Execution Controls
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  All playback controls are located in the sidebar for a clean, focused interface:
                </p>
                
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-semibold mb-2">Sidebar Controls</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Step through your code line-by-line with flowchart highlighting:
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• <strong>Play/Pause:</strong> Auto-step through code</li>
                    <li>• <strong>Step Forward/Back:</strong> Move one step at a time</li>
                    <li>• <strong>Reset/Stop:</strong> Return to beginning or end execution</li>
                    <li>• <strong>Loop:</strong> Toggle continuous replay</li>
                    <li>• <strong>Speed:</strong> Full range from 0.25x (slow-mo) to 20x (lightning fast)</li>
                  </ul>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Tip:</strong> Use slow speeds (0.25x-0.5x) to carefully observe complex logic, 
                  and fast speeds (10x-20x) to quickly scan through familiar code.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">Premium Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Time Travel:</strong> Step backward through execution history</li>
                  <li>• <strong>Export:</strong> Save flowcharts as PNG or PDF images</li>
                  <li>• <strong>Natural Language Search:</strong> Search flowchart nodes using plain English queries</li>
                  <li>• <strong>Ghost Diff:</strong> Visualize code changes with color-coded overlays</li>
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
                  <h3 className="text-lg font-semibold mb-3">History (New in V1)</h3>
                  <div className="space-y-2">
                    <ShortcutRow shortcut="Ctrl/Cmd + Z" description="Undo last code change" />
                    <ShortcutRow shortcut="Ctrl/Cmd + Y" description="Redo undone change" />
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
                    <li>✓ View Levels (Mile-High, 1000ft, 100ft zoom indicators)</li>
                    <li>✓ Collapsible Containers (organize large flowcharts)</li>
                    <li>✓ User Labels (@logigo: annotations with blue dot)</li>
                    <li>✓ Bidirectional editing (code ↔ flowchart sync)</li>
                    <li>✓ Visual Handshake (code ↔ DOM highlighting)</li>
                    <li>✓ Variable inspection and tracking</li>
                    <li>✓ Export to PNG/PDF</li>
                    <li>✓ Natural Language Search (Premium)</li>
                    <li>✓ Model Arena (4-AI comparison)</li>
                    <li>✓ Debug Arena (AI debugging advice)</li>
                    <li>✓ BYOK (Bring Your Own API Keys)</li>
                    <li>✓ VS Code Extension</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-2">New in V1</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Layout Presets (50/50, 30/70, 70/30, Code Only, Flow Only)</li>
                    <li>✓ Zoom Presets (25%, 50%, 100%, Fit)</li>
                    <li>✓ Undo/Redo History (Ctrl+Z, Ctrl+Y)</li>
                    <li>✓ Enhanced Sharing (database-backed short URLs with metadata)</li>
                    <li>✓ Arena Example Selector (6 pre-built coding prompts)</li>
                    <li>✓ Agent API (programmatic code analysis endpoint)</li>
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
