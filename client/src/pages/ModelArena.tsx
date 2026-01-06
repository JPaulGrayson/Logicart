import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Play, RotateCcw, ArrowLeft, Code2, GitBranch, FileCode, Bug, Sparkles, Crown, Gavel, Save, History, Trash2, Lock } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import MiniFlowchart from "@/components/arena/MiniFlowchart";
import { ComplexityScoreBadge, calculateComplexityFromArenaFlow } from "@/components/ui/complexity-badge";
import SettingsModal, { getStoredAPIKeys } from "@/components/arena/SettingsModal";
import { useLicense } from "@/hooks/useLicense";
import type { ArenaSession } from "@shared/schema";

type ChairmanModel = "openai" | "gemini" | "anthropic" | "xai";

const CHAIRMAN_STORAGE_KEY = "logicart_arena_chairman";
const OLD_CHAIRMAN_STORAGE_KEY = "logigo_arena_chairman";

function migrateChairmanStorage() {
  const oldValue = localStorage.getItem(OLD_CHAIRMAN_STORAGE_KEY);
  if (oldValue !== null && localStorage.getItem(CHAIRMAN_STORAGE_KEY) === null) {
    localStorage.setItem(CHAIRMAN_STORAGE_KEY, oldValue);
    localStorage.removeItem(OLD_CHAIRMAN_STORAGE_KEY);
  }
}

migrateChairmanStorage();

const CHAIRMAN_OPTIONS: { value: ChairmanModel; label: string; color: string }[] = [
  { value: "openai", label: "GPT-4o (OpenAI)", color: "text-green-400" },
  { value: "gemini", label: "Gemini 3 Flash", color: "text-blue-400" },
  { value: "anthropic", label: "Claude Opus 4.5", color: "text-orange-400" },
  { value: "xai", label: "Grok 4 (xAI)", color: "text-purple-400" },
];

function getStoredChairman(): ChairmanModel {
  try {
    const stored = localStorage.getItem(CHAIRMAN_STORAGE_KEY);
    if (stored && ["openai", "gemini", "anthropic", "xai"].includes(stored)) {
      return stored as ChairmanModel;
    }
  } catch {}
  return "gemini";
}

function saveChairman(chairman: ChairmanModel): void {
  localStorage.setItem(CHAIRMAN_STORAGE_KEY, chairman);
}

interface VerdictResponse {
  success: boolean;
  verdict: string;
  error?: string;
  latencyMs: number;
  chairman: string;
}

interface ModelResult {
  model: string;
  provider: string;
  code: string;
  error?: string;
  latencyMs: number;
}

interface DebugResult {
  model: string;
  provider: string;
  analysis: string;
  error?: string;
  latencyMs: number;
}

interface FlowNode {
  id: string;
  type: string;
  label: string;
  children: Array<{ targetId: string; condition?: string }>;
}

interface ParsedFlowchart {
  summary: { nodeCount: number; complexityScore: number; entryPoint: string };
  flow: FlowNode[];
}

interface ArenaResponse {
  success: boolean;
  results: ModelResult[];
  flowcharts?: Record<string, ParsedFlowchart>;
  comparison?: {
    similarityMatrix: Array<{ model1: string; model2: string; similarity: number }>;
    complexityScores: Array<{ model: string; complexity: number; nodeCount: number }>;
  };
}

interface DebugResponse {
  success: boolean;
  results: DebugResult[];
}

const MODEL_COLORS: Record<string, string> = {
  "OpenAI": "bg-green-500/20 text-green-400 border-green-500/50",
  "Gemini": "bg-blue-500/20 text-blue-400 border-blue-500/50",
  "Claude": "bg-orange-500/20 text-orange-400 border-orange-500/50",
  "Grok": "bg-purple-500/20 text-purple-400 border-purple-500/50",
};

function getAPIKeyHeaders(authToken?: string | null): Record<string, string> {
  const keys = getStoredAPIKeys();
  const headers: Record<string, string> = {};
  if (keys.openai) headers["x-openai-key"] = keys.openai;
  if (keys.gemini) headers["x-gemini-key"] = keys.gemini;
  if (keys.anthropic) headers["x-anthropic-key"] = keys.anthropic;
  if (keys.xai) headers["x-xai-key"] = keys.xai;
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  return headers;
}

export default function ModelArena() {
  const { hasHistory, login, isAuthenticated, token } = useLicense();
  const [arenaMode, setArenaMode] = useState<"code" | "debug">("code");
  const [prompt, setPrompt] = useState(
    "Write a JavaScript function called 'findDuplicates' that takes an array and returns an array of duplicate values."
  );
  const [problem, setProblem] = useState("");
  const [errorLogs, setErrorLogs] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [results, setResults] = useState<ModelResult[]>([]);
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [flowcharts, setFlowcharts] = useState<Record<string, ParsedFlowchart>>({});
  const [comparison, setComparison] = useState<ArenaResponse["comparison"]>();
  const [viewMode, setViewMode] = useState<"code" | "flowchart">("code");
  const [chairman, setChairman] = useState<ChairmanModel>(getStoredChairman);
  const [verdict, setVerdict] = useState<{ text: string; chairman: string; latencyMs: number } | null>(null);
  const [, forceUpdate] = useState({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleKeysChange = useCallback(() => {
    forceUpdate({});
  }, []);

  const handleChairmanChange = (value: ChairmanModel) => {
    setChairman(value);
    saveChairman(value);
    setVerdict(null);
  };

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const headers = getAPIKeyHeaders(token);
      const response = await apiRequest("POST", "/api/arena/generate", { prompt }, headers);
      return response.json() as Promise<ArenaResponse>;
    },
    onSuccess: (data) => {
      setResults(data.results);
      setFlowcharts(data.flowcharts || {});
      setComparison(data.comparison);
    },
  });

  const debugMutation = useMutation({
    mutationFn: async (data: { problem: string; errorLogs: string; codeSnippet: string }) => {
      const headers = getAPIKeyHeaders(token);
      const response = await apiRequest("POST", "/api/arena/debug", data, headers);
      return response.json() as Promise<DebugResponse>;
    },
    onSuccess: (data) => {
      setDebugResults(data.results);
      setVerdict(null);
    },
  });

  const verdictMutation = useMutation({
    mutationFn: async (data: { 
      mode: "code" | "debug"; 
      chairman: ChairmanModel; 
      originalPrompt: string; 
      results: Array<{ provider: string; content: string }> 
    }) => {
      const headers = getAPIKeyHeaders(token);
      const response = await apiRequest("POST", "/api/arena/verdict", data, headers);
      const result = await response.json() as VerdictResponse;
      if (!result.success) {
        throw new Error(result.error || "Failed to generate verdict");
      }
      return result;
    },
    onSuccess: (data) => {
      setVerdict({ text: data.verdict, chairman: data.chairman, latencyMs: data.latencyMs });
    },
  });

  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ["arena-sessions"],
    queryFn: async () => {
      if (!token) return [];
      const headers = { Authorization: `Bearer ${token}` };
      const response = await apiRequest("GET", "/api/arena/sessions", undefined, headers);
      const data = await response.json();
      return data.sessions as ArenaSession[];
    },
    enabled: hasHistory && isAuthenticated,
  });

  const saveSessionMutation = useMutation({
    mutationFn: async (data: { mode: string; prompt: string; results: unknown; verdict?: string; chairman?: string }) => {
      if (!token) throw new Error("Not authenticated");
      const headers = { Authorization: `Bearer ${token}` };
      const response = await apiRequest("POST", "/api/arena/sessions", data, headers);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to save session");
      }
      return result.session as ArenaSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arena-sessions"] });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/arena/sessions/${id}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to delete session");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arena-sessions"] });
    },
  });

  const handleSaveSession = () => {
    if (!hasHistory) {
      setShowUpgradeModal(true);
      return;
    }
    
    const sessionResults = arenaMode === "code" 
      ? results.map(r => ({ provider: r.provider, model: r.model, code: r.code, error: r.error, latencyMs: r.latencyMs }))
      : debugResults.map(r => ({ provider: r.provider, model: r.model, analysis: r.analysis, error: r.error, latencyMs: r.latencyMs }));
    
    saveSessionMutation.mutate({
      mode: arenaMode,
      prompt: arenaMode === "code" ? prompt : problem,
      results: sessionResults,
      verdict: verdict?.text,
      chairman: verdict?.chairman
    });
  };

  const handleLoadSession = (session: ArenaSession) => {
    setArenaMode(session.mode as "code" | "debug");
    setFlowcharts({});
    setComparison(undefined);
    
    if (session.mode === "code") {
      setPrompt(session.prompt);
      const savedResults = session.results as ModelResult[];
      setResults(savedResults || []);
      setDebugResults([]);
    } else {
      setProblem(session.prompt);
      const savedResults = session.results as DebugResult[];
      setDebugResults(savedResults || []);
      setResults([]);
    }
    if (session.verdict && session.chairman) {
      setVerdict({ text: session.verdict, chairman: session.chairman, latencyMs: 0 });
    } else {
      setVerdict(null);
    }
  };

  const canSave = (arenaMode === "code" && results.length > 0) || (arenaMode === "debug" && debugResults.length > 0);

  const handleGenerate = () => {
    if (prompt.trim()) {
      setVerdict(null);
      generateMutation.mutate(prompt);
    }
  };

  const handleDebug = () => {
    if (problem.trim()) {
      setVerdict(null);
      debugMutation.mutate({ problem, errorLogs, codeSnippet });
    }
  };

  const handleGetVerdict = () => {
    if (arenaMode === "code" && results.length > 0) {
      const validResults = results.filter(r => r.code && !r.error);
      if (validResults.length > 0) {
        verdictMutation.mutate({
          mode: "code",
          chairman,
          originalPrompt: prompt,
          results: validResults.map(r => ({ provider: r.provider, content: r.code }))
        });
      }
    } else if (arenaMode === "debug" && debugResults.length > 0) {
      const validResults = debugResults.filter(r => r.analysis && !r.error);
      if (validResults.length > 0) {
        verdictMutation.mutate({
          mode: "debug",
          chairman,
          originalPrompt: problem,
          results: validResults.map(r => ({ provider: r.provider, content: r.analysis }))
        });
      }
    }
  };

  const handleReset = () => {
    setResults([]);
    setDebugResults([]);
    setFlowcharts({});
    setComparison(undefined);
    setVerdict(null);
    setPrompt("");
    setProblem("");
    setErrorLogs("");
    setCodeSnippet("");
  };

  const handleModeChange = (mode: string) => {
    setArenaMode(mode as "code" | "debug");
    handleReset();
  };

  const isPending = generateMutation.isPending || debugMutation.isPending || verdictMutation.isPending;
  
  const hasResults = arenaMode === "code" ? results.length > 0 : debugResults.length > 0;
  const validResultCount = arenaMode === "code" 
    ? results.filter(r => r.code && !r.error).length 
    : debugResults.filter(r => r.analysis && !r.error).length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="bg-[#161b22] border-[#30363d]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Lock className="w-5 h-5 text-yellow-500" />
              Pro Feature Required
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Saving arena sessions requires the History Database feature, available with a Pro subscription.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-300 mb-4">
              Upgrade to Pro to unlock:
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                Save and load arena sessions
              </li>
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                GitHub sync for flowcharts
              </li>
              <li className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                Rabbit Hole Rescue assistance
              </li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="border-[#30363d]">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowUpgradeModal(false);
                window.open('https://voyai.org/upgrade?app=logicart', '_blank');
              }}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workbench
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-title">
              <Code2 className="w-6 h-6 text-blue-400" />
              Model Arena
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="border-[#30363d]" data-testid="button-history">
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-[#161b22] border-[#30363d]">
                <SheetHeader>
                  <SheetTitle className="text-white">Session History</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  {sessionsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : sessionsQuery.data?.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No saved sessions yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessionsQuery.data?.map((session) => (
                        <Card 
                          key={session.id} 
                          className="bg-[#0d1117] border-[#30363d] cursor-pointer hover:border-blue-500/50 transition-colors"
                          onClick={() => handleLoadSession(session)}
                          data-testid={`card-session-${session.id}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <Badge className={session.mode === "code" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}>
                                  {session.mode}
                                </Badge>
                                <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                                  {session.prompt}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(session.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-gray-500 hover:text-red-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSessionMutation.mutate(session.id);
                                }}
                                data-testid={`button-delete-${session.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
            {canSave && (
              <Button 
                onClick={handleSaveSession}
                disabled={saveSessionMutation.isPending}
                variant="outline" 
                size="sm" 
                className="border-[#30363d]"
                data-testid="button-save-session"
              >
                {saveSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            )}
            <SettingsModal onKeysChange={handleKeysChange} />
            <Badge variant="outline" className="text-xs">
              Compare 4 AI Models
            </Badge>
          </div>
        </div>

        <Tabs value={arenaMode} onValueChange={handleModeChange} className="mb-6">
          <TabsList className="bg-[#161b22] border border-[#30363d]">
            <TabsTrigger 
              value="code" 
              className="data-[state=active]:bg-blue-600 gap-2"
              data-testid="tab-mode-code"
            >
              <Sparkles className="w-4 h-4" />
              Code Generation
            </TabsTrigger>
            <TabsTrigger 
              value="debug" 
              className="data-[state=active]:bg-orange-600 gap-2"
              data-testid="tab-mode-debug"
            >
              <Bug className="w-4 h-4" />
              Debug Advisor
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {arenaMode === "code" ? (
          <Card className="bg-[#161b22] border-[#30363d] mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Coding Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400">Quick examples:</span>
                <Select
                  onValueChange={(value) => setPrompt(value)}
                >
                  <SelectTrigger className="w-[280px] h-8 bg-[#0d1117] border-[#30363d] text-xs" data-testid="select-example">
                    <SelectValue placeholder="Choose an example..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b22] border-[#30363d]">
                    <SelectItem value="Write a JavaScript function called 'findDuplicates' that takes an array and returns an array of duplicate values.">
                      Find Duplicates
                    </SelectItem>
                    <SelectItem value="Create a debounce function in JavaScript that delays invoking a function until after a specified wait time.">
                      Debounce Function
                    </SelectItem>
                    <SelectItem value="Write a binary search function that finds an element in a sorted array and returns its index.">
                      Binary Search
                    </SelectItem>
                    <SelectItem value="Implement a simple LRU (Least Recently Used) cache in JavaScript with get and put methods.">
                      LRU Cache
                    </SelectItem>
                    <SelectItem value="Create a function that validates an email address using regular expressions.">
                      Email Validator
                    </SelectItem>
                    <SelectItem value="Write a recursive function to calculate the Fibonacci sequence with memoization for optimization.">
                      Fibonacci with Memo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the code you want each AI model to generate..."
                className="min-h-[120px] bg-[#0d1117] border-[#30363d] text-white resize-none"
                data-testid="input-prompt"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={isPending || !prompt.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-generate"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating from 4 models...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate & Compare
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-[#30363d]"
                  data-testid="button-reset"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-[#161b22] border-[#30363d] mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Bug className="w-5 h-5 text-orange-400" />
                Describe Your Problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Problem Description *</label>
                <Textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="Describe the issue you're facing. What are you trying to do? What's happening instead?"
                  className="min-h-[100px] bg-[#0d1117] border-[#30363d] text-white resize-none"
                  data-testid="input-problem"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Error Logs (optional)</label>
                <Textarea
                  value={errorLogs}
                  onChange={(e) => setErrorLogs(e.target.value)}
                  placeholder="Paste any error messages or stack traces here..."
                  className="min-h-[80px] bg-[#0d1117] border-[#30363d] text-white font-mono text-sm resize-none"
                  data-testid="input-error-logs"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Relevant Code (optional)</label>
                <Textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Paste the relevant code snippet..."
                  className="min-h-[80px] bg-[#0d1117] border-[#30363d] text-white font-mono text-sm resize-none"
                  data-testid="input-code-snippet"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDebug}
                  disabled={isPending || !problem.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="button-debug"
                >
                  {debugMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting advice from 4 models...
                    </>
                  ) : (
                    <>
                      <Bug className="w-4 h-4 mr-2" />
                      Get Debug Advice
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-[#30363d]"
                  data-testid="button-reset-debug"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {arenaMode === "code" && results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "code" | "flowchart")}>
                <TabsList className="bg-[#161b22]">
                  <TabsTrigger value="code" className="data-[state=active]:bg-blue-600" data-testid="tab-code">
                    <FileCode className="w-4 h-4 mr-2" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="flowchart" className="data-[state=active]:bg-blue-600" data-testid="tab-flowchart">
                    <GitBranch className="w-4 h-4 mr-2" />
                    Flowcharts
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {results.map((result) => (
                <Card
                  key={result.provider}
                  className="bg-[#161b22] border-[#30363d]"
                  data-testid={`card-result-${result.provider.toLowerCase()}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <Badge className={MODEL_COLORS[result.provider]}>
                          {result.provider}
                        </Badge>
                        <span className="text-sm text-gray-400">{result.model}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const flowchart = flowcharts[result.provider];
                          const score = flowchart?.summary?.complexityScore ?? 
                            (flowchart?.flow ? calculateComplexityFromArenaFlow(flowchart.flow) : undefined);
                          return score !== undefined && <ComplexityScoreBadge score={score} />;
                        })()}
                        <Badge variant="outline" className="text-xs">
                          {result.latencyMs}ms
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.error ? (
                      <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded border border-red-500/30">
                        {result.error}
                      </div>
                    ) : viewMode === "code" ? (
                      <pre className="text-sm text-gray-300 bg-[#0d1117] p-3 rounded overflow-x-auto max-h-[300px] overflow-y-auto font-mono">
                        {result.code}
                      </pre>
                    ) : (
                      <div className="h-[300px] bg-[#0d1117] rounded">
                        <MiniFlowchart 
                          flowchart={flowcharts[result.provider] || null} 
                          provider={result.provider}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {comparison && (
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Comparison Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Complexity Scores</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {comparison.complexityScores.map((item) => (
                        <div
                          key={item.model}
                          className="bg-[#0d1117] p-3 rounded border border-[#30363d]"
                          data-testid={`complexity-${item.model.toLowerCase()}`}
                        >
                          <div className="text-sm text-gray-400">{item.model}</div>
                          <div className="text-xl font-bold text-white">{item.complexity}</div>
                          <div className="text-xs text-gray-500">{item.nodeCount} nodes</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Similarity Matrix</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {comparison.similarityMatrix.map((pair, i) => (
                        <div
                          key={i}
                          className="bg-[#0d1117] p-2 rounded border border-[#30363d] text-sm"
                        >
                          <span className="text-gray-400">{pair.model1}</span>
                          <span className="text-gray-600 mx-1">vs</span>
                          <span className="text-gray-400">{pair.model2}</span>
                          <span className="float-right text-blue-400 font-mono">
                            {Math.round(pair.similarity * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-[#161b22] border-[#30363d] border-2 border-amber-500/30 mt-6">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Chairman's Verdict
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Select Chairman:</label>
                    <Select value={chairman} onValueChange={(v) => handleChairmanChange(v as ChairmanModel)}>
                      <SelectTrigger className="w-[200px] bg-[#0d1117] border-[#30363d]" data-testid="select-chairman">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161b22] border-[#30363d]">
                        {CHAIRMAN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className={opt.color}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleGetVerdict}
                    disabled={verdictMutation.isPending || validResultCount < 2}
                    className="bg-amber-600 hover:bg-amber-700"
                    data-testid="button-get-verdict"
                  >
                    {verdictMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deliberating...
                      </>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4 mr-2" />
                        Get Verdict
                      </>
                    )}
                  </Button>
                </div>

                {validResultCount < 2 && (
                  <div className="text-sm text-gray-500">
                    Need at least 2 valid results to generate a verdict.
                  </div>
                )}

                {verdict && (
                  <div className="bg-[#0d1117] border border-amber-500/30 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                        Verdict by {CHAIRMAN_OPTIONS.find(o => o.value === verdict.chairman)?.label || verdict.chairman}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {verdict.latencyMs}ms
                      </Badge>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed" data-testid="text-verdict">
                        {verdict.text}
                      </div>
                    </div>
                  </div>
                )}

                {verdictMutation.isError && (
                  <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded border border-red-500/30">
                    {verdictMutation.error?.message || "Failed to generate verdict"}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {arenaMode === "debug" && debugResults.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {debugResults.map((result) => (
                <Card
                  key={result.provider}
                  className="bg-[#161b22] border-[#30363d]"
                  data-testid={`card-debug-${result.provider.toLowerCase()}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-white flex items-center gap-2">
                        <Badge className={MODEL_COLORS[result.provider]}>
                          {result.provider}
                        </Badge>
                        <span className="text-sm text-gray-400">{result.model}</span>
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {result.latencyMs}ms
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.error ? (
                      <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded border border-red-500/30">
                        {result.error}
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none max-h-[400px] overflow-y-auto">
                        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {result.analysis}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-[#161b22] border-[#30363d] border-2 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Chairman's Verdict
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-400">Select Chairman:</label>
                    <Select value={chairman} onValueChange={(v) => handleChairmanChange(v as ChairmanModel)}>
                      <SelectTrigger className="w-[200px] bg-[#0d1117] border-[#30363d]" data-testid="select-chairman-debug">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161b22] border-[#30363d]">
                        {CHAIRMAN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className={opt.color}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleGetVerdict}
                    disabled={verdictMutation.isPending || validResultCount < 2}
                    className="bg-amber-600 hover:bg-amber-700"
                    data-testid="button-get-verdict-debug"
                  >
                    {verdictMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deliberating...
                      </>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4 mr-2" />
                        Get Verdict
                      </>
                    )}
                  </Button>
                </div>

                {validResultCount < 2 && (
                  <div className="text-sm text-gray-500">
                    Need at least 2 valid results to generate a verdict.
                  </div>
                )}

                {verdict && (
                  <div className="bg-[#0d1117] border border-amber-500/30 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
                        Verdict by {CHAIRMAN_OPTIONS.find(o => o.value === verdict.chairman)?.label || verdict.chairman}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {verdict.latencyMs}ms
                      </Badge>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed" data-testid="text-verdict-debug">
                        {verdict.text}
                      </div>
                    </div>
                  </div>
                )}

                {verdictMutation.isError && (
                  <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded border border-red-500/30">
                    {verdictMutation.error?.message || "Failed to generate verdict"}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {(generateMutation.isError || debugMutation.isError) && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="text-red-400">
                Error: {generateMutation.error?.message || debugMutation.error?.message || "Failed to process request"}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
