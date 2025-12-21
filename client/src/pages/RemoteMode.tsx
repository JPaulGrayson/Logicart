import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Copy, Check, Wifi, WifiOff, Play, RotateCcw } from 'lucide-react';

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

export default function RemoteMode() {
  const params = useParams<{ sessionId?: string }>();
  const [sessionId, setSessionId] = useState(params.sessionId || '');
  const [inputSessionId, setInputSessionId] = useState('');
  const [connected, setConnected] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [copied, setCopied] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

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

  const clearCheckpoints = () => {
    setCheckpoints([]);
    setActiveCheckpoint(null);
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
              <p className="text-gray-400">
                Enter a session ID to connect, or create a new session from your external app.
              </p>
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
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-2">
                  To create a session from your app, make this API call:
                </p>
                <pre className="bg-gray-900 p-3 rounded text-xs text-green-400 overflow-x-auto">
{`POST /api/remote/session
Content-Type: application/json

{ "name": "My App" }

Response: { "sessionId": "abc123", "connectUrl": "..." }`}
                </pre>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <div className="pt-2 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={copyIntegrationCode}
                    data-testid="copy-code-button"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Copied!' : 'Copy Integration Code'}
                  </Button>
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

            {/* Execution Trace */}
            <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Execution Trace</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {checkpoints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <p>Waiting for checkpoints...</p>
                      <p className="text-xs mt-2">Send checkpoints from your external app</p>
                    </div>
                  ) : (
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
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
