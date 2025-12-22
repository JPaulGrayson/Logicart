import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Wifi, WifiOff, Play, RotateCcw, GitBranch, List, Code2, Sparkles, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ReactFlow, Background, Controls, Node, Edge, ReactFlowProvider, useNodesState, useEdgesState, useReactFlow, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { parseCodeToFlow } from '@/lib/parser';
import DecisionNode from '@/components/ide/DecisionNode';
import ContainerNode from '@/components/ide/ContainerNode';
import LabeledNode from '@/components/ide/LabeledNode';

const nodeTypes: NodeTypes = {
  decision: DecisionNode,
  container: ContainerNode,
  default: LabeledNode,
  input: LabeledNode,
  output: LabeledNode,
};

interface Checkpoint {
  id: string;
  label?: string;
  variables: Record<string, any>;
  line?: number;
  timestamp: number;
}

interface SessionInfo {
  id: string;
  name: string;
  code?: string;
  checkpointCount: number;
}

interface FlowData {
  nodes: Node[];
  edges: Edge[];
  nodeMap?: Map<string, string>;
}

const ACTIVE_NODE_STYLE = {
  boxShadow: '0 0 0 3px #22c55e, 0 0 20px rgba(34, 197, 94, 0.4)',
  transition: 'box-shadow 0.2s ease'
};

function findNodeByLine(nodeMap: Map<string, string>, line: number): string | undefined {
  for (const [key, nodeId] of nodeMap.entries()) {
    const [lineStr] = key.split(':');
    if (parseInt(lineStr, 10) === line) {
      return nodeId;
    }
  }
  return undefined;
}

function FlowchartPanel({ code, activeLineNumber }: { code: string; activeLineNumber?: number }) {
  const [nodesState, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();
  const nodeMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    try {
      const result = parseCodeToFlow(code);
      nodeMapRef.current = result.nodeMap instanceof Map ? result.nodeMap : new Map();
      setNodes(result.nodes as Node[]);
      setEdges(result.edges as Edge[]);
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    } catch (error) {
      console.error('Parse error:', error);
    }
  }, [code, setNodes, setEdges, fitView]);

  useEffect(() => {
    const activeNodeId = activeLineNumber && nodeMapRef.current.size > 0
      ? findNodeByLine(nodeMapRef.current, activeLineNumber)
      : undefined;
    
    setNodes(nodes => nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        boxShadow: node.id === activeNodeId ? ACTIVE_NODE_STYLE.boxShadow : undefined,
        transition: ACTIVE_NODE_STYLE.transition
      }
    })));
  }, [activeLineNumber, setNodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

// Build a flowchart directly from checkpoint data - no source code needed!
function buildTraceGraph(checkpoints: Checkpoint[]): { nodes: Node[]; edges: Edge[] } {
  if (checkpoints.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Track unique checkpoint IDs and their occurrence counts
  const nodeStats = new Map<string, { count: number; lastVars: Record<string, any> }>();
  const transitions = new Map<string, number>(); // "from->to" -> count

  // Build stats from checkpoints
  let prevId: string | null = null;
  for (const cp of checkpoints) {
    const existing = nodeStats.get(cp.id);
    if (existing) {
      existing.count++;
      existing.lastVars = cp.variables;
    } else {
      nodeStats.set(cp.id, { count: 1, lastVars: cp.variables });
    }

    if (prevId && prevId !== cp.id) {
      const transKey = `${prevId}->${cp.id}`;
      transitions.set(transKey, (transitions.get(transKey) || 0) + 1);
    }
    prevId = cp.id;
  }

  // Create nodes in execution order (first occurrence)
  const seenIds = new Set<string>();
  const orderedIds: string[] = [];
  for (const cp of checkpoints) {
    if (!seenIds.has(cp.id)) {
      seenIds.add(cp.id);
      orderedIds.push(cp.id);
    }
  }

  // Layout nodes vertically
  const nodes: Node[] = orderedIds.map((id, index) => {
    const stats = nodeStats.get(id)!;
    const countBadge = stats.count > 1 ? ` (×${stats.count})` : '';
    
    return {
      id,
      type: 'default',
      position: { x: 200, y: index * 100 },
      data: { 
        label: id + countBadge,
        code: Object.keys(stats.lastVars).length > 0 
          ? Object.entries(stats.lastVars).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')
          : undefined
      },
      style: {
        background: '#1e293b',
        border: '1px solid #475569',
        borderRadius: '8px',
        padding: '10px 16px',
        color: '#e2e8f0',
        fontSize: '13px',
        fontFamily: 'system-ui, sans-serif',
        minWidth: '150px',
        textAlign: 'center' as const
      }
    };
  });

  // Create edges for transitions
  const edges: Edge[] = [];
  const addedEdges = new Set<string>();
  
  prevId = null;
  for (const cp of checkpoints) {
    if (prevId && prevId !== cp.id) {
      const edgeId = `${prevId}-${cp.id}`;
      if (!addedEdges.has(edgeId)) {
        addedEdges.add(edgeId);
        const transCount = transitions.get(`${prevId}->${cp.id}`) || 1;
        edges.push({
          id: edgeId,
          source: prevId,
          target: cp.id,
          type: 'smoothstep',
          animated: false,
          label: transCount > 1 ? `×${transCount}` : undefined,
          style: { stroke: '#6366f1', strokeWidth: 2 },
          labelStyle: { fill: '#a5b4fc', fontSize: 10 }
        });
      }
    }
    prevId = cp.id;
  }

  return { nodes, edges };
}

// Quick action prompts for the mini-chat
const QUICK_ACTIONS = [
  { label: 'Trace API Calls', prompt: 'Add LogiGo checkpoints before and after all API fetch calls in the frontend. Use descriptive IDs like api-request-start and api-response-received. Capture request URLs and response status.' },
  { label: 'Debug Form Flow', prompt: 'Add LogiGo checkpoints to trace form submission flow. Add checkpoints for form-submit-start, validation steps, and form-submit-complete. Capture form field values.' },
  { label: 'Track User Actions', prompt: 'Add LogiGo checkpoints to key user interaction handlers (button clicks, navigation). Use IDs like button-clicked, nav-changed. Capture relevant state.' },
];

function generateCheckpointPrompt(userRequest: string): string {
  return `Add LogiGo checkpoints to: ${userRequest}

IMPORTANT - Follow these rules:
1. Only add checkpoints to FRONTEND files (React components, client-side code)
2. Do NOT add checkpoints to server/backend files
3. Use the checkpoint() function that's already available from the LogiGo script
4. Use descriptive IDs in kebab-case (e.g., 'upload-start', 'api-response')
5. Capture relevant variables as the second argument

Example:
checkpoint('feature-step', { relevantVar, status });`;
}

// Mini Chat Panel for requesting checkpoint changes
function MiniChatPanel() {
  const [customRequest, setCustomRequest] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const copyPrompt = async (prompt: string, label: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(label);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCustomSubmit = () => {
    if (!customRequest.trim()) return;
    const prompt = generateCheckpointPrompt(customRequest);
    copyPrompt(prompt, 'custom');
    setCustomRequest('');
  };

  return (
    <div className="bg-gray-900 border-t border-gray-700">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-300 hover:bg-gray-800 transition-colors"
        data-testid="toggle-mini-chat"
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Request Checkpoints
        </span>
        <span className="text-gray-500">{isExpanded ? '▼' : '▲'}</span>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant="outline"
                className={`text-xs ${copiedPrompt === action.label ? 'bg-green-900 border-green-600' : 'border-gray-600 hover:border-purple-500'}`}
                onClick={() => copyPrompt(action.prompt, action.label)}
                data-testid={`quick-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                {copiedPrompt === action.label ? (
                  <><Check className="w-3 h-3 mr-1" /> Copied!</>
                ) : (
                  <><Sparkles className="w-3 h-3 mr-1" /> {action.label}</>
                )}
              </Button>
            ))}
          </div>
          
          {/* Custom Request */}
          <div className="flex gap-2">
            <Input
              placeholder="Describe what you want to trace..."
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              className="flex-1 bg-gray-800 border-gray-600 text-sm"
              data-testid="custom-request-input"
            />
            <Button
              size="sm"
              onClick={handleCustomSubmit}
              disabled={!customRequest.trim()}
              className={copiedPrompt === 'custom' ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}
              data-testid="copy-custom-prompt"
            >
              {copiedPrompt === 'custom' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            Click a quick action or type your request, then paste the prompt into Agent chat
          </p>
        </div>
      )}
    </div>
  );
}

// Trace Flowchart Panel - generates flowchart from checkpoint data
function TraceFlowchartPanel({ checkpoints, activeCheckpoint }: { checkpoints: Checkpoint[]; activeCheckpoint: Checkpoint | null }) {
  const [nodesState, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const { nodes, edges } = buildTraceGraph(checkpoints);
    setNodes(nodes);
    setEdges(edges);
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.3 }), 100);
    }
  }, [checkpoints, setNodes, setEdges, fitView]);

  // Highlight active checkpoint
  useEffect(() => {
    if (!activeCheckpoint) return;
    
    setNodes(nodes => nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        boxShadow: node.id === activeCheckpoint.id ? ACTIVE_NODE_STYLE.boxShadow : undefined,
        border: node.id === activeCheckpoint.id ? '2px solid #22c55e' : '1px solid #475569',
        transition: ACTIVE_NODE_STYLE.transition
      }
    })));
  }, [activeCheckpoint, setNodes]);

  if (checkpoints.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p>Waiting for checkpoints...</p>
          <p className="text-xs mt-2">Flowchart will appear automatically</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function RemoteMode() {
  const params = useParams<{ sessionId?: string }>();
  const [sessionId, setSessionId] = useState(params.sessionId || '');
  const [inputSessionId, setInputSessionId] = useState('');
  const [connected, setConnected] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Agent prompt for vibe coders - paste this into your app's AI agent
  const agentPrompt = `Add LogiGo checkpoint() calls to my code to track execution. The checkpoint() function is already available globally (no import needed).

Guidelines:
- Add checkpoint('step-name', { key: value }) calls at key points in the code
- Track loop iterations: checkpoint('loop-iteration', { i, total })
- Track function starts: checkpoint('function-start', { args })  
- Track results: checkpoint('result', { data })
- Track errors: checkpoint('error', { message })

Example:
for (let i = 0; i < items.length; i++) {
  checkpoint('processing-item', { i, total: items.length, item: items[i] });
  // ... existing code ...
}

Add checkpoints to the main processing logic, loops, and any async operations. Keep checkpoint names descriptive but short.`;

  const connectToSession = (sid: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setSessionId(sid);
    setCheckpoints([]);
    setActiveCheckpoint(null);
    setConnected(false);

    const eventSource = new EventSource(`/api/remote/stream/${sid}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('session_info', (e) => {
      const info = JSON.parse(e.data);
      setSessionInfo(info);
      setConnected(true);
    });

    eventSource.addEventListener('checkpoint', (e) => {
      const checkpoint = JSON.parse(e.data);
      setCheckpoints(prev => [...prev, checkpoint]);
      setActiveCheckpoint(checkpoint);
    });

    eventSource.addEventListener('code_update', (e) => {
      const { code } = JSON.parse(e.data);
      setSessionInfo(prev => prev ? { ...prev, code } : null);
    });

    eventSource.addEventListener('session_end', () => {
      setConnected(false);
      eventSource.close();
    });

    eventSource.onerror = () => {
      setConnected(false);
    };
  };

  useEffect(() => {
    if (params.sessionId) {
      connectToSession(params.sessionId);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [params.sessionId]);

  const handleConnect = () => {
    if (inputSessionId.trim()) {
      window.history.pushState({}, '', `/remote/${inputSessionId.trim()}`);
      connectToSession(inputSessionId.trim());
    }
  };

  const handleCreateSession = async () => {
    try {
      const response = await fetch('/api/remote/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'LogiGo Test Session' })
      });
      const data = await response.json();
      if (data.sessionId) {
        window.history.pushState({}, '', `/remote/${data.sessionId}`);
        connectToSession(data.sessionId);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const clearCheckpoints = () => {
    setCheckpoints([]);
    setActiveCheckpoint(null);
  };

  const handleSubmitCode = () => {
    if (codeInput.trim() && sessionInfo) {
      setSessionInfo({ ...sessionInfo, code: codeInput.trim() });
      setShowCodeDialog(false);
      setCodeInput('');
    }
  };

  const copyIntegrationCode = () => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const code = `// LogiGo Remote Integration
// Add this to your app to send checkpoints to LogiGo

const LOGIGO_URL = '${protocol}//${host}';
const SESSION_ID = '${sessionId}';

async function checkpoint(id, variables = {}) {
  await fetch(\`\${LOGIGO_URL}/api/remote/checkpoint\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      checkpoint: { id, variables }
    })
  });
}

// Usage:
// checkpoint('step-1', { myVar: 'value' });
// checkpoint('processing', { data: result });
// checkpoint('complete', { output: finalResult });`;

    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString();
  };

  const renderTraceView = () => {
    if (checkpoints.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p>Waiting for checkpoints...</p>
          <p className="text-xs mt-2">Send checkpoints from your external app</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {checkpoints.map((cp, index) => (
          <div
            key={`${cp.id}-${cp.timestamp}`}
            className={`p-3 rounded border cursor-pointer transition-colors ${
              activeCheckpoint?.timestamp === cp.timestamp
                ? 'bg-blue-900/30 border-blue-500'
                : 'bg-gray-900 border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => setActiveCheckpoint(cp)}
            data-testid={`checkpoint-${index}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  activeCheckpoint?.timestamp === cp.timestamp 
                    ? 'bg-green-500' 
                    : 'bg-gray-500'
                }`} />
                <span className="font-mono text-sm text-blue-400">{cp.id}</span>
                {cp.label && (
                  <span className="text-xs text-gray-400">- {cp.label}</span>
                )}
                {cp.line && (
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    Line {cp.line}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatTimestamp(cp.timestamp)}
              </span>
            </div>
            {Object.keys(cp.variables).length > 0 && (
              <div className="mt-2 pl-4 border-l-2 border-gray-700">
                {Object.entries(cp.variables).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-purple-400">{key}</span>
                    <span className="text-gray-500">: </span>
                    <span className="text-gray-300">
                      {typeof value === 'object' 
                        ? JSON.stringify(value) 
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6" data-testid="remote-mode-page">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">LogiGo Remote Mode</h1>
            <p className="text-gray-400 text-sm">Connect to external apps and view execution in real-time</p>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <Badge variant="outline" className="border-green-500 text-green-500">
                <Wifi className="w-3 h-3 mr-1" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-500 text-gray-500">
                <WifiOff className="w-3 h-3 mr-1" /> Disconnected
              </Badge>
            )}
          </div>
        </div>

        {!sessionId ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Connect to a Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* One-Line Integration - Primary Method */}
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <span>✨</span> Easiest Method: One-Line Script
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  Add this single line to your external app's HTML and it will automatically connect:
                </p>
                <div className="bg-gray-900 rounded p-3 flex items-center justify-between gap-2">
                  <code className="text-green-400 text-sm overflow-x-auto flex-1">
                    {`<script src="${window.location.origin}/remote.js?project=MyApp"></script>`}
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(`<script src="${window.location.origin}/remote.js?project=MyApp"></script>`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="shrink-0"
                    data-testid="copy-script-button"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  A notification will appear with a link to view your flowchart.
                </p>
              </div>

              {/* Step 2: Agent Prompt for adding checkpoints */}
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  <span>🤖</span> Step 2: Ask Your AI Agent to Add Checkpoints
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  Copy this prompt and paste it into your app's AI agent (like Replit Agent). It will automatically add checkpoint() calls to your code:
                </p>
                <div className="bg-gray-900 rounded p-3 space-y-2">
                  <pre className="text-blue-300 text-xs overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {agentPrompt}
                  </pre>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(agentPrompt);
                      setPromptCopied(true);
                      setTimeout(() => setPromptCopied(false), 2000);
                    }}
                    className="w-full"
                    data-testid="copy-agent-prompt-button"
                  >
                    {promptCopied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Agent Prompt</>}
                  </Button>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  No coding required - just paste and let your AI agent do the work!
                </p>
              </div>

              {/* Manual Connection */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Or connect to an existing session:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter session ID..."
                    value={inputSessionId}
                    onChange={(e) => setInputSessionId(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    data-testid="session-id-input"
                  />
                  <Button onClick={handleConnect} data-testid="connect-button">
                    <Play className="w-4 h-4 mr-2" /> Connect
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-3">
                  Or create a session to view here first:
                </p>
                <Button 
                  onClick={handleCreateSession} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  data-testid="create-session-button"
                >
                  <Wifi className="w-4 h-4 mr-2" /> Create Session
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Session Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Session ID</p>
                  <p className="text-sm font-mono text-gray-300 truncate">{sessionId}</p>
                </div>
                {sessionInfo && (
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm text-gray-300">{sessionInfo.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Checkpoints</p>
                  <p className="text-sm text-gray-300">{checkpoints.length}</p>
                </div>
                {sessionInfo?.code && (
                  <div>
                    <p className="text-xs text-gray-500">Mode</p>
                    <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                      <GitBranch className="w-3 h-3 mr-1" /> Flowchart
                    </Badge>
                  </div>
                )}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={clearCheckpoints}
                    data-testid="clear-button"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Clear Trace
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main View - Always show Trace Flowchart */}
            <Card className="bg-gray-800 border-gray-700 lg:col-span-3 overflow-hidden">
              <Tabs defaultValue="flowchart" className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">Execution Flow</CardTitle>
                    <TabsList className="bg-gray-900">
                      <TabsTrigger value="flowchart" className="text-xs" data-testid="tab-flowchart">
                        <GitBranch className="w-3 h-3 mr-1" /> Flowchart
                      </TabsTrigger>
                      <TabsTrigger value="trace" className="text-xs" data-testid="tab-trace">
                        <List className="w-3 h-3 mr-1" /> Trace
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <TabsContent value="flowchart" className="h-[350px] m-0">
                    <ReactFlowProvider>
                      <TraceFlowchartPanel 
                        checkpoints={checkpoints}
                        activeCheckpoint={activeCheckpoint}
                      />
                    </ReactFlowProvider>
                  </TabsContent>
                  <TabsContent value="trace" className="m-0 px-4 pb-4">
                    <ScrollArea className="h-[300px]">
                      {renderTraceView()}
                    </ScrollArea>
                  </TabsContent>
                </CardContent>
              </Tabs>
              
              {/* Mini Chat for requesting checkpoints */}
              <MiniChatPanel />
            </Card>
          </div>
        )}
      </div>

      {/* Paste Code Dialog */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Code for Flowchart</DialogTitle>
            <DialogDescription>
              Paste the JavaScript function you want to visualize. The flowchart will show the control flow 
              and highlight nodes as checkpoints fire.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={`// Paste your JavaScript code here
function handleUpload(file) {
  checkpoint('upload-start', { fileName: file.name });
  // ... your code ...
  checkpoint('upload-complete', { success: true });
}`}
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            data-testid="code-input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCode} disabled={!codeInput.trim()}>
              <GitBranch className="w-4 h-4 mr-2" /> Create Flowchart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
